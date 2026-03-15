import { useEffect, useRef, useState } from "react";
import { CherryBlossom } from "./components/CherryBlossom";
import { HoldButton } from "./components/HoldButton";
import { clampProgress, formatProgress, getBloomStage, type BlossomState } from "./types";

const BLOOM_DURATION_MS = 1800;

export default function App() {
  const [{ progress, isHolding }, setBlossomState] = useState<BlossomState>({
    progress: 0,
    isHolding: false,
  });
  const frameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHolding || progress >= 1) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      const lastTimestamp = lastTimestampRef.current ?? timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestampRef.current = timestamp;

      setBlossomState((current) => {
        if (!current.isHolding) {
          return current;
        }

        const nextProgress = clampProgress(current.progress + delta / BLOOM_DURATION_MS);
        if (nextProgress >= 1) {
          return { progress: 1, isHolding: false };
        }

        return { ...current, progress: nextProgress };
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [isHolding, progress]);

  useEffect(() => {
    const stopHolding = () => {
      setBlossomState((current) => (current.isHolding ? { ...current, isHolding: false } : current));
    };

    window.addEventListener("blur", stopHolding);
    window.addEventListener("pointerup", stopHolding);
    window.addEventListener("pointercancel", stopHolding);

    return () => {
      window.removeEventListener("blur", stopHolding);
      window.removeEventListener("pointerup", stopHolding);
      window.removeEventListener("pointercancel", stopHolding);
    };
  }, []);

  const handleHoldStart = () => {
    setBlossomState((current) => {
      if (current.progress >= 1 || current.isHolding) {
        return current;
      }

      return { ...current, isHolding: true };
    });
  };

  const handleHoldEnd = () => {
    setBlossomState((current) => (current.isHolding ? { ...current, isHolding: false } : current));
  };

  const stage = getBloomStage(progress);
  const isComplete = progress >= 1;

  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="app-title">
        <p className="eyebrow">Spring interaction</p>
        <h1 id="app-title">長押しで桜を咲かせる</h1>
        <p className="description">
          ボタンを押している間だけ、一輪の桜が蕾からゆっくり開いていきます。
          離しても状態は保持され、続きから満開まで進められます。
        </p>

        <div className="blossom-panel">
          <CherryBlossom progress={progress} size={320} />
          <div className="status-strip" aria-live="polite">
            <span>開花率 {formatProgress(progress)}</span>
            <span>段階 {stage}</span>
          </div>
        </div>

        <HoldButton isHolding={isHolding} disabled={isComplete} onHoldStart={handleHoldStart} onHoldEnd={handleHoldEnd} />

        <p className="helper-text">
          {isComplete ? "満開です。春のまま止まっています。" : "長押しを続けると花びらが開きます。"}
        </p>
      </section>
    </main>
  );
}
