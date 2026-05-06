import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface SwipeToExploreProps {
  onSwipeComplete: () => void;
  label: string;
}

const TRACK_PADDING = 4;
const THUMB_SIZE = 52;

const SwipeToExplore: React.FC<SwipeToExploreProps> = ({ onSwipeComplete, label }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    const updateMax = () => {
      if (trackRef.current) {
        setMaxX(trackRef.current.offsetWidth - THUMB_SIZE - TRACK_PADDING * 2);
      }
    };
    updateMax();
    window.addEventListener('resize', updateMax);
    return () => window.removeEventListener('resize', updateMax);
  }, []);

  const getClientX = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) return e.touches[0].clientX;
    return e.clientX;
  };

  const startX = useRef(0);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (completed) return;
    setIsDragging(true);
    startX.current = getClientX(e) - dragX;
  }, [dragX, completed]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || completed) return;
    const currentX = getClientX(e) - startX.current;
    const clamped = Math.max(0, Math.min(currentX, maxX));
    setDragX(clamped);
  }, [isDragging, maxX, completed]);

  const handleEnd = useCallback(() => {
    if (!isDragging || completed) return;
    setIsDragging(false);

    if (dragX >= maxX * 0.85) {
      setDragX(maxX);
      setCompleted(true);
      setTimeout(() => onSwipeComplete(), 400);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, maxX, completed, onSwipeComplete]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) handleEnd();
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || completed) return;
      const currentX = e.clientX - startX.current;
      const clamped = Math.max(0, Math.min(currentX, maxX));
      setDragX(clamped);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, maxX, completed, handleEnd]);

  const progress = maxX > 0 ? dragX / maxX : 0;

  return (
    <div
      ref={trackRef}
      dir="ltr"
      className="relative w-full max-w-[320px] select-none"
      style={{
        height: 60,
        borderRadius: 9999,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: TRACK_PADDING,
      }}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {/* Progress fill */}
      <div
        className="absolute rounded-full"
        style={{
          top: TRACK_PADDING,
          left: TRACK_PADDING,
          bottom: TRACK_PADDING,
          width: `${Math.max(THUMB_SIZE, dragX + THUMB_SIZE)}px`,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))',
          opacity: progress > 0 ? 1 : 0,
          borderRadius: 9999,
          transition: progress > 0 ? 'none' : 'opacity 0.3s',
        }}
      />

      {/* Label */}
      <div
        className="absolute inset-0 flex items-center justify-center text-[13px] font-medium tracking-[0.08em] pointer-events-none"
        style={{
          color: `rgba(255, 255, 255, ${0.45 - progress * 0.6})`,
          paddingLeft: THUMB_SIZE + 4,
          transition: 'color 0.2s',
        }}
      >
        {!completed && label}
      </div>

      {/* Completed check */}
      {completed && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
        >
          <span className="text-base" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>✓</span>
        </div>
      )}

      {/* Thumb */}
      <div
        className="relative z-10 rounded-full flex items-center justify-center"
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE - TRACK_PADDING * 2 + 4,
          marginTop: -2,
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          background: completed
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          cursor: completed ? 'default' : 'grab',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: !isDragging && !completed ? 'thumbPulse 2.5s ease-in-out infinite' : 'none',
        }}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
      >
        <ArrowRight
          className="transition-all duration-200"
          size={18}
          strokeWidth={2}
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            transform: completed ? 'scale(0)' : 'none',
            animation: !isDragging && !completed ? 'arrowBounce 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Shimmer */}
      {!isDragging && !completed && (
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
          <div
            className="absolute h-full w-1/3 top-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes thumbPulse {
          0%, 100% { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 2px 20px rgba(255,255,255,0.12); }
        }
      `}</style>
    </div>
  );
};

export default SwipeToExplore;
