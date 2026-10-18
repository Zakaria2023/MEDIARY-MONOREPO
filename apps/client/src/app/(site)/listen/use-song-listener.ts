"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { matchSongAction } from "./actions";

type ListenPhase = "idle" | "listening" | "matching";

/** How long a clip is: enough for a fingerprint, short enough to feel instant. */
const CLIP_SECONDS = 8;

/** What the browser is asked to record in, best first: Chrome and Firefox take the first, Safari the third. */
const FORMATS = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

const TICK_MS = 200;

/**
 * NAMING A SONG BY EAR. Asks for the microphone, records CLIP_SECONDS with
 * the voice-call processing switched off (it is tuned for speech and
 * flattens music), then hands the clip to the action. A cancelled clip is
 * dropped, and leaving the page stops the microphone.
 */
export const useSongListener = () => {
  const [state, dispatch, isPending] = useActionState(matchSongAction, {});
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const tickRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const stopTicking = () => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const listen = async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("This browser can't record from the microphone. Try another browser.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      setMicError("Mediary needs the microphone to hear the song. Allow it for this site in your browser, then try again.");
      return;
    }

    const mimeType = FORMATS.find((format) => MediaRecorder.isTypeSupported(format));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      stopTicking();
      recorderRef.current = null;
      setListening(false);
      if (cancelledRef.current) {
        cancelledRef.current = false;
        return;
      }
      const clip = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      const data = new FormData();
      data.set("clip", clip, "clip");
      startTransition(() => {
        dispatch(data);
      });
    };

    recorderRef.current = recorder;
    cancelledRef.current = false;
    recorder.start();
    setElapsed(0);
    setListening(true);
    const startedAt = Date.now();
    tickRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(seconds, CLIP_SECONDS));
      if (seconds >= CLIP_SECONDS && recorder.state === "recording") {
        recorder.stop();
      }
    }, TICK_MS);
  };

  const cancel = () => {
    cancelledRef.current = true;
    recorderRef.current?.stop();
  };

  // Leaving the page mid-clip lets go of the microphone.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      recorderRef.current?.stop();
      stopTicking();
    },
    [],
  );

  const phase: ListenPhase = listening ? "listening" : isPending ? "matching" : "idle";

  return {
    state,
    phase,
    progress: elapsed / CLIP_SECONDS,
    micError,
    listen,
    cancel,
  };
};
