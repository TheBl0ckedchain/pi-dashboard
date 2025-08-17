# main.py

# main.py (add this at the top)

import os
from tkinter import Label
from kivy.app import App
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.config import Config
from kivy.uix.boxlayout import BoxLayout
from kivy.clock import Clock
from kivy.uix.image import AsyncImage
from icloud_api import IcloudAPI
import config
import time
import threading # We will use this later for the Flask server

from spotify_api import SpotifyAPI

# Set window to be fullscreen
Config.set('graphics', 'fullscreen', 'auto')

# If you have a touchscreen, you might need to specify the provider
# Config.set('input', 'hid_touch', 'mtdev, provider=hidinput')

# Load the Kivy language file for UI design
kv_file = Builder.load_string("""
# ... inside your .kv string ...

# To-Do List Panel
BoxLayout:
    id: todo_panel
    size_hint: 1, 0.7
    orientation: 'vertical'
    padding: 10
    canvas.before:
        Color:
            rgba: 0.2, 0.2, 0.2, 0.5
        Rectangle:
            size: self.size
            pos: self.pos

    Label:
        text: "Reminders"
        font_size: '24sp'
        size_hint_y: None
        height: '48dp'

    ScrollView:
        BoxLayout:
            id: reminders_list
            orientation: 'vertical'
            size_hint_y: None
            height: self.minimum_height
            spacing: 5
            padding: 5
""")

class MainLayout(BoxLayout):
    def __init__(self, **kwargs):
        super(MainLayout, self).__init__(**kwargs)
        self.spotify_api = SpotifyAPI()
        self.icloud_api = IcloudAPI(config.APPLE_ID, config.APPLE_PASSWORD)
    
    def update_time(self, *args):
        self.ids.current_time.text = time.strftime('%I:%M:%S %p')

    def update_spotify_ui(self, *args):
        try:
            current_track = self.spotify_api.sp.current_playback()
            if current_track and current_track['item']:
                track_name = current_track['item']['name']
                artist_name = current_track['item']['artists'][0]['name']
                album_art_url = current_track['item']['album']['images'][0]['url']
                self.ids.track_info.text = f"{track_name}\nby {artist_name}"
                self.ids.album_art.source = album_art_url
            else:
                self.ids.track_info.text = "No track playing"
                self.ids.album_art.source = 'https://i.scdn.co/image/ab6761610000e5ebc58f9a2e6b6680a6b72a44d0' # Placeholder

        except Exception as e:
            print(f"Error updating Spotify UI: {e}")
            # Re-authenticate if token expires
            self.spotify_api.authenticate()
            
    def update_reminders_ui(self, *args):
        reminders = self.icloud_api.get_reminders()
        reminders_widget = self.ids.reminders_list
        reminders_widget.clear_widgets()

        if not reminders:
            reminders_widget.add_widget(Label(text="No reminders.", size_hint_y=None, height=40))
            return

        for reminder_text in reminders:
            reminders_widget.add_widget(Label(text=f"• {reminder_text}", size_hint_y=None, height=40, halign='left', text_size=(self.width * 0.3 - 20, None)))

class ControlPanelApp(App):
    def build(self):
        main_layout = MainLayout()
        Clock.schedule_interval(main_layout.update_time, 1)
        Clock.schedule_interval(main_layout.update_spotify_ui, 5)
        Clock.schedule_interval(main_layout.update_reminders_ui, 600) # Update reminders every 10 minutes
        return main_layout

if __name__ == '__main__':
    ControlPanelApp().run()