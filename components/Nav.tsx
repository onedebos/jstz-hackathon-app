'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { useUser } from './UserProvider';
import { LoginModal } from './LoginModal';
import { VideoButton } from './VideoButton';

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/ideas', label: 'Ideas' },
    { href: '/teams', label: 'Teams' },
    { href: '/submit', label: 'Submit' },
    { href: '/showcase', label: 'Showcase' },
  ];

  return (
    <>
      <nav className="border-b border-gray-800 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <VideoButton />
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive(link.href)
                      ? 'text-[#8aaafc] font-semibold'
                      : 'text-white hover:text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://jstz.tezos.com/quick_start/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors text-white hover:text-gray-300"
              >
                Docs
              </a>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 text-white hover:text-[#8aaafc] transition-colors max-w-[200px]"
                  >
                    <span className="text-sm truncate">{user.name}</span>
                    <span className="text-xs flex-shrink-0">▼</span>
                  </button>
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 bg-[#121212] border border-[#6c255f] rounded-lg shadow-lg z-20 min-w-[150px]">
                        <button
                          onClick={() => {
                            logout();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-[#0c0c0c] transition-colors text-sm"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-4 py-2 rounded transition-colors text-sm font-semibold"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white hover:text-[#8aaafc] transition-colors p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showMobileMenu ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-64 bg-[#0c0c0c] border-l border-[#6c255f] z-50 md:hidden overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <Logo />
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="text-white hover:text-[#8aaafc] transition-colors p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`block px-4 py-3 rounded transition-colors ${
                        isActive(link.href)
                          ? 'bg-[#6c255f] text-[#8aaafc] font-semibold'
                          : 'text-white hover:bg-[#121212]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <a
                    href="https://jstz.tezos.com/quick_start/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-3 rounded text-white hover:bg-[#121212] transition-colors"
                  >
                    Docs
                  </a>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 text-sm text-gray-400">
                        <span className="text-white font-semibold">{user.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded text-white hover:bg-[#121212] transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-4 py-3 rounded transition-colors font-semibold"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

