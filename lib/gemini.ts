/**
 * Response types for utility workers
 */
interface PdfExtractResponse {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

interface AiParseResponse {
  success: boolean;
  data: unknown;
  error?: string;
}

type ResumeContact = {
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
};

type ResumeExperience = {
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  description: string;
  highlights?: string[];
};

type ResumeEducation = {
  degree: string;
  institution?: string;
  location?: string;
  graduation_date?: string;
  gpa?: string;
};

type ResumeSkill = {
  category: string;
  items: string[];
};

type ResumeCertification = {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
};

type ResumeProject = {
  title: string;
  description: string;
  year?: string;
  technologies?: string[];
  url?: string;
};

type ResumeSchema = {
  full_name: string;
  headline: string;
  summary: string;
  contact: ResumeContact;
  experience: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: ResumeSkill[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
};

const RESUME_EXTRACTION_SCHEMA = {
  type: "object",
  required: ["full_name", "headline", "summary", "contact", "experience"],
  properties: {
    full_name: {
      type: "string",
      description: "Full name of the person",
    },
    headline: {
      type: "string",
      description: "A concise 10-word professional headline/title",
      maxLength: 100,
    },
    summary: {
      type: "string",
      description: "Professional summary or objective statement",
      maxLength: 500,
    },
    contact: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        location: {
          type: "string",
          description: "City, State format preferred",
        },
        linkedin: {
          type: "string",
          description:
            "Full LinkedIn URL. Must start with https://linkedin.com/in/ or https://www.linkedin.com/in/",
        },
        github: {
          type: "string",
          description: "Full GitHub URL. Must start with https://github.com/",
        },
        website: {
          type: "string",
          description: "Full website URL. Must start with https:// or http://",
        },
      },
    },
    experience: {
      type: "array",
      description: "Work experience in reverse chronological order",
      items: {
        type: "object",
        required: ["title", "company", "start_date", "description"],
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          start_date: {
            type: "string",
            description: "Format: YYYY-MM or Month YYYY",
          },
          end_date: {
            type: "string",
            description: "Format: YYYY-MM or Month YYYY. Omit for current role.",
          },
          description: { type: "string" },
          highlights: {
            type: "array",
            items: { type: "string" },
            description: "Key achievements or responsibilities",
          },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        required: ["degree", "institution"],
        properties: {
          degree: { type: "string" },
          institution: {
            type: "string",
            description: "University or school name. Always include this field.",
          },
          location: { type: "string" },
          graduation_date: { type: "string" },
          gpa: { type: "string" },
        },
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        required: ["category", "items"],
        properties: {
          category: {
            type: "string",
            description: "Skill category (e.g., Languages, Frameworks)",
          },
          items: {
            type: "array",
            items: { type: "string" },
            description: "List of skills in this category. Must have at least one item.",
          },
        },
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "issuer"],
        properties: {
          name: { type: "string" },
          issuer: {
            type: "string",
            description: "Organization that issued the certification. Always include this field.",
          },
          date: { type: "string" },
          url: {
            type: "string",
            description: "Certification URL. Must start with https:// or http://",
          },
        },
      },
    },
    projects: {
      type: "array",
      description:
        "Personal projects, side work, portfolio pieces, or notable work mentioned in the resume",
      items: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: {
            type: "string",
            description: "Project name or title",
          },
          description: {
            type: "string",
            maxLength: 200,
            description: "Brief description of the project and its impact",
          },
          year: {
            type: "string",
            description: "Year completed or date range",
          },
          technologies: {
            type: "array",
            items: { type: "string" },
            description: "Technologies, frameworks, or tools used",
          },
          url: {
            type: "string",
            description: "Project URL or demo link. Must start with https:// or http://",
          },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL available information from the resume into the JSON schema.

EXTRACTION RULES:
1. Be thorough - extract every piece of information, even for optional fields
2. Dates: Use YYYY-MM format (e.g., 2023-08 for August 2023)
3. URLs: Include full URLs with https:// prefix
4. Locations: Use "City, State" format when possible

SECTION HINTS:
- certifications: Look for Certifications, Licenses, Courses, Awards, Achievements, Honors, Competitions
- projects: Extract technologies/tools mentioned in project descriptions into the technologies array
- education: Always include graduation_date (expected or completed)
- skills: Group into logical categories (e.g., Programming Languages, Frameworks, Tools)

IMPORTANT:
- Do NOT omit optional sections if data exists in the resume
- If unsure about a field, make a best-effort extraction rather than omitting
- Only use empty arrays for truly absent sections
- Return ONLY valid JSON matching the schema`;

/**
 * Extract text from PDF using pdf-text-worker
 */
async function extractPdfText(
  pdfBuffer: Uint8Array,
  env: Partial<CloudflareEnv>,
): Promise<PdfExtractResponse> {
  const worker = env.PDF_TEXT_WORKER;
  if (!worker) {
    return { success: false, text: "", pageCount: 0, error: "PDF worker not available" };
  }

  // Convert Uint8Array to a standard ArrayBuffer to satisfy BodyInit type
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength,
  ) as ArrayBuffer;

  const response = await worker.fetch("https://internal/extract", {
    method: "POST",
    body: arrayBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, text: "", pageCount: 0, error };
  }

  return response.json() as Promise<PdfExtractResponse>;
}

const DEFAULT_AI_MODEL = "google/gemini-2.5-flash-lite";

/**
 * Parse text with AI using ai-parser-worker
 */
async function parseWithAi(text: string, env: Partial<CloudflareEnv>): Promise<AiParseResponse> {
  const worker = env.AI_PARSER_WORKER;
  if (!worker) {
    return { success: false, data: null, error: "AI parser not available" };
  }

  const model = env.AI_MODEL || DEFAULT_AI_MODEL;

  const response = await worker.fetch("https://internal/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      schema: RESUME_EXTRACTION_SCHEMA,
      systemPrompt: SYSTEM_PROMPT,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, data: null, error };
  }

  return response.json() as Promise<AiParseResponse>;
}

/**
 * Normalize URL - add protocol if missing, return empty string if invalid
 */
function normalizeUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  // Already has valid protocol
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
    return trimmed;
  }
  // Block dangerous protocols
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return "";
  }
  // Add https:// to URLs without protocol
  return `https://${trimmed}`;
}

/**
 * Normalize string - convert null/undefined to empty string, trim
 */
function normalizeString(value: unknown, defaultVal = ""): string {
  if (value === null || value === undefined) return defaultVal;
  if (typeof value !== "string") return String(value);
  return value.trim() || defaultVal;
}

/**
 * Basic transforms for AI output - no strict validation
 * Lenient parsing that always produces usable output.
 * XSS sanitization + URL normalization + null handling
 */
function transformAiResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    return {
      full_name: "Unknown",
      headline: "Professional",
      summary: "",
      contact: { email: "" },
      experience: [],
    };
  }

  const data = raw as Record<string, unknown>;

  // Top-level fields - use empty strings as defaults (lenient)
  data.full_name = normalizeString(data.full_name, "Unknown");
  data.headline = normalizeString(data.headline, "Professional");
  data.summary = normalizeString(data.summary);

  // Contact - normalize URLs, use empty strings for missing
  if (data.contact && typeof data.contact === "object") {
    const c = data.contact as Record<string, unknown>;
    c.email = normalizeString(c.email);
    c.phone = normalizeString(c.phone);
    c.location = normalizeString(c.location);
    c.linkedin = normalizeUrl(c.linkedin);
    c.github = normalizeUrl(c.github);
    c.website = normalizeUrl(c.website);
  } else {
    data.contact = { email: "" };
  }

  // Arrays - ensure they exist
  if (!Array.isArray(data.experience)) data.experience = [];

  // Normalize URLs in certifications
  if (Array.isArray(data.certifications)) {
    for (const cert of data.certifications) {
      if (cert && typeof cert === "object") {
        (cert as Record<string, unknown>).url = normalizeUrl((cert as Record<string, unknown>).url);
      }
    }
  }

  // Normalize URLs in projects
  if (Array.isArray(data.projects)) {
    for (const proj of data.projects) {
      if (proj && typeof proj === "object") {
        (proj as Record<string, unknown>).url = normalizeUrl((proj as Record<string, unknown>).url);
      }
    }
  }

  return data;
}

function transformGeminiOutput(raw: ResumeSchema): ResumeSchema {
  const result = structuredClone(raw);

  const trimStrings = (obj: Record<string, unknown>): void => {
    if (obj === null || obj === undefined) return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === "object" && item !== null) {
          trimStrings(item as Record<string, unknown>);
        }
      }
      return;
    }
    if (typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === "string") {
          obj[key] = (obj[key] as string).trim();
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          trimStrings(obj[key] as Record<string, unknown>);
        }
      }
    }
  };

  trimStrings(result);

  if (result.contact?.website?.includes("linkedin.com") && !result.contact.linkedin) {
    result.contact.linkedin = result.contact.website;
    delete result.contact.website;
  }

  if (result.contact) {
    for (const key of Object.keys(result.contact)) {
      if ((result.contact as Record<string, unknown>)[key] === "") {
        delete (result.contact as Record<string, unknown>)[key];
      }
    }
  }

  if (Array.isArray(result.projects)) {
    for (const project of result.projects) {
      if (project?.year) {
        const yearMatch = project.year.match(/(\d{4})/);
        if (yearMatch) {
          project.year = yearMatch[1];
        }
      }
    }
  }

  if (Array.isArray(result.experience)) {
    for (const exp of result.experience) {
      if (exp?.location === "") {
        delete exp.location;
      }
    }
  }

  if (Array.isArray(result.education)) {
    for (const edu of result.education) {
      if (edu?.location === "") {
        delete edu.location;
      }
      if (edu?.gpa === "") {
        delete edu.gpa;
      }
    }
  }

  for (const key of ["skills", "certifications", "projects", "education"] as const) {
    if (Array.isArray(result[key]) && result[key].length === 0) {
      delete result[key];
    }
  }

  if (result.contact?.website === result.contact?.linkedin) {
    delete result.contact.website;
  }

  return result;
}

export async function parseResumeWithGemini(
  pdfBuffer: Uint8Array,
  env: Partial<CloudflareEnv>,
): Promise<{ success: boolean; parsedContent: string; error?: string }> {
  try {
    // Step 1: Extract text from PDF
    const extractResult = await extractPdfText(pdfBuffer, env);

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

    // Step 2.5: Basic transforms - lenient, no strict validation
    // Validation happens at edit-time in /api/resume/update, not here
    const transformedData = transformAiResponse(parseResult.data);

    // Step 3: Final cleanup and return
    const transformed = transformGeminiOutput(transformedData as ResumeSchema);

    return {
      success: true,
      parsedContent: JSON.stringify(transformed),
    };
  } catch (error) {
    return {
      success: false,
      parsedContent: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export { RESUME_EXTRACTION_SCHEMA, transformGeminiOutput };
