import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Users, Zap, TerminalSquare } from 'lucide-react';

export const Home = () => {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6">
          Code Together, <span className="text-primary">Instantly.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-on-surface-variant mb-10">
          The real-time collaborative IDE that feels like a professional editor but works as easily as a shared document. Join a room, write code, and run it together with zero setup.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto">Get Started for Free</Button>
          </Link>
          <Link to="/about">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">Learn More</Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-8 hover:shadow-md transition-shadow">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/10">
              <Users size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Live Presence</h3>
            <p className="text-on-surface-variant">
              See who is typing and where. Multiple cursors and instantaneous syncing so you never lose context.
            </p>
          </Card>
          <Card className="text-center p-8 hover:shadow-md transition-shadow">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <TerminalSquare size={32} className="text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">One-Click Run</h3>
            <p className="text-on-surface-variant">
              Execute Python, JavaScript, and Go instantly. Everyone in the room sees the same streaming terminal output.
            </p>
          </Card>
          <Card className="text-center p-8 hover:shadow-md transition-shadow">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/10">
              <Zap size={32} className="text-tertiary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Zero Setup</h3>
            <p className="text-on-surface-variant">
              No local environments to configure. Just share a link and start pair programming or interviewing in seconds.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
