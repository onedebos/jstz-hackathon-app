'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Use supabaseAdmin for server actions (bypasses RLS)
const supabase = supabaseAdmin;

// Ideas
export async function submitIdea(title: string, description: string, userId: string) {
  const { data, error } = await supabase
    .from('ideas')
    .insert({ title, description, author_id: userId })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/ideas');
  return data;
}

export async function voteIdea(ideaId: string, userId: string) {
  const { error } = await supabase
    .from('idea_votes')
    .insert({ idea_id: ideaId, voter_id: userId });

  if (error && error.code !== '23505') throw error; // Ignore duplicate vote
  revalidatePath('/ideas');
}

export async function unvoteIdea(ideaId: string, userId: string) {
  // Delete only one vote (the most recent one)
  const { data, error: selectError } = await supabase
    .from('idea_votes')
    .select('id')
    .eq('idea_id', ideaId)
    .eq('voter_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (selectError || !data) {
    throw selectError || new Error('No vote found to remove');
  }

  const { error } = await supabase
    .from('idea_votes')
    .delete()
    .eq('id', data.id);

  if (error) throw error;
  revalidatePath('/ideas');
}

export async function setUserVoteCount(ideaId: string, userId: string, targetCount: number) {
  // Clamp target between 0 and 5
  const clampedTarget = Math.max(0, Math.min(5, targetCount));
  
  // Get current vote count for this user on this idea
  const { data: currentVotes, error: countError } = await supabase
    .from('idea_votes')
    .select('id')
    .eq('idea_id', ideaId)
    .eq('voter_id', userId);

  if (countError) throw countError;

  const currentCount = currentVotes?.length || 0;
  const diff = clampedTarget - currentCount;

  if (diff > 0) {
    // Add votes
    const votesToAdd = Array.from({ length: diff }, () => ({
      idea_id: ideaId,
      voter_id: userId,
    }));
    const { error } = await supabase.from('idea_votes').insert(votesToAdd);
    if (error) throw error;
  } else if (diff < 0) {
    // Remove votes (most recent first)
    const votesToRemove = currentVotes!.slice(0, Math.abs(diff)).map(v => v.id);
    const { error } = await supabase
      .from('idea_votes')
      .delete()
      .in('id', votesToRemove);
    if (error) throw error;
  }

  revalidatePath('/ideas');
  return { currentCount: clampedTarget };
}

// Teams
export async function createTeam(name: string, description: string, userId: string, ideaId: string) {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, description, leader_id: userId, idea_id: ideaId })
    .select()
    .single();

  if (error) throw error;

  // Add leader as member
  await supabase
    .from('team_members')
    .insert({ team_id: data.id, user_id: userId });

  revalidatePath('/teams');
  return data;
}

export async function joinTeam(teamId: string, userId: string) {
  const { error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, user_id: userId });

  if (error && error.code !== '23505') throw error; // Ignore duplicate join
  revalidatePath('/teams');
}

export async function leaveTeam(teamId: string, userId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
  revalidatePath('/teams');
}

// Projects
export async function submitProject(
  teamId: string,
  title: string,
  description: string,
  repoUrl: string,
  demoUrl: string,
  videoUrl: string,
  track: string,
  presentationUrl: string
) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      team_id: teamId,
      title,
      description,
      repo_url: repoUrl,
      demo_url: demoUrl,
      video_url: videoUrl,
      track,
      presentation_url: presentationUrl,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/showcase');
  return data;
}

export async function voteShowcase(projectId: string, userId: string) {
  const { error } = await supabase
    .from('showcase_votes')
    .insert({ project_id: projectId, voter_id: userId });

  if (error && error.code !== '23505') throw error;
  revalidatePath('/showcase');
}

export async function unvoteShowcase(projectId: string, userId: string) {
  const { error } = await supabase
    .from('showcase_votes')
    .delete()
    .eq('project_id', projectId)
    .eq('voter_id', userId);

  if (error) throw error;
  revalidatePath('/showcase');
}

// Feedback
export async function submitFeedback(
  userId: string,
  category: string,
  description: string,
  severity: string | null,
  projectId: string | null = null
) {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      project_id: projectId,
      category,
      description,
      severity,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/admin');
  return data;
}

export async function deleteFeedback(feedbackId: string) {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', feedbackId);

  if (error) throw error;
  revalidatePath('/admin');
}

// Admin
export async function togglePhase(phaseName: string, isOpen: boolean) {
  const { error } = await supabase
    .from('admin_phases')
    .update({ is_open: isOpen, updated_at: new Date().toISOString() })
    .eq('phase_name', phaseName);

  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/ideas');
  revalidatePath('/teams');
  revalidatePath('/submit');
  revalidatePath('/showcase');
}

export async function lockIdea(ideaId: string) {
  const { error } = await supabase
    .from('ideas')
    .update({ is_locked: true })
    .eq('id', ideaId);

  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/ideas');
}

export async function deleteIdea(ideaId: string) {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId);

  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/ideas');
}

export async function setJudgesScore(projectId: string, score: number) {
  const { error } = await supabase
    .from('projects')
    .update({ judges_score: score })
    .eq('id', projectId);

  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/showcase');
}

export async function revealWinners() {
  // Get top projects by judges score
  const { data: topJudges } = await supabase
    .from('projects')
    .select('*')
    .order('judges_score', { ascending: false })
    .limit(3);

  // Get top project by showcase votes
  const { data: topShowcase } = await supabase
    .from('projects')
    .select('*')
    .order('showcase_vote_count', { ascending: false })
    .limit(1);

  // Mark winners
  if (topJudges) {
    for (let i = 0; i < topJudges.length; i++) {
      await supabase
        .from('projects')
        .update({
          is_winner: true,
          winner_category: i === 0 ? 'First Place' : i === 1 ? 'Second Place' : 'Third Place',
        })
        .eq('id', topJudges[i].id);
    }
  }

  if (topShowcase && topShowcase[0]) {
    await supabase
      .from('projects')
      .update({ is_winner: true, winner_category: "Hacker's Choice" })
      .eq('id', topShowcase[0].id);
  }

  await togglePhase('winners_revealed', true);
  revalidatePath('/admin');
  revalidatePath('/showcase');
}

