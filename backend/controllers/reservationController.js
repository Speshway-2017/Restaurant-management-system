const Reservation = require('../models/Reservation');
const Guest = require('../models/Guest');
const { notifyReservationCreated } = require('../socket');

// Helper to auto-update guest profile with full customer details & notes
const createOrUpdateGuestProfile = async ({ name, phone, specialOccasion, notes, section }) => {
  try {
    const cleanPhone = String(phone || '').trim();
    if (!cleanPhone) return;

    let guest = await Guest.findOne({ phone: cleanPhone });
    if (guest) {
      guest.visitCount += 1;
      guest.lastVisitDate = new Date();
      if (name && name !== 'Guest Diner') guest.name = name;
      if (specialOccasion && specialOccasion !== 'None' && specialOccasion !== 'Casual Dining') {
        const exists = guest.specialOccasions.some(s => s.occasion === specialOccasion);
        if (!exists) guest.specialOccasions.push({ occasion: specialOccasion, date: new Date().toISOString().split('T')[0] });
      }
      if (notes) guest.notes = notes;
      if (section && !guest.preferences.includes(section)) {
        guest.preferences.push(section);
      }
      await guest.save();
    } else {
      await Guest.create({
        name: name || 'Guest Diner',
        phone: cleanPhone,
        visitCount: 1,
        lastVisitDate: new Date(),
        preferences: section ? [section, 'Standard'] : ['Standard'],
        specialOccasions: (specialOccasion && specialOccasion !== 'None' && specialOccasion !== 'Casual Dining') ? [{ occasion: specialOccasion, date: new Date().toISOString().split('T')[0] }] : [],
        notes: notes || ''
      });
    }
  } catch (e) {
    console.warn('Guest profile update warning in reservationController:', e.message);
  }
};

const getReservations = async (req, res) => {
  try {
    const list = await Reservation.find({}).sort({ date: 1, timeSlot: 1, createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReservation = async (req, res) => {
  try {
    const bookingId = req.body.bookingId || `RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingData = {
      bookingId,
      guestName: req.body.guestName || 'Valued Guest',
      phone: req.body.phone || '',
      guests: Number(req.body.guests) || 2,
      date: req.body.date || new Date().toISOString().split('T')[0],
      timeSlot: req.body.timeSlot || '07:30 PM',
      tableNo: req.body.tableNo || 'Unassigned',
      section: req.body.section || 'Main Dining',
      specialOccasion: req.body.specialOccasion || 'None',
      notes: req.body.notes || '',
      status: req.body.status || 'Confirmed',
      confirmationSent: true
    };
    const booking = await Reservation.create(bookingData);

    if (bookingData.phone) {
      await createOrUpdateGuestProfile({
        name: bookingData.guestName,
        phone: bookingData.phone,
        specialOccasion: bookingData.specialOccasion,
        notes: bookingData.notes,
        section: bookingData.section
      });
    }

    try {
      if (typeof notifyReservationCreated === 'function') {
        notifyReservationCreated(booking);
      }
    } catch (e) {
      console.warn('Socket notification error on reservation:', e.message);
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getReservations, createReservation };
