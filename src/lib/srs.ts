/**
 * Spaced Repetition System (SRS) - SM-2 Algorithm
 * 
 * This implements a simplified version of the SM-2 algorithm for spaced repetition.
 */

export interface SRSState {
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
}

export interface SRSResult {
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
}

/**
 * Calculate the next review date based on performance
 * @param currentState - Current SRS state
 * @param quality - Quality of recall (0-5, where 0 is complete blackout, 5 is perfect recall)
 * @returns New SRS state
 */
export function calculateNextReview(
  currentState: SRSState,
  quality: number
): SRSResult {
  const { ease, interval_days, repetitions } = currentState;

  // If quality < 3, reset the card
  if (quality < 3) {
    return {
      ease: Math.max(1.3, ease - 0.2),
      interval_days: 1,
      repetitions: 0,
      due_at: addDays(new Date(), 1).toISOString(),
    };
  }

  // Calculate new ease factor
  const newEase = Math.max(
    1.3,
    ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval_days * newEase);
  }

  // Calculate due date
  const dueDate = addDays(new Date(), newInterval);

  return {
    ease: newEase,
    interval_days: newInterval,
    repetitions: repetitions + 1,
    due_at: dueDate.toISOString(),
  };
}

/**
 * Check if a card is due for review
 * @param dueAt - ISO string of when the card is due
 * @returns true if the card is due
 */
export function isDue(dueAt: string): boolean {
  return new Date(dueAt) <= new Date();
}

/**
 * Helper function to add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Convert user answer to quality score
 * @param correct - Whether the user got it right
 * @returns Quality score (0-5)
 */
export function answerToQuality(correct: boolean): number {
  // Simple conversion: correct = 5 (perfect), incorrect = 2 (hard to recall)
  return correct ? 5 : 2;
}

/**
 * Calculate error rate for a card
 * @param wrongCount - Number of times answered incorrectly
 * @param shownCount - Total number of times shown
 * @returns Error rate as a percentage (0-100)
 */
export function calculateErrorRate(wrongCount: number, shownCount: number): number {
  if (shownCount === 0) return 0;
  return (wrongCount / shownCount) * 100;
}
