import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AdaptiveHeroProps {
  images: string[];
  collapsedHeight?: number;
  slideInterval?: number;
  title?: string;
  subtitle?: string;
  brandName?: string;
  languageSwitcher?: React.ReactNode;
}

const AdaptiveHero: React.FC<AdaptiveHeroProps> = ({
  images,
  collapsedHeight = 56,
  slideInterval = 4500,
  title,
  subtitle,
  brandName,
  languageSwitcher,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expandedPx, setExpandedPx] = useState(0);
  const rafRef = useRef<number>(0);

  // Responsive vh: 35vh mobile, 40vh tablet, 45vh desktop
  const getExpandedHeight = useCallback(() => {
    const w = window.innerWidth;
    const vh = window.innerHeight;
    if (w < 640) return vh * 0.35;
    if (w < 1024) return vh * 0.4;
    return vh * 0.45;
  }, []);

  useEffect(() => {
    const update = () => setExpandedPx(getExpandedHeight());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [getExpandedHeight]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const range = expandedPx - collapsedHeight;
      if (range <= 0) return;
      setScrollProgress(Math.min(window.scrollY / range, 1));
    });
  }, [expandedPx, collapsedHeight]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (images.length <= 1 || !slideInterval) return;
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, slideInterval);
    return () => clearInterval(id);
  }, [images.length, slideInterval]);

  if (!expandedPx) return null;

  const heightPx = expandedPx - scrollProgress * (expandedPx - collapsedHeight);
  const textOpacity = Math.max(0, 1 - scrollProgress * 2.5);
  const overlayIntensity = 0.3 + scrollProgress * 0.35;
  const borderRadius = Math.round(20 * (1 - scrollProgress));
  const topBarOpacity = Math.max(0.4, 1 - scrollProgress * 1.5);

  return (
    <div
      className="relative w-full overflow-hidden z-30"
      style={{
        height: heightPx,
        borderBottomLeftRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
        minHeight: collapsedHeight,
        transform: 'translateZ(0)',
      }}
    >
      {/* Slideshow images */}
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className="absolute top-0 left-0 w-full object-cover"
          style={{
            height: expandedPx,
            objectPosition: 'center 40%',
            opacity: i === currentSlide ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
          loading={i === 0 ? 'eager' : 'lazy'}
          draggable={false}
        />
      ))}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            180deg,
            hsla(25, 30%, 6%, 0.12) 0%,
            hsla(25, 30%, 6%, ${overlayIntensity * 0.45}) 40%,
            hsla(25, 30%, 6%, ${overlayIntensity * 0.8}) 70%,
            hsla(25, 30%, 6%, ${overlayIntensity}) 100%
          )`,
        }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-3 pb-2 pointer-events-none"
        style={{ opacity: topBarOpacity }}
      >
        <div className="pointer-events-auto">{languageSwitcher}</div>
        {brandName && (
          <div
            className="pointer-events-auto px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md"
            style={{
              background: 'hsla(25, 30%, 12%, 0.5)',
              color: 'hsl(30, 25%, 95%)',
              border: '1px solid hsla(30, 25%, 95%, 0.12)',
            }}
          >
            {brandName}
          </div>
        )}
      </div>

      {/* Title + subtitle */}
      {(title || subtitle) && (
        <div
          className="absolute inset-0 flex flex-col items-start justify-end pb-8 px-6 sm:px-8 z-10 pointer-events-none"
          style={{
            opacity: textOpacity,
            transform: `translateY(${scrollProgress * 12}px)`,
            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
          }}
        >
          {title && (
            <h1
              className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center"
              style={{ color: 'hsl(30, 25%, 97%)' }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="text-sm md:text-base mt-1.5 font-light tracking-wide text-center"
              style={{ color: 'hsla(30, 25%, 97%, 0.7)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Slide dots — top center */}
      {images.length > 1 && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20"
          style={{ opacity: textOpacity, transition: 'opacity 0.15s ease-out' }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentSlide ? 18 : 5,
                height: 5,
                background: i === currentSlide
                  ? 'hsl(var(--cafe-caramel))'
                  : 'hsla(0, 0%, 100%, 0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdaptiveHero;
