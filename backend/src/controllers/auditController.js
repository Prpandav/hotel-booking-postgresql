import { findAuditLogs } from "../repositories/auditRepository.js";

const allowedOperations = new Set(["INSERT", "UPDATE", "DELETE"]);

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const operation = req.query.operation?.toUpperCase();

    if (operation && !allowedOperations.has(operation)) {
      const error = new Error("operation must be INSERT, UPDATE or DELETE");

      error.status = 400;

      throw error;
    }

    const data = await findAuditLogs({
      tableName: req.query.table_name,

      operation,
      page,
      limit,
    });

    res.status(200).json({
      page,
      limit,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};
