"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Line } from "@/types/script";

type QueueState = "idle" | "playing" | "paused" | "user_silence" | "finished";

interface UseAudioQueueOptions {
  userCharacterId: string | null;
  silenceDurationMs: number;
  playbackSpeed: number;
  onLineStart?: (lineIndex: number) => void;
  onLineEnd?: (lineIndex: number) => void;
  onFinished?: () => void;
}

export function useAudioQueue(
  queue: Line[],
  options: UseAudioQueueOptions
) {
  const [state, setState] = useState<QueueState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [silenceRemaining, setSilenceRemaining] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  const currentIndexRef = useRef(0);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
  }, []);

  const fetchAudio = useCallback(async (line: Line): Promise<string | null> => {
    if (line.audioUrl) return line.audioUrl;
    if (!line.dialogue || !line.character?.voiceId) return null;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineId: line.id,
          text: line.dialogue,
          voiceId: line.character.voiceId,
          speed: line.character.voiceSpeed,
          pitch: line.character.voicePitch,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } catch {
      return null;
    }
  }, []);

  const advance = useCallback(
    async (index: number) => {
      if (isPausedRef.current) return;
      if (index >= queue.length) {
        setState("finished");
        options.onFinished?.();
        return;
      }

      currentIndexRef.current = index;
      setCurrentIndex(index);
      options.onLineStart?.(index);

      const line = queue[index];

      // Stage direction or scene heading: display briefly, then advance
      if (line.lineType !== "DIALOGUE") {
        setState("playing");
        await new Promise((r) => setTimeout(r, 1200));
        if (!isPausedRef.current) advance(index + 1);
        return;
      }

      // User's line: silence + countdown
      if (
        options.userCharacterId &&
        line.characterId === options.userCharacterId
      ) {
        setState("user_silence");
        setSilenceRemaining(options.silenceDurationMs);

        silenceIntervalRef.current = setInterval(() => {
          setSilenceRemaining((prev) => {
            const next = prev - 100;
            return next < 0 ? 0 : next;
          });
        }, 100);

        silenceTimerRef.current = setTimeout(() => {
          if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
          if (!isPausedRef.current) {
            options.onLineEnd?.(index);
            advance(index + 1);
          }
        }, options.silenceDurationMs);
        return;
      }

      // Other character: fetch and play TTS
      setState("playing");
      const audioUrl = await fetchAudio(line);

      if (!audioUrl || isPausedRef.current) {
        // Skip if no audio available or paused
        if (!isPausedRef.current) advance(index + 1);
        return;
      }

      const audio = new Audio(audioUrl);
      audio.playbackRate = options.playbackSpeed;
      audioRef.current = audio;

      audio.onended = () => {
        options.onLineEnd?.(index);
        if (!isPausedRef.current) advance(index + 1);
      };

      audio.onerror = () => {
        if (!isPausedRef.current) advance(index + 1);
      };

      try {
        await audio.play();
      } catch {
        if (!isPausedRef.current) advance(index + 1);
      }
    },
    [queue, options, fetchAudio]
  );

  const play = useCallback(() => {
    isPausedRef.current = false;
    setState("playing");
    advance(currentIndexRef.current);
  }, [advance]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setState("paused");
    if (audioRef.current) audioRef.current.pause();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        advance(currentIndexRef.current);
      });
    } else {
      advance(currentIndexRef.current);
    }
    setState("playing");
  }, [advance]);

  const jumpTo = useCallback(
    (index: number) => {
      cleanup();
      isPausedRef.current = false;
      currentIndexRef.current = index;
      setCurrentIndex(index);
      setState("idle");
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    cleanup();
    isPausedRef.current = true;
    setState("idle");
    setCurrentIndex(0);
    currentIndexRef.current = 0;
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    currentIndex,
    silenceRemaining,
    silenceDuration: options.silenceDurationMs,
    play,
    pause,
    resume,
    jumpTo,
    stop,
  };
}
