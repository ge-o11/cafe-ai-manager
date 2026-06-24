import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminMenuItems from '@/components/admin/AdminMenuItems';
import AdminAIChat from '@/components/admin/AdminAIChat';
import AdminHeroImages from '@/components/admin/AdminHeroImages';
import AdminEmployees from '@/components/admin/AdminEmployees';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = (location.state as { tab?: string } | null)?.tab ?? 'ai';
  const [activeTab, setActiveTab] = useState(initialTab);

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
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/hub', { state: { view: 'admin' } })}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t('admin.title')}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
            <TabsTrigger value="ai">{t('admin.aiChat')}</TabsTrigger>
            <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
            <TabsTrigger value="items">{t('admin.items')}</TabsTrigger>
            <TabsTrigger value="employees">עובדים</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AdminAIChat />
            <div className="mt-6">
              <AdminHeroImages />
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="items">
            <AdminMenuItems />
          </TabsContent>

          <TabsContent value="employees">
            <AdminEmployees />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
