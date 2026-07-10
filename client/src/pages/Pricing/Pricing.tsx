

export const Pricing = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-6">Pricing</h1>
        <p className="text-lg text-on-surface-variant max-w-3xl mx-auto">
          Simple, transparent pricing for teams of all sizes.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant/30 flex flex-col">
          <h3 className="text-2xl font-bold mb-2 text-on-surface">Hobby</h3>
          <p className="text-4xl font-bold text-primary mb-6">$0<span className="text-lg text-on-surface-variant font-normal">/mo</span></p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="text-on-surface-variant flex items-center gap-2">✓ 3 Projects</li>
            <li className="text-on-surface-variant flex items-center gap-2">✓ Basic Cloud Terminal</li>
            <li className="text-on-surface-variant flex items-center gap-2">✓ Community Support</li>
          </ul>
          <button className="w-full py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary/10 transition-colors">Get Started</button>
        </div>
        <div className="p-8 rounded-3xl bg-primary-container text-on-primary-container border border-primary/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 rounded-bl-xl font-bold text-sm">Most Popular</div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <p className="text-4xl font-bold mb-6">$19<span className="text-lg opacity-80 font-normal">/mo</span></p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-2">✓ Unlimited Projects</li>
            <li className="flex items-center gap-2">✓ Powerful Cloud VMs</li>
            <li className="flex items-center gap-2">✓ Priority Support</li>
            <li className="flex items-center gap-2">✓ Custom Domains</li>
          </ul>
          <button className="w-full py-3 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-md">Upgrade to Pro</button>
        </div>
      </div>
    </div>
  );
};
