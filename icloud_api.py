# icloud_api.py

import os
import getpass
from pyicloud import PyiCloudService

class IcloudAPI:
    def __init__(self, apple_id, password):
        self.api = None
        self.apple_id = apple_id
        self.password = password
        self.authenticate()

    def authenticate(self):
        print("Attempting to connect to iCloud...")
        try:
            self.api = PyiCloudService(self.apple_id, self.password)

            if self.api.requires_2fa:
                print("Two-factor authentication required.")
                code = input("Enter the 2FA code you received: ")
                result = self.api.validate_2fa_code(code)
                if not result:
                    print("Invalid 2FA code.")
                    return
                print("2FA code verified.")

            print("iCloud authenticated successfully.")

        except Exception as e:
            print(f"iCloud authentication failed: {e}")
            self.api = None

    def get_reminders(self, list_name=None):
        if not self.api:
            print("iCloud API not authenticated.")
            return []

        try:
            reminders_lists = self.api.reminders.lists
            print(f"Found the following reminder lists: {list(reminders_lists.keys())}")
            reminders_to_display = []
            
            # If a specific list name is provided, check if it exists and fetch reminders from it
            if list_name and list_name in reminders_lists:
                print(f"Fetching reminders from list: '{list_name}'")
                reminders_to_display.extend([r['title'] for r in reminders_lists[list_name] if not r['isCompleted']])
            else:
                # Otherwise, fetch from all lists
                print("Fetching reminders from all available lists.")
                for r_list in reminders_lists.values():
                    reminders_to_display.extend([r['title'] for r in r_list if not r['isCompleted']])
            
            print(f"Found {len(reminders_to_display)} uncompleted reminders.")
            return reminders_to_display

        except Exception as e:
            print(f"Error fetching reminders: {e}")
            return []