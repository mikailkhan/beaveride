import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';

export const Home = () => {
  const [currentText, setCurrentText] = useState('');
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const words = ["coding", "collaboration", "creation"];
  
  useEffect(() => {
    let i = 0;
    let j = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentWord = words[i];
      
      if (isDeleting) {
        setCurrentText(currentWord.substring(0, j - 1));
        j--;
      } else {
        setCurrentText(currentWord.substring(0, j + 1));
        j++;
      }

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && j === currentWord.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && j === 0) {
        isDeleting = false;
        i = (i + 1) % words.length;
        typeSpeed = 500;
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    timeoutId = setTimeout(type, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
    const target = e.currentTarget;
    if (target.open) {
      document.querySelectorAll('details').forEach((detail) => {
        if (detail !== target) {
          detail.removeAttribute('open');
        }
      });
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen antialiased flex flex-col selection:bg-primary-container/30">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm transition-transform duration-200 py-3">
        <div className="flex items-center justify-center w-[140px] h-[54px]">
          <img alt="BeaverIDE Logo" className="h-full w-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCimabqgXEvB0x3jLAIBGv2OC8KLhke9tUQaB74bCEWzPLJwaq8msIYNgsKimgWGZ_i_Q8dV0ojEIjOls4MsIMVz5iHDtBY3STP65iYOmuQdEdSIXZWJb_qRtg4eJ9--refIOtNyCb7Gt696l76uc9uz2hUDtIQ2ZXHf7060Kl46KyvEdDFhxUIxS810ewQBVlvBasNmMpHrK14rFabDxd-l_WEmj1LXq5AsPb9fWDemeeEHLdsgnKqb-xoQ7CAz9hghhZc79LQAq0" />
        </div>
        <div className="hidden md:flex items-center gap-xl">
          <a className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors px-3 py-2 rounded-md font-label-md text-label-md cursor-pointer">Features</a>
          <a className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors px-3 py-2 rounded-md font-label-md text-label-md cursor-pointer">Pricing</a>
          <a className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors px-3 py-2 rounded-md font-label-md text-label-md cursor-pointer">Docs</a>
          <Link to="/about" className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors px-3 py-2 rounded-md font-label-md text-label-md cursor-pointer">About</Link>
        </div>
        <div className="flex items-center gap-md">
          <Link to="/login" className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-primary px-4 py-2 transition-colors">Log In</Link>
          <Link to="/register" className="font-label-md text-label-md bg-primary-container text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] px-4 py-2 rounded-lg hover:bg-surface-tint transition-all active:scale-95">Start Coding</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-gutter flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <h1 className="font-display-lg text-display-lg mb-6 text-on-background">
            The new way of <br /> <span className="text-primary-container typing-cursor" ref={typewriterRef}>{currentText}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 min-w-2xl mx-auto">
            The browser-based collaborative IDE for 2026. Code together, run together, build the future together.
          </p>
          <div className="flex justify-center mb-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            <img alt="BeaverIDE Hero Mascot" className="h-40 md:h-48 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_UZB22zKA8R8rAX7_lI6mVl864pG8__8cz_zEo-jj_s_ImodkpQVaachOeu33Xjfe9k0t05q3sy5xEV8ryfCDy5g71t6RrZtHqp941nsBwmfSPV_-B8HEZAXn0rmgpPqTxxwFbSih6h8PhjXq2kXk6i_G2yiz5LBzYvJ3rgAADiEuLEZigQnP-E2pt0MEH5Vi6q-8acCn1DBli2uCJlAme3dAF69eit6xgx-oWEl6Elm2m2TUVkqXsPmoN_7wqMeZbjHETGL8Z1E" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
            <Link to="/register" className="w-full sm:w-auto font-label-md text-label-md bg-primary-container text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] px-8 py-3 rounded-lg hover:bg-surface-tint transition-all active:scale-95 text-lg">Start Coding Together</Link>
            <button className="w-full sm:w-auto font-label-md text-label-md border border-outline-variant bg-surface-container-lowest text-on-surface px-8 py-3 rounded-lg hover:bg-surface-container-low transition-all active:scale-95 text-lg flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>play_circle</span> Watch Demo
            </button>
          </div>
        </div>

        {/* IDE Mockup */}
        <div className="mt-16 w-full max-w-5xl relative z-10 perspective-1000">
          <div className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-xl border border-outline-variant/30 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden transform rotate-x-2 hover:rotate-x-0 transition-transform duration-700">
            {/* Browser Bar */}
            <div className="h-10 border-b border-outline-variant/20 flex items-center px-4 gap-2 bg-surface-container/50">
              <div className="w-3 h-3 rounded-full bg-error-container border border-error/20"></div>
              <div className="w-3 h-3 rounded-full bg-secondary-container border border-secondary/20"></div>
              <div className="w-3 h-3 rounded-full bg-primary-fixed border border-primary/20"></div>
            </div>
            {/* Editor Canvas */}
            <div className="flex h-[400px]">
              {/* Sidebar Mock */}
              <div className="w-16 border-r border-outline-variant/20 flex flex-col items-center py-4 gap-6 bg-surface-container-lowest">
                <span className="material-symbols-outlined text-on-surface-variant">folder</span>
                <span className="material-symbols-outlined text-primary">search</span>
                <span className="material-symbols-outlined text-on-surface-variant">account_tree</span>
              </div>
              {/* Code Area */}
              <div className="flex-1 p-6 font-code-md text-code-md relative bg-surface-container-lowest overflow-hidden">
                <div className="text-on-surface-variant/50 mb-2">// main.ts</div>
                <div className="text-tertiary">import <span className="text-on-surface">{"{"}</span> serve <span className="text-on-surface">{"}"}</span> from <span className="text-primary">"beaver-cloud"</span>;</div>
                <br />
                <div className="text-tertiary">const <span className="text-on-surface">app = serve({"{"}</span></div>
                <div className="pl-4 text-on-surface">port: <span className="text-primary-container">8080</span>,</div>
                <div className="pl-4 text-on-surface">fetch(req) {"{"}</div>
                <div className="pl-8 text-on-surface">return new <span className="text-tertiary">Response</span>(<span className="text-primary">"Hello World!"</span>);</div>
                <div className="pl-4 text-on-surface relative">
                  {"}"}
                  {/* Collaborative Cursor 1 */}
                  <div className="absolute left-10 top-0 cursor-float flex flex-col z-20 pointer-events-none">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: '"FILL" 1', fontSize: "16px", transform: "rotate(-45deg)", marginLeft: "-4px" }}>navigation</span>
                    <div className="bg-primary-container/10 text-primary-container border border-primary-container/20 px-2 py-0.5 rounded text-xs ml-2 mt-1">Beaver</div>
                  </div>
                </div>
                <div className="text-on-surface">{"}"});</div>
                {/* Collaborative Cursor 2 */}
                <div className="absolute left-1/2 top-1/3 cursor-float flex flex-col z-20 pointer-events-none" style={{ animationDelay: "-3s" }}>
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: '"FILL" 1', fontSize: "16px", transform: "rotate(-45deg)", marginLeft: "-4px" }}>navigation</span>
                  <div className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded text-xs ml-2 mt-1">Oak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-2xl px-gutter bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display-lg text-headline-lg md:text-display-lg text-center mb-16 text-on-background">Every Step to Online Coding</h2>
          <div className="flex flex-col gap-2xl">
            {/* Step 1: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Create Your Workspace" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVeR3x_2kTghBPGFRf6EYfSSXekxzSQWBX4FBjyAiC72GM3ThiiRdlbS26YxkLwgD7rA7MRTbZhoreu9PJBJxrZWkkE1L7YYkrxtirY4Y6ZCbiNJ4f1IBxjTcMPF7b37Hk4uXxJTqrRc-054atUGA4QlldeEun-hjFLCxCSlNy39Y1ZmlDN_CUfqyfM7Fwzfy0squsqKo90i5Cyho-dbOhjQ1GBRUiBWQjAafcgM1RPPtWa4FTdDrJUD91JRKEDK7MmALogtRKMH0" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">1. Create Your Workspace</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Sign up in seconds and launch your personal coding workspace directly in your browser. No complicated setup, no downloads—just open BeaverIDE and start building immediately.</p>
              </div>
            </div>
            {/* Step 2: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Open a Coding Room" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvCntDCeuHJXUukws4B7mnJi2V5Aq9vcn7L121pdbhsiJ7MnbvLs1Nbl5YAdsaJsPpIKqvObN_Cpl9hUE67psf8HhL5r4C3y7minWEJgMRc_LEjpnKIH8Kvo4G9se2eDcCYhL1mYTcUbJHXQtM-ZhvXSOYJoqEe_zl8JCrWUdQNkAuiKaqz14PfQO08MObXLsqmRC_Y7ry4ZI-iuwZOleLYPQ00CiLjR9Bklm4iDFxOmbPn66wQb25nhaKzDr4mlKgfKHaAn8h4V0" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">2. Open a Coding Room</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Start a fresh workspace or jump into an existing project with a single click. Every room is your team's shared development space, ready for instant collaboration.</p>
              </div>
            </div>
            {/* Step 3: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Invite Your Team" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUpWeVop6MBMDoeM_jHayMaHeTiDTzb9xpf2zqIhGexKmokChkvVqcKvmZ7pkL3OjddYUT75e0x8zbfG0QWl8FrwirOQRKgOBz19iTKAfNEZDksk74aHp1FlZuKiJd_pLyPd-4T5NnOjJw9faQEHFhQXi0ySz8rwTb6d1fihQt463LBscLny7vLdKVM5q4hEFsR8tYpOyWoZnuNogLlkZvi7N_2Rlhngdwo4k-t187ZAYHAsFH74InkG3Y6ZPFU7YZkA-a6Xl8ozA" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">3. Invite Your Team</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Share a simple invite link and bring everyone into the same workspace. Whether you're pair programming or working with a full team, everyone joins in just moments.</p>
              </div>
            </div>
            {/* Step 4: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Code Together Live" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqk6DFF8uFeJ5lAkdABGCIigqpm1-s7_cNzegUY4kW97mHL8piVusEkkG73aQIS6D5nckvVTCTj9mrp1zdsu8U-gWkV1_VtdpvldoNWafu8P24uAFsiyVJQEgt2KOUSfkqQfYKUN9GifQyQeGCIBZFW_SoknhW-KoicJRvc647x3fWDP9xUUGWaI3_Q0hcdy85Y68Z0YNU3nKbqc6GvDtAQ8uDLhHcmHsCP14tjz1WkE5cY9b7fiZqQGq19x5cI1I0cqFnKwCCXQc" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">4. Code Together Live</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">See every edit appear instantly as your teammates type. Collaborate naturally, brainstorm ideas, and solve problems together without refreshing or merging changes.</p>
              </div>
            </div>
            {/* Step 5: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Run in the Cloud" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrzQyppZZU24wapWZ7oeeYX-xU97LgyZHxZQT4TOYyjK5KLWSMNqFtheOIveCfGOwSFRjer31eR-dvQmbq1W8cRXCTdNwShy30WkH4aj80sY2u3CwBi51jvH_qy2nEyOtcjiKqy0rzdNFdA1xcuS6WyU3qos7Dn4HReb6di3CaSfOci0y1mAmaJzPPnHSawVmCubPiIpCSthhbuiHRG1ed53Ty1hXAk5owuZL4MkMGW-KvQOingBLt5zRfngDYzp6N0IvEgKA0DXw" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">5. Run in the Cloud</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Execute your code instantly without configuring local environments. Click Run, and BeaverIDE handles the heavy lifting so you can stay focused on solving problems.</p>
              </div>
            </div>
            {/* Step 6: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Watch Live Output" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACeAiv18O5C4IUz0kh4aXGmsIpAVktdri2rkE6kYLW3YNAhi3yv-4HtHUy9Yd4ZwMk--Cdd7QBpTX76CQ2Ftwi7zBg1QNiZZ5sA67yEKx-szchv_VlpVnThAPUlrw8IImb63YzAz20XBxb7gZ3FzDo1jGF3kUvHGqr87Hj96xtXuw3VCah3y49-0pUD2pGmAl3gOHaQZwIjOgEb1L-trAV61Ds3B4jGtDJphZglGh5JvW5g7xEufE2KdZ_cMPgQ6AWfhOsGAZ60Wo" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">6. Watch Live Output</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">See your application's results appear instantly in the shared terminal. Everyone stays on the same page with synchronized logs, output, and debugging information.</p>
              </div>
            </div>
            {/* Step 7: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Ship Faster Together" className="w-full h-full object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9Aotu1S9CYNLcqcJ6i82ejvRjJk0FCtlomxlCeNqluBZHlYbLhLN084avpPUSTShclELeJL29tXQidZ7L73Lby_t38hyDub3ZKHRIGfi-_jAe82E1C-WBi144LH6PxOt-oTiBmJlFoc6Vw7ljUWdCmfmX_II4EIA6XeONOhsZ-FG_U-epqfpUL66UgegDOTibXuHeddgzXxcEFiT3OgCHmBPZPUFvRR2BMksLeZ6N0D8xWkR7FRfdKVBRq1DpqnD-qkTVsTObT4s" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">7. Ship Faster Together</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">From the first idea to the final build, BeaverIDE keeps your team moving as one. Spend less time managing tools and more time creating software that matters.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready CTA */}
      <section className="py-2xl px-gutter bg-surface">
        <div className="max-w-5xl mx-auto bg-tertiary rounded-2xl p-8 md:p-16 shadow-xl flex flex-col md:flex-row items-center text-center md:text-left gap-12">
          <div className="md:w-2/3">
            <h2 className="font-display-lg text-headline-lg md:text-display-lg text-on-tertiary mb-6">Ready to build the future?</h2>
            <p className="font-body-lg text-body-lg text-on-tertiary/90 mb-10 min-w-2xl">Join thousands of developers and start coding together in seconds. Experience the most fluid collaborative environment ever built.</p>
            <Link to="/register" className="inline-block font-label-md text-label-md bg-surface-container-lowest text-tertiary px-8 py-4 rounded-lg hover:bg-surface-container-low transition-all active:scale-95 text-lg font-bold">Start Coding Now</Link>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <img alt="BeaverIDE Mascot" className="w-64 h-auto object-contain drop-shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrhGaTSjVGYaRr4h--xulaslyu6j4sFZCezCICxO_PmhgOn4HxaZfcx6HrW-QvEBTF_23nkd8-tqWlO8lUtNp_nRL0KJv-wBc3cPPoDRxEWeL6aQwALVjp3w7EEPXTkek_2Cgg9Q-VAkyNpie9TyoyPMW9wXruaYaEWU6kUR8XXl9OcMT7FTXugsWkebDOgOaRc5QQ2XlldKSZghG48Lpjefv-01PTunUXuDHownKDkwAZyPFpHYjm2c0Z5qatbTwapcR0iWHkKWg" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-2xl px-gutter bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display-lg text-headline-lg md:text-display-lg text-center mb-16 text-on-background">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4">
            <details className="group border border-outline-variant/20 rounded-xl bg-surface-container-lowest overflow-hidden" onToggle={handleToggle}>
              <summary className="flex justify-between items-center font-headline-md text-lg text-on-background p-6 cursor-pointer">
                <span>Is it free for open source?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <p className="font-body-md text-on-surface-variant">Yes! BeaverIDE is committed to the open-source community. Public repositories are always free to host and collaborate on.</p>
              </div>
            </details>
            <details className="group border border-outline-variant/20 rounded-xl bg-surface-container-lowest overflow-hidden" onToggle={handleToggle}>
              <summary className="flex justify-between items-center font-headline-md text-lg text-on-background p-6 cursor-pointer">
                <span>How secure is my code?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <p className="font-body-md text-on-surface-variant">We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your code is isolated in secure, ephemeral containers.</p>
              </div>
            </details>
            <details className="group border border-outline-variant/20 rounded-xl bg-surface-container-lowest overflow-hidden" onToggle={handleToggle}>
              <summary className="flex justify-between items-center font-headline-md text-lg text-on-background p-6 cursor-pointer">
                <span>Does it support VS Code extensions?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <p className="font-body-md text-on-surface-variant">BeaverIDE is built on a custom engine that is fully compatible with the VS Code extension ecosystem. You can import your favorite themes and tools easily.</p>
              </div>
            </details>
            <details className="group border border-outline-variant/20 rounded-xl bg-surface-container-lowest overflow-hidden" onToggle={handleToggle}>
              <summary className="flex justify-between items-center font-headline-md text-lg text-on-background p-6 cursor-pointer">
                <span>What languages are supported?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <p className="font-body-md text-on-surface-variant">We provide first-class support for JavaScript, TypeScript, Python, Rust, Go, and Java, with intelligent LSP support for over 50 other languages.</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
