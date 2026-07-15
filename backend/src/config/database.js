import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export const query = (text, params = []) => pool.query(text, params);
export const getClient = () => pool.connect();

export const testDatabaseConnection = async () => {
  const result = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS db_user,
      current_setting('server_version') AS postgres_version,
      NOW() AS server_time
  `);

  console.log("PostgreSQL connected:", result.rows[0]);
};

export default pool;
