import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, TrendingUp, ShoppingBag, ReceiptText,
  ChevronDown, ChevronUp, Loader2, Calendar, Clock,
} from 'lucide-react';
import { useEmployeePerformance, useEmployeeOrders, PeriodFilter } from '@/hooks/useEmployeePerformance';
import { useAllShifts, useEmployeeShifts, hoursFromShift } from '@/hooks/useShifts';

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'שבוע' },
  { value: 'month', label: '30 יום' },
  { value: 'all', label: 'הכל' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'מזומן',
  credit: 'אשראי',
  app: 'אפליקציה',
  other: 'אחר',
};

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-muted/60 rounded-xl">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EmployeeOrderHistory({ employeeId, period }: { employeeId: string; period: PeriodFilter }) {
  const { data: orders, isLoading } = useEmployeeOrders(employeeId, period);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        אין הזמנות בתקופה זו
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-1.5 pr-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">
                {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-muted-foreground">שולחן {order.table_number}</span>
              <span className="text-xs text-muted-foreground">{order.items_count} פריטים</span>
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

function ShiftHistory({ employeeId, period }: { employeeId: string; period: PeriodFilter }) {
  const { data: shifts } = useEmployeeShifts(employeeId, period);
  if (!shifts || shifts.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">משמרות</p>
      <ScrollArea className="max-h-40">
        <div className="space-y-1 pr-1">
          {shifts.map((s) => {
            const hours = hoursFromShift(s);
            const inTime = new Date(s.clock_in).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const outTime = s.clock_out
              ? new Date(s.clock_out).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
              : '—';
            const date = new Date(s.clock_in).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
            return (
              <div key={s.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/40 text-xs">
                <span className="text-muted-foreground w-14 shrink-0">{date}</span>
                <span>{inTime} – {outTime}</span>
                <span className="font-semibold">{hours.toFixed(1)}ש׳</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmployeeCard({ emp, period }: { emp: ReturnType<typeof useEmployeePerformance>['data'] extends (infer T)[] | undefined ? T : never; period: PeriodFilter }) {
  const [expanded, setExpanded] = useState(false);
  const { data: shifts } = useEmployeeShifts(emp.id, period);
  const totalHours = (shifts ?? []).reduce((sum, s) => sum + hoursFromShift(s), 0);

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${emp.is_active ? 'border-border bg-card' : 'border-border/40 bg-muted/30 opacity-60'}`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 px-4 py-4 text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-mono text-base font-bold text-primary">{emp.employee_number}</span>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{emp.name}</p>
          <p className="text-xs text-muted-foreground">{emp.is_active ? 'פעיל' : 'מושבת'}</p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-lg font-black text-foreground">₪{emp.totalSales.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">סה"כ מכירות</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{emp.totalOrders}</p>
            <p className="text-[10px] text-muted-foreground">הזמנות</p>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Stat chips */}
          <div className="grid grid-cols-4 gap-2">
            <StatChip
              icon={<Clock className="w-4 h-4" />}
              label="שעות"
              value={`${totalHours.toFixed(1)}ש׳`}
            />
            <StatChip
              icon={<ReceiptText className="w-4 h-4" />}
              label="הזמנות"
              value={String(emp.totalOrders)}
            />
            <StatChip
              icon={<ShoppingBag className="w-4 h-4" />}
              label="פריטים"
              value={String(emp.totalItems)}
            />
            <StatChip
              icon={<TrendingUp className="w-4 h-4" />}
              label="ממוצע"
              value={`₪${emp.avgPerOrder.toFixed(0)}`}
            />
          </div>

          {/* Mobile sales total */}
          <div className="sm:hidden flex justify-between text-sm">
            <span className="text-muted-foreground">סה"כ מכירות</span>
            <span className="font-black text-foreground">₪{emp.totalSales.toFixed(2)}</span>
          </div>

          {/* Shift history */}
          <ShiftHistory employeeId={emp.id} period={period} />

          {/* Order history */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              היסטוריית הזמנות
            </p>
            <EmployeeOrderHistory employeeId={emp.id} period={period} />
          </div>
        </div>
      )}
    </div>
  );
}

const AdminEmployeePerformance: React.FC = () => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const { data: employees, isLoading } = useEmployeePerformance(period);
  const { data: allShifts } = useAllShifts(period);

  const totalSales = employees?.reduce((s, e) => s + e.totalSales, 0) ?? 0;
  const totalOrders = employees?.reduce((s, e) => s + e.totalOrders, 0) ?? 0;
  const totalHours = (allShifts ?? []).reduce((s, sh) => s + hoursFromShift(sh), 0);
  const topEmployee = employees?.reduce<typeof employees[0] | null>(
    (top, e) => (!top || e.totalSales > top.totalSales ? e : top),
    null
  );

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">סה"כ מכירות</p>
            <p className="text-2xl font-black text-foreground">₪{totalSales.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">סה"כ הזמנות</p>
            <p className="text-2xl font-black text-foreground">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">סה"כ שעות</p>
            <p className="text-2xl font-black text-foreground">{totalHours.toFixed(1)}ש׳</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">מוביל</p>
            <p className="text-sm font-bold text-foreground truncate">
              {topEmployee?.totalOrders ? topEmployee.name : '—'}
            </p>
          </CardContent>
        </Card>
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
            .map((emp) => (
              <EmployeeCard key={emp.id} emp={emp} period={period} />
            ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">אין עובדים רשומים</p>
        </div>
      )}
    </div>
  );
};

export default AdminEmployeePerformance;
