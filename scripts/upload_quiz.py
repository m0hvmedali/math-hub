
import os
import json
from supabase import create_client, Client

# Configuration from supabaseConfig.ts
SUPABASE_URL = 'https://pawwqdaiucbvohsgmtop.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk'

def upload_quiz():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Find Subject and Branch
    print("Fetching Subject and Branch...")
    
    # Fetch all subjects to filter manually since we don't know exact name
    subjects_response = supabase.table('subjects').select('*').execute()
    
    # Try finding Physics
    physics_subject = None
    for s in subjects_response.data:
        if 'الفيزياء' in s['name'] or 'Physics' in s['name'] or 'فيزيا' in s['name']:
            physics_subject = s
            break
            
    if not physics_subject:
        print("Error: 'Physics' or 'الفيزياء' subject not found.")
        print("Available subjects:", [s['name'] for s in subjects_response.data])
        return

    print(f"Found Subject: {physics_subject['name']} ({physics_subject['id']})")
    
    branches_response = supabase.table('branches').select('*').eq('subject_id', physics_subject['id']).execute()
    
    chapter4_branch = None
    for b in branches_response.data:
        if 'الفصل الرابع' in b['name'] or 'Chapter 4' in b['name']:
            chapter4_branch = b
            break
    
    if not chapter4_branch:
        print("Error: 'Chapter 4' branch not found. Creating it...")
        # Note: insert returns a response object, data attr has the result
        new_branch_resp = supabase.table('branches').insert({
            "subject_id": physics_subject['id'],
            "name": "الفصل الرابع"
        }).execute()
        
        if new_branch_resp.data:
            chapter4_branch = new_branch_resp.data[0]
        else:
            print("Failed to create branch.")
            return

    print(f"Using Branch: {chapter4_branch['name']} ({chapter4_branch['id']})")
    
    # 2. Upload Images and Create Content
    metadata_path = os.path.join("processed_quiz_images", "metadata.json")
    if not os.path.exists(metadata_path):
        print("Metadata not found. Run processing script first.")
        return
        
    with open(metadata_path, 'r') as f:
        questions = json.load(f)
        
    content_blocks = []
    
    print(f"Uploading {len(questions)} images...")
    
    for i, q in enumerate(questions):
        file_path = os.path.join("processed_quiz_images", q['file'])
        file_name = f"quiz_q_{i}_{os.path.basename(q['file'])}"
        
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to Supabase Storage 'lesson_files'
            # Note: upload returns a response
            supabase.storage.from_('lesson_files').upload(file_name, file_data, {"upsert": "true"})
            
            # Get Public URL (synchronous helper)
            public_url = supabase.storage.from_('lesson_files').get_public_url(file_name)
            
            # Create Block
            block = {
                "id": str(i), # Simple ID
                "type": "quiz",
                # The public_url method returns a string in newer SDKs, but sometimes an object. Checked SDK: it returns string.
                "content": public_url, 
                "question": f"Question {i+1}",
                "options": ["A", "B", "C", "D"], 
                "correctAnswer": 0 if q['has_answer'] else -1
            }
            content_blocks.append(block)
            print(f"Uploaded {file_name}")
            
        except Exception as e:
            print(f"Failed to upload {file_name}: {e}")

    # 3. Create Lesson
    lesson_name = "بنك الاسئله"
    
    lessons_resp = supabase.table('lessons').select('*').eq('branch_id', chapter4_branch['id']).eq('name', lesson_name).execute()
    
    if lessons_resp.data:
        print(f"Lesson '{lesson_name}' already exists. Updating...")
        lesson_id = lessons_resp.data[0]['id']
        supabase.table('lessons').update({
            "content": content_blocks
        }).eq('id', lesson_id).execute()
    else:
        print(f"Creating new lesson '{lesson_name}'...")
        supabase.table('lessons').insert({
            "branch_id": chapter4_branch['id'],
            "name": lesson_name,
            "content": content_blocks,
            "status": "not_started",
            "difficulty": "medium",
            "importance": "high",
            "understanding_level": "average",
            "review_stage": 0,
            "tags": ["quiz", "bank"]
        }).execute()
        
    print("Done! Quiz Bank created.")

if __name__ == "__main__":
    upload_quiz()
