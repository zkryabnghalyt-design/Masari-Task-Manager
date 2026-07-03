import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface Track {
  id: string;
  name: string;
  emoji: string;
  url: string;
}

const TRACKS: Track[] = [
  {
    id: 'lofi',
    name: 'Cozy Lofi Beats',
    emoji: '🎧',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Stable public MP3
  },
  {
    id: 'rain',
    name: 'Deep Forest Rain',
    emoji: '🌧️',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Stable public MP3
  },
  {
    id: 'cafe',
    name: 'Jazz Cafe Ambience',
    emoji: '☕',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', // Stable public MP3
  }
];

export default function Soundscapes() {
  const [activeTrackId, setActiveTrackId] = useState<string>('lofi');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create new audio element on load/track change
    const activeTrack = TRACKS.find(t => t.id === activeTrackId);
    if (!activeTrack) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(activeTrack.url);
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    if (isPlaying) {
      audio.play().catch(err => console.warn('Audio play interrupted:', err));
    }

    return () => {
      audio.pause();
    };
  }, [activeTrackId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Audio playback failed:', err));
    }
  };

  const selectTrack = (trackId: string) => {
    setActiveTrackId(trackId);
    // Auto-play when switched
    setIsPlaying(true);
  };

  return (
    <div id="soundscapes-widget" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1 bg-blue-50 text-blue-600 rounded-lg"><Music className="w-4 h-4" /></span>
            Focus Soundscapes Loop Player
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Keep your brain in high performance mode with soothing custom lofi beats.
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-3">
          {isPlaying && (
            <div className="flex gap-1 items-center h-4 px-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  animate={{ height: [4, 16, 4] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-0.75 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          )}

          <button
            type="button"
            id="soundscapes-play-pause-btn"
            onClick={handlePlayPause}
            className={`p-2.5 rounded-full font-bold transition-all flex items-center justify-center cursor-pointer ${
              isPlaying 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-100' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
        {TRACKS.map((track) => {
          const isActive = track.id === activeTrackId;
          return (
            <button
              key={track.id}
              type="button"
              id={`soundscapes-track-${track.id}`}
              onClick={() => selectTrack(track.id)}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-200 bg-blue-50/40 text-blue-800 font-bold'
                  : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
              }`}
            >
              <span className="text-xl">{track.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate font-bold">{track.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">
                  {isActive && isPlaying ? 'Playing loop' : 'Click to load'}
                </p>
              </div>
              {isActive && isPlaying && <Flame className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Volume Bar */}
      <div className="flex items-center gap-2.5 mt-4 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
        <button
          type="button"
          id="soundscapes-mute-btn"
          onClick={() => setIsMuted(!isMuted)}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            setVolume(Number(e.target.value));
            setIsMuted(false);
          }}
          className="w-24 accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-mono text-slate-400 font-bold">
          {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
        </span>
      </div>
    </div>
  );
}
