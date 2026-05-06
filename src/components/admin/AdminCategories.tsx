import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  uploadMenuImage,
  Category,
} from '@/hooks/useMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

const AdminCategories: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_he: '',
    name_ar: '',
    name_ru: '',
    sort_order: 0,
    is_active: true,
    image_url: null as string | null,
  });

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_he: '',
      name_ar: '',
      name_ru: '',
      sort_order: 0,
      is_active: true,
      image_url: null,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: null });
  };

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (imageFile) {
      setIsUploading(true);
      try {
        const url = await uploadMenuImage(imageFile);
        return url;
      } catch {
        toast.error('Failed to upload image');
        return formData.image_url;
      } finally {
        setIsUploading(false);
      }
    }
    return formData.image_url;
  };

  const handleCreate = async () => {
    const image_url = await uploadImageIfNeeded();
    await createCategory.mutateAsync({ ...formData, image_url });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    const image_url = await uploadImageIfNeeded();
    await updateCategory.mutateAsync({ id: editingCategory.id, ...formData, image_url });
    setEditingCategory(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_he: category.name_he,
      name_ar: category.name_ar,
      name_ru: category.name_ru,
      sort_order: category.sort_order,
      is_active: category.is_active,
      image_url: category.image_url,
    });
    setImagePreview(category.image_url);
    setImageFile(null);
  };

  const getCategoryName = (category: Category) => {
    switch (language) {
      case 'he': return category.name_he;
      case 'ar': return category.name_ar;
      case 'ru': return category.name_ru || category.name_en;
      default: return category.name_en;
    }
  };

  const currentImageUrl = imagePreview || formData.image_url;

  const CategoryForm = ({ onSubmit, isEditing }: { onSubmit: () => void; isEditing: boolean }) => (
    <div className="space-y-4">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>{t('form.image') || 'Image'}</Label>
        <div className="flex items-center gap-4">
          {currentImageUrl ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
              <img src={currentImageUrl} alt="Category" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
          {currentImageUrl && (
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  {t('admin.changeImage') || 'Change'}
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{t('form.nameEn')}</Label>
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="Category name"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameHe')}</Label>
          <Input
            value={formData.name_he}
            onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
            placeholder="שם הקטגוריה"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameAr')}</Label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="اسم الفئة"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.nameRu')}</Label>
          <Input
            value={formData.name_ru}
            onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
            placeholder="Название категории"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEditing) {
              setEditingCategory(null);
            } else {
              setIsCreateOpen(false);
            }
            resetForm();
          }}
        >
          {t('admin.cancel')}
        </Button>
        <Button onClick={onSubmit} disabled={createCategory.isPending || updateCategory.isPending || isUploading}>
          {(createCategory.isPending || updateCategory.isPending || isUploading) && (
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
        <h2 className="font-display text-2xl font-semibold">{t('admin.categories')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('admin.addCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.addCategory')}</DialogTitle>
              <DialogDescription>
                Create a new category for your menu items.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm onSubmit={handleCreate} isEditing={false} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories?.map((category) => (
          <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={getCategoryName(category)}
                    className="w-14 h-14 rounded-lg object-cover border border-border"
                  />
                )}
                <div>
                  <CardTitle className="font-display text-lg">
                    {getCategoryName(category)}
                  </CardTitle>
                  <CardDescription>
                    {t('form.sortOrder')}: {category.sort_order}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => {
                  if (!open) {
                    setEditingCategory(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => openEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('admin.edit')}</DialogTitle>
                    </DialogHeader>
                    <CategoryForm onSubmit={handleUpdate} isEditing={true} />
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
                        This will also delete all menu items in this category.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(category.id)}
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

        {categories?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No categories yet. Create your first category to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
