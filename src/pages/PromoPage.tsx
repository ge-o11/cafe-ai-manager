import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminPromoBanner from '@/components/admin/AdminPromoBanner';

const PromoPage: React.FC = () => {
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
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center gap-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/hub', { state: { view: 'admin' } })}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">פרסומות וברכות</h1>
              <p className="text-xs text-muted-foreground leading-tight">באנרים שמוצגים ללקוחות בכניסה לתפריט</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        <AdminPromoBanner />
      </main>
    </div>
  );
};

export default PromoPage;
