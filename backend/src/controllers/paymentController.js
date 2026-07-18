import {
  findAllPayments,
  findBookingPaymentSummary,
  findPaymentById,
  findRefundsByPaymentId,
  recordPayment,
  refundPayment,
} from "../repositories/paymentRepository.js";


const paymentMethods =
  new Set([
    "cash",
    "card",
    "upi",
    "bank_transfer",
  ]);


const createError = (
  message,
  status = 400
) => {

  const error =
    new Error(message);

  error.status = status;

  return error;
};


const parsePositiveInteger = (
  value,
  fieldName
) => {

  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {

    throw createError(
      `${fieldName} must be a positive integer`
    );

  }

  return number;
};


const parseMoney = (
  value,
  fieldName
) => {

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {

    throw createError(
      `${fieldName} must be greater than 0`
    );

  }

  return number;
};


export const getPayments =
  async (
    req,
    res,
    next
  ) => {

    try {

      let bookingId;

      if (
        req.query.booking_id
      ) {

        bookingId =
          parsePositiveInteger(
            req.query.booking_id,
            "booking_id"
          );

      }

      const payments =
        await findAllPayments(
          bookingId
        );

      res.status(200).json({
        count:
          payments.length,

        data:
          payments,
      });

    } catch (error) {

      next(error);

    }

  };


export const getPaymentById =
  async (
    req,
    res,
    next
  ) => {

    try {

      const paymentId =
        parsePositiveInteger(
          req.params.id,
          "payment id"
        );

      const payment =
        await findPaymentById(
          paymentId
        );

      if (!payment) {

        throw createError(
          "Payment not found",
          404
        );

      }

      res.status(200).json({
        data: payment,
      });

    } catch (error) {

      next(error);

    }

  };


export const addPayment =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        booking_id,
        amount,
        payment_method,
        transaction_reference,
      } = req.body;


      if (
        !paymentMethods.has(
          payment_method
        )
      ) {

        throw createError(
          `payment_method must be one of: ${
            [...paymentMethods]
              .join(", ")
          }`
        );

      }


      const payment =
        await recordPayment({

          bookingId:
            parsePositiveInteger(
              booking_id,
              "booking_id"
            ),

          amount:
            parseMoney(
              amount,
              "amount"
            ),

          paymentMethod:
            payment_method,

          transactionReference:
            transaction_reference
              ?.trim() ||
            null,

        });


      res.status(201).json({

        message:
          "Payment recorded successfully",

        data:
          payment,

      });

    } catch (error) {

      next(error);

    }

  };


export const getBookingPaymentSummary =
  async (
    req,
    res,
    next
  ) => {

    try {

      const bookingId =
        parsePositiveInteger(
          req.params.bookingId,
          "booking id"
        );

      const summary =
        await findBookingPaymentSummary(
          bookingId
        );

      if (!summary) {

        throw createError(
          "Booking not found",
          404
        );

      }

      res.status(200).json({
        data: summary,
      });

    } catch (error) {

      next(error);

    }

  };


export const addRefund =
  async (
    req,
    res,
    next
  ) => {

    try {

      const paymentId =
        parsePositiveInteger(
          req.params.id,
          "payment id"
        );


      const amount =
        parseMoney(
          req.body.amount,
          "amount"
        );


      const reason =
        req.body.reason
          ?.trim() ||
        null;


      const refund =
        await refundPayment({

          paymentId,

          amount,

          reason,

        });


      res.status(201).json({

        message:
          "Refund recorded successfully",

        data:
          refund,

      });

    } catch (error) {

      next(error);

    }

  };


export const getRefunds =
  async (
    req,
    res,
    next
  ) => {

    try {

      const paymentId =
        parsePositiveInteger(
          req.params.id,
          "payment id"
        );


      const payment =
        await findPaymentById(
          paymentId
        );


      if (!payment) {

        throw createError(
          "Payment not found",
          404
        );

      }


      const refunds =
        await findRefundsByPaymentId(
          paymentId
        );


      res.status(200).json({

        count:
          refunds.length,

        data:
          refunds,

      });

    } catch (error) {

      next(error);

    }

  };