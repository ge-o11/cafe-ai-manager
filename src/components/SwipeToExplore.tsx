import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface SwipeToExploreProps {
  onSwipeComplete: () => void;
  label: string;
}

const TRACK_PADDING = 4;
const THUMB_SIZE = 56;

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
      setTimeout(() => onSwipeComplete(), 500);
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
  const glowStrength = 8 + progress * 18;
  const glowOpacity = 0.25 + progress * 0.55;

  return (
    <div
      ref={trackRef}
      dir="ltr"
      className="relative w-full max-w-[320px] select-none"
      style={{
        height: 64,
        borderRadius: 9999,
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1.5px solid rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(6px)',
        padding: TRACK_PADDING,
      }}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {/* Caramel progress fill */}
      <div
        className="absolute rounded-full"
        style={{
          top: TRACK_PADDING,
          left: TRACK_PADDING,
          bottom: TRACK_PADDING,
          width: `${Math.max(THUMB_SIZE, dragX + THUMB_SIZE)}px`,
          background: completed
            ? 'linear-gradient(90deg, hsl(32,65%,38%), hsl(40,75%,52%))'
            : 'linear-gradient(90deg, hsla(32,65%,38%,0.7), hsla(40,75%,52%,0.75))',
          borderRadius: 9999,
          opacity: progress > 0 || completed ? 1 : 0,
          transition: completed
            ? 'width 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.3s'
            : progress > 0 ? 'none' : 'opacity 0.3s',
        }}
      />

      {/* Label */}
      <div
        className="absolute inset-0 flex items-center justify-center text-[13px] font-medium tracking-[0.1em] pointer-events-none"
        style={{
          color: `rgba(255, 255, 255, ${Math.max(0, 0.75 - progress * 1.1)})`,
          paddingLeft: THUMB_SIZE + 8,
          transition: 'color 0.15s',
          letterSpacing: '0.08em',
        }}
      >
        {!completed && label}
      </div>

      {/* Completed state */}
      {completed && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: 'swipeCheckIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        >
          <Check size={20} strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.95)' }} />
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
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s',
          background: completed
            ? 'linear-gradient(135deg, hsl(32,65%,48%), hsl(40,75%,60%))'
            : progress > 0
              ? `linear-gradient(135deg, hsla(32,65%,48%,${0.5 + progress * 0.5}), hsla(40,75%,60%,${0.5 + progress * 0.5}))`
              : 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(10px)',
          cursor: completed ? 'default' : isDragging ? 'grabbing' : 'grab',
          boxShadow: completed
            ? `0 0 24px hsla(36,70%,50%,0.7), 0 2px 12px rgba(0,0,0,0.25)`
            : `0 0 ${glowStrength}px hsla(36,70%,50%,${glowOpacity}), 0 2px 10px rgba(0,0,0,0.2)`,
          border: progress > 0 || completed
            ? '1px solid hsla(40,75%,65%,0.6)'
            : '1px solid rgba(255,255,255,0.25)',
          animation: !isDragging && !completed ? 'thumbPulse 2.8s ease-in-out infinite' : 'none',
        }}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
      >
        {!completed && (
          <ArrowRight
            size={20}
            strokeWidth={2}
            style={{
              color: progress > 0.3 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
              transition: 'color 0.2s',
              animation: !isDragging && !completed ? 'arrowNudge 2.8s ease-in-out infinite' : 'none',
            }}
          />
        )}
      </div>

      {/* Shimmer sweep */}
      {!isDragging && !completed && (
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
          <div
            className="absolute h-full w-2/5 top-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              animation: 'swipeShimmer 3.2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes thumbPulse {
          0%, 100% { box-shadow: 0 0 8px hsla(36,70%,50%,0.25), 0 2px 10px rgba(0,0,0,0.2); }
          50%       { box-shadow: 0 0 20px hsla(36,70%,50%,0.5), 0 2px 14px rgba(0,0,0,0.25); }
        }
        @keyframes arrowNudge {
          0%, 70%, 100% { transform: translateX(0); }
          80%           { transform: translateX(4px); }
          90%           { transform: translateX(1px); }
        }
        @keyframes swipeShimmer {
          0%   { left: -40%; }
          60%, 100% { left: 130%; }
        }
        @keyframes swipeCheckIn {
          0%   { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SwipeToExplore;
