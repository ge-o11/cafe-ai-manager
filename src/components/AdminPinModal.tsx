import React, { useState, useCallback } from 'react';
import { X, Delete, Lock } from 'lucide-react';

const ADMIN_PIN = '2002';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

const AdminPinModal: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerError = () => {
    setError('קוד שגוי');
    setPin('');
    setShake(true);
    setTimeout(() => { setShake(false); setError(''); }, 600);
  };

  const handleKey = useCallback((key: string) => {
    setError('');
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        onSuccess();
      } else {
        triggerError();
      }
    }
  }, [pin, onSuccess]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 bg-card border border-border rounded-3xl shadow-2xl p-8 w-80 flex flex-col items-center gap-6"
        style={shake ? { animation: 'pin-shake 0.45s ease-in-out' } : {}}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center pt-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">הזינו קוד גישה</p>
        </div>

        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-primary border-primary scale-110'
                  : 'border-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <div className="h-4 flex items-center">
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full -mt-2">
          {KEYS.map((k, i) => (
            k === '' ? (
              <div key={i} />
            ) : k === '⌫' ? (
              <button
                key={i}
                onClick={() => handleKey('⌫')}
                disabled={pin.length === 0}
                className="h-14 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            ) : (
              <button
                key={i}
                onClick={() => handleKey(k)}
                disabled={pin.length >= 4}
                className="h-14 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 active:bg-primary/20 transition-all text-xl font-semibold text-foreground disabled:opacity-30 select-none"
              >
                {k}
              </button>
            )
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
};

export default AdminPinModal;
