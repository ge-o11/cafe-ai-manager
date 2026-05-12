import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PeriodFilter } from './useEmployeePerformance';

export interface Shift {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  created_at: string;
}

function getPeriodStart(period: PeriodFilter): string | null {
  const now = new Date();
  if (period === 'today') { now.setHours(0, 0, 0, 0); return now.toISOString(); }
  if (period === 'week')  { now.setDate(now.getDate() - 7); return now.toISOString(); }
  if (period === 'month') { now.setDate(now.getDate() - 30); return now.toISOString(); }
  return null;
}

export function hoursFromShift(shift: Shift): number {
  const end = shift.clock_out ? new Date(shift.clock_out) : new Date();
  return (end.getTime() - new Date(shift.clock_in).getTime()) / 3_600_000;
}

/** Find the currently open shift (no clock_out) for an employee */
export function useActiveShift(employeeId: string | undefined) {
  return useQuery<Shift | null>({
    queryKey: ['shifts', 'active', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Shift | null;
    },
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

/** All shifts for an employee in a period — used by performance dashboard */
export function useEmployeeShifts(employeeId: string, period: PeriodFilter) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', 'history', employeeId, period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      let q = supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .not('clock_out', 'is', null)
        .order('clock_in', { ascending: false });
      if (start) q = q.gte('clock_in', start);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

/** All shifts for all employees in a period — used for total-hours summary */
export function useAllShifts(period: PeriodFilter) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', 'all', period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      let q = supabase
        .from('shifts')
        .select('*')
        .not('clock_out', 'is', null);
      if (start) q = q.gte('clock_in', start);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
    staleTime: 30_000,
  });
}

export interface ActiveShiftWithEmployee {
  id: string;
  clock_in: string;
  employees: {
    id: string;
    name: string;
    employee_number: string;
    role: 'waiter' | 'kitchen' | null;
  };
}

/** All currently open shifts (no clock_out) with employee info — for Hub display */
export function useActiveShifts() {
  return useQuery<ActiveShiftWithEmployee[]>({
    queryKey: ['shifts', 'active-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('id, clock_in, employees(id, name, employee_number, role)')
        .is('clock_out', null)
        .order('clock_in', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ActiveShiftWithEmployee[];
    },
    refetchInterval: 15_000,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert({ employee_id: employeeId })
        .select()
        .single();
      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data, error } = await supabase
        .from('shifts')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', shiftId)
        .select()
        .single();
      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}
