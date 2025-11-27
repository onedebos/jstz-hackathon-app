'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { togglePhase, lockIdea, deleteIdea, setJudgesScore, revealWinners, deleteFeedback } from '@/app/actions';

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

interface Feedback {
  id: string;
  user_id: string;
  project_id: string | null;
  category: string;
  description: string;
  severity: string | null;
  created_at: string;
  user?: { name: string };
  project?: { title: string };
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [judgeScores, setJudgeScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    if (authenticated) {
      loadPhases();
      loadIdeas();
      loadProjects();
      loadFeedback();
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

  async function loadFeedback() {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Load user names and project titles
      const feedbackWithDetails = await Promise.all(
        data.map(async (fb) => {
          let user = undefined;
          let project = undefined;
          
          if (fb.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', fb.user_id)
              .single();
            user = userData || undefined;
          }
          
          if (fb.project_id) {
            const { data: projectData } = await supabase
              .from('projects')
              .select('title')
              .eq('id', fb.project_id)
              .single();
            project = projectData || undefined;
          }
          
          return { ...fb, user, project };
        })
      );
      
      setFeedback(feedbackWithDetails);
    }
  }

  async function handleTogglePhase(phaseName: string, currentValue: boolean) {
    try {
      await togglePhase(phaseName, !currentValue);
      await loadPhases();
    } catch (error) {
      console.error('Error toggling phase:', error);
      alert('Failed to toggle phase. Check console for details.');
    }
  }

  async function handleLockIdea(ideaId: string) {
    await lockIdea(ideaId);
    await loadIdeas();
  }

  async function handleDeleteIdea(ideaId: string) {
    if (confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      try {
        await deleteIdea(ideaId);
        await loadIdeas();
      } catch (error) {
        console.error('Error deleting idea:', error);
        alert('Failed to delete idea. Check console for details.');
      }
    }
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

  async function handleDeleteFeedback(feedbackId: string) {
    if (confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteFeedback(feedbackId);
        await loadFeedback();
      } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Failed to delete feedback.');
      }
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      docs: '📚 Documentation',
      apis: '🔌 APIs',
      tooling: '🛠️ Tooling',
      dx: '✨ Developer Experience',
      bugs: '🐛 Bugs',
      feature_request: '💡 Feature Request',
      other: '📋 Other',
    };
    return labels[category] || category;
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    const badges: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-green-600', label: '🟢 Low' },
      medium: { color: 'bg-yellow-600', label: '🟡 Medium' },
      high: { color: 'bg-orange-600', label: '🟠 High' },
      critical: { color: 'bg-red-600', label: '🔴 Critical' },
    };
    const badge = badges[severity];
    return badge ? (
      <span className={`${badge.color} text-white text-xs px-2 py-1 rounded`}>
        {badge.label}
      </span>
    ) : null;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-16 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin}>
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-[#0c0c0c] border border-gray-700 rounded px-4 py-3 pr-12 text-white focus:border-[#8aaafc] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
          <p className="text-gray-400 text-sm mb-4">
            Toggle phases to manually override date-based checks. Phases override dates when set.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phases.map((phase) => (
              <div 
                key={phase.phase_name} 
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  phase.is_open
                    ? 'bg-green-900/20 border-green-600'
                    : 'bg-gray-900/20 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phase.is_open ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-white font-medium capitalize">
                    {phase.phase_name.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePhase(phase.phase_name, phase.is_open)}
                  className={`px-6 py-2 rounded transition-colors font-semibold ${
                    phase.is_open
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {phase.is_open ? '✓ Open' : '✗ Closed'}
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
                <div className="flex gap-2">
                  {!idea.is_locked && (
                    <button
                      onClick={() => handleLockIdea(idea.id)}
                      className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-4 py-1 rounded text-sm"
                    >
                      Lock
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
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

        {/* Feedback */}
        <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Feedback ({feedback.length})
          </h2>
          {feedback.length === 0 ? (
            <p className="text-gray-400">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-[#0c0c0c] p-4 rounded-lg border border-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm bg-[#6c255f] text-white px-2 py-1 rounded">
                          {getCategoryLabel(fb.category)}
                        </span>
                        {getSeverityBadge(fb.severity)}
                        {fb.project && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            📦 {fb.project.title}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-2">{fb.description}</p>
                      <div className="text-xs text-gray-500">
                        {fb.user?.name && <span>By {fb.user.name} • </span>}
                        {new Date(fb.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

