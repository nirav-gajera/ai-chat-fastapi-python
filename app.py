from dotenv import load_dotenv
from pathlib import Path

# Must be first — before any module that reads env vars

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from database import engine
import models
from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router
from fastapi.responses import JSONResponse

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
# Auto-create all tables on startup (like php artisan migrate)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Chat")


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    return JSONResponse(content={})


@app.get("/", response_class=HTMLResponse)
def index():
    with open("static/index.html", encoding="utf-8") as f:
        return f.read()


app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/api/info")
def get_info():
    import os
    model_name = os.getenv("GEMINI_MODEL") or os.getenv("OPENAI_API_MODEL") or "gemini-2.5-flash"
    model_name = model_name.strip('"\'')
    formatted = model_name.replace("-", " ").replace("_", " ").title()
    return {"model": formatted}


@app.get("/health")
def health():
    return {"status": "ok"}
