#!/bin/bash
echo "============================================"
echo "  Elite Orbits - Starting local server"
echo "============================================"
echo

cd "$(dirname "$0")/backend" || exit 1

if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies for the first time, please wait..."
  npm install
fi

if [ ! -f ".env" ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
fi

echo
echo "Starting backend at http://localhost:4000 ..."
npm start &
BACKEND_PID=$!

sleep 3

echo "Opening the website in Chrome..."
cd ../frontend || exit 1
if command -v open >/dev/null 2>&1; then
  open -a "Google Chrome" "$(pwd)/index.html"
else
  xdg-open "$(pwd)/index.html" 2>/dev/null || google-chrome "$(pwd)/index.html"
fi

echo
echo "Done. Keep this terminal window open while using the site."
echo "Press Ctrl+C here to stop the backend when you're finished."
wait $BACKEND_PID
