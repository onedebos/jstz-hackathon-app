'use client';

import { useEffect, useState } from 'react';

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 10 + Math.random() * 10,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white opacity-60"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animation: `snowfall ${flake.duration}s linear infinite`,
              fontSize: `${flake.size}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}

