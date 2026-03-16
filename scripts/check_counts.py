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
supabase = create_client(URL, KEY)

def check_counts():
    try:
        res = supabase.from_('wisdom_items').select('*', count='exact').limit(1).execute()
        print(f"wisdom_items count: {res.count}")
        
        res = supabase.from_('hadiths').select('*', count='exact').limit(1).execute()
        print(f"hadiths count: {res.count}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_counts()
