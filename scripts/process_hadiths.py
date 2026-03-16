import requests
import json
import time

# Configuration
BOOKS = ["bukhari", "muslim", "tirmidhi"]
BASE_URL = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_chapter/the_9_books"
# Limit for demo/testing purpose: first 10 chapters per book
MAX_CHAPTERS = 5

# Simple categorization logic
KEYWORDS = {
    "Knowledge": ["علم", "تعلم", "عالم", "كتاب"],
    "Discipline": ["صبر", "استقامة", "قوام", "جلد"],
    "Focus": ["تركيز", "إقبال", "قلب", "نية"],
    "Life": ["دنيا", "حياة", "رزق", "عمل"],
    "Patience": ["صبر", "احتساب", "بلاء"],
    "Achievement": ["أجر", "ثواب", "جنة", "فوز"]
}

def get_category(text):
    for cat, keys in KEYWORDS.items():
        if any(key in text for key in keys):
            return cat
    return "General"

def process():
    processed_hadiths = []
    
    for book in BOOKS:
        print(f"Processing book: {book}...")
        for chapter_id in range(1, MAX_CHAPTERS + 1):
            url = f"{BASE_URL}/{book}/{chapter_id}.json"
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    print(f"  Finished chapters for {book} or error at {chapter_id}")
                    break
                
                data = response.json()
                chapter_ar = data.get("chapter", {}).get("arabic", "")
                chapter_en = data.get("chapter", {}).get("english", "")
                book_ar = data.get("metadata", {}).get("arabic", {}).get("title", "")
                book_en = data.get("metadata", {}).get("english", {}).get("title", "")
                
                for h in data.get("hadiths", []):
                    processed_hadiths.append({
                        "external_id": h.get("id"),
                        "book_id": h.get("bookId"),
                        "chapter_id": h.get("chapterId"),
                        "text_ar": h.get("arabic"),
                        "text_en": h.get("english", {}).get("text"),
                        "narrator_en": h.get("english", {}).get("narrator"),
                        "book_name_ar": book_ar,
                        "book_name_en": book_en,
                        "chapter_name_ar": chapter_ar,
                        "chapter_name_en": chapter_en,
                        "category": get_category(h.get("arabic", ""))
                    })
                
                print(f"  Processed chapter {chapter_id} ({len(data.get('hadiths', []))} hadiths)")
                time.sleep(0.1) # Be nice to GitHub
            except Exception as e:
                print(f"  Error processing {url}: {e}")
                
    # Save to a local JSON for upload
    with open("hadiths_to_upload.json", "w", encoding="utf-8") as f:
        json.dump(processed_hadiths, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully processed {len(processed_hadiths)} hadiths.")

if __name__ == "__main__":
    process()
