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
            
            if self.api.requires_2sv:
                print("Two-step verification required.")
                trusted_devices = self.api.trusted_devices
                print("Trusted devices:")
                for i, device in enumerate(trusted_devices):
                    print(f"  {i}: {device.get('deviceName', 'Unknown device')}")
                device_index = int(input("Enter the index of your trusted device: "))
                device = trusted_devices[device_index]
                result = self.api.send_verification_code(device)
                if not result:
                    print("Failed to send verification code.")
                    return
                code = input("Enter the verification code: ")
                result = self.api.validate_verification_code(device, code)
                if not result:
                    print("Invalid verification code.")
                    return
                print("Verification code verified.")

            print("iCloud authenticated successfully.")

        except Exception as e:
            print(f"iCloud authentication failed: {e}")
            self.api = None

    def get_reminders(self, list_name=None):
        if not self.api:
            print("iCloud API not authenticated.")
            return []

        try:
            reminders_list = self.api.reminders.lists
            reminders_to_display = []
            
            if list_name:
                # Find the specified list
                reminders_list = [reminders_list[list_name]]
            else:
                # Use all lists
                reminders_list = reminders_list.values()

            for r_list in reminders_list:
                for reminder in r_list:
                    if not reminder['isCompleted']:
                        reminders_to_display.append(reminder['title'])
            
            return reminders_to_display

        except Exception as e:
            print(f"Error fetching reminders: {e}")
            return []