import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Conferences', to: '/conferences' },
    { label: 'News & Events', to: '/news' },
    { label: 'Support Us', to: '/support' },
  ]

  const involvedLinks = [
    { label: 'Join ERAU-MUN', to: '/register' },
    { label: 'Ernie Crisis Simulation', to: '/ernie-crisis' },
    { label: 'Sponsor Us', to: '/support' },
    { label: 'Adopt-a-Delegate', to: '/support' },
    { label: 'Contact Us', to: '/contact' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookies' },
  ]

  return (
    <footer className="bg-[#1a2233]">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <img src="/logo-seal-transparent.png" alt="ERAU-MUN Seal" className="h-16 w-auto mb-4 opacity-90" />
          <p className="text-sm font-bold text-white">
            ERAU <span className="italic text-[#d4af62]">Model United Nations</span>
          </p>
          <p className="text-xs mt-2 leading-relaxed text-white/65">
            Embry-Riddle Aeronautical University's official Model United Nations organization, based in Daytona Beach, Florida.
          </p>
          <a href="https://discord.gg/eraumun" target="_blank" rel="noopener noreferrer" className="mt-4 text-xs text-[#d4af62] font-semibold hover:text-white transition-colors block">
            Join our Discord
          </a>
        </div>
        <div>
          <h4 className="text-[#b8963e] text-xs font-bold uppercase tracking-widest mb-4">Quick Links</h4>
          <ul className="flex flex-col gap-2">
            {quickLinks.map(link => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/65 hover:text-white transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[#b8963e] text-xs font-bold uppercase tracking-widest mb-4">Get Involved</h4>
          <ul className="flex flex-col gap-2">
            {involvedLinks.map(link => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-white/65 hover:text-white transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[#b8963e] text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
          <ul className="flex flex-col gap-2">
            {legalLinks.map(link => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/65 hover:text-white transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <h4 className="text-[#b8963e] text-xs font-bold uppercase tracking-widest mb-4">Portal</h4>
            <ul className="flex flex-col gap-2">
              <li><Link to="/login" className="text-sm text-white/65 hover:text-white transition-colors">Member Sign In</Link></li>
              <li><Link to="/register" className="text-sm text-white/65 hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-4 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">
          {currentYear} Embry-Riddle Model United Nations. A Registered Student Organization at ERAU Daytona Beach. Not affiliated with or endorsed by Embry-Riddle Aeronautical University.
        </p>
      </div>
    </footer>
  )
}