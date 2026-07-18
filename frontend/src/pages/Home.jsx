import SearchForm from "../components/SearchForm";

function Home() {
  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-label">Welcome to StayEase</span>

            <h1>Find your perfect stay, simply.</h1>

            <p>
              Discover comfortable rooms, simple booking, and a relaxing hotel
              experience.
            </p>
          </div>

          <div className="hero-search">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why StayEase</span>

            <h2 className="section-title">Simple stays. Better experiences.</h2>

            <p className="section-description">
              Everything you need for a comfortable hotel booking experience.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">01</div>

              <h3>Easy Search</h3>

              <p>
                Search available rooms using your travel dates and number of
                guests.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">02</div>

              <h3>Comfortable Rooms</h3>

              <p>
                Browse different room types, amenities, prices, and capacity.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">03</div>

              <h3>Simple Booking</h3>

              <p>Complete your reservation through a simple booking process.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
