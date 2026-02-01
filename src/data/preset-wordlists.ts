interface Wordlists {
  HIGH_SCHOOL_7000: string[];
  HIGH_SCHOOL_LEVEL_2: string[];
  HIGH_SCHOOL_LEVEL_3: string[];
  HIGH_SCHOOL_LEVEL_4: string[];
  HIGH_SCHOOL_LEVEL_5: string[];
  TOEFL_3000: string[];
  GRE_3000: string[];
  IELTS_CORE: string[];
  TOEIC_CORE: string[];
  SAT_CORE: string[];
  BUSINESS_ENGLISH: string[];
  ACADEMIC_ENGLISH: string[];
  DAILY_ENGLISH: string[];
}

let loadedWordlists: Wordlists | null = null;

export async function getPresetWordlists(): Promise<Wordlists> {
  if (loadedWordlists) {
    return loadedWordlists;
  }

  try {
    const response = await fetch('/data/preset-wordlists.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch preset wordlists: ${response.statusText}`);
    }
    loadedWordlists = await response.json();
    return loadedWordlists!;
  } catch (error) {
    console.error("Error loading preset wordlists:", error);
    // Fallback to empty lists if fetching fails
    return {
      HIGH_SCHOOL_7000: [],
      HIGH_SCHOOL_LEVEL_2: [],
      HIGH_SCHOOL_LEVEL_3: [],
      HIGH_SCHOOL_LEVEL_4: [],
      HIGH_SCHOOL_LEVEL_5: [],
      TOEFL_3000: [],
      GRE_3000: [],
      IELTS_CORE: [],
      TOEIC_CORE: [],
      SAT_CORE: [],
      BUSINESS_ENGLISH: [],
      ACADEMIC_ENGLISH: [],
      DAILY_ENGLISH: [],
    };
  }
}

export type { Wordlists };
