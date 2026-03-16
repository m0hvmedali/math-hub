import os
import json
from supabase import create_client, Client
import uuid

# Load config from supabaseConfig.ts
def get_supabase_config():
    try:
        # Check current dir or parent dir
        paths = ['supabaseConfig.ts', '../supabaseConfig.ts']
        for path in paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    url = content.split("SUPABASE_URL = '")[1].split("'")[0]
                    key = content.split("SUPABASE_ANON_KEY = '")[1].split("'")[0]
                    return url, key
    except Exception as e:
        print(f"Error reading config: {e}")
    
    # Fallback to environment variables
    return os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY")

URL, KEY = get_supabase_config()
if not URL or not KEY:
    print("CRITICAL: Supabase URL or Key not found!")
    exit(1)

supabase: Client = create_client(URL, KEY)

def upload_wisdom_items(file_path):
    print(f"Loading items from {file_path}...")
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    # Format conversion if it's hadiths_to_upload.json
    if 'hadiths' in file_path:
        formatted_items = []
        for h in items:
            item = {
                "text": h.get('text_ar'),
                "author": h.get('narrator_en', 'Unknown'),
                "source": h.get('book_name_en', 'Unknown'),
                "category": h.get('category', 'General'),
                "type": "hadith",
                "is_golden": False,
                "metadata": {
                    "text_en": h.get('text_en'),
                    "chapter_name_en": h.get('chapter_name_en'),
                    "book_name_ar": h.get('book_name_ar')
                }
            }
            formatted_items.append(item)
        items = formatted_items

    batch_size = 50
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        print(f"Uploading batch {i//batch_size + 1} ({len(batch)} items)...")
        try:
            supabase.from_('wisdom_items').insert(batch).execute()
        except Exception as e:
            print(f"Error in batch: {e}")

if __name__ == "__main__":
    # Ensure we are in the root if called from scripts/
    if os.path.basename(os.getcwd()) == 'scripts':
        os.chdir('..')

    # 1. Upload poetry
    upload_wisdom_items('poetry_items.json')
    
    # 2. Upload hadiths from file
    upload_wisdom_items('hadiths_to_upload.json')
    
    print("Done!")

