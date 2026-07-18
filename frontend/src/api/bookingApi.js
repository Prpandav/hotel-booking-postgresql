import api from "./axios";

/*
|--------------------------------------------------------------------------
| Get Available Rooms
|--------------------------------------------------------------------------
*/

export const getAvailableRooms = async ({
  checkInDate,
  checkOutDate,
  guests,
}) => {
  const response = await api.get("/bookings/availability", {
    params: {
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      guests,
    },
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Single Booking
|--------------------------------------------------------------------------
*/

export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Create Booking
|--------------------------------------------------------------------------
*/

export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Cancel Booking
|--------------------------------------------------------------------------
*/

export const cancelBooking = async (bookingId) => {
  const response = await api.patch(`/bookings/${bookingId}/cancel`);

  return response.data;
};
