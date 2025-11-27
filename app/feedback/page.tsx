'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { submitFeedback } from '@/app/actions';

export default function FeedbackPage() {
  const { user, loading } = useUser();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !description || !user) return;

    setSubmitting(true);
    try {
      await submitFeedback(user.id, category, description, severity || null, null);
      setSubmitted(true);
      // Reset form
      setCategory('');
      setDescription('');
      setSeverity('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-16 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-4 text-center">
          <span className="text-white">Feedback</span>
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Help us improve jstz! Share your experience, report bugs, or request features.
        </p>
        
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

        {!user && !loading && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">Please log in to submit feedback.</p>
          </div>
        )}

        {user && (
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="bg-[#121212] border border-green-600 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-4">Thank you for your feedback!</h2>
                <p className="text-gray-300 mb-6">
                  Your feedback helps us make jstz better for everyone.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors font-bold"
                >
                  Submit More Feedback
                </button>
              </div>
            ) : (
              <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white font-bold mb-2">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                      required
                    >
                      <option value="">Select a category...</option>
                      <option value="docs">📚 Documentation</option>
                      <option value="apis">🔌 APIs</option>
                      <option value="tooling">🛠️ Tooling</option>
                      <option value="dx">✨ Developer Experience</option>
                      <option value="bugs">🐛 Bugs</option>
                      <option value="feature_request">💡 Feature Request</option>
                      <option value="other">📋 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      placeholder="What did you experience? What could be improved? Be as specific as possible..."
                      className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2">Severity</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    >
                      <option value="">Select severity...</option>
                      <option value="low">🟢 Low - Minor improvement</option>
                      <option value="medium">🟡 Medium - Would be nice to fix</option>
                      <option value="high">🟠 High - Significant friction</option>
                      <option value="critical">🔴 Critical - Blocked progress</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors disabled:opacity-50 font-bold"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback 📝'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

