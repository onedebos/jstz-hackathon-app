'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  team_id: string;
  title: string;
  description: string;
  repo_url: string;
  demo_url: string;
  video_url: string;
  presentation_url: string;
  track: string;
  showcase_vote_count: number;
  judge_vote_count: number;
  judges_score: number;
  is_winner: boolean;
  winner_category: string;
  submitted_at: string;
  team?: { 
    name: string;
    idea?: {
      id: string;
      title: string;
      description: string;
    };
  };
}

export default function ShowcasePage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('showcase-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadProjects() {
    // Load all projects
    let query = supabase
      .from('projects')
      .select('*')
      .order('judge_vote_count', { ascending: false });

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

  // Sort: winners first (Hacker's Choice, 2nd, 3rd), then others by judge vote count
  const sortedProjects = [...projects].sort((a, b) => {
    // Winners first
    if (a.is_winner && !b.is_winner) return -1;
    if (!a.is_winner && b.is_winner) return 1;
    
    // Among winners, sort by category
    if (a.is_winner && b.is_winner) {
      const order = ["Hacker's Choice", 'Second Place', 'Third Place'];
      const aIndex = order.indexOf(a.winner_category);
      const bIndex = order.indexOf(b.winner_category);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }
    
    // Among non-winners, sort by judge vote count
    return (b.judge_vote_count || 0) - (a.judge_vote_count || 0);
  });

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">Showcase</span>
          </h1>
          <p className="text-gray-400 text-lg">
            All submitted projects. Winners are highlighted with trophies.
          </p>
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
              {project.is_winner && project.winner_category === "Hacker's Choice" && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  🏆 Hacker's Choice
                </div>
              )}
              {project.is_winner && project.winner_category === 'Second Place' && (
                <div className="absolute -top-3 -right-3 bg-gray-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                  🥈 Second Place
                </div>
              )}
              {project.is_winner && project.winner_category === 'Third Place' && (
                <div className="absolute -top-3 -right-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  🥉 Third Place
                </div>
              )}

              {project.team?.idea?.title && (
                <h2 className="text-2xl font-bold text-white mb-3">{project.team.idea.title}</h2>
              )}
              {project.team && (
                <p className="text-sm text-gray-400 mb-3">by {project.team.name}</p>
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
                {project.presentation_url && (
                  <a
                    href={project.presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#0c0c0c] px-2 py-1 rounded hover:bg-[#1a1a1a]"
                  >
                    📋 Presentation
                  </a>
                )}
              </div>

              {project.judge_vote_count > 0 && (
                <div className="text-sm text-gray-400 mt-4">
                  <span className="text-[#8aaafc] font-semibold">{project.judge_vote_count}</span> judge points
                </div>
              )}
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No projects submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

