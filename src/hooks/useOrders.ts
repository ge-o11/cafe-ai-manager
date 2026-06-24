import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isDemoMode, DEMO_CHANNEL, broadcastDemo } from '@/lib/demoMode';
import type { MenuItem } from '@/hooks/useMenu';

export type PaymentMethod = 'cash' | 'credit' | 'app' | 'other';
export type DiscountType = 'percent' | 'fixed';

export interface Order {
  id: string;
  table_number: number;
  waiter_id: string;
  employee_id: string | null;
  status: 'new' | 'in_preparation' | 'served' | 'paid' | 'cancelled';
  total_price: number;
  payment_method: PaymentMethod | null;
  payment_note: string | null;
  paid_at: string | null;
  session_note: string | null;
  discount_type: DiscountType | null;
  discount_amount: number;
  discount_reason: string | null;
  discount_approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    menu_items: {
      name_en: string;
      name_he: string;
      name_ar: string;
      name_ru: string;
      image_url: string | null;
    };
  })[];
}

export const useOrders = (status?: string) => {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name_en, name_he, name_ar, name_ru, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OrderWithItems[];
    },
    refetchInterval: 10000,
  });
};

// Active (non-paid/cancelled) orders — used by Waiter for table status
export const useActiveOrders = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `waiter-active-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name_en, name_he, name_ar, name_ru, image_url)
          )
        `)
        .in('status', ['new', 'in_preparation', 'served'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithItems[];
    },
    refetchInterval: 30000,
  });
};

// Real-time orders — used by Kitchen display with Supabase Realtime subscription
export const useRealtimeOrders = () => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const query = useQuery({
    queryKey: ['orders', 'kitchen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name_en, name_he, name_ar, name_ru, image_url)
          )
        `)
        .in('status', ['new', 'in_preparation', 'served'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

  useEffect(() => {
    const channelName = `kitchen-${Math.random().toString(36).slice(2, 9)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ...query, isConnected };
};

export const useTodayOrders = () => {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name_en, name_he, name_ar, name_ru, image_url, category_id)
          )
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrderWithItems & {
        order_items: (OrderItem & {
          menu_items: {
            name_en: string; name_he: string; name_ar: string; name_ru: string;
            image_url: string | null; category_id: string;
          };
        })[];
      })[];
    },
    refetchInterval: 30000,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: {
      table_number: number;
      waiter_id: string;
      employee_id?: string | null;
      total_price: number;
      session_note?: string | null;
      items: { product_id: string; quantity: number; unit_price: number; notes?: string }[];
    }) => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: order.table_number,
          waiter_id: order.waiter_id,
          employee_id: order.employee_id || null,
          total_price: order.total_price,
          session_note: order.session_note || null,
          status: 'new' as const,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = order.items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit order');
      console.error(error);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      payment_method,
      payment_note,
      discount_type,
      discount_amount,
      discount_reason,
      discount_approved_by,
    }: {
      id: string;
      status: Order['status'];
      payment_method?: PaymentMethod;
      payment_note?: string | null;
      discount_type?: DiscountType | null;
      discount_amount?: number;
      discount_reason?: string | null;
      discount_approved_by?: string | null;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (payment_method !== undefined) updates.payment_method = payment_method;
      if (payment_note !== undefined) updates.payment_note = payment_note || null;
      if (discount_type !== undefined) updates.discount_type = discount_type ?? null;
      if (discount_amount !== undefined) updates.discount_amount = discount_amount;
      if (discount_reason !== undefined) updates.discount_reason = discount_reason || null;
      if (discount_approved_by !== undefined) updates.discount_approved_by = discount_approved_by || null;

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update order status');
      console.error(error);
    },
  });
};

export const useTransferTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromTable, toTable }: { fromTable: number; toTable: number }) => {
      const { error } = await supabase
        .from('orders')
        .update({ table_number: toTable })
        .eq('table_number', fromTable)
        .in('status', ['new', 'in_preparation', 'served']);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('שולחן הועבר בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בהעברת שולחן');
    },
  });
};
