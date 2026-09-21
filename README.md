# AI Smart Interviewer Platform

An AI-powered technical interviewer application that automatically reviews your resume, generates custom technical questions, and conducts a live interview using a video feed, real-time focus tracking, and a built-in code whiteboard.

## Features
- **Resume Parsing & Question Generation**: Upload your resume (PDF) and the system will use Google's Gemini LLM to analyze your background and generate 3 custom technical questions.
- **Live Video Interview**: A sleek UI to mimic a real interview environment.
- **Real-Time Focus Tracking**: A WebSocket connection streams your webcam frames to the backend to calculate a "focus score", ensuring engagement during the interview.
- **Interactive Chat Interface**: Includes speech-to-text capabilities allowing you to speak your answers directly to the AI interviewer.
- **Built-in Code Whiteboard**: A Monaco-based code editor for live coding assessments with language support for JavaScript, TypeScript, and Python.
- **Beautiful UI**: Built with Next.js, Tailwind CSS, and Framer Motion for a premium, glass-morphism aesthetic.

## Tech Stack
### Frontend
- **Framework**: Next.js (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)

### Backend
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini (`langchain-google-genai`)
- **Document Parsing**: PyPDF2
- **Computer Vision**: OpenCV & MediaPipe (for focus/gaze tracking)
- **Real-time Comms**: WebSockets

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- A Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/hmpmanish/AI-Smart-Interviewer-Platform.git
cd AI-Smart-Interviewer-Platform
```

### 2. Backend Setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY
```

**Start the Backend Server:**
```bash
uvicorn main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

## Usage
1. Open the frontend in your browser.
2. Ensure your webcam and microphone permissions are granted.
3. Click "Upload Resume (PDF)" to let the AI analyze your background.
4. The AI will start the interview by asking custom questions based on your resume.
5. Use the Chat tab to talk/type your answers, and the Code tab to solve technical algorithms!

## License
MIT
