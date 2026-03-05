
import fitz
import json

pdf_path = "physics_revision.pdf"

def analyze_detailed():
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    print(f"Opened {pdf_path}, Pages: {len(doc)}")
    
    # Analyze Page 1
    page = doc[0]
    text = page.get_text()
    print("--- Page 1 Text Sample (First 200 chars) ---")
    print(text[:200] if text else "No text found (Scanned PDF?)")
    print("--------------------------------------------")

    # Analyze Colors
    print("--- Page 1 Drawings Colors ---")
    paths = page.get_drawings()
    colors_found = {}
    
    for path in paths:
        fill = path.get("fill")
        if fill:
            # Round to 2 decimal places for grouping
            color_key = tuple(round(c, 2) for c in fill)
            colors_found[color_key] = colors_found.get(color_key, 0) + 1

    for color, count in colors_found.items():
        print(f"Color {color}: {count} occurrences")
        
    if not colors_found:
        print("No filled drawings found on page 1.")

if __name__ == "__main__":
    analyze_detailed()
