/**
 * Israeli Labor Law - overtime & holiday calculations
 * Based on חוק שעות עבודה ומנוחה, תשי"א-1951
 *
 * Update HOLIDAYS list each year for accuracy.
 */

export type DayType = 'regular' | 'friday' | 'holiday' | 'holiday_eve';

// ─── Official paid holidays (Israel) ─────────────────────────────────────────
// Format: 'YYYY-MM-DD'
const HOLIDAYS: string[] = [
  // 5785 (2025)
  '2025-04-13', // פסח א׳
  '2025-04-19', // פסח ז׳
  '2025-05-01', // יום העצמאות
  '2025-06-01', // שבועות
  '2025-09-22', // ראש השנה א׳
  '2025-09-23', // ראש השנה ב׳
  '2025-10-01', // יום כיפור
  '2025-10-06', // סוכות א׳
  '2025-10-13', // שמיני עצרת

  // 5786 (2026)
  '2026-04-02', // פסח א׳
  '2026-04-08', // פסח ז׳
  '2026-04-22', // יום העצמאות
  '2026-05-22', // שבועות
  '2026-09-11', // ראש השנה א׳
  '2026-09-12', // ראש השנה ב׳
  '2026-09-20', // יום כיפור
  '2026-09-25', // סוכות א׳
  '2026-10-02', // שמיני עצרת
];

// Eves of holidays (shorter workday — max 7h regular)
const HOLIDAY_EVES: string[] = [
  '2025-04-12', // ערב פסח
  '2025-04-18', // ערב פסח ז׳
  '2025-04-30', // ערב יום העצמאות
  '2025-05-31', // ערב שבועות
  '2025-09-21', // ערב ראש השנה
  '2025-09-30', // ערב יום כיפור
  '2025-10-05', // ערב סוכות
  '2025-10-12', // ערב שמיני עצרת

  '2026-04-01', // ערב פסח
  '2026-04-07', // ערב פסח ז׳
  '2026-04-21', // ערב יום העצמאות
  '2026-05-21', // ערב שבועות
  '2026-09-10', // ערב ראש השנה
  '2026-09-19', // ערב יום כיפור
  '2026-09-24', // ערב סוכות
  '2026-10-01', // ערב שמיני עצרת
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDayType(date: Date): DayType {
  const str = toDateStr(date);
  const dow = date.getDay(); // 0=Sun, 5=Fri, 6=Sat

  if (HOLIDAYS.includes(str) || dow === 6) return 'holiday';
  if (HOLIDAY_EVES.includes(str) || dow === 5) return 'friday';
  return 'regular';
}

export interface OvertimeBreakdown {
  regularHours: number;       // paid at 100%
  overtime125Hours: number;   // first 2 overtime hours at 125%
  overtime150Hours: number;   // additional overtime at 150%
  holidayHours: number;       // all hours on holiday/Shabbat at 150%
  dayType: DayType;
  totalCost: number;
}

/**
 * Calculate shift cost based on Israeli labor law.
 * @param clockIn  ISO string
 * @param clockOut ISO string
 * @param hourlyRate NIS per hour
 */
export function calculateOvertimeCost(
  clockIn: string,
  clockOut: string,
  hourlyRate: number,
): OvertimeBreakdown {
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const totalHours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
  const dayType = getDayType(start);

  let regularHours = 0;
  let overtime125Hours = 0;
  let overtime150Hours = 0;
  let holidayHours = 0;
  let totalCost = 0;

  if (dayType === 'holiday') {
    // Shabbat / holiday: all hours at 150%
    holidayHours = totalHours;
    totalCost = hourlyRate * holidayHours * 1.5;
  } else {
    // Regular day: 8h normal, next 2h at 125%, rest at 150%
    // Friday/holiday eve: 7h normal, next 2h at 125%, rest at 150%
    const regularCap = dayType === 'friday' ? 7 : 8;

    regularHours = Math.min(totalHours, regularCap);
    const remaining1 = Math.max(0, totalHours - regularCap);
    overtime125Hours = Math.min(remaining1, 2);
    overtime150Hours = Math.max(0, remaining1 - 2);

    totalCost =
      hourlyRate * regularHours * 1.0 +
      hourlyRate * overtime125Hours * 1.25 +
      hourlyRate * overtime150Hours * 1.5;
  }

  return {
    regularHours,
    overtime125Hours,
    overtime150Hours,
    holidayHours,
    dayType,
    totalCost,
  };
}

export function formatHours(h: number): string {
  if (h === 0) return '0ש׳';
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (minutes === 0) return `${hours}ש׳`;
  return `${hours}ש׳ ${minutes}ד׳`;
}
