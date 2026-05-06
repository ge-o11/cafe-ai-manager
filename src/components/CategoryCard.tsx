import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Category } from '@/hooks/useMenu';

import categoryCoffee from '@/assets/category-coffee.jpg';
import categoryBreakfast from '@/assets/category-breakfast.jpg';
import categoryMain from '@/assets/category-main.jpg';
import categorySalads from '@/assets/category-salads.jpg';
import categoryDesserts from '@/assets/category-desserts.jpg';
import categoryColdDrinks from '@/assets/category-colddrinks.jpg';

interface CategoryCardProps {
  category: Category;
  itemCount?: number;
  onClick: (categoryId: string) => void;
  index?: number;
}

const categoryImages: Record<string, string> = {
  coffee: categoryCoffee,
  breakfast: categoryBreakfast,
  main: categoryMain,
  salads: categorySalads,
  desserts: categoryDesserts,
  cold_drinks: categoryColdDrinks,
};

const categorySubtitles: Record<string, Record<string, string>> = {
  coffee: { en: 'Perfect coffee & tea', he: 'קפה ותה מושלמים', ar: 'قهوة وشاي مثالي', ru: 'Идеальный кофе и чай' },
  breakfast: { en: 'Start your day right', he: 'התחילו את היום נכון', ar: 'ابدأ يومك بشكل صحيح', ru: 'Начните день правильно' },
  main: { en: 'Hearty & satisfying', he: 'מנות עיקריות ומשביעות', ar: 'شهية ومشبعة', ru: 'Сытно и вкусно' },
  salads: { en: 'Fresh, light & balanced', he: 'טרי, קל ומאוזן', ar: 'طازجة وخفيفة', ru: 'Свежие и лёгкие' },
  desserts: { en: 'Sweet perfection', he: 'מתוקים לסיום מושלם', ar: 'حلويات مثالية', ru: 'Сладкое совершенство' },
  cold_drinks: { en: 'Cool & refreshing', he: 'משקאות מרעננים וקלים', ar: 'بارد ومنعش', ru: 'Прохладные и освежающие' },
};

const getCategoryKey = (category: Category): string => {
  const name = category.name_en.toLowerCase();
  if (name.includes('coffee') || name.includes('hot drink')) return 'coffee';
  if (name.includes('breakfast')) return 'breakfast';
  if (name.includes('main')) return 'main';
  if (name.includes('salad')) return 'salads';
  if (name.includes('dessert')) return 'desserts';
  if (name.includes('cold') || name.includes('drink')) return 'cold_drinks';
  return 'main';
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category, itemCount, onClick, index = 0 }) => {
  const { language } = useLanguage();

  const getName = () => {
    switch (language) {
      case 'he': return category.name_he;
      case 'ar': return category.name_ar;
      case 'ru': return (category as any).name_ru || category.name_en;
      default: return category.name_en;
    }
  };

  const key = getCategoryKey(category);
  const image = category.image_url || categoryImages[key] || categoryMain;
  const subtitle = categorySubtitles[key]?.[language] || '';

  return (
    <button
      onClick={() => onClick(category.id)}
      className="group relative w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-slide-up"
      style={{
        aspectRatio: '4 / 5',
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
      onPointerLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Image */}
      <img
        src={image}
        alt={getName()}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
        style={{
          opacity: 0.75,
          background: `linear-gradient(
            180deg,
            transparent 20%,
            hsla(25, 30%, 6%, 0.3) 45%,
            hsla(25, 30%, 6%, 0.75) 70%,
            hsla(25, 30%, 6%, 0.92) 100%
          )`,
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h3
          className="font-display text-lg sm:text-xl font-bold leading-tight"
          style={{ color: 'hsl(30, 25%, 97%)' }}
        >
          {getName()}
        </h3>
        {subtitle && (
          <p
            className="text-[11px] sm:text-xs mt-0.5 leading-relaxed font-light"
            style={{ color: 'hsla(30, 25%, 97%, 0.6)' }}
          >
            {subtitle}
          </p>
        )}
        {typeof itemCount === 'number' && itemCount > 0 && (
          <span
            className="mt-2 inline-flex self-start px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-sm"
            style={{
              background: 'hsla(var(--cafe-caramel) / 0.75)',
              color: 'hsl(30, 25%, 97%)',
            }}
          >
            {itemCount} {language === 'he' ? 'פריטים' : language === 'ar' ? 'عناصر' : language === 'ru' ? 'позиций' : 'items'}
          </span>
        )}
      </div>
    </button>
  );
};

export default CategoryCard;
