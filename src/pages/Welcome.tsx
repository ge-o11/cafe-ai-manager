import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHeroImages } from '@/hooks/useHeroImages';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SwipeToExplore from '@/components/SwipeToExplore';
import { Instagram, Phone } from 'lucide-react';
import heroCoffee from '@/assets/hero-coffee.jpg';
import heroBurger from '@/assets/hero-burger.jpg';
import heroHookah from '@/assets/hero-hookah.jpg';
import heroFresh from '@/assets/hero-fresh.jpg';
import cafeNofLogo from '@/assets/cafe-nof-logo-newbg.png';

const localSlides = [heroCoffee, heroBurger, heroHookah, heroFresh];

const Welcome: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: heroImages } = useHeroImages();
  const [currentIndex, setCurrentIndex] = useState(0);

  const allSlides =
    heroImages && heroImages.length > 0
      ? [...localSlides, ...heroImages.map((img) => img.image_url)]
      : localSlides;

  useEffect(() => {
    if (allSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allSlides.length]);

  const content: Record<string, { subtitle: string; tagline: string; swipe: string }> = {
    en: {
      subtitle: 'A taste of the view',
      tagline: 'Fresh flavors • Warm vibes • Beautiful views',
      swipe: 'Swipe to explore menu',
    },
    he: {
      subtitle: 'טעם של הנוף',
      tagline: 'טעמים טריים • אווירה חמה • נוף מרהיב',
      swipe: 'החליקו לתפריט',
    },
    ar: {
      subtitle: 'طعم المنظر',
      tagline: 'نكهات طازجة • أجواء دافئة • مناظر جميلة',
      swipe: 'اسحب لاستكشاف القائمة',
    },
    ru: {
      subtitle: 'Вкус с видом',
      tagline: 'Свежие вкусы • Тёплая атмосфера • Прекрасные виды',
      swipe: 'Проведите для просмотра меню',
    },
  };

  const t = content[language] || content.en;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Background images */}
      {allSlides.map((src, i) => (
        <img
          key={typeof src === 'string' ? src + i : i}
          src={typeof src === 'string' ? src : ''}
          alt="Cafe Nof"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        />
      ))}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsla(25, 30%, 6%, 0.3) 0%, hsla(25, 30%, 6%, 0.55) 40%, hsla(25, 30%, 6%, 0.85) 100%)',
        }}
      />

      {/* Top bar: Language switcher */}
      <div className="relative z-10 flex items-center justify-end p-4 pt-safe">
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-8 sm:px-12 -mt-8">
        {/* Logo — new version, no background, larger */}
        <div className="mb-5 animate-scale-in" style={{ width: 180 }}>
          <img
            src={cafeNofLogo}
            alt="Cafe Nof Logo"
            className="w-full object-contain"
            style={{
              filter:
                'drop-shadow(0 4px 24px rgba(200,129,58,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
          />
        </div>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg font-light tracking-widest uppercase mb-3 animate-slide-up text-left"
          style={{
            color: 'hsl(var(--cafe-caramel))',
            animationDelay: '0.15s',
            animationFillMode: 'both',
          }}
        >
          {t.subtitle}
        </p>

        {/* Tagline */}
        <p
          className="text-sm max-w-xs animate-slide-up text-left"
          style={{
            color: 'hsla(0, 0%, 100%, 0.6)',
            animationDelay: '0.3s',
            animationFillMode: 'both',
          }}
        >
          {t.tagline}
        </p>
      </div>

      {/* Swipe + contacts */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 pb-8 px-6 animate-slide-up"
        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
      >
        <SwipeToExplore
          label={t.swipe}
          onSwipeComplete={() => navigate('/menu')}
        />

        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/cafe_nof9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}
          >
            <Instagram size={16} />
            cafe_nof9
          </a>
          <span style={{ color: 'hsla(0, 0%, 100%, 0.2)' }}>|</span>
          <a
            href="tel:054-916-4494"
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}
          >
            <Phone size={16} />
            054-916-4494
          </a>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
