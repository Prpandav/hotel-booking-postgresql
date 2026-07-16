BEGIN;

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    phone VARCHAR(20) UNIQUE,

    preferences JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS room_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    base_price NUMERIC(10, 2) NOT NULL,

    capacity SMALLINT NOT NULL,

    amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT room_types_base_price_positive
        CHECK (base_price > 0),

    CONSTRAINT room_types_capacity_valid
        CHECK (capacity BETWEEN 1 AND 10)
);


CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    room_number VARCHAR(10) NOT NULL UNIQUE,

    room_type_id BIGINT NOT NULL,

    floor_number SMALLINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'available',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT rooms_room_type_fk
        FOREIGN KEY (room_type_id)
        REFERENCES room_types(id)
        ON DELETE RESTRICT,

    CONSTRAINT rooms_floor_number_valid
        CHECK (floor_number >= 0),

    CONSTRAINT rooms_status_valid
        CHECK (
            status IN (
                'available',
                'occupied',
                'maintenance',
                'cleaning'
            )
        )
);

COMMIT;