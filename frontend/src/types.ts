export interface HealthCheckResponse {
  status: string;
  project: string;
  agent_ready: boolean;
  engineer: string;
}

export interface UploadResponse {
  message: string;
  status: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}
