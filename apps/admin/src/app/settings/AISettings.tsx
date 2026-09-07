'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function AISettings() {
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [status, setStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem('quizmania_ai_enabled') === 'true');
    // Fetch initial config from test endpoint
    testConnection();
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('quizmania_ai_enabled', newValue ? 'true' : 'false');
    if (newValue) {
      testConnection();
    } else {
      setStatus('disabled');
      setStatusMessage('AI generation is disabled.');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setStatus('checking');
    try {
      const res = await fetch('/api/ai/test');
      const data = await res.json();
      setStatus(data.status);
      setStatusMessage(data.message);
      if (data.config) {
        setModel(data.config.model);
        setBaseUrl(data.config.baseUrl);
      }
    } catch (err) {
      setStatus('unavailable');
      setStatusMessage('Failed to connect to AI API route');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Ollama AI Integration (Local)
        </h3>
        <Link href="/ai" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Go to AI Generator
        </Link>
      </div>
      
      <p className="text-xs text-slate-600 leading-relaxed">
        Generate quizzes automatically from text content using a locally running Ollama model.
        This feature requires Ollama to be installed and running on your machine.
      </p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <span className="text-sm font-bold text-slate-800 block">Enable AI Generator</span>
            <span className="text-xs text-slate-500">Allow admin to generate quizzes using Ollama</span>
          </div>
          <button 
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">Model Name (Server Env)</span>
            <code className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{model || 'Loading...'}</code>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">Endpoint (Server Env)</span>
            <code className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{baseUrl || 'Loading...'}</code>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={testConnection}
            disabled={!enabled || testing}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            Test Connection
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            {status === 'connected' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {status !== 'connected' && status !== 'checking' && status !== 'disabled' && status !== '' && <AlertCircle className="w-5 h-5 text-amber-500" />}
            <span className={`text-sm font-medium ${status === 'connected' ? 'text-emerald-700' : 'text-slate-600'}`}>
              {statusMessage}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[11px] mb-1"># Required terminal commands:</div>
          <div className="text-emerald-400">ollama serve</div>
          <div className="text-blue-300">ollama pull {model || 'llama3.2:3b'}</div>
        </div>
      </div>
    </div>
  );
}
