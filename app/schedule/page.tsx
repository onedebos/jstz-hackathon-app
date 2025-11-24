import { getCurrentHackathon, type ScheduleItem } from '@/lib/strapi';

export default async function SchedulePage() {
  const hackathon = await getCurrentHackathon();
  const scheduleItems: ScheduleItem[] = hackathon?.schedule_items || [];

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-white">Schedule</span>
        </h1>

        {scheduleItems.length === 0 ? (
          <div className="text-center text-gray-400">
            <p className="text-xl">No schedule items yet. Check back soon! 🎄</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#6c255f]"></div>

              {scheduleItems.map((item, index) => (
                <div key={item.id || index} className="relative mb-8 pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 bg-[#8aaafc] rounded-full border-2 border-[#0c0c0c]"></div>

                  {/* Content card */}
                  <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 hover:border-[#8aaafc] transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {item.title}
                      </h3>
                      <div className="text-right">
                        {item.date && (
                          <div className="text-sm text-gray-400 bg-[#0c0c0c] px-3 py-1 rounded mb-1">
                            📅 {new Date(item.date).toLocaleDateString()}
                          </div>
                        )}
                        {item.time && (
                          <div className="text-sm text-gray-400 bg-[#0c0c0c] px-3 py-1 rounded">
                            🕐 {item.time}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-gray-300 mb-3">{item.description}</p>
                    )}
                    {item.location_or_link && (
                      <p className="text-sm text-gray-400">
                        📍{' '}
                        {item.location_or_link.startsWith('http') ? (
                          <a
                            href={item.location_or_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8aaafc] hover:underline"
                          >
                            {item.location_or_link}
                          </a>
                        ) : (
                          item.location_or_link
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

