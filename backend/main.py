from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from googletrans import Translator, LANGUAGES
import time

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update this with your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    translator = Translator()
    try:
        translation = translator.translate(
            request.text,
            src=request.source_lang,
            dest=request.target_lang
        )
        return {
            "translated_text": translation.text,
            "detected_language": translation.src,
            "confidence": translation.extra_data.get("confidence", None)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/languages")
async def get_languages():
    return LANGUAGES

@app.get("/detect-language")
async def detect_language(text: str):
    
    translator = Translator()
    try:
        detection = translator.detect(text)
        return {
            "detected_language": detection.lang,
            "confidence": detection.confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)