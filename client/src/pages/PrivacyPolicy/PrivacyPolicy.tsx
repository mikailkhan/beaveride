import React from 'react';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-8">Privacy Policy</h1>
        <p className="text-sm text-on-surface-variant mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-on-surface-variant">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. How We Use Information</h2>
            <p>We may use the information we collect about you to provide, maintain, and improve our services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Drivers, develop safety features, authenticate users, and send product updates and administrative messages.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Sharing of Information</h2>
            <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
