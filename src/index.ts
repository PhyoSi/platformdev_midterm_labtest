import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

interface BookingRow {
  id: string;
  equipment_id: string;
  borrower_name: string;
  start_at: string;
  end_at: string;
  purpose: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Helper function to ensure DB tables and seed data exist in D1
let isSchemaInitialized = false;

async function ensureSchema(db: D1Database) {
  if (isSchemaInitialized) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS equipment (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          equipment_id TEXT NOT NULL,
          borrower_name TEXT NOT NULL,
          start_at TEXT NOT NULL,
          end_at TEXT NOT NULL,
          purpose TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
        );
      `),
      db.prepare(`
        INSERT OR IGNORE INTO equipment (id, name, location) VALUES
          ('eq-1', 'Projector A', 'Building 1'),
          ('eq-2', '4K Cinema Camera', 'Media Lab 202'),
          ('eq-3', 'Meeting Room B', 'Library 3rd Floor');
      `)
    ]);
    isSchemaInitialized = true;
  } catch (err) {
    console.error('Failed to initialize schema:', err);
  }
}

function formatBooking(row: BookingRow) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    borrowerName: row.borrower_name,
    startAt: row.start_at,
    endAt: row.end_at,
    purpose: row.purpose,
  };
}

// ----------------------------------------------------
// 1. GET /api/equipment - List equipment records
// ----------------------------------------------------
app.get('/api/equipment', async (c) => {
  await ensureSchema(c.env.DB);
  const { results } = await c.env.DB.prepare('SELECT id, name, location FROM equipment ORDER BY id ASC').all();
  return c.json(results, 200);
});

// ----------------------------------------------------
// 2. GET /api/bookings - List all bookings
// ----------------------------------------------------
app.get('/api/bookings', async (c) => {
  await ensureSchema(c.env.DB);
  const { results } = await c.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings ORDER BY start_at ASC'
  ).all();
  return c.json((results as unknown as BookingRow[]).map(formatBooking), 200);
});

// ----------------------------------------------------
// 3. GET /api/bookings/:id - Get a single booking
// ----------------------------------------------------
app.get('/api/bookings/:id', async (c) => {
  await ensureSchema(c.env.DB);
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?'
  ).bind(id).first<BookingRow>();

  if (!row) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  return c.json(formatBooking(row), 200);
});

// ----------------------------------------------------
// 4. POST /api/bookings - Create a booking
// ----------------------------------------------------
app.post('/api/bookings', async (c) => {
  await ensureSchema(c.env.DB);
  let body: any;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { equipmentId, borrowerName, startAt, endAt, purpose } = body || {};

  // Validation: Missing fields
  if (!equipmentId || !borrowerName || !startAt || !endAt || !purpose) {
    return c.json({ error: 'Missing required fields: equipmentId, borrowerName, startAt, endAt, purpose' }, 400);
  }

  // Validation: Date strings format
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return c.json({ error: 'startAt and endAt must be valid ISO 8601 date strings' }, 400);
  }

  // Validation: startAt < endAt
  if (startDate.getTime() >= endDate.getTime()) {
    return c.json({ error: 'startAt must be strictly before endAt' }, 400);
  }

  // Validation: equipmentId existence
  const eqRow = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first();
  if (!eqRow) {
    return c.json({ error: `Equipment '${equipmentId}' does not exist` }, 404);
  }

  // Validation: Check overlapping bookings for the same equipment
  // Overlap condition: (new_start < existing_end) AND (new_end > existing_start)
  const existingOverlap = await c.env.DB.prepare(`
    SELECT id FROM bookings
    WHERE equipment_id = ?
      AND start_at < ?
      AND end_at > ?
  `).bind(equipmentId, endAt, startAt).first();

  if (existingOverlap) {
    return c.json({ error: 'Equipment is already booked for the requested time slot' }, 409);
  }

  // Insert new booking using D1 parameterized binding
  const id = `bk-${crypto.randomUUID().substring(0, 8)}`;
  await c.env.DB.prepare(`
    INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, equipmentId, borrowerName, startAt, endAt, purpose).run();

  const createdRow = await c.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?'
  ).bind(id).first<BookingRow>();

  return c.json(formatBooking(createdRow!), 201);
});

// ----------------------------------------------------
// 5. PATCH /api/bookings/:id - Update a booking
// ----------------------------------------------------
app.patch('/api/bookings/:id', async (c) => {
  await ensureSchema(c.env.DB);
  const { id } = c.req.param();
  const existing = await c.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?'
  ).bind(id).first<BookingRow>();

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const equipmentId = body.equipmentId ?? existing.equipment_id;
  const borrowerName = body.borrowerName ?? existing.borrower_name;
  const startAt = body.startAt ?? existing.start_at;
  const endAt = body.endAt ?? existing.end_at;
  const purpose = body.purpose ?? existing.purpose;

  // Validation: Date strings format
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return c.json({ error: 'startAt and endAt must be valid ISO 8601 date strings' }, 400);
  }

  // Validation: startAt < endAt
  if (startDate.getTime() >= endDate.getTime()) {
    return c.json({ error: 'startAt must be strictly before endAt' }, 400);
  }

  // Validation: equipmentId existence
  const eqRow = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first();
  if (!eqRow) {
    return c.json({ error: `Equipment '${equipmentId}' does not exist` }, 404);
  }

  // Validation: Check overlapping bookings excluding current booking
  const existingOverlap = await c.env.DB.prepare(`
    SELECT id FROM bookings
    WHERE equipment_id = ?
      AND start_at < ?
      AND end_at > ?
      AND id != ?
  `).bind(equipmentId, endAt, startAt, id).first();

  if (existingOverlap) {
    return c.json({ error: 'Equipment is already booked for the requested time slot' }, 409);
  }

  // Update booking using D1 parameterized binding
  await c.env.DB.prepare(`
    UPDATE bookings
    SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
    WHERE id = ?
  `).bind(equipmentId, borrowerName, startAt, endAt, purpose, id).run();

  const updatedRow = await c.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?'
  ).bind(id).first<BookingRow>();

  return c.json(formatBooking(updatedRow!), 200);
});

// ----------------------------------------------------
// 6. DELETE /api/bookings/:id - Delete a booking
// ----------------------------------------------------
app.delete('/api/bookings/:id', async (c) => {
  await ensureSchema(c.env.DB);
  const { id } = c.req.param();
  const existing = await c.env.DB.prepare('SELECT id FROM bookings WHERE id = ?').bind(id).first();

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

export default app;
