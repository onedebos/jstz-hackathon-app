'use client';

import { useState } from 'react';
import { useUser } from './UserProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(name.trim());
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Enter Your Name</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Your name..."
            className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-3 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
            required
            disabled={submitting}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-[#0c0c0c] hover:bg-[#1a1a1a] text-white px-6 py-3 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-6 py-3 rounded transition-colors disabled:opacity-50 font-semibold"
            >
              {submitting ? 'Loading...' : 'Continue'}
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Your name will be used to track your submissions and votes across all devices.
          </p>
        </form>
      </div>
    </div>
  );
}

