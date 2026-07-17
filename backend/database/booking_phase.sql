BEGIN;

-- Allows BIGINT equality checks inside a GiST exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;


CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    booking_code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

    customer_id BIGINT NOT NULL,

    room_id BIGINT NOT NULL,

    check_in_date DATE NOT NULL,

    check_out_date DATE NOT NULL,

    adults SMALLINT NOT NULL DEFAULT 1,

    children SMALLINT NOT NULL DEFAULT 0,

    price_per_night NUMERIC(10, 2) NOT NULL,

    total_amount NUMERIC(12, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    special_requests TEXT,

    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT bookings_customer_fk
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT,

    CONSTRAINT bookings_room_fk
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE RESTRICT,

    CONSTRAINT bookings_dates_valid
        CHECK (check_out_date > check_in_date),

    CONSTRAINT bookings_adults_valid
        CHECK (adults BETWEEN 1 AND 10),

    CONSTRAINT bookings_children_valid
        CHECK (children BETWEEN 0 AND 10),

    CONSTRAINT bookings_price_valid
        CHECK (price_per_night > 0),

    CONSTRAINT bookings_total_amount_valid
        CHECK (total_amount > 0),

    CONSTRAINT bookings_status_valid
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'checked_in',
                'checked_out',
                'cancelled'
            )
        )
);


-- Prevent two active bookings from occupying the same room
-- during overlapping date ranges.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_no_overlapping_stays'
    ) THEN
        ALTER TABLE bookings

        ADD CONSTRAINT bookings_no_overlapping_stays

        EXCLUDE USING GIST (
            room_id WITH =,

            daterange(
                check_in_date,
                check_out_date,
                '[)'
            ) WITH &&
        )

        WHERE (
            status IN (
                'pending',
                'confirmed',
                'checked_in'
            )
        );
    END IF;
END
$$;


CREATE INDEX IF NOT EXISTS bookings_customer_id_idx
    ON bookings(customer_id);


CREATE INDEX IF NOT EXISTS bookings_room_id_idx
    ON bookings(room_id);


CREATE INDEX IF NOT EXISTS bookings_status_idx
    ON bookings(status);


CREATE INDEX IF NOT EXISTS bookings_check_in_date_idx
    ON bookings(check_in_date);


CREATE INDEX IF NOT EXISTS bookings_active_dates_idx
    ON bookings(room_id, check_in_date, check_out_date)
    WHERE status IN (
        'pending',
        'confirmed',
        'checked_in'
    );

COMMIT;