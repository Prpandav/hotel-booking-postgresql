-- PostgreSQL views and materialized views will be added here.
CREATE OR REPLACE VIEW booking_payment_summary AS

WITH payment_totals AS (

    SELECT
        booking_id,

        SUM(amount) FILTER (
            WHERE status IN (
                'successful',
                'partially_refunded',
                'refunded'
            )
        ) AS gross_paid

    FROM payments

    GROUP BY booking_id
),

refund_totals AS (

    SELECT
        payments.booking_id,

        SUM(payment_refunds.amount)
            AS total_refunded

    FROM payment_refunds

    INNER JOIN payments
        ON payment_refunds.payment_id =
           payments.id

    GROUP BY payments.booking_id
)

SELECT
    bookings.id AS booking_id,

    bookings.booking_code,

    bookings.total_amount,

    COALESCE(
        payment_totals.gross_paid,
        0
    )::NUMERIC(12, 2)
        AS gross_paid,

    COALESCE(
        refund_totals.total_refunded,
        0
    )::NUMERIC(12, 2)
        AS total_refunded,

    (
        COALESCE(
            payment_totals.gross_paid,
            0
        )
        -
        COALESCE(
            refund_totals.total_refunded,
            0
        )
    )::NUMERIC(12, 2)
        AS net_paid,

    GREATEST(
        bookings.total_amount
        -
        (
            COALESCE(
                payment_totals.gross_paid,
                0
            )
            -
            COALESCE(
                refund_totals.total_refunded,
                0
            )
        ),
        0
    )::NUMERIC(12, 2)
        AS remaining_balance,

    CASE

        WHEN (
            COALESCE(
                payment_totals.gross_paid,
                0
            )
            -
            COALESCE(
                refund_totals.total_refunded,
                0
            )
        ) <= 0

        THEN 'unpaid'

        WHEN (
            COALESCE(
                payment_totals.gross_paid,
                0
            )
            -
            COALESCE(
                refund_totals.total_refunded,
                0
            )
        ) < bookings.total_amount

        THEN 'partially_paid'

        ELSE 'paid'

    END AS payment_status

FROM bookings

LEFT JOIN payment_totals
    ON bookings.id =
       payment_totals.booking_id

LEFT JOIN refund_totals
    ON bookings.id =
       refund_totals.booking_id;