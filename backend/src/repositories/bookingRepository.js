import pool, { getClient } from "../config/database.js";

const activeStatuses = ["pending", "confirmed", "checked_in"];

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

const bookingSelect = `
  SELECT
    bookings.id,
    bookings.booking_code,
    bookings.check_in_date,
    bookings.check_out_date,
    bookings.adults,
    bookings.children,
    bookings.price_per_night,
    bookings.total_amount,
    bookings.status,
    bookings.special_requests,
    bookings.cancelled_at,
    bookings.created_at,
    bookings.updated_at,

    customers.id AS customer_id,
    customers.full_name AS customer_name,
    customers.email AS customer_email,
    customers.phone AS customer_phone,

    rooms.id AS room_id,
    rooms.room_number,
    rooms.floor_number,

    room_types.id AS room_type_id,
    room_types.name AS room_type,
    room_types.capacity,
    room_types.amenities,

    bookings.check_out_date
      - bookings.check_in_date
      AS total_nights

  FROM bookings

  INNER JOIN customers
    ON bookings.customer_id = customers.id

  INNER JOIN rooms
    ON bookings.room_id = rooms.id

  INNER JOIN room_types
    ON rooms.room_type_id = room_types.id
`;

const selectBookingById = async (executor, bookingId) => {
  const result = await executor.query(
    `
      ${bookingSelect}

      WHERE bookings.id = $1
    `,
    [bookingId],
  );

  return result.rows[0] ?? null;
};

export const findBookingById = async (bookingId) => {
  return selectBookingById(pool, bookingId);
};

export const findAllBookings = async (filters = {}, pagination = {}) => {
  const conditions = [];
  const filterValues = [];

  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 20;
  const offset = (page - 1) * limit;

  const addFilterValue = (value) => {
    filterValues.push(value);

    return `$${filterValues.length}`;
  };

  if (filters.status) {
    const placeholder = addFilterValue(filters.status);

    conditions.push(`bookings.status = ${placeholder}`);
  }

  if (filters.customerId !== undefined) {
    const placeholder = addFilterValue(filters.customerId);

    conditions.push(`bookings.customer_id = ${placeholder}`);
  }

  if (filters.roomId !== undefined) {
    const placeholder = addFilterValue(filters.roomId);

    conditions.push(`bookings.room_id = ${placeholder}`);
  }

  if (filters.fromDate) {
    const placeholder = addFilterValue(filters.fromDate);

    conditions.push(`bookings.check_in_date >= ${placeholder}::DATE`);
  }

  if (filters.toDate) {
    const placeholder = addFilterValue(filters.toDate);

    conditions.push(`bookings.check_in_date <= ${placeholder}::DATE`);
  }

  if (filters.scope === "upcoming") {
    conditions.push(`
      bookings.check_in_date > CURRENT_DATE

      AND bookings.status IN (
        'pending',
        'confirmed'
      )
    `);
  }

  if (filters.scope === "current") {
    conditions.push(`
      CURRENT_DATE >=
        bookings.check_in_date

      AND CURRENT_DATE <
          bookings.check_out_date

      AND bookings.status IN (
        'confirmed',
        'checked_in'
      )
    `);
  }

  if (filters.scope === "completed") {
    conditions.push("bookings.status = 'checked_out'");
  }

  if (filters.scope === "cancelled") {
    conditions.push("bookings.status = 'cancelled'");
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const queryValues = [...filterValues, limit, offset];

  const limitPlaceholder = `$${filterValues.length + 1}`;

  const offsetPlaceholder = `$${filterValues.length + 2}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `
          ${bookingSelect}

          ${whereClause}

          ORDER BY
            bookings.created_at DESC,
            bookings.id DESC

          LIMIT ${limitPlaceholder}

          OFFSET ${offsetPlaceholder}
        `,
      queryValues,
    ),

    pool.query(
      `
          SELECT
            COUNT(*) AS total

          FROM bookings

          ${whereClause}
        `,
      filterValues,
    ),
  ]);

  const total = Number(countResult.rows[0].total);

  return {
    data: dataResult.rows,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const findAvailableRooms = async ({
  checkInDate,
  checkOutDate,
  guests,
  roomTypeId,
  minPrice,
  maxPrice,
}) => {
  const conditions = [
    "rooms.is_active = TRUE",
    "rooms.status <> 'maintenance'",
    "room_types.capacity >= $3",
  ];

  /*
   * Reserve parameters:
   *
   * $1 = check-in
   * $2 = check-out
   * $3 = guests
   * $4 = active booking statuses
   */
  const values = [checkInDate, checkOutDate, guests, activeStatuses];

  const addValue = (value) => {
    values.push(value);

    return `$${values.length}`;
  };

  if (roomTypeId !== undefined) {
    const placeholder = addValue(roomTypeId);

    conditions.push(`room_types.id = ${placeholder}`);
  }

  if (minPrice !== undefined) {
    const placeholder = addValue(minPrice);

    conditions.push(`room_types.base_price >= ${placeholder}`);
  }

  if (maxPrice !== undefined) {
    const placeholder = addValue(maxPrice);

    conditions.push(`room_types.base_price <= ${placeholder}`);
  }

  const sql = `
    SELECT
      rooms.id,
      rooms.room_number,
      rooms.floor_number,
      rooms.status,

      room_types.id AS room_type_id,
      room_types.name AS room_type,
      room_types.description,
      room_types.base_price,
      room_types.capacity,
      room_types.amenities,

      $2::DATE - $1::DATE AS total_nights,

      (
        ($2::DATE - $1::DATE)
        * room_types.base_price
      )::NUMERIC(12, 2) AS estimated_total

    FROM rooms

    INNER JOIN room_types
      ON rooms.room_type_id = room_types.id

    WHERE ${conditions.join(" AND ")}

      AND NOT EXISTS (
        SELECT 1

        FROM bookings

        WHERE bookings.room_id = rooms.id

          AND bookings.status =
              ANY($4::VARCHAR[])

          AND daterange(
            bookings.check_in_date,
            bookings.check_out_date,
            '[)'
          ) && daterange(
            $1::DATE,
            $2::DATE,
            '[)'
          )
      )

    ORDER BY
      room_types.base_price,
      rooms.room_number
  `;

  const result = await pool.query(sql, values);

  return result.rows;
};

export const createBooking = async ({
  customerId,
  roomId,
  checkInDate,
  checkOutDate,
  adults,
  children,
  specialRequests,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    /*
     * Validate dates using PostgreSQL's current date.
     */
    const dateResult = await client.query(
      `
        SELECT
          $1::DATE < CURRENT_DATE
            AS check_in_is_past,

          $2::DATE <= $1::DATE
            AS invalid_date_range
      `,
      [checkInDate, checkOutDate],
    );

    if (dateResult.rows[0].check_in_is_past) {
      throw createError("Check-in date cannot be in the past");
    }

    if (dateResult.rows[0].invalid_date_range) {
      throw createError("Check-out date must be after check-in date");
    }

    /*
     * Confirm the customer exists and is active.
     */
    const customerResult = await client.query(
      `
          SELECT id

          FROM customers

          WHERE id = $1
            AND is_active = TRUE

          FOR SHARE
        `,
      [customerId],
    );

    if (customerResult.rows.length === 0) {
      throw createError("Active customer not found", 404);
    }

    /*
     * Lock the room row.
     *
     * Requests attempting to book the same room must
     * wait until this transaction completes.
     */
    const roomResult = await client.query(
      `
        SELECT
          rooms.id,
          rooms.room_number,
          rooms.status,
          room_types.base_price,
          room_types.capacity

        FROM rooms

        INNER JOIN room_types
          ON rooms.room_type_id =
             room_types.id

        WHERE rooms.id = $1
          AND rooms.is_active = TRUE
          AND rooms.status <> 'maintenance'

        FOR UPDATE OF rooms
      `,
      [roomId],
    );

    if (roomResult.rows.length === 0) {
      throw createError("Bookable room not found", 404);
    }

    const room = roomResult.rows[0];
    const totalGuests = adults + children;

    if (totalGuests > room.capacity) {
      throw createError(
        `Room capacity is ${room.capacity}, but ${totalGuests} guests were provided`,
      );
    }

    /*
     * Check whether the room is already booked
     * during the requested period.
     */
    const overlapResult = await client.query(
      `
        SELECT id

        FROM bookings

        WHERE room_id = $1

          AND status IN (
            'pending',
            'confirmed',
            'checked_in'
          )

          AND daterange(
            check_in_date,
            check_out_date,
            '[)'
          ) && daterange(
            $2::DATE,
            $3::DATE,
            '[)'
          )

        LIMIT 1
      `,
      [roomId, checkInDate, checkOutDate],
    );

    if (overlapResult.rows.length > 0) {
      throw createError("Room is unavailable for the selected dates", 409);
    }

    /*
     * PostgreSQL performs the money calculation
     * using NUMERIC instead of JavaScript floating-point.
     */
    const insertResult = await client.query(
      `
        INSERT INTO bookings (
          customer_id,
          room_id,
          check_in_date,
          check_out_date,
          adults,
          children,
          price_per_night,
          total_amount,
          special_requests
        )
        VALUES (
          $1,
          $2,
          $3::DATE,
          $4::DATE,
          $5,
          $6,
          $7::NUMERIC,

          (
            ($4::DATE - $3::DATE)
            * $7::NUMERIC
          )::NUMERIC(12, 2),

          $8
        )
        RETURNING id
      `,
      [
        customerId,
        roomId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        room.base_price,
        specialRequests,
      ],
    );

    const booking = await selectBookingById(client, insertResult.rows[0].id);

    await client.query("COMMIT");

    return booking;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

export const updateBookingDetails = async (bookingId, changes) => {
  const assignments = [];
  const values = [];

  const addAssignment = (column, value) => {
    values.push(value);

    assignments.push(`${column} = $${values.length}`);
  };

  if (changes.adults !== undefined) {
    addAssignment("adults", changes.adults);
  }

  if (changes.children !== undefined) {
    addAssignment("children", changes.children);
  }

  if (changes.specialRequests !== undefined) {
    addAssignment("special_requests", changes.specialRequests);
  }

  assignments.push("updated_at = CURRENT_TIMESTAMP");

  values.push(bookingId);

  const bookingIdPlaceholder = `$${values.length}`;

  const result = await pool.query(
    `
      UPDATE bookings

      SET ${assignments.join(", ")}

      WHERE id = ${bookingIdPlaceholder}

        AND status IN (
          'pending',
          'confirmed'
        )

      RETURNING id
    `,
    values,
  );

  if (result.rows.length === 0) {
    return null;
  }

  return findBookingById(result.rows[0].id);
};

export const cancelBooking = async (bookingId) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `
          SELECT
            id,
            status

          FROM bookings

          WHERE id = $1

          FOR UPDATE
        `,
      [bookingId],
    );

    if (bookingResult.rows.length === 0) {
      throw createError("Booking not found", 404);
    }

    const booking = bookingResult.rows[0];

    if (booking.status === "cancelled") {
      throw createError("Booking is already cancelled", 409);
    }

    if (booking.status === "checked_in" || booking.status === "checked_out") {
      throw createError(
        "Checked-in or completed bookings cannot be cancelled",
        409,
      );
    }

    await client.query(
      `
        UPDATE bookings

        SET
          status = 'cancelled',
          cancelled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $1
      `,
      [bookingId],
    );

    const cancelledBooking = await selectBookingById(client, bookingId);

    await client.query("COMMIT");

    return cancelledBooking;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

export const checkInBooking = async (bookingId) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    /*
     * Lock booking and room.
     *
     * Nobody else can simultaneously modify
     * these records until COMMIT or ROLLBACK.
     */
    const result = await client.query(
      `
        SELECT
          bookings.id,
          bookings.status,
          bookings.room_id,
          bookings.check_in_date,
          bookings.check_out_date,
          bookings.total_amount,

          rooms.status
            AS room_status,

          rooms.is_active,

          COALESCE(
            booking_payment_summary.remaining_balance,
            bookings.total_amount
          ) AS remaining_balance

        FROM bookings

        INNER JOIN rooms
          ON bookings.room_id =
             rooms.id

        LEFT JOIN booking_payment_summary
          ON bookings.id =
             booking_payment_summary.booking_id

        WHERE bookings.id = $1

        FOR UPDATE OF bookings, rooms
      `,
      [bookingId],
    );

    if (result.rows.length === 0) {
      throw createError("Booking not found", 404);
    }

    const booking = result.rows[0];

    /*
     * Booking must already be confirmed.
     */
    if (booking.status !== "confirmed") {
      throw createError("Only confirmed bookings can be checked in", 409);
    }

    /*
     * Cannot check in before booked date.
     */
    const dateResult = await client.query(
      `
          SELECT

            CURRENT_DATE < $1::DATE
              AS too_early,

            CURRENT_DATE >= $2::DATE
              AS stay_expired
        `,
      [booking.check_in_date, booking.check_out_date],
    );

    if (dateResult.rows[0].too_early) {
      throw createError(
        "Guest cannot check in before the booked check-in date",
        409,
      );
    }

    if (dateResult.rows[0].stay_expired) {
      throw createError("The booking stay period has already ended", 409);
    }

    /*
     * Customer must have fully paid.
     */
    if (Number(booking.remaining_balance) > 0) {
      throw createError(
        `Booking has a remaining balance of ${Number(
          booking.remaining_balance,
        ).toFixed(2)}`,
        409,
      );
    }

    if (!booking.is_active) {
      throw createError("Room is inactive", 409);
    }

    /*
     * Physical room must currently
     * be ready for occupation.
     */
    if (booking.room_status !== "available") {
      throw createError(
        `Room cannot be checked in because its current status is ${booking.room_status}`,
        409,
      );
    }

    /*
     * Update booking.
     *
     * Our PostgreSQL trigger automatically
     * writes to booking_status_history.
     */
    await client.query(
      `
        UPDATE bookings

        SET
          status = 'checked_in',
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
      `,
      [bookingId],
    );

    /*
     * Room is now physically occupied.
     */
    await client.query(
      `
        UPDATE rooms

        SET
          status = 'occupied',
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
      `,
      [booking.room_id],
    );

    const checkedInBooking = await selectBookingById(client, bookingId);

    await client.query("COMMIT");

    return checkedInBooking;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

export const checkOutBooking = async (bookingId) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
          SELECT
            bookings.id,
            bookings.status,
            bookings.room_id,
            bookings.total_amount,

            rooms.status
              AS room_status,

            COALESCE(
              booking_payment_summary.remaining_balance,
              bookings.total_amount
            ) AS remaining_balance

          FROM bookings

          INNER JOIN rooms
            ON bookings.room_id =
               rooms.id

          LEFT JOIN booking_payment_summary
            ON bookings.id =
               booking_payment_summary.booking_id

          WHERE bookings.id = $1

          FOR UPDATE OF bookings, rooms
        `,
      [bookingId],
    );

    if (result.rows.length === 0) {
      throw createError("Booking not found", 404);
    }

    const booking = result.rows[0];

    if (booking.status !== "checked_in") {
      throw createError("Only checked-in bookings can be checked out", 409);
    }

    /*
     * Prevent checkout when payment
     * balance remains.
     */
    if (Number(booking.remaining_balance) > 0) {
      throw createError(
        `Booking has a remaining balance of ${Number(
          booking.remaining_balance,
        ).toFixed(2)}`,
        409,
      );
    }

    await client.query(
      `
        UPDATE bookings

        SET
          status = 'checked_out',
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
      `,
      [bookingId],
    );

    /*
     * Guest has left.
     *
     * Room is not immediately available because
     * housekeeping must clean it first.
     */
    await client.query(
      `
        UPDATE rooms

        SET
          status = 'cleaning',
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
      `,
      [booking.room_id],
    );

    const checkedOutBooking = await selectBookingById(client, bookingId);

    await client.query("COMMIT");

    return checkedOutBooking;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

export const findBookingStatusHistory = async (bookingId) => {
  const result = await pool.query(
    `
          SELECT
            id,
            booking_id,
            old_status,
            new_status,
            changed_at

          FROM booking_status_history

          WHERE booking_id = $1

          ORDER BY
            changed_at ASC,
            id ASC
        `,
    [bookingId],
  );

  return result.rows;
};