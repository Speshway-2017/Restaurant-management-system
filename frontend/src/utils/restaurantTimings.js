/**
 * Restaurant Timings and Operational Status Utility
 * Centralized Source of Truth for Flavora Kitchen Restaurant Operating Hours & Open/Closed Status
 */

export const parseTimeToMinutes = (timeStr, defaultMins = 0) => {
  if (!timeStr || typeof timeStr !== 'string') return defaultMins;
  try {
    const trimmed = timeStr.trim();
    // Matches formats like "12:00 PM", "11:00 AM", "12:00am", "11 AM", "23:00", "00:00"
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

/**
 * Calculates current time and day of week in Asia/Kolkata (IST) timezone
 */
export const getISTTime = (customDate = null) => {
  const dateObj = customDate ? new Date(customDate) : new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    });
    const parts = formatter.formatToParts(dateObj);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = daysMap[map.weekday] !== undefined ? daysMap[map.weekday] : dateObj.getDay();
    let hours = parseInt(map.hour, 10);
    if (hours === 24) hours = 0;
    const minutes = parseInt(map.minute, 10);

    return {
      day,
      hours,
      minutes,
      currentMins: hours * 60 + minutes
    };
  } catch (e) {
    const day = dateObj.getDay();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    return {
      day,
      hours,
      minutes,
      currentMins: hours * 60 + minutes
    };
  }
};

export const isRestaurantOpenNow = (settings = {}, customDate = null) => {
  const status = settings.restaurantStatus || 'open';
  if (status === 'closed') return false;
  if (status === 'force_open') return true;

  const { day, currentMins } = getISTTime(customDate);
  const isWeekend = (day === 0 || day === 6); // 0 = Sun, 6 = Sat

  // Default Operating Hours:
  // Mon – Fri: 10:00 AM – 6:00 PM (open 600, close 1080)
  // Sat – Sun: 11:00 AM – 12:00 AM (open 660, close 1440)
  const hoursString = isWeekend
    ? (settings.weekendHours || '11:00 AM – 12:00 AM')
    : (settings.weekdayHours || '10:00 AM – 6:00 PM');

  const parts = hoursString.split(/–|—|-|\bto\b/i);
  if (parts.length < 2) return true; // Default to open if invalid format

  const openMin = parseTimeToMinutes(parts[0], isWeekend ? 660 : 600);
  let closeMin = parseTimeToMinutes(parts[1], isWeekend ? 1440 : 1080);

  // If closing time is specified as "12:00 AM", "00:00", or "midnight", it represents end-of-day (1440 mins)
  if (closeMin === 0 && (/12(?::00)?\s*AM/i.test(parts[1]) || /24:00/i.test(parts[1]) || /midnight/i.test(parts[1]))) {
    closeMin = 1440;
  }

  // Normal daytime operating hours (e.g. 10:00 AM (600) to 6:00 PM (1080))
  if (closeMin > openMin) {
    return currentMins >= openMin && currentMins < closeMin;
  }

  // Overnight operating hours (e.g. 11:00 AM to 02:00 AM next day)
  if (closeMin < openMin) {
    return currentMins >= openMin || currentMins < closeMin;
  }

  // If openMin === closeMin, assume 24 hours open
  return true;
};

export const getRestaurantStatusDetails = (settings = {}, customDate = null) => {
  const isOpen = isRestaurantOpenNow(settings, customDate);
  const { day } = getISTTime(customDate);
  const isWeekend = (day === 0 || day === 6);
  const currentHours = isWeekend
    ? (settings.weekendHours || '11:00 AM – 12:00 AM')
    : (settings.weekdayHours || '10:00 AM – 6:00 PM');

  const defaultClosedMsg = `We are currently closed for orders. Operating Hours: Mon – Fri: ${settings.weekdayHours || '10:00 AM – 6:00 PM'} | Sat – Sun: ${settings.weekendHours || '11:00 AM – 12:00 AM'}`;
  const closedMessage = settings.closedMessage || defaultClosedMsg;

  return {
    isOpen,
    isClosed: !isOpen,
    statusOverride: settings.restaurantStatus || 'open',
    currentHours,
    weekdayHours: settings.weekdayHours || '10:00 AM – 6:00 PM',
    weekendHours: settings.weekendHours || '11:00 AM – 12:00 AM',
    closedMessage
  };
};
