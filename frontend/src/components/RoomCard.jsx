import { Link } from "react-router-dom";

function RoomCard({ room, checkIn, checkOut, guests }) {
  const searchParams = new URLSearchParams({
    checkIn,
    checkOut,
    guests,
  });

  return (
    <article className="room-card">
      <div className="room-card-image">
        <span>
          {room.room_number ? `Room ${room.room_number}` : "Hotel Room"}
        </span>
      </div>

      <div className="room-card-content">
        <div className="room-card-header">
          <div>
            <span className="room-type-label">
              {room.room_type_name || room.room_type || "Room"}
            </span>

            <h3>
              {room.name || room.room_type_name || `Room ${room.room_number}`}
            </h3>
          </div>

          {room.base_price && (
            <div className="room-price">
              <strong>₹{Number(room.base_price).toLocaleString("en-IN")}</strong>

              <span>/ night</span>
            </div>
          )}
        </div>

        <div className="room-meta">
          {room.room_number && <span>Room {room.room_number}</span>}

          {room.capacity && <span>Up to {room.capacity} guests</span>}
        </div>

        {room.amenities && Array.isArray(room.amenities) && (
          <div className="room-amenities">
            {room.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>
        )}

        <Link
          to={`/rooms/${room.id}?` + searchParams.toString()}
          className="btn btn-outline room-card-button"
        >
          View Room
        </Link>
      </div>
    </article>
  );
}

export default RoomCard;
