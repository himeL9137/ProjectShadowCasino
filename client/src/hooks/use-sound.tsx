import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((type: string) => {
    // Play sound based on type
    const audio = new Audio();
    
    switch(type) {
      case "win":
        audio.src = "https://assets.codepen.io/21542/howler-sfx-levelup.mp3";
        break;
      case "lose":
        audio.src = "https://assets.codepen.io/21542/howler-sfx-leveldown.mp3";
        break;
      case "click":
        audio.src = "https://cdn.freesound.org/previews/573/573487_10941144-lq.mp3";
        break;
      case "coin":
        audio.src = "https://cdn.freesound.org/previews/150/150878_2823414-lq.mp3";
        break;
      default:
        audio.src = "https://cdn.freesound.org/previews/573/573487_10941144-lq.mp3";
    }
    
    audio.volume = 0.5;
    audio.play().catch(err => console.error("Error playing sound:", err));
  }, []);

  return { playSound };
}