export type BloomStage = "bud" | "opening" | "blooming" | "full";

export interface BlossomState {
  progress: number;
  isHolding: boolean;
}

export interface CherryBlossomProps {
  progress: number;
  size?: number;
}

export interface HoldButtonProps {
  isHolding: boolean;
  disabled?: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getBloomStage(progress: number): BloomStage {
  const value = clampProgress(progress);

  if (value < 0.25) {
    return "bud";
  }
  if (value < 0.55) {
    return "opening";
  }
  if (value < 0.85) {
    return "blooming";
  }
  return "full";
}

export function formatProgress(progress: number) {
  return `${Math.round(clampProgress(progress) * 100)}%`;
}
