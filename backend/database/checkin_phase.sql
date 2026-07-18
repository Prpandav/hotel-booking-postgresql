BEGIN;


CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    old_status VARCHAR(20),

    new_status VARCHAR(20) NOT NULL,

    changed_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT booking_status_history_booking_fk
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE RESTRICT
);


CREATE INDEX IF NOT EXISTS
booking_status_history_booking_id_idx
ON booking_status_history(booking_id);


COMMIT;