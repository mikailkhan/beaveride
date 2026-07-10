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

const steps = [
  {
    number: "01",
    title: "Create Your Workspace",
    description: "Sign up in seconds and launch your personal coding workspace directly in your browser. No complicated setup, no downloads—just open BeaverIDE and start building immediately.",
    image: step1,
    themeColor: "primary",
  },
  {
    number: "02",
    title: "Open a Coding Room",
    description: "Start a fresh workspace or jump into an existing project with a single click. Every room is your team's shared development space, ready for instant collaboration.",
    image: step2,
    themeColor: "secondary",
  },
  {
    number: "03",
    title: "Invite Your Team",
    description: "Share a simple invite link and bring everyone into the same workspace. Whether you're pair programming or working with a full team, everyone joins in just moments.",
    image: step3,
    themeColor: "tertiary",
  },
  {
    number: "04",
    title: "Code Together Live",
    description: "See every edit appear instantly as your teammates type. Collaborate naturally, brainstorm ideas, and solve problems together without refreshing or merging changes.",
    image: step4,
    themeColor: "primary",
  },
  {
    number: "05",
    title: "Run in the Cloud",
    description: "Execute your code instantly without configuring local environments. Click Run, and BeaverIDE handles the heavy lifting so you can stay focused on solving problems.",
    image: step5,
    themeColor: "secondary",
  },
  {
    number: "06",
    title: "Watch Live Output",
    description: "See your application's results appear instantly in the shared terminal. Everyone stays on the same page with synchronized logs, output, and debugging information.",
    image: step6,
    themeColor: "tertiary",
  },
  {
    number: "07",
    title: "Ship Faster Together",
    description: "From the first idea to the final build, BeaverIDE keeps your team moving as one. Spend less time managing tools and more time creating software that matters.",
    image: step7,
    themeColor: "primary",
  },
];

export const Home = () => {
  const [currentText, setCurrentText] = useState('');
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const words = ["coding", "collaboration", "creation"];
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false);
  };
  
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
      <section className="py-2xl px-gutter bg-surface overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container mb-4 font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              Workflow
            </span>
            <h2 className="font-display-lg text-headline-lg md:text-display-lg text-on-background mb-4">
              Every Step to Online Coding
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              From creating your workspace to shipping live applications, experience the ultimate collaborative developer environment.
            </p>
          </div>

          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-xl items-start relative">
            {/* Stepper Side (Left) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const activeColorClass = 
                  step.themeColor === 'primary' 
                    ? 'border-primary-container text-primary-container animate-in fade-in' 
                    : step.themeColor === 'secondary' 
                      ? 'border-secondary text-secondary animate-in fade-in' 
                      : 'border-tertiary text-tertiary animate-in fade-in';
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleStepClick(idx)}
                    className={`group text-left p-6 rounded-xl border-l-4 transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? `${activeColorClass} bg-surface-container-low shadow-sm` 
                        : 'border-transparent text-on-surface-variant hover:bg-surface-container-lowest/50 hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded transition-colors ${
                        isActive 
                          ? step.themeColor === 'primary' ? 'bg-primary-container/10 text-primary-container' : step.themeColor === 'secondary' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                          : 'bg-surface-container text-on-surface-variant group-hover:bg-surface-container-high'
                      }`}>
                        {step.number}
                      </span>
                      <h4 className={`font-headline-md text-lg font-bold transition-colors ${
                        isActive ? 'text-on-background' : 'text-on-surface-variant group-hover:text-on-background'
                      }`}>
                        {step.title}
                      </h4>
                    </div>

                    {/* Expandable description */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isActive ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
                      <div className="overflow-hidden">
                        <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                          {step.description}
                        </p>
                        
                        {/* Progress line */}
                        {isAutoPlaying && isActive && (
                          <div className="w-full h-[3px] bg-surface-container-high rounded-full overflow-hidden mt-4">
                            <div className={`h-full animate-step-progress rounded-full ${
                              step.themeColor === 'primary' 
                                ? 'bg-primary-container' 
                                : step.themeColor === 'secondary' 
                                  ? 'bg-secondary' 
                                  : 'bg-tertiary'
                            }`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Visualizer Side (Right) */}
            <div className="lg:col-span-7 sticky top-24 select-none">
              {/* Dynamic Accent Glow */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div 
                  className={`w-[450px] h-[450px] rounded-full blur-[100px] opacity-25 transition-all duration-1000 ${
                    steps[activeStep].themeColor === 'primary' 
                      ? 'bg-primary-container' 
                      : steps[activeStep].themeColor === 'secondary' 
                        ? 'bg-secondary' 
                        : 'bg-tertiary'
                  }`}
                />
              </div>

              {/* Mockup macOS Window */}
              <div className="relative bg-surface-container-lowest/90 backdrop-blur-md rounded-xl border border-outline-variant/30 shadow-[0_25px_60px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Browser Header Bar */}
                <div className="h-12 border-b border-outline-variant/20 flex items-center px-4 gap-4 bg-surface-container/30">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-error/70"></span>
                    <span className="w-3 h-3 rounded-full bg-secondary-container/80"></span>
                    <span className="w-3 h-3 rounded-full bg-primary-container/80"></span>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-1 text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-[16px] cursor-not-allowed">arrow_back</span>
                    <span className="material-symbols-outlined text-[16px] cursor-not-allowed">arrow_forward</span>
                  </div>
                  {/* Address Input */}
                  <div className="flex-1 max-w-md mx-auto bg-surface-container/60 border border-outline-variant/10 rounded-md py-1 px-4 text-xs text-on-surface-variant/60 flex items-center justify-between select-none font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[12px] text-secondary">lock</span>
                      beaveride.com/workspace
                    </span>
                    <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-on-surface-variant">refresh</span>
                  </div>
                  <div className="w-16"></div> {/* Spacer */}
                </div>

                {/* Images Viewport */}
                <div className="relative aspect-[16/10] bg-surface-container/10 overflow-hidden">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-all duration-700 ease-out flex items-center justify-center p-6 bg-surface-container-lowest ${
                        activeStep === idx
                          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                      }`}
                    >
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-contain rounded-lg drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout (below lg) - Accordion style */}
          <div className="lg:hidden flex flex-col gap-4">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              const activeColorClass = 
                step.themeColor === 'primary' 
                  ? 'border-primary-container text-primary-container' 
                  : step.themeColor === 'secondary' 
                    ? 'border-secondary text-secondary' 
                    : 'border-tertiary text-tertiary';

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border-l-4 transition-all duration-300 ${
                    isActive 
                      ? `${activeColorClass} bg-surface-container-low shadow-sm` 
                      : 'border-transparent bg-surface-container-lowest/50 text-on-surface-variant'
                  }`}
                >
                  {/* Header Button */}
                  <button
                    onClick={() => handleStepClick(idx)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                        isActive 
                          ? step.themeColor === 'primary' ? 'bg-primary-container/10 text-primary-container' : step.themeColor === 'secondary' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {step.number}
                      </span>
                      <h4 className="font-headline-md text-base md:text-lg font-bold text-on-background">
                        {step.title}
                      </h4>
                    </div>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${
                      isActive ? 'rotate-180 text-on-background' : 'text-on-surface-variant/60'
                    }`}>
                      expand_more
                    </span>
                  </button>

                  {/* Body Content */}
                  <div className={`grid transition-all duration-300 ease-in-out ${
                    isActive ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}>
                    <div className="overflow-hidden flex flex-col gap-4">
                      <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                        {step.description}
                      </p>

                      {/* Image Preview inline on mobile */}
                      <div className="relative bg-surface-container-lowest/60 rounded-lg p-3 border border-outline-variant/20 shadow-inner">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-auto aspect-video object-contain rounded-md"
                        />
                      </div>

                      {/* Progress Line */}
                      {isAutoPlaying && isActive && (
                        <div className="w-full h-[3px] bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full animate-step-progress rounded-full ${
                            step.themeColor === 'primary' 
                              ? 'bg-primary-container' 
                              : step.themeColor === 'secondary' 
                                ? 'bg-secondary' 
                                : 'bg-tertiary'
                          }`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
