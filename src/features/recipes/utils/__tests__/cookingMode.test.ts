import {
  advanceCookingProgress,
  createCookingProgress,
  createCookingTimer,
  extractCookingDuration,
  formatTimerCountdown,
  getVisibleStepIndices,
  pauseCookingTimer,
  prepareCookingTimerForStep,
  previousCookingProgress,
  resetCookingTimer,
  restartCookingProgress,
  resumeCookingTimer,
  startCookingTimer,
  subscribeToTimerTicks,
  updateCookingTimer,
} from '../cookingMode';

describe('Cooking Mode progress', () => {
  it('disables previous on the first step and completes on the last', () => {
    const first = createCookingProgress();
    expect(previousCookingProgress(first)).toEqual(first);

    const second = advanceCookingProgress(first, 2);
    expect(second).toEqual({ stepIndex: 1, completed: false });
    expect(advanceCookingProgress(second, 2)).toEqual({
      stepIndex: 1,
      completed: true,
    });
  });

  it('restarts progress at the first step after completion', () => {
    const completed = advanceCookingProgress(
      { stepIndex: 2, completed: false },
      3,
    );

    expect(completed.completed).toBe(true);
    expect(restartCookingProgress()).toEqual({
      stepIndex: 0,
      completed: false,
    });
  });

  it('limits step indicators to a sliding window for long recipes', () => {
    expect(getVisibleStepIndices(20, 0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(getVisibleStepIndices(20, 19)).toEqual([13, 14, 15, 16, 17, 18, 19]);
    expect(getVisibleStepIndices(3, 1)).toEqual([0, 1, 2]);
  });
});

describe('Cooking timer', () => {
  it.each([
    ['boil for 30 minutes', 30 * 60 * 1000],
    ['wait for 10 seconds', 10 * 1000],
    ['roast for 1 hour', 60 * 60 * 1000],
    ['cook for 1 hour and 30 minutes', 90 * 60 * 1000],
    ['bake for 1.5 minutes', 90 * 1000],
  ])('extracts a clear duration from "%s"', (instruction, milliseconds) => {
    expect(extractCookingDuration(instruction)?.milliseconds).toBe(milliseconds);
  });

  it.each([
    'Mix 1.5 cups of flour.',
    'Bake for 30-40 minutes.',
    'Cook for 1 to 2 hours.',
    'Simmer for 30 minutes, then rest for 10 minutes.',
  ])('does not suggest an ambiguous timer for "%s"', (instruction) => {
    expect(extractCookingDuration(instruction)).toBeNull();
  });

  it('starts, pauses, resumes, completes and resets from timestamps', () => {
    const duration = extractCookingDuration('Cook for 1 minute.');
    expect(duration).not.toBeNull();
    if (duration === null) {
      return;
    }

    const idle = createCookingTimer(duration, 0);
    expect(idle.phase).toBe('idle');
    const running = startCookingTimer(idle, 1_000);
    expect(running.endsAtMs).toBe(61_000);

    const paused = pauseCookingTimer(
      updateCookingTimer(running, 12_000),
      20_000,
    );
    expect(paused.phase).toBe('paused');
    expect(paused.remainingMs).toBe(41_000);

    const resumed = resumeCookingTimer(paused, 30_000);
    expect(resumed.endsAtMs).toBe(71_000);
    const complete = updateCookingTimer(resumed, 71_000);
    expect(complete.phase).toBe('complete');
    expect(formatTimerCountdown(complete.remainingMs)).toBe('00:00');

    expect(resetCookingTimer(complete)).toMatchObject({
      phase: 'idle',
      remainingMs: 60_000,
      endsAtMs: null,
    });
  });

  it('keeps a running or paused timer when the user changes steps', () => {
    const duration = extractCookingDuration('Cook for 1 minute.');
    expect(duration).not.toBeNull();
    if (duration === null) {
      return;
    }

    const running = startCookingTimer(createCookingTimer(duration, 0), 1_000);
    expect(prepareCookingTimerForStep(running, null, 1)).toBe(running);

    const paused = pauseCookingTimer(running, 12_000);
    expect(prepareCookingTimerForStep(paused, null, 1)).toBe(paused);
  });

  it('formats countdowns as MM:SS or HH:MM:SS', () => {
    expect(formatTimerCountdown(65_000)).toBe('01:05');
    expect(formatTimerCountdown(3_661_000)).toBe('01:01:01');
  });

  it('cleans up the interval when the timer screen leaves', () => {
    jest.useFakeTimers();
    const onTick = jest.fn();
    const cleanup = subscribeToTimerTicks(onTick);

    try {
      jest.advanceTimersByTime(2_000);
      expect(onTick).toHaveBeenCalledTimes(2);

      cleanup();
      jest.advanceTimersByTime(2_000);
      expect(onTick).toHaveBeenCalledTimes(2);
    } finally {
      cleanup();
      jest.useRealTimers();
    }
  });
});
