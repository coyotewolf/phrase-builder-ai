/**
 * Sample data generator for demo purposes
 */

import { db, type Wordbook, type Card, type CardStats, type CardSRS } from './db';

// Generate dates for the past N days
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Sample vocabulary data
const SAMPLE_WORDBOOKS = [
  {
    name: "日常生活英語 100",
    description: "日常生活中最常用的基礎單字，適合初學者",
    level: "國中",
  },
  {
    name: "TOEFL 核心詞彙精選",
    description: "托福考試必備的高頻詞彙精選",
    level: "TOEFL",
  },
  {
    name: "商務英語入門",
    description: "職場常用商務英語詞彙",
    level: "大學",
  },
];

const SAMPLE_CARDS_DATA = [
  // Wordbook 1: 日常生活英語
  [
    {
      headword: "apple",
      phonetic: "/ˈæpəl/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "蘋果",
          meaning_en: "a round fruit with red, green, or yellow skin",
          synonyms: ["fruit"],
          antonyms: [],
          examples: ["I eat an apple every day.", "The apple pie smells delicious."],
        },
      ],
      notes: "An apple a day keeps the doctor away.",
      star: true,
      tags: ["food", "fruit"],
    },
    {
      headword: "breakfast",
      phonetic: "/ˈbrekfəst/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "早餐",
          meaning_en: "the first meal of the day",
          synonyms: ["morning meal"],
          antonyms: [],
          examples: ["What did you have for breakfast?", "Breakfast is served at 8 AM."],
        },
      ],
      star: false,
      tags: ["food", "daily"],
    },
    {
      headword: "computer",
      phonetic: "/kəmˈpjuːtər/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "電腦",
          meaning_en: "an electronic device for storing and processing data",
          synonyms: ["PC", "laptop"],
          antonyms: [],
          examples: ["I work on my computer all day.", "The computer crashed unexpectedly."],
        },
      ],
      star: false,
      tags: ["technology"],
    },
    {
      headword: "delicious",
      phonetic: "/dɪˈlɪʃəs/",
      meanings: [
        {
          part_of_speech: "adjective",
          meaning_zh: "美味的",
          meaning_en: "highly pleasant to taste",
          synonyms: ["tasty", "yummy", "scrumptious"],
          antonyms: ["disgusting", "bland"],
          examples: ["This cake is absolutely delicious!", "Mom makes delicious pasta."],
        },
      ],
      star: true,
      tags: ["food", "adjective"],
    },
    {
      headword: "exercise",
      phonetic: "/ˈeksəsaɪz/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "運動；練習",
          meaning_en: "physical activity to improve health",
          synonyms: ["workout", "training"],
          antonyms: [],
          examples: ["Regular exercise is good for your health.", "I do exercise every morning."],
        },
        {
          part_of_speech: "verb",
          meaning_zh: "運動；鍛鍊",
          meaning_en: "to engage in physical activity",
          synonyms: ["work out", "train"],
          antonyms: [],
          examples: ["I exercise three times a week.", "She exercises at the gym."],
        },
      ],
      star: false,
      tags: ["health", "verb"],
    },
  ],
  // Wordbook 2: TOEFL 核心詞彙
  [
    {
      headword: "phenomenon",
      phonetic: "/fəˈnɒmɪnən/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "現象",
          meaning_en: "a fact or situation observed to exist or happen",
          synonyms: ["occurrence", "event", "happening"],
          antonyms: [],
          examples: ["The Northern Lights are a natural phenomenon.", "This social phenomenon requires further study."],
        },
      ],
      notes: "Plural: phenomena",
      star: true,
      tags: ["academic", "science"],
    },
    {
      headword: "hypothesis",
      phonetic: "/haɪˈpɒθəsɪs/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "假設；假說",
          meaning_en: "a proposed explanation for a phenomenon",
          synonyms: ["theory", "assumption", "proposition"],
          antonyms: ["fact", "proof"],
          examples: ["The scientist tested her hypothesis.", "Our hypothesis was proven correct."],
        },
      ],
      notes: "Plural: hypotheses",
      star: true,
      tags: ["academic", "science"],
    },
    {
      headword: "ambiguous",
      phonetic: "/æmˈbɪɡjuəs/",
      meanings: [
        {
          part_of_speech: "adjective",
          meaning_zh: "模糊的；含糊的",
          meaning_en: "open to more than one interpretation",
          synonyms: ["unclear", "vague", "equivocal"],
          antonyms: ["clear", "unambiguous", "explicit"],
          examples: ["The statement was deliberately ambiguous.", "His response left me feeling ambiguous."],
        },
      ],
      star: false,
      tags: ["academic"],
    },
    {
      headword: "comprehensive",
      phonetic: "/ˌkɒmprɪˈhensɪv/",
      meanings: [
        {
          part_of_speech: "adjective",
          meaning_zh: "全面的；綜合的",
          meaning_en: "including all or nearly all elements",
          synonyms: ["thorough", "complete", "exhaustive"],
          antonyms: ["incomplete", "partial", "limited"],
          examples: ["The report provides a comprehensive analysis.", "We need a comprehensive solution."],
        },
      ],
      star: false,
      tags: ["academic"],
    },
    {
      headword: "elaborate",
      phonetic: "/ɪˈlæbərət/",
      meanings: [
        {
          part_of_speech: "adjective",
          meaning_zh: "精心製作的；詳盡的",
          meaning_en: "involving many carefully arranged parts",
          synonyms: ["detailed", "intricate", "complex"],
          antonyms: ["simple", "plain"],
          examples: ["She wore an elaborate dress to the party.", "The plan was quite elaborate."],
        },
        {
          part_of_speech: "verb",
          meaning_zh: "詳細說明",
          meaning_en: "to develop or present in detail",
          synonyms: ["expand", "explain"],
          antonyms: ["summarize"],
          examples: ["Could you elaborate on that point?", "He elaborated his theory in the paper."],
        },
      ],
      star: true,
      tags: ["academic", "verb"],
    },
    {
      headword: "scrutinize",
      phonetic: "/ˈskruːtənaɪz/",
      meanings: [
        {
          part_of_speech: "verb",
          meaning_zh: "仔細檢查；審視",
          meaning_en: "to examine or inspect closely",
          synonyms: ["examine", "inspect", "analyze"],
          antonyms: ["ignore", "overlook"],
          examples: ["The auditor scrutinized the financial records.", "Scientists scrutinize their data carefully."],
        },
      ],
      star: false,
      tags: ["academic", "verb"],
    },
  ],
  // Wordbook 3: 商務英語
  [
    {
      headword: "negotiate",
      phonetic: "/nɪˈɡəʊʃieɪt/",
      meanings: [
        {
          part_of_speech: "verb",
          meaning_zh: "談判；協商",
          meaning_en: "to discuss something to reach an agreement",
          synonyms: ["bargain", "discuss", "mediate"],
          antonyms: [],
          examples: ["We need to negotiate the contract terms.", "She negotiated a higher salary."],
        },
      ],
      star: true,
      tags: ["business", "verb"],
    },
    {
      headword: "deadline",
      phonetic: "/ˈdedlaɪn/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "截止日期",
          meaning_en: "the latest time by which something must be completed",
          synonyms: ["due date", "time limit"],
          antonyms: [],
          examples: ["The deadline for the project is next Friday.", "We must meet this deadline."],
        },
      ],
      star: false,
      tags: ["business", "time"],
    },
    {
      headword: "revenue",
      phonetic: "/ˈrevənjuː/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "收入；營收",
          meaning_en: "income, especially of a company or organization",
          synonyms: ["income", "earnings", "profits"],
          antonyms: ["expenses", "costs"],
          examples: ["Company revenue increased by 20%.", "Advertising is our main source of revenue."],
        },
      ],
      star: true,
      tags: ["business", "finance"],
    },
    {
      headword: "strategy",
      phonetic: "/ˈstrætədʒi/",
      meanings: [
        {
          part_of_speech: "noun",
          meaning_zh: "策略；戰略",
          meaning_en: "a plan of action designed to achieve a goal",
          synonyms: ["plan", "approach", "tactic"],
          antonyms: [],
          examples: ["We need a new marketing strategy.", "The company's growth strategy worked well."],
        },
      ],
      star: false,
      tags: ["business"],
    },
  ],
];

// Stats data - simulate learning progress
const SAMPLE_STATS = [
  // Wordbook 1 stats
  [
    { shown_count: 12, right_count: 10, wrong_count: 2 },
    { shown_count: 8, right_count: 6, wrong_count: 2 },
    { shown_count: 5, right_count: 5, wrong_count: 0 },
    { shown_count: 15, right_count: 12, wrong_count: 3 },
    { shown_count: 3, right_count: 2, wrong_count: 1 },
  ],
  // Wordbook 2 stats
  [
    { shown_count: 10, right_count: 7, wrong_count: 3 },
    { shown_count: 8, right_count: 5, wrong_count: 3 },
    { shown_count: 6, right_count: 4, wrong_count: 2 },
    { shown_count: 4, right_count: 3, wrong_count: 1 },
    { shown_count: 7, right_count: 6, wrong_count: 1 },
    { shown_count: 2, right_count: 1, wrong_count: 1 },
  ],
  // Wordbook 3 stats
  [
    { shown_count: 9, right_count: 8, wrong_count: 1 },
    { shown_count: 5, right_count: 4, wrong_count: 1 },
    { shown_count: 11, right_count: 9, wrong_count: 2 },
    { shown_count: 3, right_count: 2, wrong_count: 1 },
  ],
];

// SRS data - simulate spaced repetition status
const SAMPLE_SRS = [
  // Wordbook 1 SRS
  [
    { ease: 2.5, interval_days: 7, repetitions: 4, due_days: 2 },
    { ease: 2.3, interval_days: 3, repetitions: 2, due_days: 0 },
    { ease: 2.6, interval_days: 14, repetitions: 5, due_days: 5 },
    { ease: 2.1, interval_days: 1, repetitions: 1, due_days: -1 },
    { ease: 2.5, interval_days: 1, repetitions: 1, due_days: 0 },
  ],
  // Wordbook 2 SRS
  [
    { ease: 2.4, interval_days: 5, repetitions: 3, due_days: 1 },
    { ease: 2.2, interval_days: 2, repetitions: 2, due_days: -1 },
    { ease: 2.0, interval_days: 1, repetitions: 1, due_days: 0 },
    { ease: 2.5, interval_days: 10, repetitions: 4, due_days: 3 },
    { ease: 2.6, interval_days: 21, repetitions: 6, due_days: 7 },
    { ease: 2.5, interval_days: 1, repetitions: 0, due_days: 0 },
  ],
  // Wordbook 3 SRS
  [
    { ease: 2.5, interval_days: 6, repetitions: 3, due_days: 2 },
    { ease: 2.3, interval_days: 2, repetitions: 2, due_days: 0 },
    { ease: 2.4, interval_days: 4, repetitions: 3, due_days: 1 },
    { ease: 2.5, interval_days: 1, repetitions: 1, due_days: 0 },
  ],
];

export async function initializeSampleData(): Promise<{ wordbooks: number; cards: number }> {
  // Check if data already exists
  const existingWordbooks = await db.getAllWordbooks();
  if (existingWordbooks.length > 0) {
    return { wordbooks: 0, cards: 0 };
  }

  let totalCards = 0;

  // Create wordbooks and their cards
  for (let i = 0; i < SAMPLE_WORDBOOKS.length; i++) {
    const wordbookData = SAMPLE_WORDBOOKS[i];
    const cardsData = SAMPLE_CARDS_DATA[i];
    const statsData = SAMPLE_STATS[i];
    const srsData = SAMPLE_SRS[i];

    // Create wordbook
    const wordbook = await db.createWordbook(wordbookData);

    // Create cards with stats and SRS
    for (let j = 0; j < cardsData.length; j++) {
      const cardData = cardsData[j];
      const card = await db.createCard({
        wordbook_id: wordbook.id,
        ...cardData,
      });

      // Add stats if available
      if (statsData[j]) {
        await db.createOrUpdateCardStats(card.id, {
          ...statsData[j],
          last_reviewed_at: daysAgo(Math.floor(Math.random() * 7)),
        });
      }

      // Add SRS if available
      if (srsData[j]) {
        const srs = srsData[j];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + srs.due_days);
        await db.createOrUpdateCardSRS(card.id, {
          ease: srs.ease,
          interval_days: srs.interval_days,
          repetitions: srs.repetitions,
          due_at: dueDate.toISOString(),
        });
      }

      totalCards++;
    }
  }

  // Create daily review records for streak using actual cards
  const allCards = [];
  const wordbooks = await db.getAllWordbooks();
  for (const wb of wordbooks) {
    const cards = await db.getCardsByWordbook(wb.id);
    allCards.push(...cards);
  }

  const reviewRecords = [
    { daysAgo: 0, correct_count: 12, wrong_count: 3 },
    { daysAgo: 1, correct_count: 18, wrong_count: 2 },
    { daysAgo: 2, correct_count: 8, wrong_count: 2 },
    { daysAgo: 3, correct_count: 22, wrong_count: 3 },
    { daysAgo: 4, correct_count: 10, wrong_count: 2 },
    { daysAgo: 6, correct_count: 15, wrong_count: 3 },
    { daysAgo: 7, correct_count: 7, wrong_count: 1 },
  ];

  for (const record of reviewRecords) {
    const date = formatDate(record.daysAgo);
    // Simulate reviews with random cards
    for (let i = 0; i < record.correct_count && allCards[i]; i++) {
      await db.createOrUpdateDailyReviewRecord(date, allCards[i % allCards.length].id, true);
    }
    for (let i = 0; i < record.wrong_count && allCards[i]; i++) {
      await db.createOrUpdateDailyReviewRecord(date, allCards[i % allCards.length].id, false);
    }
  }

  return { wordbooks: SAMPLE_WORDBOOKS.length, cards: totalCards };
}

export async function clearAllData(): Promise<void> {
  const wordbooks = await db.getAllWordbooks();
  for (const wordbook of wordbooks) {
    const cards = await db.getCardsByWordbook(wordbook.id);
    for (const card of cards) {
      await db.deleteCard(card.id);
    }
    await db.deleteWordbook(wordbook.id);
  }
}
