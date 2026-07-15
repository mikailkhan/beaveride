import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { About } from './pages/About/About';
import { Contact } from './pages/Contact/Contact';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { EditorRoom } from './pages/EditorRoom/EditorRoom';
import { Features } from './pages/Features/Features';
import { Pricing } from './pages/Pricing/Pricing';
import { Docs } from './pages/Docs/Docs';
import { PrivacyPolicy } from './pages/PrivacyPolicy/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService/TermsOfService';
import { ApiReference } from './pages/ApiReference/ApiReference';
import { CommunityForum } from './pages/CommunityForum/CommunityForum';
import { SystemStatus } from './pages/SystemStatus/SystemStatus';
import { Changelog } from './pages/Changelog/Changelog';
import { Integrations } from './pages/Integrations/Integrations';
import { PageContainer } from './components/layout/PageContainer/PageContainer';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './components/common/AuthProvider';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';

// Layout route to wrap pages in Header/Footer automatically
const AppLayout = () => {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        ),
      },
      { path: '/features', element: <Features /> },
      { path: '/pricing', element: <Pricing /> },
      { path: '/docs', element: <Docs /> },
      { path: '/privacy-policy', element: <PrivacyPolicy /> },
      { path: '/terms-of-service', element: <TermsOfService /> },
      { path: '/api-reference', element: <ApiReference /> },
      { path: '/community', element: <CommunityForum /> },
      { path: '/system-status', element: <SystemStatus /> },
      { path: '/changelog', element: <Changelog /> },
      { path: '/integrations', element: <Integrations /> },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/room/:roomId',
        element: (
          <ProtectedRoute>
            <EditorRoom />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
