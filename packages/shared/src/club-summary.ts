/**
 * Club Participation Summary & Aggregation Module
 * Provides case-insensitive, whitespace-normalized grouping of participant club names.
 */

export const DEFAULT_UNKNOWN_CLUB = 'Unknown / Not Provided';

export interface ClubSummaryItem {
  clubName: string;
  count: number;
  percentage: number;
}

export interface ClubSummaryReport {
  totalResponses: number;
  uniqueClubs: number;
  items: ClubSummaryItem[];
  generatedAt: string;
}

/**
 * Normalizes a club name string by trimming leading/trailing whitespace
 * and collapsing multiple consecutive whitespace characters into a single space.
 */
export function normalizeClubName(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Formats a club name into clean standard title casing while preserving
 * standard lower-case grammatical particles (e.g. 'of', 'and', 'the', 'in', 'da').
 */
export function formatClubDisplayName(cleanName: string): string {
  if (!cleanName) return DEFAULT_UNKNOWN_CLUB;
  
  // If the string already has mixed case with lowercase particles (not all uppercase and not all lowercase),
  // preserve the original capitalization so proper nouns, Roman numerals, or specific acronyms (e.g. RAC, RI) are preserved.
  const isAllUpper = cleanName === cleanName.toUpperCase();
  const isAllLower = cleanName === cleanName.toLowerCase();
  
  if (!isAllUpper && !isAllLower) {
    return cleanName;
  }

  const minorWords = new Set(['of', 'the', 'and', 'in', 'for', 'de', 'da', 'at', 'by']);
  const words = cleanName.split(' ');
  
  return words.map((w, index) => {
    const lower = w.toLowerCase();
    if (index > 0 && minorWords.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

/**
 * Extracts club name from various possible participant record shapes.
 */
export function extractClubName(record: any): string {
  if (!record) return '';
  if (typeof record === 'string') return record;
  if (record.participant_data && typeof record.participant_data === 'object') {
    const fromData = record.participant_data.club_name || 
                     record.participant_data.clubName || 
                     record.participant_data.club;
    if (fromData && typeof fromData === 'string') return fromData;
  }
  if (typeof record.club_name === 'string') return record.club_name;
  if (typeof record.clubName === 'string') return record.clubName;
  if (typeof record.club === 'string') return record.club;
  return '';
}

/**
 * Aggregates responses by club name with case-insensitive and whitespace-normalized grouping.
 * Returns sorted summary items with counts, percentages, total responses, and unique club counts.
 */
export function generateClubSummary(
  records: Array<any>
): ClubSummaryReport {
  const groups = new Map<string, { displayName: string; count: number }>();
  let totalResponses = 0;

  for (const record of records) {
    totalResponses++;
    const rawClub = extractClubName(record);
    const cleaned = normalizeClubName(rawClub);

    if (!cleaned) {
      const key = DEFAULT_UNKNOWN_CLUB.toLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, { displayName: DEFAULT_UNKNOWN_CLUB, count: 1 });
      }
      continue;
    }

    const key = cleaned.toLowerCase();
    const existing = groups.get(key);

    if (existing) {
      existing.count++;
      // If the incoming record has better mixed casing than the current display name, upgrade display name
      const isCurAllUpper = existing.displayName === existing.displayName.toUpperCase();
      const isCurAllLower = existing.displayName === existing.displayName.toLowerCase();
      const isNewAllUpper = cleaned === cleaned.toUpperCase();
      const isNewAllLower = cleaned === cleaned.toLowerCase();

      if ((isCurAllUpper || isCurAllLower) && !isNewAllUpper && !isNewAllLower) {
        existing.displayName = formatClubDisplayName(cleaned);
      }
    } else {
      groups.set(key, {
        displayName: formatClubDisplayName(cleaned),
        count: 1
      });
    }
  }

  // Convert to array
  const rawItems = Array.from(groups.values()).map(g => ({
    clubName: g.displayName,
    count: g.count,
    percentage: totalResponses > 0 ? Number(((g.count / totalResponses) * 100).toFixed(1)) : 0
  }));

  // Deterministic sorting: Highest frequency first; secondary sort alphabetical by clubName
  rawItems.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.clubName.localeCompare(b.clubName, undefined, { sensitivity: 'base' });
  });

  // Calculate unique clubs: clubs identified excluding unknown placeholder if present
  const uniqueClubs = rawItems.filter(item => item.clubName !== DEFAULT_UNKNOWN_CLUB).length;

  return {
    totalResponses,
    uniqueClubs,
    items: rawItems,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Formats a ClubSummaryReport as a standardized CSV string.
 */
export function exportClubSummaryCsv(summary: ClubSummaryReport): string {
  const headers = ['Club Name', 'Response Count', 'Percentage'];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replaceAll('"', '""');
    return `"${str}"`;
  };

  const rows = summary.items.map(item => [
    escapeCsv(item.clubName),
    escapeCsv(item.count),
    escapeCsv(`${item.percentage.toFixed(1)}%`)
  ].join(','));

  const totalRow = [
    escapeCsv('TOTAL'),
    escapeCsv(summary.totalResponses),
    escapeCsv('100.0%')
  ].join(',');

  return [headers.join(','), ...rows, totalRow].join('\n');
}
