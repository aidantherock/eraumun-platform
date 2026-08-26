import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-serif text-8xl font-bold text-[#1e3a6e] mb-4">404</p>
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved. Head back to the homepage and try again.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-3 rounded hover:bg-[#2d538f] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/contact"
            className="border border-gray-200 text-gray-700 font-semibold text-sm px-6 py-3 rounded hover:border-[#1e3a6e] hover:text-[#1e3a6e] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}