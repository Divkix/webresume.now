import { parseWithAi } from "./ai-parser";
import { extractPdfText } from "./pdf-extract";
import type { ResumeSchema } from "./schema";
import { transformAiOutput, transformAiResponse } from "./transform";

export interface ParseResumeResult {
  success: boolean;
  parsedContent: string;
  error?: string;
}

/**
 * Parse a PDF resume using AI
 *
 * Pipeline:
 * 1. Extract text from PDF using unpdf
 * 2. Parse text with AI using Vercel AI SDK (structured output)
 * 3. Transform and validate the AI response
 * 4. Return JSON string of parsed content
 */
export async function parseResumeWithAi(
  pdfBuffer: Uint8Array,
  env: Partial<CloudflareEnv>,
): Promise<ParseResumeResult> {
  try {
    // Step 1: Extract text from PDF
    // Convert Uint8Array to ArrayBuffer properly
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength,
    ) as ArrayBuffer;

    const extractResult = await extractPdfText(arrayBuffer);

    if (!extractResult.success || !extractResult.text) {
      return {
        success: false,
        parsedContent: "",
        error: extractResult.error || "PDF extraction failed",
      };
    }

    const resumeText = extractResult.text.slice(0, 60000);

    if (!resumeText.trim()) {
      return {
        success: false,
        parsedContent: "",
        error: "Extracted resume text is empty",
      };
    }

    // Step 2: Parse with AI
    const parseResult = await parseWithAi(resumeText, env);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        parsedContent: "",
        error: parseResult.error || "AI parsing failed",
      };
    }

    // Step 3: Transform - lenient validation with XSS protection
    const transformedData = transformAiResponse(parseResult.data);

    // Step 4: Final cleanup
    const finalData = transformAiOutput(transformedData as ResumeSchema);

    return {
      success: true,
      parsedContent: JSON.stringify(finalData),
    };
  } catch (error) {
    return {
      success: false,
      parsedContent: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export { createAiProvider, parseWithAi } from "./ai-parser";
export { extractPdfText } from "./pdf-extract";
// Re-export useful types and functions
export type { ResumeSchema } from "./schema";
export { sanitizeServiceError, transformAiOutput, transformAiResponse } from "./transform";
