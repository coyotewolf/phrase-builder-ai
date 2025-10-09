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
  quality: Quality
): SRSResult {
  const { ease, interval_days, repetitions } = currentState;

  // If quality < 3, reset the card
  if (quality < 3) {
    return {
      ease: Math.max(1.3, ease - 0.2),
      interval_days: 1,
      repetitions: 0,
      due_at: addDays(startOfDay(new Date()), 1).toISOString(),
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
  const dueDate = addDays(startOfDay(new Date()), newInterval);

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
 * Helper function to get the start of the day for a given date
 */
function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
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
 * @param quality - Quality of recall (0-5, where 0 is complete blackout, 5 is perfect recall)
 * @returns Quality score (0-5)
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Convert user answer to quality score
 * @param quality - Quality of recall (0-5, where 0 is complete blackout, 5 is perfect recall)
 * @returns Quality score (0-5)
 */
export function answerToQuality(quality: Quality): Quality {
  return quality;
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
