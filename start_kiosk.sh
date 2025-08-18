#!/bin/bash

# Wait for network connectivity
while ! ping -c 1 google.com &> /dev/null; do
    sleep 1
done

# Start Flask server in the background
cd "$(dirname "$0")"
python3 app.py &

# Wait for Flask server to start
sleep 5

# Launch Chromium in kiosk mode
chromium-browser --kiosk --disable-restore-session-state --noerrdialogs \
    --disable-suggestions-service --disable-translate --disable-save-password-bubble \
    --disable-session-crashed-bubble --disable-infobars --disable-features=TranslateUI \
    --start-maximized --app=http://localhost:5000
