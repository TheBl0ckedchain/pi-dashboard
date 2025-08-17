# ... (inside the SpotifyAPI class in spotify_api.py)

def get_playlists(self):
    try:
        playlists = self.sp.current_user_playlists(limit=50) # Get up to 50 playlists
        return [{'name': item['name'], 'uri': item['uri']} for item in playlists['items']]
    except Exception as e:
        print(f"Error fetching playlists: {e}")
        return []

def search_tracks(self, query):
    try:
        results = self.sp.search(q=query, type='track', limit=20) # Search for up to 20 tracks
        return [{'name': track['name'], 'artist': track['artists'][0]['name'], 'uri': track['uri'], 'album_art': track['album']['images'][0]['url']} for track in results['tracks']['items']]
    except Exception as e:
        print(f"Error searching for tracks: {e}")
        return []

def play_track(self, uri):
    try:
        self.sp.start_playback(uris=[uri])
    except Exception as e:
        print(f"Error playing track: {e}")
        self.authenticate()