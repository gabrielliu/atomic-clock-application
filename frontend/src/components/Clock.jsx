// export default Clock;
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Clock.css';

const Clock = () => {
    const [time, setTime] = useState(null);
    const [latency, setLatency] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [selectedTimezone, setSelectedTimezone] = useState('america_newyork');
    const [availableTimezones, setAvailableTimezones] = useState([]);
    const [ntpStatus, setNtpStatus] = useState(null);
    const [ntpStatusColor, setNtpStatusColor] = useState('neutral');
    const wsRef = useRef(null);
    const ntpIntervalRef = useRef(null);

    // Determine API base URL based on environment
    const API_BASE_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5555' 
        : `https://${window.location.host}/api`;
    // console.log(API_BASE_URL)
    // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost/api';

    // Fetch NTP status
    const fetchNtpStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ntp-status`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setNtpStatus(data);
            
            // Set background color based on sync status
            if (data.synced) {
                const absOffset = Math.abs(data.offset);
                if (absOffset < 0.01) { // < 10ms
                    setNtpStatusColor('good');
                } else if (absOffset < 0.1) { // < 100ms
                    setNtpStatusColor('warning');
                } else {
                    setNtpStatusColor('bad');
                }
            } else {
                setNtpStatusColor('bad');
            }
        } catch (error) {
            console.error('Error fetching NTP status:', error);
            setNtpStatusColor('bad');
        }
    };

    // WebSocket connection
    useEffect(() => {
        // Determine WebSocket URL based on environment
        const wsUrl = process.env.NODE_ENV === 'development'
            ? 'ws://localhost:5555/ws/clock'
            : `wss://${window.location.host}/ws/clock`;
        // console.log(wsUrl)
        // const wsUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost/ws/clock';
        const websocket = new WebSocket(wsUrl);
        wsRef.current = websocket;

        websocket.onopen = () => {
            setConnectionStatus('connected');
            console.log('WebSocket connected');
            // Send initial timezone selection
            websocket.send(selectedTimezone);
        };

        websocket.onmessage = (event) => {
            const receivedTime = performance.now();
            const data = JSON.parse(event.data);
            
            // Calculate round-trip latency (approximation)
            if (data.timestamp) {
                const serverTime = data.timestamp * 1000; // convert to ms
                const currentTime = Date.now();
                const estimatedLatency = (currentTime - serverTime) / 2;
                setLatency(estimatedLatency.toFixed(3));
            }
            
            setTime(data);
        };

        websocket.onerror = (error) => {
            setConnectionStatus('error');
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            setConnectionStatus('disconnected');
            console.log('WebSocket disconnected');
        };

        return () => {
            websocket.close();
        };
    }, [selectedTimezone]);

    // Initial data fetch and NTP status polling
    useEffect(() => {
        // Fetch available timezones
        fetch(`${API_BASE_URL}/timezones`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                setAvailableTimezones(data.available_timezones);
            })
            .catch(error => {
                console.error('Error fetching timezones:', error);
            });

        // Initial NTP status fetch
        fetchNtpStatus();

        // Set up NTP status polling (every minute)
        ntpIntervalRef.current = setInterval(fetchNtpStatus, 60000);

        return () => {
            if (ntpIntervalRef.current) {
                clearInterval(ntpIntervalRef.current);
            }
        };
    }, [API_BASE_URL]);

    // Handle timezone change
    const handleTimezoneChange = (e) => {
        const newTimezone = e.target.value;
        setSelectedTimezone(newTimezone);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(newTimezone);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--:--.---';
        const timePart = isoString.split('T')[1];
        const [hms, fractional] = timePart.split('.');
        return `${hms}.${fractional.substring(0, 3)}`;
    };

    const formatTimezoneName = (tz) => {
        return tz
            .replace('_', ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('America ', '')
            .replace('Asia ', '');
    };

    const formatOffset = (offset) => {
        if (offset === undefined || offset === null) return '--';
        return `${(offset * 1000).toFixed(3)} ms`;
    };

    const getNtpStatusClass = () => {
        switch (ntpStatusColor) {
            case 'good': return 'ntp-status-good';
            case 'warning': return 'ntp-status-warning';
            case 'bad': return 'ntp-status-bad';
            default: return 'ntp-status-neutral';
        }
    };

    return (
        <div className="clock-container">
            <h1>Atomic Clock</h1>
            <div className="timezone-selector">
                <label htmlFor="timezone">Timezone: </label>
                <select
                    id="timezone"
                    value={selectedTimezone}
                    onChange={handleTimezoneChange}
                    disabled={connectionStatus !== 'connected'}
                >
                    {availableTimezones.map(tz => (
                        <option key={tz} value={tz}>
                            {formatTimezoneName(tz)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="clock-display">
                {time ? formatTime(time.iso) : 'Loading...'}
            </div>
            <div className="clock-info">
                <div className="info-section">
                    <h3>Time Information</h3>
                    <p>UTC Time: {time ? formatTime(time.utc_iso) : '--'}</p>
                    <p>Precision: {time?.precision || '--'}</p>
                </div>
                <div className="info-section">
                    <h3>Network Information</h3>
                    <p>Latency: {latency ? `${latency} ms` : '--'}</p>
                    <p>Status: <span className={`status-${connectionStatus}`}>
                        {connectionStatus}
                    </span></p>
                </div>
                <div className={`info-section ${getNtpStatusClass()}`}>
                    <h3>NTP Synchronization</h3>
                    <p>Server: {ntpStatus?.ntp_server || '--'}</p>
                    <p>Offset: {formatOffset(ntpStatus?.offset)}</p>
                    <p>Last Sync: {ntpStatus?.last_sync || '--'}</p>
                    <p>Status: {ntpStatus?.synced ? 
                        <span className="synced-status">Synchronized</span> : 
                        <span className="not-synced-status">Not Synchronized</span>}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Clock;