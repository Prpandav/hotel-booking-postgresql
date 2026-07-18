import crypto from "crypto";

import pool, {
    getClient,
} from "../config/database.js";


const createError = (
    message,
    status = 400
) => {
    const error = new Error(message);

    error.status = status;

    return error;
};


const paymentSelect = `
  SELECT
    payments.id,
    payments.booking_id,
    payments.amount,
    payments.payment_method,
    payments.status,
    payments.transaction_reference,
    payments.paid_at,
    payments.created_at,
    payments.updated_at,

    bookings.booking_code,
    bookings.total_amount
      AS booking_total,
    bookings.status
      AS booking_status,

    customers.full_name
      AS customer_name,

    rooms.room_number

  FROM payments

  INNER JOIN bookings
    ON payments.booking_id =
       bookings.id

  INNER JOIN customers
    ON bookings.customer_id =
       customers.id

  INNER JOIN rooms
    ON bookings.room_id =
       rooms.id
`;


export const findAllPayments =
    async (bookingId) => {

        const values = [];

        let whereClause = "";

        if (bookingId !== undefined) {

            values.push(bookingId);

            whereClause = `
        WHERE payments.booking_id = $1
      `;

        }

        const result = await pool.query(
            `
        ${paymentSelect}

        ${whereClause}

        ORDER BY
          payments.created_at DESC
      `,
            values
        );

        return result.rows;
    };


export const findPaymentById =
    async (paymentId) => {

        const result = await pool.query(
            `
        ${paymentSelect}

        WHERE payments.id = $1
      `,
            [paymentId]
        );

        return result.rows[0] ?? null;
    };


export const findBookingPaymentSummary =
    async (bookingId) => {

        const result = await pool.query(
            `
        SELECT *

        FROM booking_payment_summary

        WHERE booking_id = $1
      `,
            [bookingId]
        );

        return result.rows[0] ?? null;
    };





export const recordPayment = async ({
    bookingId,
    amount,
    paymentMethod,
    transactionReference,
}) => {

    const client =
        await getClient();

    try {

        await client.query("BEGIN");


        /*
         * Lock booking.
         *
         * Every payment for the same booking
         * must wait for this lock.
         */

        const bookingResult =
            await client.query(
                `
          SELECT
            id,
            total_amount,
            status

          FROM bookings

          WHERE id = $1

          FOR UPDATE
        `,
                [bookingId]
            );


        if (
            bookingResult.rows.length === 0
        ) {

            throw createError(
                "Booking not found",
                404
            );

        }


        const booking =
            bookingResult.rows[0];


        if (
            booking.status === "cancelled"
        ) {

            throw createError(
                "Cannot make payment for a cancelled booking",
                409
            );

        }


        if (
            booking.status === "checked_out"
        ) {

            throw createError(
                "Completed booking cannot receive new payments",
                409
            );

        }


        /*
         * Calculate amount already paid.
         */

        const paymentResult =
            await client.query(
                `
          SELECT

            COALESCE(
              SUM(amount) FILTER (
                WHERE status IN (
                  'successful',
                  'partially_refunded',
                  'refunded'
                )
              ),
              0
            )

            -

            COALESCE(
              (
                SELECT
                  SUM(
                    payment_refunds.amount
                  )

                FROM payment_refunds

                INNER JOIN payments
                  AS refund_payments

                  ON payment_refunds.payment_id =
                     refund_payments.id

                WHERE
                  refund_payments.booking_id = $1
              ),
              0
            )

            AS net_paid

          FROM payments

          WHERE booking_id = $1
        `,
                [bookingId]
            );


        const totalAmount =
            Number(
                booking.total_amount
            );

        const netPaid =
            Number(
                paymentResult.rows[0].net_paid
            );

        const remainingBalance =
            totalAmount - netPaid;


        if (
            amount > remainingBalance
        ) {

            throw createError(
                `Payment exceeds remaining balance of ${remainingBalance.toFixed(2)}`,
                409
            );

        }


        /*
         * Generate reference when client
         * does not provide one.
         */

        const reference =
            transactionReference ||
            crypto.randomUUID();


        const insertResult =
            await client.query(
                `
          INSERT INTO payments (
            booking_id,
            amount,
            payment_method,
            status,
            transaction_reference,
            paid_at
          )

          VALUES (
            $1,
            $2,
            $3,
            'successful',
            $4,
            CURRENT_TIMESTAMP
          )

          RETURNING id
        `,
                [
                    bookingId,
                    amount,
                    paymentMethod,
                    reference,
                ]
            );


        const newNetPaid =
            netPaid + amount;


        /*
         * Fully paid pending bookings
         * automatically become confirmed.
         */

        if (
            newNetPaid >= totalAmount &&
            booking.status === "pending"
        ) {

            await client.query(
                `
          UPDATE bookings

          SET
            status = 'confirmed',
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
        `,
                [bookingId]
            );

        }


        const finalResult =
            await client.query(
                `
          ${paymentSelect}

          WHERE payments.id = $1
        `,
                [
                    insertResult.rows[0].id
                ]
            );


        await client.query(
            "COMMIT"
        );


        return finalResult.rows[0];

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();

    }

};


export const refundPayment = async ({
    paymentId,
    amount,
    reason,
}) => {

    const client =
        await getClient();

    try {

        await client.query("BEGIN");


        const paymentResult =
            await client.query(
                `
          SELECT
            payments.id,
            payments.booking_id,
            payments.amount,
            payments.status

          FROM payments

          WHERE payments.id = $1

          FOR UPDATE
        `,
                [paymentId]
            );


        if (
            paymentResult.rows.length === 0
        ) {

            throw createError(
                "Payment not found",
                404
            );

        }


        const payment =
            paymentResult.rows[0];


        if (
            ![
                "successful",
                "partially_refunded",
            ].includes(payment.status)
        ) {

            throw createError(
                "This payment cannot be refunded",
                409
            );

        }


        const refundResult =
            await client.query(
                `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS refunded

          FROM payment_refunds

          WHERE payment_id = $1
        `,
                [paymentId]
            );


        const alreadyRefunded =
            Number(
                refundResult.rows[0].refunded
            );


        const paymentAmount =
            Number(payment.amount);


        const refundableAmount =
            paymentAmount -
            alreadyRefunded;


        if (
            amount > refundableAmount
        ) {

            throw createError(
                `Maximum refundable amount is ${refundableAmount.toFixed(2)}`,
                409
            );

        }


        await client.query(
            `
        INSERT INTO payment_refunds (
          payment_id,
          amount,
          reason
        )

        VALUES (
          $1,
          $2,
          $3
        )
      `,
            [
                paymentId,
                amount,
                reason,
            ]
        );


        const totalRefunded =
            alreadyRefunded +
            amount;


        const newPaymentStatus =
            totalRefunded >=
                paymentAmount

                ? "refunded"

                : "partially_refunded";


        await client.query(
            `
        UPDATE payments

        SET
          status = $1,
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $2
      `,
            [
                newPaymentStatus,
                paymentId,
            ]
        );


        /*
         * Lock booking because refund may
         * change booking payment state.
         */

        const bookingResult =
            await client.query(
                `
          SELECT
            id,
            status,
            total_amount

          FROM bookings

          WHERE id = $1

          FOR UPDATE
        `,
                [payment.booking_id]
            );


        const booking =
            bookingResult.rows[0];


        /*
         * Calculate current net paid amount.
         */

        const balanceResult =
            await client.query(
                `
          SELECT

            COALESCE(
              SUM(payments.amount)
                FILTER (
                  WHERE payments.status IN (
                    'successful',
                    'partially_refunded',
                    'refunded'
                  )
                ),
              0
            )

            -

            COALESCE(
              (
                SELECT
                  SUM(
                    payment_refunds.amount
                  )

                FROM payment_refunds

                INNER JOIN payments
                  AS rp

                  ON payment_refunds.payment_id =
                     rp.id

                WHERE
                  rp.booking_id = $1
              ),
              0
            )

            AS net_paid

          FROM payments

          WHERE booking_id = $1
        `,
                [payment.booking_id]
            );


        const netPaid =
            Number(
                balanceResult.rows[0].net_paid
            );


        /*
         * If confirmed booking falls below
         * full payment after refund,
         * return it to pending.
         */

        if (
            booking.status ===
            "confirmed" &&

            netPaid <
            Number(
                booking.total_amount
            )
        ) {

            await client.query(
                `
          UPDATE bookings

          SET
            status = 'pending',
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
        `,
                [booking.id]
            );

        }


        await client.query(
            "COMMIT"
        );


        return {
            paymentId,
            refundAmount: amount,
            paymentStatus:
                newPaymentStatus,
        };

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();

    }

};


export const findRefundsByPaymentId =
    async (paymentId) => {

        const result = await pool.query(
            `
        SELECT
          id,
          payment_id,
          amount,
          reason,
          created_at

        FROM payment_refunds

        WHERE payment_id = $1

        ORDER BY created_at DESC
      `,
            [paymentId]
        );

        return result.rows;
    };