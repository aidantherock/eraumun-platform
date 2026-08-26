export default function Cookies() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Legal</p>
          <h1 className="font-serif text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-white/70 text-sm">Last updated: August 2026</p>
        </div>
      </section>
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto prose prose-sm text-gray-600 space-y-8">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">1. What Are Cookies</h2>
            <p className="leading-relaxed">Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">2. How We Use Cookies</h2>
            <p className="leading-relaxed mb-3">We use a minimal number of cookies, strictly limited to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authentication cookies to keep you logged in to the member portal</li>
              <li>Session cookies to maintain your preferences during a visit</li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">3. Analytics</h2>
            <p className="leading-relaxed">We use privacy-friendly, cookieless analytics (Plausible or Fathom) to understand how our site is used. These tools do not use cookies and do not track you across other websites.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">4. Third-Party Cookies</h2>
            <p className="leading-relaxed">We do not use third-party advertising cookies or tracking pixels. We do not sell your data to advertisers.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">5. Managing Cookies</h2>
            <p className="leading-relaxed">You can control cookies through your browser settings. Disabling authentication cookies will prevent you from staying logged in to the member portal.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">6. Contact</h2>
            <p className="leading-relaxed">For any questions about our cookie policy, contact us at info@eraumun.com.</p>
          </div>
        </div>
      </section>
    </div>
  )
}