import { query } from "../config/database.js";

const roomSelect = `
  SELECT
    rooms.id,
    rooms.room_number,
    rooms.floor_number,
    rooms.status,
    rooms.is_active,
    rooms.created_at,
    rooms.updated_at,

    room_types.id AS room_type_id,
    room_types.name AS room_type,
    room_types.description AS room_type_description,
    room_types.base_price,
    room_types.capacity,
    room_types.amenities

  FROM rooms

  INNER JOIN room_types
    ON rooms.room_type_id = room_types.id
`;

export const findAllRooms = async (filters = {}) => {
  const conditions = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (!filters.includeInactive) {
    conditions.push("rooms.is_active = TRUE");
  }

  if (filters.status) {
    const placeholder = addValue(filters.status);
    conditions.push(`rooms.status = ${placeholder}`);
  }

  if (filters.roomTypeId !== undefined) {
    const placeholder = addValue(filters.roomTypeId);
    conditions.push(`rooms.room_type_id = ${placeholder}`);
  }

  if (filters.minPrice !== undefined) {
    const placeholder = addValue(filters.minPrice);
    conditions.push(`room_types.base_price >= ${placeholder}`);
  }

  if (filters.maxPrice !== undefined) {
    const placeholder = addValue(filters.maxPrice);
    conditions.push(`room_types.base_price <= ${placeholder}`);
  }

  if (filters.capacity !== undefined) {
    const placeholder = addValue(filters.capacity);
    conditions.push(`room_types.capacity >= ${placeholder}`);
  }

  if (filters.amenity) {
    const placeholder = addValue(filters.amenity);
    conditions.push(`${placeholder} = ANY(room_types.amenities)`);
  }

  if (filters.search) {
    const placeholder = addValue(`%${filters.search}%`);

    conditions.push(`
      (
        rooms.room_number ILIKE ${placeholder}
        OR room_types.name ILIKE ${placeholder}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    ${roomSelect}

    ${whereClause}

    ORDER BY
      rooms.floor_number,
      rooms.room_number
  `;

  const result = await query(sql, values);

  return result.rows;
};

export const findRoomById = async (roomId) => {
  const sql = `
    ${roomSelect}

    WHERE rooms.id = $1
  `;

  const result = await query(sql, [roomId]);

  return result.rows[0] ?? null;
};

export const createRoom = async ({
  roomNumber,
  roomTypeId,
  floorNumber,
  status,
}) => {
  const sql = `
    INSERT INTO rooms (
      room_number,
      room_type_id,
      floor_number,
      status
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const values = [roomNumber, roomTypeId, floorNumber, status];

  const result = await query(sql, values);

  return findRoomById(result.rows[0].id);
};

export const updateRoom = async (roomId, changes) => {
  const assignments = [];
  const values = [];

  const addAssignment = (column, value) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (changes.roomNumber !== undefined) {
    addAssignment("room_number", changes.roomNumber);
  }

  if (changes.roomTypeId !== undefined) {
    addAssignment("room_type_id", changes.roomTypeId);
  }

  if (changes.floorNumber !== undefined) {
    addAssignment("floor_number", changes.floorNumber);
  }

  if (changes.status !== undefined) {
    addAssignment("status", changes.status);
  }

  if (assignments.length === 0) {
    return findRoomById(roomId);
  }

  assignments.push("updated_at = CURRENT_TIMESTAMP");

  values.push(roomId);
  const roomIdPlaceholder = `$${values.length}`;

  const sql = `
    UPDATE rooms

    SET ${assignments.join(", ")}

    WHERE id = ${roomIdPlaceholder}
      AND is_active = TRUE

    RETURNING id
  `;

  const result = await query(sql, values);

  if (result.rows.length === 0) {
    return null;
  }

  return findRoomById(result.rows[0].id);
};

export const deactivateRoom = async (roomId) => {
  const sql = `
    UPDATE rooms

    SET
      is_active = FALSE,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $1
      AND is_active = TRUE

    RETURNING id
  `;

  const result = await query(sql, [roomId]);

  return result.rows[0] ?? null;
};
