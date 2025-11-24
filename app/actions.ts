'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Ideas
export async function submitIdea(title: string, description: string, userId: string) {
  const { data, error } = await supabase
    .from('ideas')
    .insert({ title, description, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/ideas');
  return data;
}

export async function voteIdea(ideaId: string, userId: string) {
  const { error } = await supabase
    .from('idea_votes')
    .insert({ idea_id: ideaId, user_id: userId });

  if (error && error.code !== '23505') throw error; // Ignore duplicate vote
  revalidatePath('/ideas');
}

export async function unvoteIdea(ideaId: string, userId: string) {
  const { error } = await supabase
    .from('idea_votes')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', userId);

  if (error) throw error;
  revalidatePath('/ideas');
}

// Teams
export async function createTeam(name: string, description: string, userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, description, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  // Add leader as member
  await supabase
    .from('team_members')
    .insert({ team_id: data.id, user_id_uuid: userId });

  revalidatePath('/teams');
  return data;
}

export async function joinTeam(teamId: string, userId: string) {
  const { error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, user_id_uuid: userId });

  if (error && error.code !== '23505') throw error; // Ignore duplicate join
  revalidatePath('/teams');
}

export async function leaveTeam(teamId: string, userId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id_uuid', userId);

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
  track: string
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
    .insert({ project_id: projectId, user_id: userId });

  if (error && error.code !== '23505') throw error;
  revalidatePath('/showcase');
}

export async function unvoteShowcase(projectId: string, userId: string) {
  const { error } = await supabase
    .from('showcase_votes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
  revalidatePath('/showcase');
}

// Admin
export async function togglePhase(phaseName: string, isOpen: boolean) {
  const { error } = await supabase
    .from('admin_phases')
    .upsert({ phase_name: phaseName, is_open: isOpen, updated_at: new Date().toISOString() });

  if (error) throw error;
  revalidatePath('/admin');
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

