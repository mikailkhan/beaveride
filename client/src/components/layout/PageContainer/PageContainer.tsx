import type { ReactNode } from 'react';
import { Header } from '../Header';
import { Footer } from '../Footer';

export const PageContainer = ({ children }: { children: ReactNode }) => {
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
