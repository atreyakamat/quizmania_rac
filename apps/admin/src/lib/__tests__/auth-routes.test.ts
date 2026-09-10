process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_STORE = 'true';

import { test } from 'node:test';
import assert from 'node:assert';
import { POST as loginPost } from '../../app/api/auth/login/route';
import { POST as refreshPost } from '../../app/api/auth/refresh/route';
import { setMockSupabaseClients, resetSupabaseClients, mockStore } from '@quizmania/shared';

async function runAuthRouteTests() {
  console.log('\n========================================');
  console.log('Running Admin Auth Route Tests');
  console.log('========================================\n');

  // --- 1. Login Route Tests ---
  await test('1. Login: CSRF Protection', async () => {
    const reqCsrf = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'https://evil-site.com',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.1',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'password123' })
    });
    const res = await loginPost(reqCsrf);
    assert.ok(res.status === 403, 'Login rejects cross-origin CSRF request');
  });

  await test('2. Login: Bad JSON and Validation', async () => {
    const reqBadJson = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.2'
      },
      body: 'invalid-json-body'
    });
    const resBadJson = await loginPost(reqBadJson);
    assert.ok(resBadJson.status === 400, 'Login rejects malformed JSON payload');

    const reqMissingFields = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.3',
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const resMissingFields = await loginPost(reqMissingFields);
    assert.ok(resMissingFields.status === 400, 'Login rejects missing email and password');

    const reqInvalidType = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.4',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 12345, password: 'password123' })
    });
    const resInvalidType = await loginPost(reqInvalidType);
    assert.ok(resInvalidType.status === 400, 'Login rejects non-string email format');
  });

  await test('3. Login: Credentials & Account Status (Mock Mode)', async () => {
    const reqUnknown = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.5',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'unknown@quizmania.dev', password: 'wrong' })
    });
    const resUnknown = await loginPost(reqUnknown);
    assert.ok(resUnknown.status === 401, 'Login rejects unknown account');

    const reqDisabled = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.6',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'disabled-admin@quizmania.dev', password: 'password123' })
    });
    const resDisabled = await loginPost(reqDisabled);
    assert.ok(resDisabled.status === 403, 'Login rejects disabled administrator account');

    // Save a viewer role account to disk-synced mock store
    mockStore.saveAdminUser({
      id: 'adm-viewer-test',
      user_id: 'u-viewer-test',
      email: 'viewer@quizmania.dev',
      role: 'viewer' as any,
      enabled: true,
      created_at: new Date().toISOString()
    });
    const reqViewer = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.7',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'viewer@quizmania.dev', password: 'password123' })
    });
    const resViewer = await loginPost(reqViewer);
    assert.ok(resViewer.status === 403, 'Login rejects viewer account without admin privileges');

    const reqSuccess = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.1.0.8',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'password123' })
    });
    const resSuccess = await loginPost(reqSuccess);
    assert.ok(resSuccess.status === 200, 'Login succeeds for valid admin in test mode');
    const setCookie = resSuccess.headers.get('set-cookie');
    assert.ok(Boolean(setCookie && setCookie.includes('sb-access-token')), 'Login sets admin authentication cookie');
  });

  await test('4. Login: Supabase Live Client Flow', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FORCE_MOCK_STORE = 'false';

    const mockAuthClient = {
      from: () => ({
        select: () => ({
          or: (conditionStr: string) => ({
            limit: () => ({
              maybeSingle: async () => {
                if (conditionStr.includes('forbidden')) {
                  return { data: { id: 'adm-1', user_id: 'u-forbidden', email: 'forbidden@quizmania.dev', role: 'viewer', enabled: false }, error: null };
                }
                return { data: { id: 'adm-0', user_id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev', role: 'admin', enabled: true }, error: null };
              }
            })
          }),
          eq: (col: string, val: any) => ({
            single: async () => {
              if (val === 'u-forbidden' || val === 'forbidden@quizmania.dev') {
                return { data: { id: 'adm-1', user_id: 'u-forbidden', email: val, role: 'viewer', enabled: false }, error: null };
              }
              return { data: { id: 'adm-0', user_id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev', role: 'admin', enabled: true }, error: null };
            },
            maybeSingle: async () => ({ data: null, error: null })
          })
        })
      }),
      auth: {
        signInWithPassword: async ({ email, password }: any) => {
          if (password === 'wrong-password') {
            return { data: { user: null, session: null }, error: new Error('Invalid login credentials') };
          }
          if (email === 'forbidden@quizmania.dev') {
            return {
              data: {
                user: { id: 'u-forbidden', email },
                session: { access_token: 'live-tok', refresh_token: 'live-ref', expires_in: 3600 }
              },
              error: null
            };
          }
          return {
            data: {
              user: { id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev' },
              session: { access_token: 'live-valid-tok', refresh_token: 'live-valid-ref', expires_in: 3600 }
            },
            error: null
          };
        },
        signOut: async () => {}
      }
    };

    setMockSupabaseClients({ publicClient: mockAuthClient, adminClient: mockAuthClient, ready: true });

    try {
      // 4a. Live: Invalid password
      const reqBadPass = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'x-forwarded-for': '10.2.0.1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'wrong-password' })
      });
      const resBadPass = await loginPost(reqBadPass);
      assert.ok(resBadPass.status === 401, 'Live login returns 401 on bad credentials');

      // 4b. Live: Forbidden non-admin account
      const reqForbidden = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'x-forwarded-for': '10.2.0.2',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email: 'forbidden@quizmania.dev', password: 'password123' })
      });
      const resForbidden = await loginPost(reqForbidden);
      assert.ok(resForbidden.status === 403, 'Live login returns 403 on non-admin user');

      // 4c. Live: Successful authentication
      const reqLiveOk = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'x-forwarded-for': '10.2.0.3',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'password123' })
      });
      const resLiveOk = await loginPost(reqLiveOk);
      assert.ok(resLiveOk.status === 200, 'Live login returns 200 for valid admin');
      const liveCookie = resLiveOk.headers.get('set-cookie');
      assert.ok(Boolean(liveCookie && liveCookie.includes('live-valid-tok')), 'Live login sets session tokens');
    } finally {
      process.env.NODE_ENV = 'test';
      process.env.FORCE_MOCK_STORE = 'true';
      resetSupabaseClients();
    }
  });

  // --- 5. Refresh Route Tests ---
  await test('5. Refresh: CSRF & Mock Mode', async () => {
    const reqCsrf = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.org',
        host: 'localhost:3000',
        'x-forwarded-for': '10.3.0.1'
      }
    });
    const resCsrf = await refreshPost(reqCsrf);
    assert.ok(resCsrf.status === 403, 'Refresh rejects cross-origin CSRF request');

    const reqMissing = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.3.0.2'
      }
    });
    const resMissing = await refreshPost(reqMissing);
    assert.ok(resMissing.status === 401, 'Refresh returns 401 when no refresh token provided');

    const reqInvalid = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.3.0.3',
        cookie: 'sb-refresh-token=invalid-token'
      }
    });
    const resInvalid = await refreshPost(reqInvalid);
    assert.ok(resInvalid.status === 401, 'Refresh rejects invalid refresh token');

    const reqValidCookie = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.3.0.4',
        cookie: 'sb-refresh-token=valid-refresh-token'
      }
    });
    const resValidCookie = await refreshPost(reqValidCookie);
    assert.ok(resValidCookie.status === 200, 'Refresh succeeds with valid test refresh cookie');

    const reqValidBody = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'x-forwarded-for': '10.3.0.5',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: 'valid-refresh-token' })
    });
    const resValidBody = await refreshPost(reqValidBody);
    assert.ok(resValidBody.status === 200, 'Refresh succeeds with valid test refresh in body');
  });

  await test('6. Refresh: Supabase Live Client Flow', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FORCE_MOCK_STORE = 'false';

    const mockRefreshClient = {
      from: () => ({
        select: () => ({
          or: (conditionStr: string) => ({
            limit: () => ({
              maybeSingle: async () => {
                if (conditionStr.includes('forbidden')) {
                  return { data: { id: 'adm-1', user_id: 'u-forbidden', email: 'forbidden@quizmania.dev', role: 'viewer', enabled: false }, error: null };
                }
                return { data: { id: 'adm-0', user_id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev', role: 'admin', enabled: true }, error: null };
              }
            })
          }),
          eq: (col: string, val: any) => ({
            single: async () => {
              if (val === 'u-forbidden' || val === 'forbidden@quizmania.dev') {
                return { data: { id: 'adm-1', user_id: 'u-forbidden', email: val, role: 'viewer', enabled: false }, error: null };
              }
              return { data: { id: 'adm-0', user_id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev', role: 'admin', enabled: true }, error: null };
            },
            maybeSingle: async () => ({ data: null, error: null })
          })
        })
      }),
      auth: {
        refreshSession: async ({ refresh_token }: any) => {
          if (refresh_token === 'bad-refresh') {
            return { data: { session: null, user: null }, error: new Error('Invalid refresh token') };
          }
          if (refresh_token === 'forbidden-refresh') {
            return {
              data: {
                user: { id: 'u-forbidden', email: 'forbidden@quizmania.dev' },
                session: { access_token: 'new-tok', refresh_token: 'new-ref', expires_in: 3600 }
              },
              error: null
            };
          }
          return {
            data: {
              user: { id: '00000000-0000-4000-a000-000000000001', email: 'admin@quizmania.dev' },
              session: { access_token: 'refreshed-tok', refresh_token: 'refreshed-ref', expires_in: 3600 }
            },
            error: null
          };
        }
      }
    };

    setMockSupabaseClients({ publicClient: mockRefreshClient, adminClient: mockRefreshClient, ready: true });

    try {
      const reqBadRefresh = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000', 'x-forwarded-for': '10.4.0.1', cookie: 'sb-refresh-token=bad-refresh' }
      });
      const resBadRefresh = await refreshPost(reqBadRefresh);
      assert.ok(resBadRefresh.status === 401, 'Live refresh returns 401 on bad refresh token');

      const reqForbiddenRefresh = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000', 'x-forwarded-for': '10.4.0.2', cookie: 'sb-refresh-token=forbidden-refresh' }
      });
      const resForbiddenRefresh = await refreshPost(reqForbiddenRefresh);
      assert.ok(resForbiddenRefresh.status === 403, 'Live refresh returns 403 on disabled admin account');

      const reqGoodRefresh = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000', 'x-forwarded-for': '10.4.0.3', cookie: 'sb-refresh-token=good-refresh' }
      });
      const resGoodRefresh = await refreshPost(reqGoodRefresh);
      assert.ok(resGoodRefresh.status === 200, 'Live refresh returns 200 on valid session refresh');
      const refreshedCookie = resGoodRefresh.headers.get('set-cookie');
      assert.ok(Boolean(refreshedCookie && refreshedCookie.includes('refreshed-tok')), 'Live refresh sets updated session cookies');
    } finally {
      process.env.NODE_ENV = 'test';
      process.env.FORCE_MOCK_STORE = 'true';
      resetSupabaseClients();
    }
  });

  console.log('All admin auth route tests completed successfully.');
}

runAuthRouteTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
