# OpenRouter Resume Parsing Integration Plan

Goal: replace Replicate/Datalab OCR parsing with the local `resume-from-pdf.ts` (OpenRouter + unpdf) flow and make it production‑ready using `ctx.waitUntil`.

## 1) Establish new parsing flow
1.1 Document the new async flow:
- `/api/resume/claim` and `/api/resume/retry` set `status=processing`.
- Kick off `ctx.waitUntil(runParseJob(...))` (future: Cloudflare Queues).
- `runParseJob` parses PDF → validates → writes `resumes` + `site_data` → fan‑out to `waiting_for_cache`.
- `/api/resume/status` reads DB status only (no external polling).

1.2 Add code comment near `ctx.waitUntil`:
- `// Future: move parse jobs to Cloudflare Queues for retries and isolation.`

## 2) Extract shared parser from resume-from-pdf.ts
2.1 Create `lib/ai/resume-extraction-schema.ts`:
- Export `RESUME_EXTRACTION_SCHEMA` JSON schema.
- Export `SYSTEM_PROMPT` string (same as CLI).

2.2 Create `lib/ai/resume-normalize.ts`:
- Move `safeJsonParse`, `transformResumeOutput`, `trimStrings`, and URL cleanup helpers.

2.3 Create `lib/ai/resume-parser.ts`:
- `extractPdfTextFromBytes(bytes, { maxChars })` using `unpdf`.
- `parseResumeFromText(text, { model, provider, api, baseURL })` using OpenAI SDK.
- `parseResumeFromPdfBytes(bytes, opts)` (extract → clamp → LLM → normalize).
- Defaults:
  - provider: `openrouter`
  - model: `google/gemini-2.5-flash-lite`

2.4 Enforce schema compatibility:
- After normalization, ensure required fields are non‑empty.
- If missing, set safe defaults so `resumeContentSchema` passes.

## 3) Refactor CLI to reuse shared parser
3.1 Update `resume-from-pdf.ts`:
- Replace local parsing code with calls to `lib/ai/resume-parser.ts`.
- Keep CLI flags/behavior, but parsing is shared.

## 4) Build async parse runner
4.1 Add `lib/ai/parse-runner.ts`:
- `runParseJob({ resumeId, userId, r2Key, fileHash, env })`.
- Steps:
  1) Fetch PDF bytes from R2 (`GetObjectCommand`).
  2) Extract text via `unpdf` (no OCR). If no text, fail with clear message.
  3) Call OpenRouter with JSON schema output.
  4) Normalize + validate with `resumeContentSchema`.
  5) Update `resumes` (`parsedContent`, `parsedAt`, `status=completed`).
  6) Upsert `site_data`.
  7) Fan‑out to `waiting_for_cache` for same `fileHash`.
  8) Revalidate cache tag (`getResumeCacheTag`).
- Add structured logs (resume_id, text length, parse time).
- Handle errors with user‑friendly messages (reuse logic from webhook).
- Use `AbortController` + `RESUME_PARSER_TIMEOUT_MS`.

## 5) Replace Replicate in claim flow
5.1 Update `app/api/resume/claim/route.ts`:
- Remove Replicate imports and webhook URL logic.
- After R2 copy and validations, set:
  - `status=processing`, `processingStartedAt=now`, `processor=openrouter`.
- Call `ctx.waitUntil(runParseJob(...))`.
- Keep cache and `waiting_for_cache` logic intact.

## 6) Replace Replicate in retry flow
6.1 Update `app/api/resume/retry/route.ts`:
- Remove Replicate parsing trigger.
- Set `status=processing`, `processingStartedAt=now`, increment `retryCount`.
- Call `ctx.waitUntil(runParseJob(...))`.

## 7) Simplify status endpoint
7.1 Update `app/api/resume/status/route.ts`:
- Remove Replicate polling and output parsing.
- Status is DB‑driven only.
- Add processing timeout (e.g. 10 min):
  - If `processingStartedAt` too old → mark failed → allow retry.
- Keep existing `waiting_for_cache` timeout logic.

## 8) Remove Replicate webhook + utils
8.1 Delete:
- `app/api/webhook/replicate/route.ts`
- `lib/utils/webhook-verification.ts`
- `lib/replicate.ts`

8.2 Remove Replicate references in imports and code paths.

## 9) Database migration (minimal risk)
9.1 Add columns (no destructive drops):
- `processor` TEXT default `'openrouter'`
- `processingStartedAt` TEXT

9.2 Add index if needed:
- `(status, processingStartedAt)`

9.3 Keep `replicateJobId` for now (unused) to avoid rebuild.

## 10) Env + config updates
10.1 `lib/env.ts`:
- Remove `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_SECRET` requirements.
- Add required `OPENROUTER_API_KEY`.
- Add optional:
  - `OPENROUTER_MODEL` (default to Gemini 2.5 Flash Lite)
  - `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE`
  - `RESUME_PARSER_MAX_CHARS`, `RESUME_PARSER_TIMEOUT_MS`

10.2 `wrangler.jsonc` comments:
- Replace Replicate secrets with OpenRouter secrets.

## 11) Docs + legal copy
11.1 Update:
- `README.md` (env + setup)
- `CLAUDE.md` (env list)
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

11.2 Remove OCR references and mention OpenRouter as the parser.

## 12) UX copy tweaks
12.1 `components/wizard/UploadStep.tsx`:
- Add explicit warning: scanned PDFs not supported (no OCR).

## 13) Observability & safeguards
13.1 Add structured logs in `runParseJob`:
- `resume_id`, page count, text length, model, elapsed time.

13.2 Retry strategy for OpenRouter:
- Retry on 429/5xx with exponential backoff (2–3 tries).
- Fail fast on 4xx validation errors.

## 14) Tests & verification
14.1 CLI smoke:
- `bun run resume-from-pdf.ts ./sample.pdf`

14.2 E2E dev smoke:
- Upload → claim → poll status → verify `site_data`.

14.3 Failure case:
- Upload a scanned PDF → ensure clear error + retry allowed.

## 15) Rollout
15.1 Apply migration and deploy.
15.2 Add OpenRouter secrets in prod.
15.3 Monitor logs and adjust prompt/limits if needed.
