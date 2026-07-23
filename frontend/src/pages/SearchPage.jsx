import { useState } from "react";
import api from "../services/api";

function SearchPage() {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState({
    customers: [],
    bookings: [],
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();

    if (query.trim().length < 2) {
      setError("Enter at least 2 characters");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/search", {
        params: {
          q: query,
        },
      });

      setResults(response.data.results);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>Search</h1>

      <form onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Customer, email, booking request..."
        />

        <button type="submit">Search</button>
      </form>

      {loading && <p>Searching...</p>}

      {error && <p role="alert">{error}</p>}

      <h2>Customers</h2>

      {results.customers.map((customer) => (
        <article key={customer.id}>
          <strong>{customer.full_name}</strong>

          <p>{customer.email}</p>
        </article>
      ))}

      <h2>Bookings</h2>

      {results.bookings.map((booking) => (
        <article key={booking.id}>
          <strong>{booking.booking_code}</strong>

          <p>
            {booking.customer_name} — Room {booking.room_number}
          </p>

          <p>{booking.special_requests || "No special request"}</p>
        </article>
      ))}
    </section>
  );
}

export default SearchPage;
