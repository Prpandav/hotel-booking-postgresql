BEGIN;


CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'successful',

    transaction_reference VARCHAR(100)
        NOT NULL
        UNIQUE,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payments_booking_fk
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE RESTRICT,

    CONSTRAINT payments_amount_positive
        CHECK (amount > 0),

    CONSTRAINT payments_method_valid
        CHECK (
            payment_method IN (
                'cash',
                'card',
                'upi',
                'bank_transfer'
            )
        ),

    CONSTRAINT payments_status_valid
        CHECK (
            status IN (
                'pending',
                'successful',
                'failed',
                'partially_refunded',
                'refunded'
            )
        )
);


CREATE TABLE IF NOT EXISTS payment_refunds (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    payment_id BIGINT NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    reason TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT refunds_payment_fk
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT,

    CONSTRAINT refunds_amount_positive
        CHECK (amount > 0)
);


CREATE INDEX IF NOT EXISTS
payments_booking_id_idx

ON payments(booking_id);


CREATE INDEX IF NOT EXISTS
payments_status_idx

ON payments(status);


CREATE INDEX IF NOT EXISTS
payment_refunds_payment_id_idx

ON payment_refunds(payment_id);


COMMIT;