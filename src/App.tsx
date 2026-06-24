import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
import EmployeesPage from "./pages/EmployeesPage";
import Welcome from "./pages/Welcome";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoot from "./pages/AdminRoot";
import Waiter from "./pages/Waiter";
import Kitchen from "./pages/Kitchen";
import Hub from "./pages/Hub";
import ReportsPage from "./pages/ReportsPage";
import InventoryPage from "./pages/InventoryPage";
import PromoPage from "./pages/PromoPage";
import PunchClock from "./pages/PunchClock";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <EmployeeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/2002-admin-root" element={<AdminRoot />} />
              <Route path="/2002-admin/login" element={<Login />} />
              <Route path="/2002-admin/dashboard" element={<AdminDashboard />} />
              <Route path="/2002-admin" element={<Admin />} />
              <Route path="/hub" element={<Hub />} />
              <Route path="/waiter" element={<Waiter />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/history" element={<Navigate to="/reports?section=tables" replace />} />
              <Route path="/insights" element={<Navigate to="/reports?section=ai" replace />} />
              <Route path="/promo" element={<PromoPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/punch" element={<PunchClock />} />
              <Route path="/performance" element={<Navigate to="/reports?section=employees" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </EmployeeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
