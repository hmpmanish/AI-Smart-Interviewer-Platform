from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
from pydantic import BaseModel
import os
import base64
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import json

from vision import calculate_focus_score
# Load environment variables
load_dotenv()

app = FastAPI(title="AI Interviewer Backend")

# Configure CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update if your frontend port differs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionResponse(BaseModel):
    questions: list[str]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Smart Interviewer API is running"}

@app.post("/upload-resume", response_model=QuestionResponse)
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # 1. Extract text from PDF
    try:
        pdf_reader = PyPDF2.PdfReader(file.file)
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(e)}")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="The PDF contains no readable text")

    # 2. Use LangChain and Gemini to generate questions
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set in the environment")

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.7
        )

        prompt_template = """
        You are an expert technical interviewer. I will provide you with a candidate's resume text.
        Your task is to analyze their skills, experience, and projects, and generate EXACTLY 3 custom technical interview questions.
        The questions should assess their specific technical depth based on the resume.

        Return the response as a valid JSON array of strings containing ONLY the 3 questions. Do not include markdown formatting or any other text.
        Example output format:
        ["Question 1", "Question 2", "Question 3"]

        Candidate Resume:
        {resume_text}
        """

        prompt = PromptTemplate(template=prompt_template, input_variables=["resume_text"])
        chain = prompt | llm

        response = chain.invoke({"resume_text": resume_text})
        
        # Parse the JSON string into a Python list
        # We clean the response by removing potential markdown backticks that Gemini might add
        clean_text = response.content.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        questions = json.loads(clean_text.strip())

        if not isinstance(questions, list) or len(questions) != 3:
            raise ValueError("The generated response was not a valid list of 3 questions")

        return QuestionResponse(questions=questions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

@app.websocket("/ws/video")
async def websocket_video_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive base64 encoded frame from frontend
            data = await websocket.receive_text()
            
            try:
                # Remove data URL scheme if present (e.g., "data:image/jpeg;base64,...")
                if "," in data:
                    data = data.split(",")[1]
                    
                image_bytes = base64.b64decode(data)
                
                # Process the frame
                result = calculate_focus_score(image_bytes)
                
                # Send back the focus score
                await websocket.send_json(result)
                
            except Exception as e:
                await websocket.send_json({"is_focused": False, "score": 0, "error": str(e)})
                
    except WebSocketDisconnect:
        print("Client disconnected from video stream")
