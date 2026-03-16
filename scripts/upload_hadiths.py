import json
from supabase import create_client, Client
import time

# Configuration
URL = "https://pawwqdaiucbvohsgmtop.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk"

supabase: Client = create_client(URL, KEY)

def upload():
    with open("hadiths_to_upload.json", "r", encoding="utf-8") as f:
        hadiths = json.load(f)
    
    print(f"Uploading {len(hadiths)} hadiths in batches...")
    
    batch_size = 50
    for i in range(0, len(hadiths), batch_size):
        batch = hadiths[i:i+batch_size]
        try:
            response = supabase.table("hadiths").insert(batch).execute()
            print(f"  Uploaded batch {i // batch_size + 1}/{len(hadiths) // batch_size + 1}")
        except Exception as e:
            print(f"  Error uploading batch starting at {i}: {e}")
        time.sleep(0.5)

if __name__ == "__main__":
    upload()
