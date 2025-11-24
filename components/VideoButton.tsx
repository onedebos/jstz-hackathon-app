'use client';

import { useState } from 'react';
import { VideoModal } from './VideoModal';

export function VideoButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoId = 'ucflVEa2kzg'; // YouTube video ID

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#6c255f] hover:bg-[#8a3a7a] text-white px-4 py-2 rounded transition-colors font-semibold text-sm flex items-center gap-2 border border-[#6c255f] hover:border-[#8aaafc]"
      >
        <span>▶️</span>
        <span>Watch Video</span>
      </button>
      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoId={videoId}
      />
    </>
  );
}

