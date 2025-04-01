// import React, { useState, useEffect } from 'react';
// import '../styles/Clock.css';

// const Clock = () => {
//     const [time, setTime] = useState(null);
//     const [latency, setLatency] = useState(null);
//     const [connectionStatus, setConnectionStatus] = useState('disconnected');
//     const [selectedTimezone, setSelectedTimezone] = useState('utc');
//     const [availableTimezones, setAvailableTimezones] = useState([]);
//     const [ntpStatus, setNtpStatus] = useState(null);
//     const [ws, setWs] = useState(null);
//     // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
//     const API_BASE_URL = process.env.NODE_ENV === 'development' 
//     ? 'http://localhost:8000' 
//     : '/api';
//     const wsUrl = process.env.NODE_ENV === 'development'
//     ? 'ws://localhost:8000/ws/clock'
//     : 'ws://backend:8000/ws/clock';
//     // Fetch available timezones and NTP status on component mount
//     useEffect(() => {
//         // Get available timezones
//         fetch(`${API_BASE_URL}/timezones`)
//             .then(response => response.json())
//             .then(data => {
//                 setAvailableTimezones(data.available_timezones);
//             })
//             .catch(error => {
//                 console.error('Error fetching timezones:', error);
//             });

//         // Get NTP status
//         fetch(`${API_BASE_URL}/ntp-status`)
//             .then(response => response.json())
//             .then(data => {
//                 setNtpStatus(data);
//             })
//             .catch(error => {
//                 console.error('Error fetching NTP status:', error);
//             });
//     }, []);

//     // WebSocket connection
//     useEffect(() => {
//         const websocket = new WebSocket(`ws://${wsUrl}`);
//         setWs(websocket);

//         websocket.onopen = () => {
//             setConnectionStatus('connected');
//             console.log('WebSocket connected');
//             // Send initial timezone selection
//             websocket.send(selectedTimezone);
//         };

//         websocket.onmessage = (event) => {
//             const receivedTime = performance.now();
//             const data = JSON.parse(event.data);
            
//             // Calculate round-trip latency (approximation)
//             if (data.timestamp) {
//                 const serverTime = data.timestamp * 1000; // convert to ms
//                 const currentTime = Date.now();
//                 const estimatedLatency = (currentTime - serverTime) / 2;
//                 setLatency(estimatedLatency.toFixed(3));
//             }
            
//             setTime(data);
//         };

//         websocket.onerror = (error) => {
//             setConnectionStatus('error');
//             console.error('WebSocket error:', error);
//         };

//         websocket.onclose = () => {
//             setConnectionStatus('disconnected');
//             console.log('WebSocket disconnected');
//         };

//         return () => {
//             websocket.close();
//         };
//     }, []);

//     // Handle timezone change
//     useEffect(() => {
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             ws.send(selectedTimezone);
//         }
//     }, [selectedTimezone, ws]);

//     const formatTime = (isoString) => {
//         if (!isoString) return '--:--:--.---';
//         const timePart = isoString.split('T')[1];
//         const [hms, fractional] = timePart.split('.');
//         return `${hms}.${fractional.substring(0, 3)}`;
//     };

//     const formatTimezoneName = (tz) => {
//         return tz
//             .replace('_', ' ')
//             .replace(/\b\w/g, l => l.toUpperCase())
//             .replace('America ', '')
//             .replace('Asia ', '');
//     };

//     const formatOffset = (offset) => {
//         if (offset === undefined || offset === null) return '--';
//         return `${(offset * 1000).toFixed(3)} ms`;
//     };

//     return (
//         <div className="clock-container">
//             <h1>Atomic Clock Simulator</h1>
//             <div className="timezone-selector">
//                 <label htmlFor="timezone">Timezone: </label>
//                 <select
//                     id="timezone"
//                     value={selectedTimezone}
//                     onChange={(e) => setSelectedTimezone(e.target.value)}
//                 >
//                     {availableTimezones.map(tz => (
//                         <option key={tz} value={tz}>
//                             {formatTimezoneName(tz)}
//                         </option>
//                     ))}
//                 </select>
//             </div>
//             <div className="clock-display">
//                 {time ? formatTime(time.iso) : 'Loading...'}
//             </div>
//             <div className="clock-info">
//                 <div className="info-section">
//                     <h3>Time Information</h3>
//                     <p>UTC Time: {time ? formatTime(time.utc_iso) : '--'}</p>
//                     <p>Precision: {time?.precision || '--'}</p>
//                 </div>
//                 <div className="info-section">
//                     <h3>Network Information</h3>
//                     <p>Latency: {latency ? `${latency} ms` : '--'}</p>
//                     <p>Status: {connectionStatus}</p>
//                 </div>
//                 <div className="info-section">
//                     <h3>NTP Synchronization</h3>
//                     <p>Server: {ntpStatus?.ntp_server || '--'}</p>
//                     <p>Offset: {formatOffset(ntpStatus?.offset)}</p>
//                     <p>Last Sync: {ntpStatus?.last_sync || '--'}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Clock;
import React, { useState, useEffect } from 'react';
import '../styles/Clock.css';

const Clock = () => {
    const [time, setTime] = useState(null);
    const [latency, setLatency] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [selectedTimezone, setSelectedTimezone] = useState('utc');
    const [availableTimezones, setAvailableTimezones] = useState([]);
    const [ntpStatus, setNtpStatus] = useState(null);
    const [ws, setWs] = useState(null);

    // Determine API base URL based on environment
    const API_BASE_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000' 
        : '/api';

    // Fetch available timezones and NTP status on component mount
    useEffect(() => {
        // Get available timezones
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

        // Get NTP status
        fetch(`${API_BASE_URL}/ntp-status`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                setNtpStatus(data);
            })
            .catch(error => {
                console.error('Error fetching NTP status:', error);
            });
    }, [API_BASE_URL]);

    // WebSocket connection
    useEffect(() => {
        // Determine WebSocket URL based on environment
        const wsUrl = process.env.NODE_ENV === 'development'
            ? 'ws://localhost:8000/ws/clock'
            : `ws://${window.location.host}/ws/clock`;

        const websocket = new WebSocket(wsUrl);
        setWs(websocket);

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

    // Handle timezone change
    const handleTimezoneChange = (e) => {
        const newTimezone = e.target.value;
        setSelectedTimezone(newTimezone);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(newTimezone);
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

    return (
        <div className="clock-container">
            <h1>Atomic Clock Simulator</h1>
            <div className="timezone-selector">
                <label htmlFor="timezone">Timezone: </label>
                <select
                    id="timezone"
                    value={selectedTimezone}
                    onChange={handleTimezoneChange}
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
                    <p>Status: {connectionStatus}</p>
                </div>
                <div className="info-section">
                    <h3>NTP Synchronization</h3>
                    <p>Server: {ntpStatus?.ntp_server || '--'}</p>
                    <p>Offset: {formatOffset(ntpStatus?.offset)}</p>
                    <p>Last Sync: {ntpStatus?.last_sync || '--'}</p>
                </div>
            </div>
        </div>
    );
};

export default Clock;