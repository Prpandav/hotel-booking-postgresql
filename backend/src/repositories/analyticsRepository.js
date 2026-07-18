import pool from "../config/database.js";


export const getAnalyticsOverview =
  async ({
    fromDate,
    toDate,
  }) => {

    const result = await pool.query(
      `
        WITH booking_stats AS (

          SELECT

            COUNT(*) AS total_bookings,

            COUNT(*) FILTER (
              WHERE status = 'pending'
            ) AS pending_bookings,

            COUNT(*) FILTER (
              WHERE status = 'confirmed'
            ) AS confirmed_bookings,

            COUNT(*) FILTER (
              WHERE status = 'checked_in'
            ) AS current_stays,

            COUNT(*) FILTER (
              WHERE status = 'checked_out'
            ) AS completed_bookings,

            COUNT(*) FILTER (
              WHERE status = 'cancelled'
            ) AS cancelled_bookings,

            COALESCE(
              AVG(
                check_out_date
                -
                check_in_date
              ),
              0
            )::NUMERIC(10, 2)
              AS average_stay_nights

          FROM bookings

          WHERE created_at::DATE
            BETWEEN $1::DATE
            AND $2::DATE

        ),

        payment_stats AS (

          SELECT

            COALESCE(
              SUM(amount),
              0
            )::NUMERIC(14, 2)
              AS gross_collected

          FROM payments

          WHERE status IN (
            'successful',
            'partially_refunded',
            'refunded'
          )

          AND paid_at::DATE
            BETWEEN $1::DATE
            AND $2::DATE

        ),

        refund_stats AS (

          SELECT

            COALESCE(
              SUM(amount),
              0
            )::NUMERIC(14, 2)
              AS total_refunded

          FROM payment_refunds

          WHERE created_at::DATE
            BETWEEN $1::DATE
            AND $2::DATE

        )

        SELECT

          booking_stats.*,

          payment_stats.gross_collected,

          refund_stats.total_refunded,

          (
            payment_stats.gross_collected
            -
            refund_stats.total_refunded
          )::NUMERIC(14, 2)
            AS net_collected,

          CASE

            WHEN
              booking_stats.total_bookings = 0

            THEN 0

            ELSE ROUND(

              booking_stats.cancelled_bookings
              * 100.0
              /
              booking_stats.total_bookings,

              2
            )

          END AS cancellation_rate

        FROM booking_stats

        CROSS JOIN payment_stats

        CROSS JOIN refund_stats
      `,
      [
        fromDate,
        toDate,
      ]
    );


    return result.rows[0];

  };

  export const getOccupancyAnalytics =
  async ({
    fromDate,
    toDate,
  }) => {

    const result = await pool.query(
      `
        WITH dates AS (

          SELECT

            GENERATE_SERIES(

              $1::DATE,

              $2::DATE
                - INTERVAL '1 day',

              INTERVAL '1 day'

            )::DATE AS stay_date

        ),

        hotel_capacity AS (

          SELECT
            COUNT(*) AS total_rooms

          FROM rooms

          WHERE
            is_active = TRUE

            AND status <>
                'maintenance'

        ),

        daily_occupancy AS (

          SELECT

            dates.stay_date,

            COUNT(
              DISTINCT bookings.room_id
            ) AS booked_rooms

          FROM dates

          LEFT JOIN bookings

            ON dates.stay_date >=
               bookings.check_in_date

            AND dates.stay_date <
                bookings.check_out_date

            AND bookings.status IN (
              'confirmed',
              'checked_in',
              'checked_out'
            )

          GROUP BY
            dates.stay_date

        )

        SELECT

          daily_occupancy.stay_date,

          hotel_capacity.total_rooms,

          daily_occupancy.booked_rooms,

          (
            hotel_capacity.total_rooms
            -
            daily_occupancy.booked_rooms
          ) AS available_rooms,

          CASE

            WHEN hotel_capacity.total_rooms = 0
              THEN 0

            ELSE ROUND(

              daily_occupancy.booked_rooms
              * 100.0
              /
              hotel_capacity.total_rooms,

              2

            )

          END AS occupancy_rate

        FROM daily_occupancy

        CROSS JOIN hotel_capacity

        ORDER BY
          daily_occupancy.stay_date
      `,
      [
        fromDate,
        toDate,
      ]
    );


    return result.rows;

  };

  export const getMonthlyRevenue =
  async () => {

    const result = await pool.query(
      `
        SELECT

          month,

          completed_bookings,

          revenue,

          average_booking_value,


          LAG(revenue)
          OVER (
            ORDER BY month
          )
            AS previous_month_revenue,


          ROUND(

            (
              revenue
              -
              LAG(revenue)
              OVER (
                ORDER BY month
              )
            )

            * 100.0

            /

            NULLIF(

              LAG(revenue)
              OVER (
                ORDER BY month
              ),

              0

            ),

            2

          ) AS revenue_growth_percentage,


          SUM(revenue)
          OVER (
            ORDER BY month
          )
            AS running_revenue


        FROM
          monthly_completed_revenue_mv

        ORDER BY month
      `
    );


    return result.rows;

  };

  export const getTopRooms =
  async (limit) => {

    const result = await pool.query(
      `
        SELECT

          *,

          RANK()
          OVER (
            ORDER BY
              completed_booking_revenue
              DESC
          )
            AS revenue_rank

        FROM room_performance_view

        ORDER BY
          completed_booking_revenue DESC,
          total_bookings DESC

        LIMIT $1
      `,
      [limit]
    );


    return result.rows;

  };

  export const getTopCustomers =
  async (limit) => {

    const result = await pool.query(
      `
        SELECT

          *,

          DENSE_RANK()
          OVER (
            ORDER BY
              lifetime_booking_value
              DESC
          )
            AS customer_rank

        FROM customer_value_view

        WHERE completed_stays > 0

        ORDER BY
          lifetime_booking_value DESC

        LIMIT $1
      `,
      [limit]
    );


    return result.rows;

  };

  export const getCancellationAnalytics =
  async () => {

    const result = await pool.query(
      `
        SELECT

          DATE_TRUNC(
            'month',
            created_at
          )::DATE AS month,

          COUNT(*)
            AS total_bookings,

          COUNT(*)
          FILTER (
            WHERE status = 'cancelled'
          )
            AS cancelled_bookings,

          ROUND(

            COUNT(*)
            FILTER (
              WHERE status = 'cancelled'
            )

            * 100.0

            /

            NULLIF(
              COUNT(*),
              0
            ),

            2

          ) AS cancellation_rate

        FROM bookings

        GROUP BY
          DATE_TRUNC(
            'month',
            created_at
          )

        ORDER BY month
      `
    );


    return result.rows;

  };

  export const refreshAnalytics =
  async () => {

    await pool.query(
      `
        REFRESH MATERIALIZED VIEW
        monthly_completed_revenue_mv
      `
    );


    return {
      refreshed: true,
    };

  };