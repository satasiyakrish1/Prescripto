/**
 * Parse slotDate and slotTime to create a proper Date object in IST
 * @param {string} slotDate - Format: "DD_MM_YYYY"
 * @param {string} slotTime - Format: "HH:MM AM/PM" or "HH:MM"
 * @returns {Date} - Date object in IST
 */
export const parseAppointmentDateTime = (slotDate, slotTime) => {
    try {
        // ── Custom slots: slotDate starts with "custom_" ─────────────────
        // These don't have a parseable date; use current timestamp.
        if (!slotDate || slotDate.startsWith('custom_')) {
            return new Date();
        }

        // ── Parse slotDate (format: "DD_MM_YYYY") ─────────────────────────
        const parts = slotDate.split('_').map(Number);
        if (parts.length !== 3 || parts.some(isNaN) || parts[2] < 1000) {
            console.warn('[dateHelper] Unrecognised slotDate format:', slotDate);
            return new Date();
        }
        const [day, month, year] = parts;

        // ── Parse slotTime ────────────────────────────────────────────────
        let hours = 0, minutes = 0;
        const timeStr = (slotTime || '').trim();

        if (/am|pm/i.test(timeStr)) {
            // Handles: "10:30 AM", "10:30 am", "10:30:00 am"
            const match = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i);
            if (match) {
                hours   = parseInt(match[1], 10);
                minutes = parseInt(match[2], 10);
                const period = match[3].toUpperCase();
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }
        } else if (timeStr.includes(':')) {
            // 24-hour format: "14:30" or "14:30:00"
            const [h, m] = timeStr.split(':').map(Number);
            hours   = isNaN(h) ? 0 : h;
            minutes = isNaN(m) ? 0 : m;
        }

        // ── Build the Date ────────────────────────────────────────────────
        const result = new Date(year, month - 1, day, hours, minutes, 0, 0);

        // Guard: if construction failed for any reason, fall back to now
        if (isNaN(result.getTime())) {
            console.warn('[dateHelper] Invalid Date produced for:', slotDate, slotTime);
            return new Date();
        }

        return result;
    } catch (error) {
        console.error('[dateHelper] Error parsing appointment date/time:', error);
        return new Date();
    }
};

/**
 * Get current date in IST
 * @returns {Date}
 */
export const getCurrentISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    return new Date(now.getTime() + istOffset);
};

/**
 * Format date to DD_MM_YYYY
 * @param {Date} date
 * @returns {string}
 */
export const formatDateToSlotDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}_${month}_${year}`;
};
