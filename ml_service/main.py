from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import uvicorn
import os
import whisper
import torch
from moviepy.editor import VideoFileClip
import language_tool_python
import textstat

app = FastAPI()

# Global models
whisper_model = None
grammar_tool = None

def load_models():
    global whisper_model, grammar_tool
    print("Loading Whisper model...")
    whisper_model = whisper.load_model("base")
    
    print("Loading Grammar tool...")
    # using en-GB as it matches Indian English standards (British spelling/grammar)
    grammar_tool = language_tool_python.LanguageTool('en-GB')
    print("Models loaded.")

class VideoRequest(BaseModel):
    video_id: str
    file_path: str

@app.on_event("startup")
async def startup_event():
    load_models()

@app.post("/process")
async def process_video(request: VideoRequest):
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # 1. Extract Audio & Get Duration
        audio_path = request.file_path + ".mp3"
        video_duration = 0
        try:
            video = VideoFileClip(request.file_path)
            video_duration = video.duration # Duration in seconds
            video.audio.write_audiofile(audio_path, logger=None)
            video.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")

        # 2. Transcribe
        result = whisper_model.transcribe(audio_path)
        transcript = result["text"]
        
        # Cleanup audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)

        # 3. Analyze / Score
        
        # --- A. Length Scoring (Target: 2 min +/- 30s -> 90s to 150s) ---
        # Max Length Score: 40
        length_score = 40
        min_duration = 90
        max_duration = 150
        
        if video_duration < min_duration:
            diff = min_duration - video_duration
            length_score = max(0, 40 - (diff * 0.5)) # Deduct 0.5 point per second off
        elif video_duration > max_duration:
            diff = video_duration - max_duration
            length_score = max(0, 40 - (diff * 0.5))
        
        length_score = round(length_score, 2)

        # --- B. Grammar Scoring ---
        # Max Grammar Score: 30
        grammar_matches = grammar_tool.check(transcript)
        error_count = len(grammar_matches)
        word_count = len(transcript.split())
        
        # Calculate error density (errors per 100 words)
        error_density = (error_count / word_count * 100) if word_count > 0 else 0
        
        # Deduct points based on error density. 
        grammar_score = max(0, 30 - (error_density * 3))
        grammar_score = round(grammar_score, 2)

        # --- C. Complexity Scoring (Flesch Reading Ease) ---
        # Max Complexity Score: 30
        # Flesch Reading Ease: 100 (very easy) to 0 (very confusing)
        # We want higher score for higher complexity (lower ease).
        try:
            reading_ease = textstat.flesch_reading_ease(transcript)
        except:
            reading_ease = 80.0 # Default fallback (Easy conversational)
            
        # Triangular scoring:
        # Target: 50 (Standard Complexity) -> Max Score (30)
        # 0 or 100 (Too hard or Too easy) -> Min Score (0)
        distance = abs(reading_ease - 50)
        clamped_distance = min(50, distance) # Ensure we don't go negative if >100 or <0
        
        complexity_score = 30 * (1 - (clamped_distance / 50))
        complexity_score = round(max(0, complexity_score), 2)

        # Total Score calculation
        total_score_100 = length_score + grammar_score + complexity_score
        total_score_100 = min(100, max(0, total_score_100))
        
        # Display as single digit integer (1-9)
        # Scale 0-100 to 1-9
        final_display_score = round((total_score_100 / 100) * 8) + 1
        
        return {
            "video_id": request.video_id,
            "score": int(final_display_score),
            "transcript": transcript,
            "details": {
                "duration_seconds": round(video_duration, 2),
                "length_score": length_score,
                "grammar_score": grammar_score,
                "grammar_errors": error_count,
                "complexity_score": complexity_score,
                "reading_ease": reading_ease,
                "raw_total": total_score_100,
                "word_count": word_count
            }
        }

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
