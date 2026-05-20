import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCategories,
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  uploadMenuImage,
  MenuItem,
} from '@/hooks/useMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const AdminMenuItems: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { data: categories } = useCategories();
  const { data: items, isLoading } = useMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modifiersInput, setModifiersInput] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    name_en: '',
    name_he: '',
    name_ar: '',
    name_ru: '',
    description_en: '',
    description_he: '',
    description_ar: '',
    description_ru: '',
    price: 0,
    cost_price: '' as unknown as number,
    image_url: '',
    sort_order: 0,
    is_active: true,
    modifiers: [] as string[],
  });

  const resetForm = () => {
    setModifiersInput('');
    setFormData({
      category_id: '',
      name_en: '',
      name_he: '',
      name_ar: '',
      name_ru: '',
      description_en: '',
      description_he: '',
      description_ar: '',
      description_ru: '',
      price: 0,
      cost_price: '' as unknown as number,
      image_url: '',
      sort_order: 0,
      is_active: true,
      modifiers: [],
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setFormData({ ...formData, image_url: url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    await createItem.mutateAsync({
      ...formData,
      description_en: formData.description_en || null,
      description_he: formData.description_he || null,
      description_ar: formData.description_ar || null,
      description_ru: formData.description_ru || null,
      image_url: formData.image_url || null,
      cost_price: formData.cost_price !== undefined && formData.cost_price !== ('' as unknown as number)
        ? Number(formData.cost_price) : null,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    await updateItem.mutateAsync({
      id: editingItem.id,
      ...formData,
      description_en: formData.description_en || null,
      description_he: formData.description_he || null,
      description_ar: formData.description_ar || null,
      description_ru: formData.description_ru || null,
      image_url: formData.image_url || null,
      cost_price: formData.cost_price !== undefined && formData.cost_price !== ('' as unknown as number)
        ? Number(formData.cost_price) : null,
    });
    setEditingItem(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteItem.mutateAsync(id);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setModifiersInput('');
    setFormData({
      category_id: item.category_id,
      name_en: item.name_en,
      name_he: item.name_he,
      name_ar: item.name_ar,
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_he: item.description_he || '',
      description_ar: item.description_ar || '',
      description_ru: item.description_ru || '',
      price: Number(item.price),
      cost_price: item.cost_price !== null ? Number(item.cost_price) : '' as unknown as number,
      image_url: item.image_url || '',
      sort_order: item.sort_order,
      is_active: item.is_active,
      modifiers: item.modifiers || [],
    });
  };

  const getItemName = (item: MenuItem) => {
    switch (language) {
      case 'he': return item.name_he;
      case 'ar': return item.name_ar;
      case 'ru': return item.name_ru || item.name_en;
      default: return item.name_en;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) return '';
    switch (language) {
      case 'he': return category.name_he;
      case 'ar': return category.name_ar;
      case 'ru': return (category as any).name_ru || category.name_en;
      default: return category.name_en;
    }
  };

  const ItemForm = ({ onSubmit, isEditing }: { onSubmit: () => void; isEditing: boolean }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>{t('form.category')}</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {getCategoryName(category.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{t('form.nameEn')}</Label>
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="Item name"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameHe')}</Label>
          <Input
            value={formData.name_he}
            onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
            placeholder="שם הפריט"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameAr')}</Label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="اسم العنصر"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameRu')}</Label>
          <Input
            value={formData.name_ru}
            onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
            placeholder="Название"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{t('form.descriptionEn')}</Label>
          <Textarea
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            placeholder="Description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.descriptionHe')}</Label>
          <Textarea
            value={formData.description_he}
            onChange={(e) => setFormData({ ...formData, description_he: e.target.value })}
            placeholder="תיאור"
            dir="rtl"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.descriptionAr')}</Label>
          <Textarea
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder="الوصف"
            dir="rtl"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.descriptionRu')}</Label>
          <Textarea
            value={formData.description_ru}
            onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
            placeholder="Описание"
            rows={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>{t('form.price')} (₪)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.costPrice')} (₪)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost_price as unknown as string}
            placeholder="אופציונלי"
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value as unknown as number })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.sortOrder')}</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>{t('form.active')}</Label>
        </div>
      </div>

      {/* Modifiers */}
      <div className="space-y-2">
        <Label>מרכיבים להסרה אפשרית</Label>
        {formData.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {formData.modifiers.map((mod, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                {mod}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modifiers: formData.modifiers.filter((_, i) => i !== idx) })}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="שם מרכיב, לחץ Enter להוספה (כגון: בצל, גבינה)"
            value={modifiersInput}
            onChange={(e) => setModifiersInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ',') && modifiersInput.trim()) {
                e.preventDefault();
                const val = modifiersInput.trim().replace(/,$/, '').trim();
                if (val && !formData.modifiers.includes(val)) {
                  setFormData({ ...formData, modifiers: [...formData.modifiers, val] });
                }
                setModifiersInput('');
              }
            }}
            dir="rtl"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              const val = modifiersInput.trim();
              if (val && !formData.modifiers.includes(val)) {
                setFormData({ ...formData, modifiers: [...formData.modifiers, val] });
              }
              setModifiersInput('');
            }}
            disabled={!modifiersInput.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">מרכיבים שהמלצר יכול לסמן להסרה לפי בקשת הלקוח</p>
      </div>

      <div className="space-y-2">
        <Label>{t('form.image')}</Label>
        <div className="flex gap-4 items-start">
          {formData.image_url && (
            <img
              src={formData.image_url}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
              id="image-upload"
            />
            <Label
              htmlFor="image-upload"
              className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-secondary transition-colors"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (isEditing) {
              setEditingItem(null);
            } else {
              setIsCreateOpen(false);
            }
            resetForm();
          }}
        >
          {t('admin.cancel')}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={createItem.isPending || updateItem.isPending || !formData.category_id}
        >
          {(createItem.isPending || updateItem.isPending) && (
            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
          )}
          {t('admin.save')}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-semibold">{t('admin.items')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!categories?.length}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('admin.addItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('admin.addItem')}</DialogTitle>
              <DialogDescription>
                Add a new item to your menu.
              </DialogDescription>
            </DialogHeader>
            <ItemForm onSubmit={handleCreate} isEditing={false} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {items?.map((item) => (
          <Card key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={getItemName(item)}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <CardTitle className="font-display text-lg">
                  {getItemName(item)}
                </CardTitle>
                <CardDescription>
                  {getCategoryName(item.category_id)} • ₪{Number(item.price).toFixed(0)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => {
                  if (!open) {
                    setEditingItem(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{t('admin.edit')}</DialogTitle>
                    </DialogHeader>
                    <ItemForm onSubmit={handleUpdate} isEditing={true} />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('admin.confirmDelete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('admin.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
          </Card>
        ))}

        {items?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No menu items yet. Create categories first, then add items.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminMenuItems;
