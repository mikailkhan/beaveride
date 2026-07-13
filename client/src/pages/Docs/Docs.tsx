
export const Docs = () => {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-8">Documentation</h1>
        <p className="text-lg text-on-surface-variant mb-8">
          Welcome to the BeaverIDE documentation. Here you will find everything you need to know about using our platform.
        </p>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Getting Started</h2>
            <p className="text-on-surface-variant mb-4">Learn how to create your first project and invite team members.</p>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
              <ul className="list-disc list-inside space-y-2 text-on-surface-variant">
                <li>Creating an Account</li>
                <li>Setting up a new Workspace</li>
                <li>Connecting your GitHub repository</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Core Concepts</h2>
            <p className="text-on-surface-variant mb-4">Understand the architecture and features of BeaverIDE.</p>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
              <ul className="list-disc list-inside space-y-2 text-on-surface-variant">
                <li>Collaborative Editing</li>
                <li>Cloud Terminal usage</li>
                <li>File System navigation</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
