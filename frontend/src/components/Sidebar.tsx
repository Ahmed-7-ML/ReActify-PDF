import React, { useRef, useState } from 'react';
import { 
  Server, 
  Upload, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  ShieldAlert, 
  Database,
  User,
  GitBranch
} from 'lucide-react';

interface SidebarProps {
  ngrokUrl: string;
  setNgrokUrl: (url: string) => void;
  isServerOnline: boolean | null;
  isCheckingStatus: boolean;
  checkServerHealth: (url?: string) => Promise<void>;
  isAgentReady: boolean;
  isIngesting: boolean;
  ingestProgress: number;
  ingestedFileName: string | null;
  handleFileUpload: (file: File) => Promise<void>;
  systemInfo: { project: string; engineer: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  ngrokUrl,
  setNgrokUrl,
  isServerOnline,
  isCheckingStatus,
  checkServerHealth,
  isAgentReady,
  isIngesting,
  ingestProgress,
  ingestedFileName,
  handleFileUpload,
  systemInfo
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        await handleFileUpload(file);
      } else {
        alert("Only PDF documents are allowed!");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        await handleFileUpload(file);
      } else {
        alert("Only PDF documents are allowed!");
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="w-full md:w-96 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col h-full text-zinc-100 select-none overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Database className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Agentic RAG Core
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Chat with PDF System</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Connection Setup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Backend Configuration
            </label>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${
                isServerOnline === true 
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' 
                  : isServerOnline === false 
                  ? 'bg-rose-500 shadow-lg shadow-rose-500/50' 
                  : 'bg-zinc-600'
              }`} />
              <span className="text-xs font-semibold text-zinc-400">
                {isServerOnline === true ? 'Online' : isServerOnline === false ? 'Offline' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={ngrokUrl}
              onChange={(e) => setNgrokUrl(e.target.value)}
              placeholder="https://your-ngrok-subdomain.ngrok-free.app"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => checkServerHealth()}
              disabled={isCheckingStatus || !ngrokUrl}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center transition-colors"
              title="Test Connection"
            >
              <RefreshCw className={`h-4.5 w-4.5 text-zinc-300 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Document Ingestion
          </label>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 group ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : ingestedFileName 
                ? 'border-emerald-500/40 bg-emerald-500/2'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {isIngesting ? (
              <div className="space-y-3 py-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-200">Ingesting PDF Document...</p>
                  <p className="text-xs text-zinc-500">Chunking & embedding in progress</p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${ingestProgress}%` }}
                  />
                </div>
              </div>
            ) : ingestedFileName ? (
              <div className="space-y-3 py-1">
                <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400 truncate max-w-full px-2" title={ingestedFileName}>
                    {ingestedFileName}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Successfully Ingested & Indexed</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onButtonClick();
                  }}
                  className="mx-auto text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
                >
                  Replace PDF
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                  <Upload className="h-5 w-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">Drag & drop your PDF</p>
                  <p className="text-xs text-zinc-500 mt-1">or click to browse local files</p>
                </div>
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                  PDF Only
                </span>
              </div>
            )}
          </div>
        </div>

        {/* System Info / Agent Health */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            System Status
          </label>

          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500 font-medium">ReAct Agent Core</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isAgentReady 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
              }`}>
                {isAgentReady ? 'READY' : 'WAITING FOR PDF'}
              </span>
            </div>

            {systemInfo && (
              <div className="space-y-2 text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Project:</span>
                  <span className="font-semibold text-zinc-300">{systemInfo.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Engineer:</span>
                  <span className="font-semibold text-zinc-300">{systemInfo.engineer}</span>
                </div>
              </div>
            )}

            {!isServerOnline && (
              <div className="flex items-start gap-2 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-lg text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Provide a valid backend URL and ensure the FastAPI server is running with ngrok.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 text-center bg-zinc-950">
        <p className="text-[10px] text-zinc-600 font-medium flex items-center justify-center gap-1">
          <User className="h-3 w-3" />
          Engineered by <span className="text-zinc-400 font-semibold">Ahmed Akram Amer</span>
        </p>
      </div>
    </aside>
  );
};
