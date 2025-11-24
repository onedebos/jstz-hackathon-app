'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { LoginModal } from '@/components/LoginModal';
import { createTeam, joinTeam, leaveTeam } from '@/app/actions';

interface Team {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  max_members: number;
  created_at: string;
  members?: TeamMember[];
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export default function TeamsPage() {
  const { user, loading } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userTeams, setUserTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadTeams();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('teams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        loadTeams();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        loadTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadTeams() {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamsData) {
      // Load members for each team
      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          const { data: members } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', team.id);
          return { ...team, members: members || [] };
        })
      );
      setTeams(teamsWithMembers);

      // Track which teams user is in
      if (user) {
        const { data: userMemberships } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id_uuid', user.id);
        if (userMemberships) {
          setUserTeams(new Set(userMemberships.map(m => m.team_id)));
        }
      }
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !user) return;

    setSubmitting(true);
    try {
      await createTeam(name, description, user.id);
      setName('');
      setDescription('');
      setShowCreateForm(false);
      await loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(teamId: string) {
    if (!user) return;
    try {
      await joinTeam(teamId, user.id);
      await loadTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      alert('Failed to join team');
    }
  }

  async function handleLeave(teamId: string) {
    if (!user) return;
    try {
      await leaveTeam(teamId, user.id);
      await loadTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      alert('Failed to leave team');
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

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold">
            <span className="text-white">Teams</span>
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors"
          >
            {showCreateForm ? 'Cancel' : '+ Create Team'}
          </button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Create a Team 👥</h2>
              <form onSubmit={handleCreateTeam}>
                <input
                  type="text"
                  placeholder="Team name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
                  required
                />
                <textarea
                  placeholder="Team description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const memberCount = team.members?.length || 0;
            const isMember = userTeams.has(team.id);
            const isLeader = team.user_id === user.id;
            const isFull = memberCount >= team.max_members;

            return (
              <div
                key={team.id}
                className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                  {isLeader && (
                    <span className="text-xs bg-[#6c255f] text-white px-2 py-1 rounded">
                      👑 Leader
                    </span>
                  )}
                </div>
                {team.description && (
                  <p className="text-gray-300 mb-4 text-sm">{team.description}</p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">
                    {memberCount} / {team.max_members} members
                  </span>
                </div>
                <div className="flex gap-2">
                  {isMember ? (
                    <button
                      onClick={() => handleLeave(team.id)}
                      disabled={isLeader}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLeader ? "Can't Leave" : 'Leave Team'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(team.id)}
                      disabled={isFull}
                      className="flex-1 bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFull ? 'Team Full' : 'Join Team'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {teams.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No teams yet. Create the first one! 🎄</p>
          </div>
        )}
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

