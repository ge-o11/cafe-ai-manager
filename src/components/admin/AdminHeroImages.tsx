import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2, ImagePlus, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MAX_IMAGES = 4;
const HERO_BUCKET = 'hero-images';

const AdminHeroImages: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: heroImages, isLoading } = useQuery({
    queryKey: ['hero-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name?.split('.').pop() || 'jpg';
      const filePath = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(HERO_BUCKET)
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(HERO_BUCKET)
        .getPublicUrl(filePath);

      const nextOrder = heroImages?.length ?? 0;
      const { error: insertError } = await supabase
        .from('hero_images')
        .insert({ image_url: urlData.publicUrl, sort_order: nextOrder });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-images'] });
      queryClient.invalidateQueries({ queryKey: ['hero-images-public'] });
      toast.success('תמונה הועלתה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בהעלאת התמונה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-images'] });
      queryClient.invalidateQueries({ queryKey: ['hero-images-public'] });
      toast.success('התמונה נמחקה');
    },
    onError: () => {
      toast.error('שגיאה במחיקת התמונה');
    },
  });

  const uploadFile = useCallback(async (file: File) => {
    if ((heroImages?.length ?? 0) >= MAX_IMAGES) {
      toast.error(`ניתן להעלות עד ${MAX_IMAGES} תמונות`);
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
    }
  }, [heroImages?.length, uploadMutation]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const namedFile = new File([file], `hero-pasted-${Date.now()}.png`, { type: file.type });
    await uploadFile(namedFile);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentCount = heroImages?.length ?? 0;

  return (
    <Card className="p-6" onPaste={handlePaste} tabIndex={0}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            תמונות רקע מתחלפות
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            בחרו עד {MAX_IMAGES} תמונות שיוצגו ברקע דף התפריט ({currentCount}/{MAX_IMAGES})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            הדבקה מהלוח תפעל רק כשאתם עומדים בתוך האזור הזה.
          </p>
        </div>
        <>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || currentCount >= MAX_IMAGES}
          >
            {uploading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1 h-4 w-4" />
            )}
            העלאת תמונה
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : heroImages && heroImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {heroImages.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-video overflow-hidden rounded-xl border border-border/60 group"
            >
              <img
                src={img.image_url}
                alt={`Hero ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <button
                  onClick={() => deleteMutation.mutate(img.id)}
                  className="rounded-full bg-destructive p-2 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <span className="absolute top-2 left-2 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border py-8 text-center text-muted-foreground">
          <Clipboard className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">אין תמונות רקע.</p>
          <p className="mt-1 text-xs opacity-70">העלו תמונות או הדביקו כאן בתוך האזור הזה בלבד</p>
        </div>
      )}
    </Card>
  );
};

export default AdminHeroImages;
