from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import create_pool
from routers.auth_router import router as auth_router
from routers.student_router import router as student_router


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

# Serve uploaded PDFs at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def health():
    return {"status": "ok", "service": "learnpool-api"}
