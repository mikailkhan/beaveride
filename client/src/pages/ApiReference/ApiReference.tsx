import React from 'react';
import { Blocks } from 'lucide-react';

export const ApiReference = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="bg-primary/10 w-20 rounded-full flex items-center justify-center mx-auto ">
          <Blocks className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-4">API Reference</h1>
        <p className="text-xl text-primary font-medium mb-4">Coming Soon</p>
        <p className="text-on-surface-variant max-w-3xl mx-auto">
          We are working hard to document our public API. Soon you will be able to integrate BeaverIDE directly into your workflows.
        </p>
      </div>
    </div>
  );
};
