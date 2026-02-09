import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface HealthCheckProps {
  onClose: () => void;
}

interface CheckResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
}

export function HealthCheck({ onClose }: HealthCheckProps) {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const results: CheckResult[] = [];

    // Check 1: Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      results.push({
        name: 'Environment Variables',
        status: 'success',
        message: 'Supabase credentials are configured'
      });
    } else {
      results.push({
        name: 'Environment Variables',
        status: 'error',
        message: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file'
      });
    }
    setChecks([...results]);

    // Check 2: Supabase Connection
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey
        }
      });

      if (response.ok || response.status === 404) {
        results.push({
          name: 'Supabase Connection',
          status: 'success',
          message: 'Successfully connected to Supabase'
        });
      } else {
        results.push({
          name: 'Supabase Connection',
          status: 'error',
          message: `Failed to connect: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    setChecks([...results]);

    // Check 3: Edge Function
    try {
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/generate-mystery`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (testResponse.ok || testResponse.status === 204) {
        results.push({
          name: 'Edge Functions',
          status: 'success',
          message: 'Edge functions are accessible'
        });
      } else {
        results.push({
          name: 'Edge Functions',
          status: 'warning',
          message: 'Edge functions may not be deployed. Deploy using: supabase functions deploy'
        });
      }
    } catch (error) {
      results.push({
        name: 'Edge Functions',
        status: 'warning',
        message: 'Could not verify edge function deployment'
      });
    }
    setChecks([...results]);

    // Check 4: Browser APIs
    if (navigator.clipboard) {
      results.push({
        name: 'Clipboard API',
        status: 'success',
        message: 'Share button will work'
      });
    } else {
      results.push({
        name: 'Clipboard API',
        status: 'warning',
        message: 'Share button may not work (requires HTTPS)'
      });
    }
    setChecks([...results]);

    setIsRunning(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'checking':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const hasErrors = checks.some(c => c.status === 'error');
  const allSuccess = checks.length > 0 && checks.every(c => c.status === 'success');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card-gothic max-w-2xl w-full p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-slate-100">System Health Check</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-slate-400">
          This diagnostic tool checks if your application is configured correctly.
        </p>

        {checks.length === 0 && !isRunning && (
          <button
            onClick={runHealthChecks}
            className="btn-gothic w-full"
          >
            Run Diagnostics
          </button>
        )}

        {isRunning && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-300">
            <Loader className="w-6 h-6 animate-spin" />
            <span>Running checks...</span>
          </div>
        )}

        {checks.length > 0 && (
          <div className="space-y-3">
            {checks.map((check, index) => (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(check.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-200 font-medium">{check.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRunning && checks.length > 0 && (
          <div className="pt-4 space-y-3">
            {hasErrors && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  <strong>⚠️ Critical issues detected.</strong> Please check the SETUP_GUIDE.md
                  file for instructions on how to resolve these issues.
                </p>
              </div>
            )}

            {allSuccess && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                  <strong>✓ All checks passed!</strong> Your application is configured correctly.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runHealthChecks}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
              >
                Run Again
              </button>
              <button
                onClick={onClose}
                className="btn-gothic flex-1"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="text-slate-500 text-xs space-y-1 pt-4 border-t border-slate-700">
          <p><strong>Note:</strong> This tool cannot check if MISTRAL_API_KEY is configured in Supabase secrets.</p>
          <p>If you encounter 500 errors, verify: <code className="bg-slate-800 px-1">supabase secrets list</code></p>
        </div>
      </div>
    </div>
  );
}
