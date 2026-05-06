import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeOrders, useUpdateOrderStatus, OrderWithItems } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, Wifi, WifiOff, Clock, ChefHat, CheckCircle2,
  UtensilsCrossed, Flame, Bell, LogOut,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getElapsedMin(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function timingClass(min: number) {
  if (min < 5) return 'text-emerald-600 dark:text-emerald-400';
  if (min < 10) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function timingBg(min: number) {
  if (min < 5) return '';
  if (min < 10) return 'border-amber-300 dark:border-amber-600';
  return 'border-red-400 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-base font-bold text-foreground tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

interface OrderCardProps {
  order: OrderWithItems;
  actionLabel: string | null;
  actionClass: string;
  onAction: () => void;
  isPending: boolean;
  getName: (item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => string;
  tableLabel: string;
  minLabel: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order, actionLabel, actionClass, onAction, isPending, getName, tableLabel, minLabel,
}) => {
  const elapsed = getElapsedMin(order.created_at);
  const isVeryNew = elapsed < 2;
  const isUrgent = elapsed >= 10;

  return (
    <div className={`bg-card border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
      isVeryNew
        ? 'border-amber-300 shadow-md shadow-amber-100 dark:shadow-amber-900/20'
        : isUrgent
        ? timingBg(elapsed)
        : 'border-border'
    }`}>
      {/* Card top */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${
        isVeryNew ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted/30'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-black text-foreground">
            {tableLabel} {order.table_number}
          </span>
          {isVeryNew && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] font-bold border-0 animate-bounce px-1.5">
              NEW
            </Badge>
          )}
        </div>
        <div className={`flex items-center gap-1 font-bold text-sm ${timingClass(elapsed)} ${isUrgent ? 'animate-pulse' : ''}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{elapsed} {minLabel}</span>
        </div>
      </div>

      {/* Items list */}
      <div className="px-4 py-3 space-y-2.5">
        {order.order_items.map((oi) => (
          <div key={oi.id}>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-black text-foreground tabular-nums leading-none w-7 shrink-0">
                {oi.quantity}×
              </span>
              <span className="text-sm font-semibold text-foreground leading-snug">
                {getName(oi.menu_items)}
              </span>
            </div>
            {oi.notes && (
              <div className="mt-1 ml-9 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                <span className="text-amber-500 text-sm leading-none mt-0.5">⚠</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium italic leading-snug">
                  {oi.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action button */}
      {actionLabel && (
        <div className="px-4 pb-4">
          <button
            className={`w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2 ${actionClass}`}
            onClick={onAction}
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  count: number;
  headerClass: string;
  icon: React.ReactNode;
  orders: OrderWithItems[];
  emptyText: string;
  actionLabel: string | null;
  actionClass: string;
  onAction: (order: OrderWithItems) => void;
  isPending: boolean;
  getName: (item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => string;
  tableLabel: string;
  minLabel: string;
  pulse?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title, count, headerClass, icon, orders, emptyText,
  actionLabel, actionClass, onAction, isPending, getName, tableLabel, minLabel, pulse,
}) => (
  <div className="flex flex-col flex-1 min-w-[280px] max-w-[420px] bg-muted/40 rounded-2xl overflow-hidden border border-border/50">
    {/* Column header */}
    <div className={`flex items-center justify-between px-4 py-3 ${headerClass} ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-2 font-bold text-sm">
        {icon}
        {title}
      </div>
      <span className="text-sm font-black bg-white/40 dark:bg-black/25 rounded-full px-2.5 py-0.5 min-w-[28px] text-center">
        {count}
      </span>
    </div>

    {/* Cards */}
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
            <UtensilsCrossed className="w-10 h-10 mb-3" />
            <p className="text-xs text-center">{emptyText}</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              actionLabel={actionLabel}
              actionClass={actionClass}
              onAction={() => onAction(order)}
              isPending={isPending}
              getName={getName}
              tableLabel={tableLabel}
              minLabel={minLabel}
            />
          ))
        )}
      </div>
    </ScrollArea>
  </div>
);

// ─── Main Kitchen component ──────────────────────────────────────────────────

const Kitchen: React.FC = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { language, t } = useLanguage();
  const { data: orders = [], isLoading, isConnected } = useRealtimeOrders();
  const updateStatus = useUpdateOrderStatus();

  // Force re-render every 30s so elapsed times stay current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Track new order arrivals to pulse the NEW column header
  const prevNewCountRef = useRef(0);
  const newOrders = orders.filter(o => o.status === 'new');
  const [newOrderPulse, setNewOrderPulse] = useState(false);

  useEffect(() => {
    if (newOrders.length > prevNewCountRef.current) {
      setNewOrderPulse(true);
      const timer = setTimeout(() => setNewOrderPulse(false), 3000);
      prevNewCountRef.current = newOrders.length;
      return () => clearTimeout(timer);
    }
    prevNewCountRef.current = newOrders.length;
  }, [newOrders.length]);

  const getName = useCallback((item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => {
    switch (language) {
      case 'he': return item.name_he;
      case 'ar': return item.name_ar;
      case 'ru': return item.name_ru || item.name_en;
      default: return item.name_en;
    }
  }, [language]);

  const preparingOrders = orders.filter(o => o.status === 'in_preparation');
  const readyOrders = orders.filter(o => o.status === 'served');
  const totalActive = orders.length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-5 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                {t('kitchen.title')}
              </h1>
              <p className="text-xs text-muted-foreground">Cafe Nof</p>
            </div>
          </div>

          {/* Center: live stats */}
          <div className="hidden md:flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {newOrders.length} {t('kitchen.new')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="font-semibold text-orange-700 dark:text-orange-400">
                {preparingOrders.length} {t('kitchen.preparing')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {readyOrders.length} {t('kitchen.ready')}
              </span>
            </div>
            {totalActive > 0 && (
              <span className="text-muted-foreground">
                · {totalActive} total active
              </span>
            )}
          </div>

          {/* Right: clock + connection + logout */}
          <div className="flex items-center gap-4">
            <LiveClock />

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">{t('kitchen.live')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-600">{t('kitchen.offline')}</span>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={signOut}
              title={t('waiter.logout')}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Kanban Board ── */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">Loading orders...</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 p-4 overflow-x-auto min-h-0">
          {/* NEW */}
          <KanbanColumn
            title={t('kitchen.new')}
            count={newOrders.length}
            headerClass="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
            icon={<Bell className="w-4 h-4" />}
            orders={newOrders}
            emptyText={t('kitchen.noNewOrders')}
            actionLabel={t('kitchen.startPreparing')}
            actionClass="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm"
            onAction={(o) => updateStatus.mutate({ id: o.id, status: 'in_preparation' })}
            isPending={updateStatus.isPending}
            getName={getName}
            tableLabel={t('waiter.table')}
            minLabel={t('kitchen.min')}
            pulse={newOrderPulse}
          />

          {/* PREPARING */}
          <KanbanColumn
            title={t('kitchen.preparing')}
            count={preparingOrders.length}
            headerClass="bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100"
            icon={<Flame className="w-4 h-4" />}
            orders={preparingOrders}
            emptyText={t('kitchen.noPreparing')}
            actionLabel={t('kitchen.markReady')}
            actionClass="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm"
            onAction={(o) => updateStatus.mutate({ id: o.id, status: 'served' })}
            isPending={updateStatus.isPending}
            getName={getName}
            tableLabel={t('waiter.table')}
            minLabel={t('kitchen.min')}
          />

          {/* READY TO SERVE */}
          <KanbanColumn
            title={t('kitchen.ready')}
            count={readyOrders.length}
            headerClass="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
            icon={<CheckCircle2 className="w-4 h-4" />}
            orders={readyOrders}
            emptyText={t('kitchen.noReady')}
            actionLabel={null}
            actionClass=""
            onAction={() => {}}
            isPending={false}
            getName={getName}
            tableLabel={t('waiter.table')}
            minLabel={t('kitchen.min')}
          />
        </div>
      )}
    </div>
  );
};

export default Kitchen;
