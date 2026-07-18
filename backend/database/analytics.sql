-- Analytics queries will be added here.
-- =====================================================
-- ROOM PERFORMANCE VIEW
-- =====================================================

CREATE OR REPLACE VIEW room_performance_view AS

SELECT
    rooms.id AS room_id,

    rooms.room_number,

    room_types.name AS room_type,

    room_types.base_price,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status <> 'cancelled'
        )
        AS total_bookings,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status = 'checked_out'
        )
        AS completed_stays,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status = 'cancelled'
        )
        AS cancelled_bookings,

    COALESCE(
        SUM(bookings.total_amount)
            FILTER (
                WHERE bookings.status = 'checked_out'
            ),
        0
    )::NUMERIC(12, 2)
        AS completed_booking_revenue,

    COALESCE(
        AVG(
            bookings.check_out_date
            -
            bookings.check_in_date
        )
        FILTER (
            WHERE bookings.status = 'checked_out'
        ),
        0
    )::NUMERIC(10, 2)
        AS average_stay_nights

FROM rooms

INNER JOIN room_types
    ON rooms.room_type_id =
       room_types.id

LEFT JOIN bookings
    ON rooms.id =
       bookings.room_id

GROUP BY
    rooms.id,
    rooms.room_number,
    room_types.name,
    room_types.base_price;


    -- =====================================================
-- CUSTOMER VALUE VIEW
-- =====================================================

CREATE OR REPLACE VIEW customer_value_view AS

SELECT
    customers.id AS customer_id,

    customers.full_name,

    customers.email,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status <> 'cancelled'
        )
        AS total_bookings,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status = 'checked_out'
        )
        AS completed_stays,

    COUNT(bookings.id)
        FILTER (
            WHERE bookings.status = 'cancelled'
        )
        AS cancelled_bookings,

    COALESCE(
        SUM(
            bookings.total_amount
        )
        FILTER (
            WHERE bookings.status = 'checked_out'
        ),
        0
    )::NUMERIC(12, 2)
        AS lifetime_booking_value,

    MAX(
        bookings.check_out_date
    ) FILTER (
        WHERE bookings.status = 'checked_out'
    )
        AS last_completed_stay

FROM customers

LEFT JOIN bookings
    ON customers.id =
       bookings.customer_id

GROUP BY
    customers.id,
    customers.full_name,
    customers.email;

    -- =====================================================
-- MONTHLY COMPLETED REVENUE MATERIALIZED VIEW
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS
monthly_completed_revenue_mv AS

SELECT

    DATE_TRUNC(
        'month',
        check_out_date
    )::DATE AS month,

    COUNT(*) AS completed_bookings,

    SUM(total_amount)::NUMERIC(14, 2)
        AS revenue,

    AVG(total_amount)::NUMERIC(12, 2)
        AS average_booking_value

FROM bookings

WHERE status = 'checked_out'

GROUP BY
    DATE_TRUNC(
        'month',
        check_out_date
    )

ORDER BY month;


CREATE UNIQUE INDEX IF NOT EXISTS
monthly_completed_revenue_month_idx

ON monthly_completed_revenue_mv(month);