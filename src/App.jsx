import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import CreateBoardModal from './components/board/CreateBoardModal';
import SearchPalette from './components/common/SearchPalette';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth pages (no lazy — pequeñas y críticas para el primer render)
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Lazy-loaded pages (solo se cargan si el usuario está autenticado)
const HomePage           = lazy(() => import('./pages/HomePage'));
const BoardPage          = lazy(() => import('./pages/BoardPage'));
const BoardsListPage     = lazy(() => import('./pages/BoardsListPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const InboxPage          = lazy(() => import('./pages/InboxPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const PortfolioPage      = lazy(() => import('./pages/PortfolioPage'));
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage'));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Rutas públicas — sin layout */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Rutas protegidas — con layout completo */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/"             element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="/boards"       element={<Suspense fallback={<PageLoader />}><BoardsListPage /></Suspense>} />
          <Route path="/board/:boardId" element={<Suspense fallback={<PageLoader />}><BoardPage /></Suspense>} />
          <Route path="/dashboard"    element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/inbox"        element={<Suspense fallback={<PageLoader />}><InboxPage /></Suspense>} />
          <Route path="/settings"      element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/portfolios"    element={<Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>} />
          <Route path="/portfolio/:id" element={<Suspense fallback={<PageLoader />}><PortfolioDetailPage /></Suspense>} />
        </Route>
      </Routes>

      {/* Modales globales (solo activos en rutas protegidas) */}
      <CreateBoardModal />
      <SearchPalette />
    </>
  );
}
