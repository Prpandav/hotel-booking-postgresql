import { findAllRooms } from "../repositories/roomRepository.js";

export const getRooms = async (req, res, next) => {
  try {
    const rooms = await findAllRooms();

    res.status(200).json({
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};
