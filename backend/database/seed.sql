BEGIN;

INSERT INTO customers (
    full_name,
    email,
    phone,
    preferences
)
VALUES
(
    'Amit Patel',
    'amit@example.com',
    '9876543210',
    '{
        "preferred_floor": 2,
        "bed_type": "king",
        "smoking_room": false
    }'::JSONB
),
(
    'Neha Shah',
    'neha@example.com',
    '9876543211',
    '{
        "preferred_floor": 1,
        "bed_type": "queen",
        "smoking_room": false
    }'::JSONB
),
(
    'Rahul Mehta',
    'rahul@example.com',
    NULL,
    '{}'::JSONB
)
ON CONFLICT (email) DO NOTHING;


INSERT INTO room_types (
    name,
    description,
    base_price,
    capacity,
    amenities
)
VALUES
(
    'Standard',
    'Comfortable room for one or two guests',
    2000.00,
    2,
    ARRAY['WiFi', 'AC', 'TV']
),
(
    'Deluxe',
    'Larger room with premium facilities',
    3500.00,
    3,
    ARRAY['WiFi', 'AC', 'TV', 'Mini Fridge']
),
(
    'Suite',
    'Luxury suite with living area',
    6500.00,
    4,
    ARRAY['WiFi', 'AC', 'TV', 'Mini Fridge', 'Living Area']
)
ON CONFLICT (name) DO NOTHING;


INSERT INTO rooms (
    room_number,
    room_type_id,
    floor_number,
    status
)
SELECT
    '101',
    id,
    1,
    'available'
FROM room_types
WHERE name = 'Standard'
ON CONFLICT (room_number) DO NOTHING;


INSERT INTO rooms (
    room_number,
    room_type_id,
    floor_number,
    status
)
SELECT
    '102',
    id,
    1,
    'available'
FROM room_types
WHERE name = 'Standard'
ON CONFLICT (room_number) DO NOTHING;


INSERT INTO rooms (
    room_number,
    room_type_id,
    floor_number,
    status
)
SELECT
    '201',
    id,
    2,
    'available'
FROM room_types
WHERE name = 'Deluxe'
ON CONFLICT (room_number) DO NOTHING;


INSERT INTO rooms (
    room_number,
    room_type_id,
    floor_number,
    status
)
SELECT
    '301',
    id,
    3,
    'maintenance'
FROM room_types
WHERE name = 'Suite'
ON CONFLICT (room_number) DO NOTHING;

COMMIT;