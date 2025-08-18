#!/bin/bash

# Wait for network connectivity and X server to be fully started
sleep 10

# Wait for network connectivity
while ! ping -c 1 google.com &> /dev/null; do
    sleep 1
done

# Configure git pull strategy and pull latest changes
cd /home/mrinal/pi-dashboard
git config pull.rebase false  # Configure to use merge strategy
git fetch origin base-app    # Fetch the latest changes
git reset --hard origin/base-app  # Reset to the remote branch state

# Install any new requirements
pip3 install -r requirements.txt --break-system-packages

# Kill any existing Chromium processes
pkill -f chromium
pkill -f "chromium-browser"

# Kill any existing Python processes running the app
pkill -f "python3 app.py"

# Start Flask server in the background
cd /home/mrinal/pi-dashboard
python3 app.py &

# Wait for Flask server to start
sleep 5

# Launch Chromium in kiosk mode
DISPLAY=:0 chromium-browser --kiosk --disable-restore-session-state --noerrdialogs \
    --disable-suggestions-service --disable-translate --disable-save-password-bubble \
    --disable-session-crashed-bubble --disable-infobars --disable-features=TranslateUI \
    --disable-gpu --no-sandbox \
    --start-maximized --app=http://localhost:5000
