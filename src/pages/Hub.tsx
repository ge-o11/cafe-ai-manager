import React, { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmployee } from '@/contexts/EmployeeContext';
import { Button } from '@/components/ui/button';
import {
  Loader2, ChefHat, UtensilsCrossed, LayoutDashboard, LogOut,
  BarChart3, History, Sparkles, Megaphone,
  ArrowRight, ShieldCheck, Users, TrendingUp, Timer,
} from 'lucide-react';
import EmployeePinModal from '@/components/EmployeePinModal';
import AdminPinModal from '@/components/AdminPinModal';
import type { Employee } from '@/hooks/useEmployees';
import { useActiveShifts } from '@/hooks/useShifts';
import cafeNofLogo from '@/assets/cafe-nof-logo.png';

// ─── Admin nav card ───────────────────────────────────────────────────────────

interface NavCardProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

const NavCard: React.FC<NavCardProps> = ({ icon, label, desc, iconBg, iconColor, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-right w-full"
  >
    <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="font-bold text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </button>
);

type View = 'select' | 'employee' | 'admin';

const Hub: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentEmployee } = useEmployee();

  const initialView: View = location.state?.view === 'employee' ? 'employee' : 'select';
  const [view, setView] = useState<View>(initialView);
  const [adminPinOpen, setAdminPinOpen] = useState(false);
  const [empTarget, setEmpTarget] = useState<'/waiter' | '/kitchen' | null>(null);
  const { data: activeShifts = [] } = useActiveShifts();

  const handleEmployeePinSuccess = (employee: Employee) => {
    setCurrentEmployee(employee);
    const dest = employee.role === 'waiter' ? '/waiter'
               : employee.role === 'kitchen' ? '/kitchen'
               : empTarget!;
    navigate(dest);
    setEmpTarget(null);
  };

  const handleAdminPinSuccess = () => {
    setAdminPinOpen(false);
    setView('admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/2002-admin/login" replace />;

  // ── Role selection ──────────────────────────────────────────────────────────
  if (view === 'select') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-8">
        {/* Modals */}
        {adminPinOpen && (
          <AdminPinModal
            onSuccess={handleAdminPinSuccess}
            onClose={() => setAdminPinOpen(false)}
          />
        )}

        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3">
          <img src={cafeNofLogo} alt="Cafe Nof" className="h-20 w-auto rounded-xl" />
          <h1 className="font-display text-2xl font-bold text-foreground">Cafe Nof</h1>
          <p className="text-sm text-muted-foreground">מי אתה?</p>
        </div>

        {/* Two big role cards */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
          {/* Employee */}
          <button
            onClick={() => setView('employee')}
            className="group flex flex-col items-center gap-5 py-10 px-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-3xl hover:border-amber-400 hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
              <Users className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-xl">עובד</p>
              <p className="text-xs text-muted-foreground mt-1">מלצר / מטבח</p>
            </div>
          </button>

          {/* Manager */}
          <button
            onClick={() => isAdmin ? setAdminPinOpen(true) : undefined}
            className="group flex flex-col items-center gap-5 py-10 px-4 bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-3xl hover:border-primary/50 hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-xl">מנהל</p>
              <p className="text-xs text-muted-foreground mt-1">גישה מלאה</p>
            </div>
          </button>
        </div>

        {/* Logout */}
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={signOut}>
          <LogOut className="w-4 h-4" />
          {t('waiter.logout')}
        </Button>
      </div>
    );
  }

  // ── Employee view ───────────────────────────────────────────────────────────
  if (view === 'employee') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
        {/* Employee PIN modal */}
        {empTarget && (
          <EmployeePinModal
            onSuccess={handleEmployeePinSuccess}
            onClose={() => setEmpTarget(null)}
          />
        )}

        {/* Back + title */}
        <div className="flex flex-col items-center gap-2">
          <img src={cafeNofLogo} alt="Cafe Nof" className="h-14 w-auto rounded-xl" />
          <p className="text-lg font-bold text-foreground">בחר תפקיד</p>
          <p className="text-xs text-muted-foreground">הזן מספר עובד לאחר הבחירה</p>
        </div>

        {/* Punch clock shortcut */}
        <button
          onClick={() => navigate('/punch')}
          className="flex items-center gap-3 px-5 py-3 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all w-full max-w-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-foreground text-sm">שעון נוכחות</p>
            <p className="text-xs text-muted-foreground">כניסה / יציאה ממשמרת</p>
          </div>
        </button>

        {/* Waiter + Kitchen */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
          <button
            onClick={() => setEmpTarget('/waiter')}
            className="group flex flex-col items-center gap-5 py-10 px-4 bg-card border border-border rounded-3xl hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <UtensilsCrossed className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-xl">מלצר</p>
              <p className="text-xs text-muted-foreground mt-1">קבלת הזמנות</p>
            </div>
          </button>

          <button
            onClick={() => setEmpTarget('/kitchen')}
            className="group flex flex-col items-center gap-5 py-10 px-4 bg-card border border-border rounded-3xl hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <ChefHat className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-xl">מטבח</p>
              <p className="text-xs text-muted-foreground mt-1">הכנת הזמנות</p>
            </div>
          </button>
        </div>

        {/* Connected employees panel */}
        {activeShifts.length > 0 && (
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              מחובר עכשיו ({activeShifts.length})
            </p>
            {activeShifts.map(s => {
              const emp = s.employees;
              const isWaiter = emp.role === 'waiter';
              const isKitchen = emp.role === 'kitchen';
              const ms = Date.now() - new Date(s.clock_in).getTime();
              const totalMin = Math.floor(ms / 60_000);
              const h = Math.floor(totalMin / 60);
              const m = totalMin % 60;
              const elapsed = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
              return (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isWaiter ? 'bg-amber-100 dark:bg-amber-900/30' :
                    isKitchen ? 'bg-orange-100 dark:bg-orange-900/30' :
                    'bg-muted'
                  }`}>
                    {isWaiter ? <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
                     isKitchen ? <ChefHat className="w-4 h-4 text-orange-600 dark:text-orange-400" /> :
                     <Users className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isWaiter ? 'מלצר' : isKitchen ? 'מטבח' : 'לא הוגדר'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {elapsed}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back */}
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => setView('select')}>
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
      </div>
    );
  }

  // ── Admin view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shrink-0">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cafeNofLogo} alt="Cafe Nof" className="h-9 w-auto rounded-xl" />
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">Cafe Nof</p>
              <p className="text-xs text-muted-foreground leading-tight">לוח ניהול</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
            onClick={() => setView('select')}
          >
            <ArrowRight className="w-4 h-4" />
            יציאה
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* ── Section: ניהול ──────────────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              ניהול
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NavCard
                icon={<LayoutDashboard className="w-6 h-6" />}
                label="ניהול תוכן"
                desc="תפריט, קטגוריות, עובדים, AI Chat"
                iconBg="bg-primary/10"
                iconColor="text-primary"
                onClick={() => navigate('/2002-admin/dashboard')}
              />
              <NavCard
                icon={<Megaphone className="w-6 h-6" />}
                label="פרסומות"
                desc="באנרים ומבצעים ללקוחות"
                iconBg="bg-pink-100 dark:bg-pink-900/30"
                iconColor="text-pink-600 dark:text-pink-400"
                onClick={() => navigate('/promo')}
              />
            </div>
          </section>

          {/* ── Section: ניתוח ודוחות ───────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              ניתוח ודוחות
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NavCard
                icon={<BarChart3 className="w-6 h-6" />}
                label="דוחות מכירות"
                desc="הכנסות, תשלומים, מוצרים וקטגוריות"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
                onClick={() => navigate('/reports')}
              />
              <NavCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="ביצועי עובדים"
                desc="מכירות, שעות ועלות עבודה"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                onClick={() => navigate('/reports?section=employees')}
              />
              <NavCard
                icon={<History className="w-6 h-6" />}
                label="היסטוריית הזמנות"
                desc="כל ההזמנות לפי שולחן ותאריך"
                iconBg="bg-slate-100 dark:bg-slate-800"
                iconColor="text-slate-600 dark:text-slate-400"
                onClick={() => navigate('/reports?section=tables')}
              />
              <NavCard
                icon={<Sparkles className="w-6 h-6" />}
                label="המלצות AI"
                desc="תובנות עסקיות ומבצעים שבועיים"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
                onClick={() => navigate('/reports?section=ai')}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Hub;
