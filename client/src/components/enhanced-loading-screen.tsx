import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Howl } from "howler";

// Create sound effects
const sounds = {
  background: new Howl({
    src: ['/assets/casino-intro.mp3'], // We'll create this sound file
    volume: 0.4,
    loop: true,
    preload: true,
  }),
  jackpot: new Howl({
    src: ['/assets/jackpot.mp3'], // We'll create this sound file
    volume: 0.5,
    preload: true,
  })
};

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export function EnhancedLoadingScreen({ onLoadingComplete, duration = 4000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showScreen, setShowScreen] = useState(true);
  const [showJackpot, setShowJackpot] = useState(false);
  const soundIdRef = useRef<number | null>(null);
  
  // Jackpot animation trigger
  useEffect(() => {
    const jackpotTimer = setTimeout(() => {
      setShowJackpot(true);
      sounds.jackpot.play();
    }, duration * 0.6); // Play jackpot sound at 60% of the loading time
    
    return () => clearTimeout(jackpotTimer);
  }, [duration]);

  // Main loading screen effect
  useEffect(() => {
    // Play background sound
    soundIdRef.current = sounds.background.play();
    
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
      // Stop sounds when component unmounts
      if (soundIdRef.current !== null) {
        sounds.background.stop(soundIdRef.current);
      }
    };
  }, [duration, onLoadingComplete]);

  if (!showScreen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="w-full max-w-2xl px-4 relative">
        <div className="relative">
          {/* Casino chips flying animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`chip-${i}`}
                className="absolute"
                initial={{ 
                  x: -100, 
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 180,
                  scale: 0.5
                }}
                animate={{ 
                  x: Math.random() * window.innerWidth,
                  y: -100,
                  rotate: Math.random() * 360,
                  scale: Math.random() * 0.5 + 0.5
                }}
                transition={{ 
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              >
                <div 
                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-white font-bold text-xs
                    ${i % 4 === 0 ? 'bg-red-600 border-red-300' : 
                      i % 4 === 1 ? 'bg-blue-600 border-blue-300' : 
                      i % 4 === 2 ? 'bg-green-600 border-green-300' : 
                      'bg-black border-gray-300'}`}
                >
                  {[5, 10, 20, 50, 100][Math.floor(Math.random() * 5)]}
                </div>
              </motion.div>
            ))}
          </div>

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
            className="w-full flex justify-center mb-12 relative"
          >
            <img 
              src="/assets/new-logo.png" 
              alt="Project Shadow Casino Logo" 
              className="max-w-full h-auto drop-shadow-[0_0_25px_rgba(128,0,128,0.7)]"
              style={{ maxHeight: "280px" }}
            />
            
            {/* Jackpot animation overlay */}
            {showJackpot && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                <motion.div 
                  className="absolute"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotateZ: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: 3,
                    repeatType: "reverse"
                  }}
                >
                  <img 
                    src="/assets/shadowcasinologo1.png" 
                    alt="Project Shadow Casino Logo Glow" 
                    className="max-w-full h-auto drop-shadow-[0_0_50px_rgba(255,215,0,0.9)]"
                    style={{ maxHeight: "280px" }}
                  />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

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
              className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-full relative"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            >
              {/* Glow effect on the progress bar */}
              <div className="absolute inset-0 bg-white/20 blur-sm"></div>
              
              {/* Moving highlight */}
              <motion.div 
                className="absolute top-0 bottom-0 w-12 bg-white/40 skew-x-12"
                animate={{ left: ["-100%", "100%"] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
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
        {[...Array(60)].map((_, i) => (
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

      {/* Dice rolling animation in the background */}
      <div className="absolute bottom-10 right-10 opacity-30">
        <motion.div
          className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl font-bold"
          animate={{ 
            rotateX: [0, 360, 720, 1080, 1440],
            rotateY: [0, 360, 720, 1080, 1440],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          {Math.floor(Math.random() * 6) + 1}
        </motion.div>
      </div>

      {/* Flashing lights effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 pointer-events-none"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
    </motion.div>
  );
}