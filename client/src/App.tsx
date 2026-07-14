import { BrowserRouter, Routes, Route } from 'react-router-dom';
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



// Layout route to wrap pages in Header/Footer automatically
const AppLayout = () => {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );
};

import { AuthProvider } from './components/common/AuthProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/api-reference" element={<ApiReference />} />
          <Route path="/community" element={<CommunityForum />} />
          <Route path="/system-status" element={<SystemStatus />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/integrations" element={<Integrations />} />
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              // <ProtectedRoute>
                <Dashboard />
              // </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              // <ProtectedRoute>
                <EditorRoom />
              // </ProtectedRoute>
            } 
          />
        </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
