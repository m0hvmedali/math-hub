import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pawwqdaiucbvohsgmtop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkIds() {
    const { data: subjects, error: sError } = await supabase.from('subjects').select('id, name');
    if (sError) console.error(sError);
    console.log('Subjects:', subjects);

    const { data: branches, error: bError } = await supabase.from('branches').select('id, name, subject_id');
    if (bError) console.error(bError);
    console.log('Branches:', branches);
}

checkIds();
