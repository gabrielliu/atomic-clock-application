#!/bin/bash

# Build and start the containers
docker-compose up -d --build

# Print the services and their exposed ports
echo ""
echo "Application is running!"
echo "----------------------"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:8000/time"
echo "NTP Status: http://localhost:8000/ntp-status"
echo ""
echo "Use './stop.sh' to stop the services."