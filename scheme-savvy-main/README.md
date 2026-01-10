# Scheme Savvy - AI Government Scheme Assistant 🇮🇳

An advanced AI-powered assistant designed to help Indian citizens find accurate, verified information about Government Schemes in their native language. It uses a **RAG (Retrieval-Augmented Generation)** architecture to ensure answers are grounded in official documents.

## 🌟 Key Features

### 🗣️ Multilingual Support (Tamil / Hindi / English)
- **Dynamic Localization:** The entire UI (Buttons, Titles, Placeholders) instantly switches language.
- **Native AI Responses:** The AI answers strictly in the selected language (e.g., clear Tamil or Hindi Devanagari).
- **Voice Input:** Speak in your language ("பிரதமர் கிசான் பற்றி சொல்லுங்க") and the AI understands.

### 🤖 Advanced AI & RAG
- **Official Sources Only:** Strictly uses data from verified portals (`india.gov.in`, `pmindia.gov.in`).
- **Deep Search:** Retrieves relevant chunks from official PDFs stored in Supabase Vector store.
- **General Knowledge Fallback:** If no specific document is found, it provides general guidance with a strict disclaimer.

### 📱 Smart UI Features
- **🎙️ Voice Input:** Click the Mic and speak naturally.
- **🔊 Read Aloud (TTS):** The bot can read the answer out loud for accessibility.
- **📤 WhatsApp Share:** Instantly share scheme details with family/friends via WhatsApp.
- **⬇️ Download & Copy:** Save answers as text files or copy to clipboard.

## 🛠 Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Shadcn UI.
- **Backend:** Supabase Edge Functions (Deno), PostgreSQL (`pgvector`).
- **AI Model:** Groq (`llama-3.3-70b-versatile`) for high-speed, high-quality generation.
- **Embeddings:** `gte-small` (via Supabase).

## 📂 Project Structure

- `/src` - Frontend React application with localized components (`ChatMessage`, `Header`, `EmptyState`).
- `/supabase` - Database schema and Edge Functions.
  - `/functions/chat` - Main RAG logic + Multilingual System Prompt.
  - `/functions/ingest` - Document processing pipeline.
  - `/functions/documents` - Knowledge base management.

## ⚡ How It Works

1.  **User Selects Language:** (e.g., Tamil). UI updates immediately.
2.  **User Asks:** "விவசாயிகளுக்கான திட்டங்கள்" (via Text or Voice).
3.  **RAG Search:** System finds relevant English/Native content from the database.
4.  **AI Generation:** The System Prompt instructs the AI to answer **in Tamil** using the retrieved facts.
5.  **Delivery:** User sees the answer in Tamil, hears it via TTS, or shares it on WhatsApp.

## 🔧 Setup & Deployment

1.  **Install Dependencies:** `npm install`
2.  **Run Locally:** `npx vite` (Runs on `http://localhost:8080`)
3.  **Deploy Functions:** `supabase functions deploy chat --no-verify-jwt`
