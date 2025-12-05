import { supabase } from './supabase';

export type PhaseName = 
  | 'ideas_open'
  | 'ideas_voting'
  | 'teams_open'
  | 'submissions_open'
  | 'showcase_voting'
  | 'winners_revealed';

interface Phase {
  phase_name: PhaseName;
  is_open: boolean;
}

// Cache for phase states (refreshed periodically)
let phaseCache: Map<PhaseName, boolean> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function getPhaseState(phaseName: PhaseName): Promise<boolean> {
  const now = Date.now();
  
  // Use cache if it's fresh
  if (phaseCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return phaseCache.get(phaseName) ?? false;
  }

  // Fetch from database
  try {
    const { data, error } = await supabase
      .from('admin_phases')
      .select('phase_name, is_open')
      .eq('phase_name', phaseName)
      .single();

    if (error || !data) {
      // If phase doesn't exist, return false
      return false;
    }

    // Update cache
    if (!phaseCache) {
      phaseCache = new Map();
    }
    phaseCache.set(phaseName, data.is_open);
    cacheTimestamp = now;

    return data.is_open;
  } catch (error) {
    console.error('Error fetching phase state:', error);
    return false;
  }
}

export async function getAllPhases(): Promise<Map<PhaseName, boolean>> {
  const now = Date.now();
  
  // Use cache if it's fresh
  if (phaseCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return phaseCache;
  }

  // Fetch all phases
  try {
    const { data, error } = await supabase
      .from('admin_phases')
      .select('phase_name, is_open');

    if (error || !data) {
      return new Map();
    }

    // Update cache
    phaseCache = new Map();
    data.forEach((phase: Phase) => {
      phaseCache!.set(phase.phase_name, phase.is_open);
    });
    cacheTimestamp = now;

    return phaseCache;
  } catch (error) {
    console.error('Error fetching phases:', error);
    return new Map();
  }
}

// Helper to check if a feature is open (checks phase OR date-based logic)
export async function isFeatureOpen(
  phaseName: PhaseName,
  dateCheck: () => boolean
): Promise<boolean> {
  const phaseOpen = await getPhaseState(phaseName);
  
  // If phase is explicitly set to true, use it (override dates)
  if (phaseOpen) {
    return true; // Phase override: open
  }
  
  // If phase is false or doesn't exist, check the date
  // This allows date-based opening even if phase is set to false
  return dateCheck();
}

// Clear cache (useful after admin updates)
export function clearPhaseCache() {
  phaseCache = null;
  cacheTimestamp = 0;
}

