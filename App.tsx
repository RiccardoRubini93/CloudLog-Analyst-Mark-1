import React, { useState } from 'react';
import LogUploader from './components/LogUploader';
import Dashboard from './components/Dashboard';
import CostDashboard from './components/CostDashboard';
import SecretsInput from './components/SecretsInput';
import { SecretsProvider, useSecrets } from './contexts/SecretsContext';
import { parseLogs, generateReport } from './services/geminiService';
import { LogEntry, AnalysisSummary } from './types';
import { Cloud, ShieldCheck, Activity, DollarSign, List, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { hasSecrets } = useSecrets();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [report, setReport] = useState<AnalysisSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState<'upload' | 'dashboard' | 'costs'>('upload');
  const [showSecrets, setShowSecrets] = useState(false);

  // Handle Raw Text (Paste)
  const processTextLogs = async (rawText: string) => {
    setIsProcessing(true);
    try {
      const parsedLogs = await parseLogs(rawText);
      setLogs(parsedLogs);
      const analysis = await generateReport(parsedLogs);
      setReport(analysis);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Processing failed", error);
      alert("An error occurred while processing logs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle GCP API Logs
  const processGCPLogs = async (fetchedLogs: LogEntry[]) => {
    setIsProcessing(true);
    try {
      setLogs(fetchedLogs);
      const analysis = await generateReport(fetchedLogs);
      setReport(analysis);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Processing failed", error);
      alert("An error occurred while analyzing GCP logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setLogs([]);
    setReport(null);
    setCurrentPage('upload');
  };

  if (!hasSecrets && !showSecrets && currentPage !== 'upload') {
     // Force secrets entry if trying to access features without them (simplified logic, mostly rely on modal)
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('upload')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cloud className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CloudLog AI</h1>
              <p className="text-xs text-slate-400">Analyst & Cost Monitor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg mr-4 border border-slate-700">
              <button
                 onClick={() => setCurrentPage('upload')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentPage === 'upload' || currentPage === 'dashboard' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
                Logs
              </button>
              <button
                 onClick={() => setCurrentPage('costs')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentPage === 'costs' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <DollarSign className="w-4 h-4" />
                Costs
              </button>
            </nav>

            <button 
              onClick={() => setShowSecrets(!showSecrets)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Manage Credentials"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Secrets Modal/Overlay */}
        {showSecrets && (
          <div className="absolute inset-0 z-40 flex items-start justify-center pt-10 bg-slate-900/90 backdrop-blur-sm min-h-screen">
             <div className="w-full max-w-md">
                <SecretsInput onSaved={() => setShowSecrets(false)} />
                <button onClick={() => setShowSecrets(false)} className="mt-4 w-full text-slate-400 hover:text-white text-sm">Cancel</button>
             </div>
          </div>
        )}

        {currentPage === 'costs' ? (
          <>
            {!hasSecrets ? (
               <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                 <div className="p-4 bg-slate-800 rounded-full">
                    <Lock className="w-8 h-8 text-indigo-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Credentials Required</h2>
                 <p className="text-slate-400 max-w-md">To monitor costs, please provide your Google Cloud Project ID and Access Token to simulate the billing analysis.</p>
                 <button onClick={() => setShowSecrets(true)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Configure Secrets</button>
               </div>
            ) : (
              <CostDashboard />
            )}
          </>
        ) : currentPage === 'dashboard' ? (
           <Dashboard logs={logs} report={report} onReset={reset} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4 mb-10">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Visualize your infrastructure health.
              </h2>
              <p className="text-slate-400 text-lg">
                Connect your Google Cloud project to analyze logs and monitor costs using advanced AI.
              </p>
            </div>
            
            <LogUploader 
              onProcessText={processTextLogs} 
              onProcessGCP={processGCPLogs}
              isProcessing={isProcessing} 
            />

            {/* Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
               <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-200">Secure</h3>
                  <p className="text-xs text-slate-500">Tokens stored locally in session.</p>
               </div>
               <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
                  <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-200">Real-time</h3>
                  <p className="text-xs text-slate-500">Live log stream analysis.</p>
               </div>
               <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
                  <DollarSign className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-200">Cost AI</h3>
                  <p className="text-xs text-slate-500">Smart billing forecasting.</p>
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SecretsProvider>
      <AppContent />
    </SecretsProvider>
  );
};

export default App;