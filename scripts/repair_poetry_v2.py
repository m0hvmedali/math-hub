import json
import os

def try_repair(s):
    if not s: return s
    # Common Mojibake: UTF-8 bytes read as cp1252 or latin-1
    encodings = ['cp1252', 'latin-1', 'windows-1256']
    for enc in encodings:
        try:
            # string -> encode as encoding -> decode as utf-8
            repaired = s.encode(enc).decode('utf-8')
            if any('\u0600' <= c <= '\u06FF' for c in repaired): # Check for Arabic chars
                return repaired
        except:
            continue
    return s

def repair_encoding():
    path = 'poetry_items.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    for item in data:
        old_text = item['text']
        item['text'] = try_repair(old_text)
        if old_text != item['text']:
            fixed_count += 1
        item['author'] = try_repair(item.get('author', ''))

    with open('poetry_items_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Fixed {fixed_count} items")
    print("Sample fixed text:", data[0]['text'])

if __name__ == "__main__":
    repair_encoding()
