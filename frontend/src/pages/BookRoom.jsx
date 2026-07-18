import { useEffect, useState } from "react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getRoomById } from "../api/roomApi";

import { createCustomer } from "../api/customerApi";

import { createBooking } from "../api/bookingApi";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate, calculateNights } from "../utils/dateUtils";
import { unwrapEntity } from "../utils/apiUtils";

function BookRoom() {
  const { roomId } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const checkIn = searchParams.get("checkIn");

  const checkOut = searchParams.get("checkOut");

  const guestsFromUrl = searchParams.get("guests");

  const [room, setRoom] = useState(null);

  const [loadingRoom, setLoadingRoom] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    guests: guestsFromUrl || 1,
    specialRequests: "",
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoadingRoom(true);

        const response = await getRoomById(roomId);

        const roomData = unwrapEntity(response, "room");

        setRoom(roomData);
      } catch (error) {
        console.error("Failed to load room:", error);

        setError(
          error.response?.data?.message || "Unable to load room information.",
        );
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return "Full name is required.";
    }

    if (!formData.email.trim()) {
      return "Email is required.";
    }

    if (!formData.phone.trim()) {
      return "Phone number is required.";
    }

    if (!checkIn || !checkOut) {
      return "Booking dates are missing.";
    }

    if (checkOut <= checkIn) {
      return "Check-out date must be after check-in date.";
    }

    if (Number(formData.guests) < 1) {
      return "At least one guest is required.";
    }

    if (room?.capacity && Number(formData.guests) > Number(room.capacity)) {
      return `This room allows a maximum of ${room.capacity} guests.`;
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    try {
      setSubmitting(true);

      setError("");

      /*
      |--------------------------------------------------------------------------
      | Step 1: Create Customer
      |--------------------------------------------------------------------------
      */

      const customerResponse = await createCustomer({
        full_name: formData.fullName.trim(),

        email: formData.email.trim(),

        phone: formData.phone.trim(),
      });

      const customer = unwrapEntity(customerResponse, "customer");

      const customerId = customer.id;

      if (!customerId) {
        throw new Error("Customer ID was not returned by the server.");
      }

      /*
      |--------------------------------------------------------------------------
      | Step 2: Create Booking
      |--------------------------------------------------------------------------
      */

      const bookingResponse = await createBooking({
        customer_id: customerId,

        room_id: Number(roomId),

        check_in_date: checkIn,

        check_out_date: checkOut,

        guests: Number(formData.guests),

        special_requests: formData.specialRequests.trim() || null,
      });

      const booking = unwrapEntity(bookingResponse, "booking");

      const bookingId = booking.id;

      if (!bookingId) {
        throw new Error("Booking ID was not returned by the server.");
      }

      /*
      |--------------------------------------------------------------------------
      | Step 3: Go to Booking Details
      |--------------------------------------------------------------------------
      */

      navigate(`/bookings/${bookingId}`);
    } catch (error) {
      console.error("Booking failed:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to complete booking.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <Loading message="Preparing your booking..." />
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
            <ErrorMessage message={error || "Room not found."} />
          </div>
        </section>
      </div>
    );
  }

  const nights = calculateNights(checkIn, checkOut);

  const pricePerNight = Number(room.base_price || room.price || 0);

  const estimatedTotal = nights * pricePerNight;

  return (
    <div className="page">
      <section className="booking-section">
        <div className="container">
          <div className="booking-header">
            <span className="section-label">Complete Reservation</span>

            <h1>Book your stay</h1>

            <p>Enter your details below to complete the reservation.</p>
          </div>

          <div className="booking-layout">
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="booking-form-section">
                <h2>Guest Information</h2>

                <div className="booking-form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="fullName">Full Name</label>

                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="+91..."
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="guests">Guests</label>

                    <input
                      id="guests"
                      type="number"
                      name="guests"
                      min="1"
                      max={room.capacity || 20}
                      value={formData.guests}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="specialRequests">Special Requests</label>

                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      rows="4"
                      placeholder="Any special requests?"
                      value={formData.specialRequests}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="booking-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary booking-submit-button"
                disabled={submitting}
              >
                {submitting ? "Creating Booking..." : "Confirm Booking"}
              </button>
            </form>

            <aside className="booking-summary">
              <span className="section-label">Booking Summary</span>

              <h2>
                {room.room_type_name || room.name || `Room ${room.room_number}`}
              </h2>

              {room.room_number && (
                <p className="booking-room-number">Room {room.room_number}</p>
              )}

              <div className="booking-summary-details">
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

                  <strong>{formData.guests}</strong>
                </div>

                {(room.base_price || room.price) && (
                  <div>
                    <span>Price Per Night</span>

                    <strong>₹{room.base_price || room.price}</strong>
                  </div>
                )}

                <div>
                  <span>Nights</span>

                  <strong>{nights}</strong>
                </div>
              </div>

              <p className="booking-summary-note">
                The final booking amount will be calculated by the backend based
                on your stay.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookRoom;
