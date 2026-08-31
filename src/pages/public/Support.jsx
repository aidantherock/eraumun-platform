<SEO
  title="Support Us"
  description="Support ERAU-MUN through sponsorships, donations, or the Adopt-a-Delegate program."
  url="/support"
/>

import { Link } from 'react-router-dom'
import SEO from '../../components/SEO'

export default function Support() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Get Involved</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Support <em className="italic text-[#d4af62]">ERAU-MUN</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            Help us send delegates to conferences, host events, and grow the next generation of diplomatic leaders at Embry-Riddle.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">

          {/* Options */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Ways to Help</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6 leading-snug">
              How You Can <em className="italic text-[#1e3a6e]">Support Us</em>
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { title: 'Make a Donation', desc: 'Every dollar helps cover conference registration fees, travel costs, and materials for our delegates.' },
                { title: 'Become a Sponsor', desc: 'Partner with ERAU-MUN as an organizational sponsor. Get your brand in front of future leaders.' },
                { title: 'Adopt-a-Delegate', desc: 'Directly fund a delegate\'s conference attendance. Cover registration, travel, or accommodation costs.' },
                { title: 'Spread the Word', desc: 'Share our mission with your network. Help us grow our community and reach more students.' },
              ].map(option => (
                <div key={option.title} className="border border-gray-200 rounded-lg px-5 py-4 bg-white hover:border-[#b8963e] hover:shadow-sm transition-all">
                  <h4 className="font-semibold text-sm text-[#1e3a6e] mb-1">{option.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{option.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Donate Panel */}
          <div id="donate">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-1">Make a Donation</h3>
              <p className="text-sm text-gray-500 mb-6">Support ERAU-MUN delegates directly.</p>
              <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg p-5 mb-6">
                <p className="text-sm text-[#1e3a6e] leading-relaxed mb-3">
                  We accept donations through ERAU's official giving channels. To arrange a donation, please reach out to us directly and we will walk you through the process.
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    'Flexible donation amounts',
                    'Tax-deductible through ERAU',
                    'Direct impact on delegate participation',
                    'Receipts provided upon request',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#1e3a6e]/80">
                      <span className="text-[#b8963e] font-bold mt-0.5">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/contact"
                className="block text-center bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-3 rounded hover:bg-[#2d538f] transition-colors"
              >
                Contact Us to Donate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor */}
      <section id="sponsor" className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Partnership</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4 leading-snug">
              Become a <em className="italic text-[#1e3a6e]">Sponsor</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">
              Sponsoring ERAU-MUN gives your organization visibility with a talented group of future engineers, pilots, scientists, and business leaders. Your logo will appear on our website, conference materials, and more.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-6">
              We offer flexible sponsorship tiers to fit any budget. Contact us to learn more about partnership opportunities.
            </p>
            <Link
              to="/contact"
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-3 rounded hover:bg-[#2d538f] transition-colors inline-block"
            >
              Get in Touch
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { tier: 'Gold Sponsor', perks: 'Logo on website homepage, conference materials, and social media recognition.' },
              { tier: 'Silver Sponsor', perks: 'Logo on website and conference materials.' },
              { tier: 'Bronze Sponsor', perks: 'Name listed on website and thank-you posts.' },
              { tier: 'Custom Partnership', perks: 'Flexible arrangements tailored to your organization. Contact us to discuss.' },
            ].map(item => (
              <div key={item.tier} className="border-l-[3px] border-[#b8963e] pl-4 py-2 bg-white rounded-r">
                <h4 className="font-semibold text-sm text-[#1e3a6e] mb-0.5">{item.tier}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.perks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adopt-a-Delegate */}
      <section id="adopt" className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div className="bg-[#1e3a6e] rounded-xl p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Direct Impact</p>
            <h3 className="font-serif text-2xl font-bold mb-3">Adopt-a-Delegate</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4 font-light">
              Conference attendance costs can be a barrier for some students. Through our Adopt-a-Delegate program, you can directly fund a student's participation — covering registration fees, travel, or accommodation.
            </p>
            <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
              Every contribution makes a direct difference in a student's MUN experience and career development.
            </p>
            <Link
              to="/contact"
              className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors inline-block"
            >
              Learn More
            </Link>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">What It Covers</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4 leading-snug">
              Fund a Student's <em className="italic text-[#1e3a6e]">Journey</em>
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { item: 'Conference Registration', desc: 'Cover the cost of a delegate\'s conference registration fee.' },
                { item: 'Travel Expenses', desc: 'Help fund flights, gas, or transportation to and from the conference.' },
                { item: 'Accommodation', desc: 'Cover hotel or lodging costs during the conference.' },
                { item: 'Materials & Preparation', desc: 'Fund research materials, printing, and conference preparation costs.' },
              ].map(i => (
                <div key={i.item} className="flex gap-3 items-start">
                  <span className="text-[#b8963e] font-bold mt-0.5">&#10003;</span>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{i.item}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{i.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}