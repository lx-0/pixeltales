import { Logger } from '@yesterday-ai/logger-frontend';
import { Game } from 'phaser';
import { useEffect, useRef, useState } from 'react';

// Define interface for webkit prefixed AudioContext
interface WindowWithWebkitAudio {
  webkitAudioContext: typeof AudioContext;
}

export function useSound() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize and cleanup on mount/unmount
  useEffect(() => {
    // Try to load saved preference from localStorage
    const savedPreference = localStorage.getItem('pixeltales:soundEnabled');
    if (savedPreference === 'true') {
      setIsSoundEnabled(true);
      // Don't initialize audio context yet - wait for user interaction
    }

    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          Logger.info('useSound', 'AudioContext closed on cleanup');
        } catch (err) {
          Logger.error('useSound', `Failed to close AudioContext: ${err}`);
        }
      }
    };
  }, []);

  // Save preference whenever it changes
  useEffect(() => {
    localStorage.setItem('pixeltales:soundEnabled', isSoundEnabled.toString());
  }, [isSoundEnabled]);

  // Toggle sound handler
  const toggleSound = (game?: Game | null) => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);

    if (newState && !audioContextInitializedRef.current) {
      initializeAudioContext();
    } else if (!newState && audioContextRef.current) {
      // Suspend audio context when sound is disabled
      try {
        audioContextRef.current.suspend();
        Logger.info('useSound', 'AudioContext suspended');
      } catch (err) {
        Logger.error('useSound', `Failed to suspend AudioContext: ${err}`);
      }
    }

    // Emit sound state to game scenes if game is provided
    if (game) {
      emitSoundStateToScenes(game, newState);
    }
  };

  // Initialize AudioContext
  const initializeAudioContext = () => {
    Logger.info('useSound', 'Sound enabled, initializing AudioContext');

    // Try to initialize AudioContext (for browsers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass =
      window.AudioContext || (window as unknown as WindowWithWebkitAudio).webkitAudioContext;

    if (AudioContextClass) {
      // Ensure AudioContext is started after user interaction
      const context = new AudioContextClass();
      audioContextRef.current = context;

      if (context.state !== 'running') {
        context
          .resume()
          .then(() => {
            Logger.info('useSound', 'AudioContext resumed successfully');
          })
          .catch((err) => {
            Logger.error('useSound', `Failed to resume AudioContext: ${err}`);
          });
      }
    }

    audioContextInitializedRef.current = true;
  };

  // Emit sound state to game scenes
  const emitSoundStateToScenes = (game: Game, soundEnabled: boolean) => {
    const mainScene = game.scene.getScene('MainScene');
    const uiScene = game.scene.getScene('UIScene');

    if (mainScene?.events) {
      mainScene.events.emit('soundEnabled', soundEnabled);
    }
    if (uiScene?.events) {
      uiScene.events.emit('soundEnabled', soundEnabled);
    }
  };

  return {
    isSoundEnabled,
    toggleSound,
  };
}
