BEGIN;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS search_document TSVECTOR
GENERATED ALWAYS AS (
    SETWEIGHT(
        TO_TSVECTOR(
            'simple',
            COALESCE(full_name, '')
        ),
        'A'
    )
    ||
    SETWEIGHT(
        TO_TSVECTOR(
            'simple',
            COALESCE(email, '')
        ),
        'B'
    )
    ||
    SETWEIGHT(
        TO_TSVECTOR(
            'simple',
            COALESCE(phone, '')
        ),
        'C'
    )
) STORED;


ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS search_document TSVECTOR
GENERATED ALWAYS AS (
    SETWEIGHT(
        TO_TSVECTOR(
            'simple',
            COALESCE(special_requests, '')
        ),
        'A'
    )
) STORED;


CREATE INDEX IF NOT EXISTS
customers_search_document_gin_idx
ON customers
USING GIN(search_document);


CREATE INDEX IF NOT EXISTS
bookings_search_document_gin_idx
ON bookings
USING GIN(search_document);


ANALYZE customers;
ANALYZE bookings;

COMMIT;