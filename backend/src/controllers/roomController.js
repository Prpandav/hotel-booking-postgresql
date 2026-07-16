import {
  createRoom,
  deactivateRoom,
  findAllRooms,
  findRoomById,
  updateRoom,
} from "../repositories/roomRepository.js";

const roomStatuses = new Set([
  "available",
  "occupied",
  "maintenance",
  "cleaning",
]);

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw createError(`${fieldName} must be a positive integer`);
  }

  return number;
};

const parseFloorNumber = (value) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw createError(
      "floor_number must be an integer greater than or equal to 0",
    );
  }

  return number;
};

const parsePrice = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw createError(
      `${fieldName} must be a number greater than or equal to 0`,
    );
  }

  return number;
};

const validateStatus = (status) => {
  if (!roomStatuses.has(status)) {
    throw createError(`status must be one of: ${[...roomStatuses].join(", ")}`);
  }

  return status;
};

export const getRooms = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      amenity: req.query.amenity,
      search: req.query.search,
      includeInactive: req.query.include_inactive === "true",
    };

    if (filters.status) {
      validateStatus(filters.status);
    }

    if (req.query.room_type_id !== undefined) {
      filters.roomTypeId = parsePositiveInteger(
        req.query.room_type_id,
        "room_type_id",
      );
    }

    if (req.query.capacity !== undefined) {
      filters.capacity = parsePositiveInteger(req.query.capacity, "capacity");
    }

    if (req.query.min_price !== undefined) {
      filters.minPrice = parsePrice(req.query.min_price, "min_price");
    }

    if (req.query.max_price !== undefined) {
      filters.maxPrice = parsePrice(req.query.max_price, "max_price");
    }

    const rooms = await findAllRooms(filters);

    res.status(200).json({
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const roomId = parsePositiveInteger(req.params.id, "room id");

    const room = await findRoomById(roomId);

    if (!room) {
      throw createError("Room not found", 404);
    }

    res.status(200).json({
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const addRoom = async (req, res, next) => {
  try {
    const {
      room_number,
      room_type_id,
      floor_number,
      status = "available",
    } = req.body;

    if (typeof room_number !== "string" || room_number.trim() === "") {
      throw createError("room_number is required");
    }

    const roomTypeId = parsePositiveInteger(room_type_id, "room_type_id");

    const floorNumber = parseFloorNumber(floor_number);

    validateStatus(status);

    const room = await createRoom({
      roomNumber: room_number.trim(),
      roomTypeId,
      floorNumber,
      status,
    });

    res.status(201).json({
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const editRoom = async (req, res, next) => {
  try {
    const roomId = parsePositiveInteger(req.params.id, "room id");

    const changes = {};

    if (req.body.room_number !== undefined) {
      if (
        typeof req.body.room_number !== "string" ||
        req.body.room_number.trim() === ""
      ) {
        throw createError("room_number cannot be empty");
      }

      changes.roomNumber = req.body.room_number.trim();
    }

    if (req.body.room_type_id !== undefined) {
      changes.roomTypeId = parsePositiveInteger(
        req.body.room_type_id,
        "room_type_id",
      );
    }

    if (req.body.floor_number !== undefined) {
      changes.floorNumber = parseFloorNumber(req.body.floor_number);
    }

    if (req.body.status !== undefined) {
      changes.status = validateStatus(req.body.status);
    }

    if (Object.keys(changes).length === 0) {
      throw createError("Provide at least one field to update");
    }

    const room = await updateRoom(roomId, changes);

    if (!room) {
      throw createError("Active room not found", 404);
    }

    res.status(200).json({
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const removeRoom = async (req, res, next) => {
  try {
    const roomId = parsePositiveInteger(req.params.id, "room id");

    const deletedRoom = await deactivateRoom(roomId);

    if (!deletedRoom) {
      throw createError("Active room not found", 404);
    }

    res.status(200).json({
      message: "Room deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};
