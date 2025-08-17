# spotify_api.py

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