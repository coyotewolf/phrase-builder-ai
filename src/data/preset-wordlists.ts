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
    // Fallback to empty lists or a default if fetching fails
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

// Export individual lists for backward compatibility if needed,
// but encourage using getPresetWordlists()
export const HIGH_SCHOOL_7000 = (await getPresetWordlists()).HIGH_SCHOOL_7000;
export const HIGH_SCHOOL_LEVEL_2 = (await getPresetWordlists()).HIGH_SCHOOL_LEVEL_2;
export const HIGH_SCHOOL_LEVEL_3 = (await getPresetWordlists()).HIGH_SCHOOL_LEVEL_3;
export const HIGH_SCHOOL_LEVEL_4 = (await getPresetWordlists()).HIGH_SCHOOL_LEVEL_4;
export const HIGH_SCHOOL_LEVEL_5 = (await getPresetWordlists()).HIGH_SCHOOL_LEVEL_5;
export const TOEFL_3000 = (await getPresetWordlists()).TOEFL_3000;
export const GRE_3000 = (await getPresetWordlists()).GRE_3000;
export const IELTS_CORE = (await getPresetWordlists()).IELTS_CORE;
export const TOEIC_CORE = (await getPresetWordlists()).TOEIC_CORE;
export const SAT_CORE = (await getPresetWordlists()).SAT_CORE;
export const BUSINESS_ENGLISH = (await getPresetWordlists()).BUSINESS_ENGLISH;
export const ACADEMIC_ENGLISH = (await getPresetWordlists()).ACADEMIC_ENGLISH;
export const DAILY_ENGLISH = (await getPresetWordlists()).DAILY_ENGLISH;
