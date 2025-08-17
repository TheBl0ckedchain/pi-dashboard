document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('current-time');
    const albumArt = document.getElementById('album-art');
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const searchInput = document.getElementById('search-input');
    const searchResultsList = document.getElementById('search-results-list');

    // Update clock every second
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
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
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                trackName.textContent = data.track_name;
                artistName.textContent = data.artist_name;
                albumArt.src = data.album_art;
                playPauseBtn.innerHTML = data.is_playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            }
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
        }
    }

    // Update Spotify info every 5 seconds
    setInterval(updateSpotifyInfo, 5000);
    updateSpotifyInfo();

    // Handle button clicks for playback controls
    const sendControlCommand = async (action) => {
        await fetch('/api/spotify/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action }),
        });
        updateSpotifyInfo();
    };

    playPauseBtn.addEventListener('click', () => sendControlCommand('toggle_playback'));
    prevBtn.addEventListener('click', () => sendControlCommand('previous'));
    nextBtn.addEventListener('click', () => sendControlCommand('next'));

    // Handle search input
    searchInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const query = event.target.value;
            if (query) {
                try {
                    const response = await fetch('/api/spotify/search_tracks?query=' + encodeURIComponent(query));
                    const results = await response.json();
                    
                    searchResultsList.innerHTML = '';
                    results.forEach(track => {
                        const item = document.createElement('div');
                        item.className = 'search-result-item';
                        item.innerHTML = `
                            <img src="${track.album_art}" class="search-result-image">
                            <div>
                                <h4 style="margin: 0; color: white;">${track.name}</h4>
                                <p style="margin: 0; color: #b3b3b3;">${track.artist}</p>
                            </div>
                        `;
                        item.addEventListener('click', () => {
                            sendControlCommand('play_track', { uri: track.uri });
                        });
                        searchResultsList.appendChild(item);
                    });
                } catch (error) {
                    console.error('Error searching for tracks:', error);
                }
            }
        }
    });
});