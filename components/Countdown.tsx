'use client';

import { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2025-12-05T14:00:00+00:00'); // 5 Dec 2025 14:00 UK

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = TARGET_DATE.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{timeLeft.days}</div>
        <div className="text-xs text-gray-400">Days</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{timeLeft.hours}</div>
        <div className="text-xs text-gray-400">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-400">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-400">Seconds</div>
      </div>
    </div>
  );
}

