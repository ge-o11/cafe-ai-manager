import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ArrowRight, BarChart3,
  Trophy, Users, History, Package, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminReports from '@/components/admin/AdminReports';
import AdminEmployeePerformance from '@/components/admin/AdminEmployeePerformance';
import AdminTableHistory from '@/components/admin/AdminTableHistory';
import AdminInventory from '@/components/admin/AdminInventory';
import AdminAIInsightsPanel from '@/components/admin/AdminAIInsightsPanel';

// ─── Tab config ───────────────────────────────────────────────────────────────

type ReportTab = 'top-items' | 'employees' | 'table-history' | 'inventory' | 'ai-insights';

interface TabConfig {
  key: ReportTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabConfig[] = [
  {
    key: 'top-items',
    label: 'פריטים מובילים',
    icon: <Trophy className="w-4 h-4" />,
    description: 'דירוג פריטי התפריט לפי כמות המכירות — זיהוי מוצרים פופולריים ומוצרים שנמכרים פחות',
  },
  {
    key: 'employees',
    label: 'ביצועי עובדים',
    icon: <Users className="w-4 h-4" />,
    description: 'מספר הזמנות, הכנסות וממוצע ערך הזמנה לפי עובד ותקופה',
  },
  {
    key: 'table-history',
    label: 'היסטוריית שולחנות',
    icon: <History className="w-4 h-4" />,
    description: 'כל ההזמנות לפי שולחן עם פירוט פריטים, מחיר, אמצעי תשלום וסטטוס',
  },
  {
    key: 'inventory',
    label: 'מלאי ואזהרות',
    icon: <Package className="w-4 h-4" />,
    description: 'רמות המלאי הנוכחיות לכל פריט — פריטים מתחת לסף מינימום מסומנים באדום',
  },
  {
    key: 'ai-insights',
    label: 'תובנות AI',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'המלצות עסקיות מבוססות נתונים — מבצעים, שעות עומס, שילובי מוצרים ורעיונות לשיפור',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReportsPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ReportTab>('top-items');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/2002-admin/login" replace />;

  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header + tab bar ──────────────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-20 shadow-sm">

        {/* Top row: back + title */}
        <div className="container flex items-center gap-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/hub')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight text-lg">מרכז הדוחות</h1>
              <p className="text-xs text-muted-foreground leading-tight">ניתוח נתונים מלא</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-t border-border/50">
          <div className="container">
            <div
              className="flex gap-1 py-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    whitespace-nowrap transition-all shrink-0
                    ${activeTab === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Description banner ───────────────────────────────────────────────── */}
      <div className="bg-muted/40 border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <span className="text-muted-foreground shrink-0">{active.icon}</span>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{active.label}</span>
            {' — '}{active.description}
          </p>
        </div>
      </div>

      {/* ── Report content ───────────────────────────────────────────────────── */}
      <main className="container py-8">
        {activeTab === 'top-items'     && <AdminReports />}
        {activeTab === 'employees'     && <AdminEmployeePerformance />}
        {activeTab === 'table-history' && <AdminTableHistory />}
        {activeTab === 'inventory'     && <AdminInventory />}
        {activeTab === 'ai-insights'   && <AdminAIInsightsPanel />}
      </main>
    </div>
  );
};

export default ReportsPage;
