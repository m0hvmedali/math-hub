
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pawwqdaiucbvohsgmtop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    const { data: lesson, error } = await supabase
        .from('lessons')
        .select('*, branch:branches(*, subject:subjects(*))')
        .eq('id', '7f99e7b0-d5c9-4d23-9577-fcd112cc4fd5')
        .single();

    if (error) {
        console.error('Error verifying lesson:', error);
        return;
    }

    console.log('Lesson Name:', lesson.name);
    console.log('Branch Name:', lesson.branch.name);
    console.log('Subject Name:', lesson.branch.subject.name);
    console.log('Content Blocks Count:', lesson.content.length);
    console.log('First Block Content:', lesson.content[0].content.substring(0, 100) + '...');
}

verify();
