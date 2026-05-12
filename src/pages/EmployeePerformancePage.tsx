import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AdminEmployeePerformance from '@/components/admin/AdminEmployeePerformance';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, TrendingUp } from 'lucide-react';

const EmployeePerformancePage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/2002-admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showAdminControls />

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                ביצועי עובדים
              </h1>
              <p className="text-sm text-muted-foreground">מכירות, שעות ועלויות שכר</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/hub')}>
            <ChevronRight className="w-4 h-4" />
            חזרה
          </Button>
        </div>

        <AdminEmployeePerformance />
      </main>
    </div>
  );
};

export default EmployeePerformancePage;
