import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HIGH_SCHOOL_7000 = [
  "a", "ability", "able", "about", "above", "abroad", "absence", "absent", "absolute", "absolutely",
  "absorb", "abstract", "absurd", "abuse", "academic", "accept", "access", "accident", "accompany", "accomplish",
  "according", "account", "accurate", "accuse", "achieve", "acid", "acknowledge", "acquire", "across", "act",
  "action", "active", "activity", "actor", "actual", "actually", "adapt", "add", "addition", "address",
  "adequate", "adjust", "administration", "admire", "admit", "adopt", "adult", "advance", "advanced", "advantage",
  "adventure", "advertise", "advice", "advise", "advocate", "affair", "affect", "afford", "afraid", "after",
  "afternoon", "again", "against", "age", "agency", "agenda", "agent", "aggressive", "ago", "agree",
  "agreement", "agriculture", "ahead", "aid", "aim", "air", "aircraft", "airline", "airport", "alarm",
  "album", "alcohol", "alert", "alien", "alike", "alive", "all", "alliance", "allow", "ally",
  "almost", "alone", "along", "aloud", "alphabet", "already", "also", "alter", "alternative", "although",
  "altogether", "always", "amazing", "ambition", "ambulance", "among", "amount", "amuse", "analysis", "analyze"
].concat(
  Array.from({ length: 900 }, (_, i) => `word_level1_${i + 101}`)
);

const HIGH_SCHOOL_LEVEL_2 = Array.from({ length: 1000 }, (_, i) => `word_level2_${i + 1}`);
const HIGH_SCHOOL_LEVEL_3 = Array.from({ length: 1500 }, (_, i) => `word_level3_${i + 1}`);
const HIGH_SCHOOL_LEVEL_4 = Array.from({ length: 1500 }, (_, i) => `word_level4_${i + 1}`);
const HIGH_SCHOOL_LEVEL_5 = Array.from({ length: 2000 }, (_, i) => `word_level5_${i + 1}`);

const TOEFL_3000 = [
  "abandon", "abstract", "academic", "accelerate", "access", "accommodate", "accompany", "accomplish", "accumulate", "accurate",
  "achieve", "acknowledge", "acquire", "adapt", "adequate", "adjacent", "adjust", "administration", "adopt", "adult",
  "advance", "advantage", "advocate", "aesthetic", "affect", "afford", "aggregate", "agriculture", "aid", "allocate",
  "alter", "alternative", "ambiguous", "analogous", "analyze", "annual", "anticipate", "apparent", "appeal", "append",
  "appreciate", "approach", "appropriate", "approximate", "arbitrary", "area", "aspect", "assemble", "assess", "assign"
].concat(
  Array.from({ length: 2950 }, (_, i) => `toefl_word_${i + 51}`)
);

const GRE_3000 = [
  "abate", "aberrant", "abeyance", "abscond", "abstemious", "admonish", "adulterate", "aesthetic", "aggregate", "alacrity",
  "alleviate", "amalgamate", "ambiguous", "ambivalent", "ameliorate", "amenable", "anachronism", "analogous", "anarchy", "anomalous",
  "antipathy", "apathy", "appease", "approbation", "appropriate", "arcane", "archaic", "arduous", "artless", "ascetic",
  "assuage", "attenuate", "audacious", "austere", "autonomous", "aver", "banal", "belie", "beneficent", "bolster",
  "bombastic", "boorish", "burgeon", "burnish", "buttress", "capricious", "castigation", "catalyst", "caustic", "censure"
].concat(
  Array.from({ length: 2950 }, (_, i) => `gre_word_${i + 51}`)
);

const IELTS_CORE = [
  "abandon", "ability", "abolish", "abortion", "absorb", "abstract", "absurd", "abundant", "abuse", "academic",
  "accelerate", "accent", "accept", "access", "accident", "accommodate", "accompany", "accomplish", "accord", "account",
  "accumulate", "accurate", "accuse", "achieve", "acknowledge", "acquire", "adapt", "adequate", "adjacent"
].concat(
  Array.from({ length: 2970 }, (_, i) => `ielts_word_${i + 31}`)
);

const TOEIC_CORE = [
  "abandon", "ability", "abroad", "absence", "absolute", "absorb", "abstract", "abuse", "academic", "accelerate",
  "accent", "accept", "access", "accident", "accommodate", "accompany", "accomplish", "according", "account", "accumulate"
].concat(
  Array.from({ length: 2980 }, (_, i) => `toeic_word_${i + 21}`)
);

const SAT_CORE = [
  "abandon", "aberration", "abhor", "abide", "abolish", "abrasive", "abridge", "absolute", "absolve", "abstain",
  "abstract", "absurd", "abundant", "abuse", "academic", "accede", "accelerate", "accentuate", "accessible", "acclaim"
].concat(
  Array.from({ length: 1980 }, (_, i) => `sat_word_${i + 21}`)
);

const BUSINESS_ENGLISH = [
  "account", "acquire", "acquisition", "address", "administrative", "advertising", "agenda", "agreement", "allocate", "analysis",
  "annual", "application", "appraisal", "approach", "approval", "asset", "assign", "associate", "assume", "assurance"
].concat(
  Array.from({ length: 1480 }, (_, i) => `business_word_${i + 21}`)
);

const ACADEMIC_ENGLISH = [
  "abstract", "academic", "access", "accommodate", "accompany", "accomplish", "according", "account", "accumulate", "accurate",
  "achieve", "acknowledge", "acquire", "adapt", "adequate", "adjust", "administration", "adult", "advance", "advocate"
].concat(
  Array.from({ length: 1480 }, (_, i) => `academic_word_${i + 21}`)
);

const DAILY_ENGLISH = [
  "abandon", "ability", "able", "about", "above", "abroad", "absence", "absent", "absolute", "absorb",
  "accept", "access", "accident", "accompany", "according", "account", "achieve", "across", "act", "action"
].concat(
  Array.from({ length: 980 }, (_, i) => `daily_word_${i + 21}`)
);

const wordlists = {
  HIGH_SCHOOL_7000,
  HIGH_SCHOOL_LEVEL_2,
  HIGH_SCHOOL_LEVEL_3,
  HIGH_SCHOOL_LEVEL_4,
  HIGH_SCHOOL_LEVEL_5,
  TOEFL_3000,
  GRE_3000,
  IELTS_CORE,
  TOEIC_CORE,
  SAT_CORE,
  BUSINESS_ENGLISH,
  ACADEMIC_ENGLISH,
  DAILY_ENGLISH,
};

fs.writeFileSync(path.join(__dirname, 'public', 'data', 'preset-wordlists.json'), JSON.stringify(wordlists, null, 2));
console.log('Generated public/data/preset-wordlists.json');