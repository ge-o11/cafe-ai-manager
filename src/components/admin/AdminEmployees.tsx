import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2, UserPlus, Users, ShieldCheck, ShieldOff, Pencil, Check, X, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useEmployees, EmployeeRole } from '@/hooks/useEmployees';

const AdminEmployees: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: employees, isLoading } = useEmployees();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [role, setRole] = useState<EmployeeRole>(null);
  const [nameError, setNameError] = useState('');
  const [numberError, setNumberError] = useState('');

  // Per-employee hourly rate editing
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employees'] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const rate = hourlyRate ? parseFloat(hourlyRate) : null;
      const { error } = await supabase.from('employees').insert({
        name: name.trim(),
        employee_number: number.trim(),
        hourly_rate: rate,
        role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setName('');
      setNumber('');
      setHourlyRate('');
      setRole(null);
      toast.success('העובד נוסף בהצלחה');
    },
    onError: (err: Error) => {
      if (err.message?.includes('employees_number_unique')) {
        toast.error('מספר עובד כבר קיים');
      } else {
        toast.error('שגיאה בהוספת עובד');
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('employees').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('הסטטוס עודכן'); },
    onError: () => toast.error('שגיאה'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: EmployeeRole }) => {
      const { error } = await supabase.from('employees').update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('התפקיד עודכן'); },
    onError: () => toast.error('שגיאה בעדכון תפקיד'),
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, hourly_rate }: { id: string; hourly_rate: number | null }) => {
      const { error } = await supabase.from('employees').update({ hourly_rate }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('השכר עודכן'); setEditingRateId(null); },
    onError: () => toast.error('שגיאה בעדכון שכר'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('העובד נמחק'); },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  const handleAdd = () => {
    let valid = true;
    setNameError('');
    setNumberError('');
    if (!name.trim()) { setNameError('שם חובה'); valid = false; }
    if (!/^\d{4}$/.test(number.trim())) { setNumberError('חייב להיות בדיוק 4 ספרות'); valid = false; }
    if (!valid) return;
    addMutation.mutate();
  };

  const startEditRate = (id: string, current: number | null) => {
    setEditingRateId(id);
    setEditingRateValue(current != null ? String(current) : '');
  };

  const saveRate = (id: string) => {
    const val = editingRateValue.trim();
    const rate = val ? parseFloat(val) : null;
    if (val && (isNaN(rate!) || rate! <= 0)) { toast.error('שכר לא תקין'); return; }
    updateRateMutation.mutate({ id, hourly_rate: rate });
  };

  const isBusy = toggleMutation.isPending || deleteMutation.isPending;

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">ניהול עובדים</h3>
          <p className="text-sm text-muted-foreground">
            הוסף עובדים ומספרי PIN — מלצרים ומטבח מזינים PIN לכניסה
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="p-4 bg-muted/40 rounded-xl border border-border/60 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">הוסף עובד חדש</p>
        {/* Role selector */}
        <div className="flex gap-2">
          {([
            { value: 'waiter', label: 'מלצר', icon: <UtensilsCrossed className="w-4 h-4" /> },
            { value: 'kitchen', label: 'מטבח', icon: <ChefHat className="w-4 h-4" /> },
          ] as { value: EmployeeRole; label: string; icon: React.ReactNode }[]).map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setRole(role === opt.value ? null : opt.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                role === opt.value
                  ? opt.value === 'waiter'
                    ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="emp-name" className="text-xs">שם עובד</Label>
            <Input
              id="emp-name"
              placeholder="לדוגמה: דניאל"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              className={nameError ? 'border-red-400' : ''}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="emp-number" className="text-xs">PIN (4 ספרות)</Label>
            <Input
              id="emp-number"
              placeholder="1234"
              maxLength={4}
              value={number}
              onChange={e => { setNumber(e.target.value.replace(/\D/g, '').slice(0, 4)); setNumberError(''); }}
              className={`text-center tracking-widest font-mono text-lg ${numberError ? 'border-red-400' : ''}`}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {numberError && <p className="text-xs text-red-500">{numberError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="emp-rate" className="text-xs">שכר שעתי (₪)</Label>
            <Input
              id="emp-rate"
              placeholder="40.00"
              type="number"
              min="0"
              step="0.5"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <Button onClick={handleAdd} disabled={addMutation.isPending} className="gap-2 h-10">
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            הוסף
          </Button>
        </div>
      </div>

      {/* Employees list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : employees && employees.length > 0 ? (
        <div className="space-y-2">
          {employees.map(emp => (
            <div
              key={emp.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                emp.is_active ? 'border-border/60 bg-card' : 'border-border/30 bg-muted/30 opacity-60'
              }`}
            >
              {/* PIN badge */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-mono text-lg font-bold text-primary tracking-widest">
                  {emp.employee_number}
                </span>
              </div>

              {/* Name + status + role */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{emp.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{emp.is_active ? 'פעיל' : 'מושבת'}</p>
                  <div className="flex gap-1">
                    {(['waiter', 'kitchen'] as EmployeeRole[]).map(r => (
                      <button
                        key={String(r)}
                        onClick={() => updateRoleMutation.mutate({ id: emp.id, role: emp.role === r ? null : r })}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          emp.role === r
                            ? r === 'waiter'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-muted text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {r === 'waiter' ? <UtensilsCrossed className="w-2.5 h-2.5" /> : <ChefHat className="w-2.5 h-2.5" />}
                        {r === 'waiter' ? 'מלצר' : 'מטבח'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hourly rate inline edit */}
              <div className="flex items-center gap-1 shrink-0">
                {editingRateId === emp.id ? (
                  <>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editingRateValue}
                      onChange={e => setEditingRateValue(e.target.value)}
                      className="w-20 h-8 text-sm text-center"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveRate(emp.id); if (e.key === 'Escape') setEditingRateId(null); }}
                    />
                    <span className="text-xs text-muted-foreground">₪</span>
                    <button
                      onClick={() => saveRate(emp.id)}
                      disabled={updateRateMutation.isPending}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingRateId(null)}
                      className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEditRate(emp.id, emp.hourly_rate)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                    title="ערוך שכר שעתי"
                  >
                    <span className="font-semibold text-foreground">
                      {emp.hourly_rate != null ? `₪${emp.hourly_rate}/ש׳` : '— ₪/ש׳'}
                    </span>
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMutation.mutate({ id: emp.id, is_active: !emp.is_active })}
                  disabled={isBusy}
                  title={emp.is_active ? 'השבת עובד' : 'הפעל עובד'}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {emp.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(emp.id)}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">אין עובדים רשומים עדיין.</p>
          <p className="mt-1 text-xs opacity-60">הוסף את הצוות שלך כאן</p>
        </div>
      )}
    </Card>
  );
};

export default AdminEmployees;
