import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2, ImagePlus, Megaphone, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePromoBanners, type PromoBanner } from '@/hooks/usePromoBanner';

const BUCKET = 'hero-images';

const AdminPromoBanner: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(20);

  const { data: banners, isLoading } = usePromoBanners();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
    queryClient.invalidateQueries({ queryKey: ['promo-banner-active'] });
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, durationSecs }: { file: File; durationSecs: number }) => {
      const ext = file.name?.split('.').pop() || 'jpg';
      const filePath = `promo-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('promo_banners').insert({
        image_url: urlData.publicUrl,
        duration_seconds: durationSecs,
        is_active: false,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      invalidate();
      toast.success('הבאנר הועלה בהצלחה');
    },
    onError: () => toast.error('שגיאה בהעלאת הבאנר'),
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Deactivate all, then activate the selected one
      const { error: deactivateError } = await supabase
        .from('promo_banners')
        .update({ is_active: false })
        .neq('id', id);
      if (deactivateError) throw deactivateError;

      const { error: activateError } = await supabase
        .from('promo_banners')
        .update({ is_active: true })
        .eq('id', id);
      if (activateError) throw activateError;
    },
    onSuccess: () => {
      invalidate();
      toast.success('הבאנר הופעל');
    },
    onError: () => toast.error('שגיאה בהפעלת הבאנר'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('הבאנר כובה');
    },
    onError: () => toast.error('שגיאה'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (banner: PromoBanner) => {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', banner.id);
      if (error) throw error;

      // Try to remove from storage (non-critical)
      const path = banner.image_url.split('/').pop();
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('הבאנר נמחק');
    },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await uploadMutation.mutateAsync({ file, durationSecs: duration });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [uploadMutation, duration]
  );

  const isBusy =
    activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending;

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Megaphone className="w-5 h-5 text-purple-500" />
            <h3 className="font-display text-lg font-bold text-foreground">באנרים פרסומיים</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            תמונה שמוצגת ללקוחות בכניסה לתפריט — ברכות חג, מבצעים, הודעות.
          </p>
        </div>
      </div>

      {/* Upload controls */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/40 rounded-xl border border-border/60">
        <div className="flex flex-col gap-1">
          <Label htmlFor="promo-duration" className="text-xs text-muted-foreground">
            זמן הצגה (שניות)
          </Label>
          <Input
            id="promo-duration"
            type="number"
            min={5}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Math.max(5, Math.min(120, Number(e.target.value))))}
            className="w-24 h-9 text-center"
          />
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 gap-2"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          {uploading ? 'מעלה...' : 'העלאת באנר'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Banners list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="grid gap-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                banner.is_active
                  ? 'border-purple-400/60 bg-purple-50 dark:bg-purple-900/15'
                  : 'border-border/60 bg-card'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img
                  src={banner.image_url}
                  alt="באנר"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {banner.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      פעיל
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      לא פעיל
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {banner.duration_seconds} שניות
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {banner.is_active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={isBusy}
                    onClick={() => deactivateMutation.mutate(banner.id)}
                  >
                    כבה
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isBusy}
                    onClick={() => activateMutation.mutate(banner.id)}
                  >
                    הפעל
                  </Button>
                )}

                <button
                  onClick={() => deleteMutation.mutate(banner)}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border py-10 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">אין באנרים פרסומיים עדיין.</p>
          <p className="mt-1 text-xs opacity-60">העלו תמונה להתחיל</p>
        </div>
      )}
    </Card>
  );
};

export default AdminPromoBanner;
