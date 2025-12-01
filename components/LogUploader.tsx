import React, { useState } from 'react';
import { generateDemoLogs, fetchGCPLogs } from '../services/geminiService';
import { useSecrets } from '../contexts/SecretsContext';
import { Upload, Play, Terminal, Loader2, CloudLightning, FileText } from 'lucide-react';
import { LogEntry } from '../types';

interface LogUploaderProps {
  onProcessText: (rawLogs: string) => void;
  onProcessGCP: (logs: LogEntry[]) => void;
  isProcessing: boolean;
}

const LogUploader: React.FC<LogUploaderProps> = ({ onProcessText, onProcessGCP, isProcessing }) => {
  const { projectId, accessToken, hasSecrets } = useSecrets();
  const [mode, setMode] = useState<'paste' | 'gcp'>('paste');
  
  // Paste Mode State
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // GCP Mode State
  const [isFetchingGCP, setIsFetchingGCP] = useState(false);
  const [gcpError, setGcpError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const demoLogs = await generateDemoLogs();
      setText(demoLogs);
    } catch (error) {
      console.error(error);
      alert("Failed to generate demo logs. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGCPConnect = async () => {
    if (!hasSecrets) return;
    setIsFetchingGCP(true);
    setGcpError(null);
    try {
      const logs = await fetchGCPLogs(projectId, accessToken);
      if (logs.length === 0) {
        setGcpError("Connection successful, but no logs found for the last hour.");
      } else {
        onProcessGCP(logs);
      }
    } catch (err: any) {
      setGcpError(err.message || "Failed to connect to GCP. Check your token and permissions.");
    } finally {
      setIsFetchingGCP(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setMode('paste')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'paste' 
              ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' 
              : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Raw Text / Paste
        </button>
        <button
          onClick={() => setMode('gcp')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'gcp' 
              ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' 
              : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CloudLightning className="w-4 h-4" />
          Fetch from GCP
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {mode === 'paste' ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Terminal className="text-blue-400" />
                  Paste Logs
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Paste raw text logs or generate synthetic data.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
                Generate Demo
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="[2023-10-27 10:00:01] INFO [compute-engine] Instance started successfully..."
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onProcessText(text)}
                disabled={!text.trim() || isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Analyze Logs
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CloudLightning className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Fetch Project Logs</h2>
                <p className="text-slate-400 text-sm">
                  Using configured project: <span className="text-white font-mono">{projectId || 'None'}</span>
                </p>
              </div>
            </div>

            {!hasSecrets && (
               <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
                 You have not configured your GCP Project Credentials yet. Please update them in the top right settings menu.
               </div>
            )}

            {gcpError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <strong>Error:</strong> {gcpError}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGCPConnect}
                disabled={!hasSecrets || isFetchingGCP}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingGCP ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Fetching from API...
                  </>
                ) : (
                  <>
                    <CloudLightning className="w-5 h-5" />
                    Fetch & Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogUploader;