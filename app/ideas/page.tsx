'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { submitIdea, voteIdea, unvoteIdea } from '@/app/actions';
import Counter from '@/components/AnimatedCounter';
import { isFeatureOpen } from '@/lib/phases';

interface Idea {
  id: string;
  title: string;
  description: string;
  author_id: string;
  vote_count: number;
  is_locked: boolean;
  created_at: string;
  author?: {
    id: string;
    name: string;
  };
}

export default function IdeasPage() {
  const { user, loading } = useUser();
  const [activeTab, setActiveTab] = useState<'ideas' | 'create'>('ideas');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votedIdeas, setVotedIdeas] = useState<Set<string>>(new Set());
  const [userVoteCounts, setUserVoteCounts] = useState<Map<string, number>>(new Map());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [canSubmitIdeas, setCanSubmitIdeas] = useState(true);
  const [canVote, setCanVote] = useState(true);

  useEffect(() => {
    // Check phase states
    async function checkPhases() {
      const canSubmit = await isFeatureOpen('ideas_open', () => true);
      const canVoteOnIdeas = await isFeatureOpen('ideas_voting', () => true);
      setCanSubmitIdeas(canSubmit);
      setCanVote(canVoteOnIdeas);
    }
    checkPhases();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_phases' }, () => {
        checkPhases(); // Re-check phases when they change
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
    
    if (data) {
      // Load author names for each idea
      const ideasWithAuthors = await Promise.all(
        data.map(async (idea) => {
          try {
            const { data: authorData } = await supabase
              .from('users')
              .select('id, name')
              .eq('id', idea.author_id)
              .single();
            
            return {
              ...idea,
              author: authorData || undefined,
            };
          } catch (error) {
            // If user not found, just return idea without author
            return idea;
          }
        })
      );
      
      setIdeas(ideasWithAuthors);
    }
  }

  async function loadVotes() {
    if (!user) return;
    const { data } = await supabase
      .from('idea_votes')
      .select('idea_id')
      .eq('voter_id', user.id);
    if (data) {
      // Count votes per idea for this user
      const voteCounts = new Map<string, number>();
      data.forEach((vote) => {
        voteCounts.set(vote.idea_id, (voteCounts.get(vote.idea_id) || 0) + 1);
      });
      setUserVoteCounts(voteCounts);
      
      // Set voted ideas (any idea with at least one vote)
      setVotedIdeas(new Set(data.map(v => v.idea_id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !user) return;
    if (!canSubmitIdeas) {
      alert('Idea submissions are currently closed.');
      return;
    }
    
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
    if (!canVote) {
      alert('Voting on ideas is currently closed.');
      return;
    }
    const currentVoteCount = userVoteCounts.get(ideaId) || 0;
    
    // Optimistically update the UI immediately for smooth animation
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            vote_count: currentVoteCount >= 5 
              ? Math.max(0, idea.vote_count - 1)
              : idea.vote_count + 1
          };
        }
        return idea;
      })
    );
    
    // Update vote counts optimistically
    if (currentVoteCount >= 5) {
      setUserVoteCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(ideaId, currentVoteCount - 1);
        return newMap;
      });
      await unvoteIdea(ideaId, user.id);
    } else {
      setUserVoteCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(ideaId, currentVoteCount + 1);
        return newMap;
      });
      await voteIdea(ideaId, user.id);
    }
    
    // Sync with server after a short delay to allow animation to play
    setTimeout(() => {
      loadIdeas();
      loadVotes();
    }, 300);
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
            {/* Max Votes Info */}
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm text-center">
                💡 You can vote up to <span className="text-white font-semibold">5 times</span> per idea
              </p>
            </div>
            
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
                  className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-all flex flex-col h-full"
                >
                  <div className="shrink-0">
                    {idea.is_locked && (
                      <div className="text-xs bg-[#6c255f] text-white px-2 py-1 rounded mb-2 inline-block">
                        🔒 Locked
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">{idea.title}</h3>
                    {idea.author && (
                      <p className="text-gray-400 text-xs mb-2">by {idea.author.name}</p>
                    )}
                  </div>
                  <p className="text-gray-300 mb-4 text-sm grow">{idea.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <button
                      onClick={() => handleVote(idea.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors cursor-pointer ${
                        votedIdeas.has(idea.id)
                          ? 'bg-[#6c255f] text-white'
                          : 'bg-[#0c0c0c] text-gray-300 hover:bg-[#121212]'
                      }`}
                      title={userVoteCounts.get(idea.id) ? `You've voted ${userVoteCounts.get(idea.id)}/5 times` : 'Click to vote (max 5 votes)'}
                    >
                      <span>👍</span>
                      <Counter key={`${idea.id}-${idea.vote_count}`} value={idea.vote_count} />
                      {userVoteCounts.get(idea.id) && (
                        <span className="text-xs opacity-75 ml-1">
                          ({userVoteCounts.get(idea.id)}/5)
                        </span>
                      )}
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
                <div className="mb-4">
                  <textarea
                    placeholder="Describe your idea..."
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= 460) {
                        setDescription(e.target.value);
                      }
                    }}
                    rows={6}
                    maxLength={460}
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {description.length}/460 characters
                  </p>
                </div>
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

