import flask
from flask import Flask, send_from_directory, jsonify
import time
import threading
import json
import os
import atexit

# You'll need to install Flask
# pip3 install Flask

from spotify_api import SpotifyAPI
import config

app = Flask(__name__, static_url_path='')
spotify_api = SpotifyAPI()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

@app.route('/api/spotify/current_track')
def get_current_track():
    try:
        current_track = spotify_api.sp.current_playback()
        if current_track and current_track['item']:
            track_name = current_track['item']['name']
            artist_name = current_track['item']['artists'][0]['name']
            album_art_url = current_track['item']['album']['images'][0]['url']
            return jsonify({
                "track_name": track_name,
                "artist_name": artist_name,
                "album_art": album_art_url,
                "is_playing": current_track['is_playing']
            })
        else:
            return jsonify({"status": "no_track"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/control', methods=['POST'])
def control_spotify():
    action = flask.request.json.get('action')
    try:
        if action == 'next':
            spotify_api.next_track()
        elif action == 'previous':
            spotify_api.previous_track()
        elif action == 'toggle_playback':
            spotify_api.toggle_playback()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start the Flask web server
    app.run(host='0.0.0.0', port=5000)