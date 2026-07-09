import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const Contact = () => {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-on-surface mb-4">Contact Support</h1>
          <p className="text-xl text-on-surface-variant">
            We're here to help with any questions or issues.
          </p>
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Name</label>
              <Input placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
              <Input type="email" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Message</label>
              <textarea 
                className="flex w-full rounded-DEFAULT border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[4px] focus-visible:ring-primary/20 transition-all min-h-[120px]"
                placeholder="How can we help you?"
              ></textarea>
            </div>
            <Button className="w-full">Send Message</Button>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
