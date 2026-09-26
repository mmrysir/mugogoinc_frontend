'use client';

import Link from 'next/link';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center">
          <img
            src="/mugologo_t.png"
            alt="Mugogo Inc."
            className="w-24 h-auto rounded-2xl object-contain shadow-2xl shadow-amber-500/20"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          System Initialization
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Mugogo Inc. Engine First-Run Setup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-700">
          <div className="bg-amber-900/30 border border-amber-500/30 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-500">CLI-only bootstrap</h3>
                <div className="mt-2 text-sm text-amber-200/70">
                  <p>
                    For security, the initial <strong>SUPER_ADMIN</strong> account is no
                    longer created through the web interface. Run the command below
                    from the backend directory instead.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-xs font-mono text-slate-400 mb-2">
              From <code className="text-amber-400">mugogoinc_api</code>:
            </p>
            <pre className="text-sm font-mono text-emerald-400 overflow-auto">
              {"venv/bin/python scripts/create_superuser.py"}
            </pre>
          </div>

          <p className="text-sm text-slate-400 mb-6">
            The script prompts for email, name, and password and safely stores a
            hashed credential with the SUPER_ADMIN role. Once created, use the
            credentials to sign in.
          </p>

          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 transition-all uppercase tracking-wider"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}