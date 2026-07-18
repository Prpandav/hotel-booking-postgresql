import { useEffect, useState } from "react";

import { Link, useParams, useSearchParams } from "react-router-dom";

import { getRoomById } from "../api/roomApi";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate, calculateNights } from "../utils/dateUtils";
import { unwrapEntity } from "../utils/apiUtils";

function RoomDetails() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const checkIn = searchParams.get("checkIn");

  const checkOut = searchParams.get("checkOut");

  const guests = searchParams.get("guests");

  const [room, setRoom] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const nights = calculateNights(checkIn, checkOut);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await getRoomById(id);

        /*
        Possible backend responses:

        response = {
          id: 1,
          room_number: "101"
        }

        OR

        response = {
          success: true,
          data: {...}
        }
        */

        const roomData = unwrapEntity(response, "room");
        
        setRoom(roomData);
      } catch (error) {
        console.error("Failed to fetch room:", error);

        setError(
          error.response?.data?.message || "Unable to load room details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <Loading message="Loading room details..." />
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <ErrorMessage message={error} />
          </div>
        </section>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h1>Room not found</h1>

              <Link to="/rooms" className="btn btn-primary">
                Back to Rooms
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const bookingParams = new URLSearchParams();

  if (checkIn) {
    bookingParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    bookingParams.set("checkOut", checkOut);
  }

  if (guests) {
    bookingParams.set("guests", guests);
  }

  return (
    <div className="page">
      <section className="room-details-section">
        <div className="container">
          <Link
            to={
              checkIn && checkOut && guests
                ? `/rooms?${bookingParams.toString()}`
                : "/rooms"
            }
            className="room-back-link"
          >
            ← Back to rooms
          </Link>

          <div className="room-details-grid">
            <div className="room-details-image">
              <div className="room-image-placeholder">
                <span>
                  {room.room_number
                    ? `Room ${room.room_number}`
                    : "StayEase Room"}
                </span>
              </div>
            </div>

            <div className="room-details-content">
              <span className="section-label">
                {room.room_type_name || room.room_type || "Hotel Room"}
              </span>

              <h1>
                {room.name || room.room_type_name || `Room ${room.room_number}`}
              </h1>

              {room.description && (
                <p className="room-description">{room.description}</p>
              )}

              <div className="room-details-info">
                {room.room_number && (
                  <div className="room-info-item">
                    <span>Room Number</span>

                    <strong>{room.room_number}</strong>
                  </div>
                )}

                {room.capacity && (
                  <div className="room-info-item">
                    <span>Capacity</span>

                    <strong>Up to {room.capacity} guests</strong>
                  </div>
                )}

                {(room.base_price || room.price) && (
                  <div className="room-info-item">
                    <span>Price</span>

                    <strong>₹{room.base_price || room.price} / night</strong>
                  </div>
                )}
              </div>

              {room.amenities && Array.isArray(room.amenities) && (
                <div className="room-details-amenities">
                  <h3>Amenities</h3>

                  <div className="amenities-list">
                    {room.amenities.map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                </div>
              )}

              {checkIn && checkOut && guests && (
                <div className="selected-stay">
                  <h3>Your Stay</h3>

                  <div className="selected-stay-grid">
                    <div>
                      <span>Check In</span>

                      <strong>{formatDate(checkIn)}</strong>
                    </div>

                    <div>
                      <span>Check Out</span>

                      <strong>{formatDate(checkOut)}</strong>
                    </div>

                    <div>
                      <span>Nights</span>

                      <strong>{nights}</strong>
                    </div>

                    <div>
                      <span>Guests</span>

                      <strong>{guests}</strong>
                    </div>
                  </div>
                </div>
              )}

              <Link
                to={`/book/${room.id}?` + bookingParams.toString()}
                className="btn btn-primary room-book-button"
              >
                Book This Room
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RoomDetails;
