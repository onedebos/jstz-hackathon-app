import qs from 'qs';

export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://mighty-nest-47bf78bca5.strapiapp.com';

type StrapiImage = {
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
};

type StrapiResponse<T> = {
  data: T;
  meta?: any;
};

// Rich text node type (Strapi's rich text format)
export type RichTextNode = {
  type: string;
  children?: RichTextNode[];
  text?: string;
  level?: number;
  format?: string;
  url?: string;
  linkType?: string;
};

export type Prize = {
  id?: number;
  documentId?: string;
  position: string;
  amount: string;
};

export type ScheduleItem = {
  id: number;
  documentId?: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  description?: string | null;
  location_or_link?: string | null;
};

export type Hackathon = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  tagline: string;
  description: RichTextNode[] | string; // Can be rich text array or plain string
  hero_video_url?: string | null;
  start_date: string;
  end_date: string;
  demo_day_date: string; // ISO string
  is_current: boolean;
  prizes: Prize[];
  schedule_items: ScheduleItem[];
};

// Helper to build Strapi query strings
const query = qs.stringify({
  filters: {
    is_current: {
      $eq: true,
    },
  },
  populate: {
    schedule_items: {
      sort: ['date:asc', 'time:asc'],
    },
  },
  pagination: {
    limit: 1,
  },
}, { encodeValuesOnly: true });

// Main function
export async function getCurrentHackathon(): Promise<Hackathon | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/hackathons?${query}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // revalidate every minute (good for live hackathon)
      // cache: 'no-store', // use this during demo day if you need real-time updates
    });

    if (!res.ok) {
      console.error('Strapi fetch failed:', res.status, await res.text());
      return null;
    }

    const json: StrapiResponse<Hackathon[]> = await res.json();

    if (!json.data || json.data.length === 0) {
      console.warn('No current hackathon found (is_current = true)');
      return null;
    }

    const hackathon = json.data[0];

    // Ensure schedule_items is always an array
    const schedule_items = Array.isArray(hackathon.schedule_items)
      ? hackathon.schedule_items
      : [];

    // Ensure prizes is always an array
    const prizes = Array.isArray(hackathon.prizes)
      ? hackathon.prizes
      : [];

    // Ensure description is handled (could be array or string)
    const description = hackathon.description || [];

    return {
      ...hackathon,
      description,
      schedule_items,
      prizes,
    };
  } catch (error) {
    console.error('Error fetching current hackathon:', error);
    return null;
  }
}

// Optional: Get hackathon by slug (useful for future events)
export async function getHackathonBySlug(slug: string): Promise<Hackathon | null> {
  const query = qs.stringify({
    filters: { slug: { $eq: slug } },
    populate: {
      schedule_items: { sort: ['date:asc', 'time:asc'] },
    },
  });

  const res = await fetch(`${STRAPI_URL}/api/hackathons?${query}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const json: StrapiResponse<Hackathon[]> = await res.json();

  if (json.data.length === 0) return null;

  const hackathon = json.data[0];

  // Ensure schedule_items is always an array
  const schedule_items = Array.isArray(hackathon.schedule_items)
    ? hackathon.schedule_items
    : [];

  // Ensure prizes is always an array
  const prizes = Array.isArray(hackathon.prizes)
    ? hackathon.prizes
    : [];

  // Ensure description is handled (could be array or string)
  const description = hackathon.description || [];

  return {
    ...hackathon,
    description,
    schedule_items,
    prizes,
  };
}
