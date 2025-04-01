import ntplib
import time
from datetime import datetime, timezone
import statistics
from typing import Tuple

class NTPSynchronizer:
    def __init__(self, ntp_server="pool.ntp.org", samples=5, timeout=1):
        self.ntp_server = ntp_server
        self.samples = samples
        self.timeout = timeout
        self.offset = 0.0
        self.last_sync = None
        self.client = ntplib.NTPClient()

    def sync(self) -> Tuple[float, float]:
        """Perform NTP synchronization and return (offset, delay)"""
        offsets = []
        delays = []
        
        for _ in range(self.samples):
            try:
                response = self.client.request(
                    self.ntp_server,
                    version=3,
                    timeout=self.timeout
                )
                offsets.append(response.offset)
                delays.append(response.delay)
                time.sleep(0.1)  # Space out requests
            except Exception as e:
                print(f"NTP sync error: {e}")
                continue
        
        if offsets:
            self.offset = statistics.median(offsets)
            self.last_sync = datetime.now(timezone.utc)
            return self.offset, statistics.median(delays)
        
        return 0.0, 0.0

    def get_sync_status(self):
        return {
            "ntp_server": self.ntp_server,
            "offset": self.offset,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "synced": self.last_sync is not None
        }