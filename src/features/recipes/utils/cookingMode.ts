export interface CookingDuration {
  milliseconds: number;
  label: string;
}

export interface CookingProgress {
  stepIndex: number;
  completed: boolean;
}

export type CookingTimerPhase = 'idle' | 'running' | 'paused' | 'complete';

export interface CookingTimerState {
  phase: CookingTimerPhase;
  durationMs: number | null;
  durationLabel: string | null;
  remainingMs: number;
  endsAtMs: number | null;
  sourceStepIndex: number;
}

interface DurationMatch {
  index: number;
  end: number;
  text: string;
  milliseconds: number;
}

const durationPattern =
  /(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi;

export function extractCookingDuration(
  instruction: string,
): CookingDuration | null {
  const matches: DurationMatch[] = [];
  let match: RegExpExecArray | null;

  durationPattern.lastIndex = 0;
  while ((match = durationPattern.exec(instruction)) !== null) {
    const amount = Number(match[1]);
    const unit = (match[2] ?? '').toLowerCase();
    const multiplier = unit.startsWith('h')
      ? 60 * 60 * 1000
      : unit.startsWith('m')
        ? 60 * 1000
        : 1000;

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      text: match[0].trim(),
      milliseconds: Math.round(amount * multiplier),
    });
  }

  if (matches.length === 0 || isDurationRange(instruction, matches[0])) {
    return null;
  }

  for (let index = 1; index < matches.length; index += 1) {
    const previous = matches[index - 1];
    const current = matches[index];
    if (
      previous === undefined ||
      current === undefined ||
      !/^\s*(?:and\s*)?$/i.test(
        instruction.slice(previous.end, current.index),
      ) ||
      isDurationRange(instruction, current)
    ) {
      return null;
    }
  }

  const milliseconds = matches.reduce(
    (total, duration) => total + duration.milliseconds,
    0,
  );
  if (milliseconds <= 0) {
    return null;
  }

  return {
    milliseconds,
    label: matches.map((duration) => duration.text).join(' '),
  };
}

function isDurationRange(
  instruction: string,
  duration: DurationMatch | undefined,
): boolean {
  if (duration === undefined) {
    return false;
  }

  const prefix = instruction.slice(0, duration.index);
  return (
    /\d+(?:\.\d+)?\s*(?:[-–—]|to|and)\s*$/i.test(prefix) ||
    /(?:^|[\s(])[-–—]\s*$/.test(prefix)
  );
}

export function createCookingProgress(): CookingProgress {
  return { stepIndex: 0, completed: false };
}

export function advanceCookingProgress(
  progress: CookingProgress,
  stepCount: number,
): CookingProgress {
  if (stepCount <= 0 || progress.completed) {
    return progress;
  }

  if (progress.stepIndex >= stepCount - 1) {
    return { ...progress, completed: true };
  }

  return { stepIndex: progress.stepIndex + 1, completed: false };
}

export function previousCookingProgress(
  progress: CookingProgress,
): CookingProgress {
  if (progress.completed) {
    return { stepIndex: Math.max(0, progress.stepIndex), completed: false };
  }

  return {
    stepIndex: Math.max(0, progress.stepIndex - 1),
    completed: false,
  };
}

export function restartCookingProgress(): CookingProgress {
  return createCookingProgress();
}

export function getVisibleStepIndices(
  stepCount: number,
  currentStep: number,
  maxVisible = 7,
): number[] {
  if (stepCount <= 0 || maxVisible <= 0) {
    return [];
  }

  const visibleCount = Math.min(stepCount, maxVisible);
  const start = Math.min(
    Math.max(0, currentStep - Math.floor(visibleCount / 2)),
    stepCount - visibleCount,
  );

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function createCookingTimer(
  duration: CookingDuration | null,
  sourceStepIndex: number,
): CookingTimerState {
  return {
    phase: 'idle',
    durationMs: duration?.milliseconds ?? null,
    durationLabel: duration?.label ?? null,
    remainingMs: duration?.milliseconds ?? 0,
    endsAtMs: null,
    sourceStepIndex,
  };
}

export function prepareCookingTimerForStep(
  timer: CookingTimerState,
  duration: CookingDuration | null,
  sourceStepIndex: number,
): CookingTimerState {
  if (timer.phase === 'running' || timer.phase === 'paused') {
    return timer;
  }

  return createCookingTimer(duration, sourceStepIndex);
}

export function startCookingTimer(
  timer: CookingTimerState,
  now: number,
): CookingTimerState {
  if (
    timer.phase !== 'idle' ||
    timer.durationMs === null ||
    timer.remainingMs <= 0
  ) {
    return timer;
  }

  return {
    ...timer,
    phase: 'running',
    endsAtMs: now + timer.remainingMs,
  };
}

export function pauseCookingTimer(
  timer: CookingTimerState,
  now: number,
): CookingTimerState {
  if (timer.phase !== 'running' || timer.endsAtMs === null) {
    return timer;
  }

  const remainingMs = Math.max(0, timer.endsAtMs - now);
  return {
    ...timer,
    phase: remainingMs === 0 ? 'complete' : 'paused',
    remainingMs,
    endsAtMs: null,
  };
}

export function resumeCookingTimer(
  timer: CookingTimerState,
  now: number,
): CookingTimerState {
  if (timer.phase !== 'paused' || timer.remainingMs <= 0) {
    return timer;
  }

  return {
    ...timer,
    phase: 'running',
    endsAtMs: now + timer.remainingMs,
  };
}

export function resetCookingTimer(timer: CookingTimerState): CookingTimerState {
  return {
    ...timer,
    phase: 'idle',
    remainingMs: timer.durationMs ?? 0,
    endsAtMs: null,
  };
}

export function clearCookingTimer(timer: CookingTimerState): CookingTimerState {
  return {
    ...timer,
    phase: 'idle',
    durationMs: null,
    durationLabel: null,
    remainingMs: 0,
    endsAtMs: null,
  };
}

export function updateCookingTimer(
  timer: CookingTimerState,
  now: number,
): CookingTimerState {
  if (timer.phase !== 'running' || timer.endsAtMs === null) {
    return timer;
  }

  const remainingMs = Math.max(0, timer.endsAtMs - now);
  if (remainingMs === 0) {
    return { ...timer, phase: 'complete', remainingMs, endsAtMs: null };
  }

  if (remainingMs === timer.remainingMs) {
    return timer;
  }

  return { ...timer, remainingMs };
}

export function formatTimerCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
  }

  return `${padTime(minutes)}:${padTime(seconds)}`;
}

function padTime(value: number): string {
  return String(value).padStart(2, '0');
}

export function subscribeToTimerTicks(
  onTick: () => void,
): () => void {
  const interval = setInterval(onTick, 1000);
  return () => clearInterval(interval);
}
