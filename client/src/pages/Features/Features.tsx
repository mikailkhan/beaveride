import React from 'react';

export const Features = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-6">Features</h1>
        <p className="text-lg text-on-surface-variant max-w-3xl mx-auto">
          Explore all the powerful features that make BeaverIDE the best collaborative development environment.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30">
          <h3 className="text-xl font-bold mb-3 text-on-surface">Real-time Collaboration</h3>
          <p className="text-on-surface-variant">Code together with your team in real-time, just like Google Docs.</p>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30">
          <h3 className="text-xl font-bold mb-3 text-on-surface">Cloud Terminal</h3>
          <p className="text-on-surface-variant">Access a fully functional terminal right from your browser.</p>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30">
          <h3 className="text-xl font-bold mb-3 text-on-surface">Instant Deployments</h3>
          <p className="text-on-surface-variant">Deploy your applications with a single click.</p>
        </div>
      </div>
    </div>
  );
};
