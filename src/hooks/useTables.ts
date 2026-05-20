import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TableStatus {
  table_number: number;
  needs_cleaning: boolean;
  updated_at: string;
}

export const useTableStatuses = () => {
  return useQuery({
    queryKey: ['restaurant_tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*');
      if (error) throw error;
      return (data ?? []) as TableStatus[];
    },
    refetchInterval: 60000,
  });
};

export const useSetTableCleaning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tableNumber, needsCleaning }: { tableNumber: number; needsCleaning: boolean }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .upsert(
          { table_number: tableNumber, needs_cleaning: needsCleaning, updated_at: new Date().toISOString() },
          { onConflict: 'table_number' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    },
  });
};
