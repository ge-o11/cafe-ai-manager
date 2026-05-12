import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/contexts/EmployeeContext';
import { supabase } from '@/integrations/supabase/client';
import { useClockIn, useClockOut } from '@/hooks/useShifts';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, Clock, LogIn, LogOut, Delete, UtensilsCrossed, ChefHat, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee } from '@/hooks/useEmployees';
import type { Shift } from '@/hooks/useShifts';
import cafeNofLogo from '@/assets/cafe-nof-logo.png';

type Stage =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'clocked_in'; employee: Employee; shift: Shift }
  | { type: 'success_in'; employee: Employee }
  | { type: 'success_out'; employee: Employee; hours: string }
  | { type: 'error'; message: string };

function elapsedHHMM(clockIn: string): string {
  const ms = Date.now() - new Date(clockIn).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

const PunchClock: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setCurrentEmployee } = useEmployee();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const [pin, setPin] = useState('');
  const [stage, setStage] = useState<Stage>({ type: 'idle' });
  const [autoResetTimer, setAutoResetTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setPin('');
    setStage({ type: 'idle' });
  }, []);

  // Auto-reset after showing result
  useEffect(() => {
    if (stage.type === 'success_in' || stage.type === 'success_out' || stage.type === 'error' || stage.type === 'clocked_in') {
      if (autoResetTimer) clearTimeout(autoResetTimer);
      if (stage.type === 'success_in' || stage.type === 'success_out' || stage.type === 'error') {
        const t = setTimeout(reset, 5000);
        setAutoResetTimer(t);
      }
    }
    return () => { if (autoResetTimer) clearTimeout(autoResetTimer); };
  }, [stage.type]);

  const handleSubmit = useCallback(async (fullPin: string) => {
    setStage({ type: 'loading' });

    // Find employee by PIN
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_number', fullPin)
      .eq('is_active', true)
      .maybeSingle();

    if (empErr || !emp) {
      setStage({ type: 'error', message: 'PIN לא מזוהה' });
      setPin('');
      return;
    }

    // Check active shift
    const { data: shift } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', emp.id)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (shift) {
      // Already on shift — show clock-out option
      setStage({ type: 'clocked_in', employee: emp as Employee, shift: shift as Shift });
    } else {
      // Clock in
      await clockIn.mutateAsync(emp.id);
      setCurrentEmployee({ id: emp.id, name: emp.name, employee_number: emp.employee_number });
      qc.invalidateQueries({ queryKey: ['shifts'] });
      setStage({ type: 'success_in', employee: emp as Employee });
      setPin('');
    }
  }, [clockIn, setCurrentEmployee, qc]);

  const handleKey = useCallback((key: string) => {
    if (stage.type === 'loading') return;
    if (stage.type !== 'idle') { reset(); return; }

    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    const next = pin + key;
    setPin(next);
    if (next.length === 4) handleSubmit(next);
  }, [pin, stage, reset, handleSubmit]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('⌫');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const handleClockOut = async () => {
    if (stage.type !== 'clocked_in') return;
    const { employee, shift } = stage;
    const hours = elapsedHHMM(shift.clock_in);
    await clockOut.mutateAsync(shift.id);
    qc.invalidateQueries({ queryKey: ['shifts'] });
    setStage({ type: 'success_out', employee, hours });
    setPin('');
  };

  const goToWork = (employee: Employee) => {
    setCurrentEmployee({ id: employee.id, name: employee.name, employee_number: employee.employee_number });
    if (employee.role === 'waiter') navigate('/waiter');
    else if (employee.role === 'kitchen') navigate('/kitchen');
    else navigate('/hub');
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );

  if (!user) return <Navigate to="/2002-admin/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6 select-none">

      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <img src={cafeNofLogo} alt="Cafe Nof" className="h-14 w-auto rounded-xl" />
        <p className="text-sm font-semibold text-muted-foreground">שעון נוכחות</p>
      </div>

      {/* PIN display */}
      <div className="flex gap-3">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              pin.length > i ? 'bg-primary scale-110' : 'bg-muted border-2 border-border'
            }`}
          />
        ))}
      </div>

      {/* Stage feedback */}
      {stage.type === 'loading' && (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">בודק...</p>
        </div>
      )}

      {stage.type === 'error' && (
        <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{stage.message}</p>
          <p className="text-xs text-muted-foreground">מנסה שוב בעוד 5 שניות...</p>
        </div>
      )}

      {stage.type === 'success_in' && (
        <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-200">
            בוקר טוב, {stage.employee.name}!
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <LogIn className="w-4 h-4" />
            כניסה למשמרת נרשמה
          </p>
          {stage.employee.role && (
            <Button
              className="mt-2 gap-2"
              onClick={() => goToWork(stage.employee)}
            >
              {stage.employee.role === 'waiter'
                ? <UtensilsCrossed className="w-4 h-4" />
                : <ChefHat className="w-4 h-4" />}
              עבור לדף {stage.employee.role === 'waiter' ? 'מלצר' : 'מטבח'}
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">חוזר למסך בעוד 5 שניות</p>
        </div>
      )}

      {stage.type === 'success_out' && (
        <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
          <LogOut className="w-12 h-12 text-blue-500" />
          <p className="text-xl font-black text-blue-800 dark:text-blue-200">
            להתראות, {stage.employee.name}!
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            סה"כ {stage.hours} שעות במשמרת
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">חוזר למסך בעוד 5 שניות</p>
        </div>
      )}

      {stage.type === 'clocked_in' && (
        <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
          <div className="flex items-center gap-2">
            {stage.employee.role === 'waiter'
              ? <UtensilsCrossed className="w-6 h-6 text-amber-600" />
              : stage.employee.role === 'kitchen'
              ? <ChefHat className="w-6 h-6 text-amber-600" />
              : <Clock className="w-6 h-6 text-amber-600" />}
            <p className="text-lg font-black text-amber-800 dark:text-amber-200">{stage.employee.name}</p>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            במשמרת כבר <span className="font-mono font-bold text-lg">{elapsedHHMM(stage.shift.clock_in)}</span> שעות
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => goToWork(stage.employee)}
            >
              <ArrowRight className="w-4 h-4" />
              לדף עבודה
            </Button>
            <Button
              className="flex-1 gap-2 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleClockOut}
              disabled={clockOut.isPending}
            >
              {clockOut.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogOut className="w-4 h-4" />}
              סיום משמרת
            </Button>
          </div>
          <button onClick={reset} className="text-xs text-muted-foreground underline">ביטול</button>
        </div>
      )}

      {/* Keypad — shown only when idle */}
      {(stage.type === 'idle') && (
        <div className="grid grid-cols-3 gap-3 w-64">
          {KEYS.map((key, i) => (
            key === '' ? <div key={i} /> :
            <button
              key={i}
              onClick={() => handleKey(key)}
              className={`h-16 rounded-2xl text-xl font-bold transition-all duration-100 active:scale-95 ${
                key === '⌫'
                  ? 'bg-muted text-muted-foreground hover:bg-secondary text-base'
                  : 'bg-card border border-border hover:bg-primary hover:text-primary-foreground shadow-sm'
              }`}
            >
              {key === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          ))}
        </div>
      )}

      {stage.type === 'idle' && (
        <p className="text-xs text-muted-foreground">הזן את קוד ה-PIN שלך</p>
      )}

      {/* Hub back link */}
      <button
        onClick={() => navigate('/hub')}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
      >
        חזרה ל-Hub
      </button>
    </div>
  );
};

export default PunchClock;
