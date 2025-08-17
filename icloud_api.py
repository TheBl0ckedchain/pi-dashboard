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
            reminders_to_display = []

            if list_name and list_name in reminders_lists:
                reminders_to_display.extend([r['title'] for r in reminders_lists[list_name] if not r['isCompleted']])
            else:
                for r_list in reminders_lists.values():
                    reminders_to_display.extend([r['title'] for r in r_list if not r['isCompleted']])

            return reminders_to_display

        except Exception as e:
            print(f"Error fetching reminders: {e}")
            return []