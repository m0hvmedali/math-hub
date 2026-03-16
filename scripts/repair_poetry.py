import json
import os

def repair_encoding():
    path = 'poetry_items.json'
    if not os.path.exists(path):
        print("File not found")
        return

    # Read as bytes first to be safe, or read as latin-1 if we know it's mojibake
    try:
        with open(path, 'rb') as f:
            raw = f.read()
        
        # The corruption happened because UTF-8 bytes were decoded as latin-1 and then saved.
        # So we decode as latin-1, then encode as latin-1 to get original bytes, then decode as utf-8.
        # Actually, simpler: the JSON was saved as UTF-8, but the CONTENT was already corrupted.
        # Let's try to fix a single string first.
        
        data = json.loads(raw.decode('utf-8'))
        for item in data:
            # Fix text
            try:
                # Mojibake fix: text -> encode(latin-1) -> decode(utf-8)
                item['text'] = item['text'].encode('latin-1').decode('utf-8')
            except:
                pass
            
            # Fix author if needed
            try:
                item['author'] = item['author'].encode('latin-1').decode('utf-8')
            except:
                pass

        with open('poetry_items_fixed.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Fixed {len(data)} items and saved to poetry_items_fixed.json")
        print("Sample fixed text:", data[0]['text'])
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    repair_encoding()
