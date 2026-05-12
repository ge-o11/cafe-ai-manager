import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useActiveShift, useClockOut } from '@/hooks/useShifts';
import ShiftStatusChip from '@/components/ShiftStatusChip';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useCreateOrder, useActiveOrders, useUpdateOrderStatus, OrderWithItems, PaymentMethod } from '@/hooks/useOrders';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Search, Plus, Minus, Trash2, ShoppingCart, Send, X,
  UtensilsCrossed, Clock, StickyNote, ChevronLeft, LogOut, Settings,
  ClipboardList, CheckCircle2, Banknote, CreditCard, Smartphone, MoreHorizontal,
} from 'lucide-react';

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string;
}

type TableStatus = 'free' | 'new' | 'in_preparation' | 'served';

const cartKey = (tableNum: number) => `waiter-cart-${tableNum}`;

const STATUS_STYLES: Record<TableStatus, string> = {
  free: 'border-border hover:bg-primary hover:text-primary-foreground hover:border-primary',
  new: 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-400 hover:text-white dark:bg-amber-900/20 dark:text-amber-300',
  in_preparation: 'border-orange-400 bg-orange-50 text-orange-900 hover:bg-orange-400 hover:text-white dark:bg-orange-900/20 dark:text-orange-300',
  served: 'border-blue-400 bg-blue-50 text-blue-900 hover:bg-blue-400 hover:text-white dark:bg-blue-900/20 dark:text-blue-300',
};

const STATUS_DOT: Record<TableStatus, string> = {
  free: '',
  new: 'bg-amber-400',
  in_preparation: 'bg-orange-400',
  served: 'bg-blue-400',
};

function getTableStatus(tableNum: number, activeOrders: OrderWithItems[]): TableStatus {
  const orders = activeOrders.filter(o => o.table_number === tableNum);
  if (orders.length === 0) return 'free';
  if (orders.some(o => o.status === 'served')) return 'served';
  if (orders.some(o => o.status === 'in_preparation')) return 'in_preparation';
  return 'new';
}

const Waiter: React.FC = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { currentEmployee } = useEmployee();
  const { data: activeShift } = useActiveShift(currentEmployee?.id);
  const clockOut = useClockOut();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems();
  const { data: activeOrders = [] } = useActiveOrders();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();

  const tableCount = (settings?.table_count as number) ?? 20;

  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tableCountInput, setTableCountInput] = useState(String(tableCount ?? 20));
  const [previewTable, setPreviewTable] = useState<number | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{ orderIds: string[]; total: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [showSessionNote, setShowSessionNote] = useState(false);

  // Load cart + session note from sessionStorage when table is selected
  useEffect(() => {
    if (tableNumber !== null) {
      const saved = sessionStorage.getItem(cartKey(tableNumber));
      if (saved) {
        try { setCart(JSON.parse(saved)); } catch { setCart([]); }
      } else {
        setCart([]);
      }
      const note = sessionStorage.getItem(`waiter-note-${tableNumber}`) ?? '';
      setSessionNote(note);
      setShowSessionNote(!!note);
    }
  }, [tableNumber]);

  // Persist cart to sessionStorage on every change
  useEffect(() => {
    if (tableNumber !== null) {
      sessionStorage.setItem(cartKey(tableNumber), JSON.stringify(cart));
    }
  }, [cart, tableNumber]);

  // Persist session note
  useEffect(() => {
    if (tableNumber !== null) {
      if (sessionNote) {
        sessionStorage.setItem(`waiter-note-${tableNumber}`, sessionNote);
      } else {
        sessionStorage.removeItem(`waiter-note-${tableNumber}`);
      }
    }
  }, [sessionNote, tableNumber]);

  const getName = useCallback((item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => {
    switch (language) {
      case 'he': return item.name_he;
      case 'ar': return item.name_ar;
      case 'ru': return item.name_ru || item.name_en;
      default: return item.name_en;
    }
  }, [language]);

  const getDescription = useCallback((item: {
    description_en?: string | null;
    description_he?: string | null;
    description_ar?: string | null;
    description_ru?: string | null;
  }) => {
    switch (language) {
      case 'he': return item.description_he || item.description_en;
      case 'ar': return item.description_ar || item.description_en;
      case 'ru': return item.description_ru || item.description_en;
      default: return item.description_en;
    }
  }, [language]);

  const filteredItems = useMemo(() => menuItems?.filter((item) => {
    if (!item.is_active) return false;
    if (selectedCategory && item.category_id !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name_en.toLowerCase().includes(q) ||
        item.name_he.includes(q) ||
        item.name_ar.includes(q)
      );
    }
    return true;
  }), [menuItems, selectedCategory, searchQuery]);

  const addToCart = useCallback((item: NonNullable<typeof menuItems>[number]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === item.id);
      if (existing) {
        return prev.map((c) => c.product_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product_id: item.id, name: getName(item), quantity: 1, unit_price: item.price, notes: '' }];
    });
  }, [getName]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.product_id === productId ? { ...c, quantity: c.quantity + delta } : c)
         .filter((c) => c.quantity > 0)
    );
  }, []);

  const updateNotes = useCallback((productId: string, notes: string) => {
    setCart((prev) => prev.map((c) => c.product_id === productId ? { ...c, notes } : c));
  }, []);

  const totalPrice = useMemo(() => cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, c) => sum + c.quantity, 0), [cart]);

  const currentTableOrders = useMemo(
    () => tableNumber ? activeOrders.filter(o => o.table_number === tableNumber) : [],
    [activeOrders, tableNumber]
  );

  const hasReadyOrders = useMemo(
    () => currentTableOrders.some(o => o.status === 'served'),
    [currentTableOrders]
  );

  const submitOrder = async () => {
    if (!tableNumber || cart.length === 0 || !user) return;
    try {
      await createOrder.mutateAsync({
        table_number: tableNumber,
        waiter_id: user.id,
        employee_id: currentEmployee?.id ?? null,
        total_price: totalPrice,
        session_note: sessionNote || null,
        items: cart.map(({ product_id, quantity, unit_price, notes }) => ({
          product_id, quantity, unit_price, notes: notes || undefined,
        })),
      });
      setCart([]);
      sessionStorage.removeItem(cartKey(tableNumber));
      setShowMobileCart(false);
    } catch { /* toast handled in hook */ }
  };

  const enterTable = (num: number) => {
    setTableNumber(num);
    setSelectedCategory(null);
    setSearchQuery('');
    setShowMobileCart(false);
    setPreviewTable(null);
  };

  const handleSelectTable = (num: number) => {
    const tableOrders = activeOrders.filter(o => o.table_number === num);
    if (tableOrders.length > 0) {
      setPreviewTable(num);
    } else {
      enterTable(num);
    }
  };

  const handleBackToTables = () => {
    setTableNumber(null);
    setShowMobileCart(false);
    setShowActiveOrders(false);
  };

  const saveTableCount = () => {
    const val = Math.max(1, Math.min(100, parseInt(tableCountInput, 10) || 20));
    setTableCountInput(String(val));
    updateSetting.mutate({ key: 'table_count', value: val });
    setShowSettings(false);
  };

  const openPaymentDialog = (orderIds: string[], total: number) => {
    setPaymentTarget({ orderIds, total });
    setPaymentMethod(null);
    setPaymentNote('');
  };

  const confirmPayment = async () => {
    if (!paymentTarget || !paymentMethod) return;
    for (const id of paymentTarget.orderIds) {
      await updateOrderStatus.mutateAsync({
        id,
        status: 'paid',
        payment_method: paymentMethod,
        payment_note: paymentNote || null,
      });
    }
    setPaymentTarget(null);
    if (previewTable !== null) {
      const remaining = activeOrders.filter(
        o => o.table_number === previewTable && !paymentTarget.orderIds.includes(o.id)
      );
      if (remaining.length === 0) setPreviewTable(null);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'new') return t('waiter.newOrder');
    if (status === 'in_preparation') return t('waiter.preparing');
    if (status === 'served') return t('waiter.served');
    return status;
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/2002-admin/login" replace />;

  // ─── Table Selection ───────────────────────────────────────────────────────
  if (tableNumber === null) {
    const renderTable = (num: number) => {
      const status = getTableStatus(num, activeOrders);
      const tblOrders = activeOrders.filter(o => o.table_number === num);
      const tblTotal = tblOrders.reduce((sum, o) => sum + o.total_price, 0);
      const hasServed = tblOrders.some(o => o.status === 'served');
      const tblColor =
        status === 'free'           ? 'bg-stone-50 border-2 border-stone-300 text-stone-600 hover:border-stone-400' :
        status === 'new'            ? 'bg-amber-400 border-2 border-amber-500 text-white' :
        status === 'in_preparation' ? 'bg-orange-500 border-2 border-orange-600 text-white' :
                                      'bg-emerald-500 border-2 border-emerald-600 text-white';
      const tblShadow =
        status === 'free'           ? 'shadow-md shadow-stone-300/60' :
        status === 'new'            ? 'shadow-lg shadow-amber-400/50' :
        status === 'in_preparation' ? 'shadow-lg shadow-orange-500/50' :
                                      'shadow-lg shadow-emerald-500/50';
      return (
        <button
          key={num}
          onClick={() => handleSelectTable(num)}
          className={`relative flex flex-col items-center justify-center w-20 h-[52px] rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${tblColor} ${tblShadow}`}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-full bg-stone-400/40" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-full bg-stone-400/40" />
          <span className="text-base font-black leading-none">{num}</span>
          {tblTotal > 0 && (
            <span className="text-[9px] font-bold opacity-90 leading-none mt-0.5">
              ₪{tblTotal % 1 === 0 ? tblTotal : tblTotal.toFixed(0)}
            </span>
          )}
          {tblOrders.length > 0 && !hasServed && (
            <span className="absolute -top-2 -right-1 w-4 h-4 rounded-full bg-white text-[9px] font-black text-stone-800 flex items-center justify-center border border-stone-200 shadow-sm">
              {tblOrders.length}
            </span>
          )}
          {hasServed && (
            <span className="absolute -top-2 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-pulse border-2 border-white" />
          )}
        </button>
      );
    };
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {currentEmployee && (
            <ShiftStatusChip employee={currentEmployee} shift={activeShift} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => { setShowSettings(true); setTableCountInput(String(tableCount ?? 20)); }}
            title={t('waiter.settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 text-xs"
            onClick={() => navigate('/hub')}
          >
            <ChevronLeft className="w-4 h-4" />
            חזרה
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">Cafe Nof</h1>
          <p className="text-muted-foreground text-xs">{t('waiter.selectTable')}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5 text-[11px] text-muted-foreground">
          {[
            { color: 'bg-stone-200 dark:bg-stone-600 border border-stone-300', label: t('waiter.free') },
            { color: 'bg-amber-400', label: t('waiter.active') },
            { color: 'bg-orange-500', label: t('waiter.preparing') },
            { color: 'bg-emerald-500', label: t('waiter.waitingPayment') },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-2 rounded-full ${color} inline-block`} />
              {label}
            </span>
          ))}
        </div>

        {/* Floor plan — zone layout matching real restaurant */}
        <div className="w-full max-w-2xl rounded-3xl border border-stone-300 dark:border-stone-700 shadow-2xl overflow-hidden">
          <div
            className="p-4 sm:p-5"
            style={{ background: 'radial-gradient(ellipse at center, #f5f0e8 0%, #ede5d8 100%)' }}
          >
            <div className="flex flex-col gap-3">

              {/* Outdoor upper terrace — 5 tables */}
              <div className="rounded-2xl border border-green-300/50 bg-green-50/50 p-3">
                <p className="text-[10px] font-bold text-green-800/70 uppercase tracking-widest mb-3 text-center">
                  🌿 חוץ – מרפסת עליונה
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  {[1,2,3,4,5].map(n => renderTable(n))}
                </div>
              </div>

              {/* Lower terrace — 4 tables */}
              <div className="rounded-2xl border border-teal-300/40 bg-teal-50/40 p-3">
                <p className="text-[10px] font-bold text-teal-800/70 uppercase tracking-widest mb-3 text-center">
                  🌿 מרפסת תחתית
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  {[6,7,8,9].map(n => renderTable(n))}
                </div>
              </div>

              {/* Bottom row: Entrance + 2nd floor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-amber-300/40 bg-amber-50/40 p-3">
                  <p className="text-[10px] font-bold text-amber-800/70 uppercase tracking-widest mb-3 text-center">
                    🚪 כניסה
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {[10,11].map(n => renderTable(n))}
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-300/40 bg-blue-50/30 p-3">
                  <p className="text-[10px] font-bold text-blue-800/70 uppercase tracking-widest mb-3 text-center">
                    🏠 קומה 2
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {[12,13,14,15].map(n => renderTable(n))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer bar */}
          <div className="bg-stone-800 dark:bg-stone-950 px-5 py-2.5 flex items-center justify-between">
            <span className="text-stone-400 text-[11px]">
              {activeOrders.length > 0
                ? `${new Set(activeOrders.filter(o => o.table_number !== null).map(o => o.table_number)).size} שולחנות פעילים`
                : 'כל השולחנות פנויים'}
            </span>
            <span className="text-stone-400 text-[11px]">
              חוץ · מרפסת · כניסה · קומה 2
            </span>
          </div>
        </div>

        {/* Table Preview Sheet */}
        <Sheet open={previewTable !== null} onOpenChange={(open) => { if (!open) setPreviewTable(null); }}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
            {previewTable !== null && (
              <TablePreviewContent
                tableNumber={previewTable}
                orders={activeOrders.filter(o => o.table_number === previewTable)}
                onEnterOrdering={() => enterTable(previewTable)}
                onRequestPayment={openPaymentDialog}
                isPending={updateOrderStatus.isPending}
                getName={getName}
                getStatusLabel={getStatusLabel}
                t={t}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>{t('waiter.settings')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-medium text-foreground mb-3">{t('waiter.tableCount')}</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTableCountInput(String(Math.max(1, (parseInt(tableCountInput) || 20) - 1)))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={tableCountInput}
                    onChange={(e) => setTableCountInput(e.target.value)}
                    className="text-center h-9 font-bold text-lg"
                    min="1"
                    max="100"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTableCountInput(String(Math.min(100, (parseInt(tableCountInput) || 20) + 1)))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={saveTableCount}>
                {t('admin.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Order Panel (shared between mobile overlay and desktop sidebar) ───────
  const OrderPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-card ${isMobile ? '' : 'border-l border-border'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMobileCart(false)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {t('waiter.table')} {tableNumber}
                </h2>
                {hasReadyOrders && (
                  <Badge
                    className="text-[10px] cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white border-0 animate-pulse"
                    onClick={() => setShowActiveOrders(true)}
                  >
                    {t('waiter.readyBadge')}
                  </Badge>
                )}
                {!hasReadyOrders && currentTableOrders.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] cursor-pointer hover:bg-secondary/80"
                    onClick={() => setShowActiveOrders(true)}
                  >
                    {currentTableOrders.length} {t('waiter.active')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="mx-1">•</span>
                <span>{totalItems} {t('waiter.items')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {currentTableOrders.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowActiveOrders(true)}
                title={t('waiter.activeOrders')}
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
            )}
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                onClick={() => setCart([])}
              >
                {t('waiter.clearAll')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Session Note */}
      {showSessionNote ? (
        <div className="px-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
            <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              placeholder={t('waiter.sessionNotePlaceholder')}
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              autoFocus
            />
            {sessionNote && (
              <button
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => { setSessionNote(''); setShowSessionNote(false); }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          className="mx-4 mt-2 mb-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowSessionNote(true)}
        >
          <StickyNote className="w-3 h-3" />
          {t('waiter.addSessionNote')}
        </button>
      )}

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{t('waiter.noItemsYet')}</p>
            <p className="text-xs mt-1">{t('waiter.tapToAdd')}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cart.map((item) => (
              <div key={item.product_id} className="bg-background rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-accent font-semibold mt-0.5">
                      ₪{(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => updateQuantity(item.product_id, -item.quantity)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 rounded-md hover:bg-background"
                      onClick={() => updateQuantity(item.product_id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 rounded-md hover:bg-background"
                      onClick={() => updateQuantity(item.product_id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost" size="sm"
                    className={`h-7 text-xs gap-1 ${item.notes ? 'text-accent' : 'text-muted-foreground'}`}
                    onClick={() => setEditingNotes(editingNotes === item.product_id ? null : item.product_id)}
                  >
                    <StickyNote className="w-3 h-3" />
                    {item.notes ? t('waiter.editNote') : t('waiter.addNote')}
                  </Button>
                </div>

                {editingNotes === item.product_id && (
                  <Textarea
                    placeholder={t('waiter.specialRequests')}
                    value={item.notes}
                    onChange={(e) => updateNotes(item.product_id, e.target.value)}
                    className="text-xs h-14 resize-none bg-muted border-0 rounded-lg"
                    autoFocus
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">{t('waiter.total')}</span>
            <span className="text-2xl font-bold text-foreground">₪{totalPrice.toFixed(2)}</span>
          </div>
          <Button
            className="w-full h-12 text-base font-bold rounded-xl gap-2"
            onClick={submitOrder}
            disabled={createOrder.isPending}
          >
            {createOrder.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />}
            {t('waiter.sendOrder')}
          </Button>
        </div>
      )}
    </div>
  );

  // ─── Mobile Cart Overlay ───────────────────────────────────────────────────
  if (showMobileCart) {
    return (
      <>
        <div className="min-h-screen bg-background lg:hidden">
          <OrderPanel isMobile />
        </div>

        <Sheet open={showActiveOrders} onOpenChange={setShowActiveOrders}>
          <SheetContent>
            <ActiveOrdersContent
              orders={currentTableOrders}
              tableNumber={tableNumber}
              getName={getName}
              getStatusLabel={getStatusLabel}
              t={t}
              onRequestPayment={openPaymentDialog}
              isPending={updateOrderStatus.isPending}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // ─── Main POS Layout ───────────────────────────────────────────────────────
  return (
    <>
      <div className="h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Menu Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="bg-card border-b border-border px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8"
                  onClick={handleBackToTables}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                    {t('waiter.table')} {tableNumber}
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('waiter.selectItems')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {currentEmployee && (
                  <ShiftStatusChip employee={currentEmployee} shift={activeShift} />
                )}
                {/* Mobile cart button */}
                <Button
                  variant="outline"
                  className="lg:hidden relative gap-2"
                  onClick={() => setShowMobileCart(true)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-semibold">₪{totalPrice.toFixed(2)}</span>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-2 border-card">
                      {totalItems}
                    </Badge>
                  )}
                </Button>

                {/* Back to hub */}
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => navigate('/hub')}
                  title="חזרה"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('waiter.searchMenu')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-muted border-0 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  {t('waiter.all')}
                </button>
                {categories?.filter((c) => c.is_active).map((cat) => (
                  <button
                    key={cat.id}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {getName(cat)}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* Product Grid */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              {(catLoading || itemsLoading) ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : filteredItems && filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredItems.map((item) => {
                    const inCart = cart.find((c) => c.product_id === item.id);
                    const description = getDescription(item);
                    return (
                      <Card
                        key={item.id}
                        className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.97] rounded-xl border ${
                          inCart ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border'
                        }`}
                        onClick={() => addToCart(item)}
                      >
                        <CardContent className="p-0">
                          {item.image_url ? (
                            <div className="aspect-[4/3] overflow-hidden relative">
                              <img
                                src={item.image_url}
                                alt={getName(item)}
                                className="w-full h-full object-cover"
                              />
                              {inCart && (
                                <div className="absolute top-1.5 right-1.5">
                                  <Badge className="h-6 min-w-6 flex items-center justify-center text-xs font-bold bg-accent text-accent-foreground border-0 rounded-full">
                                    {inCart.quantity}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
                              <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                              {inCart && (
                                <div className="absolute top-1.5 right-1.5">
                                  <Badge className="h-6 min-w-6 flex items-center justify-center text-xs font-bold bg-accent text-accent-foreground border-0 rounded-full">
                                    {inCart.quantity}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-2.5">
                            <p className="font-medium text-xs text-foreground truncate">{getName(item)}</p>
                            {description && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                                {description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-sm font-bold text-accent">₪{item.price}</span>
                              {inCart ? (
                                <div
                                  className="flex items-center gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-6 w-6 rounded-md"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-5 text-center text-xs font-bold">{inCart.quantity}</span>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-6 w-6 rounded-md"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                                  <Plus className="w-3.5 h-3.5 text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">{t('waiter.noItemsFound')}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Mobile floating cart bar */}
          {totalItems > 0 && (
            <div
              className="lg:hidden sticky bottom-0 bg-primary text-primary-foreground p-3 flex items-center justify-between cursor-pointer active:opacity-90 rounded-t-xl"
              onClick={() => setShowMobileCart(true)}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold text-sm">{totalItems} {t('waiter.items')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">₪{totalPrice.toFixed(2)}</span>
                <span className="text-xs opacity-75">{t('waiter.viewOrder')} →</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Order Panel (Desktop) */}
        <div className="hidden lg:flex lg:w-[340px] xl:w-[380px] shrink-0">
          <OrderPanel />
        </div>
      </div>

      {/* Active Orders Sheet */}
      <Sheet open={showActiveOrders} onOpenChange={setShowActiveOrders}>
        <SheetContent>
          <ActiveOrdersContent
            orders={currentTableOrders}
            tableNumber={tableNumber}
            getName={getName}
            getStatusLabel={getStatusLabel}
            t={t}
            onRequestPayment={openPaymentDialog}
            isPending={updateOrderStatus.isPending}
          />
        </SheetContent>
      </Sheet>

      {/* Payment Method Dialog */}
      <Dialog open={paymentTarget !== null} onOpenChange={(open) => { if (!open) setPaymentTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('waiter.selectPayment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {paymentTarget && (
              <p className="text-center text-2xl font-black text-foreground">
                ₪{paymentTarget.total.toFixed(2)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {([
                { method: 'cash'   as PaymentMethod, label: t('waiter.cash'),   icon: <Banknote className="w-6 h-6" /> },
                { method: 'credit' as PaymentMethod, label: t('waiter.credit'), icon: <CreditCard className="w-6 h-6" /> },
                { method: 'app'    as PaymentMethod, label: t('waiter.appPay'), icon: <Smartphone className="w-6 h-6" /> },
                { method: 'other'  as PaymentMethod, label: t('waiter.other'),  icon: <MoreHorizontal className="w-6 h-6" /> },
              ]).map(({ method, label, icon }) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                    paymentMethod === method
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            <div>
              <Input
                placeholder={t('waiter.paymentNote')}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              className="w-full h-12 text-base font-bold gap-2"
              disabled={!paymentMethod || updateOrderStatus.isPending}
              onClick={confirmPayment}
            >
              {updateOrderStatus.isPending
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <CheckCircle2 className="w-5 h-5" />}
              {t('waiter.confirmPayment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Table Preview Sheet (shown when clicking an occupied table) ──────────────

interface TablePreviewContentProps {
  tableNumber: number;
  orders: OrderWithItems[];
  onEnterOrdering: () => void;
  onRequestPayment: (orderIds: string[], total: number) => void;
  isPending: boolean;
  getName: (item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => string;
  getStatusLabel: (status: string) => string;
  t: (key: string) => string;
}

const TablePreviewContent: React.FC<TablePreviewContentProps> = ({
  tableNumber, orders, onEnterOrdering, onRequestPayment, isPending, getName, getStatusLabel, t,
}) => {
  const grandTotal = orders.reduce((sum, o) => sum + o.total_price, 0);
  const servedOrders = orders.filter(o => o.status === 'served');
  const servedTotal = servedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const unservedTotal = grandTotal - servedTotal;
  const allServed = orders.length > 0 && orders.every(o => o.status === 'served');

  const statusColor = (status: string) => {
    if (status === 'served') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'in_preparation') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  };

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center justify-between">
          <span>{t('waiter.tableDetails')} — {t('waiter.table')} {tableNumber}</span>
          <span className="text-2xl font-black text-foreground">₪{grandTotal.toFixed(2)}</span>
        </SheetTitle>
      </SheetHeader>

      {/* Orders list */}
      <ScrollArea className="max-h-[45vh]">
        <div className="space-y-3 pr-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-xl border p-3 space-y-2 ${
                order.status === 'served'
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                  : 'border-border bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="space-y-1">
                {order.order_items.map((oi) => (
                  <div key={oi.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{oi.quantity}× {getName(oi.menu_items)}</span>
                    <span className="text-muted-foreground text-xs">₪{(oi.unit_price * oi.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-sm font-semibold">
                <span className="text-muted-foreground text-xs">{t('waiter.total')}</span>
                <span>₪{order.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Summary + actions */}
      <div className="space-y-3 pt-2 border-t border-border">
        {/* Grand total breakdown */}
        <div className="bg-muted rounded-xl p-3 space-y-1.5">
          {servedOrders.length > 0 && unservedTotal > 0 && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('waiter.servedOrders')}</span>
                <span>₪{servedTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('waiter.preparing')} / {t('waiter.active')}</span>
                <span>₪{unservedTotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-1" />
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">{t('waiter.outstanding')}</span>
            <span className="text-xl font-black text-foreground">₪{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button — only if there are served orders */}
        {servedOrders.length > 0 && (
          <Button
            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => onRequestPayment(servedOrders.map(o => o.id), allServed ? grandTotal : servedTotal)}
            disabled={isPending}
          >
            {isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <CheckCircle2 className="w-5 h-5" />
            }
            {allServed
              ? `${t('waiter.payNow')} · ₪${grandTotal.toFixed(2)}`
              : `${t('waiter.payNow')} · ₪${servedTotal.toFixed(2)}`
            }
          </Button>
        )}

        {/* Add items button */}
        <Button
          variant="outline"
          className="w-full h-10 font-semibold gap-2"
          onClick={onEnterOrdering}
        >
          <Plus className="w-4 h-4" />
          {t('waiter.addItems')}
        </Button>
      </div>
    </div>
  );
};

// ─── Active Orders Sheet Content (extracted to avoid defining inside render) ──
interface ActiveOrdersContentProps {
  orders: OrderWithItems[];
  tableNumber: number;
  getName: (item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => string;
  getStatusLabel: (status: string) => string;
  t: (key: string) => string;
  onRequestPayment: (orderIds: string[], total: number) => void;
  isPending: boolean;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  in_preparation: 'secondary',
  served: 'outline',
};

const ActiveOrdersContent: React.FC<ActiveOrdersContentProps> = ({
  orders, tableNumber, getName, getStatusLabel, t, onRequestPayment, isPending,
}) => (
  <>
    <SheetHeader>
      <SheetTitle className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5" />
        {t('waiter.activeOrders')} — {t('waiter.table')} {tableNumber}
      </SheetTitle>
    </SheetHeader>
    <ScrollArea className="h-[calc(100vh-100px)] mt-4">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">{t('waiter.noActiveOrders')}</p>
        </div>
      ) : (
        <div className="space-y-4 pr-1">
          {orders.map((order) => {
            const isServed = order.status === 'served';
            return (
              <div
                key={order.id}
                className={`rounded-xl p-4 space-y-3 border ${
                  isServed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-muted border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isServed && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    <Badge
                      variant={STATUS_BADGE_VARIANT[order.status] ?? 'default'}
                      className={isServed ? 'bg-emerald-500 text-white border-0' : ''}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {order.order_items.map((oi) => (
                    <div key={oi.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground">
                          {oi.quantity}× {getName(oi.menu_items)}
                        </span>
                        {oi.notes && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5 italic">
                            {oi.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">
                        ₪{(oi.unit_price * oi.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{t('waiter.total')}</span>
                  <span className="font-bold text-sm">₪{order.total_price.toFixed(2)}</span>
                </div>

                {isServed && (
                  <Button
                    className="w-full h-9 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => onRequestPayment([order.id], order.total_price)}
                    disabled={isPending}
                  >
                    {isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    {t('waiter.markPaid')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  </>
);

export default Waiter;
