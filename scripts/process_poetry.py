import pandas as pd
import json
import uuid
import os

def process_poetry():
    print("Reading poems...")
    # Use windows-1256 for this dataset as identified in inspection
    df = pd.read_csv('poetry_data/all_poems.csv', encoding='windows-1256')
    
    # Filter for quality: remove very short or very long poems for the overlay
    # This dataset has 'poem_text' column
    df = df[df['poem_text'].str.len() > 20]
    df = df[df['poem_text'].str.len() < 500]
    
    # Select a diverse but manageable sample first
    # Total rows is ~50k, let's take 5000 premium ones
    df_sample = df.sample(n=min(5000, len(df)), random_state=42)
    
    wisdom_items = []
    
    for _, row in df_sample.iterrows():
        item = {
            "id": str(uuid.uuid4()),
            "text": row['poem_text'].strip(),
            "author": row['poet_name'],
            "source": row['poet_cat'], # Often the era or country in this dataset
            "category": "Poetry",
            "type": "poetry",
            "is_golden": False,
            "metadata": {
                "poem_title": row['poem_title'],
                "poet_link": row['poet_link']
            }
        }
        wisdom_items.append(item)
    
    # Add some "Golden" markers (1%)
    golden_count = int(len(wisdom_items) * 0.01)
    for i in range(golden_count):
        wisdom_items[i]['is_golden'] = True

    print(f"Processed {len(wisdom_items)} poems. Saving to JSON...")
    with open('poetry_items.json', 'w', encoding='utf-8') as f:
        json.dump(wisdom_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    process_poetry()
