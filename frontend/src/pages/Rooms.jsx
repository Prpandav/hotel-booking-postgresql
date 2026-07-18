import { useEffect, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import { getAvailableRooms } from "../api/bookingApi";

import RoomCard from "../components/RoomCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

function Rooms() {
  const [searchParams] = useSearchParams();

  const checkIn = searchParams.get("checkIn");

  const checkOut = searchParams.get("checkOut");

  const guests = searchParams.get("guests");

  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      if (!checkIn || !checkOut || !guests) {
        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        const response = await getAvailableRooms({
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
        });

        /*
        Possible backend responses:

        response = [...]

        OR

        response = {
          data: [...]
        }

        OR

        response = {
          success: true,
          data: [...]
        }
        */

        const roomData = Array.isArray(response)
          ? response
          : response.data || [];

        setRooms(roomData);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);

        setError(
          error.response?.data?.message || "Unable to load available rooms.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [checkIn, checkOut, guests]);

  if (!checkIn || !checkOut || !guests) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h1>Search for available rooms</h1>

              <p>Select your travel dates and number of guests first.</p>

              <Link to="/" className="btn btn-primary">
                Search Rooms
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="rooms-section">
        <div className="container">
          <div className="rooms-page-header">
            <div>
              <span className="section-label">Your Search</span>

              <h1>Available Rooms</h1>

              <p>
                {checkIn}
                {" → "}
                {checkOut}
                {" · "}
                {guests}
                {Number(guests) === 1 ? " guest" : " guests"}
              </p>
            </div>

            <Link to="/" className="btn btn-outline">
              Change Search
            </Link>
          </div>

          {loading && <Loading message="Checking available rooms..." />}

          {!loading && error && <ErrorMessage message={error} />}

          {!loading && !error && rooms.length === 0 && (
            <div className="empty-state">
              <h2>No rooms available</h2>

              <p>
                We couldn't find rooms matching your selected dates and guest
                count.
              </p>

              <Link to="/" className="btn btn-primary">
                Try Different Dates
              </Link>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Rooms;
