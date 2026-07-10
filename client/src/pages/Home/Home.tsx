import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BeaverMascotLogo from "../../assets/logos/beaveride-mascot-logo.png";
import step1 from "../../assets/home-images/image1.png";
import step2 from "../../assets/home-images/image2.png";
import step3 from "../../assets/home-images/image3.png";
import step4 from "../../assets/home-images/image4.png";
import step5 from "../../assets/home-images/image5.png";
import step6 from "../../assets/home-images/image6.png";
import step7 from "../../assets/home-images/image7.png";

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
      {/* Hero Section */}
      <section className="relative px-gutter flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <h1 className="font-display-lg text-display-lg mb-6 text-on-background">
            The new way of <br /> <span className="text-primary-container typing-cursor" ref={typewriterRef}>{currentText}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 min-w-2xl mx-auto">
            The browser-based collaborative IDE for 2026. Code together, run together, build the future together.
          </p>
          <div className="flex justify-center mb-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            <img alt="BeaverIDE Hero Mascot" className="h-40 md:h-48 object-contain" src={BeaverMascotLogo} />
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
                <img alt="Create Your Workspace" className="w-full h-full object-contain rounded-xl" src={step1} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">1. Create Your Workspace</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Sign up in seconds and launch your personal coding workspace directly in your browser. No complicated setup, no downloads—just open BeaverIDE and start building immediately.</p>
              </div>
            </div>
            {/* Step 2: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Open a Coding Room" className="w-full h-full object-contain rounded-xl" src={step2} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">2. Open a Coding Room</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Start a fresh workspace or jump into an existing project with a single click. Every room is your team's shared development space, ready for instant collaboration.</p>
              </div>
            </div>
            {/* Step 3: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Invite Your Team" className="w-full h-full object-contain rounded-xl" src={step3} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">3. Invite Your Team</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Share a simple invite link and bring everyone into the same workspace. Whether you're pair programming or working with a full team, everyone joins in just moments.</p>
              </div>
            </div>
            {/* Step 4: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Code Together Live" className="w-full h-full object-contain rounded-xl" src={step4} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">4. Code Together Live</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">See every edit appear instantly as your teammates type. Collaborate naturally, brainstorm ideas, and solve problems together without refreshing or merging changes.</p>
              </div>
            </div>
            {/* Step 5: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Run in the Cloud" className="w-full h-full object-contain rounded-xl" src={step5} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">5. Run in the Cloud</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Execute your code instantly without configuring local environments. Click Run, and BeaverIDE handles the heavy lifting so you can stay focused on solving problems.</p>
              </div>
            </div>
            {/* Step 6: Image Right / Text Left */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Watch Live Output" className="w-full h-full object-contain rounded-xl" src={step6} />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md text-primary-container mb-4">6. Watch Live Output</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant">See your application's results appear instantly in the shared terminal. Everyone stays on the same page with synchronized logs, output, and debugging information.</p>
              </div>
            </div>
            {/* Step 7: Image Left / Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 aspect-video rounded-xl flex items-center justify-center text-on-surface-variant/30">
                <img alt="Ship Faster Together" className="w-full h-full object-contain rounded-xl" src={step7} />
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
            <img alt="BeaverIDE Mascot" className="w-64 h-auto object-contain drop-shadow-2xl" src={BeaverMascotLogo} />
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
      
    </div>
  );
};
