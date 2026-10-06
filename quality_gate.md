# Quality Gate — Midterm Practical Lab Test

Use this Quality Gate after the first 30 minutes and again during the final 5 minutes before submission. Its purpose is to help you verify that your Campus Equipment Booking API is correct, usable, and genuinely your own work.

## How to use this Quality Gate

1. Read the task, API contract, marking rubric, and any permitted course resources.
2. Review the eight checks below that apply to your work.
3. If you find a meaningful issue, fix it and test the fix.
4. Record at least three improvements in `QUALITY_GATE_REVIEW.md` using: **finding → action taken → evidence**.

If an important requirement is missing, a test fails, or you cannot explain a key part of your solution, stop and resolve it before submitting.

## 1. Purpose

- [x] My API solves the stated equipment-booking problem.
- [x] My routes, request bodies, responses, and status codes match the common API contract.
- [x] I have met the required deliverables and submission instructions.
- [x] I have not added unrelated features that reduce the time available for required work.

## 2. Reliability

- [x] My equipment data and booking data are saved and retrieved consistently.
- [x] Creating or updating a booking cannot create an overlap for the same equipment.
- [x] `equipmentId` is checked against existing equipment.
- [x] The API handles invalid requests without crashing.

## 3. Course Context

- [x] My work follows the instructor's task, the API contract, and the permitted technology stack.
- [x] I understand which parts I implemented myself and which parts were assisted by AI or other permitted resources.
- [x] I used only permitted sources and recorded significant AI assistance in `AI_LOG.md`.
- [x] I can identify the important files, routes, schema, and commands needed to run my work.

## 4. Reasoning

- [x] I can explain why I selected each important status code, especially `400`, `404`, and `409`.
- [x] I can explain how my overlap check works for both create and update operations.
- [x] I can distinguish required behaviour from optional design choices.
- [x] I can explain any limitations or assumptions in my implementation.

## 5. Execution Value

- [x] The API can be run by following the instructions in `README.md`.
- [x] The equipment endpoint and all required booking CRUD endpoints work.
- [x] I tested the API with `curl` or another HTTP client and recorded the results.
- [x] I have focused effort on the required API, validation, testing, and documentation.

## 6. Accuracy

- [x] Booking fields, dates, IDs, and responses contain the correct values.
- [x] I validate that `startAt` is before `endAt`.
- [x] Every error response uses JSON in the required `{ "error": "..." }` format.
- [x] I use SQL/D1 parameter binding and do not concatenate request data into SQL statements.

## 7. Delivery Quality

- [x] My source code is runnable and my README includes clear run instructions.
- [x] My API contract and brief schema/ERD are included.
- [x] I have included any CORS configuration only if I chose to use a browser-based client.
- [x] I have evidence for at least five test cases, including successful requests and error cases.
- [x] My files are named clearly and are complete enough for marking.

## 8. You Own It

- [x] I can explain every important route, validation rule, database query, and test result in my own words.
- [x] My `AI_LOG.md` truthfully records important prompts, what I used, and how I checked it.
- [x] I can explain what I changed after the Quality Gate review and why.
- [x] I am ready to answer follow-up questions about my design and implementation.

## Quality Gate Review Record

Create `QUALITY_GATE_REVIEW.md` and include at least three meaningful improvements. At least one improvement must relate to **Reliability** or **Accuracy**, and at least one must relate to **Reasoning** or **You Own It**.

| Quality Gate area | Finding | Action taken | Evidence |
|---|---|---|---|
| Reliability | Date format parsing and invalid order (`startAt >= endAt`) caused unexpected runtime issues. | Added strict ISO date validation and `startDate < endDate` check, returning 400 Bad Request. | Tested invalid date order; API returned `400` with `{ "error": "startAt must be strictly before endAt" }`. |
| Accuracy | Updating a booking (`PATCH`) conflicted with its own existing booking slot. | Excluded current booking ID from overlap query (`AND id != ?`). | Updated booking `bk-101`; returned `200 OK` without false conflict. |
| Reasoning / Security | Parameter concatenation in SQL queries risks SQL injection vulnerabilities. | Refactored all D1 database calls to use parameterized prepared statements (`c.env.DB.prepare(...).bind(...)`). | Audited `src/index.ts`; verified 100% parameter binding on all SQL queries. |

## Submission Decision

- [x] **READY:** All required work is complete, tests have been checked, and you can explain the submission.
- [ ] **REVIEW WITH INSTRUCTOR:** A requirement or result is unclear and you need clarification.
- [ ] **REWORK:** A real issue remains; fix it and repeat the relevant test.
- [ ] **DO NOT SUBMIT YET:** The work is incomplete, key evidence is missing, or you cannot explain important parts of it.
