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

def list_tables():
    # We can't easily list tables via RPC if not allowed, but we can try common ones
    tables = ['wisdom_items', 'hadiths', 'user_wisdom_history', 'user_wisdom_progress', 'quotes']
    for t in tables:
        try:
            res = supabase.from_(t).select('*', count='exact').limit(1).execute()
            print(f"Table {t}: {res.count} rows")
        except:
            print(f"Table {t}: Not found or error")

if __name__ == "__main__":
    list_tables()
