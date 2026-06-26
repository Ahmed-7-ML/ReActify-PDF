import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import type { Message, HealthCheckResponse, UploadResponse, ChatResponse } from './types';

function App() {
  // State variables
  const [ngrokUrl, setNgrokUrl] = useState<string>(() => {
    return localStorage.getItem('ngrok_backend_url') || 'https://unsavingly-valvar-jami.ngrok-free.dev';
  });
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isAgentReady, setIsAgentReady] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestProgress, setIngestProgress] = useState<number>(0);
  const [ingestedFileName, setIngestedFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<{ project: string; engineer: string } | null>(null);

  // Persistence: Save ngrokUrl to localstorage whenever it changes
  useEffect(() => {
    if (ngrokUrl) {
      localStorage.setItem('ngrok_backend_url', ngrokUrl);
    }
  }, [ngrokUrl]);

  // Proactive Health check on startup if URL is saved
  useEffect(() => {
    if (ngrokUrl) {
      checkServerHealth(ngrokUrl);
    }
  }, []);

  // Normalize API url (ensures no trailing slash)
  const getBaseUrl = (url: string) => {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  };

  // 1. Health Check GET /
  const checkServerHealth = async (urlOverride?: string) => {
    const targetUrl = getBaseUrl(urlOverride || ngrokUrl);
    if (!targetUrl) return;

    setIsCheckingStatus(true);
    try {
      const response = await axios.get<HealthCheckResponse>(targetUrl, {
        headers: { 
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 5000 // 5 seconds timeout
      });

      if (response.data && response.data.status === 'online') {
        setIsServerOnline(true);
        setIsAgentReady(response.data.agent_ready);
        setSystemInfo({
          project: response.data.project || 'Chat with PDF',
          engineer: response.data.engineer || 'Ahmed Akram Amer'
        });
      } else {
        setIsServerOnline(false);
        setIsAgentReady(false);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setIsServerOnline(false);
      setIsAgentReady(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // 2. Document Ingestion POST /api/upload
  const handleFileUpload = async (file: File) => {
    const baseUrl = getBaseUrl(ngrokUrl);
    if (!baseUrl) {
      alert("Please configure the backend URL first!");
      return;
    }

    setIsIngesting(true);
    setIngestProgress(10);
    setIngestedFileName(file.name);

    // Mock progress simulation interval to make it feel extremely smooth & premium
    const progressInterval = setInterval(() => {
      setIngestProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 400);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post<UploadResponse>(
        `${baseUrl}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 60000 // Ingesting might take up to 60 seconds (PDF parsing + chunking + embeddings)
        }
      );

      clearInterval(progressInterval);
      setIngestProgress(100);
      
      // Pause briefly at 100% for visual satisfaction
      setTimeout(async () => {
        setIsIngesting(false);
        setIngestProgress(0);
        // Refresh server health to check if Agent is now fully armed
        await checkServerHealth();
      }, 500);

    } catch (error: any) {
      clearInterval(progressInterval);
      setIsIngesting(false);
      setIngestProgress(0);
      setIngestedFileName(null);
      
      const errMsg = error.response?.data?.detail || error.message || "Failed to upload document.";
      alert(`Ingestion Failed: ${errMsg}`);
    }
  };

  // 3. Agentic Chat POST /api/chat
  const sendMessage = async (text: string) => {
    const baseUrl = getBaseUrl(ngrokUrl);
    if (!baseUrl) return;

    // 1. Append User Message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // 2. Trigger waiting state
    setIsWaitingForAgent(true);

    try {
      const response = await axios.post<ChatResponse>(
        `${baseUrl}/api/chat`,
        { message: text },
        {
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 45000 // Reasoning agents might take up to 45 seconds for complex lookups
        }
      );

      const agentMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'agent',
        text: response.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);

    } catch (error: any) {
      console.error('Agent chat error:', error);
      const errMsg = error.response?.data?.detail || error.message || "Something went wrong.";
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'agent',
        text: `⚠️ **Error communicating with AI Agent:** \n\n${errMsg}\n\nPlease check if the backend is running and the ngrok URL is valid.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsWaitingForAgent(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Sidebar - Settings & Upload */}
      <Sidebar
        ngrokUrl={ngrokUrl}
        setNgrokUrl={setNgrokUrl}
        isServerOnline={isServerOnline}
        isCheckingStatus={isCheckingStatus}
        checkServerHealth={checkServerHealth}
        isAgentReady={isAgentReady}
        isIngesting={isIngesting}
        ingestProgress={ingestProgress}
        ingestedFileName={ingestedFileName}
        handleFileUpload={handleFileUpload}
        systemInfo={systemInfo}
      />

      {/* Main Area - Chat Interface */}
      <ChatInterface
        messages={messages}
        sendMessage={sendMessage}
        isWaitingForAgent={isWaitingForAgent}
        isAgentReady={isAgentReady}
        isServerOnline={isServerOnline}
        ingestedFileName={ingestedFileName}
      />
    </div>
  );
}

export default App;
