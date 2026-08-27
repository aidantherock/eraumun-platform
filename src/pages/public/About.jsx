const LEADERSHIP = [
  {
    name: 'Josiah White',
    title: 'President',
    bio: 'Junior - Computer Science',
    avatar: null,
  },
  {
    name: 'Aidan Rock-Arnarson',
    title: 'Vice President',
    bio: 'Masters - Aviation Finance',
    avatar: null,
  },
  {
    name: 'Blake Kopnicky',
    title: 'Treasurer',
    bio: 'Junior - Software Engineering',
    avatar: null,
  },
  {
    name: 'Joy Ejimadu',
    title: 'Secretary',
    bio: 'Sophomore - Aerospace Engineering',
    avatar: null,
  },
  {
    name: 'Sean McGraw',
    title: 'Parliamentarian',
    bio: 'Sophomore - Global Conflict Studies',
    avatar: null,
  },
  {
    name: 'Hana Marz',
    title: 'Public Relations Officer',
    bio: 'Senior - Global Conflict Studies',
    avatar: null,
  },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Who We Are</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            About <em className="italic text-[#d4af62]">ERAU-MUN</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            Embry-Riddle Aeronautical University's Model United Nations organization, dedicated to developing the next generation of diplomatic leaders.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Our Story</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4 leading-snug">
              Diplomacy at <em className="italic text-[#1e3a6e]">Altitude</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">
              ERAU Model United Nations is a Registered Student Organization at Embry-Riddle Aeronautical University's Daytona Beach campus. We bring together students passionate about international relations, public speaking, debate, and diplomacy.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">
              Through participation in Model United Nations conferences across the country, our members develop critical thinking, research, negotiation, and leadership skills that extend far beyond the classroom.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              Our four strategic pillars guide everything we do: outreach, revitalized events, intercollegiate competition, and the launch of the Ernie Crisis Simulation - ERAU's first competitive Model United Nations simulation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { title: 'Outreach', desc: 'Expanding our reach across campus and the broader MUN community through partnerships, social media, and campus engagement.' },
              { title: 'Revitalized Events', desc: 'Bringing fresh energy to our General Body Meetings, GA and Crisis training sessions, MUNMixers, and outreach events.' },
              { title: 'Intercollegiate Competition', desc: 'Representing ERAU at Model United Nations conferences across the country, competing against delegates from top universities.' },
              { title: 'Ernie Crisis Simulation', desc: "Launching ERAU's first competitive Model United Nations simulation, bringing delegates from schools across the region to Daytona Beach." },
            ].map(pillar => (
              <div key={pillar.title} className="border-l-[3px] border-[#b8963e] pl-4 py-2 bg-gray-50 rounded-r">
                <h4 className="font-semibold text-sm text-[#1e3a6e] mb-1">{pillar.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
<section className="px-6 py-20 bg-gray-50">
  <div className="max-w-7xl mx-auto">
    <div className="mb-10">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">The Team</p>
      <h2 className="font-serif text-3xl font-bold text-gray-900">
        Executive <em className="italic text-[#1e3a6e]">Board</em>
      </h2>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {LEADERSHIP.map(member => (
        <div key={member.name} className="group" style={{ perspective: '1000px' }}>
          <div
            className="relative w-full h-72 transition-transform duration-700 rounded-xl overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'rotateY(180deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotateY(0deg)'}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-md"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Photo or seal as full card */}
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#e8eef7] flex items-center justify-center">
                  <img
                    src="/logo-seal-transparent.png"
                    alt="ERAU-MUN"
                    className="w-32 h-32 object-contain opacity-30"
                  />
                </div>
              )}

              {/* Blue ribbon bottom left */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#1e3a6e]/90 px-4 py-3">
                <p className="font-semibold text-white text-sm leading-tight">{member.name}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-[#d4af62] mt-0.5">{member.title}</p>
              </div>
            </div>

            {/* Back */}
<div
  className="absolute inset-0 bg-[#1e3a6e] border border-[#b8963e]/30 rounded-xl shadow-sm flex flex-col items-center justify-center p-5 text-center"
  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
>
  <p className="font-serif text-lg font-bold text-white mb-1">{member.name}</p>
  <p className="text-xs font-bold uppercase tracking-wide text-[#d4af62] mb-3">{member.title}</p>
  <p className="text-xs text-white/70 leading-relaxed">{member.bio}</p>
</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Join */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Get Involved</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">
              How to <em className="italic text-[#1e3a6e]">Join</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-6">
              Membership is open to all ERAU Daytona Beach students. No prior MUN experience is required — just enthusiasm and a willingness to learn.
            </p>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', title: 'Attend a GBM', desc: 'Come to one of our General Body Meetings held every other Tuesday. Check the calendar for dates.' },
                { step: '2', title: 'Create an Account', desc: 'Register on CampusGroups to access the full member portal, calendar, and event signups.' },
                { step: '3', title: 'Start Participating', desc: 'Attend training sessions, sign up for conferences, and get involved in club activities.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#1e3a6e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1e3a6e] rounded-lg p-8 text-white">
            <h3 className="font-serif text-2xl font-bold mb-2">Ready to Join?</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-5 font-light">
              Sign up on CampusGroups today and get access to the full ERAU-MUN member experience.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {[
                'Access to the full member portal',
                'Conference travel opportunities',
                'GA and Crisis committee training',
                'Leadership roles available',
                'MUNMixer social events',
                'Networking with delegates nationwide',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-[#d4af62] font-bold mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            
              <a href="https://campusgroups.erau.edu/mun/club_signup"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors"
            >
              Join on CampusGroups
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
