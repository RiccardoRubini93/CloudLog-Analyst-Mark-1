import React, { useState, useEffect } from 'react';
import { useSecrets } from '../contexts/SecretsContext';
import { Key, Save, Eye, EyeOff, Server, ShieldCheck, RefreshCw } from 'lucide-react';

interface SecretsInputProps {
  onSaved?: () => void;
}

const SecretsInput: React.FC<SecretsInputProps> = ({ onSaved }) => {
  const { projectId, accessToken, setSecrets, isEnvManaged, loadFromEnv } = useSecrets();
  const [pid, setPid] = useState(projectId);
  const [token, setToken] = useState(accessToken);
  const [showToken, setShowToken] = useState(false);
  const [envStatusMsg, setEnvStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setPid(projectId);
    setToken(accessToken);
  }, [projectId, accessToken]);

  const handleSave = () => {
    if (pid && token) {
      setSecrets(pid, token);
      if (onSaved) onSaved();
    }
  };

  const handleLoadEnv = () => {
    const success = loadFromEnv();
    if (success) {
      setEnvStatusMsg("Successfully loaded credentials from environment.");
      setTimeout(() => setEnvStatusMsg(null), 3000);
    } else {
      setEnvStatusMsg("No environment variables (GCP_PROJECT_ID, GCP_ACCESS_TOKEN) found.");
      setTimeout(() => setEnvStatusMsg(null), 3000);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl max-w-md w-full mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/20 rounded-lg">
          <Key className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Project Credentials</h2>
          <p className="text-slate-400 text-sm">Configure access to Google Cloud.</p>
        </div>
      </div>

      {isEnvManaged && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-200">Environment Managed</p>
              <p className="text-xs text-emerald-200/70 mt-1">
                Credentials are loaded from Cloud Run / Container environment variables.
              </p>
            </div>
        </div>
      )}

      {envStatusMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${envStatusMsg.includes('Success') ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'}`}>
           {envStatusMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Environment Loader Option */}
        <button 
          onClick={handleLoadEnv}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
        >
          <Server className="w-4 h-4" />
          Load from Cloud Run Env
        </button>
        
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OR MANUAL ENTRY</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Google Cloud Project ID</label>
          <input 
            type="text" 
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            placeholder="my-gcp-project-id"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Access Token</label>
          <div className="relative">
            <input 
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ya29.a0..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-10 placeholder:text-slate-600"
            />
            <button 
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Run <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400">gcloud auth print-access-token</code> to generate.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!pid || !token}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isEnvManaged ? 'Override Secrets' : 'Save Secrets'}
        </button>
      </div>
    </div>
  );
};

export default SecretsInput;