import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInventory, useUpdateInventory, useToggleMenuItemActive, getStockStatus, InventoryItem } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Package, AlertTriangle, XCircle, CheckCircle2, Filter } from 'lucide-react';

type FilterType = 'all' | 'low' | 'out' | 'ok';

const STATUS_CONFIG = {
  not_tracked: {
    label: { en: 'Not tracked', he: 'לא במעקב' },
    badge: 'bg-muted text-muted-foreground border-border',
    row: '',
  },
  ok: {
    label: { en: 'In stock', he: 'במלאי' },
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
    row: '',
  },
  low: {
    label: { en: 'Low stock', he: 'מלאי נמוך' },
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
    row: 'bg-amber-50/50 dark:bg-amber-900/10',
  },
  out: {
    label: { en: 'Out of stock', he: 'אזל' },
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    row: 'bg-red-50/50 dark:bg-red-900/10',
  },
};

interface EditState {
  quantity: string;
  threshold: string;
}

const AdminInventory: React.FC = () => {
  const { language } = useLanguage();
  const { data: inventory, isLoading } = useInventory();
  const updateInventory = useUpdateInventory();
  const toggleMenuItemActive = useToggleMenuItemActive();

  const [filter, setFilter] = useState<FilterType>('all');
  const [editing, setEditing] = useState<Record<string, EditState>>({});

  const getName = (item: InventoryItem['menu_items']) => {
    if (language === 'he') return item.name_he;
    if (language === 'ar') return item.name_ar;
    if (language === 'ru') return item.name_ru;
    return item.name_en;
  };

  const isHe = language === 'he';

  const filtered = (inventory ?? []).filter((item) => {
    const status = getStockStatus(item);
    if (filter === 'all') return true;
    if (filter === 'low') return status === 'low';
    if (filter === 'out') return status === 'out';
    if (filter === 'ok') return status === 'ok';
    return true;
  });

  const counts = {
    all: inventory?.length ?? 0,
    low: inventory?.filter(i => getStockStatus(i) === 'low').length ?? 0,
    out: inventory?.filter(i => getStockStatus(i) === 'out').length ?? 0,
    ok: inventory?.filter(i => getStockStatus(i) === 'ok').length ?? 0,
  };

  const startEditing = (item: InventoryItem) => {
    setEditing(prev => ({
      ...prev,
      [item.id]: { quantity: String(item.quantity), threshold: String(item.low_stock_threshold) },
    }));
  };

  const cancelEditing = (id: string) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveEditing = (item: InventoryItem) => {
    const e = editing[item.id];
    if (!e) return;
    const quantity = Math.max(0, parseInt(e.quantity, 10) || 0);
    const low_stock_threshold = Math.max(0, parseInt(e.threshold, 10) || 0);
    updateInventory.mutate({ id: item.id, quantity, low_stock_threshold }, {
      onSuccess: () => cancelEditing(item.id),
    });
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {isHe ? 'ניהול מלאי' : 'Inventory Management'}
            </CardTitle>
            <CardDescription>
              {isHe
                ? 'הפעל מעקב לכל פריט ועדכן כמויות. המלאי מנוכה אוטומטית בכל הזמנה.'
                : 'Enable tracking per item and update quantities. Stock deducts automatically on each order.'}
            </CardDescription>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {counts.out > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                {counts.out} {isHe ? 'אזלו' : 'out'}
              </span>
            )}
            {counts.low > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                {counts.low} {isHe ? 'נמוך' : 'low'}
              </span>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(['all', 'out', 'low', 'ok'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {f === 'all' && (isHe ? `הכל (${counts.all})` : `All (${counts.all})`)}
              {f === 'out' && (isHe ? `אזל (${counts.out})` : `Out (${counts.out})`)}
              {f === 'low' && (isHe ? `נמוך (${counts.low})` : `Low (${counts.low})`)}
              {f === 'ok' && (isHe ? `תקין (${counts.ok})` : `OK (${counts.ok})`)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{isHe ? 'אין פריטים בסינון זה' : 'No items in this filter'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const status = getStockStatus(item);
              const cfg = STATUS_CONFIG[status];
              const isEdit = !!editing[item.id];
              const e = editing[item.id];

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${cfg.row}`}
                >
                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {item.menu_items.image_url ? (
                      <img
                        src={item.menu_items.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {getName(item.menu_items)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 border ${cfg.badge}`}>
                        {isHe ? cfg.label.he : cfg.label.en}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ��{item.menu_items.price}
                      </span>
                    </div>
                  </div>

                  {/* Quantity + threshold edit */}
                  {item.track_inventory && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isEdit ? (
                        <>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                              {isHe ? 'כמות' : 'Qty'}
                            </span>
                            <Input
                              type="number"
                              value={e.quantity}
                              onChange={(ev) => setEditing(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], quantity: ev.target.value },
                              }))}
                              className="w-16 h-7 text-center text-sm p-1"
                              min="0"
                            />
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                              {isHe ? 'סף' : 'Low at'}
                            </span>
                            <Input
                              type="number"
                              value={e.threshold}
                              onChange={(ev) => setEditing(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], threshold: ev.target.value },
                              }))}
                              className="w-16 h-7 text-center text-sm p-1"
                              min="0"
                            />
                          </div>
                          <div className="flex flex-col gap-1 pt-3">
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => saveEditing(item)}
                              disabled={updateInventory.isPending}
                            >
                              {updateInventory.isPending
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : isHe ? 'שמור' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => cancelEditing(item.id)}
                            >
                              {isHe ? 'ביטול' : 'Cancel'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditing(item)}
                          className="text-center px-2 py-1 rounded-lg bg-muted hover:bg-secondary transition-colors"
                        >
                          <div className="text-lg font-bold text-foreground leading-none">
                            {item.quantity}
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            {isHe ? `סף: ${item.low_stock_threshold}` : `low: ${item.low_stock_threshold}`}
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Toggle available in menu */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <Switch
                      checked={item.menu_items.is_active}
                      onCheckedChange={(checked) =>
                        toggleMenuItemActive.mutate({ menu_item_id: item.menu_item_id, is_active: checked })
                      }
                      disabled={toggleMenuItemActive.isPending}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {isHe ? 'זמין' : 'Active'}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminInventory;
