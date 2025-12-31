# VideoScout AI - Bulk Video Evaluation Platform

A full-stack application to upload, transcribe, and evaluate multiple video files using local AI models.

## Features

- **Bulk Upload**: Handle 50+ video files simultaneously.
- **Automated Pipeline**: 
  - Audio Extraction (FFmpeg/MoviePy)
  - Speech-to-Text (OpenAI Whisper)
  - Text Analysis (Hugging Face Transformers & LanguageTool)
- **Advanced Scoring**:
  - Length verification (Target: 2 min ± 30s)
  - Grammar correctness
  - Complexity analysis (Flesch Reading Ease)
- **Local Processing**: No cloud costs. Runs entirely on your machine.
- **Real-time Dashboard**: Track progress and view scores.
- **Database Management**: Clear database and manage files easily.
- **Detailed Review**: View full transcripts, edit filenames, and open local files.

## Prerequisites

1. **Node.js**: [Download](https://nodejs.org/)
2. **Python 3.8+**: [Download](https://www.python.org/)
3. **MongoDB**: [Download](https://www.mongodb.com/try/download/community) and running locally.
4. **FFmpeg**: Must be installed and added to system PATH. [Guide](https://ffmpeg.org/download.html)
5. **Java (JRE)**: Required for LanguageTool (Grammar checking). [Download](https://www.java.com/en/download/)

## Scoring Criteria

The application evaluates videos based on 3 key metrics (Total Score: 100):

1. **Duration (40 points)**
   - Target: 90s - 150s (2 minutes ± 30 seconds).
   - Points are deducted for every second deviation from this range.

2. **Grammar (30 points)**
   - Analyzes transcript for grammatical errors.
   - Score is reduced based on error density (errors per 100 words).

3. **Complexity (30 points)**
   - Evaluates speech complexity using Flesch Reading Ease.
   - **Target Score**: 50 (Standard Complexity).
   - Deviating towards 0 (Too Confusing) or 100 (Too Simple) reduces the score.
   - Formula ensures a balance between sophistication and readability.

## Setup & Running

### 1. Database
Start your local MongoDB instance:
```bash
mongod
```

### 2. Backend Server (Node.js)
```bash
cd server
npm install
node server.js
```
*Server runs on http://localhost:5000*

### 3. ML Service (Python)
Ideally create a virtual environment first:
```bash
cd ml_service
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Service runs on http://localhost:8000*
*Note: First run will download AI models (Whisper) and LanguageTool binaries.*

### 4. Frontend (React)
```bash
cd client
npm install
npm run dev
```
*App runs on http://localhost:5173*

## Usage

1. Open the frontend at `http://localhost:5173`.
2. Drag and drop multiple video files (supports MP4, MOV, etc.).
3. Click "Upload Videos".
4. Watch the status change from "Processing" to "Completed".
5. View detailed scores.
6. Click on a video card to view the transcript, file details, and open the file location.

## Architecture

- **Frontend**: React, Vite, CSS Modules.
- **Backend**: Express.js, MongoDB (Mongoose), Multer.
- **ML Engine**: FastAPI, OpenAI Whisper (Base model), textstat (Complexity Analysis), LanguageTool.
- **Communication**: REST API.
