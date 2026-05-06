import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroImage {
  id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const useHeroImages = () => {
  return useQuery({
    queryKey: ['hero-images-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HeroImage[];
    },
  });
};
