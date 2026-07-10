import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import beaverideWhiteLogo from '../../assets/logos/beaveride-white-logo.svg';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-white/5 pt-16 pb-8 mt-auto" style={{ backgroundColor: '#141414' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                alt="BeaverIDE Logo" 
                className="h-18 w-auto object-contain" 
                src={beaverideWhiteLogo} 
              />
            </div>
            <p className="font-body-md min-w-sm mb-8 leading-relaxed" style={{ color: '#a8a8a8' }}>
              The collaborative cloud environment engineered for speed. Code together, run together, and build the future together.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#252525', color: '#a8a8a8' }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color='#f66317'; }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color='#a8a8a8'; }}>
                <GithubIcon />
              </a>
              <a href="#" className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#252525', color: '#a8a8a8' }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color='#f66317'; }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color='#a8a8a8'; }}>
                <TwitterIcon />
              </a>
              <a href="#" className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#252525', color: '#a8a8a8' }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color='#f66317'; }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color='#a8a8a8'; }}>
                <LinkedinIcon />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-headline-md text-base font-semibold mb-6" style={{ color: '#f0f0f0' }}>Product</h3>
            <ul className="space-y-4">
              <li><Link to="/features" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Features</Link></li>
              <li><Link to="/pricing" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Pricing</Link></li>
              <li><Link to="/changelog" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Changelog</Link></li>
              <li><Link to="/integrations" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Integrations</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-headline-md text-base font-semibold mb-6" style={{ color: '#f0f0f0' }}>Resources</h3>
            <ul className="space-y-4">
              <li><Link to="/docs" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Documentation</Link></li>
              <li><Link to="/api-reference" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>API Reference</Link></li>
              <li><Link to="/community" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Community Forum</Link></li>
              <li><Link to="/system-status" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>System Status</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-headline-md text-base font-semibold mb-6" style={{ color: '#f0f0f0' }}>Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="font-body-md text-sm transition-colors hover:text-primary-container" style={{ color: '#a8a8a8' }}>About Us</Link></li>
              <li><Link to="/contact" className="font-body-md text-sm transition-colors hover:text-primary-container" style={{ color: '#a8a8a8' }}>Contact Support</Link></li>
              <li><Link to="/privacy-policy" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="font-body-md text-sm transition-colors cursor-pointer hover:text-primary-container" style={{ color: '#a8a8a8' }}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body-md text-sm" style={{ color: '#606060' }}>
            &copy; {new Date().getFullYear()} BeaverIDE. All rights reserved.
          </p>
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 font-label-md text-sm font-medium transition-colors p-2 rounded-lg group hover:text-primary-container"
            style={{ color: '#606060' }}
          >
            Back to top
            <ArrowUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};
