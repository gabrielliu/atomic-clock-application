import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .ntp_sync import NTPSynchronizer
from .time_utils import TimeUtils
import threading
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()

# Initialize components
ntp_sync = NTPSynchronizer()
time_utils = TimeUtils()

# Background NTP sync thread
def ntp_sync_thread():
    while True:
        offset, delay = ntp_sync.sync()
        time_utils.set_ntp_offset(offset)
        time.sleep(60)  # Sync every minute

# Start NTP sync thread
threading.Thread(target=ntp_sync_thread, daemon=True).start()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:3001",
        # "http://127.0.0.1:3001",
        # "http://frontend:"  # For Docker-internal communication
        "*"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/clock")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    current_tz = "utc"
    
    try:
        # Initial timezone setting
        data = await websocket.receive_text()
        if data in time_utils.get_available_timezones():
            current_tz = data
            
        while True:
            # Check for timezone updates
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                if data in time_utils.get_available_timezones():
                    current_tz = data
            except asyncio.TimeoutError:
                pass
                
            time_data = time_utils.get_atomic_time(current_tz)
            await websocket.send_json(time_data)
            await asyncio.sleep(0.1)  # 100ms update interval
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()


@app.get("/time")
async def get_time(tz: str = "utc"):
    return time_utils.get_atomic_time(tz)

@app.get("/timezones")
async def get_timezones():
    return {
        "available_timezones": time_utils.get_available_timezones(),
        "default": "utc"
    }

@app.get("/ntp-status")
async def get_ntp_status():
    return ntp_sync.get_sync_status()

@app.get("/health")
async def health_check():
    return JSONResponse(content={"status": "healthy"})