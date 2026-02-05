import { extractText, getDocumentProxy } from "unpdf";

/**
 * Check if buffer starts with PDF magic bytes (%PDF-)
 */
export function isValidPdf(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer.slice(0, 5));
  const magic = String.fromCharCode(...header);
  return magic.startsWith("%PDF-");
}

export interface PdfExtractResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extract text from PDF buffer using unpdf
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<PdfExtractResult> {
  if (!isValidPdf(buffer)) {
    return { success: false, text: "", pageCount: 0, error: "Invalid PDF format" };
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    return { success: true, text: text ?? "", pageCount: totalPages };
  } catch (error) {
    return {
      success: false,
      text: "",
      pageCount: 0,
      error: error instanceof Error ? error.message : "PDF extraction failed",
    };
  }
}
