
import { History } from 'lucide-react';

export const Changelog = () => {
  return (
    <div className="px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-primary/10 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <History className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-4">Changelog</h1>
        <p className="text-xl text-primary font-medium mb-4">Coming Soon</p>
        <p className="text-on-surface-variant max-w-3xl mx-auto">
          A detailed history of all updates, improvements, and fixes will be available here soon.
        </p>
      </div>
    </div>
  );
};
