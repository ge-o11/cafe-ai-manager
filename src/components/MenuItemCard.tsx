import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuItem } from '@/hooks/useMenu';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { language, t } = useLanguage();

  const getName = () => {
    switch (language) {
      case 'he': return item.name_he;
      case 'ar': return item.name_ar;
      case 'ru': return item.name_ru || item.name_en;
      default: return item.name_en;
    }
  };

  const getDescription = () => {
    switch (language) {
      case 'he': return item.description_he;
      case 'ar': return item.description_ar;
      case 'ru': return item.description_ru || item.description_en;
      default: return item.description_en;
    }
  };

  const description = getDescription();

  return (
    <div className="menu-card bg-card rounded-xl overflow-hidden cafe-shadow-soft">
      {item.image_url && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={item.image_url}
            alt={getName()}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {getName()}
          </h3>
          <span className="text-accent font-bold whitespace-nowrap">
            {t('menu.currency')}{Number(item.price).toFixed(0)}
          </span>
        </div>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;
