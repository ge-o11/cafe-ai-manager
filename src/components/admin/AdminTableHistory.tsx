import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Clock, CreditCard, Banknote, Smartphone, MoreHorizontal, StickyNote, History } from 'lucide-react';

type DateFilter = '7d' | '30d' | '90d' | 'all';

interface HistoryOrder {
  id: string;
  table_number: number;
  status: string;
  total_price: number;
  payment_method: string | null;
  payment_note: string | null;
  session_note: string | null;
  created_at: string;
  paid_at: string | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    menu_items: { name_en: string; name_he: string; name_ar: string; name_ru: string };
  }[];
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash:   <Banknote className="w-3 h-3" />,
  credit: <CreditCard className="w-3 h-3" />,
  app:    <Smartphone className="w-3 h-3" />,
  other:  <MoreHorizontal className="w-3 h-3" />,
};

const PAYMENT_LABELS_HE: Record<string, string> = {
  cash: 'מזומן', credit: 'אשראי', app: 'אפליקציה', other: 'אחר',
};

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  '7d': '7 ימים', '30d': '30 ימים', '90d': '90 ימים', all: 'הכל',
};

const STATUS_BADGE: Record<string, string> = {
  paid:           'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled:      'bg-red-100 text-red-800 border-red-200',
  served:         'bg-blue-100 text-blue-800 border-blue-200',
  in_preparation: 'bg-orange-100 text-orange-800 border-orange-200',
  new:            'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_LABELS_HE: Record<string, string> = {
  paid: 'שולם', cancelled: 'בוטל', served: 'הוגש', in_preparation: 'בהכנה', new: 'חדש',
};

const AdminTableHistory: React.FC = () => {
  const { language } = useLanguage();
  const isHe = language === 'he';

  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');

  const since = useMemo(() => {
    if (dateFilter === 'all') return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(dateFilter));
    return d.toISOString();
  }, [dateFilter]);

  const { data: orders = [], isLoading } = useQuery<HistoryOrder[]>({
    queryKey: ['table-history', since],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select(`id, table_number, status, total_price, payment_method, payment_note,
                 session_note, created_at, paid_at,
                 order_items (id, quantity, unit_price, notes,
                   menu_items (name_en, name_he, name_ar, name_ru))`)
        .order('created_at', { ascending: false });
      if (since) q = q.gte('created_at', since);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HistoryOrder[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const getName = (item: HistoryOrder['order_items'][number]['menu_items']) => {
    if (language === 'he') return item.name_he;
    if (language === 'ar') return item.name_ar;
    if (language === 'ru') return item.name_ru;
    return item.name_en;
  };

  // Aggregate tables: number → { count, revenue, lastVisit }
  const tableStats = useMemo(() => {
    const map: Record<number, { count: number; revenue: number; lastVisit: string }> = {};
    orders.forEach(o => {
      if (!map[o.table_number]) map[o.table_number] = { count: 0, revenue: 0, lastVisit: o.created_at };
      map[o.table_number].count++;
      map[o.table_number].revenue += Number(o.total_price);
      if (o.created_at > map[o.table_number].lastVisit)
        map[o.table_number].lastVisit = o.created_at;
    });
    return map;
  }, [orders]);

  const tableNumbers = useMemo(
    () => Object.keys(tableStats).map(Number).sort((a, b) => a - b),
    [tableStats]
  );

  const tableOrders = useMemo(
    () => selectedTable !== null ? orders.filter(o => o.table_number === selectedTable) : [],
    [orders, selectedTable]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + date filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5" />
            {isHe ? 'היסטוריית הזמנות לפי שולחן' : 'Order History by Table'}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isHe ? 'בחר שולחן לצפייה בהיסטוריה מלאה' : 'Select a table to view its full history'}
          </p>
        </div>
        <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
          {(Object.entries(DATE_FILTER_LABELS) as [DateFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        {/* Table selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {isHe ? `${tableNumbers.length} שולחנות פעילים` : `${tableNumbers.length} active tables`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tableNumbers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isHe ? 'אין נתונים בטווח זה' : 'No data in this range'}
              </p>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="p-2 space-y-1">
                  {tableNumbers.map(num => {
                    const stats = tableStats[num];
                    const isSelected = selectedTable === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setSelectedTable(isSelected ? null : num)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                          }`}>
                            {num}
                          </span>
                          <div className="text-right">
                            <p className="font-semibold leading-none">{isHe ? `שולחן ${num}` : `Table ${num}`}</p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-70' : 'text-muted-foreground'}`}>
                              {stats.count} {isHe ? 'הזמנות' : 'orders'}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'opacity-90' : 'text-accent'}`}>
                          ₪{stats.revenue.toFixed(0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Order history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedTable !== null
                ? isHe ? `היסטוריה — שולחן ${selectedTable}` : `History — Table ${selectedTable}`
                : isHe ? 'בחר שולחן' : 'Select a table'}
            </CardTitle>
            {selectedTable !== null && tableStats[selectedTable] && (
              <CardDescription>
                {tableStats[selectedTable].count} {isHe ? 'הזמנות' : 'orders'} ·{' '}
                {isHe ? 'סה"כ' : 'total'} ₪{tableStats[selectedTable].revenue.toFixed(2)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {selectedTable === null ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <History className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">{isHe ? 'בחר שולחן מהרשימה' : 'Choose a table from the list'}</p>
              </div>
            ) : tableOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {isHe ? 'אין הזמנות בטווח זה' : 'No orders in this range'}
              </p>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="divide-y divide-border">
                  {tableOrders.map(order => (
                    <div key={order.id} className="px-4 py-3 space-y-2">
                      {/* Row 1: time + status + payment */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString('he-IL', {
                              day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 border ${STATUS_BADGE[order.status] ?? ''}`}>
                            {STATUS_LABELS_HE[order.status] ?? order.status}
                          </Badge>
                          {order.payment_method && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                              {PAYMENT_ICONS[order.payment_method]}
                              {PAYMENT_LABELS_HE[order.payment_method] ?? order.payment_method}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-sm text-foreground">₪{Number(order.total_price).toFixed(2)}</span>
                      </div>

                      {/* Session note */}
                      {order.session_note && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5">
                          <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{order.session_note}</span>
                        </div>
                      )}

                      {/* Payment note */}
                      {order.payment_note && (
                        <div className="text-xs text-muted-foreground italic px-1">
                          💬 {order.payment_note}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-0.5">
                        {order.order_items.map(oi => (
                          <div key={oi.id} className="flex items-center justify-between text-xs text-foreground">
                            <span>
                              {oi.quantity}× {getName(oi.menu_items)}
                              {oi.notes && <span className="text-muted-foreground italic ml-1">({oi.notes})</span>}
                            </span>
                            <span className="text-muted-foreground">₪{(oi.quantity * oi.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTableHistory;
