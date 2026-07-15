import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/rooms">Rooms</NavLink>
      <NavLink to="/bookings">Bookings</NavLink>
      <NavLink to="/customers">Customers</NavLink>
    </nav>
  );
}

export default Navbar;
