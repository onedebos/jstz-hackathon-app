'use client';

import { useEffect, useState } from 'react';
import { getCurrentHackathon, type ScheduleItem } from '@/lib/strapi';
import { ScheduleLoader } from '@/components/ScheduleLoader';

export default function SchedulePage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [today, setToday] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update today's date periodically to handle day changes
    const interval = setInterval(() => {
      setToday(new Date());
    }, 60000); // Update every minute

    // Load schedule
    getCurrentHackathon().then((hackathon) => {
      if (hackathon?.schedule_items) {
        setScheduleItems(hackathon.schedule_items);
      }
      setLoading(false);
    });

    return () => clearInterval(interval);
  }, []);

  // Check if an item is for today
  function isToday(item: ScheduleItem): boolean {
    if (!item.date) return false;
    const itemDate = new Date(item.date);
    const todayStr = today.toDateString();
    const itemDateStr = itemDate.toDateString();
    return todayStr === itemDateStr;
  }

  if (loading) {
    return <ScheduleLoader />;
  }

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
                  <div className={`border rounded-lg p-6 hover:border-[#8aaafc] transition-all ${
                    isToday(item)
                      ? 'bg-[#6c255f] border-[#8aaafc]'
                      : 'bg-[#121212] border-[#6c255f]'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {item.title}
                      </h3>
                      <div className="text-right">
                        {item.date && (
                          <div className={`text-sm px-3 py-1 rounded mb-1 ${
                            isToday(item)
                              ? 'text-white bg-[#8a3a7a]'
                              : 'text-gray-400 bg-[#0c0c0c]'
                          }`}>
                            📅 {new Date(item.date).toLocaleDateString()}
                          </div>
                        )}
                        {item.time && (
                          <div className={`text-sm px-3 py-1 rounded ${
                            isToday(item)
                              ? 'text-white bg-[#8a3a7a]'
                              : 'text-gray-400 bg-[#0c0c0c]'
                          }`}>
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

