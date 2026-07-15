import { query } from "../config/database.js";

export const getHealth = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        current_database() AS database,
        current_user AS db_user,
        current_setting('server_version') AS postgres_version,
        NOW() AS server_time
    `);

    res.json({ status: "ok", database: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
