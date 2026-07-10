import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SystemStatus = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-6">System Status</h1>
        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full font-medium">
          <CheckCircle2 className="w-5 h-5" />
          All Systems Operational
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex justify-between items-center">
          <span className="text-lg text-on-surface font-medium">Web Application</span>
          <span className="text-green-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Operational
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex justify-between items-center">
          <span className="text-lg text-on-surface font-medium">Cloud VMs</span>
          <span className="text-green-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Operational
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex justify-between items-center">
          <span className="text-lg text-on-surface font-medium">Database Services</span>
          <span className="text-green-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Operational
          </span>
        </div>
      </div>
    </div>
  );
};
