import {
  searchBookings,
  searchCustomers,
} from "../repositories/searchRepository.js";

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

export const globalSearch = async (req, res, next) => {
  try {
    const searchText = req.query.q?.trim();

    if (!searchText || searchText.length < 2) {
      throw createError("Search query must contain at least 2 characters");
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [customers, bookings] = await Promise.all([
      searchCustomers(searchText, limit),

      searchBookings(searchText, limit),
    ]);

    res.status(200).json({
      query: searchText,

      results: {
        customers,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};
