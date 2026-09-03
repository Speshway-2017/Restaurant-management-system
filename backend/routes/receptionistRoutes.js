const express = require('express');
const router = express.Router();
const {
  getReceptionistKPIs,
  getFloorPlan,
  getActiveTableSession,
  seatWalkIn,
  mergeTables,
  splitTables,
  transferTable,
  getWaitlist,
  createWaitlistToken,
  callWaitlistToken,
  seatWaitlistToken,
  updateWaitlistStatus,
  getReservations,
  createReservation,
  checkInReservation,
  updateReservationStatus,
  getGuests,
  updateGuestPreferences,
  sendNotification
} = require('../controllers/receptionistController');

// KPI & Floor Plan
router.get('/kpis', getReceptionistKPIs);
router.get('/floor-plan', getFloorPlan);
router.get('/active-session/:tableNum', getActiveTableSession);

// Walk-in Seating & Table Operations
router.post('/walk-ins/seat', seatWalkIn);
router.post('/tables/merge', mergeTables);
router.post('/tables/split', splitTables);
router.post('/tables/transfer', transferTable);

// Waitlist Queue
router.get('/waitlist', getWaitlist);
router.post('/waitlist', createWaitlistToken);
router.post('/waitlist/:id/call', callWaitlistToken);
router.post('/waitlist/:id/seat', seatWaitlistToken);
router.patch('/waitlist/:id/status', updateWaitlistStatus);

// Reservations
router.get('/reservations', getReservations);
router.post('/reservations', createReservation);
router.post('/reservations/:id/check-in', checkInReservation);
router.patch('/reservations/:id/status', updateReservationStatus);

// Guests
router.get('/guests', getGuests);
router.patch('/guests/:id', updateGuestPreferences);

// Notifications
router.post('/notifications/send', sendNotification);

module.exports = router;
