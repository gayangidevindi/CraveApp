import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MealDetails } from '../services/mealApi';
import type { RecipeInstruction } from '../utils/recipeDetails';
import {
  advanceCookingProgress,
  clearCookingTimer,
  createCookingProgress,
  createCookingTimer,
  extractCookingDuration,
  formatTimerCountdown,
  getVisibleStepIndices,
  pauseCookingTimer,
  prepareCookingTimerForStep,
  previousCookingProgress,
  restartCookingProgress,
  resumeCookingTimer,
  startCookingTimer,
  subscribeToTimerTicks,
  updateCookingTimer,
} from '../utils/cookingMode';
import { SystemNavigationBar } from '../../../shared/components/SystemNavigationBar';
import { ToastMessage } from '../../../shared/components/ToastMessage';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

interface CookingModeModalProps {
  meal: MealDetails;
  instructions: readonly RecipeInstruction[];
  onClose: () => void;
}

export function CookingModeModal({
  meal,
  instructions,
  onClose,
}: CookingModeModalProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(createCookingProgress);
  const firstDuration = extractCookingDuration(instructions[0]?.text ?? '');
  const [timer, setTimer] = useState(() =>
    createCookingTimer(firstDuration, 0),
  );
  const [timerNotice, setTimerNotice] = useState<string | null>(null);
  const [stepOpacity] = useState(() => new Animated.Value(1));
  const [progressValue] = useState(
    () => new Animated.Value(1 / instructions.length),
  );
  const previousTimerPhase = useRef(timer.phase);
  const instruction = instructions[progress.stepIndex];
  const instructionDuration = instruction
    ? extractCookingDuration(instruction.text)
    : null;
  const instructionDurationMs = instructionDuration?.milliseconds ?? null;
  const instructionDurationLabel = instructionDuration?.label ?? null;
  const timerIsActive = timer.phase === 'running' || timer.phase === 'paused';
  const timerDurationLabel = timerIsActive
    ? timer.durationLabel
    : instructionDurationLabel;
  const timerIsVisible =
    instructionDuration !== null ||
    timer.phase === 'running' ||
    timer.phase === 'paused' ||
    timer.phase === 'complete';
  const stepProgress = (progress.stepIndex + 1) / instructions.length;
  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const title = meal.strMeal.trim();

  useEffect(() => {
    if (reducedMotion) {
      stepOpacity.setValue(1);
      return;
    }

    stepOpacity.setValue(0.55);
    const animation = Animated.timing(stepOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [progress.completed, progress.stepIndex, reducedMotion, stepOpacity]);

  useEffect(() => {
    const targetProgress = (progress.stepIndex + 1) / instructions.length;
    if (reducedMotion) {
      progressValue.setValue(targetProgress);
      return;
    }

    const animation = Animated.timing(progressValue, {
      toValue: targetProgress,
      duration: 220,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [
    instructions.length,
    progress.stepIndex,
    progressValue,
    reducedMotion,
  ]);

  useEffect(() => {
    if (timer.phase !== 'running' || timer.endsAtMs === null) {
      return;
    }

    const update = () => {
      setTimer((current) => updateCookingTimer(current, Date.now()));
    };
    const stopTicker = subscribeToTimerTicks(update);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        update();
      }
    });
    update();

    return () => {
      stopTicker();
      subscription.remove();
    };
  }, [timer.endsAtMs, timer.phase]);

  useEffect(() => {
    if (
      timer.phase === 'complete' &&
      previousTimerPhase.current === 'running'
    ) {
      setTimerNotice(`Timer complete for step ${timer.sourceStepIndex + 1}.`);
    }
    previousTimerPhase.current = timer.phase;
  }, [timer.phase, timer.sourceStepIndex]);

  const goToNextStep = () => {
    const nextProgress = advanceCookingProgress(
      progress,
      instructions.length,
    );
    setProgress(nextProgress);
    if (nextProgress.completed) {
      setTimer((current) => clearCookingTimer(current));
      setTimerNotice(null);
      return;
    }

    const nextInstruction = instructions[nextProgress.stepIndex];
    setTimer((current) =>
      prepareCookingTimerForStep(
        current,
        nextInstruction
          ? extractCookingDuration(nextInstruction.text)
          : null,
        nextProgress.stepIndex,
      ),
    );
    setTimerNotice(null);
  };

  const goToPreviousStep = () => {
    const previousProgress = previousCookingProgress(progress);
    setProgress(previousProgress);

    const previousInstruction = instructions[previousProgress.stepIndex];
    setTimer((current) =>
      prepareCookingTimerForStep(
        current,
        previousInstruction
          ? extractCookingDuration(previousInstruction.text)
          : null,
        previousProgress.stepIndex,
      ),
    );
    setTimerNotice(null);
  };

  const restart = () => {
    setProgress(restartCookingProgress());
    setTimer(createCookingTimer(firstDuration, 0));
    setTimerNotice(null);
  };

  const startTimer = () => {
    setTimer((current) => {
      const baseTimer = prepareCookingTimerForStep(
        current,
        instructionDuration,
        progress.stepIndex,
      );
      return startCookingTimer(baseTimer, Date.now());
    });
    setTimerNotice(null);
  };

  const resetTimer = () => {
    setTimer(
      createCookingTimer(instructionDuration, progress.stepIndex),
    );
    setTimerNotice(null);
  };

  const timerRemaining =
    timerIsActive || timer.phase === 'complete'
      ? timer.remainingMs
      : instructionDurationMs ?? 0;
  const visibleStepIndices = getVisibleStepIndices(
    instructions.length,
    progress.stepIndex,
  );
  const maxContentWidth = width >= 760 ? 720 : width - theme.spacing.lg * 2;

  return (
    <Modal
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      backdropColor={theme.colors.background}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar
          style={theme.mode === 'dark' ? 'light' : 'dark'}
          animated={!reducedMotion}
        />
        <SystemNavigationBar mode={theme.mode} />
        <View style={[styles.content, { maxWidth: maxContentWidth }]}>
          <View style={styles.header}>
            <View style={styles.recipeHeading}>
              {meal.strMealThumb ? (
                <Image
                  source={{ uri: meal.strMealThumb }}
                  style={styles.thumbnail}
                  accessibilityLabel={`${title} recipe thumbnail`}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Feather
                    name="coffee"
                    size={24}
                    color={theme.colors.deepOrange}
                    accessible={false}
                  />
                </View>
              )}
              <View style={styles.titleGroup}>
                <Text style={styles.eyebrow}>COOKING MODE</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Cooking Mode"
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name="x"
                size={22}
                color={theme.colors.darkBrown}
                accessible={false}
              />
            </Pressable>
          </View>

          {progress.completed ? (
            <View style={styles.completionLayout}>
              <ScrollView
                contentContainerStyle={styles.completionContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.successIcon}>
                  <Feather
                    name="check"
                    size={40}
                    color={theme.colors.onPrimary}
                    accessible={false}
                  />
                </View>
                <Text style={styles.completionTitle}>Cooking Complete!</Text>
                <Text style={styles.completionRecipe}>{title}</Text>
                <Text style={styles.completionSummary}>
                  You completed {instructions.length}{' '}
                  {instructions.length === 1 ? 'step' : 'steps'}.
                </Text>
              </ScrollView>
              <View style={styles.completionActions}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Back to recipe"
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Back to Recipe</Text>
                </Pressable>
                <Pressable
                  onPress={restart}
                  accessibilityRole="button"
                  accessibilityLabel="Cook again from the first step"
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name="rotate-ccw"
                    size={18}
                    color={theme.colors.onPrimary}
                    accessible={false}
                  />
                  <Text style={styles.primaryButtonText}>Cook Again</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Step {progress.stepIndex + 1} of {instructions.length}
                </Text>
                <Text style={styles.progressText}>
                  {Math.round(stepProgress * 100)}%
                </Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel="Cooking progress"
                accessibilityValue={{
                  min: 0,
                  max: instructions.length,
                  now: progress.stepIndex + 1,
                }}
                style={styles.progressTrack}
              >
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stepIndicators}
                accessibilityLabel="Cooking steps"
              >
                {visibleStepIndices.map((stepIndex) => (
                  <View
                    key={`step-indicator-${stepIndex}`}
                    accessible={false}
                    style={styles.stepIndicatorButton}
                  >
                    <View
                      style={[
                        styles.stepIndicator,
                        stepIndex === progress.stepIndex &&
                          styles.activeStepIndicator,
                      ]}
                    />
                  </View>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.stepScroll}
                contentContainerStyle={styles.stepScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  style={[styles.instructionCard, { opacity: stepOpacity }]}
                >
                  <View style={styles.instructionHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>
                        {progress.stepIndex + 1}
                      </Text>
                    </View>
                    <View style={styles.instructionTitleGroup}>
                      <Text style={styles.instructionHeading}>
                        Cooking instruction
                      </Text>
                      <Text style={styles.instructionSubheading}>
                        Step {progress.stepIndex + 1}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.instructionText}>
                    {instruction?.text}
                  </Text>
                  {instructionDuration ? (
                    <View style={styles.durationChip}>
                      <Feather
                        name="clock"
                        size={15}
                        color={theme.colors.deepOrange}
                        accessible={false}
                      />
                      <Text style={styles.durationText}>
                        {instructionDuration.label}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>

                {timerIsVisible ? (
                  <View style={styles.timerCard}>
                    <View style={styles.timerHeading}>
                      <View>
                        <Text style={styles.timerTitle}>Optional timer</Text>
                        {timerIsActive &&
                        timer.sourceStepIndex !== progress.stepIndex ? (
                          <Text style={styles.timerCaption}>
                            Started on step {timer.sourceStepIndex + 1}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.timerDuration}>
                        {timerDurationLabel ?? 'Cooking time'}
                      </Text>
                    </View>
                    <Text
                      style={styles.timerCountdown}
                      accessibilityLabel={`Timer ${formatTimerCountdown(timerRemaining)} remaining`}
                    >
                      {formatTimerCountdown(timerRemaining)}
                    </Text>
                    {timer.phase === 'complete' ? (
                      <Text style={styles.timerCompleteText}>
                        Timer complete
                      </Text>
                    ) : null}
                    <View style={styles.timerActions}>
                      {timer.phase === 'idle' ? (
                        <Pressable
                          onPress={startTimer}
                          disabled={timer.durationMs === null}
                          accessibilityRole="button"
                          accessibilityLabel="Start cooking timer"
                          accessibilityState={{
                            disabled: timer.durationMs === null,
                          }}
                          style={({ pressed }) => [
                            styles.timerButton,
                            styles.primaryButton,
                            timer.durationMs === null && styles.disabled,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Feather
                            name="play"
                            size={17}
                            color={theme.colors.onPrimary}
                            accessible={false}
                          />
                          <Text style={styles.primaryButtonText}>Start</Text>
                        </Pressable>
                      ) : null}
                      {timer.phase === 'running' ? (
                        <Pressable
                          onPress={() =>
                            setTimer((current) =>
                              pauseCookingTimer(current, Date.now()),
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Pause cooking timer"
                          style={({ pressed }) => [
                            styles.timerButton,
                            styles.secondaryButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Feather
                            name="pause"
                            size={17}
                            color={theme.colors.deepOrange}
                            accessible={false}
                          />
                          <Text style={styles.secondaryButtonText}>Pause</Text>
                        </Pressable>
                      ) : null}
                      {timer.phase === 'paused' ? (
                        <Pressable
                          onPress={() =>
                            setTimer((current) =>
                              resumeCookingTimer(current, Date.now()),
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Resume cooking timer"
                          style={({ pressed }) => [
                            styles.timerButton,
                            styles.primaryButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Feather
                            name="play"
                            size={17}
                            color={theme.colors.onPrimary}
                            accessible={false}
                          />
                          <Text style={styles.primaryButtonText}>Resume</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={resetTimer}
                        disabled={
                          instructionDurationMs === null &&
                          timer.durationMs === null
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Reset cooking timer"
                        accessibilityState={{
                          disabled:
                            instructionDurationMs === null &&
                            timer.durationMs === null,
                        }}
                        style={({ pressed }) => [
                          styles.timerButton,
                          styles.secondaryButton,
                          instructionDurationMs === null &&
                            timer.durationMs === null &&
                            styles.disabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Feather
                          name="rotate-ccw"
                          size={16}
                          color={theme.colors.deepOrange}
                          accessible={false}
                        />
                        <Text style={styles.secondaryButtonText}>Reset</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <ToastMessage
                message={timerNotice}
                tone="success"
                onDismiss={() => setTimerNotice(null)}
              />
              <View style={styles.navigationActions}>
                <Pressable
                  onPress={goToPreviousStep}
                  disabled={progress.stepIndex === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous step"
                  accessibilityState={{
                    disabled: progress.stepIndex === 0,
                  }}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.secondaryButton,
                    progress.stepIndex === 0 && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name="arrow-left"
                    size={18}
                    color={theme.colors.deepOrange}
                    accessible={false}
                  />
                  <Text style={styles.secondaryButtonText}>Previous</Text>
                </Pressable>
                <Pressable
                  onPress={goToNextStep}
                  accessibilityRole="button"
                  accessibilityLabel={
                    progress.stepIndex === instructions.length - 1
                      ? 'Finish cooking'
                      : 'Next step'
                  }
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {progress.stepIndex === instructions.length - 1
                      ? 'Finish Cooking'
                      : 'Next Step'}
                  </Text>
                  <Feather
                    name={
                      progress.stepIndex === instructions.length - 1
                        ? 'check'
                        : 'arrow-right'
                    }
                    size={18}
                    color={theme.colors.onPrimary}
                    accessible={false}
                  />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    content: {
      width: '100%',
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    header: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    recipeHeading: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.softYellow,
    },
    thumbnailPlaceholder: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.softYellow,
    },
    titleGroup: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.bold,
      letterSpacing: 1,
    },
    title: {
      color: theme.colors.heading,
      fontSize: theme.typography.subtitle,
      fontWeight: theme.typography.weight.bold,
      textTransform: 'capitalize',
    },
    closeButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.card,
    },
    pressed: {
      opacity: 0.72,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    progressText: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.semibold,
    },
    progressTrack: {
      height: 8,
      overflow: 'hidden',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.border,
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.deepOrange,
    },
    stepIndicators: {
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    stepIndicatorButton: {
      minWidth: 24,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepIndicator: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.border,
    },
    activeStepIndicator: {
      width: 22,
      backgroundColor: theme.colors.deepOrange,
    },
    stepScroll: {
      flex: 1,
      minHeight: 0,
    },
    stepScrollContent: {
      flexGrow: 1,
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.sm,
    },
    instructionCard: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.card,
      ...theme.shadows.card,
    },
    instructionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    stepBadge: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.deepOrange,
    },
    stepBadgeText: {
      color: theme.colors.white,
      fontSize: theme.typography.subtitle,
      fontWeight: theme.typography.weight.bold,
    },
    instructionTitleGroup: {
      flex: 1,
      gap: 2,
    },
    instructionHeading: {
      color: theme.colors.heading,
      fontSize: theme.typography.subtitle,
      fontWeight: theme.typography.weight.bold,
    },
    instructionSubheading: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.caption,
    },
    instructionText: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      lineHeight: theme.typography.lineHeight.title + 4,
      textAlign: 'left',
    },
    durationChip: {
      minHeight: 36,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.softYellow,
    },
    durationText: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.semibold,
    },
    timerCard: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.elevatedSurface,
    },
    timerHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    timerTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weight.bold,
    },
    timerCaption: {
      marginTop: 2,
      color: theme.colors.secondaryText,
      fontSize: theme.typography.caption,
    },
    timerDuration: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.semibold,
      textAlign: 'right',
    },
    timerCountdown: {
      color: theme.colors.heading,
      fontSize: theme.typography.title,
      fontWeight: theme.typography.weight.bold,
      fontVariant: ['tabular-nums'],
    },
    timerCompleteText: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.caption,
      fontWeight: theme.typography.weight.bold,
    },
    timerActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    timerButton: {
      minHeight: 48,
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    navigationActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    actionButton: {
      minHeight: 52,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.deepOrange,
      ...theme.shadows.button,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weight.bold,
    },
    secondaryButtonText: {
      color: theme.colors.deepOrange,
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weight.semibold,
    },
    disabled: {
      opacity: 0.5,
    },
    completionLayout: {
      flex: 1,
    },
    completionContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
    },
    successIcon: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.deepOrange,
    },
    completionTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.title,
      fontWeight: theme.typography.weight.bold,
      textAlign: 'center',
    },
    completionRecipe: {
      color: theme.colors.text,
      fontSize: theme.typography.subtitle,
      fontWeight: theme.typography.weight.semibold,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    completionSummary: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.body,
      textAlign: 'center',
    },
    completionActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
  });
}
