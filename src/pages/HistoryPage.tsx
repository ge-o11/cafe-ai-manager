import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminTableHistory from '@/components/admin/AdminTableHistory';

const HistoryPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/2002-admin/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center gap-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/hub')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">היסטוריית הזמנות</h1>
              <p className="text-xs text-muted-foreground leading-tight">הזמנות לפי שולחן</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <AdminTableHistory />
      </main>
    </div>
  );
};

export default HistoryPage;
