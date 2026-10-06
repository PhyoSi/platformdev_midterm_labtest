# AI Interaction Log (`AI_LOG.md`)

## Summary of AI Usage
This log tracks prompts provided to the AI assistant, how AI generated content was integrated, and manual verification steps undertaken by the developer.

---

## Log Entry 1: Planning, Schema Design, and API Contract (Minute 0 - 10)
- **Prompt / Request:**
  "Read the exam brief markdown file and read the timeline provided." & "proceed with step 1"
- **AI Response Summary:**
  - Parsed exam requirements and outlined the 120-minute test timeline.
  - Formulated the SQLite database schema (`equipment`, `bookings`) and ERD diagram.
  - Formulated `API_CONTRACT.md` detailing all endpoints (`GET /equipment`, `GET/POST/PATCH/DELETE /bookings`), validation rules, error payload formats, and status codes (`400`, `404`, `409`).
- **What Was Used:**
  - The API contract design, JSON schemas, status code mapping (`400`, `404`, `409`), and SQLite table definitions.
- **Manual Verification Performed:**
  - Verified contract aligns directly with `exam_brief_en.md` requirements (parameterized SQL binding, overlap validation logic `startAt < existing.endAt && endAt > existing.startAt`, strict `{ "error": "message" }` format).

---

## Log Entry 2: Initial API Implementation & Database Setup (Minute 10 - 30)
- **Prompt / Request:**
  "proceed step 2"
- **AI Response Summary:**
  - Initialized Node.js TypeScript project with Hono framework (`@hono/node-server`) and SQLite driver (`better-sqlite3`).
  - Created `src/db.ts` to manage schema migrations and seed 3 default equipment records (`eq-1`, `eq-2`, `eq-3`).
  - Created `src/index.ts` implementing endpoints for Equipment (`GET /api/equipment`) and Bookings (`GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id`).
  - Implemented parameter binding for SQL queries and validation checks (date range logic, equipment existence, collision check).
- **What Was Used:**
  - Complete application code structure in `src/db.ts` and `src/index.ts`.
- **Manual Verification Performed:**
  - Executed local server (`npx tsx src/index.ts`) on port 8787.
  - Smoke tested `GET http://localhost:8787/api/equipment` using Node HTTP client, confirming 200 OK response with seeded equipment records (`eq-1`, `eq-2`, `eq-3`).

---

## Log Entry 3: Quality Gate Review, Automated Testing, and Final Submission (Minutes 30 - 120)
- **Prompt / Request:**
  "Read the quality_gate.md file and check whether the checklists are complete. If not, fix the issues."
- **AI Response Summary:**
  - Authored `QUALITY_GATE_REVIEW.md` containing 3 detailed review findings (Date validation, Self-conflict resolution on update, Parameterized SQL security).
  - Authored `test_runner.js` executing 7 full HTTP test cases against `http://127.0.0.1:8787/api`.
  - Authored comprehensive `README.md` containing quickstart, ERD diagrams, full API contract specs, and verified test evidence.
- **What Was Used:**
  - Automated test script, Quality Gate documentation, and master README documentation.
- **Manual Verification Performed:**
  - Ran `node test_runner.js` against the active `npx wrangler dev` server, verifying 7 out of 7 test cases passed cleanly (`200`, `201`, `204`, `400`, `404`, `409`).



