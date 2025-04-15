from datetime import datetime, timezone
import random
import pytz
from typing import Dict

class TimeUtils:
    def __init__(self):
        self.timezones = {
            "utc": pytz.utc,
            "america_newyork": pytz.timezone("America/New_York"),
            "asia_shanghai": pytz.timezone("Asia/Shanghai")
        }
        self.ntp_offset = 0.0

    def set_ntp_offset(self, offset: float):
        self.ntp_offset = offset

    def get_atomic_time(self, tz_key="utc") -> Dict:
        """Get simulated atomic time with NTP correction"""
        if tz_key not in self.timezones:
            tz_key = "utc"
            
        tz = self.timezones[tz_key]
        now = datetime.now(timezone.utc)
        
        # Add NTP offset correction
        corrected_time = now.timestamp() + self.ntp_offset
        
        # Add atomic clock noise (gaussian distribution)
        ns_adjustment = random.gauss(0, 10)  # 10ns standard deviation
        atomic_time = corrected_time + (ns_adjustment * 1e-9)
        
        # Convert to datetime objects
        dt_utc = datetime.fromtimestamp(atomic_time, timezone.utc)
        dt_tz = dt_utc.astimezone(tz)
        
        return {
            "timestamp": atomic_time,
            "timezone": tz_key,
            "iso": dt_tz.isoformat(),
            "utc_iso": dt_utc.isoformat(),
            "precision": "±10ns",
            "ntp_offset": self.ntp_offset
        }

    def get_available_timezones(self):
        return list(self.timezones.keys())