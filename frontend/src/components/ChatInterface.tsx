import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles, FileText } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import type { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isWaitingForAgent: boolean;
  isAgentReady: boolean;
  isServerOnline: boolean | null;
  ingestedFileName: string | null;
}

// Custom Markdown renderer components to fit our gorgeous dark theme
const MarkdownOptions = {
  overrides: {
    h1: {
      component: ({ children, ...props }: any) => (
        <h1 {...props} className="text-base font-bold text-zinc-100 mt-4 mb-2 first:mt-0">{children}</h1>
      )
    },
    h2: {
      component: ({ children, ...props }: any) => (
        <h2 {...props} className="text-sm font-bold text-zinc-200 mt-3 mb-1.5 first:mt-0">{children}</h2>
      )
    },
    p: {
      component: ({ children, ...props }: any) => (
        <p {...props} className="text-sm leading-relaxed text-zinc-300 mb-2 last:mb-0">{children}</p>
      )
    },
    ul: {
      component: ({ children, ...props }: any) => (
        <ul {...props} className="list-disc pl-5 mb-2.5 text-zinc-300 space-y-1">{children}</ul>
      )
    },
    ol: {
      component: ({ children, ...props }: any) => (
        <ol {...props} className="list-decimal pl-5 mb-2.5 text-zinc-300 space-y-1">{children}</ol>
      )
    },
    li: {
      component: ({ children, ...props }: any) => (
        <li {...props} className="text-sm">{children}</li>
      )
    },
    code: {
      component: ({ children, className, ...props }: any) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code {...props} className="px-1.5 py-0.5 rounded bg-zinc-950 font-mono text-xs text-indigo-400 border border-zinc-900">
              {children}
            </code>
          );
        }
        return (
          <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 overflow-x-auto my-3 font-mono text-xs text-zinc-300 leading-normal">
            <code className={className} {...props}>{children}</code>
          </pre>
        );
      }
    },
    a: {
      component: ({ children, href, ...props }: any) => (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium">
          {children}
        </a>
      )
    }
  }
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  sendMessage,
  isWaitingForAgent,
  isAgentReady,
  isServerOnline,
  ingestedFileName
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWaitingForAgent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isWaitingForAgent || !isAgentReady) return;
    
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md sticky top-0 z-10 select-none">
        <div className="flex items-center gap-2.5">
          <Bot className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              AI Reasoning Assistant
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isServerOnline ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isServerOnline ? 'bg-indigo-500' : 'bg-zinc-650'}`} />
              </span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-medium">Equipped with ReAct framework & Qdrant database</p>
          </div>
        </div>
        {ingestedFileName && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400 font-medium truncate max-w-[150px] md:max-w-[240px]">
              {ingestedFileName}
            </span>
          </div>
        )}
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isAgentReady ? (
          /* Empty / Locked State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto select-none space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-inner relative group">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl filter blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Bot className="h-8 w-8 text-zinc-500 group-hover:text-indigo-400 transition-colors duration-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-zinc-200">System Awaiting Document Ingestion</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Before chatting, configure your ngrok Backend URL and upload a PDF file in the left sidebar. The RAG pipeline will parse, chunk, embed, and index your document.
              </p>
            </div>
            
            <div className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 text-left space-y-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Quick Steps</span>
              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">1</span>
                  <p>Paste your active <code className="text-indigo-400 font-mono">ngrok</code> backend URL.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">2</span>
                  <p>Drag and drop a PDF file to trigger RAG indexing.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">3</span>
                  <p>The input bar below will unlock for agentic conversation.</p>
                </div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Active Chat State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto select-none space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-300">RAG Agent is Active</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The agent is now armed with facts from <code className="text-zinc-400 font-medium">{ingestedFileName}</code>. Ask any detailed questions about the content.
              </p>
            </div>
          </div>
        ) : (
          /* Chat History */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for agent */}
                {msg.sender === 'agent' && (
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-indigo-400" />
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none selection:bg-indigo-800' 
                    : 'bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-tl-none selection:bg-zinc-800'
                }`}>
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <Markdown options={MarkdownOptions}>{msg.text}</Markdown>
                  )}
                  <span className={`block text-[9px] mt-1.5 text-right font-medium ${
                    msg.sender === 'user' ? 'text-indigo-300' : 'text-zinc-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Avatar for user */}
                {msg.sender === 'user' && (
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Skeleton Loading State */}
            {isWaitingForAgent && (
              <div className="flex gap-4 justify-start">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="max-w-[85%] rounded-xl rounded-tl-none px-4 py-3 bg-zinc-900 border border-zinc-850 space-y-2.5 w-full md:w-[480px]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                    <span>Agent is thinking and searching knowledge base...</span>
                  </div>
                  <div className="space-y-2 animate-pulse">
                    <div className="h-2 w-full bg-zinc-800 rounded" />
                    <div className="h-2 w-[90%] bg-zinc-800 rounded" />
                    <div className="h-2 w-[60%] bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Section */}
      <footer className="p-4 border-t border-zinc-900 bg-zinc-900/20 sticky bottom-0 select-none">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isAgentReady || isWaitingForAgent}
            placeholder={
              !isServerOnline 
                ? "Connect to backend first..."
                : !isAgentReady 
                ? "Please upload a document to unlock chat..." 
                : "Ask anything about the document..."
            }
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isWaitingForAgent || !isAgentReady}
            className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </footer>
    </div>
  );
};
