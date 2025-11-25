'use client';

import { motion } from 'framer-motion';

export function ScheduleLoader() {
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear' as const,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="h-12 bg-[#121212] rounded w-64 mx-auto" />
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#6c255f]"></div>

            {[1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                className="relative mb-8 pl-20"
                style={{
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 w-4 h-4 bg-[#8aaafc] rounded-full border-2 border-[#0c0c0c]"></div>

                {/* Content card skeleton */}
                <div className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 overflow-hidden relative">
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6c255f]/20 to-transparent"
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div className="h-7 bg-[#0c0c0c] rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-6 bg-[#0c0c0c] rounded w-32" />
                      <div className="h-6 bg-[#0c0c0c] rounded w-24" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-4 bg-[#0c0c0c] rounded w-full" />
                    <div className="h-4 bg-[#0c0c0c] rounded w-5/6" />
                  </div>
                  <div className="h-4 bg-[#0c0c0c] rounded w-1/3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

