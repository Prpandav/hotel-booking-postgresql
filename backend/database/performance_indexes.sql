-- Composite and covering index for customer booking history.
CREATE INDEX IF NOT EXISTS
bookings_customer_created_idx

ON bookings (
    customer_id,
    created_at DESC
)

INCLUDE (
    status,
    total_amount,
    check_in_date,
    check_out_date
);


-- Useful for status and date-filtered booking searches.
CREATE INDEX IF NOT EXISTS
bookings_status_checkin_idx

ON bookings (
    status,
    check_in_date,
    check_out_date
)

INCLUDE (
    room_id,
    customer_id,
    total_amount
);


-- Payment balance and payment-history queries.
CREATE INDEX IF NOT EXISTS
payments_booking_status_idx

ON payments (
    booking_id,
    status,
    paid_at DESC
)

INCLUDE (
    amount
);


-- Only active rooms are indexed.
CREATE INDEX IF NOT EXISTS
rooms_active_type_status_idx

ON rooms (
    room_type_id,
    status
)

WHERE is_active = TRUE;


-- Status-history timeline.
CREATE INDEX IF NOT EXISTS
booking_history_timeline_idx

ON booking_status_history (
    booking_id,
    changed_at DESC
);


-- Expression index for case-insensitive email lookup.
CREATE INDEX IF NOT EXISTS
customers_lower_email_idx

ON customers (
    LOWER(email)
);


ANALYZE customers;
ANALYZE rooms;
ANALYZE bookings;
ANALYZE payments;
ANALYZE booking_status_history;