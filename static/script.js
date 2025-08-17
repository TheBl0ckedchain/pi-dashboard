document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('current-time');
    const albumArt = document.getElementById('album-art');
    const trackName = document.getElementById('track-name');
    const artistName = document.getElementById('artist-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // New DOM elements for Playlist/Queue/Search
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const searchResultsList = document.getElementById('search-results-list');
    
    // Elements for "Now Playing" track in the playlist tab
    const nowPlayingAlbumArt = document.getElementById('now-playing-album-art');
    const nowPlayingTrackName = document.getElementById('now-playing-track-name');
    const nowPlayingArtistName = document.getElementById('now-playing-artist-name');
    
    const playlistList = document.getElementById('playlist-list');
    const queueList = document.getElementById('queue-list');
    
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
    
    // Clock functionality
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
    }, 1000);
    
    // Function to render a list of tracks (updated to use new styles)
    function renderTrackList(element, tracks, nowPlayingUri) {
        element.innerHTML = '';
        tracks.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-list-item';
            
            // Highlight the currently playing track
            if (track.uri === nowPlayingUri) {
                trackItem.classList.add('now-playing-highlight');
            }
            
            trackItem.innerHTML = `
                <img src="${track.image}" class="track-list-image">
                <div>
                    <h4 style="margin: 0; color: white;">${track.name}</h4>
                    <p style="margin: 0; color: #b3b3b3;">${track.artist}</p>
                </div>
            `;
            trackItem.addEventListener('click', () => {
                sendControlCommand('play', track.uri);
            });
            element.appendChild(trackItem);
        });
    }

    // New function to fetch and render the queue
    async function updateQueue() {
        try {
            const response = await fetch('/api/spotify/queue');
            const data = await response.json();
            
            if (data.error) {
                queueList.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
                return;
            }
            
            renderTrackList(queueList, data.queue, data.currently_playing_uri);
        } catch (error) {
            console.error('Error fetching queue:', error);
            queueList.innerHTML = `<p style="color: red;">Failed to fetch queue. Please check the server connection.</p>`;
        }
    }
    
    // Placeholder function for fetching playlist data
    // You will need to implement a backend endpoint for this
    async function updatePlaylist() {
        try {
            // For now, this will be empty until you add the backend endpoint
            playlistList.innerHTML = `<p style="text-align: center;">Playlist functionality is not yet implemented.</p>`;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            playlistList.innerHTML = `<p style="color: red;">Failed to fetch playlist. Please check the server connection.</p>`;
        }
    }

    async function updateSpotifyInfo() {
        try {
            const response = await fetch('/api/spotify/current_track');
            const data = await response.json();
            
            if (data.status === "no_track") {
                trackName.textContent = "No track playing";
                artistName.textContent = "";
                albumArt.src = "";
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    
                // Update now playing info in playlist tab
                nowPlayingTrackName.textContent = "";
                nowPlayingArtistName.textContent = "";
                nowPlayingAlbumArt.src = "";
            } else {
                trackName.textContent = data.track_name;
                artistName.textContent = data.artist_name;
                albumArt.src = data.album_art;
                playPauseBtn.innerHTML = data.is_playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    
                // Update now playing info in playlist tab
                nowPlayingTrackName.textContent = data.track_name;
                nowPlayingArtistName.textContent = data.artist_name;
                nowPlayingAlbumArt.src = data.album_art;
            }
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
        }
        
        // Also update the queue whenever the current track info is updated
        updateQueue();
        updatePlaylist();
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