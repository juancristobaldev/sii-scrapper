from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="Antifraude ML Engine",
    description="Motor de IA para detección de fraude financiero empresarial",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/ml")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "antifraude-ml-engine"}
