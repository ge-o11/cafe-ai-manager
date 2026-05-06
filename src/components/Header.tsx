import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import cafeNofLogo from '@/assets/cafe-nof-logo.png';

interface HeaderProps {
  showAdminControls?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showAdminControls = false }) => {
  const { t, isRTL } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  
  // Only show admin controls if explicitly requested or on admin pages
  const isAdminPage = location.pathname.startsWith('/2002-admin');
  const shouldShowAdminControls = showAdminControls || isAdminPage;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={cafeNofLogo} alt="Cafe Nof" className="h-10 w-auto rounded" />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          {/* Only show admin controls on admin pages or when explicitly requested */}
          {shouldShowAdminControls && user && isAdmin && (
            <>
              <Link to="/2002-admin">
                <Button variant="ghost" size="sm">
                  <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('nav.logout')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
