export const Contact = () => {
  return (
    <main className="flex-grow pt-[80px] md:pt-[100px] px-gutter max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-2xl mb-2xl">
      {/* Left Column: Contact Form */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-lg">
          <h1 className="font-display-lg text-display-lg text-on-background mb-sm">Get in touch.</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Need help with BeaverIDE? Our support team and community are here to assist you.</p>
        </div>
        <form className="glass-panel p-lg rounded-xl flex flex-col gap-md" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col md:flex-row gap-md">
            <div className="flex-1">
              <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="name">Name</label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="name"
                type="text"
                placeholder="John Doe"
              />
            </div>
            <div className="flex-1">
              <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="email">Email</label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="email"
                type="email"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="subject">Subject</label>
            <select
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="subject"
            >
              <option>Technical Support</option>
              <option>Billing Inquiry</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="message">Message</label>
            <textarea
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="message"
              rows={4}
              placeholder="How can we help you?"
            />
          </div>
          <button
            className="bg-primary-container text-white px-6 py-3 rounded-md font-label-md text-label-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity w-fit mt-sm"
            type="submit"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Right Column: Support Resources & Illustration */}
      <div className="flex-1 flex flex-col gap-lg mt-xl lg:mt-0">
        {/* Illustration */}
        <div
          className="rounded-2xl overflow-hidden aspect-video relative glass-panel"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLZSn5vPqLEc4u8Qsln6Hfe-YywQlhwHoY7kAXJIAmvMDx6WWgxPhU4cVQ_d43vRaw1Ctbvs5QfFUGzb6p_uvjbvyw991tTn3v_oij3UlbOPLiu75lYqEgxUlkltyt8HRJw5Wtrf7mH3Zdy6R2D3wOrUMGInbWpY9nsxp-rrmDg77pnRR2vH5b7QTzUoKRCYybWyxZn1tlqni16ag_UWNHBhN2LjzztNX8dpfHZ8NkkSwrxGiVjE1ZZrtC7Bw5Y24pZ1Y17HxQrFA')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-container flex items-center justify-center opacity-80 mix-blend-overlay" />
        </div>

        {/* Quick Links Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <a className="glass-panel p-md rounded-xl hover:-translate-y-1 transition-transform flex items-start gap-md group" href="#">
            <div className="bg-tertiary-fixed text-on-tertiary-container p-2 rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-[18px]">Documentation</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Read our comprehensive guides and API references.</p>
            </div>
          </a>

          <a className="glass-panel p-md rounded-xl hover:-translate-y-1 transition-transform flex items-start gap-md group" href="#">
            <div className="bg-primary-fixed text-on-primary-fixed p-2 rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-[18px]">Discord Community</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Chat with other developers and the core team.</p>
            </div>
          </a>

          <a className="glass-panel p-md rounded-xl hover:-translate-y-1 transition-transform flex items-start gap-md group sm:col-span-2" href="#">
            <div className="bg-secondary-fixed-dim text-on-secondary-fixed-variant p-2 rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-[18px]">Status Page</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Check system status, incident reports, and maintenance schedules. All systems operational.</p>
            </div>
          </a>
        </div>
      </div>
    </main>
  );
};
