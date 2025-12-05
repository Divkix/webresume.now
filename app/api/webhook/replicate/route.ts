import { revalidateTag } from "next/cache";
import { getResumeCacheTag } from "@/lib/data/resume";
import { normalizeResumeData } from "@/lib/replicate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { verifyReplicateWebhook } from "@/lib/utils/webhook-verification";

/**
 * Convert technical validation errors to user-friendly messages
 */
function makeUserFriendlyError(rawMessage: string): string {
  if (rawMessage.includes("Invalid email")) {
    return "We couldn't extract a valid email from your resume. Please ensure your email address is complete and clearly visible.";
  }
  if (rawMessage.includes("Invalid LinkedIn URL")) {
    return "The LinkedIn URL in your resume couldn't be parsed correctly. Please ensure it's a complete URL.";
  }
  if (rawMessage.includes("Invalid GitHub URL")) {
    return "The GitHub URL in your resume couldn't be parsed correctly. Please ensure it's a complete URL.";
  }
  if (rawMessage.includes("is required")) {
    const match = rawMessage.match(/Invalid resume data structure: (.+) is required/);
    if (match) {
      return `We couldn't find the ${match[1].toLowerCase()} in your resume. Please ensure it's clearly visible.`;
    }
  }
  // Default: strip technical prefix and return
  return rawMessage.replace("Invalid resume data structure: ", "Parsing issue: ");
}

export async function POST(request: Request) {
  try {
    // 1. Verify webhook signature
    const { isValid, body } = await verifyReplicateWebhook(request);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(body);
    const { id: replicateJobId, status, output, error } = payload;

    console.log(`Webhook received: job=${replicateJobId}, status=${status}`);

    // 3. Only process completed events
    if (status !== "succeeded" && status !== "failed" && status !== "canceled") {
      return new Response("OK", { status: 200 });
    }

    // 4. Find resume by replicate_job_id (use admin client to bypass RLS)
    const supabase = createAdminClient();
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("id, user_id, status, file_hash")
      .eq("replicate_job_id", replicateJobId)
      .single();

    if (fetchError || !resume) {
      console.error("Resume not found for job:", replicateJobId);
      return new Response("Resume not found", { status: 404 });
    }

    // 5. Skip if already processed (idempotency)
    if (resume.status === "completed" || resume.status === "failed") {
      console.log("Resume already processed, skipping");
      return new Response("OK", { status: 200 });
    }

    // 6. Handle success
    if (status === "succeeded") {
      if (!output?.extraction_schema_json) {
        console.error("Missing extraction_schema_json in output");
        await supabase
          .from("resumes")
          .update({
            status: "failed",
            error_message: "Missing parsed data in Replicate output",
          })
          .eq("id", resume.id);
        return new Response("OK", { status: 200 });
      }

      // Normalize and validate parsed data
      let normalizedContent;
      try {
        normalizedContent = normalizeResumeData(output.extraction_schema_json);
      } catch (validationError) {
        const rawMessage =
          validationError instanceof Error
            ? validationError.message
            : "Failed to parse resume data";

        // Make error message user-friendly
        const userMessage = makeUserFriendlyError(rawMessage);

        console.error("Validation failed:", rawMessage);

        await supabase
          .from("resumes")
          .update({
            status: "failed",
            error_message: userMessage,
          })
          .eq("id", resume.id);

        return new Response("OK", { status: 200 });
      }

      // Cast to Json for Supabase compatibility
      const contentAsJson = normalizedContent as unknown as Json;

      // Save to site_data
      const { error: upsertError } = await supabase.from("site_data").upsert(
        {
          user_id: resume.user_id,
          resume_id: resume.id,
          content: contentAsJson,
          last_published_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (upsertError) {
        console.error("Failed to save site_data:", upsertError);
        await supabase
          .from("resumes")
          .update({
            status: "failed",
            error_message: `Database error: ${upsertError.message}`,
          })
          .eq("id", resume.id);
        return new Response("OK", { status: 200 });
      }

      // Update resume status and store parsed content for caching
      await supabase
        .from("resumes")
        .update({
          status: "completed",
          parsed_at: new Date().toISOString(),
          parsed_content: contentAsJson, // Store for file hash cache
        })
        .eq("id", resume.id);

      // Fan out to all resumes waiting for this file hash
      if (resume.file_hash) {
        const { data: waitingResumes } = await supabase
          .from("resumes")
          .select("id, user_id")
          .eq("file_hash", resume.file_hash)
          .eq("status", "waiting_for_cache");

        if (waitingResumes?.length) {
          const updatePromises = waitingResumes.map(async (waiting) => {
            const { error: resumeError } = await supabase
              .from("resumes")
              .update({
                status: "completed",
                parsed_at: new Date().toISOString(),
                parsed_content: contentAsJson,
              })
              .eq("id", waiting.id);

            if (resumeError) {
              console.error(`Failed to update waiting resume ${waiting.id}:`, resumeError);
              return { success: false, id: waiting.id, error: resumeError };
            }

            const { error: siteDataError } = await supabase.from("site_data").upsert(
              {
                user_id: waiting.user_id,
                resume_id: waiting.id,
                content: contentAsJson,
                last_published_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );

            if (siteDataError) {
              console.error(
                `Failed to upsert site_data for waiting resume ${waiting.id}:`,
                siteDataError,
              );
              return { success: false, id: waiting.id, error: siteDataError };
            }

            return { success: true, id: waiting.id };
          });

          const results = await Promise.allSettled(updatePromises);
          const failed = results.filter(
            (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success),
          );
          if (failed.length > 0) {
            console.error(
              `Fan-out: ${failed.length}/${waitingResumes.length} updates failed for hash ${resume.file_hash}`,
            );
          } else {
            console.log(
              `Fan-out: Updated ${waitingResumes.length} waiting resumes for hash ${resume.file_hash}`,
            );
          }
        }
      }

      // Invalidate cache for public resume page
      const { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", resume.user_id)
        .single();

      if (profile?.handle) {
        revalidateTag(getResumeCacheTag(profile.handle));
      }

      console.log("Resume processing completed successfully");
    }

    // 7. Handle failure
    else if (status === "failed" || status === "canceled") {
      await supabase
        .from("resumes")
        .update({
          status: "failed",
          error_message: error || "AI parsing failed",
        })
        .eq("id", resume.id);

      console.log("Resume processing failed:", error);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
