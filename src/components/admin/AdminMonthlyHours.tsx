import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, Clock,
  ChevronDown, ChevronUp, Pencil, Trash2, Plus,
  Check, X, AlertTriangle, Search,
} from 'lucide-react';
import {
  useMonthShifts, hoursFromShift, Shift,
  useUpdateShift, useDeleteShift, useCreateShift, useDeleteAllShifts,
} from '@/hooks/useShifts';
import { useEmployees } from '@/hooks/useEmployees';
import { calculateOvertimeCost, formatHours } from '@/lib/israeliLaborLaw';

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];
const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-teal-500',
];

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
function hebrewDay(iso: string) { return HEBREW_DAYS[new Date(iso).getDay()]; }

// ─── Edit row ────────────────────────────────────────────────────────────────
function EditShiftRow({ shift, numCols, onClose }: { shift: Shift; numCols: number; onClose: () => void }) {
  const [clockIn, setClockIn] = useState(toDatetimeLocal(shift.clock_in));
  const [clockOut, setClockOut] = useState(shift.clock_out ? toDatetimeLocal(shift.clock_out) : '');
  const update = useUpdateShift();

  async function save() {
    await update.mutateAsync({
      id: shift.id,
      clock_in: new Date(clockIn).toISOString(),
      clock_out: clockOut ? new Date(clockOut).toISOString() : null,
    });
    onClose();
  }

  return (
    <tr className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
      <td colSpan={numCols} className="px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end" dir="rtl">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">כניסה</p>
            <input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">יציאה (אופציונלי)</p>
            <input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-2 pb-0.5">
            <button onClick={save} disabled={update.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity">
              {update.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              שמור
            </button>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-secondary rounded-lg text-xs font-semibold transition-colors">
              <X className="w-3 h-3" /> ביטול
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Add shift form ───────────────────────────────────────────────────────────
function AddShiftForm({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const defaultDT = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:00`;
  const [clockIn, setClockIn] = useState(defaultDT);
  const [clockOut, setClockOut] = useState('');
  const create = useCreateShift();

  async function save() {
    if (!clockIn) return;
    await create.mutateAsync({
      employee_id: employeeId,
      clock_in: new Date(clockIn).toISOString(),
      clock_out: clockOut ? new Date(clockOut).toISOString() : null,
    });
    onClose();
  }

  return (
    <div className="border-t border-dashed border-primary/40 bg-primary/5 dark:bg-primary/10 px-4 py-3" dir="rtl">
      <p className="text-xs font-bold text-primary mb-2.5 flex items-center gap-1.5">
        <Plus className="w-3.5 h-3.5" /> הוספת משמרת ידנית
      </p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">כניסה *</p>
          <input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">יציאה (אופציונלי)</p>
          <input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 pb-0.5">
          <button onClick={save} disabled={create.isPending || !clockIn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity">
            {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            הוסף
          </button>
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-secondary rounded-lg text-xs font-semibold transition-colors">
            <X className="w-3 h-3" /> ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Daily breakdown table ────────────────────────────────────────────────────
function DailyBreakdown({ shifts, hourlyRate, employeeId }: {
  shifts: Shift[]; hourlyRate: number | null; employeeId: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const deleteShift = useDeleteShift();

  const numCols = hourlyRate ? 7 : 6;
  const totalHours = shifts.reduce((s, sh) => s + hoursFromShift(sh), 0);
  const totalCost = shifts.reduce((sum, s) => {
    if (!s.clock_out || !hourlyRate) return sum;
    return sum + calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate).totalCost;
  }, 0);

  return (
    <div className="border-t border-border/60">
      <div className="overflow-x-auto" dir="rtl">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-right">
              <th className="px-4 py-2.5 font-semibold">תאריך</th>
              <th className="px-3 py-2.5 font-semibold">יום</th>
              <th className="px-3 py-2.5 font-semibold">כניסה</th>
              <th className="px-3 py-2.5 font-semibold">יציאה</th>
              <th className="px-3 py-2.5 font-semibold">שעות</th>
              {hourlyRate && <th className="px-3 py-2.5 font-semibold">עלות</th>}
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {shifts.map(s => {
              const hours = hoursFromShift(s);
              const bd = s.clock_out && hourlyRate ? calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate) : null;
              const isSpecial = bd?.dayType === 'holiday' || bd?.dayType === 'friday';

              if (editingId === s.id) {
                return <EditShiftRow key={s.id} shift={s} numCols={numCols} onClose={() => setEditingId(null)} />;
              }

              return (
                <tr key={s.id} className={`hover:bg-muted/20 transition-colors ${isSpecial ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{fmtDate(s.clock_in)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{hebrewDay(s.clock_in)}</td>
                  <td className="px-3 py-2.5 font-mono font-medium">{fmtTime(s.clock_in)}</td>
                  <td className="px-3 py-2.5 font-mono font-medium">
                    {s.clock_out ? fmtTime(s.clock_out)
                      : <span className="text-emerald-600 text-[10px] bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-semibold">בעבודה</span>}
                  </td>
                  <td className="px-3 py-2.5 font-bold">{formatHours(hours)}</td>
                  {hourlyRate && (
                    <td className={`px-3 py-2.5 font-bold ${isSpecial ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                      {bd ? `₪${bd.totalCost.toFixed(0)}` : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={async () => { await deleteShift.mutateAsync(s.id); setDeletingId(null); }}
                          disabled={deleteShift.isPending}
                          className="text-[10px] px-2 py-1 bg-red-500 text-white rounded-md font-bold hover:bg-red-600 disabled:opacity-50">
                          {deleteShift.isPending ? '...' : 'מחק'}
                        </button>
                        <button onClick={() => setDeletingId(null)}
                          className="text-[10px] px-2 py-1 bg-muted rounded-md hover:bg-secondary">ביטול</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setEditingId(s.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors" title="ערוך">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeletingId(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors" title="מחק">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30 font-bold">
              <td colSpan={4} className="px-4 py-2.5 text-muted-foreground text-xs">סה״כ</td>
              <td className="px-3 py-2.5 text-sm">{formatHours(totalHours)}</td>
              {hourlyRate && (
                <td className="px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
                  {totalCost > 0 ? `₪${totalCost.toFixed(0)}` : '—'}
                </td>
              )}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {showAdd
        ? <AddShiftForm employeeId={employeeId} onClose={() => setShowAdd(false)} />
        : (
          <div className="px-4 py-2.5 border-t border-border/40">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/70 font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" /> הוסף משמרת ידנית
            </button>
          </div>
        )
      }
    </div>
  );
}

// ─── Employee card ────────────────────────────────────────────────────────────
interface EmployeeMonthData {
  id: string; name: string; employee_number: string;
  is_active: boolean; hourly_rate: number | null;
  shifts: Shift[]; days: number; totalHours: number; totalCost: number;
}

function EmployeeHoursCard({ emp, colorClass }: { emp: EmployeeMonthData; colorClass: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-all duration-200 ${
      expanded ? 'border-primary/30 shadow-md' : 'border-border shadow-sm hover:shadow-md hover:border-border/80'
    }`}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-right"
        onClick={() => setExpanded(p => !p)}
      >
        {/* Colored avatar */}
        <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shrink-0 text-white font-black text-lg shadow-sm`}>
          {emp.name.charAt(0)}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              emp.is_active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {emp.is_active ? 'פעיל' : 'לא פעיל'}
            </span>
            <p className="font-bold text-foreground">{emp.name}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PIN: {emp.employee_number}
            {emp.hourly_rate ? ` · ₪${emp.hourly_rate}/ש׳` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <div className="text-center min-w-[44px]">
            <p className="text-xl font-black tabular-nums text-foreground">{emp.days}</p>
            <p className="text-[10px] text-muted-foreground">ימים</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center min-w-[56px]">
            <p className="text-xl font-black tabular-nums text-foreground">{formatHours(emp.totalHours)}</p>
            <p className="text-[10px] text-muted-foreground">שעות</p>
          </div>
          {emp.totalCost > 0 && <>
            <div className="w-px h-8 bg-border/60" />
            <div className="text-center min-w-[64px]">
              <p className="text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">₪{emp.totalCost.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">עלות שכר</p>
            </div>
          </>}
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden flex flex-col items-end gap-0.5 shrink-0">
          <p className="font-black text-sm">{formatHours(emp.totalHours)}</p>
          <p className="text-[10px] text-muted-foreground">{emp.days} ימים</p>
        </div>

        <div className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors ${
          expanded ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
        }`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <DailyBreakdown shifts={emp.shifts} hourlyRate={emp.hourly_rate} employeeId={emp.id} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const AdminMonthlyHours: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [search, setSearch] = useState('');

  const { data: shifts = [], isLoading } = useMonthShifts(year, month);
  const { data: employees = [] } = useEmployees();
  const deleteAllShifts = useDeleteAllShifts();

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
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
        return { id: e.id, name: e.name, employee_number: e.employee_number,
          is_active: e.is_active, hourly_rate: e.hourly_rate,
          shifts: empShifts, days: uniqueDays, totalHours, totalCost };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [shifts, employees]);

  const filteredData = useMemo(() =>
    search.trim()
      ? employeeData.filter(e => e.name.toLowerCase().includes(search.trim().toLowerCase()))
      : employeeData,
    [employeeData, search]);

  const totalDays = employeeData.reduce((s, e) => s + e.days, 0);
  const totalHours = employeeData.reduce((s, e) => s + e.totalHours, 0);
  const totalCost = employeeData.reduce((s, e) => s + e.totalCost, 0);

  return (
    <div className="space-y-5" dir="rtl">

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-gradient-to-l from-primary/5 to-transparent rounded-2xl px-5 py-4 border border-border/60">
        <button onClick={prevMonth}
          className="w-10 h-10 rounded-xl bg-background hover:bg-secondary border border-border flex items-center justify-center transition-colors shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-foreground tracking-tight">{HEBREW_MONTHS[month - 1]} {year}</h2>
          {isCurrentMonth && (
            <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full">חודש נוכחי</span>
          )}
        </div>
        <button onClick={nextMonth} disabled={isCurrentMonth}
          className="w-10 h-10 rounded-xl bg-background hover:bg-secondary border border-border flex items-center justify-center transition-colors shadow-sm disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש עובד לפי שם..."
          className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          dir="rtl"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'עובדים פעילים', value: String(employeeData.length), cls: 'text-foreground' },
          { label: 'ימי עבודה', value: String(totalDays), cls: 'text-foreground' },
          { label: 'סה״כ שעות', value: formatHours(totalHours), cls: 'text-foreground' },
          { label: 'עלות שכר', value: totalCost > 0 ? `₪${totalCost.toFixed(0)}` : '—', cls: 'text-amber-600 dark:text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-2xl font-black tabular-nums ${stat.cls}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Employee cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">טוען נתונים...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-14 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">
            {search ? `לא נמצא עובד בשם "${search}"` : 'אין נתוני שעות לחודש זה'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'נסה שם אחר' : 'כניסות ויציאות יופיעו כאן'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData.map((emp, i) => (
            <EmployeeHoursCard key={emp.id} emp={emp} colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
          ))}
        </div>
      )}

      {/* Reset zone */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-800 dark:text-red-400">איפוס כל השעות</p>
              <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                מוחק את כל המשמרות מהמערכת — פעולה בלתי הפיכה
              </p>
            </div>
          </div>
          {resetConfirm ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-red-700 dark:text-red-400 font-semibold">בטוח?</span>
              <button
                onClick={async () => { await deleteAllShifts.mutateAsync(); setResetConfirm(false); }}
                disabled={deleteAllShifts.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleteAllShifts.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                מחק הכל
              </button>
              <button onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 bg-muted hover:bg-secondary rounded-xl text-xs font-semibold transition-colors">
                ביטול
              </button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              אפס שעות
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMonthlyHours;
