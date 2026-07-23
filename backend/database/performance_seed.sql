BEGIN;

-- Ensure room types exist.
INSERT INTO room_types (
    name,
    description,
    base_price,
    capacity,
    amenities
)
VALUES
(
    'Standard',
    'Standard benchmark room',
    2000.00,
    2,
    ARRAY['WiFi', 'AC', 'TV']
),
(
    'Deluxe',
    'Deluxe benchmark room',
    3500.00,
    3,
    ARRAY['WiFi', 'AC', 'TV', 'Mini Fridge']
),
(
    'Suite',
    'Suite benchmark room',
    6500.00,
    4,
    ARRAY['WiFi', 'AC', 'TV', 'Living Area']
)
ON CONFLICT (name) DO NOTHING;


-- Generate 5,000 customers.
INSERT INTO customers (
    full_name,
    email,
    phone,
    preferences
)
SELECT
    'Performance Customer ' || series_number,

    'performance.customer.'
        || series_number
        || '@example.com',

    NULL,

    JSONB_BUILD_OBJECT(
        'preferred_floor',
        series_number % 10,

        'bed_type',
        CASE
            WHEN series_number % 2 = 0
                THEN 'king'
            ELSE 'queen'
        END,

        'smoking_room',
        FALSE
    )

FROM GENERATE_SERIES(
    1,
    5000
) AS series_number

ON CONFLICT (email) DO NOTHING;


-- Generate 200 rooms.
WITH available_types AS (
    SELECT
        ARRAY_AGG(
            id ORDER BY id
        ) AS room_type_ids

    FROM room_types
),

generated_rooms AS (
    SELECT
        'B'
            || LPAD(
                series_number::TEXT,
                4,
                '0'
            ) AS room_number,

        room_type_ids[
            1
            +
            (
                (
                    series_number - 1
                )
                %
                ARRAY_LENGTH(
                    room_type_ids,
                    1
                )
            )
        ] AS room_type_id,

        (
            (
                series_number - 1
            )
            / 20
        ) + 1 AS floor_number

    FROM GENERATE_SERIES(
        1,
        200
    ) AS series_number

    CROSS JOIN available_types
)

INSERT INTO rooms (
    room_number,
    room_type_id,
    floor_number,
    status
)
SELECT
    room_number,
    room_type_id,
    floor_number,
    'available'

FROM generated_rooms

ON CONFLICT (room_number) DO NOTHING;


-- Generate historical non-overlapping bookings.
WITH benchmark_customers AS (
    SELECT
        ARRAY_AGG(
            id ORDER BY id
        ) AS customer_ids

    FROM customers

    WHERE email LIKE
        'performance.customer.%@example.com'
),

benchmark_rooms AS (
    SELECT
        rooms.id,
        room_types.base_price,

        ROW_NUMBER() OVER (
            ORDER BY rooms.id
        ) AS room_position

    FROM rooms

    INNER JOIN room_types
        ON rooms.room_type_id =
           room_types.id

    WHERE rooms.room_number LIKE 'B%'
),

generated_bookings AS (
    SELECT
        benchmark_rooms.id AS room_id,

        customer_ids[
            1
            +
            (
                (
                    benchmark_rooms.room_position
                    + booking_slot
                )
                %
                ARRAY_LENGTH(
                    customer_ids,
                    1
                )
            )
        ] AS customer_id,

        (
            CURRENT_DATE
            - 420
            + booking_slot * 8
        )::DATE AS check_in_date,

        (
            CURRENT_DATE
            - 420
            + booking_slot * 8
            + 2
            + booking_slot % 3
        )::DATE AS check_out_date,

        benchmark_rooms.base_price,

        booking_slot

    FROM benchmark_rooms

    CROSS JOIN GENERATE_SERIES(
        0,
        29
    ) AS booking_slot

    CROSS JOIN benchmark_customers
)

INSERT INTO bookings (
    customer_id,
    room_id,
    check_in_date,
    check_out_date,
    adults,
    children,
    price_per_night,
    total_amount,
    status,
    special_requests
)
SELECT
    customer_id,
    room_id,
    check_in_date,
    check_out_date,
    1,
    0,
    base_price,

    (
        check_out_date
        - check_in_date
    ) * base_price,

    CASE
        WHEN booking_slot % 8 = 0
            THEN 'cancelled'
        ELSE 'checked_out'
    END,

    'PERFORMANCE_SEED'

FROM generated_bookings

WHERE NOT EXISTS (
    SELECT 1

    FROM bookings existing_booking

    WHERE existing_booking.room_id =
          generated_bookings.room_id

      AND existing_booking.check_in_date =
          generated_bookings.check_in_date

      AND existing_booking.special_requests =
          'PERFORMANCE_SEED'
);


-- Generate future active bookings.
WITH benchmark_customers AS (
    SELECT
        ARRAY_AGG(
            id ORDER BY id
        ) AS customer_ids

    FROM customers

    WHERE email LIKE
        'performance.customer.%@example.com'
),

benchmark_rooms AS (
    SELECT
        rooms.id,
        room_types.base_price,

        ROW_NUMBER() OVER (
            ORDER BY rooms.id
        ) AS room_position

    FROM rooms

    INNER JOIN room_types
        ON rooms.room_type_id =
           room_types.id

    WHERE rooms.room_number LIKE 'B%'
),

generated_bookings AS (
    SELECT
        benchmark_rooms.id AS room_id,

        customer_ids[
            1
            +
            (
                (
                    benchmark_rooms.room_position
                    + booking_slot
                    + 1000
                )
                %
                ARRAY_LENGTH(
                    customer_ids,
                    1
                )
            )
        ] AS customer_id,

        (
            CURRENT_DATE
            + 14
            + booking_slot * 8
        )::DATE AS check_in_date,

        (
            CURRENT_DATE
            + 17
            + booking_slot * 8
        )::DATE AS check_out_date,

        benchmark_rooms.base_price,

        booking_slot

    FROM benchmark_rooms

    CROSS JOIN GENERATE_SERIES(
        0,
        9
    ) AS booking_slot

    CROSS JOIN benchmark_customers
)

INSERT INTO bookings (
    customer_id,
    room_id,
    check_in_date,
    check_out_date,
    adults,
    children,
    price_per_night,
    total_amount,
    status,
    special_requests
)
SELECT
    customer_id,
    room_id,
    check_in_date,
    check_out_date,
    1,
    0,
    base_price,

    (
        check_out_date
        - check_in_date
    ) * base_price,

    CASE
        WHEN booking_slot % 3 = 0
            THEN 'pending'
        ELSE 'confirmed'
    END,

    'PERFORMANCE_SEED'

FROM generated_bookings

WHERE NOT EXISTS (
    SELECT 1

    FROM bookings existing_booking

    WHERE existing_booking.room_id =
          generated_bookings.room_id

      AND existing_booking.check_in_date =
          generated_bookings.check_in_date

      AND existing_booking.special_requests =
          'PERFORMANCE_SEED'
);


-- Generate payments for completed and confirmed bookings.
INSERT INTO payments (
    booking_id,
    amount,
    payment_method,
    status,
    transaction_reference,
    paid_at
)
SELECT
    bookings.id,
    bookings.total_amount,
    'card',
    'successful',
    'PERFORMANCE-PAYMENT-'
        || bookings.id,
    CURRENT_TIMESTAMP

FROM bookings

WHERE bookings.special_requests =
      'PERFORMANCE_SEED'

  AND bookings.status IN (
      'checked_out',
      'confirmed'
  )

ON CONFLICT (
    transaction_reference
) DO NOTHING;


COMMIT;


ANALYZE customers;
ANALYZE rooms;
ANALYZE bookings;
ANALYZE payments;