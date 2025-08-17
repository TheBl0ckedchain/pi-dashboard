document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('current-time');
    const albumArt = document.getElementById('album-art');
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const searchInput = document.getElementById('search-input');
    const searchType = document.getElementById('search-type');
    const searchResultsList = document.getElementById('search-results-list');

    // Debounce function to limit API calls
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, delay);
        };
    };

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

    // Handle live search
    const performSearch = async () => {
        const query = searchInput.value;
        const type = searchType.value;
        
        if (!query) {
            searchResultsList.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch(`/api/spotify/search?query=${encodeURIComponent(query)}&type=${type}`);
            const results = await response.json();
            
            searchResultsList.innerHTML = '';
            if (results.error) {
                searchResultsList.innerHTML = `<p style="color: red;">Error: ${results.error}</p>`;
                return;
            }

            results.forEach(item => {
                const isTrack = type === 'track';
                const name = isTrack ? item.name : item.name;
                const artistOrOwner = isTrack ? item.artist : item.owner;
                const image = isTrack ? item.album_art : (item.image || 'https://i.scdn.co/image/ab6761610000e5ebc58f9a2e6b6680a6b72a44d0');
                const uri = item.uri;

                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="${image}" class="search-result-image">
                    <div>
                        <h4 style="margin: 0; color: white;">${name}</h4>
                        <p style="margin: 0; color: #b3b3b3;">${artistOrOwner}</p>
                    </div>
                `;
                resultItem.addEventListener('click', () => {
                    sendControlCommand('play_track', uri);
                });
                searchResultsList.appendChild(resultItem);
            });
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const debouncedSearch = debounce(performSearch, 300); // 300ms delay
    searchInput.addEventListener('keyup', debouncedSearch);
    searchType.addEventListener('change', performSearch);
});