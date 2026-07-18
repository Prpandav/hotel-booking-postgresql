import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  createBooking,
  findAllBookings,
  findAvailableRooms,
  findBookingById,
  findBookingStatusHistory,
  updateBookingDetails,
} from "../repositories/bookingRepository.js";

const bookingStatuses = new Set([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
]);

const bookingScopes = new Set([
  "upcoming",
  "current",
  "completed",
  "cancelled",
]);

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

const hasOwn = (object, key) => {
  return Object.prototype.hasOwnProperty.call(object, key);
};

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw createError(`${fieldName} must be a positive integer`);
  }

  return number;
};

const parseNonNegativeInteger = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw createError(`${fieldName} must be zero or a positive integer`);
  }

  return number;
};

const parsePrice = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw createError(`${fieldName} must be a valid positive number`);
  }

  return number;
};

const validateDate = (value, fieldName) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError(`${fieldName} must use YYYY-MM-DD format`);
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw createError(`${fieldName} is invalid`);
  }

  return value;
};

export const getBookings = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      if (!bookingStatuses.has(req.query.status)) {
        throw createError("Invalid booking status");
      }

      filters.status = req.query.status;
    }

    if (req.query.scope) {
      if (!bookingScopes.has(req.query.scope)) {
        throw createError(
          "scope must be upcoming, current, completed or cancelled",
        );
      }

      filters.scope = req.query.scope;
    }

    if (req.query.customer_id) {
      filters.customerId = parsePositiveInteger(
        req.query.customer_id,
        "customer_id",
      );
    }

    if (req.query.room_id) {
      filters.roomId = parsePositiveInteger(req.query.room_id, "room_id");
    }

    if (req.query.from_date) {
      filters.fromDate = validateDate(req.query.from_date, "from_date");
    }

    if (req.query.to_date) {
      filters.toDate = validateDate(req.query.to_date, "to_date");
    }

    const bookings = await findAllBookings(filters);

    res.status(200).json({
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const booking = await findBookingById(bookingId);

    if (!booking) {
      throw createError("Booking not found", 404);
    }

    res.status(200).json({
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const checkInDate = validateDate(req.query.check_in_date, "check_in_date");

    const checkOutDate = validateDate(
      req.query.check_out_date,
      "check_out_date",
    );

    if (checkOutDate <= checkInDate) {
      throw createError("check_out_date must be after check_in_date");
    }

    const filters = {
      checkInDate,
      checkOutDate,
      guests: parsePositiveInteger(req.query.guests ?? 1, "guests"),
    };

    if (req.query.room_type_id) {
      filters.roomTypeId = parsePositiveInteger(
        req.query.room_type_id,
        "room_type_id",
      );
    }

    if (req.query.min_price) {
      filters.minPrice = parsePrice(req.query.min_price, "min_price");
    }

    if (req.query.max_price) {
      filters.maxPrice = parsePrice(req.query.max_price, "max_price");
    }

    const rooms = await findAvailableRooms(filters);

    res.status(200).json({
      count: rooms.length,
      search: {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests: filters.guests,
      },
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const addBooking = async (req, res, next) => {
  try {
    const {
      customer_id,
      room_id,
      check_in_date,
      check_out_date,
      adults = 1,
      children = 0,
      special_requests = null,
    } = req.body;

    const checkInDate = validateDate(check_in_date, "check_in_date");

    const checkOutDate = validateDate(check_out_date, "check_out_date");

    if (checkOutDate <= checkInDate) {
      throw createError("check_out_date must be after check_in_date");
    }

    if (special_requests !== null && typeof special_requests !== "string") {
      throw createError("special_requests must be text or null");
    }

    const booking = await createBooking({
      customerId: parsePositiveInteger(customer_id, "customer_id"),

      roomId: parsePositiveInteger(room_id, "room_id"),

      checkInDate,
      checkOutDate,

      adults: parsePositiveInteger(adults, "adults"),

      children: parseNonNegativeInteger(children, "children"),

      specialRequests: special_requests?.trim() || null,
    });

    res.status(201).json({
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const editBooking = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const changes = {};

    if (hasOwn(req.body, "adults")) {
      changes.adults = parsePositiveInteger(req.body.adults, "adults");
    }

    if (hasOwn(req.body, "children")) {
      changes.children = parseNonNegativeInteger(req.body.children, "children");
    }

    if (hasOwn(req.body, "special_requests")) {
      if (
        req.body.special_requests !== null &&
        typeof req.body.special_requests !== "string"
      ) {
        throw createError("special_requests must be text or null");
      }

      changes.specialRequests = req.body.special_requests?.trim() || null;
    }

    if (Object.keys(changes).length === 0) {
      throw createError("Provide adults, children or special_requests");
    }

    const booking = await updateBookingDetails(bookingId, changes);

    if (!booking) {
      throw createError("Pending or confirmed booking not found", 404);
    }

    res.status(200).json({
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const removeBooking = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const booking = await cancelBooking(bookingId);

    res.status(200).json({
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const booking = await checkInBooking(bookingId);

    res.status(200).json({
      message: "Guest checked in successfully",

      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const booking = await checkOutBooking(bookingId);

    res.status(200).json({
      message: "Guest checked out successfully",

      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingHistory = async (req, res, next) => {
  try {
    const bookingId = parsePositiveInteger(req.params.id, "booking id");

    const booking = await findBookingById(bookingId);

    if (!booking) {
      throw createError("Booking not found", 404);
    }

    const history = await findBookingStatusHistory(bookingId);

    res.status(200).json({
      booking_id: bookingId,

      current_status: booking.status,

      count: history.length,

      data: history,
    });
  } catch (error) {
    next(error);
  }
};