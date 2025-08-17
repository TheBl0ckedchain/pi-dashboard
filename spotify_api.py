import spotipy
from spotipy.oauth2 import SpotifyOAuth
import config

class SpotifyAPI:
    def __init__(self):
        self.scope = "user-read-playback-state user-modify-playback-state user-read-currently-playing"
        self.sp_oauth = SpotifyOAuth(
            client_id=config.SPOTIPY_CLIENT_ID,
            client_secret=config.SPOTIPY_CLIENT_SECRET,
            redirect_uri=config.SPOTIPY_REDIRECT_URI,
            scope=self.scope
        )
        self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)
        self.authenticate()

    def authenticate(self):
        try:
            self.sp.current_playback()
            print("Spotify authenticated successfully.")
        except spotipy.exceptions.SpotifyException:
            print("Authentication required. Please authorize in your browser.")
            self.sp_oauth.get_access_token(as_dict=False)
            self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)
            self.authenticate()

    def previous_track(self):
        try:
            self.sp.previous_track()
        except Exception as e:
            print(f"Error skipping to previous track: {e}")
            self.authenticate()

    def next_track(self):
        try:
            self.sp.next_track()
        except Exception as e:
            print(f"Error skipping to next track: {e}")
            self.authenticate()

    def toggle_playback(self):
        try:
            current_playback = self.sp.current_playback()
            if current_playback and current_playback['is_playing']:
                self.sp.pause_playback()
            else:
                self.sp.start_playback()
        except Exception as e:
            print(f"Error toggling playback: {e}")
            self.authenticate()

    def search_items(self, query, item_type):
        try:
            results = self.sp.search(q=query, type=item_type, limit=10)
            items = []
            if item_type == 'track':
                for track in results['tracks']['items']:
                    items.append({
                        'type': 'track',
                        'name': track['name'],
                        'artist': track['artists'][0]['name'],
                        'uri': track['uri'],
                        'image': track['album']['images'][0]['url'] if track['album']['images'] else ''
                    })
            elif item_type == 'artist':
                for artist in results['artists']['items']:
                    items.append({
                        'type': 'artist',
                        'name': artist['name'],
                        'uri': artist['uri'],
                        'image': artist['images'][0]['url'] if artist['images'] else ''
                    })
            elif item_type == 'playlist':
                for playlist in results['playlists']['items']:
                    items.append({
                        'type': 'playlist',
                        'name': playlist['name'],
                        'owner': playlist['owner']['display_name'],
                        'uri': playlist['uri'],
                        'image': playlist['images'][0]['url'] if playlist['images'] else ''
                    })
            return items
        except Exception as e:
            print(f"Error searching for {item_type}s: {e}")
            return []

    def play_uri(self, uri):
        try:
            if "track" in uri:
                self.sp.start_playback(uris=[uri])
            else:
                self.sp.start_playback(context_uri=uri)
        except Exception as e:
            print(f"Error playing URI: {e}")
            self.authenticate()