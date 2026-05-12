import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  name: string;
  employee_number: string;
  is_active: boolean;
  hourly_rate: number | null;
  created_at: string;
}

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Employee[];
    },
    staleTime: 60 * 1000,
  });
}

export function useValidatePin() {
  return async (pin: string): Promise<Employee | null> => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_number', pin)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as Employee | null;
  };
}
