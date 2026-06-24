import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isDemoMode } from '@/lib/demoMode';

export interface Category {
  id: string;
  name_en: string;
  name_he: string;
  name_ar: string;
  name_ru: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_he: string;
  name_ar: string;
  name_ru: string;
  description_en: string | null;
  description_he: string | null;
  description_ar: string | null;
  description_ru: string | null;
  price: number;
  cost_price: number | null;
  image_url: string | null;
  modifiers: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Categories Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> => {
      if (isDemoMode) {
        return {
          ...category,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: (result) => {
      if (isDemoMode) {
        queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
          [...old, result].sort((a, b) => a.sort_order - b.sort_order)
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create category');
      console.error(error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }): Promise<Category> => {
      if (isDemoMode) {
        const existing = queryClient.getQueryData<Category[]>(['categories'])?.find(c => c.id === id);
        return { ...(existing ?? {} as Category), ...updates, id, updated_at: new Date().toISOString() };
      }
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: (result) => {
      if (isDemoMode) {
        queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
          old.map(c => c.id === result.id ? result : c)
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update category');
      console.error(error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      if (isDemoMode) return id;
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      if (isDemoMode) {
        queryClient.setQueryData<Category[]>(['categories'], (old = []) =>
          old.filter(c => c.id !== id)
        );
        queryClient.setQueryData<MenuItem[]>(['menu-items', undefined], (old = []) =>
          old.filter(m => m.category_id !== id)
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      toast.success('הקטגוריה נמחקה בהצלחה');
    },
    onError: (error: { message?: string }) => {
      toast.error(`מחיקת הקטגוריה נכשלה: ${error?.message || 'שגיאה לא ידועה'}`);
      console.error(error);
    },
  });
};

// Menu Items Hooks
export const useMenuItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MenuItem[];
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> => {
      if (isDemoMode) {
        return {
          ...item,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as MenuItem;
    },
    onSuccess: (result) => {
      if (isDemoMode) {
        queryClient.setQueryData<MenuItem[]>(['menu-items', undefined], (old = []) => [...old, result]);
        queryClient.setQueryData<MenuItem[]>(['menu-items', result.category_id], (old = []) => [...old, result]);
      } else {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      }
      toast.success('Menu item created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create menu item');
      console.error(error);
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }): Promise<MenuItem> => {
      if (isDemoMode) {
        const existing = queryClient.getQueryData<MenuItem[]>(['menu-items', undefined])?.find(m => m.id === id);
        return { ...(existing ?? {} as MenuItem), ...updates, id, updated_at: new Date().toISOString() };
      }
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MenuItem;
    },
    onSuccess: (result) => {
      if (isDemoMode) {
        queryClient.setQueryData<MenuItem[]>(['menu-items', undefined], (old = []) =>
          old.map(m => m.id === result.id ? result : m)
        );
        queryClient.setQueryData<MenuItem[]>(['menu-items', result.category_id], (old = []) =>
          old.map(m => m.id === result.id ? result : m)
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      }
      toast.success('Menu item updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update menu item');
      console.error(error);
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string; category_id?: string }> => {
      if (isDemoMode) {
        const item = queryClient.getQueryData<MenuItem[]>(['menu-items', undefined])?.find(m => m.id === id);
        return { id, category_id: item?.category_id };
      }
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id };
    },
    onSuccess: ({ id, category_id }) => {
      if (isDemoMode) {
        queryClient.setQueryData<MenuItem[]>(['menu-items', undefined], (old = []) =>
          old.filter(m => m.id !== id)
        );
        if (category_id) {
          queryClient.setQueryData<MenuItem[]>(['menu-items', category_id], (old = []) =>
            old.filter(m => m.id !== id)
          );
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      toast.success('הפריט נמחק בהצלחה');
    },
    onError: (error: { message?: string }) => {
      toast.error(`מחיקת הפריט נכשלה: ${error?.message || 'שגיאה לא ידועה'}`);
      console.error(error);
    },
  });
};

// Image upload
export const uploadMenuImage = async (file: File): Promise<string> => {
  if (isDemoMode) {
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};
