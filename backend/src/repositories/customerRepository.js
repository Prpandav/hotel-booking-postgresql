import { query } from "../config/database.js";

const customerSelect = `
  SELECT
    customers.id,
    customers.full_name,
    customers.email,
    customers.phone,
    customers.preferences,
    customers.is_active,
    customers.created_at,
    customers.updated_at
  FROM customers
`;

export const findAllCustomers = async (filters = {}) => {
  const conditions = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (!filters.includeInactive) {
    conditions.push("customers.is_active = TRUE");
  }

  if (filters.search) {
    const placeholder = addValue(`%${filters.search}%`);

    conditions.push(`
      (
        customers.full_name ILIKE ${placeholder}
        OR customers.email ILIKE ${placeholder}
        OR customers.phone ILIKE ${placeholder}
      )
    `);
  }

  if (filters.preferredFloor !== undefined) {
    const jsonFilter = JSON.stringify({
      preferred_floor: filters.preferredFloor,
    });

    const placeholder = addValue(jsonFilter);

    conditions.push(`
      customers.preferences @> ${placeholder}::JSONB
    `);
  }

  if (filters.bedType) {
    const jsonFilter = JSON.stringify({
      bed_type: filters.bedType,
    });

    const placeholder = addValue(jsonFilter);

    conditions.push(`
      customers.preferences @> ${placeholder}::JSONB
    `);
  }

  if (filters.smokingRoom !== undefined) {
    const jsonFilter = JSON.stringify({
      smoking_room: filters.smokingRoom,
    });

    const placeholder = addValue(jsonFilter);

    conditions.push(`
      customers.preferences @> ${placeholder}::JSONB
    `);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const sql = `
    ${customerSelect}

    ${whereClause}

    ORDER BY
      customers.full_name,
      customers.id
  `;

  const result = await query(sql, values);

  return result.rows;
};

export const findCustomerById = async (customerId) => {
  const sql = `
    ${customerSelect}

    WHERE customers.id = $1
  `;

  const result = await query(sql, [customerId]);

  return result.rows[0] ?? null;
};

export const createCustomer = async ({
  fullName,
  email,
  phone,
  preferences,
}) => {
  const sql = `
    INSERT INTO customers (
      full_name,
      email,
      phone,
      preferences
    )
    VALUES ($1, $2, $3, $4::JSONB)
    RETURNING id
  `;

  const values = [
    fullName,
    email,
    phone,
    JSON.stringify(preferences),
  ];

  const result = await query(sql, values);

  return findCustomerById(result.rows[0].id);
};

export const updateCustomer = async (
  customerId,
  changes
) => {
  const assignments = [];
  const values = [];

  const addAssignment = (column, value) => {
    values.push(value);

    assignments.push(
      `${column} = $${values.length}`
    );
  };

  if (changes.fullName !== undefined) {
    addAssignment("full_name", changes.fullName);
  }

  if (changes.email !== undefined) {
    addAssignment("email", changes.email);
  }

  if (changes.phone !== undefined) {
    addAssignment("phone", changes.phone);
  }

  if (changes.preferences !== undefined) {
    values.push(JSON.stringify(changes.preferences));

    assignments.push(`
      preferences =
        preferences || $${values.length}::JSONB
    `);
  }

  assignments.push(
    "updated_at = CURRENT_TIMESTAMP"
  );

  values.push(customerId);

  const customerIdPlaceholder =
    `$${values.length}`;

  const sql = `
    UPDATE customers

    SET ${assignments.join(", ")}

    WHERE id = ${customerIdPlaceholder}
      AND is_active = TRUE

    RETURNING id
  `;

  const result = await query(sql, values);

  if (result.rows.length === 0) {
    return null;
  }

  return findCustomerById(result.rows[0].id);
};

export const deactivateCustomer = async (
  customerId
) => {
  const sql = `
    UPDATE customers

    SET
      is_active = FALSE,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $1
      AND is_active = TRUE

    RETURNING id
  `;

  const result = await query(sql, [customerId]);

  return result.rows[0] ?? null;
};