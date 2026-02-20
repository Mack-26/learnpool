from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

from config import settings
from database import create_pool
from routers.auth_router import router as auth_router
from routers.student_router import router as student_router
from routers.professor_router import router as professor_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool(settings.database_url)
    yield
    await app.state.pool.close()


app = FastAPI(title="LearnPool API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(professor_router)

# Serve uploaded PDFs at /uploads/<path> — return friendly message if file not found
_uploads_dir = Path(__file__).resolve().parent / "uploads"
_uploads_dir.mkdir(exist_ok=True)


@app.get("/uploads/{file_path:path}")
async def serve_upload(file_path: str):
    full_path = (_uploads_dir / file_path).resolve()
    if not str(full_path).startswith(str(_uploads_dir.resolve())):
        return HTMLResponse(content="<p>Invalid path</p>", status_code=403)
    if full_path.is_file():
        return FileResponse(full_path, media_type="application/pdf")
    return HTMLResponse(
        content="""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title></head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;
        font-family:system-ui,sans-serif;background:#f1f5f9;color:#64748b;">
        <div style="text-align:center;padding:2rem;">
        <p style="font-size:1.25rem;margin:0;">Document not available for preview</p>
        <p style="font-size:0.875rem;margin-top:0.5rem;">The file may not exist or has been removed.</p>
        </div></body></html>""",
        status_code=404,
    )


@app.get("/")
async def health():
    return {"status": "ok", "service": "learnpool-api"}
