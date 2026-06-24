import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useMenu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, ShoppingBag, DollarSign, Clock, BarChart3,
  Printer, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Minus as MinusIcon, Package, TrendingUp, Download,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, BarChart,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'year';

interface KPIData { revenue: number; count: number; avg: number; peakHour: string }
interface ChartPoint { label: string; current: number; previous: number }
interface ProductRow { name: string; count: number; revenue: number; cost: number; profit: number; margin: number; pct: number }
interface CategorySlice { name: string; value: number }

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#f59e0b','#92400e','#059669','#1d4ed8','#7c3aed','#dc2626','#0891b2','#d97706','#65a30d','#be185d'];
const MONTH_LABELS_HE = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];
const DAY_LABELS_HE   = ["א'","ב'","ג'","ד'","ה'","ו'","ש'"];

// ─── Date utilities ───────────────────────────────────────────────────────────

function getDateRange(period: Period, ref: Date) {
  const y = ref.getFullYear(), m = ref.getMonth(), d = ref.getDate();
  if (period === 'day') {
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const end   = new Date(y, m, d, 23, 59, 59, 999);
    const ps    = new Date(y, m, d - 1, 0, 0, 0, 0);
    const pe    = new Date(y, m, d - 1, 23, 59, 59, 999);
    return { start, end, prevStart: ps, prevEnd: pe };
  }
  if (period === 'week') {
    const dow   = ref.getDay(); // 0=Sun … 6=Sat (Israeli week starts Sunday)
    const start = new Date(y, m, d - dow, 0, 0, 0, 0);
    const end   = new Date(y, m, d - dow + 6, 23, 59, 59, 999);
    const ps    = new Date(y, m, d - dow - 7, 0, 0, 0, 0);
    const pe    = new Date(y, m, d - dow - 1, 23, 59, 59, 999);
    return { start, end, prevStart: ps, prevEnd: pe };
  }
  if (period === 'month') {
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59, 999);
    const ps    = new Date(y, m - 1, 1);
    const pe    = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end, prevStart: ps, prevEnd: pe };
  }
  // year
  const start = new Date(y, 0, 1);
  const end   = new Date(y, 11, 31, 23, 59, 59, 999);
  const ps    = new Date(y - 1, 0, 1);
  const pe    = new Date(y - 1, 11, 31, 23, 59, 59, 999);
  return { start, end, prevStart: ps, prevEnd: pe };
}

function navigate(period: Period, date: Date, dir: -1 | 1): Date {
  const d = new Date(date);
  if (period === 'day')   d.setDate(d.getDate() + dir);
  if (period === 'week')  d.setDate(d.getDate() + dir * 7);
  if (period === 'month') d.setMonth(d.getMonth() + dir);
  if (period === 'year')  d.setFullYear(d.getFullYear() + dir);
  return d;
}

function periodLabel(period: Period, date: Date): string {
  if (period === 'day')
    return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (period === 'week') {
    const dow   = date.getDay();
    const start = new Date(date); start.setDate(date.getDate() - dow);
    const end   = new Date(start); end.setDate(start.getDate() + 6);
    const fmt   = (d: Date) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
    return `שבוע ${fmt(start)} – ${fmt(end)}`;
  }
  if (period === 'month')
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  return String(date.getFullYear());
}

function prevPeriodLabel(period: Period): string {
  if (period === 'day')   return 'אתמול';
  if (period === 'week')  return 'שבוע קודם';
  if (period === 'month') return 'חודש קודם';
  return 'שנה קודמת';
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeKPIs(orders: any[]): KPIData {
  const revenue = orders.reduce((s, o) => s + Number(o.total_price), 0);
  const count = orders.length;
  const avg = count > 0 ? revenue / count : 0;
  const byHour: Record<number, number> = {};
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const peakEntry = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  return { revenue, count, avg, peakHour: peakEntry ? `${peakEntry[0]}:00` : '—' };
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function buildChartData(period: Period, current: any[], previous: any[]): ChartPoint[] {
  const curr: Record<string, number> = {};
  const prev: Record<string, number> = {};

  if (period === 'day') {
    for (let h = 0; h < 24; h++) { curr[h] = 0; prev[h] = 0; }
    current.forEach(o  => { const h = new Date(o.created_at).getHours();  curr[h] = (curr[h] || 0) + Number(o.total_price); });
    previous.forEach(o => { const h = new Date(o.created_at).getHours();  prev[h] = (prev[h] || 0) + Number(o.total_price); });
    return Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, current: +((curr[h] || 0).toFixed(2)), previous: +((prev[h] || 0).toFixed(2)) }));
  }

  if (period === 'week') {
    for (let day = 0; day < 7; day++) { curr[day] = 0; prev[day] = 0; }
    current.forEach(o  => { const day = new Date(o.created_at).getDay();  curr[day] = (curr[day] || 0) + Number(o.total_price); });
    previous.forEach(o => { const day = new Date(o.created_at).getDay(); prev[day] = (prev[day] || 0) + Number(o.total_price); });
    return DAY_LABELS_HE.map((label, day) => ({ label, current: +((curr[day] || 0).toFixed(2)), previous: +((prev[day] || 0).toFixed(2)) }));
  }

  if (period === 'month') {
    const ref = current[0]?.created_at ? new Date(current[0].created_at) : new Date();
    const days = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= 31; d++) { curr[d] = 0; prev[d] = 0; }
    current.forEach(o  => { const d = new Date(o.created_at).getDate();  curr[d] = (curr[d] || 0) + Number(o.total_price); });
    previous.forEach(o => { const d = new Date(o.created_at).getDate();  prev[d] = (prev[d] || 0) + Number(o.total_price); });
    return Array.from({ length: days }, (_, i) => ({ label: String(i + 1), current: +((curr[i + 1] || 0).toFixed(2)), previous: +((prev[i + 1] || 0).toFixed(2)) }));
  }

  // year
  for (let m = 0; m < 12; m++) { curr[m] = 0; prev[m] = 0; }
  current.forEach(o  => { const m = new Date(o.created_at).getMonth();  curr[m] = (curr[m] || 0) + Number(o.total_price); });
  previous.forEach(o => { const m = new Date(o.created_at).getMonth();  prev[m] = (prev[m] || 0) + Number(o.total_price); });
  return MONTH_LABELS_HE.map((label, m) => ({ label, current: +((curr[m] || 0).toFixed(2)), previous: +((prev[m] || 0).toFixed(2)) }));
}

function buildProducts(orders: any[], getName: (x: any) => string): ProductRow[] {
  const map: Record<string, ProductRow> = {};
  const total = orders.reduce((s, o) => s + Number(o.total_price), 0);
  orders.forEach(o => {
    o.order_items.forEach((oi: any) => {
      const id = oi.product_id;
      if (!map[id]) map[id] = { name: getName(oi.menu_items), count: 0, revenue: 0, cost: 0, profit: 0, margin: 0, pct: 0 };
      const itemRevenue = oi.quantity * Number(oi.unit_price);
      const costPrice = oi.menu_items?.cost_price != null ? Number(oi.menu_items.cost_price) : null;
      const itemCost = costPrice !== null ? oi.quantity * costPrice : 0;
      map[id].count   += oi.quantity;
      map[id].revenue += itemRevenue;
      map[id].cost    += itemCost;
    });
  });
  return Object.values(map)
    .map(p => {
      const revenue = +p.revenue.toFixed(2);
      const cost    = +p.cost.toFixed(2);
      const profit  = +(revenue - cost).toFixed(2);
      const margin  = revenue > 0 ? +((profit / revenue) * 100).toFixed(1) : 0;
      return { ...p, revenue, cost, profit, margin, pct: total > 0 ? +(revenue / total * 100).toFixed(1) : 0 };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

function exportCSV(products: ProductRow[], kpis: KPIData, period: Period, label: string) {
  const hasCost = products.some(p => p.cost > 0);
  const bom = '﻿'; // UTF-8 BOM for Excel Hebrew support
  const periodLabels: Record<Period, string> = { day: 'יומי', week: 'שבועי', month: 'חודשי', year: 'שנתי' };

  const rows: string[][] = [
    ['דוח ' + periodLabels[period] + ' — ' + label],
    ['הופק:', new Date().toLocaleString('he-IL')],
    [],
    ['סיכום'],
    ['הכנסה', 'מספר הזמנות', 'ממוצע להזמנה', 'שעת שיא'],
    [
      '₪' + kpis.revenue.toFixed(2),
      String(kpis.count),
      kpis.count > 0 ? '₪' + kpis.avg.toFixed(2) : '—',
      kpis.peakHour,
    ],
    [],
    ['ביצועי מוצרים'],
    hasCost
      ? ['#', 'מוצר', 'כמות', 'הכנסה (₪)', 'עלות (₪)', 'רווח גולמי (₪)', 'מרג׳ין %', '% מהכלל']
      : ['#', 'מוצר', 'כמות', 'הכנסה (₪)', '% מהכלל'],
    ...products.map((p, i) =>
      hasCost
        ? [String(i + 1), p.name, String(p.count), p.revenue.toFixed(2), p.cost.toFixed(2), p.profit.toFixed(2), p.margin.toFixed(1) + '%', p.pct + '%']
        : [String(i + 1), p.name, String(p.count), p.revenue.toFixed(2), p.pct + '%']
    ),
    hasCost
      ? ['', 'סה"כ', String(products.reduce((s, p) => s + p.count, 0)),
          products.reduce((s, p) => s + p.revenue, 0).toFixed(2),
          products.reduce((s, p) => s + p.cost, 0).toFixed(2),
          products.reduce((s, p) => s + p.profit, 0).toFixed(2), '', '100%']
      : ['', 'סה"כ', String(products.reduce((s, p) => s + p.count, 0)),
          products.reduce((s, p) => s + p.revenue, 0).toFixed(2), '100%'],
  ];

  const csv = bom + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cafe-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildCategories(orders: any[], categories: any[], getName: (x: any) => string): CategorySlice[] {
  const map: Record<string, number> = {};
  orders.forEach(o => {
    o.order_items.forEach((oi: any) => {
      const catId = oi.menu_items?.category_id;
      if (catId) map[catId] = (map[catId] || 0) + oi.quantity * Number(oi.unit_price);
    });
  });
  return Object.entries(map)
    .map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat ? getName(cat) : 'אחר', value: +value.toFixed(2) };
    })
    .sort((a, b) => b.value - a.value);
}

function buildPeakHours(orders: any[]): { hour: string; orders: number }[] {
  const by: Record<number, number> = {};
  for (let h = 6; h <= 23; h++) by[h] = 0;
  orders.forEach(o => { const h = new Date(o.created_at).getHours(); by[h] = (by[h] || 0) + 1; });
  return Object.entries(by).map(([h, c]) => ({ hour: `${h}:00`, orders: c }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Delta: React.FC<{ value: number | null }> = ({ value }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
      <ArrowUpRight className="w-3 h-3" />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-red-600 dark:text-red-400">
      <ArrowDownRight className="w-3 h-3" />{value}%
    </span>
  );
  return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MinusIcon className="w-3 h-3" />0%</span>;
};

const KPICard: React.FC<{
  title: string; value: string; delta: number | null; sub: string; icon: React.ReactNode;
}> = ({ title, value, delta, sub, icon }) => (
  <Card className="print:break-inside-avoid print:shadow-none print:border print:border-gray-300">
    <CardContent className="p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 print:hidden">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Delta value={delta} />
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type AdminReportsSection = 'kpis' | 'chart' | 'payment' | 'category' | 'products';

const AdminReports: React.FC<{ section?: AdminReportsSection }> = ({ section }) => {
  const { language } = useLanguage();
  const { data: categories = [] } = useCategories();

  const [period, setPeriod] = useState<Period>('day');
  const [refDate, setRefDate] = useState(() => new Date());
  const [sortCol, setSortCol] = useState<keyof ProductRow>('count');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  // Inject print CSS once
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'cafe-reports-print';
    style.textContent = `
      @media print {
        @page { margin: 18mm 20mm; size: A4 portrait; }
        *, *::before, *::after { box-shadow: none !important; }
        body { font-size: 11px; color: #111; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-hide { display: none !important; }
        #cafe-report-root { background: #fff !important; color: #111 !important; }

        /* cards */
        [class*="rounded"], [class*="card"] {
          background: #fff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          margin-bottom: 14px;
          page-break-inside: avoid;
        }

        /* table */
        table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
        table th { background: #f3f4f6 !important; color: #374151 !important; border: 1px solid #d1d5db; padding: 6px 10px; font-size: 10px; text-align: right; }
        table td { border: 1px solid #e5e7eb; padding: 5px 10px; font-size: 10px; }
        table tfoot td { background: #f9fafb !important; font-weight: 700; border-top: 2px solid #9ca3af; }

        /* chart scaling */
        .recharts-wrapper, .recharts-wrapper svg { max-width: 100% !important; }

        /* progress bars in table – hide in print, already hidden via print:hidden but reinforce */
        .flex-1.bg-muted { display: none !important; }

        /* KPI grid – two columns in print */
        .grid-cols-2, .lg\\:grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }

        /* muted text keep readable */
        [class*="text-muted"] { color: #6b7280 !important; }

        h1, h2, h3 { color: #111 !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById('cafe-reports-print')?.remove();
  }, []);

  const { start, end, prevStart, prevEnd } = useMemo(() => getDateRange(period, refDate), [period, refDate]);

  const queryOpts = (s: Date, e: Date) => ({
    queryKey: ['report', s.toISOString(), e.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, total_price, created_at, status, payment_method,
          order_items (quantity, unit_price, product_id,
            menu_items (name_en, name_he, name_ar, name_ru, category_id, cost_price))`)
        .gte('created_at', s.toISOString())
        .lte('created_at', e.toISOString())
        .neq('status', 'cancelled');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentOrders = [], isLoading: loadCurr } = useQuery(queryOpts(start, end));
  const { data: prevOrders   = [], isLoading: loadPrev } = useQuery(queryOpts(prevStart, prevEnd));
  const isLoading = loadCurr || loadPrev;

  const getName = useCallback((item: any) => {
    if (!item) return '—';
    switch (language) {
      case 'he': return item.name_he || item.name_en;
      case 'ar': return item.name_ar || item.name_en;
      case 'ru': return item.name_ru || item.name_en;
      default:   return item.name_en;
    }
  }, [language]);

  const kpis     = useMemo(() => computeKPIs(currentOrders), [currentOrders]);
  const prevKpis = useMemo(() => computeKPIs(prevOrders),    [prevOrders]);
  const chart    = useMemo(() => buildChartData(period, currentOrders, prevOrders), [period, currentOrders, prevOrders]);
  const cats     = useMemo(() => buildCategories(currentOrders, categories, getName), [currentOrders, categories, getName]);
  const peak     = useMemo(() => buildPeakHours(currentOrders), [currentOrders]);
  const products = useMemo(() => {
    const rows = buildProducts(currentOrders, getName);
    return [...rows].sort((a, b) => sortDir * ((a[sortCol] as number) - (b[sortCol] as number)));
  }, [currentOrders, getName, sortCol, sortDir]);

  const label    = periodLabel(period, refDate);
  const prevSub  = prevPeriodLabel(period);

  const PERIOD_TABS: { key: Period; label: string }[] = [
    { key: 'day',   label: 'יומי' },
    { key: 'week',  label: 'שבועי' },
    { key: 'month', label: 'חודשי' },
    { key: 'year',  label: 'שנתי' },
  ];

  const handleSort = (col: keyof ProductRow) => {
    if (sortCol === col) setSortDir(d => (d === -1 ? 1 : -1));
    else { setSortCol(col); setSortDir(-1); }
  };

  const SortTh: React.FC<{ col: keyof ProductRow; children: React.ReactNode }> = ({ col, children }) => (
    <th
      className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(col)}
    >
      {children} {sortCol === col ? (sortDir === -1 ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div id="cafe-report-root" className="space-y-6">

      {/* ── Print-only header ─────────────────────────────────────────────── */}
      <div className="hidden print:block mb-8">
        {/* top colour bar */}
        <div style={{ background: '#92400e', height: 6, borderRadius: 3, marginBottom: 16 }} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#92400e', letterSpacing: '0.15em' }}>
              Cafe Nof — ניהול עסקי
            </p>
            <h1 className="text-3xl font-black text-gray-900 mt-1">
              דוח {PERIOD_TABS.find(t => t.key === period)?.label}
            </h1>
            <h2 className="text-base font-semibold text-gray-600 mt-0.5">{label}</h2>
          </div>
          <div className="text-left text-xs text-gray-500 space-y-1" style={{ minWidth: 160 }}>
            <p><span className="font-semibold text-gray-700">הופק:</span> {new Date().toLocaleDateString('he-IL', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}</p>
            <p><span className="font-semibold text-gray-700">שעה:</span> {new Date().toLocaleTimeString('he-IL', {
              hour: '2-digit', minute: '2-digit',
            })}</p>
            <p className="mt-2 text-gray-400">השוואה ל{prevSub}</p>
          </div>
        </div>
        <div style={{ borderBottom: '2px solid #e5e7eb', marginTop: 12 }} />
      </div>

      {/* ── Controls (screen only) ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print-hide">
        {/* Period tabs */}
        <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
          {PERIOD_TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                period === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => { setPeriod(tab.key); setRefDate(new Date()); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9"
            onClick={() => setRefDate(d => navigate(period, d, -1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[160px] text-center">{label}</span>
          <Button variant="outline" size="icon" className="h-9 w-9"
            disabled={navigate(period, refDate, 1) > new Date()}
            onClick={() => setRefDate(d => navigate(period, d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV export */}
          <Button
            onClick={() => exportCSV(products, kpis, period, label)}
            variant="outline"
            className="gap-2 font-semibold"
            disabled={products.length === 0}
          >
            <Download className="w-4 h-4" />
            ייצוא CSV
          </Button>
          {/* Print button */}
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
          >
            <Printer className="w-4 h-4" />
            הדפס דוח
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          {(!section || section === 'kpis') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="הכנסה"
              value={`₪${kpis.revenue.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              delta={pct(kpis.revenue, prevKpis.revenue)}
              sub={prevSub}
              icon={<DollarSign className="w-5 h-5 text-primary" />}
            />
            <KPICard
              title="מספר הזמנות"
              value={String(kpis.count)}
              delta={pct(kpis.count, prevKpis.count)}
              sub={prevSub}
              icon={<ShoppingBag className="w-5 h-5 text-primary" />}
            />
            <KPICard
              title="ממוצע להזמנה"
              value={kpis.count > 0 ? `₪${kpis.avg.toFixed(2)}` : '—'}
              delta={pct(kpis.avg, prevKpis.avg)}
              sub={prevSub}
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
            />
            <KPICard
              title="שעת שיא"
              value={kpis.peakHour}
              delta={null}
              sub="הכי הרבה הזמנות"
              icon={<Clock className="w-5 h-5 text-primary" />}
            />
          </div>
          )}

          {/* ── Profitability KPIs (only when cost data exists) ────────────── */}
          {(!section || section === 'kpis') && products.some(p => p.cost > 0) && (() => {
            const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
            const totalCost    = products.reduce((s, p) => s + p.cost, 0);
            const totalProfit  = totalRevenue - totalCost;
            const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">רווח גולמי</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ₪{totalProfit.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">הכנסה פחות עלות חומרים</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">מרג׳ין ממוצע</p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                        {avgMargin.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">על מוצרים עם עלות מוגדרת</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">עלות חומרים</p>
                      <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
                        ₪{totalCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}% מההכנסה
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* ── Revenue Chart ───────────────────────────────────────────────── */}
          {(!section || section === 'chart') && <Card className="print:break-inside-avoid print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 print:hidden" />
                הכנסה לפי {period === 'day' ? 'שעה' : period === 'week' ? 'יום בשבוע' : period === 'month' ? 'יום' : 'חודש'}
                <span className="text-xs text-muted-foreground font-normal print-hide">
                  — קו מקווקו = {prevSub}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₪${v}`} />
                  <Tooltip
                    formatter={(val: number, name: string) => [`₪${val.toFixed(2)}`, name === 'current' ? label : prevSub]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="current" fill="hsl(32,65%,55%)" radius={[3, 3, 0, 0]} name="current" />
                  <Line dataKey="previous" stroke="hsl(200,60%,50%)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="previous" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>}

          {/* ── Payment Method Breakdown ───────────────────────────────────── */}
          {(!section || section === 'payment') && (() => {
            const paidOrders = currentOrders.filter((o: any) => o.payment_method);
            if (paidOrders.length === 0) return null;
            const byMethod: Record<string, { count: number; revenue: number }> = {};
            paidOrders.forEach((o: any) => {
              const m = o.payment_method as string;
              if (!byMethod[m]) byMethod[m] = { count: 0, revenue: 0 };
              byMethod[m].count++;
              byMethod[m].revenue += Number(o.total_price);
            });
            const totalRev = paidOrders.reduce((s: number, o: any) => s + Number(o.total_price), 0);
            const PAYMENT_LABELS: Record<string, string> = { cash: 'מזומן', credit: 'אשראי', app: 'אפליקציה', other: 'אחר' };
            const PAYMENT_COLORS: Record<string, string> = { cash: '#059669', credit: '#2563eb', app: '#7c3aed', other: '#9ca3af' };
            return (
              <Card className="print:break-inside-avoid print:shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 print:hidden" />
                    פירוט אמצעי תשלום
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(byMethod).map(([method, data]) => (
                      <div key={method} className="rounded-xl p-3 bg-muted/40 space-y-1 text-center">
                        <p className="text-xs font-semibold text-muted-foreground">{PAYMENT_LABELS[method] ?? method}</p>
                        <p className="text-lg font-black text-foreground">₪{data.revenue.toFixed(0)}</p>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${totalRev > 0 ? (data.revenue / totalRev) * 100 : 0}%`, background: PAYMENT_COLORS[method] ?? '#9ca3af' }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{data.count} הזמנות · {totalRev > 0 ? ((data.revenue / totalRev) * 100).toFixed(0) : 0}%</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* ── Category + Peak Hours ───────────────────────────────────────── */}
          {(!section || section === 'category') && <div className="grid md:grid-cols-2 gap-6">
            {/* Category Pie */}
            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">הכנסה לפי קטגוריה</CardTitle>
              </CardHeader>
              <CardContent>
                {cats.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={cats}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `₪${v.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="mt-3 space-y-1.5">
                      {cats.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-foreground">{c.name}</span>
                          </div>
                          <span className="font-semibold text-foreground">₪{c.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">אין נתונים לתקופה זו</p>
                )}
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 print:hidden" />
                  שעות שיא — מספר הזמנות לפי שעה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={peak}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="orders" name="הזמנות" fill="hsl(25,45%,30%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>}

          {/* ── Product Performance Table ───────────────────────────────────── */}
          {(!section || section === 'products') && <Card className="print:break-inside-avoid print:shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 print:hidden" />
                  ביצועי מוצרים
                </CardTitle>
                <span className="text-xs text-muted-foreground print-hide">לחץ על כותרת עמודה למיון</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {products.length > 0 ? (() => {
                const hasCost = products.some(p => p.cost > 0);
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground">#</th>
                          <th className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground">מוצר</th>
                          <SortTh col="count">כמות</SortTh>
                          <SortTh col="revenue">הכנסה</SortTh>
                          {hasCost && <SortTh col="cost">עלות</SortTh>}
                          {hasCost && <SortTh col="profit">רווח</SortTh>}
                          {hasCost && <SortTh col="margin">מרג׳ין</SortTh>}
                          <SortTh col="pct">% מהכלל</SortTh>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                            <td className="py-2.5 px-3 text-muted-foreground text-xs">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {p.name}
                              {i === 0 && <span className="ml-2 text-[10px] bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">🏆 מוביל</span>}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-center">{p.count}</td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">₪{p.revenue.toFixed(2)}</td>
                            {hasCost && (
                              <td className="py-2.5 px-3 text-muted-foreground text-xs">
                                {p.cost > 0 ? `₪${p.cost.toFixed(2)}` : '—'}
                              </td>
                            )}
                            {hasCost && (
                              <td className={`py-2.5 px-3 font-semibold text-xs ${p.cost > 0 ? (p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-muted-foreground'}`}>
                                {p.cost > 0 ? `₪${p.profit.toFixed(2)}` : '—'}
                              </td>
                            )}
                            {hasCost && (
                              <td className="py-2.5 px-3 text-xs">
                                {p.cost > 0 ? (
                                  <span className={`font-bold ${p.margin >= 60 ? 'text-emerald-600 dark:text-emerald-400' : p.margin >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {p.margin.toFixed(1)}%
                                  </span>
                                ) : '—'}
                              </td>
                            )}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-1.5 print:hidden">
                                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(p.pct, 100)}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-left">{p.pct}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td colSpan={2} className="py-2.5 px-3 text-xs font-bold text-foreground">סה"כ</td>
                          <td className="py-2.5 px-3 text-center text-xs font-bold text-foreground">
                            {products.reduce((s, p) => s + p.count, 0)}
                          </td>
                          <td className="py-2.5 px-3 text-xs font-bold text-foreground">
                            ₪{products.reduce((s, p) => s + p.revenue, 0).toFixed(2)}
                          </td>
                          {hasCost && (
                            <td className="py-2.5 px-3 text-xs font-bold text-foreground">
                              ₪{products.reduce((s, p) => s + p.cost, 0).toFixed(2)}
                            </td>
                          )}
                          {hasCost && (
                            <td className="py-2.5 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ₪{products.reduce((s, p) => s + p.profit, 0).toFixed(2)}
                            </td>
                          )}
                          {hasCost && <td />}
                          <td className="py-2.5 px-3 text-xs font-bold text-foreground">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })() : (
                <p className="text-sm text-muted-foreground text-center py-8">אין נתונים לתקופה זו</p>
              )}
            </CardContent>
          </Card>}

          {/* ── Summary for print footer ────────────────────────────────────── */}
          <div className="hidden print:block mt-10 pt-4" style={{ borderTop: '1px solid #d1d5db' }}>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Cafe Nof Management System</span>
              <span>דוח {PERIOD_TABS.find(t => t.key === period)?.label} — {label}</span>
              <span>הופק {new Date().toLocaleDateString('he-IL')}</span>
            </div>
            <div style={{ background: '#92400e', height: 3, borderRadius: 2, marginTop: 8 }} />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
