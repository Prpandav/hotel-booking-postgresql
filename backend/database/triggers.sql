CREATE OR REPLACE FUNCTION
log_booking_status_change()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

    IF OLD.status IS DISTINCT FROM NEW.status THEN

        INSERT INTO booking_status_history (
            booking_id,
            old_status,
            new_status,
            changed_at
        )

        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CURRENT_TIMESTAMP
        );

    END IF;


    RETURN NEW;

END;

$$;


DROP TRIGGER IF EXISTS
booking_status_change_trigger
ON bookings;


CREATE TRIGGER
booking_status_change_trigger

AFTER UPDATE OF status

ON bookings

FOR EACH ROW

EXECUTE FUNCTION
log_booking_status_change();