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
        # This will open a browser window for you to log in.
        # It's a one-time process. The token will be cached.
        try:
            self.sp.current_playback()
            print("Spotify authenticated successfully.")
        except spotipy.exceptions.SpotifyException:
            print("Authentication required. Please authorize in your browser.")
            self.sp_oauth.get_access_token(as_dict=False)
            self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)
            self.authenticate() # Try again with new token