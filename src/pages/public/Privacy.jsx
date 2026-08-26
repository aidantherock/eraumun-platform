export default function Privacy() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Legal</p>
          <h1 className="font-serif text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Last updated: August 2026</p>
        </div>
      </section>
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto prose prose-sm text-gray-600 space-y-8">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">1. Who We Are</h2>
            <p className="leading-relaxed">ERAU Model United Nations (ERAU-MUN) is a Registered Student Organization at Embry-Riddle Aeronautical University, Daytona Beach campus. This platform is operated by ERAU-MUN and is not affiliated with or endorsed by Embry-Riddle Aeronautical University as an institution.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="leading-relaxed mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email address, and school affiliation when you register or contact us</li>
              <li>Profile information including bio, social media links, and contact details</li>
              <li>Documents and submissions you submit through the platform</li>
              <li>Communications you send through the platform</li>
              <li>Event registration information</li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and operate the platform and its features</li>
              <li>Communicate with you about events, updates, and announcements</li>
              <li>Manage conference and event registrations</li>
              <li>Assign roles and permissions within the platform</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">4. Data Retention</h2>
            <p className="leading-relaxed">We retain your personal data for as long as your account is active. Closed event data is retained for two years and then anonymized. You may request deletion of your data at any time by contacting us.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <p className="leading-relaxed">Depending on your location, you may have rights including access to your data, correction of inaccurate data, deletion of your data, and the right to withdraw consent. To exercise these rights, contact us at info@eraumun.com.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">6. Children</h2>
            <p className="leading-relaxed">Our platform requires users to be 13 years of age or older. For participants under 18 at high school events, we require faculty advisor contact information.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">7. Contact</h2>
            <p className="leading-relaxed">For any privacy-related questions, contact us at info@eraumun.com.</p>
          </div>
        </div>
      </section>
    </div>
  )
}