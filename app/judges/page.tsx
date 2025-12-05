'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { voteJudgeRank, unvoteJudgeRank } from '@/app/actions';

const ALLOWED_JUDGES = ['thomas-letan', 'ryan-tan', 'asutosh-mourya'];

interface Project {
  id: string;
  team_id: string;
  title: string;
  description: string;
  repo_url: string;
  demo_url: string;
  video_url: string;
  presentation_url: string;
  judge_vote_count: number;
  submitted_at: string;
  team?: { 
    name: string;
    idea_id?: string;
    idea?: {
      id: string;
      title: string;
      description: string;
    };
  };
}

interface JudgeVote {
  project_id: string;
  rank: number;
}

export default function JudgesPage() {
  const [judgeName, setJudgeName] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [judgeVotes, setJudgeVotes] = useState<Map<string, number>>(new Map()); // project_id -> rank
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if judge is already authenticated
    if (typeof window !== 'undefined') {
      const storedJudge = localStorage.getItem('jstz_judge_name');
      if (storedJudge && ALLOWED_JUDGES.includes(storedJudge)) {
        setJudgeName(storedJudge);
        setAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadProjects();
      loadVotes();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('judges-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          loadProjects();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'judge_votes' }, () => {
          loadProjects();
          loadVotes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authenticated, judgeName]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = judgeName.trim().toLowerCase();
    
    if (!ALLOWED_JUDGES.includes(trimmedName)) {
      setError('Access denied. Only authorized judges can access this page.');
      return;
    }

    setAuthenticated(true);
    setError('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('jstz_judge_name', trimmedName);
    }
  }

  async function handleLogout() {
    setAuthenticated(false);
    setJudgeName('');
    setJudgeVotes(new Map());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jstz_judge_name');
    }
  }

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('judge_vote_count', { ascending: false });

    if (data) {
      // Load team names and ideas
      const projectsWithTeams = await Promise.all(
        data.map(async (project) => {
          if (project.team_id) {
            const { data: team } = await supabase
              .from('teams')
              .select('name, idea_id')
              .eq('id', project.team_id)
              .single();
            
            if (team?.idea_id) {
              const { data: idea } = await supabase
                .from('ideas')
                .select('id, title, description')
                .eq('id', team.idea_id)
                .single();
              return { 
                ...project, 
                team: team ? { ...team, idea: idea || undefined } : undefined,
                // Use idea description if project description is empty
                description: project.description || idea?.description || 'No description provided.'
              };
            }
            return { ...project, team: team || undefined };
          }
          return project;
        })
      );
      setProjects(projectsWithTeams);
    }
  }

  async function loadVotes() {
    if (!judgeName) return;
    const { data } = await supabase
      .from('judge_votes')
      .select('project_id, rank')
      .eq('judge_name', judgeName);
    
    if (data) {
      const votesMap = new Map<string, number>();
      data.forEach(vote => {
        votesMap.set(vote.project_id, vote.rank);
      });
      setJudgeVotes(votesMap);
    }
  }

  async function handleRankChange(projectId: string, rank: number | null) {
    if (!judgeName) return;
    
    const currentRank = judgeVotes.get(projectId);
    
    // If removing a vote
    if (rank === null && currentRank) {
      await unvoteJudgeRank(projectId, judgeName);
      await loadVotes();
      return;
    }
    
    // If setting a new rank
    if (rank && rank !== currentRank) {
      // If this rank is already taken by another project, remove it first
      const existingProjectForRank = Array.from(judgeVotes.entries()).find(([pid, r]) => r === rank && pid !== projectId);
      if (existingProjectForRank) {
        await unvoteJudgeRank(existingProjectForRank[0], judgeName);
      }
      
      // If this project already has a rank, remove it first
      if (currentRank) {
        await unvoteJudgeRank(projectId, judgeName);
      }
      
      // Add the new vote
      await voteJudgeRank(projectId, judgeName, rank);
      await loadVotes();
    }
  }

  function getRankForProject(projectId: string): number | null {
    return judgeVotes.get(projectId) || null;
  }

  function getProjectForRank(rank: number): string | null {
    for (const [projectId, r] of judgeVotes.entries()) {
      if (r === rank) return projectId;
    }
    return null;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Judges Portal</h1>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-white font-bold mb-2">Judge Name</label>
                  <input
                    type="text"
                    value={judgeName}
                    onChange={(e) => {
                      setJudgeName(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your name"
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="text-red-400 text-sm">{error}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors font-bold"
                >
                  Access Portal
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-white">Judges Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Logged in as: <span className="text-white font-bold">{judgeName}</span></span>
            <button
              onClick={handleLogout}
              className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-[#1a1a2e] border border-[#8aaafc] rounded-lg p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-2">📋 Voting Instructions</h2>
            <p className="text-gray-300 text-sm">
              Select exactly <strong className="text-white">one project for 1st place</strong>, <strong className="text-white">one for 2nd place</strong>, and <strong className="text-white">one for 3rd place</strong>.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-300">1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-gray-300">2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded"></div>
              <span className="text-gray-300">3rd Place</span>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No projects submitted yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white flex-1">
                    {project.title || project.team?.idea?.title || 'Untitled Project'}
                  </h3>
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-[#8aaafc]">{project.judge_vote_count || 0}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>
                
                {getRankForProject(project.id) && (
                  <div className={`mb-3 px-3 py-1 rounded text-sm font-bold text-center ${
                    getRankForProject(project.id) === 1 ? 'bg-yellow-500 text-black' :
                    getRankForProject(project.id) === 2 ? 'bg-gray-400 text-black' :
                    'bg-orange-600 text-white'
                  }`}>
                    {getRankForProject(project.id) === 1 ? '🥇 1st Place' :
                     getRankForProject(project.id) === 2 ? '🥈 2nd Place' :
                     '🥉 3rd Place'}
                  </div>
                )}

                {project.team && (
                  <div className="text-gray-400 text-sm mb-3">
                    Team: <span className="text-white">{project.team.name}</span>
                  </div>
                )}

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {project.description || 'No description provided.'}
                </p>

                <div className="space-y-2 mb-4">
                  {project.repo_url && (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[#8aaafc] hover:underline text-sm"
                    >
                      🔗 Repository
                    </a>
                  )}
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[#8aaafc] hover:underline text-sm"
                    >
                      🔗 Demo
                    </a>
                  )}
                  {project.video_url && (
                    <a
                      href={project.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[#8aaafc] hover:underline text-sm"
                    >
                      🔗 Video
                    </a>
                  )}
                  {project.presentation_url && (
                    <a
                      href={project.presentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[#8aaafc] hover:underline text-sm"
                    >
                      🔗 Presentation
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <select
                    value={getRankForProject(project.id) || ''}
                    onChange={(e) => handleRankChange(project.id, e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#8aaafc] focus:outline-none"
                  >
                    <option value="">Select rank...</option>
                    <option value="1" disabled={getProjectForRank(1) !== null && getProjectForRank(1) !== project.id}>
                      1st Place {getProjectForRank(1) && getProjectForRank(1) !== project.id ? '(taken)' : ''}
                    </option>
                    <option value="2" disabled={getProjectForRank(2) !== null && getProjectForRank(2) !== project.id}>
                      2nd Place {getProjectForRank(2) && getProjectForRank(2) !== project.id ? '(taken)' : ''}
                    </option>
                    <option value="3" disabled={getProjectForRank(3) !== null && getProjectForRank(3) !== project.id}>
                      3rd Place {getProjectForRank(3) && getProjectForRank(3) !== project.id ? '(taken)' : ''}
                    </option>
                  </select>
                  {getRankForProject(project.id) && (
                    <button
                      onClick={() => handleRankChange(project.id, null)}
                      className="w-full py-1 px-4 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      Remove Rank
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


