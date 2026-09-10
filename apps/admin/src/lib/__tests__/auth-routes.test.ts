process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_STORE = 'true';

import { test } from 'node:test';
import { POST as loginPost } from '../../app/api/auth/login/route';
import { POST as refreshPost } from '../../app/api/auth/refresh/route';

async function runAuthRouteTests() {
  console.log('\n========================================');
  console.log('Running Admin Auth Route Tests');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${msg}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${msg}`);
    }
  }

  // --- 1. Login Route Tests ---
  await test('1. Login: CSRF Protection', async () => {
    const reqCsrf = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'https://evil-site.com',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'password123' })
    });
    const res = await loginPost(reqCsrf);
    assert(res.status === 403, 'Login rejects cross-origin CSRF request');
  });

  await test('2. Login: Bad JSON and Validation', async () => {
    const reqBadJson = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: 'invalid-json{'
    });
    const resBadJson = await loginPost(reqBadJson);
    assert(resBadJson.status === 400, 'Login rejects malformed JSON payload');

    const reqMissingFields = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: '', password: '' })
    });
    const resMissing = await loginPost(reqMissingFields);
    assert(resMissing.status === 400, 'Login rejects missing email and password');
  });

  await test('3. Login: Credentials & Account Status', async () => {
    const reqUnknown = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'unknown-user@domain.com', password: 'password123' })
    });
    const resUnknown = await loginPost(reqUnknown);
    assert(resUnknown.status === 401, 'Login rejects unknown account');

    const reqDisabled = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'disabled-admin@quizmania.dev', password: 'password123' })
    });
    const resDisabled = await loginPost(reqDisabled);
    assert(resDisabled.status === 403, 'Login rejects disabled administrator account');

    const reqValid = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@quizmania.dev', password: 'password123' })
    });
    const resValid = await loginPost(reqValid);
    assert(resValid.status === 200, 'Login succeeds for valid admin in test mode');
    const setCookie = resValid.headers.get('set-cookie') || '';
    assert(setCookie.includes('sb-access-token'), 'Login sets admin authentication cookie');
  });

  // --- 2. Refresh Route Tests ---
  await test('4. Refresh: CSRF Protection', async () => {
    const reqCsrf = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'https://evil-site.com',
        host: 'localhost:3000'
      }
    });
    const res = await refreshPost(reqCsrf);
    assert(res.status === 403, 'Refresh rejects cross-origin CSRF request');
  });

  await test('5. Refresh: Token Validation', async () => {
    const reqMissing = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000'
      }
    });
    const resMissing = await refreshPost(reqMissing);
    assert(resMissing.status === 401, 'Refresh returns 401 when no refresh token provided');

    const reqInvalid = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        cookie: 'sb-refresh-token=invalid-token'
      }
    });
    const resInvalid = await refreshPost(reqInvalid);
    assert(resInvalid.status === 401, 'Refresh rejects invalid refresh token');

    const reqValidCookie = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        cookie: 'sb-refresh-token=valid-refresh-token'
      }
    });
    const resValidCookie = await refreshPost(reqValidCookie);
    assert(resValidCookie.status === 200, 'Refresh succeeds with valid test refresh cookie');

    const reqValidBody = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: 'valid-refresh-token' })
    });
    const resValidBody = await refreshPost(reqValidBody);
    assert(resValidBody.status === 200, 'Refresh succeeds with valid test refresh in body');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthRouteTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
