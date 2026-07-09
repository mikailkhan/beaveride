import { Link } from 'react-router-dom';

import BeaverideLogo from "../../assets/logos/beaveride-logo.png";

export const Header = () => {
 
  return (
    <header>
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm transition-transform duration-200 py-3">
        <div className="flex items-center justify-center w-[140px] h-[54px]">
          <img alt="BeaverIDE Logo" className="h-full w-full object-contain" src={BeaverideLogo} />
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
    </header>
  );
};
