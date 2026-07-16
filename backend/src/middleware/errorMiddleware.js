export const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const getPostgresError = (error) => {
  switch (error.code) {
    case "23505":
      return {
        status: 409,
        message: "A record with the same unique value already exists",
      };

    case "23503":
      return {
        status: 400,
        message: "The referenced record does not exist or is still in use",
      };

    case "23514":
      return {
        status: 400,
        message: "The provided value violates a database rule",
      };

    case "23502":
      return {
        status: 400,
        message: "A required database value is missing",
      };

    case "22P02":
      return {
        status: 400,
        message: "A value has an invalid data type or format",
      };

    default:
      return null;
  }
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  const postgresError = getPostgresError(error);

  if (postgresError) {
    return res.status(postgresError.status).json({
      message: postgresError.message,
      databaseCode: error.code,
      detail: process.env.NODE_ENV === "development" ? error.detail : undefined,
    });
  }

  return res.status(error.status || 500).json({
    message: error.message || "Internal server error",
  });
};
