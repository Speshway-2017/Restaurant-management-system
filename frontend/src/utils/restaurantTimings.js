/**
 * Restaurant Timings and Operational Status Utility
 */

export const parseTimeToMinutes = (timeStr, defaultMins = 0) => {
  if (!timeStr || typeof timeStr !== 'string') return defaultMins;
  try {
    const trimmed = timeStr.trim();
    // Matches formats like "11:00 AM", "11:00am", "11 AM", "11am", "23:00", "9:30 PM", "9:30"
    const match = trimmed.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return defaultMins;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  } catch (e) {
    return defaultMins;
  }
};

export const isRestaurantOpenNow = (settings = {}) => {
  const status = settings.restaurantStatus || 'open';
  if (status === 'closed') return false;
  if (status === 'force_open') return true;

  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = (day === 0 || day === 6);
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const hoursString = isWeekend
    ? (settings.weekendHours || '10:00 AM – 12:00 AM')
    : (settings.weekdayHours || '11:00 AM – 10:00 PM');

  const parts = hoursString.split(/–|—|-|\bto\b/i);
  if (parts.length < 2) return true; // Default to open if invalid format

  const openMin = parseTimeToMinutes(parts[0], isWeekend ? 600 : 660);
  let closeMin = parseTimeToMinutes(parts[1], isWeekend ? 1440 : 1320);

  // If closing time is specified as "12:00 AM" or "0:00", it means midnight (1440 mins / end of day)
  if (closeMin === 0 && (/12(?::00)?\s*AM/i.test(parts[1]) || /24:00/i.test(parts[1]) || /midnight/i.test(parts[1]))) {
    closeMin = 1440;
  }

  // Normal daytime hours (e.g. 11:00 AM (660) to 10:00 PM (1320))
  if (closeMin > openMin) {
    return currentMins >= openMin && currentMins < closeMin;
  }

  // Overnight hours (e.g. 11:00 AM (660) to 01:00 AM (60) next day)
  if (closeMin < openMin) {
    return currentMins >= openMin || currentMins < closeMin;
  }

  // If openMin === closeMin, assume 24 hours open
  return true;
};

export const getRestaurantStatusDetails = (settings = {}) => {
  const isOpen = isRestaurantOpenNow(settings);
  const now = new Date();
  const day = now.getDay();
  const isWeekend = (day === 0 || day === 6);
  const currentHours = isWeekend
    ? (settings.weekendHours || '10:00 AM – 12:00 AM')
    : (settings.weekdayHours || '11:00 AM – 10:00 PM');

  const defaultClosedMsg = `We are currently closed for orders. Operating Hours: Mon – Fri: ${settings.weekdayHours || '11:00 AM – 10:00 PM'} | Sat – Sun: ${settings.weekendHours || '10:00 AM – 12:00 AM'}`;
  const closedMessage = settings.closedMessage || defaultClosedMsg;

  return {
    isOpen,
    isClosed: !isOpen,
    statusOverride: settings.restaurantStatus || 'open',
    currentHours,
    weekdayHours: settings.weekdayHours || '11:00 AM – 10:00 PM',
    weekendHours: settings.weekendHours || '10:00 AM – 12:00 AM',
    closedMessage
  };
};
