import os
import json
from supabase import create_client, Client

def get_supabase_config():
    paths = ['supabaseConfig.ts', '../supabaseConfig.ts']
    for path in paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                url = content.split("SUPABASE_URL = '")[1].split("'")[0]
                key = content.split("SUPABASE_ANON_KEY = '")[1].split("'")[0]
                return url, key
    return None, None

URL, KEY = get_supabase_config()
supabase: Client = create_client(URL, KEY)

def cleanup_and_reupload():
    # 1. Delete all poetry items
    print("Deleting old poetry items...")
    try:
        supabase.from_('wisdom_items').delete().eq('type', 'poetry').execute()
        print("Old poetry items deleted.")
    except Exception as e:
        print(f"Error deleting: {e}")

    # 2. Upload fixed items
    print("Uploading fixed poetry items...")
    file_path = 'poetry_items_fixed.json'
    if not os.path.exists(file_path):
        print("Fixed file not found!")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    batch_size = 50
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        print(f"Uploading batch {i//batch_size + 1}...")
        try:
            supabase.from_('wisdom_items').insert(batch).execute()
        except Exception as e:
            print(f"Error in batch {i//batch_size + 1}: {e}")

if __name__ == "__main__":
    cleanup_and_reupload()
