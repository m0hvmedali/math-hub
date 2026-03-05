
import fitz
import os
import json
import numpy as np
from PIL import Image

pdf_path = "physics_revision.pdf"
output_dir = "processed_quiz_images"
os.makedirs(output_dir, exist_ok=True)

def is_yellow(pixel):
    r, g, b = pixel
    # Yellow is high Red, high Green, low Blue
    return r > 200 and g > 200 and b < 100

def process_pdf():
    doc = fitz.open(pdf_path)
    question_count = 0
    
    print(f"Processing {len(doc)} pages...")

    questions_metadata = []

    for page_num, page in enumerate(doc):
        print(f"Processing Page {page_num + 1}")
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Convert to numpy array for projection analysis
        # Grayscale for structure detection
        gray = img.convert("L")
        arr = np.array(gray)
        
        # Invert: Text (dark) becomes high value (bright), background (light) becomes low
        # Actually in grayscale 0 is black, 255 is white. Text is dark (~0), paper is white (~255).
        # We want to find rows with NO text (all white/255).
        # So we look for rows where min value is high or average is high.
        
        # Invert so text is signal
        inverted = 255 - arr
        # Horizontal projection: sum of pixels in each row
        proj = np.sum(inverted, axis=1)
        
        # Normalize projection
        max_val = np.max(proj)
        if max_val == 0: continue # Blank page
        
        # Find gaps
        # A gap is a sequence of rows where projection is low (near 0)
        # Threshold: purely white line might have noise, so let's say < 1% of max content?
        # Or just look for rows where all pixels are > 250 (in original) => < 5 (in inverted)
        
        # Simple approach: Row is "empty" if sum(inverted) < threshold
        # Threshold: width * 5 (allow some noise)
        threshold = pix.width * 5
        
        is_empty = proj < threshold
        
        # specific logic to find split points
        # we want cuts in the middle of large empty gaps
        
        splits = []
        in_gap = False
        gap_start = 0
        
        # Always start with 0
        splits.append(0)
        
        min_gap_height = 30 # Minimum gap to consider a split (pixels)
        
        for y, empty in enumerate(is_empty):
            if empty and not in_gap:
                in_gap = True
                gap_start = y
            elif not empty and in_gap:
                in_gap = False
                gap_len = y - gap_start
                if gap_len > min_gap_height:
                    # Found a valid gap, add split point in the middle
                    split_point = gap_start + (gap_len // 2)
                    splits.append(split_point)
        
        # Add end of page
        splits.append(pix.height)
        
        # Now save segments
        # Filter out small segments (headers/footers)
        min_segment_height = 50 
        
        for i in range(len(splits) - 1):
            y1 = splits[i]
            y2 = splits[i+1]
            h = y2 - y1
            
            if h < min_segment_height:
                continue
            
            # Additional check: Does this segment contain text?
            # Check projection sum for this segment
            segment_proj = np.sum(proj[y1:y2])
            if segment_proj < (pix.width * 10): # Mostly empty
                continue
                
            # Crop
            crop = img.crop((0, y1, pix.width, y2))
            
            # Check for yellow highlight in this crop
            # Resize for faster check? No need for small crops
            # Scan a comprehensive sample or full image
            # We want to know WHICH option.
            # Usually options are A B C D.
            # If we detect yellow, we can try to find its centroid.
            # But for now, just "has_answer" boolean.
            
            has_yellow = False
            # Convert crop to numpy keys to check color
            crop_arr = np.array(crop)
            # Check mask
            # R>200, G>200, B<100
            yellow_mask = (crop_arr[:,:,0] > 200) & (crop_arr[:,:,1] > 200) & (crop_arr[:,:,2] < 100)
            if np.any(yellow_mask):
                has_yellow = True
                
            q_filename = f"q_{page_num+1}_{i}.jpg"
            crop.save(os.path.join(output_dir, q_filename))
            question_count += 1
            
            questions_metadata.append({
                "file": q_filename,
                "has_answer": has_yellow,
                "page": page_num + 1
            })

    print(f"Extracted {question_count} questions.")
    
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(questions_metadata, f, indent=2)

if __name__ == "__main__":
    process_pdf()
