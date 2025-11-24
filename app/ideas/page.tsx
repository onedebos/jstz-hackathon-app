'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { submitIdea, voteIdea, unvoteIdea } from '@/app/actions';

interface Idea {
  id: string;
  title: string;
  description: string;
  author_id: string;
  vote_count: number;
  is_locked: boolean;
  created_at: string;
}

export default function IdeasPage() {
  const { user, loading } = useUser();
  const [activeTab, setActiveTab] = useState<'ideas' | 'create'>('ideas');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votedIdeas, setVotedIdeas] = useState<Set<string>>(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadIdeas();
    loadVotes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('ideas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => {
        loadIdeas();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_votes' }, () => {
        loadIdeas();
        loadVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadIdeas() {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setIdeas(data);
  }

  async function loadVotes() {
    if (!user) return;
    const { data } = await supabase
      .from('idea_votes')
      .select('idea_id')
      .eq('user_id', user.id);
    if (data) {
      setVotedIdeas(new Set(data.map(v => v.idea_id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !user) return;
    
    setSubmitting(true);
    try {
      await submitIdea(title, description, user.id);
      setTitle('');
      setDescription('');
      await loadIdeas();
      // Switch to ideas tab after successful submission
      setActiveTab('ideas');
    } catch (error) {
      console.error('Error submitting idea:', error);
      alert('Failed to submit idea');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(ideaId: string) {
    if (!user) return;
    if (votedIdeas.has(ideaId)) {
      await unvoteIdea(ideaId, user.id);
    } else {
      await voteIdea(ideaId, user.id);
    }
    await loadVotes();
  }

  useEffect(() => {
    if (!user && !loading) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, loading]);

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
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-white">Ideas</span>
        </h1>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        
        {!user && !loading && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">Please log in to view and submit ideas.</p>
          </div>
        )}
        
        {user && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'ideas'
                ? 'border-[#6c255f] text-[#8aaafc]'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Ideas
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'create'
                ? 'border-[#6c255f] text-[#8aaafc]'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
              Create Idea
            </button>
          </div>

          {/* Ideas Tab Content */}
          {activeTab === 'ideas' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-all"
                >
                  {idea.is_locked && (
                    <div className="text-xs bg-[#6c255f] text-white px-2 py-1 rounded mb-2 inline-block">
                      🔒 Locked
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{idea.title}</h3>
                  <p className="text-gray-300 mb-4 text-sm">{idea.description}</p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleVote(idea.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                        votedIdeas.has(idea.id)
                          ? 'bg-[#6c255f] text-white'
                          : 'bg-[#0c0c0c] text-gray-300 hover:bg-[#121212]'
                      }`}
                    >
                      <span>👍</span>
                      <span>{idea.vote_count}</span>
                    </button>
                    <span className="text-xs text-gray-400">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {ideas.length === 0 && (
              <div className="text-center text-gray-400 mt-12">
                <p className="text-xl">No ideas yet. Be the first! 🎄</p>
              </div>
            )}
          </>
        )}

          {/* Create Idea Tab Content */}
          {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Submit an Idea 💡</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Idea title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
                  required
                />
                <textarea
                  placeholder="Describe your idea..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors disabled:opacity-50 font-bold w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Idea'}
                </button>
              </form>
            </div>
          </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

