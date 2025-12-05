import { getParseStatus, normalizeResumeData } from "@/lib/replicate";
import { createClient } from "@/lib/supabase/server";
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from "@/lib/utils/security-headers";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse(
        "You must be logged in to check resume status",
        ERROR_CODES.UNAUTHORIZED,
        401,
      );
    }

    // 2. Get resume_id from query params
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resume_id");

    if (!resumeId) {
      return createErrorResponse("resume_id parameter is required", ERROR_CODES.BAD_REQUEST, 400);
    }

    // 3. Fetch resume from database (include file_hash for fan-out)
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("id, user_id, status, replicate_job_id, error_message, retry_count, file_hash")
      .eq("id", resumeId)
      .single();

    if (fetchError || !resume) {
      return createErrorResponse("Resume not found", ERROR_CODES.NOT_FOUND, 404);
    }

    // 4. Verify ownership
    if (resume.user_id !== user.id) {
      return createErrorResponse(
        "You do not have permission to access this resume",
        ERROR_CODES.FORBIDDEN,
        403,
      );
    }

    // 5. If not processing, return current status
    if (resume.status !== "processing") {
      return createSuccessResponse({
        status: resume.status,
        progress_pct: resume.status === "completed" ? 100 : 0,
        error: resume.error_message,
        can_retry: resume.status === "failed" && resume.retry_count < 2,
      });
    }

    // 6. Check if we have a replicate job ID
    if (!resume.replicate_job_id) {
      return createSuccessResponse({
        status: "processing",
        progress_pct: 10,
        error: null,
        can_retry: false,
      });
    }

    // 7. Poll Replicate for status
    let prediction;
    try {
      prediction = await getParseStatus(resume.replicate_job_id);
    } catch (error) {
      console.error("Replicate API error:", error);
      // Return processing status on network errors - client will retry
      return createSuccessResponse({
        status: "processing",
        progress_pct: 30,
        error: null,
        can_retry: false,
      });
    }

    // 8. Handle Replicate status
    if (prediction.status === "succeeded") {
      try {
        // IDEMPOTENCY: Re-check status to handle race condition with webhook
        const { data: currentResume } = await supabase
          .from("resumes")
          .select("status")
          .eq("id", resumeId)
          .single();

        if (currentResume?.status === "completed" || currentResume?.status === "failed") {
          // Already processed (likely by webhook), return current status
          return createSuccessResponse({
            status: currentResume.status,
            progress_pct: currentResume.status === "completed" ? 100 : 0,
            error: null,
            can_retry: false,
          });
        }

        // Extract and normalize data
        if (!prediction.output?.extraction_schema_json) {
          throw new Error("Missing extraction_schema_json in Replicate output");
        }

        const normalizedContent = normalizeResumeData(prediction.output.extraction_schema_json);
        const contentAsJson = JSON.parse(JSON.stringify(normalizedContent));

        // Upsert to site_data (ON CONFLICT user_id DO UPDATE)
        // Note: theme_id will be set by wizard completion, not here
        const { error: upsertError } = await supabase.from("site_data").upsert(
          {
            user_id: user.id,
            resume_id: resumeId,
            content: contentAsJson,
            last_published_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (upsertError) {
          console.error("Failed to save resume data to site_data:", upsertError);
          throw new Error(`Database save failed: ${upsertError.message}`);
        }

        // Update resume status to completed WITH parsed_content for cache lookup
        // Use optimistic locking (only update if still processing) to prevent race conditions
        const { error: updateError } = await supabase
          .from("resumes")
          .update({
            status: "completed",
            parsed_at: new Date().toISOString(),
            parsed_content: contentAsJson,
          })
          .eq("id", resumeId)
          .eq("status", "processing");

        if (updateError) {
          console.error("Failed to update resume status to completed:", updateError);
          // Don't throw - data is already saved, just log the issue
        }

        // Fan out to all resumes waiting for this file hash (same pattern as webhook)
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
                `Fan-out (polling): ${failed.length}/${waitingResumes.length} updates failed for hash ${resume.file_hash}`,
              );
            } else {
              console.log(
                `Fan-out (polling): Updated ${waitingResumes.length} waiting resumes for hash ${resume.file_hash}`,
              );
            }
          }
        }

        return createSuccessResponse({
          status: "completed",
          progress_pct: 100,
          error: null,
          can_retry: false,
        });
      } catch (error) {
        console.error("Resume normalization error:", error);

        const errorMessage =
          error instanceof Error
            ? `AI parsing validation failed: ${error.message}`
            : "Failed to process resume data";

        // Mark resume as failed
        await supabase
          .from("resumes")
          .update({
            status: "failed",
            error_message: errorMessage,
          })
          .eq("id", resumeId);

        // Return failed status (not error - allows UI to show retry)
        return createSuccessResponse({
          status: "failed",
          progress_pct: 0,
          error: errorMessage,
          can_retry: resume.retry_count < 2,
        });
      }
    } else if (
      prediction.status === "failed" ||
      prediction.status === "canceled" ||
      prediction.status === "aborted"
    ) {
      // Mark as failed
      const errorMessage = prediction.error || "AI parsing failed";

      const { error: updateError } = await supabase
        .from("resumes")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", resumeId);

      if (updateError) {
        console.error("Failed to update resume status:", updateError);
      }

      return createSuccessResponse({
        status: "failed",
        progress_pct: 0,
        error: errorMessage,
        can_retry: resume.retry_count < 2,
      });
    } else {
      // Still processing or starting
      const progressMap: Record<string, number> = {
        starting: 20,
        processing: 50,
      };

      return createSuccessResponse({
        status: "processing",
        progress_pct: progressMap[prediction.status] || 30,
        error: null,
        can_retry: false,
      });
    }
  } catch (error) {
    console.error("Error checking resume status:", error);
    return createErrorResponse(
      "An unexpected error occurred while checking status",
      ERROR_CODES.INTERNAL_ERROR,
      500,
    );
  }
}
