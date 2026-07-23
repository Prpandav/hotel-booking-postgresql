import pool from "../config/database.js";

export const searchCustomers = async (searchText, limit = 20) => {
  const result = await pool.query(
    `
      WITH search_query AS (
        SELECT
          WEBSEARCH_TO_TSQUERY(
            'simple',
            $1
          ) AS query
      )

      SELECT
        customers.id,
        customers.full_name,
        customers.email,
        customers.phone,
        customers.preferences,

        TS_RANK(
          customers.search_document,
          search_query.query
        ) AS relevance

      FROM customers

      CROSS JOIN search_query

      WHERE customers.is_active = TRUE

        AND customers.search_document
            @@ search_query.query

      ORDER BY
        relevance DESC,
        customers.full_name

      LIMIT $2
    `,
    [searchText, limit],
  );

  return result.rows;
};

export const searchBookings = async (searchText, limit = 20) => {
  const result = await pool.query(
    `
      WITH search_query AS (
        SELECT
          WEBSEARCH_TO_TSQUERY(
            'simple',
            $1
          ) AS query
      )

      SELECT
        bookings.id,
        bookings.booking_code,
        bookings.status,
        bookings.check_in_date,
        bookings.check_out_date,
        bookings.special_requests,

        customers.full_name
          AS customer_name,

        rooms.room_number,

        TS_RANK(
          bookings.search_document,
          search_query.query
        ) AS relevance

      FROM bookings

      INNER JOIN customers
        ON bookings.customer_id =
           customers.id

      INNER JOIN rooms
        ON bookings.room_id =
           rooms.id

      CROSS JOIN search_query

      WHERE
        bookings.search_document
          @@ search_query.query

        OR bookings.booking_code::TEXT
           ILIKE '%' || $1 || '%'

      ORDER BY
        relevance DESC,
        bookings.created_at DESC

      LIMIT $2
    `,
    [searchText, limit],
  );

  return result.rows;
};
