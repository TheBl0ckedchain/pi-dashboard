import os
from kivy.app import App
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.config import Config
from kivy.uix.boxlayout import BoxLayout
from kivy.clock import Clock
from kivy.uix.image import AsyncImage
from kivy.uix.label import Label
from kivy.uix.scrollview import ScrollView
import time
import threading

from spotify_api import SpotifyAPI
import config

Config.set('graphics', 'fullscreen', 'auto')

kv_file = Builder.load_string("""
<MainLayout>:
    orientation: 'horizontal'
    canvas.before:
        Color:
            rgba: 0.1, 0.1, 0.1, 0.8
        Rectangle:
            size: self.size
            pos: self.pos
    
    BoxLayout:
        id: spotify_panel
        size_hint: 0.7, 1
        orientation: 'vertical'
        padding: 20
        spacing: 20
        canvas.before:
            Color:
                rgba: 0.2, 0.2, 0.2, 0.5
            Rectangle:
                size: self.size
                pos: self.pos
        
        AsyncImage:
            id: album_art
            source: 'https://i.scdn.co/image/ab6761610000e5ebc58f9a2e6b6680a6b72a44d0'
            size_hint: 1, 0.8
            allow_stretch: True
            keep_ratio: True
        
        Label:
            id: track_info
            text: "No track playing"
            font_size: '24sp'
            halign: 'center'
            valign: 'top'
            text_size: self.size
        
        BoxLayout:
            size_hint_y: 0.2
            spacing: 20
            
            Button:
                text: 'Previous'
                on_release: app.root.spotify_api.previous_track()
            
            Button:
                text: 'Play/Pause'
                on_release: app.root.spotify_api.toggle_playback()
            
            Button:
                text: 'Next'
                on_release: app.root.spotify_api.next_track()

    BoxLayout:
        id: right_panels
        size_hint: 0.3, 1
        orientation: 'vertical'
        padding: 20
        spacing: 20

        BoxLayout:
            id: clock_panel
            size_hint: 1, 0.3
            orientation: 'vertical'
            padding: 10
            canvas.before:
                Color:
                    rgba: 0.2, 0.2, 0.2, 0.5
                Rectangle:
                    size: self.size
                    pos: self.pos

            Label:
                id: current_time
                text: ""
                font_size: '64sp'
                bold: True
                halign: 'center'
                valign: 'middle'

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
                text: "Future Features"
                font_size: '24sp'
                size_hint_y: None
                height: '48dp'
            
            Label:
                text: "This panel is ready for new features!"
                halign: 'center'
                valign: 'middle'
""")

class MainLayout(BoxLayout):
    def __init__(self, **kwargs):
        super(MainLayout, self).__init__(**kwargs)
        self.spotify_api = SpotifyAPI()

    def on_start(self):
        Clock.schedule_interval(self.update_time, 1)
        Clock.schedule_interval(self.update_spotify_ui, 5)

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
                self.ids.album_art.source = 'https://i.scdn.co/image/ab6761610000e5ebc58f9a2e6b6680a6b72a44d0'

        except Exception as e:
            print(f"Error updating Spotify UI: {e}")
            self.spotify_api.authenticate()

class ControlPanelApp(App):
    def build(self):
        return MainLayout()

    def on_start(self):
        self.root.on_start()

if __name__ == '__main__':
    ControlPanelApp().run()