const BASE_URL = process.argv[2] || 'https://campus-equipment-booking-api.taskflow-taskmanager.workers.dev/api';

async function runTests() {
  console.log('Starting Test Execution Against ' + BASE_URL + '\n');
  const results = [];

  // Case 1: GET /equipment
  const res1 = await fetch(`${BASE_URL}/equipment`);
  const data1 = await res1.json();
  results.push({
    test: 'Case 1: List Equipment (GET /equipment)',
    status: res1.status,
    response: data1
  });

  // Case 2: POST /bookings (Valid)
  const res2 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipmentId: 'eq-1',
      borrowerName: 'Somchai Jaidee',
      startAt: '2026-10-20T09:00:00.000Z',
      endAt: '2026-10-20T11:00:00.000Z',
      purpose: 'Class presentation'
    })
  });
  const data2 = await res2.json();
  const createdId = data2.id;
  results.push({
    test: 'Case 2: Create Booking (POST /bookings)',
    status: res2.status,
    response: data2
  });

  // Case 3: POST /bookings (Overlap Conflict - 409)
  const res3 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipmentId: 'eq-1',
      borrowerName: 'Somsak',
      startAt: '2026-10-20T10:00:00.000Z',
      endAt: '2026-10-20T12:00:00.000Z',
      purpose: 'Group study'
    })
  });
  const data3 = await res3.json();
  results.push({
    test: 'Case 3: Time Overlap Conflict (POST /bookings)',
    status: res3.status,
    response: data3
  });

  // Case 4: POST /bookings (Validation Error - 400 Bad Request)
  const res4 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipmentId: 'eq-1',
      borrowerName: 'Jane Doe',
      startAt: '2026-10-20T15:00:00.000Z',
      endAt: '2026-10-20T13:00:00.000Z',
      purpose: 'Testing start > end'
    })
  });
  const data4 = await res4.json();
  results.push({
    test: 'Case 4: Invalid Date Order Validation (POST /bookings)',
    status: res4.status,
    response: data4
  });

  // Case 5: GET /bookings/:id (Not Found - 404)
  const res5 = await fetch(`${BASE_URL}/bookings/bk-nonexistent`);
  const data5 = await res5.json();
  results.push({
    test: 'Case 5: Get Non-Existent Booking (GET /bookings/:id)',
    status: res5.status,
    response: data5
  });

  // Case 6: PATCH /bookings/:id (Update Booking)
  const res6 = await fetch(`${BASE_URL}/bookings/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      borrowerName: 'Somchai Jaidee (Updated)',
      purpose: 'Final exam presentation'
    })
  });
  const data6 = await res6.json();
  results.push({
    test: 'Case 6: Update Booking (PATCH /bookings/:id)',
    status: res6.status,
    response: data6
  });

  // Case 7: DELETE /bookings/:id (Delete Booking - 204)
  const res7 = await fetch(`${BASE_URL}/bookings/${createdId}`, {
    method: 'DELETE'
  });
  results.push({
    test: 'Case 7: Delete Booking (DELETE /bookings/:id)',
    status: res7.status,
    response: res7.status === 204 ? '[No Content]' : await res7.json()
  });

  console.log(JSON.stringify(results, null, 2));
}

runTests();
