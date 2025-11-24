'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { submitProject } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface Team {
  id: string;
  name: string;
}

export default function SubmitPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [track, setTrack] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Check if submissions are open (after Dec 1)
    const now = new Date();
    const dec1 = new Date('2025-12-01T00:00:00');
    setCanSubmit(now >= dec1);

    // Load user's teams
    if (user) {
      loadUserTeams();
    }
  }, [user]);

  async function loadUserTeams() {
    if (!user) return;
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id_uuid', user.id);

    if (memberships && memberships.length > 0) {
      const teamIds = memberships.map(m => m.team_id);
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamIds);
      if (teamsData) setTeams(teamsData);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !selectedTeam) return;

    setSubmitting(true);
    try {
      await submitProject(selectedTeam, title, description, repoUrl, demoUrl, videoUrl, track);
      router.push('/showcase');
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Failed to submit project');
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

  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      setShowLoginModal(true);
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
                Project submissions will open on December 1, 2025. 🎄
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
                  <label className="block text-white font-bold mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Repository URL</label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Demo URL</label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Video URL</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Track</label>
                  <input
                    type="text"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    placeholder="e.g., AI, DeFi, Infrastructure..."
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  />
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
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

