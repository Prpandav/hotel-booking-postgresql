import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import BookRoom from "./pages/BookRoom";
import BookingDetails from "./pages/BookingDetails";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/rooms" element={<Rooms />} />

          <Route path="/rooms/:id" element={<RoomDetails />} />

          <Route path="/book/:roomId" element={<BookRoom />} />

          <Route path="/bookings/:id" element={<BookingDetails />} />

          <Route path="/search" element={<SearchPage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
