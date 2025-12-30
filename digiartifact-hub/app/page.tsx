import React from 'react';
import Reliquary from '@/components/Reliquary';

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative">
      {/* Background Ambience - Subtle Void Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80" />
      
      {/* The Main Artifact: The Circle of 13 */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Reliquary />
      </div>
    </main>
  );
}