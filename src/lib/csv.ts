/**
 * CSV Import/Export utilities for vocabulary cards
 */

export interface CSVCard {
  headword: string;
  meaning_zh?: string;
  meaning_en?: string;
  part_of_speech?: string;
  ipa?: string;
  notes?: string;
  tags?: string;
  synonyms?: string;
  antonyms?: string;
  examples?: string;
}

/**
 * Parse CSV content to card objects
 * @param csvContent - Raw CSV string
 * @returns Array of card objects
 */
export function parseCSV(csvContent: string): CSVCard[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const header = lines[0].split(',').map(h => h.trim());
  
  // Parse rows
  const cards: CSVCard[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const card: CSVCard = { headword: '' };
    header.forEach((key, index) => {
      if (values[index]) {
        (card as any)[key] = values[index];
      }
    });

    if (card.headword) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Convert cards to CSV format
 * @param cards - Array of card objects
 * @returns CSV string with UTF-8 BOM
 */
export function cardsToCSV(cards: any[]): string {
  if (cards.length === 0) return '';

  // Header
  const headers = [
    'headword',
    'meaning_zh',
    'meaning_en',
    'part_of_speech',
    'ipa',
    'notes',
    'tags',
    'synonyms',
    'antonyms',
    'examples'
  ];

  const csvLines = [headers.join(',')];

  // Rows
  cards.forEach(card => {
    const row = headers.map(header => {
      let value = '';
      
      if (header === 'tags' && card.tags) {
        value = Array.isArray(card.tags) ? card.tags.join('|') : '';
      } else if (header === 'synonyms' && card.detail?.synonyms) {
        value = Array.isArray(card.detail.synonyms) ? card.detail.synonyms.join('|') : '';
      } else if (header === 'antonyms' && card.detail?.antonyms) {
        value = Array.isArray(card.detail.antonyms) ? card.detail.antonyms.join('|') : '';
      } else if (header === 'examples' && card.detail?.examples) {
        value = Array.isArray(card.detail.examples) ? card.detail.examples.join('|') : '';
      } else if (header === 'ipa') {
        value = card.phonetic || card.detail?.ipa || '';
      } else {
        value = card[header] || '';
      }

      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });

    csvLines.push(row.join(','));
  });

  // Add UTF-8 BOM
  return '\uFEFF' + csvLines.join('\n');
}

/**
 * Download CSV file
 * @param csvContent - CSV string
 * @param filename - File name
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger file input to upload CSV
 * @param callback - Function to call with file content
 */
export function uploadCSV(callback: (content: string) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      callback(content);
    };
    reader.readAsText(file);
  };

  input.click();
}
