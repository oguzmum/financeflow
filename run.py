import uvicorn
from fastapi.staticfiles import StaticFiles
from app.main import app

app.mount("/", StaticFiles(directory="public", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )