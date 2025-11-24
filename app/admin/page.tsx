'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { togglePhase, lockIdea, setJudgesScore, revealWinners } from '@/app/actions';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

interface Phase {
  phase_name: string;
  is_open: boolean;
}

interface Idea {
  id: string;
  title: string;
  vote_count: number;
  is_locked: boolean;
}

interface Project {
  id: string;
  title: string;
  judges_score: number;
  showcase_vote_count: number;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [judgeScores, setJudgeScores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authenticated) {
      loadPhases();
      loadIdeas();
      loadProjects();
    }
  }, [authenticated]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      alert('Admin password not configured. Please set NEXT_PUBLIC_ADMIN_PASSWORD in your environment variables.');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  }

  async function loadPhases() {
    const { data } = await supabase
      .from('admin_phases')
      .select('*')
      .order('phase_name');
    if (data) setPhases(data);
  }

  async function loadIdeas() {
    const { data } = await supabase
      .from('ideas')
      .select('id, title, vote_count, is_locked')
      .order('vote_count', { ascending: false });
    if (data) setIdeas(data);
  }

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, title, judges_score, showcase_vote_count')
      .order('submitted_at', { ascending: false });
    if (data) {
      setProjects(data);
      const scores: Record<string, string> = {};
      data.forEach((p) => {
        if (p.judges_score !== null) {
          scores[p.id] = p.judges_score.toString();
        }
      });
      setJudgeScores(scores);
    }
  }

  async function handleTogglePhase(phaseName: string, currentValue: boolean) {
    await togglePhase(phaseName, !currentValue);
    await loadPhases();
  }

  async function handleLockIdea(ideaId: string) {
    await lockIdea(ideaId);
    await loadIdeas();
  }

  async function handleSetScore(projectId: string, score: string) {
    const numScore = parseFloat(score);
    if (!isNaN(numScore)) {
      await setJudgesScore(projectId, numScore);
      await loadProjects();
    }
  }

  async function handleRevealWinners() {
    if (confirm('Are you sure you want to reveal winners? This action cannot be undone.')) {
      await revealWinners();
      await loadProjects();
      alert('Winners revealed!');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-16 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-3 mb-4 text-white focus:border-[#8aaafc] focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-6 py-3 rounded transition-colors font-bold"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-white">Admin Panel</span>
        </h1>

        {/* Phase Controls */}
        <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Phase Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phases.map((phase) => (
              <div key={phase.phase_name} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">
                  {phase.phase_name.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => handleTogglePhase(phase.phase_name, phase.is_open)}
                  className={`px-4 py-2 rounded transition-colors ${
                    phase.is_open
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {phase.is_open ? 'Open' : 'Closed'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top Ideas */}
        <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Top Ideas</h2>
          <div className="space-y-2">
            {ideas.slice(0, 10).map((idea) => (
              <div
                key={idea.id}
                className="flex items-center justify-between bg-[#0c0c0c] p-3 rounded"
              >
                <div className="flex-1">
                  <span className="text-gray-300">{idea.title}</span>
                  <span className="text-sm text-gray-500 ml-2">({idea.vote_count} votes)</span>
                  {idea.is_locked && (
                    <span className="text-xs bg-[#6c255f] text-white px-2 py-1 rounded ml-2">
                      🔒 Locked
                    </span>
                  )}
                </div>
                {!idea.is_locked && (
                  <button
                    onClick={() => handleLockIdea(idea.id)}
                    className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-4 py-1 rounded text-sm"
                  >
                    Lock
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Judges Scoring */}
        <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Judges Scoring</h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 bg-[#0c0c0c] p-3 rounded"
              >
                <div className="flex-1">
                  <span className="text-gray-300">{project.title}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({project.showcase_vote_count} votes)
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={judgeScores[project.id] || ''}
                  onChange={(e) => {
                    setJudgeScores({ ...judgeScores, [project.id]: e.target.value });
                  }}
                  onBlur={() => handleSetScore(project.id, judgeScores[project.id] || '0')}
                  placeholder="Score"
                  className="w-24 bg-[#121212] border border-gray-700 rounded px-3 py-1 text-white focus:border-[#8aaafc] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reveal Winners */}
        <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Winners</h2>
          <button
            onClick={handleRevealWinners}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded font-bold transition-colors"
          >
            🏆 Reveal Winners
          </button>
        </div>
      </div>
    </div>
  );
}

