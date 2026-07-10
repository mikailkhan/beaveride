import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';

export const PageContainer = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/room/');

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 my-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};
