import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page">
      <section className="not-found">
        <div className="container">
          <div className="not-found-content">
            <span className="section-label">Error 404</span>

            <h1>Page not found</h1>

            <p>
              The page you're looking for doesn't exist or may have been moved.
            </p>

            <Link to="/" className="btn btn-primary">
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default NotFound;
