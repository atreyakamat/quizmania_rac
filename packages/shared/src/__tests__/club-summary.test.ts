import { 
  normalizeClubName, 
  formatClubDisplayName, 
  generateClubSummary, 
  exportClubSummaryCsv,
  DEFAULT_UNKNOWN_CLUB 
} from '../club-summary';
import { getClubSummary, exportClubSummaryCsvFromFilters } from '../dal/admin';
import { mockStore } from '../mock-data';

export async function runClubSummaryTests() {
  console.log('\n========================================');
  console.log('Running Club Participation Summary Tests');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${message}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${message}`);
    }
  }

  function assertEqual(actual: any, expected: any, message: string) {
    if (actual === expected) {
      passed++;
      console.log(`  [PASS] ${message}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${message}`);
      console.error(`    Expected: ${JSON.stringify(expected)}`);
      console.error(`    Actual:   ${JSON.stringify(actual)}`);
    }
  }

  // 1. normalizeClubName tests
  assertEqual(normalizeClubName('   Rotaract Club of Mapusa   '), 'Rotaract Club of Mapusa', 'Trims leading and trailing whitespace');
  assertEqual(normalizeClubName('Rotaract    Club    of    Mapusa'), 'Rotaract Club of Mapusa', 'Collapses multiple internal spaces into single space');
  assertEqual(normalizeClubName("Rotaract\tClub\n\nof\r\nMapusa"), 'Rotaract Club of Mapusa', 'Collapses tabs and newlines into single space');
  assertEqual(normalizeClubName(''), '', 'Empty string returns empty string');
  assertEqual(normalizeClubName('    '), '', 'Whitespace-only string returns empty string');
  assertEqual(normalizeClubName(null), '', 'Null returns empty string');
  assertEqual(normalizeClubName(undefined), '', 'Undefined returns empty string');

  // 2. formatClubDisplayName tests
  assertEqual(formatClubDisplayName('ROTARACT CLUB OF MAPUSA'), 'Rotaract Club of Mapusa', 'Normalizes all-caps name to title case with lowercase particles');
  assertEqual(formatClubDisplayName('rotaract club of mapusa'), 'Rotaract Club of Mapusa', 'Normalizes all-lowercase name to title case with lowercase particles');
  assertEqual(formatClubDisplayName('Rotaract Club of Mapusa'), 'Rotaract Club of Mapusa', 'Preserves clean existing title-case name');
  assertEqual(formatClubDisplayName(''), DEFAULT_UNKNOWN_CLUB, 'Empty string formats to Unknown / Not Provided');

  // 3. Case-insensitive and whitespace-normalized grouping
  const testRecords = [
    { participant_data: { club_name: 'Rotaract Club of Mapusa' } },
    { participant_data: { club_name: 'rotaract club of mapusa' } },
    { participant_data: { club_name: 'ROTARACT CLUB OF MAPUSA' } },
    { participant_data: { club_name: 'Rotaract Club Of Mapusa' } },
    { participant_data: { club_name: '  Rotaract   Club   of Mapusa  ' } },
    { participant_data: { club_name: 'Rotaract Club of Panaji' } },
    { participant_data: { club_name: 'ROTARACT CLUB OF PANAJI' } },
    { participant_data: { club_name: 'Rotaract Club of Vasco da Gama' } },
    { participant_data: { club_name: '' } },
    { participant_data: {} },
    { participant_data: { club_name: null } }
  ];

  const summary = generateClubSummary(testRecords);

  assertEqual(summary.totalResponses, 11, 'Total responses matches input record count (11)');
  assertEqual(summary.uniqueClubs, 3, 'Unique named clubs is 3 (Mapusa, Panaji, Vasco da Gama)');
  assertEqual(summary.items.length, 4, 'Summary includes 4 groups (3 named clubs + 1 Unknown group)');

  // 4. Frequency counts
  const mapusa = summary.items.find(i => i.clubName === 'Rotaract Club of Mapusa');
  assert(Boolean(mapusa), 'Rotaract Club of Mapusa found in summary');
  assertEqual(mapusa?.count, 5, 'Rotaract Club of Mapusa grouped exactly 5 responses across casing/whitespace variations');
  assertEqual(mapusa?.percentage, 45.5, 'Rotaract Club of Mapusa percentage is 45.5% (5/11)');

  const panaji = summary.items.find(i => i.clubName === 'Rotaract Club of Panaji');
  assert(Boolean(panaji), 'Rotaract Club of Panaji found in summary');
  assertEqual(panaji?.count, 2, 'Rotaract Club of Panaji grouped exactly 2 responses');
  assertEqual(panaji?.percentage, 18.2, 'Rotaract Club of Panaji percentage is 18.2% (2/11)');

  const vasco = summary.items.find(i => i.clubName === 'Rotaract Club of Vasco da Gama');
  assert(Boolean(vasco), 'Rotaract Club of Vasco da Gama found in summary');
  assertEqual(vasco?.count, 1, 'Rotaract Club of Vasco da Gama has exactly 1 response');

  const unknown = summary.items.find(i => i.clubName === DEFAULT_UNKNOWN_CLUB);
  assert(Boolean(unknown), 'Unknown / Not Provided found in summary');
  assertEqual(unknown?.count, 3, 'Unknown / Not Provided grouped 3 blank/missing responses');
  assertEqual(unknown?.percentage, 27.3, 'Unknown / Not Provided percentage is 27.3% (3/11)');

  // 5. Preserving legitimate differences
  assert(
    summary.items.some(i => i.clubName.includes('Mapusa')) &&
    summary.items.some(i => i.clubName.includes('Panaji')) &&
    summary.items.some(i => i.clubName.includes('Vasco')),
    'Legitimate club name differences are strictly preserved and not merged'
  );

  // 6. Deterministic sorting: Highest frequency first, alphabetical tie-break
  const tieRecords = [
    { participant_data: { club_name: 'Club Charlie' } },
    { participant_data: { club_name: 'Club Alpha' } },
    { participant_data: { club_name: 'Club Bravo' } },
    { participant_data: { club_name: 'Club Mega' } },
    { participant_data: { club_name: 'Club Mega' } }
  ];
  const tieSummary = generateClubSummary(tieRecords);
  assertEqual(tieSummary.items[0].clubName, 'Club Mega', 'First item is highest frequency (Club Mega, count 2)');
  assertEqual(tieSummary.items[0].count, 2, 'Club Mega count is 2');
  assertEqual(tieSummary.items[1].clubName, 'Club Alpha', 'Ties sorted alphabetically: Club Alpha comes before Club Bravo');
  assertEqual(tieSummary.items[2].clubName, 'Club Bravo', 'Ties sorted alphabetically: Club Bravo comes before Club Charlie');
  assertEqual(tieSummary.items[3].clubName, 'Club Charlie', 'Ties sorted alphabetically: Club Charlie comes last');

  // 7. CSV Export verification
  const csv = exportClubSummaryCsv(summary);
  assert(csv.includes('Club Name,Response Count,Percentage'), 'CSV contains standard header row');
  assert(csv.includes('"Rotaract Club of Mapusa","5","45.5%"'), 'CSV contains Mapusa data row');
  assert(csv.includes('"Unknown / Not Provided","3","27.3%"'), 'CSV contains Unknown data row');
  assert(csv.includes('"TOTAL","11","100.0%"'), 'CSV contains TOTAL footer row with grand total 11');

  // 8. DAL integration test with mockStore (isolated with FORCE_MOCK_STORE)
  const prevForceMock = process.env.FORCE_MOCK_STORE;
  process.env.FORCE_MOCK_STORE = 'true';

  mockStore.addSubmission({
    id: 'test-sub-101',
    quiz_id: 'quiz-club-test',
    participant_name: 'Participant 1',
    participant_email: 'p1@test.com',
    participant_data: { club_name: 'Rotaract Club of Mapusa' },
    score: 10,
    total_possible_marks: 10,
    percentage: 100,
    passed: true,
    submitted_at: new Date().toISOString()
  });
  mockStore.addSubmission({
    id: 'test-sub-102',
    quiz_id: 'quiz-club-test',
    participant_name: 'Participant 2',
    participant_email: 'p2@test.com',
    participant_data: { club_name: 'rotaract club of mapusa' },
    score: 8,
    total_possible_marks: 10,
    percentage: 80,
    passed: true,
    submitted_at: new Date().toISOString()
  });
  mockStore.addSubmission({
    id: 'test-sub-103',
    quiz_id: 'quiz-club-other',
    participant_name: 'Participant 3',
    participant_email: 'p3@test.com',
    participant_data: { club_name: 'Rotaract Club of Panaji' },
    score: 9,
    total_possible_marks: 10,
    percentage: 90,
    passed: true,
    submitted_at: new Date().toISOString()
  });

  const dalSummaryAll = await getClubSummary();
  assert(dalSummaryAll.totalResponses >= 3, 'getClubSummary without filters aggregates all responses');

  const dalSummaryFiltered = await getClubSummary({ quizId: 'quiz-club-test' });
  assertEqual(dalSummaryFiltered.totalResponses, 2, 'getClubSummary with quizId filter only aggregates matching quiz responses');
  assertEqual(dalSummaryFiltered.items[0].clubName, 'Rotaract Club of Mapusa', 'Filtered summary accurately groups Mapusa');
  assertEqual(dalSummaryFiltered.items[0].count, 2, 'Filtered summary count is exactly 2');

  const dalCsv = await exportClubSummaryCsvFromFilters({ quizId: 'quiz-club-test' });
  assert(dalCsv.includes('"Rotaract Club of Mapusa","2"'), 'exportClubSummaryCsvFromFilters returns formatted CSV with filtered data');

  // Cleanup
  mockStore.submissions = mockStore.submissions.filter(s => s.id !== 'test-sub-101' && s.id !== 'test-sub-102' && s.id !== 'test-sub-103');
  mockStore.syncToDisk();
  process.env.FORCE_MOCK_STORE = prevForceMock;

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('club-summary.test.ts')) {
  runClubSummaryTests();
}
