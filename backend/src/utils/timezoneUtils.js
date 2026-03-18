// backend/src/utils/timezoneUtils.js

const { DateTime } = require('luxon');
const { ADMIN_TIMEZONE } = require('./constants');

/**
 * Convert a date from admin's timezone to UTC
 * @param {string} dateStr - Date string in ISO format
 * @returns {Date} - UTC Date object
 */
const adminTimeToUTC = (dateStr) => {
  const adminTime = DateTime.fromISO(dateStr, { zone: ADMIN_TIMEZONE });
  return adminTime.toUTC().toJSDate();
};

/**
 * Convert UTC date to user's local time
 * @param {Date} utcDate - UTC Date object
 * @param {string} userTimezone - User's IANA timezone (e.g., 'Asia/Kolkata')
 * @returns {Object} - Formatted time info
 */
const utcToUserTime = (utcDate, userTimezone = 'local') => {
  const utc = DateTime.fromJSDate(utcDate).toUTC();
  
  if (userTimezone === 'local') {
    // Convert to browser's local time
    const local = utc.toLocal();
    return {
      iso: local.toISO(),
      formatted: local.toFormat('dd MMM yyyy, hh:mm a'),
      timestamp: local.toMillis(),
      timezone: local.zoneName
    };
  } else {
    // Convert to specified timezone
    const target = utc.setZone(userTimezone);
    return {
      iso: target.toISO(),
      formatted: target.toFormat('dd MMM yyyy, hh:mm a'),
      timestamp: target.toMillis(),
      timezone: userTimezone
    };
  }
};

/**
 * Check if voting is still open
 * @param {Date} deadlineUTC - Voting deadline in UTC
 * @returns {boolean} - True if voting is still open
 */
const isVotingOpen = (deadlineUTC) => {
  const now = DateTime.now().toUTC();
  const deadline = DateTime.fromJSDate(deadlineUTC).toUTC();
  return now < deadline;
};

/**
 * Get time remaining until deadline
 * @param {Date} deadlineUTC - Voting deadline in UTC
 * @returns {Object} - Time remaining in different units
 */
const getTimeRemaining = (deadlineUTC) => {
  const now = DateTime.now().toUTC();
  const deadline = DateTime.fromJSDate(deadlineUTC).toUTC();
  const diff = deadline.diff(now);

  if (diff.milliseconds < 0) {
    return {
      expired: true,
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      formatted: 'Expired'
    };
  }

  const duration = diff.shiftTo('days', 'hours', 'minutes', 'seconds');
  
  return {
    expired: false,
    milliseconds: diff.milliseconds,
    seconds: Math.floor(duration.seconds),
    minutes: Math.floor(duration.minutes),
    hours: Math.floor(duration.hours),
    days: Math.floor(duration.days),
    formatted: `${duration.days}d ${duration.hours}h ${duration.minutes}m`
  };
};

/**
 * Format deadline for display
 * @param {Date} deadlineUTC - Voting deadline in UTC
 * @param {string} format - Desired format
 * @returns {string} - Formatted deadline string
 */
const formatDeadline = (deadlineUTC, format = 'dd MMM yyyy, hh:mm a') => {
  const utc = DateTime.fromJSDate(deadlineUTC).toUTC();
  return utc.toLocal().toFormat(format);
};

module.exports = {
  adminTimeToUTC,
  utcToUserTime,
  isVotingOpen,
  getTimeRemaining,
  formatDeadline
};