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
    const playlistActions = document.getElementById('playlist-actions');
    const playAllBtn = document.getElementById('play-all-btn');
    
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

            // Function to render a single category
            const renderCategory = (title, items) => {
                if (items.length > 0) {
                    const categoryTitle = document.createElement('h3');
                    categoryTitle.className = 'result-type-label';
                    categoryTitle.textContent = title;
                    searchResultsList.appendChild(categoryTitle);
                    
                    items.forEach(item => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        
                        let subtitle = '';
                        let image = item.image || '/static/default_album_art.png';

                        if (item.type === 'track') {
                            subtitle = `by ${item.artist}`;
                        } else if (item.type === 'playlist') {
                            subtitle = `by ${item.owner}`;
                        } else if (item.type === 'artist') {
                            subtitle = 'Artist';
                        }
                        
                        resultItem.innerHTML = `
                            <img src="${image}" class="search-result-image">
                            <div>
                                <h4 style="margin: 0; color: white;">${item.name}</h4>
                                <p style="margin: 0; color: #b3b3b3;">${subtitle}</p>
                            </div>
                        `;

                        if (item.type === 'track') {
                            resultItem.addEventListener('click', () => {
                                sendControlCommand('play', item.uri);
                            });
                        } else {
                            // This will now view the playlist/artist instead of playing it
                            resultItem.addEventListener('click', () => {
                                viewUriContent(item.uri);
                            });
                        }
                        searchResultsList.appendChild(resultItem);
                    });
                }
            };
            
            // Render categories in a specific order
            renderCategory('Artists', results.artists);
            renderCategory('Playlists', results.playlists);
            renderCategory('Songs', results.tracks);

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

    // Function to render a list of tracks (now correctly styled for queue and playlist)
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
            
            // Only show the current song as the first item if it exists, followed by the rest of the queue
            const allQueueItems = [];
            if (data.currently_playing_uri) {
                 const currentTrackResponse = await fetch('/api/spotify/current_track');
                 const currentTrackData = await currentTrackResponse.json();
                 if (currentTrackData.status !== "no_track") {
                    allQueueItems.push({
                        uri: currentTrackData.uri,
                        name: currentTrackData.track_name,
                        artist: currentTrackData.artist_name,
                        image: currentTrackData.album_art
                    });
                 }
            }
            allQueueItems.push(...data.queue);
            
            renderTrackList(queueList, allQueueItems, data.currently_playing_uri);

        } catch (error) {
            console.error('Error fetching queue:', error);
            queueList.innerHTML = `<p style="color: red;">Failed to fetch queue. Please check the server connection.</p>`;
        }
    }
    
    // New function to fetch and render playlist/artist content
    async function viewUriContent(uri) {
        // Switch to the playlist tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-tab="playlist-tab"]').classList.add('active');
        tabContents.forEach(content => content.style.display = 'none');
        document.getElementById('playlist-tab').style.display = 'flex';
        
        // Show play all button and attach listener
        playlistActions.style.display = 'block';
        playAllBtn.onclick = () => sendControlCommand('play', uri);

        // Fetch the tracks and render them
        playlistList.innerHTML = `<p style="text-align: center;">Loading tracks...</p>`;
        try {
            const response = await fetch(`/api/spotify/tracks_from_uri?uri=${encodeURIComponent(uri)}`);
            const tracks = await response.json();
            
            if (tracks.error) {
                playlistList.innerHTML = `<p style="color: red;">Error: ${tracks.error}</p>`;
                return;
            }
            
            const currentTrackResponse = await fetch('/api/spotify/current_track');
            const currentTrackData = await currentTrackResponse.json();
            
            renderTrackList(playlistList, tracks, currentTrackData.uri);
        } catch (error) {
            console.error('Error fetching playlist:', error);
            playlistList.innerHTML = `<p style="color: red;">Failed to fetch tracks. Please check the server connection.</p>`;
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
                nowPlayingTrackName.textContent = "No track playing";
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