import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-gutter text-center">
          <h1 className="font-display-lg text-display-lg mb-lg max-w-3xl mx-auto text-on-background">
            Why we built the future of engineering.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mx-auto mb-xl leading-relaxed">
            We believe that software development shouldn't be a solitary struggle. It should be a collaborative, highly efficient, and even joyous process. That's why we created BeaverIDE—to break down barriers and bring teams together in a workspace designed for speed and connection.
          </p>
        </section>

        {/* Mission & Vision (Bento Grid) */}
        <section className="max-w-7xl mx-auto px-gutter py-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div className="col-span-1 md:col-span-2 glass-panel soft-shadow rounded-xl p-xl flex flex-col justify-center">
              <span className="material-symbols-outlined text-primary text-4xl mb-md">groups</span>
              <h2 className="font-headline-lg text-headline-lg mb-sm text-on-background">Focused on Teamwork</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Real-time collaboration isn't a feature; it's the foundation. We built BeaverIDE so you can see your teammates' cursors, share terminal sessions, and debug together without ever leaving your editor.
              </p>
            </div>
            
            <div className="col-span-1 glass-panel soft-shadow rounded-xl p-xl flex flex-col justify-center bg-gradient-to-br from-surface to-tertiary-fixed/20">
              <span className="material-symbols-outlined text-tertiary text-4xl mb-md">bolt</span>
              <h2 className="font-headline-md text-headline-md mb-sm text-on-background">Engineered for Speed</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Zero latency typing, instant workspace loading, and intelligent caching ensure you stay in the flow.
              </p>
            </div>
            
            <div className="col-span-1 glass-panel soft-shadow rounded-xl p-xl bg-surface-container-low">
              <span className="material-symbols-outlined text-secondary text-4xl mb-md">code_blocks</span>
              <h2 className="font-headline-md text-headline-md mb-sm text-on-background">Breaking Barriers</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                We are democratizing high-performance environments so anyone can code complex apps easily.
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-2 glass-panel soft-shadow rounded-xl p-xl overflow-hidden relative min-h-[300px] flex items-end">
              <div 
                className="absolute inset-0 bg-cover bg-center w-full h-full opacity-80" 
                data-alt="A clean, minimalist illustration of an collaboration..."
                style={{ 
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAp6ON8qzuOHX9mERhLkUSlCvX5FJ2qjeQbdtTXwRLY37o6IpTh8l1d2b94rmdhX7UFyvJjow2wnDUPx2uGOcNlB5hCp5FBTHhpHg9KdibVJhcmF641jQ69NlOh1bp7UoqCYQhD_HYHF3LoCzrxEn7bDw1BysOs3FC2giKXEtCbdq10dhVwMvoRtfBMyPQOAS0lWG2fPpEOajEVV1wr22Ohw3aMCXyQ-zHPXnAhQ61N6zCb_4YDbH5y67oVbgL-yf2LcK4sv5WNZj0')" 
                }}
              />
              <div className="relative z-10 bg-white/60 backdrop-blur-md p-md rounded-lg inline-block">
                <h3 className="font-headline-md text-headline-md text-on-background">The Beaver Way</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Product Timeline */}
        <section className="max-w-3xl mx-auto px-gutter py-2xl">
          <h2 className="font-headline-lg text-headline-lg mb-xl text-center text-on-background">Our Journey</h2>
          <div className="relative border-l-2 border-outline-variant/30 pl-lg ml-md space-y-xl">
            {/* Timeline Item 1 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-surface"></div>
              <h3 className="font-headline-md text-headline-md mb-xs text-on-background">The Idea</h3>
              <span className="font-label-md text-label-md text-primary font-bold block mb-sm">Q1 2023</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Frustrated by slow, disconnected editors, our founders sketched out the first concepts for a truly multiplayer IDE.</p>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full bg-surface-variant border-2 border-primary ring-4 ring-surface"></div>
              <h3 className="font-headline-md text-headline-md mb-xs text-on-background">Building the Engine</h3>
              <span className="font-label-md text-label-md text-primary font-bold block mb-sm">Q3 2023</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Developing the core high-performance text buffer and real-time syncing architecture.</p>
            </div>
            
            {/* Timeline Item 3 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full bg-surface-variant border-2 border-primary ring-4 ring-surface"></div>
              <h3 className="font-headline-md text-headline-md mb-xs text-on-background">Public Beta</h3>
              <span className="font-label-md text-label-md text-primary font-bold block mb-sm">Q1 2024</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Thousands of developers joined us to test the limits of collaborative coding in the browser.</p>
            </div>
            
            {/* Timeline Item 4 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full bg-primary-container ring-4 ring-surface shadow-[0_0_15px_rgba(246,99,23,0.5)]"></div>
              <h3 className="font-headline-md text-headline-md mb-xs text-on-background">V1 Launch</h3>
              <span className="font-label-md text-label-md text-primary font-bold block mb-sm">Today</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">BeaverIDE is live. The future of engineering is here.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-gutter py-2xl mb-xl text-center">
          <div className="glass-panel soft-shadow rounded-xl p-2xl bg-gradient-to-b from-surface to-surface-container-low border border-outline-variant/30">
            <h2 className="font-display-lg text-display-lg mb-md text-on-background">Join the movement.</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-3xl mx-auto leading-relaxed">Experience the calm, productive workspace designed for the modern developer.</p>
            <Link 
              to="/register" 
              className="inline-block font-headline-md text-headline-md bg-primary-container text-white px-8 py-4 rounded-lg hover:opacity-90 transition-opacity shadow-[inset_0_2px_0_rgba(255,255,255,0.2),_0_4px_14px_rgba(246,99,23,0.3)]"
            >
              Start Coding Today
            </Link>
          </div>
        </section>
      </div>
  );
};
