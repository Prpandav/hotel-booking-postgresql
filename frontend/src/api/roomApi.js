import api from "./axios";

/*
|--------------------------------------------------------------------------
| Get All Rooms
|--------------------------------------------------------------------------
*/

export const getRooms = async () => {
  const response = await api.get("/rooms");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Single Room
|--------------------------------------------------------------------------
*/

export const getRoomById = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);

  return response.data;
};
