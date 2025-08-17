document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('current-time');
    const albumArt = document.getElementById('album-art');
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Update clock every second
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString();
    }, 1000);

    // Fetch and update Spotify data
    async function updateSpotifyInfo() {
        try {
            const response = await fetch('/api/spotify/current_track');
            const data = await response.json();
            
            if (data.status === "no_track") {
                trackName.textContent = "No track playing";
                artistName.textContent = "";
                albumArt.src = "";
            } else {
                trackName.textContent = data.track_name;
                artistName.textContent = data.artist_name;
                albumArt.src = data.album_art;
            }
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
        }
    }

    // Update Spotify info every 5 seconds
    setInterval(updateSpotifyInfo, 5000);
    updateSpotifyInfo(); // Initial call

    // Handle button clicks
    const sendControlCommand = async (action) => {
        await fetch('/api/spotify/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action }),
        });
        // Immediately refresh the UI after a command
        updateSpotifyInfo();
    };

    playPauseBtn.addEventListener('click', () => sendControlCommand('toggle_playback'));
    prevBtn.addEventListener('click', () => sendControlCommand('previous'));
    nextBtn.addEventListener('click', () => sendControlCommand('next'));
});