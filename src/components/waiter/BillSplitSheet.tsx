import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Users } from 'lucide-react';
import { OrderWithItems } from '@/hooks/useOrders';

interface BillSplitSheetProps {
  open: boolean;
  onClose: () => void;
  orders: OrderWithItems[];
  tableNumber: number;
  getName: (item: { name_en: string; name_he: string; name_ar: string; name_ru?: string }) => string;
  onRequestPayment: (orderIds: string[], total: number) => void;
}

const BillSplitSheet: React.FC<BillSplitSheetProps> = ({
  open, onClose, orders, tableNumber, getName, onRequestPayment,
}) => {
  const [splitCount, setSplitCount] = useState(2);

  const grandTotal = orders.reduce((sum, o) => sum + o.total_price, 0);
  const perPerson = grandTotal / splitCount;
  const allItems = orders.flatMap(o =>
    o.order_items.map(oi => ({ ...oi, orderStatus: o.status }))
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-h-[85vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl font-black">
            <Users className="w-5 h-5" />
            פיצול חשבון — שולחן {tableNumber}
          </SheetTitle>
        </SheetHeader>

        {/* Items summary */}
        <ScrollArea className="max-h-[30vh] rounded-xl border border-border bg-muted/30 mb-4">
          <div className="p-3 space-y-0">
            {allItems.map((oi) => (
              <div key={oi.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">
                  {oi.quantity}× {getName(oi.menu_items)}
                </span>
                <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                  ₪{(oi.unit_price * oi.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Total */}
        <div className="flex justify-between items-center bg-muted rounded-xl px-4 py-2.5 mb-5">
          <span className="text-sm font-medium text-muted-foreground">סה"כ</span>
          <span className="text-xl font-black text-foreground">₪{grandTotal.toFixed(2)}</span>
        </div>

        {/* Split controls */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-semibold text-muted-foreground">מספר משלמים</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSplitCount(c => Math.max(2, c - 1))}
              className="w-11 h-11 rounded-full border-2 border-border bg-muted flex items-center justify-center hover:bg-muted/80 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-4xl font-black tabular-nums w-10 text-center">{splitCount}</span>
            <button
              onClick={() => setSplitCount(c => Math.min(20, c + 1))}
              className="w-11 h-11 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Per person */}
          <div className="w-full bg-primary/10 border-2 border-primary/30 rounded-2xl px-6 py-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground mb-1">כל אחד משלם</p>
            <p className="text-4xl font-black text-primary tabular-nums">₪{perPerson.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {splitCount} × ₪{perPerson.toFixed(2)} = ₪{grandTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <Button
          className="w-full mt-5 h-11 rounded-xl font-semibold"
          onClick={() => onRequestPayment(orders.map(o => o.id), grandTotal)}
        >
          גבה תשלום
        </Button>
        <Button variant="outline" className="w-full mt-2 h-11 rounded-xl font-semibold" onClick={onClose}>
          חזור לשולחן
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default BillSplitSheet;
