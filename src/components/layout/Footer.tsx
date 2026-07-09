import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-outline-variant/30 bg-surface py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Code2 size={24} className="text-primary" />
          <span className="text-xl font-bold tracking-tight text-on-surface">
            Beaver<span className="text-primary">IDE</span>
          </span>
        </div>
        
        <nav className="flex items-center gap-8">
          <Link to="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Home</Link>
          <Link to="/about" className="text-sm text-on-surface-variant hover:text-primary transition-colors">About Us</Link>
          <Link to="/contact" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Contact Support</Link>
        </nav>

        <p className="text-sm text-on-surface-variant">
          &copy; {new Date().getFullYear()} BeaverIDE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
