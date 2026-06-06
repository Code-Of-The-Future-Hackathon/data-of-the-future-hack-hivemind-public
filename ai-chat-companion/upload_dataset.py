import requests
import sys
import os

# Usage: python upload_dataset.py "C:\path\to\easyshare_data.sav"

if len(sys.argv) < 2:
    print("Usage: python upload_dataset.py <path_to_file>")
    sys.exit(1)

file_path = sys.argv[1]
if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    sys.exit(1)

url = "http://localhost:8000/api/upload-dataset"
print(f"Uploading {os.path.basename(file_path)} to {url}...")

try:
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
        
    if response.status_code == 200:
        print("\nSuccess!")
        print(response.json())
    else:
        print(f"\nFailed with status {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"\nError: {e}")
