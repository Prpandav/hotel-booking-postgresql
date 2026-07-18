export const formatDate = (dateString) => {
  if (!dateString) {
    return "Not available";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start = new Date(`${checkIn}T00:00:00`);

  const end = new Date(`${checkOut}T00:00:00`);

  const difference = end.getTime() - start.getTime();

  const nights = difference / (1000 * 60 * 60 * 24);

  return Math.max(0, nights);
};
