import { Users } from 'lucide-react';

export const CommunityForum = () => {
  return (
    <div className="min-h-screen py-24 px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-4">Community Forum</h1>
        <p className="text-xl text-primary font-medium mb-4">Coming Soon</p>
        <p className="text-on-surface-variant max-w-md mx-auto">
          We are building a place for developers to connect, share ideas, and help each other. Stay tuned!
        </p>
      </div>
    </div>
  );
};
