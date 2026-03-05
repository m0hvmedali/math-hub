
import os
import json
import time
from supabase import create_client, Client

# Configuration
SUPABASE_URL = 'https://pawwqdaiucbvohsgmtop.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk'

# Answer Key Mapping (Based on User Table)
# أ=0, ب=1, ج=2, د=3
ANSWERS = {
    259: 2, 260: 0, 261: 0, 262: 1, 263: 0, 264: 0, 265: 2, 266: 0, 
    267: 0, 268: 2, 269: 3, 270: 2, 271: 2, 272: 3, 273: 2, 274: 1, 
    275: 0, 276: 2, 277: 2, 278: 3, 279: 3, 280: 0, 281: 2, 282: 2, 
    283: 0, 284: 1, 285: 2, 286: 0, 287: 1, 288: 0, 289: 2, 290: 0, 
    291: 2, 292: 3, 293: 2, 294: 1, 295: 2, 296: 0, 297: 1, 298: 0, 
    299: 1, 300: 0, 301: 2, 302: 0, 303: 2, 304: 1, 305: 2, 306: 0, 
    307: 1, 308: 3, 309: 2, 310: 2, 311: 2, 312: 2, 313: 0, 314: 3, 
    315: 1, 316: 0, 317: 2, 318: 3, 319: 2
}

def upload_batch_quiz():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Find/Create Subject & Branch
    print("Finding Subject: Physics...")
    subjects = supabase.table('subjects').select('*').execute().data
    print(f"Available Subjects: {[s['name'] for s in subjects]}")
    
    physics = next((s for s in subjects if 'الفيزياء' in s['name'] or 'Physics' in s['name'] or 'فيزيا' in s['name']), None)
    
    if not physics:
        print("Physics not found!")
        return
        
    print(f"Physics ID: {physics['id']}")
    
    print("Finding Branch: Chapter 4...")
    branches = supabase.table('branches').select('*').eq('subject_id', physics['id']).execute().data
    chapter4 = next((b for b in branches if 'الفصل الرابع' in b['name']), None)
    
    if not chapter4:
        print("Chapter 4 not found, creating...")
        chapter4 = supabase.table('branches').insert({
            "subject_id": physics['id'],
            "name": "الفصل الرابع"
        }).execute().data[0]
        
    print(f"Branch ID: {chapter4['id']}")
    
    # 2. Process Images
    media_dir = "d:\\Download\\math-hub\\media"
    files = sorted([f for f in os.listdir(media_dir) if f.startswith('question_') and f.endswith('.png')])
    
    content_blocks = []
    
    print(f"Found {len(files)} images to upload.")
    
    for filename in files:
        # Extract question number
        try:
            q_num = int(filename.split('_')[1].split('.')[0])
        except:
            print(f"Skipping invalid filename: {filename}")
            continue
            
        file_path = os.path.join(media_dir, filename)
        
        # Upload
        print(f"Uploading {filename}...")
        with open(file_path, 'rb') as f:
            file_data = f.read()
            
        storage_path = f"batch_upload/{filename}"
        supabase.storage.from_('lesson_files').upload(storage_path, file_data, {"upsert": "true"})
        
        public_url = supabase.storage.from_('lesson_files').get_public_url(storage_path)
        
        # Create Block
        correct_answer = ANSWERS.get(q_num, -1)
        
        block = {
            "id": f"q_{q_num}",
            "type": "quiz",
            "content": public_url,
            "question": f"Question {q_num}",
            "options": ["أ (A)", "ب (B)", "ج (C)", "د (D)"],
            "correctAnswer": correct_answer,
            "answerExplanation": f"Correct Answer: {['A','B','C','D'][correct_answer]}" if correct_answer != -1 else ""
        }
        content_blocks.append(block)
        
    # 3. Create/Update Lesson
    lesson_name = "اسئله الثانويه العامه"
    print(f"Updating Lesson: {lesson_name}...")
    
    existing_lessons = supabase.table('lessons').select('*').eq('branch_id', chapter4['id']).eq('name', lesson_name).execute().data
    
    if existing_lessons:
        lesson_id = existing_lessons[0]['id']
        supabase.table('lessons').update({
            "content": content_blocks
        }).eq('id', lesson_id).execute()
        print("Lesson updated successfully.")
    else:
        supabase.table('lessons').insert({
            "branch_id": chapter4['id'],
            "name": lesson_name,
            "content": content_blocks,
            "status": "not_started",
            "difficulty": "hard",
            "importance": "high",
            "tags": ["exam", "questions"]
        }).execute()
        print("New lesson created successfully.")

if __name__ == "__main__":
    upload_batch_quiz()
