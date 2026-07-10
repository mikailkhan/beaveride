import React from 'react';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-8">Terms of Service</h1>
        <p className="text-sm text-on-surface-variant mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-on-surface-variant">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Terms</h2>
            <p>By accessing the website at BeaverIDE, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on BeaverIDE's website for personal, non-commercial transitory viewing only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Disclaimer</h2>
            <p>The materials on BeaverIDE's website are provided on an 'as is' basis. BeaverIDE makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
