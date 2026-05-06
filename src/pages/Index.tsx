import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryTabs from '@/components/CategoryTabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import cafeHero from '@/assets/cafe-hero.jpg';

const Index: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allItems, isLoading: itemsLoading } = useMenuItems();

  const filteredItems = selectedCategory
    ? allItems?.filter((item) => item.category_id === selectedCategory)
    : allItems;

  const isLoading = categoriesLoading || itemsLoading;

  // Group items by category for display
  const groupedItems = React.useMemo(() => {
    if (!categories || !filteredItems) return [];
    
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      if (!category) return [];
      return [{
        category,
        items: filteredItems,
      }];
    }
    
    return categories
      .filter((category) => filteredItems.some((item) => item.category_id === category.id))
      .map((category) => ({
        category,
        items: filteredItems.filter((item) => item.category_id === category.id),
      }));
  }, [categories, filteredItems, selectedCategory]);

  const getCategoryName = (category: typeof categories extends (infer T)[] ? T : never) => {
    switch (language) {
      case 'he': return category.name_he;
      case 'ar': return category.name_ar;
      default: return category.name_en;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={cafeHero}
          alt="Cafe Nof"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 cafe-gradient-hero" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-2 animate-fade-in">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 font-light mb-4 animate-slide-up">
            {t('hero.subtitle')}
          </p>
          <p className="max-w-md text-primary-foreground/80 mb-8 animate-slide-up">
            {t('hero.description')}
          </p>
          <Link to="#menu">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold animate-scale-in"
            >
              {t('menu.viewMenu')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="container py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('menu.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('menu.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            {categories && categories.length > 0 && (
              <div className="mb-8">
                <CategoryTabs
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            )}

            {/* Menu Items */}
            {groupedItems.length > 0 ? (
              <div className="space-y-12">
                {groupedItems.map(({ category, items }) => (
                  <div key={category.id}>
                    {!selectedCategory && (
                      <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
                        {getCategoryName(category)}
                      </h3>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((item) => (
                        <MenuItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('menu.noItems')}
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-primary py-8">
        <div className="container text-center">
          <p className="text-primary-foreground/80 text-sm">
            © {new Date().getFullYear()} {t('hero.title')} • {t('hero.subtitle')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
