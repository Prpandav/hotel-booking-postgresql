import { query } from "../config/database.js";

export const findAllRooms = async () => {
  const sql = `
    SELECT
      rooms.id,
      rooms.room_number,
      rooms.floor_number,
      rooms.status,
      rooms.is_active,
      room_types.id AS room_type_id,
      room_types.name AS room_type,
      room_types.base_price,
      room_types.capacity,
      room_types.amenities
    FROM rooms
    INNER JOIN room_types
      ON rooms.room_type_id = room_types.id
    ORDER BY
      rooms.floor_number,
      rooms.room_number
  `;

  const result = await query(sql);

  return result.rows;
};
