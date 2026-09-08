#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('QUIZMANIA SECRET SCANNER');
console.log('====================================================\n');

// 1. Get all git-tracked files
let trackedFiles = [];
try {
  const output = execSync('git ls-files', { encoding: 'utf-8' });
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
          .replace(/-/g, '+')
          .replace(/_/g, '/');
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
    const privateKeyRegex = /\b(sk_live_[0-9a-zA-Z]{20,}|ghp_[0-9a-zA-Z]{30,}|sb_secret_[0-9a-zA-Z]{20,})\b/;
    if (privateKeyRegex.test(line)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'Private API Key Pattern',
        description: `Potential private credential pattern detected in tracked file.`
      });
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
