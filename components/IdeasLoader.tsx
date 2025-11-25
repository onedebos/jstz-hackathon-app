'use client';

import { motion } from 'framer-motion';

export function IdeasLoader() {
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              className="bg-[#121212] border border-[#6c255f] rounded-lg p-6 overflow-hidden relative flex flex-col h-full"
              style={{
                transitionDelay: `${index * 0.1}s`,
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6c255f]/20 to-transparent"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
              />

              {/* Header skeleton */}
              <div className="shrink-0 mb-4">
                <div className="h-5 bg-[#0c0c0c] rounded mb-2 w-3/4" />
                <div className="h-4 bg-[#0c0c0c] rounded w-1/2" />
              </div>

              {/* Content skeleton */}
              <div className="space-y-2 mb-4 grow">
                <div className="h-4 bg-[#0c0c0c] rounded w-full" />
                <div className="h-4 bg-[#0c0c0c] rounded w-5/6" />
                <div className="h-4 bg-[#0c0c0c] rounded w-4/6" />
              </div>

              {/* Footer skeleton */}
              <div className="flex items-center justify-between mt-auto">
                <div className="h-9 bg-[#0c0c0c] rounded w-20" />
                <div className="h-5 bg-[#0c0c0c] rounded w-16" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

