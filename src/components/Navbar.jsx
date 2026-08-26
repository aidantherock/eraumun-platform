import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isApproved } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const navLinks = [
    { label: 'About', to: '/about' },
    { label: 'Conferences', to: '/conferences' },
    { label: 'News & Events', to: '/news' },
    { label: 'Support', to: '/support' },
    { label: 'Contact', to: '/contact' },
  ]

  const portalLink = user && isApproved ? '/portal' : user ? '/pending' : '/login'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-[68px] bg-white border-b border-gray-200 transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-11 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`px-3.5 py-2 rounded text-sm font-semibold transition-colors duration-150
                  ${location.pathname === link.to
                    ? 'text-[#1e3a6e] bg-[#e8eef7]'
                    : 'text-gray-800 hover:text-[#1e3a6e] hover:bg-[#e8eef7]'
                  }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center">
          <Link
            to={portalLink}
            className="bg-[#1e3a6e] text-white text-sm font-semibold px-5 py-2 rounded hover:bg-[#2d538f] transition-colors"
          >
            Portal
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded text-gray-700 hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 flex flex-col gap-2 shadow-md">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded text-sm font-semibold transition-colors
                ${location.pathname === link.to
                  ? 'text-[#1e3a6e] bg-[#e8eef7]'
                  : 'text-gray-800 hover:text-[#1e3a6e] hover:bg-[#e8eef7]'
                }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <Link
              to={portalLink}
              className="block bg-[#1e3a6e] text-white text-sm font-semibold px-4 py-2 rounded text-center hover:bg-[#2d538f] transition-colors"
            >
              Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}