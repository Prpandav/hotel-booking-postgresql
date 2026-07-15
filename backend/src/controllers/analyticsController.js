export const getAnalyticsOverview = async (req, res) => {
  res.json({
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    pendingPayments: 0
  });
};
