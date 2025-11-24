# {jstz} Hackathon Platform

A complete internal hackathon platform built with Next.js 15, Tailwind CSS, and Supabase.

## About Jstz

**Jstz** (pronounced: "justice") is a JavaScript runtime powered by Tezos Smart Optimistic Rollups that is built in Rust.

## Features

- 🎄 **Festive Christmas Theme** - Dark mode with subtle snow effects
- 📅 **Schedule Timeline** - Beautiful timeline from Strapi CMS
- 💡 **Ideas Board** - Submit and vote on hackathon ideas
- 👥 **Team Management** - Create and join teams with real-time updates
- 🚀 **Project Submission** - Submit projects with links and descriptions
- 🏆 **Showcase** - View all projects with Hacker's Choice voting
- 🔐 **Admin Panel** - Password-protected admin controls

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Strapi Configuration
STRAPI_URL=https://your-strapi-url.up.railway.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to `.env.local`

### 4. Strapi Setup

1. Deploy your Strapi instance (or use the existing one)
2. Create a `hackathons` content type with:
   - `is_current` (Boolean)
   - `title` (Text)
   - `description` (Text)
   - `schedule_items` (Relation to `schedule_items`)
3. Create a `schedule_items` content type with:
   - `title` (Text)
   - `description` (Text)
   - `time` (DateTime)
   - `location` (Text)
4. Add your Strapi URL to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

## Admin Access

- URL: `/admin`
- Password: `jstz2025magic`

## Project Structure

```
app/
  ├── page.tsx          # Landing page with countdown
  ├── schedule/         # Timeline from Strapi
  ├── ideas/            # Idea submission & voting
  ├── teams/            # Team management
  ├── submit/           # Project submission (opens Dec 1)
  ├── showcase/         # Project grid with voting
  └── admin/            # Admin panel

components/
  ├── Logo.tsx          # {jstz} logo component
  ├── Countdown.tsx     # Countdown to hackathon start
  ├── Snowfall.tsx      # Animated snow effect
  └── Nav.tsx           # Navigation bar

lib/
  ├── strapi.ts         # Strapi API integration
  ├── supabase.ts       # Supabase client
  └── utils.ts          # Utility functions

app/actions.ts          # Server actions for mutations
supabase-schema.sql     # Database schema
```

## Branding

- **Colors**: Purple `#6c255f`, Blue `#8aaafc`, Dark backgrounds `#0c0c0c` / `#121212`
- **Logo**: `{jstz}` with curly braces in purple and "jstz" in monospace blue
- **Theme**: Dark mode only with festive Christmas accents

## Deployment

The platform is ready to deploy on Vercel, Netlify, or any Next.js-compatible hosting.

Make sure to set all environment variables in your hosting platform's environment settings.
