from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL

app = FastAPI(
    title="BDMFlow API",
    version="0.2.0",
    description="Bandarmologi & Data-Driven Market Flow — Institutional Stock Analytics for IDX",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.composite import router as composite_router
from routers.flow import router as flow_router
from routers.screener import router as screener_router
from routers.deepdive import router as deepdive_router
from routers.alerts import router as alerts_router
from routers.bandarmologi import router as bandarmologi_router
from routers.extended import router as extended_router

app.include_router(composite_router)
app.include_router(flow_router)
app.include_router(screener_router)
app.include_router(deepdive_router)
app.include_router(alerts_router)
app.include_router(bandarmologi_router)
app.include_router(extended_router)


@app.get("/")
async def root():
    return {"service": "BDMFlow API", "version": "0.2.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
