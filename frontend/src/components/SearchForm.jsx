import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { checkIn, checkOut, guests } = formData;

    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");

      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out date must be after check-in date.");

      return;
    }

    if (Number(guests) < 1) {
      setError("At least one guest is required.");

      return;
    }

    const searchParams = new URLSearchParams({
      checkIn,
      checkOut,
      guests,
    });

    navigate(`/rooms?${searchParams.toString()}`);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-form-grid">
        <div className="form-group">
          <label htmlFor="checkIn">Check In</label>

          <input
            id="checkIn"
            type="date"
            name="checkIn"
            value={formData.checkIn}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="checkOut">Check Out</label>

          <input
            id="checkOut"
            type="date"
            name="checkOut"
            value={formData.checkOut}
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
            max="20"
            value={formData.guests}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary search-button">
          Search Rooms
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

export default SearchForm;
