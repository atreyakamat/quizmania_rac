#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('QUIZMANIA SECRET SCANNER');
console.log('====================================================\n');

// Classification: SECURITY-SENSITIVE (Process Execution Environment)
// Remediation for CWE-426 / CWE-427 (Untrusted Search Path):
// Avoid executing git from an unvalidated caller PATH. Locate git strictly in trusted,
// unwriteable system directories and provide a fixed, sanitized PATH environment.
const TRUSTED_SYSTEM_DIRS = ['/usr/bin', '/bin', '/usr/local/bin'];

function getTrustedGitPath() {
  for (const dir of TRUSTED_SYSTEM_DIRS) {
    const candidate = path.join(dir, 'git');
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {}
  }
  return 'git';
}

const trustedGit = getTrustedGitPath();
const sanitizedEnv = {
  ...process.env,
  PATH: TRUSTED_SYSTEM_DIRS.join(path.delimiter)
};

// 1. Get all git-tracked files
let trackedFiles = [];
try {
  const output = execSync(`"${trustedGit}" ls-files`, { 
    encoding: 'utf-8',
    env: sanitizedEnv
  });
  trackedFiles = output.split('\n').map(f => f.trim()).filter(Boolean);
} catch (err) {
  console.error('Error running git ls-files:', err.message);
  process.exit(1);
}

const violations = [];

// Binary extensions to skip
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg', '.gif',
  '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip'
]);

for (const filePath of trackedFiles) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // Check 1: Tracked .env files (only .env.example allowed)
  if (basename.startsWith('.env') && !basename.includes('.example')) {
    violations.push({
      file: filePath,
      line: 1,
      rule: 'Tracked .env file',
      description: `Disallowed .env file tracked in git: ${filePath}`
    });
    continue;
  }

  if (BINARY_EXTENSIONS.has(ext)) {
    continue;
  }

  if (!fs.existsSync(filePath)) {
    continue;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check 2: Hardcoded SUPABASE_SERVICE_ROLE_KEY assignments in config or code
    const serviceRoleVarMatch = line.match(/(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*["']([^"']+)["']/i);
    if (serviceRoleVarMatch) {
      const val = serviceRoleVarMatch[1].trim();
      const isPlaceholder = val.includes('your_') ||
                            val.includes('your-') ||
                            val.includes('placeholder') ||
                            val.includes('dummy') ||
                            val.length < 10;
      if (!isPlaceholder) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'Hardcoded SUPABASE_SERVICE_ROLE_KEY',
          description: `Direct assignment of SUPABASE_SERVICE_ROLE_KEY in tracked file.`
        });
      }
    }

    // Check 3: Check for JWTs that decode to service_role
    const jwtRegex = /eyJ[a-zA-Z0-9_-]{10,}\.(eyJ[a-zA-Z0-9_-]{10,})\.[a-zA-Z0-9_-]{10,}/g;
    let jwtMatch;
    while ((jwtMatch = jwtRegex.exec(line)) !== null) {
      try {
        const payloadBase64 = jwtMatch[1]
          .replaceAll('-', '+')
          .replaceAll('_', '/');
        const padded = payloadBase64.padEnd(
          payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
          '='
        );
        const decoded = Buffer.from(padded, 'base64').toString('utf-8');

        if (decoded.includes('"role":"service_role"') || decoded.includes('"role": "service_role"')) {
          violations.push({
            file: filePath,
            line: lineNum,
            rule: 'Exposed Supabase Service Role JWT',
            description: `A JWT with "role": "service_role" was detected in tracked file.`
          });
        }
      } catch {
        // Not a standard base64 JSON payload
      }
    }

    // Check 4: Private API key patterns (e.g. sk_live_, ghp_, sb_secret_)
    const isScannerFile = filePath.includes('scan-secrets.mjs');
    if (!isScannerFile) {
      const privateKeyRegex = /\b(sk_live_[0-9a-zA-Z]{20,}|ghp_[0-9a-zA-Z]{30,}|sb_secret_[0-9a-zA-Z_-]{15,})\b/;
      if (privateKeyRegex.test(line)) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'Private API Key Pattern',
          description: `Potential private credential pattern detected in tracked file.`
        });
      }
    }

    // Check 5: Deprecated / forbidden ADMIN_API_SECRET or x-admin-key
    const isSecurityOrScanner = filePath.includes('scan-secrets.mjs') || filePath.includes('security.test.ts');
    if (!isSecurityOrScanner) {
      if (line.includes('ADMIN_API_SECRET') || line.includes('x-admin-key')) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'Deprecated Static Admin Secret',
          description: `Usage of deprecated ADMIN_API_SECRET or x-admin-key header detected. All admin access must use authenticated sessions.`
        });
      }
    }
  }
}

// Check 6: Client bundles (.next/static) must never contain service_role, sb_secret_, or secret keys
const clientBundleDirs = [
  'apps/admin/.next/static',
  'apps/public/.next/static'
];

for (const bundleDir of clientBundleDirs) {
  if (fs.existsSync(bundleDir)) {
    const bundleFiles = fs.readdirSync(bundleDir, { recursive: true });
    for (const f of bundleFiles) {
      const fullPath = path.join(bundleDir, f);
      if (!fs.statSync(fullPath).isFile()) continue;
      if (!fullPath.endsWith('.js') && !fullPath.endsWith('.html')) continue;
      const bContent = fs.readFileSync(fullPath, 'utf-8');
      if (bContent.includes('service_role') || bContent.includes('sb_secret_') || bContent.includes('SUPABASE_SERVICE_ROLE_KEY') || bContent.includes('SUPABASE_SECRET_KEY')) {
        violations.push({
          file: fullPath,
          line: 1,
          rule: 'Secret Credential in Client Bundle',
          description: `Client bundle in ${fullPath} contains service_role / secret references!`
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`[PASS] Secret Scan Succeeded! Checked ${trackedFiles.length} tracked files.`);
  console.log('No exposed service-role keys, private credentials, or tracked .env files detected.\n');
  process.exit(0);
} else {
  console.error(`[FAIL] Secret Scan FAILED with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    Details: ${v.description}`);
  }
  console.error('\nPlease remediate all violations before committing.\n');
  process.exit(1);
}
