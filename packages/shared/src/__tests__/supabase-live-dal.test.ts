import { test } from 'node:test';
import assert from 'node:assert';
import {
  setMockSupabaseClients,
  resetSupabaseClients,
  saveQuiz,
  getQuizById,
  getQuizBySlug,
  getAllQuizzes,
  setQuizStatus,
  deleteQuiz,
  getAllThemes,
  getThemeById,
  saveTheme,
  getResponsesPaginated,
  getResponseDetail,
  updateManualGrade,
  exportResponsesCsv,
  getAdminUserRecord,
  saveAdminUserRecord,
  getPublishedQuizBySlug,
  getPublishedQuizzesList,
  createQuizAttempt,
  getQuizAttemptByToken,
  updateQuizAttemptStatus,
  uploadImage,
  getStorageImageUrl,
  getDatabaseStatus,
  isSupabaseDatabaseReady,
  getSupabaseAuthenticatedClient,
  requireAuthenticatedAdmin,
  scoreAndRecordQuizSubmission
} from '../index';

async function runLiveDalTests() {
  console.log('\n========================================');
  console.log('Running Live Supabase DAL Query Engine Tests');
  console.log('========================================\n');

  const LIVE_QUIZ_ID = '11111111-1111-4111-a111-111111111101';
  const LIVE_SEC_ID = '22222222-2222-4222-a222-222222222201';
  const LIVE_Q_ID = '33333333-3333-4333-a333-333333333301';
  const LIVE_OPT_ID = '44444444-4444-4444-a444-444444444401';

  // Setup rich in-memory tables for mock Supabase client
  const tables: Record<string, any[]> = {
    quizzes: [
      {
        id: LIVE_QUIZ_ID,
        title: 'Live Supabase Test Quiz',
        slug: 'live-supabase-test-quiz',
        description: 'Test description',
        cover_image: 'https://example.com/cover.jpg',
        status: 'published',
        settings: { time_limit_minutes: 15, passing_score_percentage: 50 },
        instructions: 'Test instructions',
        sections: [
          { id: LIVE_SEC_ID, quiz_id: LIVE_QUIZ_ID, title: 'Section 1', section_order: 1 }
        ]
      }
    ],
    sections: [
      {
        id: LIVE_SEC_ID,
        quiz_id: LIVE_QUIZ_ID,
        title: 'Section 1',
        description: 'Section description',
        section_order: 1
      }
    ],
    questions: [
      {
        id: LIVE_Q_ID,
        quiz_id: LIVE_QUIZ_ID,
        section_id: LIVE_SEC_ID,
        question_text: 'What is 2 + 2?',
        question_type: 'single_choice',
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 1,
        scoring_method: 'all_or_nothing'
      }
    ],
    options: [
      {
        id: LIVE_OPT_ID,
        question_id: LIVE_Q_ID,
        option_text: '4',
        is_correct: true,
        option_order: 1
      },
      {
        id: '44444444-4444-4444-a444-444444444402',
        question_id: LIVE_Q_ID,
        option_text: '5',
        is_correct: false,
        option_order: 2
      }
    ],
    submissions: [
      {
        id: 'sub-live-1',
        quiz_id: LIVE_QUIZ_ID,
        participant_name: 'Test Participant',
        participant_email: 'participant@test.com',
        score: 5,
        total_possible_marks: 5,
        percentage: 100,
        passed: true,
        submitted_at: new Date().toISOString(),
        attempt_id: 'att-live-1'
      }
    ],
    answers: [
      {
        id: 'ans-live-1',
        submission_id: 'sub-live-1',
        question_id: LIVE_Q_ID,
        selected_option_id: LIVE_OPT_ID,
        earned_marks: 5
      }
    ],
    quiz_attempts: [
      {
        id: 'att-live-1',
        quiz_id: LIVE_QUIZ_ID,
        session_token: 'live_tok_123',
        status: 'in_progress',
        created_at: new Date().toISOString()
      }
    ],
    admin_users: [
      {
        id: 'adm-live-1',
        user_id: 'u-live-admin',
        email: 'live-admin@quizmania.dev',
        role: 'admin',
        enabled: true
      }
    ],
    themes: [
      {
        id: 'thm-live-1',
        name: 'Live Theme',
        primary_color: '#123456'
      }
    ]
  };

  const createQueryBuilder = (tableName: string) => {
    let rows = [...(tables[tableName] || [])];
    if (tableName === 'quizzes') {
      rows = rows.map(q => {
        const qList = (tables['questions'] || []).filter(item => item.quiz_id === q.id).map(item => {
          const opts = (tables['options'] || []).filter(o => o.question_id === item.id);
          return { ...item, options: opts };
        });
        const secs = (tables['sections'] || []).filter(s => s.quiz_id === q.id);
        return { ...q, questions: qList, sections: secs };
      });
    }
    const b: any = {
      select: () => b,
      eq: (col: string, val: any) => {
        rows = rows.filter(r => r[col] === val);
        return b;
      },
      in: (col: string, vals: any[]) => {
        rows = rows.filter(r => vals.includes(r[col]));
        return b;
      },
      not: () => b,
      gte: (col: string, val: any) => {
        rows = rows.filter(r => r[col] >= val);
        return b;
      },
      lte: (col: string, val: any) => {
        rows = rows.filter(r => r[col] <= val);
        return b;
      },
      or: (condition: string) => b,
      order: () => b,
      limit: (n: number) => {
        rows = rows.slice(0, n);
        return b;
      },
      maybeSingle: async () => ({ data: rows[0] || null, error: null }),
      single: async () => ({ data: rows[0] || null, error: null }),
      insert: (items: any) => {
        const arr = Array.isArray(items) ? items : [items];
        tables[tableName] = [...(tables[tableName] || []), ...arr];
        return {
          select: () => ({
            single: async () => ({ data: arr[0], error: null }),
            then: (res: any) => res({ data: arr, error: null })
          }),
          then: (res: any) => res({ data: arr, error: null })
        };
      },
      upsert: (items: any) => {
        const arr = Array.isArray(items) ? items : [items];
        arr.forEach(item => {
          const idx = (tables[tableName] || []).findIndex(r => r.id === item.id);
          if (idx >= 0) {
            tables[tableName][idx] = { ...tables[tableName][idx], ...item };
          } else {
            tables[tableName] = [...(tables[tableName] || []), item];
          }
        });
        return {
          select: () => ({
            single: async () => ({ data: arr[0], error: null }),
            then: (res: any) => res({ data: arr, error: null })
          }),
          then: (res: any) => res({ data: arr, error: null })
        };
      },
      update: (payload: any) => ({
        eq: (col: string, val: any) => {
          rows.forEach(r => {
            if (r[col] === val) Object.assign(r, payload);
          });
          const match = rows.find(r => r[col] === val) || null;
          return {
            select: () => ({
              single: async () => ({ data: match, error: null }),
              maybeSingle: async () => ({ data: match, error: null }),
              then: (res: any) => res({ data: match ? [match] : [], error: null })
            }),
            single: async () => ({ data: match, error: null }),
            maybeSingle: async () => ({ data: match, error: null }),
            then: (res: any) => res({ data: null, error: null })
          };
        }
      }),
      delete: () => ({
        eq: (col: string, val: any) => {
          tables[tableName] = (tables[tableName] || []).filter(r => r[col] !== val);
          return {
            not: () => ({ then: (res: any) => res({ data: null, error: null }) }),
            then: (res: any) => res({ data: null, error: null })
          };
        }
      }),
      then: (res: any) => res({ data: rows, error: null })
    };
    return b;
  };

  const mockSupabaseClient = {
    from: (table: string) => createQueryBuilder(table),
    storage: {
      from: (bucket: string) => ({
        upload: async (fileName: string) => ({ data: { path: `${bucket}/${fileName}` }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.supabase.co/${path}` } })
      })
    },
    auth: {
      getUser: async (token: string) => {
        if (token === 'live-valid-token') {
          return {
            data: { user: { id: 'u-live-admin', email: 'live-admin@quizmania.dev', user_metadata: { role: 'admin' } } },
            error: null
          };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      },
      refreshSession: async ({ refresh_token }: any) => {
        if (refresh_token === 'live-valid-refresh') {
          return {
            data: {
              session: { access_token: 'live-valid-token', refresh_token: 'live-valid-refresh', expires_in: 3600 },
              user: { id: 'u-live-admin', email: 'live-admin@quizmania.dev', user_metadata: { role: 'admin' } }
            },
            error: null
          };
        }
        return { data: { session: null, user: null }, error: new Error('Invalid refresh token') };
      }
    }
  };

  // Inject mock live clients
  setMockSupabaseClients({
    adminClient: mockSupabaseClient,
    publicClient: mockSupabaseClient,
    ready: true
  });

  try {
    await test('1. Ready & Database Status', async () => {
      const isReady = await isSupabaseDatabaseReady();
      assert.ok(isReady === true, 'isSupabaseDatabaseReady returns true with mock client');

      const dbStatus = await getDatabaseStatus();
      assert.ok(dbStatus.ready === true && dbStatus.mode === 'supabase', 'getDatabaseStatus reports supabase mode when ready');

      const authClient = getSupabaseAuthenticatedClient('live-test-token');
      assert.ok(authClient !== null, 'getSupabaseAuthenticatedClient instantiates client');
    });

    await test('2. Storage with live client', async () => {
      const uploaded = await uploadImage('quiz-covers', new Blob(['fake']), 'cover.png');
      assert.ok(uploaded.success && Boolean(uploaded.url), 'uploadImage succeeds via live storage client');

      const publicUrl = getStorageImageUrl('quiz-covers', 'quiz-covers/cover.png');
      assert.ok(publicUrl.includes('https://storage.supabase.co'), 'getStorageImageUrl returns public URL via client');
    });

    await test('3. DAL Admin: Live queries', async () => {
      const liveQuizzes = await getAllQuizzes();
      assert.ok(liveQuizzes.length > 0, 'getAllQuizzes fetches from live table');

      const liveQuiz = await getQuizById(LIVE_QUIZ_ID);
      assert.ok(liveQuiz !== null && liveQuiz.title === 'Live Supabase Test Quiz', 'getQuizById fetches live quiz');

      const liveSlugQuiz = await getQuizBySlug('live-supabase-test-quiz');
      assert.ok(liveSlugQuiz !== null, 'getQuizBySlug fetches live quiz');

      const updatedQuiz = await saveQuiz({
        id: LIVE_QUIZ_ID,
        title: 'Updated Live Quiz',
        slug: 'live-supabase-test-quiz',
        status: 'published',
        sections: [
          { id: LIVE_SEC_ID, quiz_id: LIVE_QUIZ_ID, title: 'Updated Section', section_order: 1 }
        ],
        questions: [
          {
            id: LIVE_Q_ID,
            quiz_id: LIVE_QUIZ_ID,
            section_id: LIVE_SEC_ID,
            question_text: 'What is 3 + 3?',
            question_type: 'single_choice',
            marks: 6,
            negative_marks: 0,
            required: true,
            question_order: 1,
            options: [
              { id: LIVE_OPT_ID, question_id: LIVE_Q_ID, option_text: '6', is_correct: true, option_order: 1 }
            ]
          }
        ]
      });
      assert.ok(updatedQuiz !== null && updatedQuiz.title === 'Updated Live Quiz', 'saveQuiz updates live quiz record');

      const liveThemes = await getAllThemes();
      assert.ok(Array.isArray(liveThemes) && liveThemes.length > 0, 'getAllThemes fetches from live table');

      const liveTheme = await getThemeById('thm-live-1');
      assert.ok(liveTheme !== null && liveTheme.name === 'Live Theme', 'getThemeById fetches live theme');

      const savedTheme = await saveTheme({
        id: 'thm-live-new',
        name: 'New Live Theme',
        primary_color: '#998877'
      });
      assert.ok(savedTheme !== null && savedTheme.name === 'New Live Theme', 'saveTheme persists live theme');

      const livePaginated = await getResponsesPaginated({ quizId: LIVE_QUIZ_ID });
      assert.ok(livePaginated.items.length >= 0, 'getResponsesPaginated runs live query');

      const liveDetail = await getResponseDetail('sub-live-1');
      assert.ok(liveDetail !== null && liveDetail.submission.id === 'sub-live-1', 'getResponseDetail fetches live submission with answers');

      const liveGrade = await updateManualGrade('sub-live-1', LIVE_Q_ID, 4);
      assert.ok(liveGrade.success, 'updateManualGrade updates answer marks in live table');

      const liveCsv = await exportResponsesCsv({ quizId: LIVE_QUIZ_ID });
      assert.ok(typeof liveCsv === 'string' && liveCsv.startsWith('Submission ID'), 'exportResponsesCsv generates CSV from live data');

      const liveAdmin = await getAdminUserRecord('live-admin@quizmania.dev');
      assert.ok(liveAdmin !== null && liveAdmin.role === 'admin', 'getAdminUserRecord finds user in live table');

      const liveSavedAdmin = await saveAdminUserRecord({
        id: 'adm-live-new',
        user_id: 'u-live-new',
        email: 'new-live@quizmania.dev',
        role: 'admin',
        enabled: true
      });
      assert.ok(liveSavedAdmin !== null, 'saveAdminUserRecord persists user to live table');
    });

    await test('4. DAL Public: Live queries', async () => {
      const livePubList = await getPublishedQuizzesList();
      assert.ok(Array.isArray(livePubList), 'getPublishedQuizzesList runs live query');

      // Query published quiz while status is still 'published'
      const livePubQuiz = await getPublishedQuizBySlug('live-supabase-test-quiz');
      assert.ok(livePubQuiz !== null, 'getPublishedQuizBySlug returns published quiz object');
      assert.ok(livePubQuiz?.title === 'Updated Live Quiz', 'getPublishedQuizBySlug has updated quiz title');
      assert.ok(Array.isArray(livePubQuiz?.questions) && livePubQuiz?.questions.length > 0, 'getPublishedQuizBySlug has questions');
      assert.ok(Array.isArray(livePubQuiz?.sections) && livePubQuiz?.sections.length > 0, 'getPublishedQuizBySlug has sections');
      assert.ok(livePubQuiz?.totalMarks > 0, 'getPublishedQuizBySlug calculates totalMarks');
      assert.ok(livePubQuiz?.availability?.isAvailable === true, 'getPublishedQuizBySlug sets availability');

      const liveAtt = await createQuizAttempt({
        id: 'att-live-new',
        quiz_id: LIVE_QUIZ_ID,
        session_token: 'tok_live_new',
        status: 'in_progress',
        created_at: new Date().toISOString()
      });
      assert.ok(liveAtt.session_token === 'tok_live_new', 'createQuizAttempt saves to live table');

      const fetchedLiveAtt = await getQuizAttemptByToken('live_tok_123');
      assert.ok(fetchedLiveAtt !== null, 'getQuizAttemptByToken fetches from live table');

      await updateQuizAttemptStatus('live_tok_123', 'completed');
      assert.ok(true, 'updateQuizAttemptStatus updates live attempt record');

      // Score and record submission against live quiz
      const liveSubmissionResult = await scoreAndRecordQuizSubmission(
        LIVE_QUIZ_ID,
        {
          attemptId: 'att-live-score-unique',
          participant: {
            name: 'Live Participant',
            email: 'live@participant.org',
            club_name: 'Rotaract Club of Mapusa',
            district_number: '3170',
            position: 'President'
          },
          answers: [
            {
              questionId: LIVE_Q_ID,
              selectedOptionId: LIVE_OPT_ID
            }
          ]
        }
      );
      assert.ok(liveSubmissionResult.success, 'scoreAndRecordQuizSubmission records live submission');

      // Now test setQuizStatus transition to draft
      const liveStatusUpdate = await setQuizStatus(LIVE_QUIZ_ID, 'draft');
      assert.ok(liveStatusUpdate?.status === 'draft', 'setQuizStatus updates status on live quiz');
    });

    await test('5. Live Supabase Auth Guard', async () => {
      const liveAuthReq = new Request('http://localhost:3000/api/admin', {
        headers: { cookie: 'sb-access-token=live-valid-token' }
      });
      const liveAuthRes = await requireAuthenticatedAdmin(liveAuthReq);
      assert.ok(liveAuthRes.authorized, 'requireAuthenticatedAdmin authenticates via live Supabase Auth');

      const liveDeleted = await deleteQuiz(LIVE_QUIZ_ID);
      assert.ok(liveDeleted, 'deleteQuiz removes live quiz');
    });
  } finally {
    resetSupabaseClients();
  }

  console.log('All live DAL tests completed successfully.');
}

runLiveDalTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
