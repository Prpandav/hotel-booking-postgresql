import { useCallback, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { cancelBooking, getBookingById } from "../api/bookingApi";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate } from "../utils/dateUtils";
import { unwrapEntity } from "../utils/apiUtils";

function BookingDetails() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getBookingById(id);

      /*
        Possible responses:

        response = {...}

        OR

        response = {
          data: {...}
        }

        OR

        response = {
          data: {
            booking: {...}
          }
        }
        */

        const bookingData = unwrapEntity(response, "booking");

      setBooking(bookingData);
    } catch (error) {
      console.error("Failed to load booking:", error);

      setError(
        error.response?.data?.message || "Unable to load booking details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancelBooking = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      setError("");

      setSuccessMessage("");

      await cancelBooking(id);

      setSuccessMessage("Your booking has been cancelled successfully.");

      /*
        Fetch booking again so the
        new status appears in the UI.
        */

      await fetchBooking();
    } catch (error) {
      console.error("Failed to cancel booking:", error);

      setError(
        error.response?.data?.message || "Unable to cancel this booking.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <Loading message="Loading booking details..." />
          </div>
        </section>
      </div>
    );
  }

  if (error && !booking) {
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

  if (!booking) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h1>Booking not found</h1>

              <p>We could not find this booking.</p>

              <Link to="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const status = booking.status || "unknown";

  const isCancelled = status.toLowerCase() === "cancelled";

  return (
    <div className="page">
      <section className="booking-details-section">
        <div className="container">
          <div className="booking-details-header">
            <div>
              <span className="section-label">Reservation Details</span>

              <h1>Booking #{booking.id}</h1>

              <p>Review your reservation information below.</p>
            </div>

            <span
              className={`booking-status booking-status-${status.toLowerCase()}`}
            >
              {status}
            </span>
          </div>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {error && <div className="booking-error">{error}</div>}

          <div className="booking-details-layout">
            <div className="booking-details-card">
              <div className="booking-detail-section">
                <h2>Guest Information</h2>

                <div className="booking-detail-grid">
                  <div className="booking-detail-item">
                    <span>Full Name</span>

                    <strong>
                      {booking.customer_name ||
                        booking.full_name ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Email</span>

                    <strong>
                      {booking.email ||
                        booking.customer_email ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Phone</span>

                    <strong>
                      {booking.phone ||
                        booking.customer_phone ||
                        "Not available"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="booking-detail-section">
                <h2>Stay Information</h2>

                <div className="booking-detail-grid">
                  <div className="booking-detail-item">
                    <span>Room</span>

                    <strong>
                      {booking.room_number
                        ? `Room ${booking.room_number}`
                        : booking.room_id
                          ? `Room ID ${booking.room_id}`
                          : "Not available"}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Room Type</span>

                    <strong>
                      {booking.room_type_name ||
                        booking.room_type ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Guests</span>

                    <strong>
                      {booking.guests ||
                        booking.number_of_guests ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Check In</span>

                    <strong>
                      {formatDate(booking.check_in_date || booking.check_in)}
                    </strong>
                  </div>

                  <div className="booking-detail-item">
                    <span>Check Out</span>

                    <strong>
                      {formatDate(booking.check_out_date || booking.check_out)}
                    </strong>
                  </div>

                  {(booking.total_amount || booking.total_price) && (
                    <div className="booking-detail-item">
                      <span>Total Amount</span>

                      <strong>
                        ₹{Number(booking.total_amount || booking.total_price).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {booking.special_requests && (
                <div className="booking-detail-section">
                  <h2>Special Requests</h2>

                  <p className="special-request-text">
                    {booking.special_requests}
                  </p>
                </div>
              )}
            </div>

            <aside className="booking-actions-card">
              <span className="section-label">Booking Status</span>

              <h2>
                {isCancelled ? "Booking Cancelled" : "Reservation Confirmed"}
              </h2>

              <p>
                {isCancelled
                  ? "This reservation has been cancelled."
                  : "Your room reservation is currently active."}
              </p>

              {!isCancelled && (
                <button
                  type="button"
                  className="btn booking-cancel-button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}

              <Link to="/" className="btn btn-outline booking-home-button">
                Back to Home
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookingDetails;
