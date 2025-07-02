import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onLoadingComplete, duration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showScreen, setShowScreen] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play sound when loading screen appears
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set volume to 50%
      audioRef.current.play().catch(error => {
        // Browser might block autoplay, log error but continue
        console.error("Audio autoplay failed:", error);
      });
    }

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    // Hide screen after duration
    const timer = setTimeout(() => {
      setShowScreen(false);
      if (onLoadingComplete) onLoadingComplete();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      // Stop audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [duration, onLoadingComplete]);

  if (!showScreen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
    >
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        src="/assets/casino-intro.mp3"
        preload="auto"
      />

      <div className="w-full max-w-2xl px-4">
        <div className="relative">
          {/* Main Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              rotateY: [0, 180, 360],
            }}
            transition={{ 
              duration: 2,
              rotateY: {
                repeat: Infinity,
                duration: 10,
                ease: "linear",
              }
            }}
            className="w-full flex justify-center mb-12"
          >
            <img 
              src="/assets/new-logo.png" 
              alt="Project Shadow Casino Logo" 
              className="max-w-full h-auto drop-shadow-[0_0_25px_rgba(128,0,128,0.7)]"
              style={{ maxHeight: "280px" }}
            />
          </motion.div>

          {/* Floating Roulette Wheels Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: Math.random() * 100 - 50, 
                  y: Math.random() * 100 - 50,
                  opacity: 0,
                  scale: 0.2
                }}
                animate={{ 
                  x: [
                    Math.random() * 300 - 150,
                    Math.random() * 300 - 150,
                    Math.random() * 300 - 150
                  ],
                  y: [
                    Math.random() * 300 - 150,
                    Math.random() * 300 - 150,
                    Math.random() * 300 - 150
                  ],
                  opacity: [0, 0.7, 0],
                  scale: [0.2, 0.6, 0.2],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  left: `${50 + (Math.random() * 40 - 20)}%`,
                  top: `${50 + (Math.random() * 40 - 20)}%`,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-red-600/20 backdrop-blur-sm border border-white/20 shadow-[0_0_15px_rgba(255,0,0,0.4)]"></div>
              </motion.div>
            ))}
          </div>

          {/* Animated Casino Text */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(128,0,255,0.7)]">
              PROJECT SHADOW CASINO
            </h1>
            <p className="text-purple-300 text-lg md:text-xl">
              Prepare for the ultimate gaming experience
            </p>
          </motion.div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-gray-800/60 rounded-full h-4 mb-6 overflow-hidden backdrop-blur-sm border border-purple-500/30">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>

          {/* Animated Loading Text */}
          <motion.div 
            className="text-center text-white/80 flex items-center justify-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span>Loading your fortune</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.9 }}
            >.</motion.span>
          </motion.div>
        </div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.2,
              scale: Math.random() * 0.3 + 0.1
            }}
            animate={{ 
              y: [null, -Math.random() * 500 - 100],
              opacity: [null, 0],
            }}
            transition={{ 
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "loop"
            }}
            style={{
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              background: `rgba(${Math.random() * 100 + 155}, ${Math.random() * 50}, ${Math.random() * 255}, ${Math.random() * 0.5 + 0.5})`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}