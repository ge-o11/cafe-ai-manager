import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoBanner {
  id: string;
  image_url: string;
  duration_seconds: number;
  is_active: boolean;
  created_at: string;
}

export function usePromoBanners() {
  return useQuery<PromoBanner[]>({
    queryKey: ['promo-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PromoBanner[];
    },
    staleTime: 30 * 1000,
  });
}

export function useActivePromoBanner() {
  return useQuery<PromoBanner | null>({
    queryKey: ['promo-banner-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PromoBanner | null;
    },
    staleTime: 30 * 1000,
  });
}
