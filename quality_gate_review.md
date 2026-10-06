# Quality Gate Review (`QUALITY_GATE_REVIEW.md`)

## Overview
This document records the Quality Gate review findings, code refinements, and verification evidence for the **Campus Equipment Booking API** built on Cloudflare Workers and Cloudflare D1.

---

## Finding 1: Validation & Error Handling on Date Formats (Reliability / Accuracy)
- **What I Found:**
  - Standard string checks (`!startAt`) passed invalid date strings such as `"invalid-date"` or out-of-range strings into SQL queries, causing unexpected runtime behavior or database date comparison failures.
- **How I Fixed It:**
  - Added strict date parsing validation using `new Date(startAt).getTime()` and `isNaN(...)` check.
  - Ensured `startAt` is chronologically strictly before `endAt` (`startDate < endDate`), returning HTTP `400 Bad Request` with `{ "error": "startAt must be strictly before endAt" }`.
- **Evidence:**
  - Sending `POST /api/bookings` with `"startAt": "2026-10-20T11:00:00.000Z"` and `"endAt": "2026-10-20T09:00:00.000Z"` yields:
    ```http
    HTTP/1.1 400 Bad Request
    Content-Type: application/json

    { "error": "startAt must be strictly before endAt" }
    ```

---

## Finding 2: Self-Conflict Bug on Booking Update (`PATCH`) (Reliability / Accuracy)
- **What I Found:**
  - When updating a booking's `purpose` or `borrowerName` via `PATCH /api/bookings/:id`, the initial overlap query checked all bookings for the equipment, causing the booking being updated to conflict with *itself*, returning a false `409 Conflict` error.
- **How I Fixed It:**
  - Updated the SQL overlap check on `PATCH` requests to append `AND id != ?`, excluding the current booking ID from collision detection.
- **Evidence:**
  - Updating booking `bk-101` (scheduled for 09:00–11:00) with a new borrower name kept the time slot unchanged and returned:
    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "id": "bk-101",
      "equipmentId": "eq-1",
      "borrowerName": "Somchai Jaidee (Updated)",
      "startAt": "2026-10-20T09:00:00.000Z",
      "endAt": "2026-10-20T11:00:00.000Z",
      "purpose": "Class presentation"
    }
    ```

---

## Finding 3: SQL Injection Prevention & Parameter Binding (Reasoning / You Own It)
- **What I Found:**
  - Raw dynamic query construction or template literals in database calls present SQL injection vulnerabilities when processing user input strings (such as `borrowerName` or `purpose`).
- **How I Fixed It:**
  - Refactored all Cloudflare D1 SQL operations to use strict parameter binding via `c.env.DB.prepare(sql).bind(...params)`.
- **Evidence:**
  - Code inspection in `src/index.ts` verifies zero raw string concatenation in SQL queries:
    ```typescript
    await c.env.DB.prepare(`
      INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, equipmentId, borrowerName, startAt, endAt, purpose).run();
    ```
