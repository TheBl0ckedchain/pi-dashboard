document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('current-time');
    const albumArt = document.getElementById('album-art');
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const searchResultsList = document.getElementById('search-results-list');
    const nowPlayingInfo = document.getElementById('now-playing-info');

    // Debounce function to limit API calls
    let searchTimeout;
    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            searchResultsList.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/spotify/search_combined?query=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            searchResultsList.innerHTML = '';
            
            if (results.error) {
                searchResultsList.innerHTML = `<p style="color: red;">Error: ${results.error}</p>`;
                return;
            }

            if (results.length === 0) {
                searchResultsList.innerHTML = `<p style="text-align: center;">No results found.</p>`;
                return;
            }

            results.forEach(item => {
                const name = item.name;
                let subtitle;
                let uri = item.uri;
                let image = item.image || '/static/default_album_art.png';
                let type = item.type;

                if (type === 'track') {
                    subtitle = `by ${item.artist}`;
                } else if (type === 'playlist') {
                    subtitle = `by ${item.owner}`;
                } else if (type === 'artist') {
                    subtitle = 'Artist';
                }

                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="${image}" class="search-result-image">
                    <div>
                        <h4 style="margin: 0; color: white;">${name}</h4>
                        <p style="margin: 0; color: #b3b3b3;">${subtitle}</p>
                    </div>
                `;
                resultItem.addEventListener('click', () => {
                    sendControlCommand('play', uri);
                });
                searchResultsList.appendChild(resultItem);
            });
        } catch (error) {
            console.error('Error searching:', error);
            searchResultsList.innerHTML = `<p style="color: red;">Failed to fetch search results. Please check the server connection.</p>`;
        }
    };
    
    searchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');
            
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            targetTab.style.display = 'flex';
        });
    });

    // Clock and Player functionality
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
    }, 1000);

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

    setInterval(updateSpotifyInfo, 5000);
    updateSpotifyInfo();

    const sendControlCommand = async (action, uri = null) => {
        const payload = { action };
        if (uri) {
            payload.uri = uri;
        }

        await fetch('/api/spotify/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        updateSpotifyInfo();
    };

    playPauseBtn.addEventListener('click', () => sendControlCommand('toggle_playback'));
    prevBtn.addEventListener('click', () => sendControlCommand('previous'));
    nextBtn.addEventListener('click', () => sendControlCommand('next'));
});