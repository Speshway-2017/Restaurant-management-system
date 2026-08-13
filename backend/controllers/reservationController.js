const Reservation = require('../models/Reservation');

const getReservations = async (req, res) => {
  try {
    const list = await Reservation.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReservation = async (req, res) => {
  try {
    const booking = await Reservation.create(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getReservations, createReservation };
