import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ArrowRight, BarChart3,
  Trophy, Users, History, Package, Sparkles,
  TrendingUp, DollarSign, Clock, PieChart, ChevronDown, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminReports from '@/components/admin/AdminReports';
import AdminEmployeePerformance from '@/components/admin/AdminEmployeePerformance';
import AdminTableHistory from '@/components/admin/AdminTableHistory';
import AdminInventory from '@/components/admin/AdminInventory';
import AdminAIInsightsPanel from '@/components/admin/AdminAIInsightsPanel';

// ─── Report tree definition ───────────────────────────────────────────────────

type ReportId =
  | 'sales-kpis'
  | 'sales-chart'
  | 'sales-payment'
  | 'sales-category'
  | 'products'
  | 'employees'
  | 'tables'
  | 'inventory'
  | 'ai';

interface ReportItem {
  id: ReportId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ReportGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: ReportItem[];
}

const REPORT_GROUPS: ReportGroup[] = [
  {
    key: 'sales',
    label: 'מכירות',
    icon: <TrendingUp className="w-4 h-4" />,
    items: [
      {
        id: 'sales-kpis',
        label: 'KPIs וסיכום',
        icon: <BarChart3 className="w-4 h-4" />,
        description: 'הכנסה, מספר הזמנות, ממוצע להזמנה ושעת שיא — עם השוואה לתקופה הקודמת',
      },
      {
        id: 'sales-chart',
        label: 'גרף הכנסות',
        icon: <TrendingUp className="w-4 h-4" />,
        description: 'גרף הכנסות לפי שעה / יום / חודש עם קו השוואה לתקופה הקודמת',
      },
      {
        id: 'sales-payment',
        label: 'אמצעי תשלום',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'פירוט הכנסות לפי אמצעי תשלום — מזומן, אשראי, אפליקציה ואחר',
      },
      {
        id: 'sales-category',
        label: 'לפי קטגוריה',
        icon: <PieChart className="w-4 h-4" />,
        description: 'חלוקת הכנסות לפי קטגוריית תפריט ופילוח שעות שיא',
      },
    ],
  },
  {
    key: 'products',
    label: 'פריטים מובילים',
    icon: <Trophy className="w-4 h-4" />,
    items: [
      {
        id: 'products',
        label: 'ביצועי מוצרים',
        icon: <Trophy className="w-4 h-4" />,
        description: 'דירוג כל פריטי התפריט לפי כמות מכירות — עם הכנסה, עלות ומרג׳ין לכל מוצר',
      },
    ],
  },
  {
    key: 'employees',
    label: 'עובדים',
    icon: <Users className="w-4 h-4" />,
    items: [
      {
        id: 'employees',
        label: 'ביצועי עובדים',
        icon: <Users className="w-4 h-4" />,
        description: 'מספר הזמנות, הכנסות וממוצע ערך הזמנה לפי עובד ותקופה',
      },
    ],
  },
  {
    key: 'tables',
    label: 'שולחנות',
    icon: <History className="w-4 h-4" />,
    items: [
      {
        id: 'tables',
        label: 'היסטוריית שולחנות',
        icon: <History className="w-4 h-4" />,
        description: 'כל ההזמנות לפי שולחן עם פירוט פריטים, מחיר, אמצעי תשלום וסטטוס',
      },
    ],
  },
  {
    key: 'inventory',
    label: 'מלאי',
    icon: <Package className="w-4 h-4" />,
    items: [
      {
        id: 'inventory',
        label: 'מלאי ואזהרות',
        icon: <Package className="w-4 h-4" />,
        description: 'רמות המלאי הנוכחיות — פריטים מתחת לסף מינימום מסומנים באדום',
      },
    ],
  },
  {
    key: 'ai',
    label: 'תובנות AI',
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        id: 'ai',
        label: 'המלצות AI',
        icon: <Sparkles className="w-4 h-4" />,
        description: 'המלצות עסקיות מבוססות נתונים, מבצעים, שעות עומס ורעיונות לשיפור',
      },
    ],
  },
];

const ALL_ITEMS: ReportItem[] = REPORT_GROUPS.flatMap(g => g.items);

function getSection(id: ReportId) {
  if (id === 'sales-kpis')     return 'kpis' as const;
  if (id === 'sales-chart')    return 'chart' as const;
  if (id === 'sales-payment')  return 'payment' as const;
  if (id === 'sales-category') return 'category' as const;
  return undefined;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SECTION_TO_ID: Record<string, ReportId> = {
  employees: 'employees',
  tables:    'tables',
  ai:        'ai',
};

const ReportsPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getInitialId = (): ReportId => {
    const s = searchParams.get('section');
    return (s && SECTION_TO_ID[s]) ? SECTION_TO_ID[s] : 'sales-kpis';
  };

  const getInitialGroups = (id: ReportId): Set<string> => {
    const group = REPORT_GROUPS.find(g => g.items.some(i => i.id === id));
    return new Set(group ? [group.key, 'sales'] : ['sales']);
  };

  const initialId = getInitialId();
  const [activeId, setActiveId] = useState<ReportId>(initialId);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => getInitialGroups(initialId));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/2002-admin/login" replace />;

  const activeItem = ALL_ITEMS.find(i => i.id === activeId)!;
  const activeGroup = REPORT_GROUPS.find(g => g.items.some(i => i.id === activeId))!;

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectItem = (id: ReportId, groupKey: string) => {
    setActiveId(id);
    setOpenGroups(prev => new Set([...prev, groupKey]));
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeId === 'sales-kpis' || activeId === 'sales-chart' || activeId === 'sales-payment' || activeId === 'sales-category') {
      return <AdminReports section={getSection(activeId)} />;
    }
    if (activeId === 'products')   return <AdminReports section="products" />;
    if (activeId === 'employees')  return <AdminEmployeePerformance />;
    if (activeId === 'tables')     return <AdminTableHistory />;
    if (activeId === 'inventory')  return <AdminInventory />;
    if (activeId === 'ai')         return <AdminAIInsightsPanel />;
    return null;
  };

  const Sidebar = () => (
    <nav className="w-full h-full flex flex-col gap-1 py-2">
      {REPORT_GROUPS.map(group => {
        const isOpen = openGroups.has(group.key);
        const hasMultiple = group.items.length > 1;
        return (
          <div key={group.key}>
            {hasMultiple ? (
              // Collapsible group header
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                <span className="text-primary">{group.icon}</span>
                <span className="flex-1 text-right">{group.label}</span>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>
            ) : (
              // Single-item group — direct clickable
              <button
                onClick={() => selectItem(group.items[0].id, group.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  activeId === group.items[0].id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className={activeId === group.items[0].id ? 'text-primary-foreground' : 'text-primary'}>
                  {group.icon}
                </span>
                <span className="flex-1 text-right">{group.label}</span>
              </button>
            )}

            {/* Sub-items */}
            {hasMultiple && isOpen && (
              <div className="mr-3 border-r border-border pr-2 mt-0.5 mb-1 space-y-0.5">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.id, group.key)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeId === item.id
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={activeId === item.id ? 'text-primary-foreground' : ''}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-right">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sticky page header ───────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-20 shadow-sm shrink-0">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/hub', { state: { view: 'admin' } })}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          {/* Mobile: sidebar toggle */}
          <button
            className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(o => !o)}
          >
            <span className="text-primary">{activeGroup.icon}</span>
            <span>{activeGroup.label}</span>
            <span className="text-muted-foreground mx-1">›</span>
            <span className="text-foreground">{activeItem.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          {/* Desktop: title */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">מרכז הדוחות</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {activeGroup.label} › {activeItem.label}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile dropdown sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden border-t border-border bg-card px-4 pb-3">
            <Sidebar />
          </div>
        )}
      </header>

      {/* ── Body: sidebar + content ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-l border-border bg-card/50 p-3 overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1 mb-1">
            קטגוריות
          </p>
          <Sidebar />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Description banner */}
          <div className="bg-muted/40 border-b border-border px-6 py-2.5 flex items-center gap-2">
            <span className="text-primary shrink-0">{activeItem.icon}</span>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{activeItem.label}</span>
              {' — '}{activeItem.description}
            </p>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
