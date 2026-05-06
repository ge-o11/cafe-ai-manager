import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Category } from '@/hooks/useMenu';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const { language } = useLanguage();

  const getName = (category: Category) => {
    switch (language) {
      case 'he': return category.name_he;
      case 'ar': return category.name_ar;
      case 'ru': return (category as any).name_ru || category.name_en;
      default: return category.name_en;
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
          selectedCategory === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {language === 'he' ? 'הכל' : language === 'ar' ? 'الكل' : language === 'ru' ? 'Все' : 'All'}
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {getName(category)}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
