/**
 * Calendar values are stored exactly as the PWA writes them, so validation is a
 * shape check rather than a parse. Both patterns allow the empty string: the
 * forms let the leader save a tour before the dates are settled.
 */
export const CALENDAR_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})?$/;
export const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^$/;
