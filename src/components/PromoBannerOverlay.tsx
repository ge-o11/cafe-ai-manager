import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface Props {
  imageUrl: string;
  durationSeconds: number;
  onDismiss: () => void;
}

const PromoBannerOverlay: React.FC<Props> = ({ imageUrl, durationSeconds, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const dismissedRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Start progress bar animation
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${durationSeconds}s linear`;
      requestAnimationFrame(() => {
        if (progressRef.current) progressRef.current.style.width = '0%';
      });
    }

    const timer = setTimeout(handleDismiss, durationSeconds * 1000);
    return () => clearTimeout(timer);
  }, [visible, durationSeconds, handleDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-400 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDuration: '400ms' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="סגור"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Image container */}
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
          <img
            src={imageUrl}
            alt="הודעה מיוחדת"
            className="w-full object-contain max-h-[70dvh]"
            draggable={false}
          />

          {/* Progress bar */}
          <div className="h-1 bg-white/20">
            <div
              ref={progressRef}
              className="h-full bg-white/80 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBannerOverlay;
