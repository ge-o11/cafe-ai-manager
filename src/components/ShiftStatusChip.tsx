import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { ActiveEmployee } from '@/contexts/EmployeeContext';
import { Shift } from '@/hooks/useShifts';

function elapsedLabel(clockIn: string): string {
  const ms = Date.now() - new Date(clockIn).getTime();
  const totalSec = Math.floor(ms / 1_000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  employee: ActiveEmployee;
  shift: Shift | null | undefined;
}

const ShiftStatusChip: React.FC<Props> = ({ employee, shift }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
      {/* Name */}
      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 max-w-[90px] truncate">
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
