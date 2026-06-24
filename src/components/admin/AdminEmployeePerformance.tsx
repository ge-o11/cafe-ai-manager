import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, TrendingUp, ShoppingBag, ReceiptText,
  ChevronDown, ChevronUp, Loader2, Calendar, Clock, Banknote,
} from 'lucide-react';
import { useEmployeePerformance, useEmployeeOrders, PeriodFilter } from '@/hooks/useEmployeePerformance';
import { useAllShifts, useEmployeeShifts, hoursFromShift, Shift } from '@/hooks/useShifts';
import { useEmployees } from '@/hooks/useEmployees';
import { calculateOvertimeCost, formatHours, OvertimeBreakdown } from '@/lib/israeliLaborLaw';
import AdminMonthlyHours from './AdminMonthlyHours';

type TabId = 'performance' | 'hours';

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'שבוע' },
  { value: 'month', label: '30 יום' },
  { value: 'all', label: 'הכל' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'מזומן', credit: 'אשראי', app: 'אפליקציה', other: 'אחר',
};

const DAY_TYPE_LABEL: Record<string, string> = {
  regular: '', friday: 'ערב שבת/חג', holiday: 'שבת/חג', holiday_eve: 'ערב חג',
};

function StatChip({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl ${highlight ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted/60'}`}>
      <div className="text-muted-foreground">{icon}</div>
      <span className={`text-sm font-bold ${highlight ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function calcShiftsCost(shifts: Shift[], hourlyRate: number): { total: number; regular: number; ot125: number; ot150: number; holiday: number } {
  const zero = { total: 0, regular: 0, ot125: 0, ot150: 0, holiday: 0 };
  return shifts.reduce((acc, s) => {
    if (!s.clock_out) return acc;
    const b = calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate);
    return {
      total: acc.total + b.totalCost,
      regular: acc.regular + b.regularHours,
      ot125: acc.ot125 + b.overtime125Hours,
      ot150: acc.ot150 + b.overtime150Hours,
      holiday: acc.holiday + b.holidayHours,
    };
  }, zero);
}

function EmployeeOrderHistory({ employeeId, period }: { employeeId: string; period: PeriodFilter }) {
  const { data: orders, isLoading } = useEmployeeOrders(employeeId, period);
  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>;
  if (!orders || orders.length === 0) return <p className="text-center text-sm text-muted-foreground py-4">אין הזמנות בתקופה זו</p>;
  return (
    <ScrollArea className="max-h-52">
      <div className="space-y-1.5 pr-1">
        {orders.map(order => (
          <div key={order.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-12 shrink-0">
                {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-muted-foreground">שולחן {order.table_number}</span>
              <span className="text-xs text-muted-foreground">{order.items_count} פר׳</span>
              {order.payment_method && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                </Badge>
              )}
            </div>
            <span className="font-bold text-foreground shrink-0">₪{order.total_price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ShiftHistory({ shifts, hourlyRate }: { shifts: Shift[]; hourlyRate: number | null }) {
  if (shifts.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">משמרות</p>
      <ScrollArea className="max-h-52">
        <div className="space-y-1.5 pr-1">
          {shifts.map(s => {
            const hours = hoursFromShift(s);
            const inTime = new Date(s.clock_in).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const outTime = s.clock_out
              ? new Date(s.clock_out).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
              : 'בעבודה';
            const date = new Date(s.clock_in).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
            const breakdown: OvertimeBreakdown | null =
              s.clock_out && hourlyRate ? calculateOvertimeCost(s.clock_in, s.clock_out, hourlyRate) : null;

            return (
              <div key={s.id} className={`px-3 py-2 rounded-lg text-xs space-y-1 ${
                breakdown?.dayType === 'holiday' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' :
                breakdown?.dayType === 'friday' ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-muted/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-12 shrink-0">{date}</span>
                    <span className="font-medium">{inTime} – {outTime}</span>
                    <span className="text-muted-foreground">{formatHours(hours)}</span>
                    {breakdown?.dayType && DAY_TYPE_LABEL[breakdown.dayType] && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-700 dark:text-amber-300">
                        {DAY_TYPE_LABEL[breakdown.dayType]}
                      </Badge>
                    )}
                  </div>
                  {breakdown && (
                    <span className="font-bold text-foreground">₪{breakdown.totalCost.toFixed(2)}</span>
                  )}
                </div>

                {/* Overtime breakdown */}
                {breakdown && (breakdown.overtime125Hours > 0 || breakdown.overtime150Hours > 0 || breakdown.holidayHours > 0) && (
                  <div className="flex gap-3 text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                    {breakdown.regularHours > 0 && (
                      <span>{formatHours(breakdown.regularHours)} × 100%</span>
                    )}
                    {breakdown.overtime125Hours > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {formatHours(breakdown.overtime125Hours)} × 125%
                      </span>
                    )}
                    {breakdown.overtime150Hours > 0 && (
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        {formatHours(breakdown.overtime150Hours)} × 150%
                      </span>
                    )}
                    {breakdown.holidayHours > 0 && (
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {formatHours(breakdown.holidayHours)} × 150% (חג)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmployeeCard({
  emp,
  period,
  hourlyRate,
}: {
  emp: ReturnType<typeof useEmployeePerformance>['data'] extends (infer T)[] | undefined ? T : never;
  period: PeriodFilter;
  hourlyRate: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: shifts = [] } = useEmployeeShifts(emp.id, period);
  const totalHours = shifts.reduce((sum, s) => sum + hoursFromShift(s), 0);
  const costBreakdown = hourlyRate ? calcShiftsCost(shifts, hourlyRate) : null;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${emp.is_active ? 'border-border bg-card' : 'border-border/40 bg-muted/30 opacity-60'}`}>
      <button className="w-full flex items-center gap-4 px-4 py-4 text-left" onClick={() => setExpanded(p => !p)}>
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-mono text-base font-bold text-primary">{emp.employee_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{emp.name}</p>
          <p className="text-xs text-muted-foreground">
            {emp.is_active ? 'פעיל' : 'מושבת'}
            {hourlyRate ? ` · ₪${hourlyRate}/ש׳` : ''}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-lg font-black text-foreground">₪{emp.totalSales.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">מכירות</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{formatHours(totalHours)}</p>
            <p className="text-[10px] text-muted-foreground">שעות</p>
          </div>
          {costBreakdown && (
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">₪{costBreakdown.total.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">עלות שכר</p>
            </div>
          )}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatChip icon={<Clock className="w-4 h-4" />} label="שעות" value={formatHours(totalHours)} />
            <StatChip icon={<ReceiptText className="w-4 h-4" />} label="הזמנות" value={String(emp.totalOrders)} />
            <StatChip icon={<ShoppingBag className="w-4 h-4" />} label="פריטים" value={String(emp.totalItems)} />
            <StatChip icon={<TrendingUp className="w-4 h-4" />} label="ממוצע" value={`₪${emp.avgPerOrder.toFixed(0)}`} />
          </div>

          {/* Cost breakdown */}
          {costBreakdown && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 space-y-1.5 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">עלות שכר</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שעות רגילות ({formatHours(costBreakdown.regular)})</span>
                  <span className="font-medium">₪{(costBreakdown.regular * (hourlyRate ?? 0)).toFixed(2)}</span>
                </div>
                {costBreakdown.ot125 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-600 dark:text-amber-400">שע"נ 125% ({formatHours(costBreakdown.ot125)})</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">₪{(costBreakdown.ot125 * (hourlyRate ?? 0) * 1.25).toFixed(2)}</span>
                  </div>
                )}
                {costBreakdown.ot150 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-orange-600 dark:text-orange-400">שע"נ 150% ({formatHours(costBreakdown.ot150)})</span>
                    <span className="font-medium text-orange-700 dark:text-orange-300">₪{(costBreakdown.ot150 * (hourlyRate ?? 0) * 1.5).toFixed(2)}</span>
                  </div>
                )}
                {costBreakdown.holiday > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">שבת/חג ({formatHours(costBreakdown.holiday)})</span>
                    <span className="font-medium text-red-700 dark:text-red-300">₪{(costBreakdown.holiday * (hourlyRate ?? 0) * 1.5).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-1.5 border-t border-amber-300 dark:border-amber-700 font-bold text-sm">
                <span>סה"כ</span>
                <span className="text-amber-700 dark:text-amber-300">₪{costBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {!hourlyRate && (
            <p className="text-xs text-muted-foreground text-center">
              הגדר שכר שעתי בלשונית "עובדים" לחישוב עלות שכר
            </p>
          )}

          <ShiftHistory shifts={shifts} hourlyRate={hourlyRate} />

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">היסטוריית הזמנות</p>
            <EmployeeOrderHistory employeeId={emp.id} period={period} />
          </div>
        </div>
      )}
    </div>
  );
}

const AdminEmployeePerformance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('performance');
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const { data: employees, isLoading } = useEmployeePerformance(period);
  const { data: allShifts = [] } = useAllShifts(period);
  const { data: employeesList = [] } = useEmployees();

  const rateMap = Object.fromEntries(employeesList.map(e => [e.id, e.hourly_rate]));

  const totalSales = employees?.reduce((s, e) => s + e.totalSales, 0) ?? 0;
  const totalOrders = employees?.reduce((s, e) => s + e.totalOrders, 0) ?? 0;
  const totalHours = allShifts.reduce((s, sh) => s + hoursFromShift(sh), 0);

  const totalLaborCost = allShifts.reduce((sum, s) => {
    if (!s.clock_out) return sum;
    const rate = rateMap[s.employee_id];
    if (!rate) return sum;
    return sum + calculateOvertimeCost(s.clock_in, s.clock_out, rate).totalCost;
  }, 0);

  const topEmployee = employees?.reduce<typeof employees[0] | null>(
    (top, e) => (!top || e.totalSales > top.totalSales ? e : top), null
  );

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit" dir="rtl">
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'performance' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ביצועים
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'hours' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          שעות עובדים
        </button>
      </div>

      {activeTab === 'hours' && <AdminMonthlyHours />}

      {activeTab === 'performance' && <>
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">סה"כ מכירות</p>
          <p className="text-2xl font-black text-foreground">₪{totalSales.toFixed(0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">סה"כ הזמנות</p>
          <p className="text-2xl font-black text-foreground">{totalOrders}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">סה"כ שעות</p>
          <p className="text-2xl font-black text-foreground">{formatHours(totalHours)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">עלות שכר כוללת</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalLaborCost > 0 ? `₪${totalLaborCost.toFixed(0)}` : '—'}
          </p>
        </CardContent></Card>
      </div>

      {/* Employee list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : employees && employees.length > 0 ? (
        <div className="space-y-2">
          {[...employees]
            .sort((a, b) => b.totalSales - a.totalSales)
            .map(emp => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                period={period}
                hourlyRate={rateMap[emp.id] ?? null}
              />
            ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">אין עובדים רשומים</p>
        </div>
      )}
      </>}
    </div>
  );
};

export default AdminEmployeePerformance;
