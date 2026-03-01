import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import CreateBoardModal from './components/board/CreateBoardModal';
import SearchPalette from './components/common/SearchPalette';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const BoardsListPage = lazy(() => import('./pages/BoardsListPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

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
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="/boards" element={<Suspense fallback={<PageLoader />}><BoardsListPage /></Suspense>} />
          <Route path="/board/:boardId" element={<Suspense fallback={<PageLoader />}><BoardPage /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/inbox" element={<Suspense fallback={<PageLoader />}><InboxPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        </Route>
      </Routes>

      {/* Global modals */}
      <CreateBoardModal />
      <SearchPalette />
    </>
  );
}
