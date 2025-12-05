'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { submitProject, submitFeedback } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { isFeatureOpen } from '@/lib/phases';

interface Team {
  id: string;
  name: string;
  idea_id?: string;
  idea?: {
    id: string;
    title: string;
    description: string;
  };
}

export default function SubmitPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  // Feedback fields
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  async function checkCanSubmit() {
    const dateCheck = () => {
      const now = new Date();
      const dec5 = new Date('2025-12-05T10:00:00');
      return now >= dec5;
    };
    const canSubmit = await isFeatureOpen('submissions_open', dateCheck);
    setCanSubmit(canSubmit);
  }

  useEffect(() => {
    // Check if submissions are open (phase override OR after Dec 5 at 10am)
    checkCanSubmit();

    // Load user's teams
    if (user) {
      loadUserTeams();
    }

    // Subscribe to phase changes
    const channel = supabase
      .channel('submit-phase-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_phases' }, () => {
        checkCanSubmit(); // Re-check when phases change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadUserTeams() {
    if (!user) return;
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id);

    if (memberships && memberships.length > 0) {
      const teamIds = memberships.map(m => m.team_id);
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, idea_id')
        .in('id', teamIds);
      
      if (teamsData) {
        // Load idea data for each team
        const teamsWithIdeas = await Promise.all(
          teamsData.map(async (team) => {
            if (team.idea_id) {
              const { data: idea } = await supabase
                .from('ideas')
                .select('id, title, description')
                .eq('id', team.idea_id)
                .single();
              return { ...team, idea: idea || undefined };
            }
            return team;
          })
        );
        setTeams(teamsWithIdeas);
      }
    }
  }

  useEffect(() => {
    // When team is selected, auto-populate title and description from idea
    if (selectedTeam) {
      const team = teams.find(t => t.id === selectedTeam);
      if (team?.idea) {
        setTitle(team.idea.title);
        setDescription(team.idea.description);
      }
    }
  }, [selectedTeam, teams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam || !user) return;

    // Get the team's idea to ensure we have title and description
    const team = teams.find(t => t.id === selectedTeam);
    const finalTitle = title || team?.idea?.title || 'Untitled Project';
    const finalDescription = description || team?.idea?.description || 'No description provided.';

    setSubmitting(true);
    try {
      const project = await submitProject(selectedTeam, finalTitle, finalDescription, repoUrl, demoUrl, videoUrl, '', presentationUrl);
      
      // Submit feedback if provided
      if (feedbackCategory && feedbackDescription) {
        await submitFeedback(
          user.id,
          feedbackCategory,
          feedbackDescription,
          feedbackSeverity || null,
          project.id
        );
      }
      
      router.push('/showcase');
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Failed to submit project');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!user && !loading) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, loading]);

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-12">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Submissions Not Open Yet
              </h1>
              <p className="text-gray-300 text-lg">
                You can begin submitting your completed hackathon projects from Friday, December 5, 2025. by 10am.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-white">Submit Project</span>
        </h1>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        
        {!user && !loading && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">Please log in to submit a project.</p>
          </div>
        )}
        
        {user && (
          <>

            {teams.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-12">
              <p className="text-gray-300 text-lg mb-6">
                You need to be part of a team to submit a project.
              </p>
              <a
                href="/teams"
                className="bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-6 py-3 rounded transition-colors inline-block"
              >
                Go to Teams
              </a>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8 mb-6">
              <div className="bg-[#1a1a2e] border border-[#8aaafc] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-3">📋 Demo Day Presentation</h2>
                <p className="text-gray-300 mb-3">
                  Before submitting your project, please make a copy of the{' '}
                  <a
                    href="https://docs.google.com/presentation/d/1vy3h_HhovbWSla4kuXlYyYsv548ZtfAmBT-H2Kn1SiQ/edit?slide=id.g3adcfc479ea_0_2#slide=id.g3adcfc479ea_0_2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8aaafc] hover:underline"
                  >
                    presentation template for the demo day call
                  </a>
                  {' '}and fill it out.
                </p>
              </div>
            </div>
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-bold mb-2">Team *</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    required
                  >
                    <option value="">Select a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Repository URL <span className="text-gray-400 text-sm font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Presentation URL <span className="text-gray-400 text-sm font-normal">(optional) [change access permission to "anyone can view"]</span></label>
                  <input
                    type="url"
                    value={presentationUrl}
                    onChange={(e) => setPresentationUrl(e.target.value)}
                    placeholder="https://docs.google.com/presentation/..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Demo URL <span className="text-gray-400 text-sm font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Video URL <span className="text-gray-400 text-sm font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                {/* Feedback Section */}
                <div className="border-t border-gray-700 pt-6 mt-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    📝 Feedback for jstz Team <span className="text-gray-400 text-sm font-normal">(optional)</span>
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Help us improve jstz! Share your experience building with it.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-bold mb-2">Category</label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
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
                      <label className="block text-white font-bold mb-2">What would you like to share?</label>
                      <textarea
                        value={feedbackDescription}
                        onChange={(e) => setFeedbackDescription(e.target.value)}
                        rows={4}
                        placeholder="What was challenging? What could be improved? Any feature requests?"
                        className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-bold mb-2">Severity</label>
                      <select
                        value={feedbackSeverity}
                        onChange={(e) => setFeedbackSeverity(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                      >
                        <option value="">Select severity...</option>
                        <option value="low">🟢 Low - Minor improvement</option>
                        <option value="medium">🟡 Medium - Would be nice to fix</option>
                        <option value="high">🟠 High - Significant friction</option>
                        <option value="critical">🔴 Critical - Blocked progress</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors disabled:opacity-50 font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Project 🚀'}
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

