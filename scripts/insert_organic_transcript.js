
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pawwqdaiucbvohsgmtop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userId = '8128'; // Shared content user ID

async function insertTranscript() {
    console.log('Starting transcript insertion...');

    // 1. Ensure Subject exists
    const subjectName = 'الكيمياء العضوية';
    let { data: subject, error: sError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subjectName)
        .eq('user_id', userId)
        .single();

    if (sError && sError.code !== 'PGRST116') {
        console.error('Error finding subject:', sError);
        return;
    }

    if (!subject) {
        console.log('Creating subject...');
        const { data: newSubject, error: nsError } = await supabase
            .from('subjects')
            .insert([{ name: subjectName, user_id: userId }])
            .select()
            .single();
        if (nsError) {
            console.error('Error creating subject:', nsError);
            return;
        }
        subject = newSubject;
    }
    console.log('Subject ID:', subject.id);

    // 2. Ensure Branch exists
    const branchName = 'المقدمة والأساسيات';
    let { data: branch, error: bError } = await supabase
        .from('branches')
        .select('id')
        .eq('name', branchName)
        .eq('subject_id', subject.id)
        .single();

    if (bError && bError.code !== 'PGRST116') {
        console.error('Error finding branch:', bError);
        return;
    }

    if (!branch) {
        console.log('Creating branch...');
        const { data: newBranch, error: nbError } = await supabase
            .from('branches')
            .insert([{ name: branchName, subject_id: subject.id }])
            .select()
            .single();
        if (nbError) {
            console.error('Error creating branch:', nbError);
            return;
        }
        branch = newBranch;
    }
    console.log('Branch ID:', branch.id);

    // 3. Prepare Lesson Content
    const lessonName = 'مقدمة في الكيمياء العضوية - المحاضرة الأولى';
    const content = [
        {
            id: 'b1-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### مقدمة وترحيب
قال رب اشرح لي صدري ويسر لي امري واحلل عقدة من لساني يفقه قولي. السلام عليكم ورحمة الله وبركاته. أهلاً وسهلاً بكم حبايبنا طلبة الصف الثالث الثانوي، كل عام وأنتم بخير ويا رب دائماً أنتم وأهلكم وحبايبكم بألف صحة وسلامة.
وصلنا لبداية الكيمياء العضوية، كورس تقيل جداً ولكنه مهم جداً جداً وعليه تقريباً أكثر من ثلث درجات الامتحان، فلازم تكون بكامل تركيزك معايا في المحاضرة كلها.`
        },
        {
            id: 'b2-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### تعريف الكيمياء العضوية
هي العلم الذي يهتم بدراسة مركبات عنصر الكربون. وأول استنتاج هو أن أي مركب عضوي لابد أن يحتوي على عنصر الكربون. 
لكن هل أي مركب فيه كربون يبقى عضوي؟ لا، هناك استثناءات (مركبات تحتوي كربون ولكنها غير عضوية):
1. أكاسيد الكربون (CO, CO2).
2. أملاح الكربونات (CO3^-2) والبيكربونات (HCO3^-1).
3. أملاح السيانيد (CN^-) والسيانات (CNO^-).`
        },
        {
            id: 'b3-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### أمثلة وتاريخ
من الأمثلة على المركبات العضوية: السكر، الزيت، الخل، الأدوية، العطور، الجلد، الورق، القماش. 
حتى الفراعنة كانوا يستخدمون عقاقير عضوية في التحنيط وأصباغ ذات ألوان ثابتة لآلاف السنين.`
        },
        {
            id: 'b4-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### نظرية القوة الحيوية (برازيليوس)
العالم برازيليوس قسم المركبات على أساس مصدرها:
- **مركب عضوي:** أساسه ومصدره الكائن الحي.
- **مركب غير عضوي:** مصدره المعادن والأرض.
وضع نظرية "القوة الحيوية": "جميع المركبات العضوية تتكون داخل خلايا الكائنات الحية فقط بواسطة قوة حيوية ولا يمكن تحضيرها معملياً". تم ذلك عام 1806.`
        },
        {
            id: 'b5-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### تجربة فوهلر (تحطيم النظرية)
العالم فوهلر حطم نظرية القوة الحيوية عندما استطاع تحضير "اليوريا" (مادة عضوية توجد في بول الثدييات) في المختبر من مواد غير عضوية:
1. خلط كلوريد الأمونيوم (NH4Cl) وسيانات الفضة (AgCNO).
2. نتج سيانات الأمونيوم (NH4CNO).
3. بالتسخين الضعيف، حدثت إعادة تشكل لسيانات الأمونيوم لتتحول إلى يوريا (NH2-CO-NH2).`
        },
        {
            id: 'b6-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### وفرة المركبات العضوية
عدد المركبات العضوية يتجاوز 10 ملايين، بينما غير العضوية حوالي نصف مليون (نسبة 20:1). السبب:
1. قدرة ذرة الكربون على تكوين 4 روابط بطرق مختلفة (أحادية، ثنائية، ثلاثية).
2. قدرة ذرات الكربون على الارتباط ببعضها في صور سلاسل (مستمرة أو متفرعة) أو حلقات (متجانسة أو غير متجانسة).`
        },
        {
            id: 'b7-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### طرق التعبير عن المركب العضوي
1. **الصيغة الجزيئية:** توضح نوع وعدد الذرات فقط.
2. **الصيغة البنائية:** توضح النوع والعدد وطريقة الارتباط، لكن تظهر الجزيء مسطحاً.
3. **النماذج الجزيئية:** تظهر الجزيء بأبعاده الفراغية الثلاثة وشكله الصحيح.
4. **الصيغة المكثفة:** ضغط الصيغة البنائية لتسهيل التعامل معها.
5. **الصيغة الأولية:** أبسط نسبة بين ذرات المركب.
6. **الصيغة البنائية المكثفة:** توضح البناء بصورة مضغوطة.
7. **الصيغة الهيكلية:** تعتمد على تمثيل الروابط بخطوط حيث تمثل الزوايا ذرات الكربون.`
        },
        {
            id: 'b8-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### الكشف عن الكربون والهيدروجين
يتم بخلط المادة العضوية مع أكسيد النحاس الثنائي (عامل مؤكسد) والتسخين:
- **تحول لون كبريتات النحاس اللامائية البيضاء إلى زرقاء** يدل على وجود ماء (H2O) -> الهيدروجين مصدره المادة العضوية.
- **تعكر ماء الجير الرائق** يدل على خروج ثاني أكسيد الكربون (CO2) -> الكربون مصدره المادة العضوية.`
        },
        {
            id: 'b9-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### تصنيف الهيدروكربونات
تنقسم إلى:
- **أليفاتية (دهنية):** سلاسل مفتوحة (مشبعة كالألكان، أو غير مشبعة كالألكين والألكاين) أو حلقات مشبعة.
- **أروماتية (عطرية):** حلقات غير مشبعة (مثل البنزين العطري).`
        },
        {
            id: 'b10-' + Math.random().toString(36).substr(2, 9),
            type: 'markdown',
            content: `### سلسلة الألكانات
تتبع القانون العام: CnH2n+2. أمثلة:
- ميثان (CH4)
- إيثان (C2H6)
- بروبان (C3H8)
- بيوتان (C4H10)
- بنتان (C5H12)`
        }
    ];

    // 4. Insert Lesson
    console.log('Inserting lesson...');
    const { data: lesson, error: lError } = await supabase
        .from('lessons')
        .insert([{
            branch_id: branch.id,
            name: lessonName,
            content: content,
            status: 'not_started',
            difficulty: 'medium',
            importance: 'high',
            understanding_level: 'average',
            review_stage: 0,
            tags: ['chemistry', 'organic', 'intro']
        }])
        .select()
        .single();

    if (lError) {
        console.error('Error inserting lesson:', lError);
        return;
    }

    console.log('Successfully inserted lesson ID:', lesson.id);
    console.log('Done.');
}

insertTranscript();
