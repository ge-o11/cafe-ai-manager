import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, Users,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMonthShifts, hoursFromShift, Shift } from '@/hooks/useShifts';
import { useEmployees } from '@/hooks/useEmployees';
import { calculateOvertimeCost, formatHours } from '@/lib/israeliLaborLaw';

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];
const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
function hebrewDay(iso: string) {
  return HEBREW_DAYS[new Date(iso).getDay()];
}

interface EmployeeMonthData {
  id: string;
  name: string;
  employee_number: string;
  is_active: boolean;
  hourly_rate: number | null;
  shifts: Shift[];
  days: number;
  totalHours: number;
  totalCost: number;
}

function DailyBreakdown({ shifts, hourlyRate }: { shifts: Shift[]; hourlyRate: number | null }) {
  const totalHours = shifts.reduce((s, sh) => s + hoursFromShift(sh), 0);
  const totalCost = shifts.reduce((sum, s) => {
    if (!s.clock_out || !hourlyRate) return sum;
    return sum + calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate).totalCost;
  }, 0);

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border/60 text-right">
              <th className="pb-2 font-medium pr-2">תאריך</th>
              <th className="pb-2 font-medium pr-4">יום</th>
              <th className="pb-2 font-medium pr-4">כניסה</th>
              <th className="pb-2 font-medium pr-4">יציאה</th>
              <th className="pb-2 font-medium pr-4">שעות</th>
              {hourlyRate && <th className="pb-2 font-medium">עלות</th>}
            </tr>
          </thead>
          <tbody>
            {shifts.map(s => {
              const hours = hoursFromShift(s);
              const breakdown = s.clock_out && hourlyRate
                ? calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate)
                : null;
              const isSpecial = breakdown?.dayType === 'holiday' || breakdown?.dayType === 'friday';
              return (
                <tr
                  key={s.id}
                  className={`border-b border-border/30 last:border-0 ${isSpecial ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                >
                  <td className="py-2 text-muted-foreground pr-2">{fmtDate(s.clock_in)}</td>
                  <td className="py-2 text-muted-foreground pr-4">{hebrewDay(s.clock_in)}</td>
                  <td className="py-2 font-mono pr-4">{fmtTime(s.clock_in)}</td>
                  <td className="py-2 font-mono pr-4">
                    {s.clock_out
                      ? fmtTime(s.clock_out)
                      : <span className="text-green-600 font-semibold">בעבודה</span>
                    }
                  </td>
                  <td className="py-2 font-semibold pr-4">{formatHours(hours)}</td>
                  {hourlyRate && (
                    <td className={`py-2 font-bold ${isSpecial ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                      {breakdown ? `₪${breakdown.totalCost.toFixed(0)}` : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-bold text-sm">
              <td colSpan={4} className="pt-2.5 text-muted-foreground pr-2">סה״כ</td>
              <td className="pt-2.5 pr-4">{formatHours(totalHours)}</td>
              {hourlyRate && (
                <td className="pt-2.5 text-amber-700 dark:text-amber-400">
                  {totalCost > 0 ? `₪${totalCost.toFixed(0)}` : '—'}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const AdminMonthlyHours: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: shifts = [], isLoading } = useMonthShifts(year, month);
  const { data: employees = [] } = useEmployees();

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prevMonth() {
    setExpandedId(null);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    setExpandedId(null);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const employeeData = useMemo<EmployeeMonthData[]>(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      if (!map.has(s.employee_id)) map.set(s.employee_id, []);
      map.get(s.employee_id)!.push(s);
    }
    return employees
      .filter(e => map.has(e.id))
      .map(e => {
        const empShifts = map.get(e.id)!;
        const uniqueDays = new Set(empShifts.map(s => s.clock_in.slice(0, 10))).size;
        const totalHours = empShifts.reduce((s, sh) => s + hoursFromShift(sh), 0);
        const totalCost = e.hourly_rate
          ? empShifts.reduce((sum, s) => {
              if (!s.clock_out) return sum;
              return sum + calculateOvertimeCost(s.clock_in, s.clock_out, e.hourly_rate!).totalCost;
            }, 0)
          : 0;
        return {
          id: e.id,
          name: e.name,
          employee_number: e.employee_number,
          is_active: e.is_active,
          hourly_rate: e.hourly_rate,
          shifts: empShifts,
          days: uniqueDays,
          totalHours,
          totalCost,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [shifts, employees]);

  const totalDays = employeeData.reduce((s, e) => s + e.days, 0);
  const totalHours = employeeData.reduce((s, e) => s + e.totalHours, 0);
  const totalCost = employeeData.reduce((s, e) => s + e.totalCost, 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Month navigation */}
      <div className="flex items-center justify-between bg-muted/40 rounded-2xl px-4 py-3">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl bg-background hover:bg-secondary border border-border flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="font-bold text-lg text-foreground">
          {HEBREW_MONTHS[month - 1]} {year}
        </p>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-9 h-9 rounded-xl bg-background hover:bg-secondary border border-border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">עובדים</p>
          <p className="text-2xl font-black text-foreground">{employeeData.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">סה״כ ימי עבודה</p>
          <p className="text-2xl font-black text-foreground">{totalDays}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">סה״כ שעות</p>
          <p className="text-2xl font-black text-foreground">{formatHours(totalHours)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">עלות שכר כוללת</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalCost > 0 ? `₪${totalCost.toFixed(0)}` : '—'}
          </p>
        </CardContent></Card>
      </div>

      {/* Employee table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : employeeData.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">אין נתוני שעות לחודש זה</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_64px_80px_80px_40px] px-4 py-2.5 bg-muted/60 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>עובד</span>
            <span className="text-center">ימים</span>
            <span className="text-center">שעות</span>
            <span className="text-center">עלות</span>
            <span />
          </div>

          {/* Rows */}
          {employeeData.map((emp, idx) => (
            <div key={emp.id} className={idx > 0 ? 'border-t border-border' : ''}>
              <button
                className="w-full grid grid-cols-[1fr_64px_80px_80px_40px] px-4 py-3.5 text-right hover:bg-muted/30 transition-colors items-center"
                onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-mono text-sm font-bold text-primary">{emp.employee_number}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-foreground">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.is_active ? 'פעיל' : 'לא פעיל'}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-bold text-foreground">{emp.days}</p>
                  <p className="text-[10px] text-muted-foreground">ימים</p>
                </div>

                <div className="text-center">
                  <p className="font-bold text-foreground">{formatHours(emp.totalHours)}</p>
                </div>

                <div className="text-center">
                  <p className={`font-bold text-sm ${emp.totalCost > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    {emp.totalCost > 0 ? `₪${emp.totalCost.toFixed(0)}` : '—'}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  {expandedId === emp.id
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {expandedId === emp.id && (
                <DailyBreakdown shifts={emp.shifts} hourlyRate={emp.hourly_rate} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMonthlyHours;
