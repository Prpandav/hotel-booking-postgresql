import pool from "../config/database.js";

export const findAuditLogs = async ({ tableName, operation, page, limit }) => {
  const conditions = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);

    return `$${values.length}`;
  };

  if (tableName) {
    conditions.push(`table_name = ${addValue(tableName)}`);
  }

  if (operation) {
    conditions.push(`operation = ${addValue(operation)}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const offset = (page - 1) * limit;

  const limitPlaceholder = addValue(limit);

  const offsetPlaceholder = addValue(offset);

  const result = await pool.query(
    `
      SELECT
        id,
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by,
        changed_at

      FROM audit_logs

      ${whereClause}

      ORDER BY changed_at DESC

      LIMIT ${limitPlaceholder}

      OFFSET ${offsetPlaceholder}
    `,
    values,
  );

  return result.rows;
};
