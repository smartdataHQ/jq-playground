#!/bin/bash

# Start both frontend and backend in development mode

echo "🚀 Starting jq Playground Development Servers"
echo "=============================================="

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq command-line tool is not installed"
    echo "Please install jq first:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu: sudo apt-get install jq"
    echo "  Windows: choco install jq"
    exit 1
fi

echo "✅ jq command-line tool found"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
else
    echo "✅ Backend dependencies already installed"
fi

# Start backend in background
echo "🔧 Starting backend server..."
(cd server && npm run dev) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

echo "✅ Both servers are starting..."
echo "📍 Backend: http://localhost:3001"
echo "📍 Frontend: http://localhost:5176"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait