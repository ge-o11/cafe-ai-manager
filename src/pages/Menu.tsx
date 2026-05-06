import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useHeroImages } from '@/hooks/useHeroImages';
import { useActivePromoBanner } from '@/hooks/usePromoBanner';
import AdaptiveHero from '@/components/AdaptiveHero';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryCard from '@/components/CategoryCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PromoBannerOverlay from '@/components/PromoBannerOverlay';
import { Loader2, ArrowRight, ArrowLeft, Search, Phone, Instagram } from 'lucide-react';
import heroCoffee from '@/assets/hero-coffee.jpg';
import heroBurger from '@/assets/hero-burger.jpg';
import heroHookah from '@/assets/hero-hookah.jpg';
import heroFresh from '@/assets/hero-fresh.jpg';

const defaultSlides = [heroCoffee, heroBurger, heroHookah, heroFresh];

const heroSubtitles: Record<string, string> = {
  en: 'Fresh food & specialty coffee',
  he: 'אוכל טרי וקפה מיוחד',
  ar: 'طعام طازج وقهوة مميزة',
  ru: 'Свежая еда и фирменный кофе',
};

const searchPlaceholders: Record<string, string> = {
  en: 'Search the menu...',
  he: 'חפש בתפריט...',
  ar: 'ابحث في القائمة...',
  ru: 'Поиск по меню...',
};

const Menu: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const { data: activeBanner } = useActivePromoBanner();

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allItems, isLoading: itemsLoading } = useMenuItems();
  const { data: heroImages } = useHeroImages();

  const isLoading = categoriesLoading || itemsLoading;

  const dbSlides = heroImages && heroImages.length > 0
    ? heroImages.map((img) => img.image_url)
    : [];
  const slides = [...defaultSlides, ...dbSlides];

  const selectedCategoryData = categories?.find((c) => c.id === selectedCategory);
  const filteredItems = selectedCategory
    ? allItems?.filter((item) => item.category_id === selectedCategory && item.is_active)
    : [];

  const getItemCount = (categoryId: string) =>
    allItems?.filter((item) => item.category_id === categoryId && item.is_active).length ?? 0;

  const getCategoryName = (cat: NonNullable<typeof categories>[number]) => {
    switch (language) {
      case 'he': return cat.name_he;
      case 'ar': return cat.name_ar;
      case 'ru': return (cat as any).name_ru || cat.name_en;
      default: return cat.name_en;
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {activeBanner && !promoDismissed && (
        <PromoBannerOverlay
          imageUrl={activeBanner.image_url}
          durationSeconds={activeBanner.duration_seconds}
          onDismiss={() => setPromoDismissed(true)}
        />
      )}
      {!selectedCategory ? (
        /* ===== CATEGORIES VIEW ===== */
        <main className="flex-1 flex flex-col">
          {/* Hero */}
          <AdaptiveHero
            images={slides}
            collapsedHeight={56}
            title="Cafe Nof"
            subtitle={heroSubtitles[language]}
            brandName="Cafe Nof"
            languageSwitcher={<LanguageSwitcher />}
          />

          {/* Content below hero */}
          <div className="px-4 sm:px-6 max-w-2xl mx-auto w-full pb-8 pt-5">
            {/* Category grid */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-accent" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {categories
                  .filter((c) => c.is_active)
                  .map((category, i) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      itemCount={getItemCount(category.id)}
                      onClick={setSelectedCategory}
                      index={i}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                {t('menu.noItems')}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* ===== ITEMS VIEW ===== */
        <main className="flex-1">
          {/* Back header */}
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
            <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <BackArrow className="w-4 h-4" />
                {language === 'he' ? 'חזרה' : language === 'ar' ? 'رجوع' : language === 'ru' ? 'Назад' : 'Back'}
              </button>
              <LanguageSwitcher />
            </div>
          </header>

          <div className="px-4 sm:px-6 max-w-2xl mx-auto w-full py-6 animate-fade-in">
            <div className="mb-5">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {selectedCategoryData ? getCategoryName(selectedCategoryData) : ''}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredItems?.length ?? 0}{' '}
                {language === 'he' ? 'פריטים' : language === 'ar' ? 'عناصر' : language === 'ru' ? 'позиций' : 'items'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems?.map((item, i) => (
                <div
                  key={item.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                >
                  <MenuItemCard item={item} />
                </div>
              ))}
            </div>
            {filteredItems?.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                {t('menu.noItems')}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="py-5 border-t border-border/30">
        <div className="flex flex-col items-center gap-2.5 px-4">
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/cafe_nof9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
            >
              <Instagram className="w-3.5 h-3.5" /> cafe_nof9
            </a>
            <span className="text-border text-xs">|</span>
            <a
              href="tel:054-916-4494"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
            >
              <Phone className="w-3.5 h-3.5" /> 054-916-4494
            </a>
          </div>
          <p className="text-muted-foreground/40 text-[10px]">
            © {new Date().getFullYear()} Cafe Nof
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Menu;
