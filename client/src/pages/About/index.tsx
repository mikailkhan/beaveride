import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';

export const About = () => {
  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-on-surface mb-4">About BeaverIDE</h1>
          <p className="text-xl text-on-surface-variant">
            Built for developers who value speed, collaboration, and minimal setup.
          </p>
        </div>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4 text-on-surface">Our Mission</h2>
          <p className="text-on-surface-variant mb-6 leading-relaxed">
            Collaborating on code today is high-friction. People fall back on screen-sharing or copy-paste ping-pong. 
            There was no lightweight, zero-setup way for several people to edit and run the same code together. 
            BeaverIDE solves this by merging the professional capabilities of desktop IDEs with the effortless collaboration of Google Docs.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};
