import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { ActiveEmployee } from '@/contexts/EmployeeContext';
import { Shift } from '@/hooks/useShifts';

function elapsedLabel(clockIn: string): string {
  const ms = Date.now() - new Date(clockIn).getTime();
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}ד׳`;
  return `${h}:${String(m).padStart(2, '0')}ש׳`;
}

interface Props {
  employee: ActiveEmployee;
  shift: Shift | null | undefined;
}

const ShiftStatusChip: React.FC<Props> = ({ employee, shift }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
      {/* PIN avatar */}
      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
        <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          {employee.employee_number}
        </span>
      </div>

      {/* Name */}
      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 max-w-[80px] truncate">
        {employee.name}
      </span>

      {/* Elapsed time */}
      {shift && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
          <Clock className="w-3 h-3" />
          {elapsedLabel(shift.clock_in)}
        </div>
      )}
    </div>
  );
};

export default ShiftStatusChip;
