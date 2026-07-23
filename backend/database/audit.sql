BEGIN;


CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT
        GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

    table_name TEXT NOT NULL,

    record_id TEXT,

    operation VARCHAR(10) NOT NULL,

    old_data JSONB,

    new_data JSONB,

    changed_by TEXT
        NOT NULL
        DEFAULT CURRENT_USER,

    changed_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT audit_operation_valid
        CHECK (
            operation IN (
                'INSERT',
                'UPDATE',
                'DELETE'
            )
        )
);


CREATE INDEX IF NOT EXISTS
audit_logs_table_record_idx
ON audit_logs(
    table_name,
    record_id
);


CREATE INDEX IF NOT EXISTS
audit_logs_changed_at_idx
ON audit_logs(
    changed_at DESC
);


CREATE INDEX IF NOT EXISTS
audit_logs_old_data_gin_idx
ON audit_logs
USING GIN(old_data);


CREATE INDEX IF NOT EXISTS
audit_logs_new_data_gin_idx
ON audit_logs
USING GIN(new_data);


CREATE OR REPLACE FUNCTION
record_audit_log()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

DECLARE
    audit_record_id TEXT;
BEGIN

    IF TG_OP = 'INSERT' THEN

        audit_record_id =
            TO_JSONB(NEW) ->> 'id';

        INSERT INTO audit_logs (
            table_name,
            record_id,
            operation,
            old_data,
            new_data
        )
        VALUES (
            TG_TABLE_NAME,
            audit_record_id,
            TG_OP,
            NULL,
            TO_JSONB(NEW)
        );

        RETURN NEW;


    ELSIF TG_OP = 'UPDATE' THEN

        audit_record_id =
            TO_JSONB(NEW) ->> 'id';

        INSERT INTO audit_logs (
            table_name,
            record_id,
            operation,
            old_data,
            new_data
        )
        VALUES (
            TG_TABLE_NAME,
            audit_record_id,
            TG_OP,
            TO_JSONB(OLD),
            TO_JSONB(NEW)
        );

        RETURN NEW;


    ELSIF TG_OP = 'DELETE' THEN

        audit_record_id =
            TO_JSONB(OLD) ->> 'id';

        INSERT INTO audit_logs (
            table_name,
            record_id,
            operation,
            old_data,
            new_data
        )
        VALUES (
            TG_TABLE_NAME,
            audit_record_id,
            TG_OP,
            TO_JSONB(OLD),
            NULL
        );

        RETURN OLD;

    END IF;

    RETURN NULL;

END;

$$;


DROP TRIGGER IF EXISTS
customers_audit_trigger
ON customers;

CREATE TRIGGER customers_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON customers
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();


DROP TRIGGER IF EXISTS
rooms_audit_trigger
ON rooms;

CREATE TRIGGER rooms_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON rooms
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();


DROP TRIGGER IF EXISTS
bookings_audit_trigger
ON bookings;

CREATE TRIGGER bookings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON bookings
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();


DROP TRIGGER IF EXISTS
payments_audit_trigger
ON payments;

CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON payments
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();


DROP TRIGGER IF EXISTS
payment_refunds_audit_trigger
ON payment_refunds;

CREATE TRIGGER payment_refunds_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON payment_refunds
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();


COMMIT;