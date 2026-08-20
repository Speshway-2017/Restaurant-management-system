const reportService = require('../services/reportService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getReportAnalytics = async (req, res) => {
  try {
    const { dateRange, branch, startDate, endDate } = req.query;
    const analyticsData = await reportService.getReportAnalytics({
      dateRange: dateRange || 'This Month',
      branch: branch || 'All',
      startDate,
      endDate
    });
    return successResponse(res, analyticsData, 'Report analytics retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getReportBranches = async (req, res) => {
  try {
    const branches = await reportService.getReportBranches();
    return successResponse(res, branches, 'Report branches retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getReportAnalytics,
  getReportBranches
};
