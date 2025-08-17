import flask
from flask import Flask, send_from_directory, jsonify, request
import time
import threading
import json
import os
import atexit

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
            is_playing = current_track.get('is_playing', False)
            return jsonify({
                "track_name": track_name,
                "artist_name": artist_name,
                "album_art": album_art_url,
                "is_playing": is_playing,
                "uri": current_track['item']['uri']
            })
        else:
            return jsonify({"status": "no_track"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/control', methods=['POST'])
def control_spotify():
    action = request.json.get('action')
    try:
        if action == 'next':
            spotify_api.next_track()
        elif action == 'previous':
            spotify_api.previous_track()
        elif action == 'toggle_playback':
            spotify_api.toggle_playback()
        elif action == 'play':
            uri = request.json.get('uri')
            spotify_api.play_uri(uri)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/search_combined', methods=['GET'])
def search_combined():
    query = request.args.get('query')
    if not query:
        return jsonify({"artists": [], "playlists": [], "tracks": []})
    try:
        track_results = spotify_api.search_items(query, item_type='track')
        artist_results = spotify_api.search_items(query, item_type='artist')
        playlist_results = spotify_api.search_items(query, item_type='playlist')
        
        return jsonify({
            "artists": artist_results,
            "playlists": playlist_results,
            "tracks": track_results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/queue')
def get_queue():
    try:
        queue_data = spotify_api.get_queue()
        return jsonify(queue_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/tracks_from_uri')
def get_tracks_from_uri():
    uri = request.args.get('uri')
    if not uri:
        return jsonify({"error": "No URI provided"}), 400
    try:
        tracks = spotify_api.get_tracks_from_uri(uri)
        return jsonify(tracks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)