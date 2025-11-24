import Link from 'next/link';
import { Countdown } from '@/components/Countdown';
import { Snowfall } from '@/components/Snowfall';
import { getCurrentHackathon } from '@/lib/strapi';
import { renderRichText } from '@/lib/strapi-utils';

export default async function Home() {
  const hackathon = await getCurrentHackathon().catch(() => null);

  return (
    <div className="relative min-h-screen bg-[#0c0c0c]">
      <Snowfall />
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-12 md:mt-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="font-mono text-white">js</span>
            <span className="text-[#6c255f]">{'{'}</span>
            <span className="font-mono text-white">tz</span>
            <span className="text-[#6c255f]">{'}'}</span>
            <span className="text-white"> the season </span>
            <span>🌲🧑‍🎄</span>
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="text-white">Hackathon</span>{' '}
            <span className="text-[#6c255f]">2025</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Build the future. Create something amazing. Win prizes. 🎄✨
          </p>
          
          {/* Countdown */}
          <div className="mb-12 flex justify-center">
            <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
              <h2 className="text-2xl mb-4 text-white">Starts in:</h2>
              <Countdown />
            </div>
          </div>

          {/* Christmas decorations */}
          <div className="flex justify-center gap-4 mb-8">
            <span className="text-4xl tree">🎄</span>
            <span className="text-4xl">❄️</span>
            <span className="text-4xl">🎁</span>
            <span className="text-4xl tree">🎄</span>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link
            href="/schedule"
            className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-xl font-bold text-white mb-2">Schedule</h3>
            <p className="text-gray-400 text-sm">View the hackathon timeline</p>
          </Link>

          <Link
            href="/ideas"
            className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-white transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-bold text-white mb-2">Ideas</h3>
            <p className="text-gray-400 text-sm">Submit and vote on ideas</p>
          </Link>

          <Link
            href="/teams"
            className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-white transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Teams</h3>
            <p className="text-gray-400 text-sm">Create or join a team</p>
          </Link>

          <Link
            href="/showcase"
            className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-white transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Showcase</h3>
            <p className="text-gray-400 text-sm">View all projects</p>
          </Link>
        </div>

        {/* Hackathon Info */}
        {hackathon && (
          <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-8">
            <h2 className="text-3xl font-bold text-white mb-4">{hackathon.title}</h2>
            {hackathon.tagline && (
              <p className="text-xl text-[#6c255f] mb-6">{hackathon.tagline}</p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Description Column */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">About</h3>
                {hackathon.description && (
                  <div className="text-gray-300 prose prose-invert max-w-none">
                    {Array.isArray(hackathon.description)
                      ? renderRichText(hackathon.description)
                      : hackathon.description}
                  </div>
                )}
              </div>
              
              {/* Prizes Column */}
              {hackathon.prizes && hackathon.prizes.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Prizes 🏆</h3>
                  <div className="space-y-4">
                    {hackathon.prizes.map((prize) => (
                      <div key={prize.id || prize.documentId || prize.position} className="bg-[#0c0c0c] border border-[#6c255f] rounded p-4">
                        <div className="text-sm text-gray-400 mb-1">{prize.position}</div>
                        <div className="text-xl font-bold text-white">{prize.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
