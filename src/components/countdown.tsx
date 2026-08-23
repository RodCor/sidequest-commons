"use client";

import { useEffect, useState } from "react";

export function Countdown() {
  const [remaining, setRemaining] = useState("--:--:--");
  useEffect(() => {
    const update = () => setRemaining(timeUntilBell());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return <time aria-label={`Selection in ${remaining}`}>{remaining}</time>;
}

function timeUntilBell() {
  const now = new Date();
  // Argentina is fixed at UTC-03:00. Shift into a UTC-shaped local clock so
  // the calculation is deterministic without shipping a timezone library.
  const buenosAiresClock = new Date(now.getTime() - 3 * 60 * 60 * 1_000);
  let target = Date.UTC(
    buenosAiresClock.getUTCFullYear(),
    buenosAiresClock.getUTCMonth(),
    buenosAiresClock.getUTCDate(),
    21,
  );
  if (target <= buenosAiresClock.getTime()) target += 24 * 60 * 60 * 1_000;
  const distance = target - buenosAiresClock.getTime();
  const hours = Math.floor(distance / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  const seconds = Math.floor((distance % 60_000) / 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
