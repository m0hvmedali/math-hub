import os
import json
from supabase import create_client, Client
import uuid

# Load config from the existing file if possible or use environment
# Since I've seen supabaseConfig.ts, I'll assume they are there
# But for a script, I'll check if they are in the environment or hardcoded as fallbacks

SUB_URL = "https://your-project.supabase.co" # Placeholder, will be replaced by actual from config
SUB_KEY = "your-anon-key"

# In a real scenario, I'd read these from an env file or the config ts
# For this environment, I'll try to find them

def get_supabase_client():
    # Attempt to read from supabaseConfig.ts
    try:
        with open('supabaseConfig.ts', 'r') as f:
            content = f.read()
            url = content.split("supabaseUrl = '")[1].split("'")[0]
            key = content.split("supabaseAnonKey = '")[1].split("'")[0]
            return create_client(url, key)
    except:
        return create_client(SUB_URL, SUB_KEY)

supabase: Client = get_supabase_client()

def upload_wisdom_items(file_path):
    print(f"Loading items from {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    batch_size = 50
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        print(f"Uploading batch {i//batch_size + 1}...")
        try:
            supabase.from_('wisdom_items').insert(batch).execute()
        except Exception as e:
            print(f"Error in batch: {e}")

def migrate_hadiths():
    print("Migrating existing Hadiths to unified wisdom_items...")
    # Fetch existing hadiths
    try:
        response = supabase.from_('hadiths').select('*').execute()
        hadiths = response.data
        
        wisdom_items = []
        for h in hadiths:
            item = {
                "text": h['text_ar'],
                "author": h['narrator_en'],
                "source": h['book_name_en'],
                "category": h['category'],
                "type": "hadith",
                "is_golden": False,
                "metadata": {
                    "text_en": h['text_en'],
                    "chapter_id": h['chapter_id'],
                    "chapter_name_en": h['chapter_name_en'],
                    "book_id": h['book_id']
                }
            }
            wisdom_items.append(item)
            
        # Batch insert
        batch_size = 50
        for i in range(0, len(wisdom_items), batch_size):
            batch = wisdom_items[i:i + batch_size]
            supabase.from_('wisdom_items').insert(batch).execute()
        print(f"Migrated {len(wisdom_items)} hadiths.")
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    # 1. Upload poetry first
    if os.path.exists('poetry_items.json'):
        upload_wisdom_items('poetry_items.json')
    
    # 2. Migrate hadiths
    migrate_hadiths()
