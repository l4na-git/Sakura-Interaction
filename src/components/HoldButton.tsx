import type { KeyboardEvent, PointerEvent } from "react";
import type { HoldButtonProps } from "../types";

export function HoldButton({ isHolding, disabled = false, onHoldStart, onHoldEnd }: HoldButtonProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onHoldStart();
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onHoldEnd();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      onHoldStart();
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onHoldEnd();
    }
  };

  return (
    <button
      type="button"
      className={`hold-button${isHolding ? " is-holding" : ""}`}
      disabled={disabled}
      aria-pressed={isHolding}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {disabled ? "満開になりました" : isHolding ? "そのまま長押し中..." : "長押しして開花"}
    </button>
  );
}
