'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/UserProvider';
import { voteShowcase, unvoteShowcase } from '@/app/actions';

interface Project {
  id: string;
  team_id: string;
  title: string;
  description: string;
  repo_url: string;
  demo_url: string;
  video_url: string;
  track: string;
  showcase_vote_count: number;
  judge_vote_count: number;
  judges_score: number;
  is_winner: boolean;
  winner_category: string;
  submitted_at: string;
  team?: { name: string };
}

export default function ShowcasePage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [votedProjects, setVotedProjects] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  useEffect(() => {
    loadProjects();
    if (user) {
      loadVotes();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel('showcase-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadProjects();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_votes' }, () => {
        loadProjects();
        loadVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadProjects() {
    let query = supabase
      .from('projects')
      .select('*')
      .order('submitted_at', { ascending: false });

    const { data } = await query;
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
                // Use idea title/description if project fields are empty
                title: project.title || idea?.title || 'Untitled Project',
                description: project.description || idea?.description || 'No description provided.'
              };
            }
            return { 
              ...project, 
              team: team || undefined,
              title: project.title || 'Untitled Project',
              description: project.description || 'No description provided.'
            };
          }
          return {
            ...project,
            title: project.title || 'Untitled Project',
            description: project.description || 'No description provided.'
          };
        })
      );
      setProjects(projectsWithTeams);
    }
  }

  async function loadVotes() {
    if (!user) return;
    const { data } = await supabase
      .from('showcase_votes')
      .select('project_id')
      .eq('voter_id', user.id);
    if (data) {
      setVotedProjects(new Set(data.map(v => v.project_id)));
    }
  }

  async function handleVote(projectId: string) {
    if (!user) return;
    if (votedProjects.has(projectId)) {
      await unvoteShowcase(projectId, user.id);
    } else {
      await voteShowcase(projectId, user.id);
    }
    await loadVotes();
  }

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.showcase_vote_count - a.showcase_vote_count;
    }
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold">
            <span className="text-white">Showcase</span>
          </h1>
          <div className="flex gap-4 items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setSortBy('votes')}
                className={`px-4 py-2 rounded transition-colors ${
                  sortBy === 'votes'
                    ? 'bg-[#6c255f] text-white'
                    : 'bg-[#121212] text-gray-300 hover:bg-[#1a1a1a]'
                }`}
              >
                Most Votes
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-[#6c255f] text-white'
                    : 'bg-[#121212] text-gray-300 hover:bg-[#1a1a1a]'
                }`}
              >
                Most Recent
              </button>
            </div>
            <Link
              href="/submit"
              className="bg-[#8aaafc] hover:bg-[#6b8dd9] text-white px-6 py-2 rounded transition-colors font-semibold"
            >
              Submit Project
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProjects.map((project) => (
            <div
              key={project.id}
              className={`bg-[#121212] border rounded-lg p-6 hover:border-[#8aaafc] transition-all relative ${
                project.is_winner ? 'border-yellow-500 border-2' : 'border-[#6c255f]'
              }`}
            >
              {project.is_winner && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  🏆 {project.winner_category}
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
              {project.team && (
                <p className="text-sm text-gray-400 mb-2">by {project.team.name}</p>
              )}
              <p className="text-gray-300 mb-4 text-sm line-clamp-3">{project.description}</p>

              {project.track && (
                <div className="text-xs text-[#6c255f] font-semibold mb-3">
                  #{project.track}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#0c0c0c] px-2 py-1 rounded hover:bg-[#1a1a1a]"
                  >
                    📦 Repo
                  </a>
                )}
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#0c0c0c] px-2 py-1 rounded hover:bg-[#1a1a1a]"
                  >
                    🚀 Demo
                  </a>
                )}
                {project.video_url && (
                  <a
                    href={project.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#0c0c0c] px-2 py-1 rounded hover:bg-[#1a1a1a]"
                  >
                    🎥 Video
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleVote(project.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                    votedProjects.has(project.id)
                      ? 'bg-[#6c255f] text-white'
                      : 'bg-[#0c0c0c] text-gray-300 hover:bg-[#121212]'
                  }`}
                >
                  <span>🔥</span>
                  <span>{project.showcase_vote_count}</span>
                </button>
                {project.judges_score !== null && (
                  <span className="text-xs text-gray-400">
                    ⭐ {project.judges_score}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No projects yet. Submit the first one! 🎄</p>
          </div>
        )}
      </div>
    </div>
  );
}

