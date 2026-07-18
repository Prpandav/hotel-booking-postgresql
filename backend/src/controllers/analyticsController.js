import {
  getAnalyticsOverview,
  getCancellationAnalytics,
  getMonthlyRevenue,
  getOccupancyAnalytics,
  getTopCustomers,
  getTopRooms,
  refreshAnalytics,
} from "../repositories/analyticsRepository.js";


const createError = (
  message,
  status = 400
) => {

  const error =
    new Error(message);

  error.status =
    status;

  return error;

};


const validateDate = (
  value,
  fieldName
) => {

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {

    throw createError(
      `${fieldName} must use YYYY-MM-DD format`
    );

  }

  return value;

};


const parseLimit = (
  value
) => {

  const limit =
    Number(value ?? 10);


  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {

    throw createError(
      "limit must be between 1 and 50"
    );

  }


  return limit;

};


export const getOverview =
  async (
    req,
    res,
    next
  ) => {

    try {

      const fromDate =
        validateDate(
          req.query.from_date,
          "from_date"
        );


      const toDate =
        validateDate(
          req.query.to_date,
          "to_date"
        );


      if (
        toDate < fromDate
      ) {

        throw createError(
          "to_date must be on or after from_date"
        );

      }


      const analytics =
        await getAnalyticsOverview({

          fromDate,

          toDate,

        });


      res.status(200).json({

        period: {

          from_date:
            fromDate,

          to_date:
            toDate,

        },

        data:
          analytics,

      });


    } catch (error) {

      next(error);

    }

  };


export const getOccupancy =
  async (
    req,
    res,
    next
  ) => {

    try {

      const fromDate =
        validateDate(
          req.query.from_date,
          "from_date"
        );


      const toDate =
        validateDate(
          req.query.to_date,
          "to_date"
        );


      if (
        toDate <= fromDate
      ) {

        throw createError(
          "to_date must be after from_date"
        );

      }


      const analytics =
        await getOccupancyAnalytics({

          fromDate,

          toDate,

        });


      res.status(200).json({

        count:
          analytics.length,

        data:
          analytics,

      });


    } catch (error) {

      next(error);

    }

  };


export const getRevenue =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        await getMonthlyRevenue();


      res.status(200).json({

        count:
          data.length,

        data,

      });


    } catch (error) {

      next(error);

    }

  };


export const getRoomsRanking =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        await getTopRooms(
          parseLimit(
            req.query.limit
          )
        );


      res.status(200).json({

        count:
          data.length,

        data,

      });


    } catch (error) {

      next(error);

    }

  };


export const getCustomersRanking =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        await getTopCustomers(
          parseLimit(
            req.query.limit
          )
        );


      res.status(200).json({

        count:
          data.length,

        data,

      });


    } catch (error) {

      next(error);

    }

  };


export const getCancellations =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        await getCancellationAnalytics();


      res.status(200).json({

        count:
          data.length,

        data,

      });


    } catch (error) {

      next(error);

    }

  };


export const refresh =
  async (
    req,
    res,
    next
  ) => {

    try {

      await refreshAnalytics();


      res.status(200).json({

        message:
          "Analytics materialized views refreshed successfully",

      });


    } catch (error) {

      next(error);

    }

  };