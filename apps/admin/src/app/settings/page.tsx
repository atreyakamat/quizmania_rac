import React from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { isSupabaseConfigured, isSupabaseAdminConfigured } from '@quizmania/shared';
import { ShieldCheck, Database, HardDrive, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

export const revalidate = 0;

export default function SettingsPage() {
  const publicConfigured = isSupabaseConfigured();
  const adminConfigured = isSupabaseAdminConfigured();

  return (
    <div>
      <AdminHeader
        title="Settings & System Status"
        subtitle="Review environment architecture, database connectivity, and security configuration"
      />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* Architecture Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Security & Separation Model
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The platform enforces a strict separation between the Private Admin Application and the Public Quiz Application.
            Public clients interact solely via sanitized endpoints and the public Data Access Layer.
            Option correct answer flags (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">is_correct</code>)
            are protected inside PostgreSQL Row Level Security (RLS) and server-side calculation routes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1">Private Admin App</span>
              <p className="text-xs text-slate-500">
                Runs locally on <span className="font-mono text-blue-600">http://localhost:3011</span>.
                Accesses admin DAL with full CRUD, previewing, and publishing capabilities.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1">Public Quiz App</span>
              <p className="text-xs text-slate-500">
                Runs on <span className="font-mono text-emerald-600">http://localhost:3010</span>.
                Participants access published quizzes at <span className="font-mono text-emerald-600">/q/[slug]</span>.
                Never receives correct answers.
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Supabase Connection Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                {publicConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Public Supabase Client (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Used by Public app for published quiz retrieval subject to RLS
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                publicConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {publicConfigured ? 'Configured' : 'Mock Fallback Active'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                {adminConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Admin / Scoring Supabase Client (SUPABASE_SERVICE_ROLE_KEY)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Used by secure submission scoring and local private admin
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                adminConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {adminConfigured ? 'Configured' : 'Mock Fallback Active'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-1">
            <div className="text-slate-400 text-[11px] mb-1"># Migration command for Supabase CLI:</div>
            <div className="text-emerald-400">supabase db push</div>
            <div className="text-slate-400 text-[11px] mt-2"># Or execute migration file in Supabase SQL editor:</div>
            <div className="text-blue-300">supabase/migrations/20260904000001_initial_quiz_schema.sql</div>
          </div>
        </div>
      </div>
    </div>
  );
}
