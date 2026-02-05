import { parseWithAi } from "./ai-parser";
import { extractPdfText } from "./pdf-extract";
import { resumeSchema } from "./schema";
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
    // Create a new ArrayBuffer with only the bytes from pdfBuffer
    // This is necessary when Uint8Array is a view into a larger buffer
    const arrayBuffer = new Uint8Array(pdfBuffer).buffer;

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

    // Step 4: Validate against schema
    const validationResult = resumeSchema.safeParse(transformedData);
    if (!validationResult.success) {
      return {
        success: false,
        parsedContent: "",
        error: "AI response failed schema validation",
      };
    }

    // Step 5: Final cleanup
    const finalData = transformAiOutput(validationResult.data);

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
