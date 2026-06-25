import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  updated_at: string;
  menu_items: {
    name_en: string;
    name_he: string;
    name_ar: string;
    name_ru: string;
    image_url: string | null;
    is_active: boolean;
    price: number;
  };
}

export type StockStatus = 'not_tracked' | 'ok' | 'low' | 'out';

export function getStockStatus(item: InventoryItem): StockStatus {
  if (!item.track_inventory) return 'not_tracked';
  if (item.quantity === 0) return 'out';
  if (item.quantity <= item.low_stock_threshold) return 'low';
  return 'ok';
}

export const useInventory = () => {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory' as any)
        .select(`
          *,
          menu_items (name_en, name_he, name_ar, name_ru, image_url, is_active, price)
        `)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
    refetchInterval: 30000,
  });
};

export const useToggleMenuItemActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ menu_item_id, is_active }: { menu_item_id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active })
        .eq('id', menu_item_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => {
      toast.error('שגיאה בעדכון זמינות המנה');
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      quantity,
      low_stock_threshold,
      track_inventory,
    }: {
      id: string;
      quantity?: number;
      low_stock_threshold?: number;
      track_inventory?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (quantity !== undefined) updates.quantity = quantity;
      if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold;
      if (track_inventory !== undefined) updates.track_inventory = track_inventory;

      const { error } = await supabase
        .from('inventory' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: () => {
      toast.error('שגיאה בעדכון המלאי');
    },
  });
};
