# Chat with PDF - React Frontend 🎨

A beautiful, responsive React application built with **Vite**, **TypeScript**, and **TailwindCSS** featuring a premium Glassmorphic Dark Theme.

## ⚡ Layout & Features

* **Glassmorphic Dark UI**: Custom-tailored dark color palette (`bg-zinc-950` and `bg-zinc-900`) with smooth gradient effects, micro-animations, and hover states.
* **Global App State (`src/App.tsx`)**: Coordinates backend status checks, document upload progression (smoothly simulated up to 100%), and agent conversation history.
* **Sidebar Component (`src/components/Sidebar.tsx`)**:
  - Configures backend URL (automatically saved in `localStorage`).
  - Implements a Drag & Drop area for PDF files.
  - Displays connection indicators and system status metadata.
* **Chat Interface (`src/components/ChatInterface.tsx`)**:
  - Dynamically renders Markdown outputs (headers, bullet lists, inline code blocks, bold text, links).
  - Automatically scrolls to the newest message.
  - Provides a skeletons loader when the agent is formulating responses.

## 🚀 Setup & Run

### 1. Installation
Install dependencies:
```bash
npm install
```

### 2. Execution
Start the Vite development server:
```bash
npm run dev
```

Open the default URL in your browser: `http://localhost:5173/` and input the backend URL to start chatting.
