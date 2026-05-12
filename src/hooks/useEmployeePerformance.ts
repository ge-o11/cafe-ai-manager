import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeStats {
  id: string;
  name: string;
  employee_number: string;
  is_active: boolean;
  totalOrders: number;
  totalSales: number;
  totalItems: number;
  avgPerOrder: number;
}

export interface EmployeeOrder {
  id: string;
  table_number: number;
  total_price: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  items_count: number;
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'all';

function getPeriodStart(period: PeriodFilter): string | null {
  const now = new Date();
  if (period === 'today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (period === 'week') {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (period === 'month') {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return null;
}

export function useEmployeePerformance(period: PeriodFilter = 'month') {
  return useQuery<EmployeeStats[]>({
    queryKey: ['employee-performance', period],
    queryFn: async () => {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, employee_number, is_active')
        .order('name');
      if (empError) throw empError;

      const periodStart = getPeriodStart(period);

      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          employee_id,
          total_price,
          status,
          order_items (quantity)
        `)
        .eq('status', 'paid');

      if (periodStart) {
        ordersQuery = ordersQuery.gte('created_at', periodStart);
      }

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      return (employees ?? []).map((emp) => {
        const empOrders = (orders ?? []).filter((o) => o.employee_id === emp.id);
        const totalOrders = empOrders.length;
        const totalSales = empOrders.reduce((sum, o) => sum + o.total_price, 0);
        const totalItems = empOrders.reduce(
          (sum, o) => sum + (o.order_items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0),
          0
        );
        return {
          ...emp,
          totalOrders,
          totalSales,
          totalItems,
          avgPerOrder: totalOrders > 0 ? totalSales / totalOrders : 0,
        };
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useEmployeeOrders(employeeId: string, period: PeriodFilter = 'month') {
  return useQuery<EmployeeOrder[]>({
    queryKey: ['employee-orders', employeeId, period],
    queryFn: async () => {
      const periodStart = getPeriodStart(period);

      let query = supabase
        .from('orders')
        .select(`id, table_number, total_price, status, payment_method, created_at, order_items (quantity)`)
        .eq('employee_id', employeeId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (periodStart) {
        query = query.gte('created_at', periodStart);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((o) => ({
        id: o.id,
        table_number: o.table_number,
        total_price: o.total_price,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at,
        items_count: (o.order_items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0),
      }));
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
}
