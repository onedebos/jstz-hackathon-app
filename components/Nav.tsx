'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useUser } from './UserProvider';
import { LoginModal } from './LoginModal';
import { VideoButton } from './VideoButton';

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

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
            <div className="flex gap-6 items-center">
              <Link 
              href="/" 
              className={`transition-colors ${
                isActive('/') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/schedule" 
              className={`transition-colors ${
                isActive('/schedule') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Schedule
            </Link>
            <Link 
              href="/ideas" 
              className={`transition-colors ${
                isActive('/ideas') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Ideas
            </Link>
            <Link 
              href="/teams" 
              className={`transition-colors ${
                isActive('/teams') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Teams
            </Link>
            <Link 
              href="/submit" 
              className={`transition-colors ${
                isActive('/submit') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Submit
            </Link>
            <Link 
              href="/showcase" 
              className={`transition-colors ${
                isActive('/showcase') 
                  ? 'text-[#8aaafc] font-semibold' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              Showcase
            </Link>
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
                    className="flex items-center gap-2 text-white hover:text-[#8aaafc] transition-colors"
                  >
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs">▼</span>
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
          </div>
        </div>
      </nav>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

