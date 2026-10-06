### Case 1: List Equipment (`GET /api/equipment`)
- **Status:** `200 OK`
- **Response:**
  ```json
  [
    { "id": "eq-1", "name": "Projector A", "location": "Building 1" },
    { "id": "eq-2", "name": "4K Cinema Camera", "location": "Media Lab 202" },
    { "id": "eq-3", "name": "Meeting Room B", "location": "Library 3rd Floor" }
  ]
  ```

### Case 2: Create Booking (`POST /api/bookings`)
- **Status:** `201 Created`
- **Request:**
  ```json
  {
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T09:00:00.000Z",
    "endAt": "2026-10-20T11:00:00.000Z",
    "purpose": "Class presentation"
  }
  ```
- **Response:**
  ```json
  {
    "id": "bk-6af548c9",
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T09:00:00.000Z",
    "endAt": "2026-10-20T11:00:00.000Z",
    "purpose": "Class presentation"
  }
  ```

### Case 3: Overlapping Booking Conflict (`POST /api/bookings`)
- **Status:** `409 Conflict`
- **Request:** Attempting to book `eq-1` from 10:00 to 12:00 (overlaps with 09:00–11:00)
- **Response:**
  ```json
  { "error": "Equipment is already booked for the requested time slot" }
  ```

### Case 4: Invalid Date Order Validation (`POST /api/bookings`)
- **Status:** `400 Bad Request`
- **Request:** Sending `startAt`: 15:00 and `endAt`: 13:00 (`startAt >= endAt`)
- **Response:**
  ```json
  { "error": "startAt must be strictly before endAt" }
  ```

### Case 5: Non-Existent Booking Query (`GET /api/bookings/bk-nonexistent`)
- **Status:** `404 Not Found`
- **Response:**
  ```json
  { "error": "Booking not found" }
  ```

### Case 6: Update Booking (`PATCH /api/bookings/:id`)
- **Status:** `200 OK`
- **Request:** Update borrower name and purpose for `bk-6af548c9`
- **Response:**
  ```json
  {
    "id": "bk-6af548c9",
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee (Updated)",
    "startAt": "2026-10-20T09:00:00.000Z",
    "endAt": "2026-10-20T11:00:00.000Z",
    "purpose": "Final exam presentation"
  }
  ```

### Case 7: Delete Booking (`DELETE /api/bookings/:id`)
- **Status:** `204 No Content`
- **Response Body:** `(empty)`

---