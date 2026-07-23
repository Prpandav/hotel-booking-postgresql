BEGIN;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'hotel_readonly'
    ) THEN
        CREATE ROLE hotel_readonly NOLOGIN;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'hotel_analytics'
    ) THEN
        CREATE ROLE hotel_analytics NOLOGIN;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'hotel_customer'
    ) THEN
        CREATE ROLE hotel_customer NOLOGIN;
    END IF;
END
$$;


GRANT CONNECT
ON DATABASE hotel_booking
TO
    hotel_readonly,
    hotel_analytics,
    hotel_customer;


GRANT USAGE
ON SCHEMA public
TO
    hotel_readonly,
    hotel_analytics,
    hotel_customer;


GRANT SELECT
ON ALL TABLES
IN SCHEMA public
TO hotel_readonly;


GRANT SELECT
ON
    room_performance_view,
    customer_value_view,
    booking_payment_summary,
    monthly_completed_revenue_mv
TO hotel_analytics;


GRANT SELECT
ON
    bookings,
    payments,
    rooms,
    room_types
TO hotel_customer;


-- Allow the development application role
-- to test customer policies.
GRANT hotel_customer
TO hotel_app;


ALTER TABLE bookings
ENABLE ROW LEVEL SECURITY;


ALTER TABLE payments
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
hotel_customer_own_bookings
ON bookings;


CREATE POLICY
hotel_customer_own_bookings

ON bookings

FOR SELECT

TO hotel_customer

USING (
    customer_id =
    NULLIF(
        CURRENT_SETTING(
            'app.customer_id',
            TRUE
        ),
        ''
    )::BIGINT
);


DROP POLICY IF EXISTS
hotel_customer_own_payments
ON payments;


CREATE POLICY
hotel_customer_own_payments

ON payments

FOR SELECT

TO hotel_customer

USING (
    EXISTS (
        SELECT 1

        FROM bookings

        WHERE bookings.id =
              payments.booking_id

          AND bookings.customer_id =
              NULLIF(
                  CURRENT_SETTING(
                      'app.customer_id',
                      TRUE
                  ),
                  ''
              )::BIGINT
    )
);


COMMIT;