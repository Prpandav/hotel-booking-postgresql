import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          Stay<span>Ease</span>
        </Link>

        <nav className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            Home
          </NavLink>

          <NavLink
            to="/rooms"
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            Rooms
          </NavLink>

          <NavLink to="/search">Search</NavLink>
          
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
