import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { handle, privacy_settings } = body;

    // Validate handle
    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: "Handle is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedHandle = handle.trim().toLowerCase();

    // Validate handle length (min 3 chars per schema)
    if (trimmedHandle.length < 3) {
      return NextResponse.json(
        { error: "Handle must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Validate handle format (alphanumeric and hyphens only)
    const handleRegex = /^[a-z0-9-]+$/;
    if (!handleRegex.test(trimmedHandle)) {
      return NextResponse.json(
        {
          error:
            "Handle can only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Validate privacy settings
    const validatedPrivacySettings = {
      show_phone:
        typeof privacy_settings?.show_phone === "boolean"
          ? privacy_settings.show_phone
          : false,
      show_address:
        typeof privacy_settings?.show_address === "boolean"
          ? privacy_settings.show_address
          : false,
    };

    // Check if handle is already taken
    const { data: existingHandle, error: handleCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", trimmedHandle)
      .single();

    if (handleCheckError && handleCheckError.code !== "PGRST116") {
      // PGRST116 = no rows returned (handle is available)
      console.error("Error checking handle:", handleCheckError);
      return NextResponse.json(
        { error: "Failed to validate handle" },
        { status: 500 }
      );
    }

    if (existingHandle && existingHandle.id !== user.id) {
      return NextResponse.json(
        { error: "This handle is already taken" },
        { status: 409 }
      );
    }

    // Update profile with handle and privacy settings
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        handle: trimmedHandle,
        privacy_settings: validatedPrivacySettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);

      // Handle unique constraint violation
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "This handle is already taken" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
