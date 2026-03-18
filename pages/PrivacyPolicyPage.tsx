import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-white" dir="rtl">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <span className="text-lg font-black text-white">Math Hub</span>
        </Link>
        <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">← الرجوع للرئيسية</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-2">سياسة الخصوصية</h1>
        <p className="text-gray-500 mb-12 text-sm">آخر تحديث: مارس 2025</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. نظرة عامة</h2>
            <p>
              Math Hub ("التطبيق") هو منصة تعليمية مخصصة للطلاب. نحن نأخذ خصوصيتك على محمل الجد ونلتزم بحماية بياناتك الشخصية وفقاً لأفضل الممارسات.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. البيانات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-white">بيانات الحساب:</strong> الاسم فقط (لا نجمع كلمات مرور أو بريد إلكتروني إلا عبر Google)</li>
              <li><strong className="text-white">بيانات الدراسة:</strong> المواد، الدروس، جداول الدراسة، والملاحظات التي تُدخلها</li>
              <li><strong className="text-white">إحصاءات الاستخدام:</strong> ساعات الدراسة وتقدمك الأكاديمي</li>
              <li><strong className="text-white">بيانات Google:</strong> عند ربط حساب Google، نطلب صلاحيات محدودة للوصول إلى Gmail وDrive وYouTube وCalendar وTasks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>تقديم وتحسين خدمات التطبيق</li>
              <li>تحليل أدائك الدراسي وتقديم توصيات مخصصة</li>
              <li>حفظ تقدمك ومزامنته عبر الأجهزة</li>
              <li><strong className="text-white">لا نبيع بياناتك لأي طرف ثالث</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. صلاحيات Google</h2>
            <p className="mb-4">عند ربط حساب Google الخاص بك، نطلب الصلاحيات التالية حصراً:</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              {[
                { scope: 'Gmail (قراءة وإرسال)', use: 'عرض رسائلك وإرسال رسائل من داخل التطبيق' },
                { scope: 'Google Drive (الملفات)', use: 'تصفح الملفات التي أنشأها التطبيق فقط' },
                { scope: 'YouTube (قراءة)', use: 'عرض فيديوهاتك وقوائمك التشغيلية' },
                { scope: 'Google Calendar', use: 'إنشاء أحداث دراسية في التقويم' },
                { scope: 'Google Tasks', use: 'إدارة قائمة مهامك الدراسية' },
              ].map(item => (
                <div key={item.scope} className="flex gap-4 items-start">
                  <span className="text-cyan-400 font-bold text-sm shrink-0 mt-0.5">{item.scope}</span>
                  <span className="text-gray-400 text-sm">{item.use}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              نستخدم هذه الصلاحيات فقط لتقديم الخدمة ولا نخزنها أو نشاركها بأي شكل.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. تخزين البيانات</h2>
            <p>
              تُخزَّن بياناتك بشكل آمن في قاعدة بيانات Supabase المشفرة. أحجام التخزين محدودة ببيانات النشاط الدراسي فقط. رموز Google Access Tokens تُخزَّن محلياً في متصفحك ولا تُرسل لخوادمنا.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>طلب حذف جميع بياناتك في أي وقت من صفحة الإعدادات</li>
              <li>إلغاء ربط حساب Google في أي وقت</li>
              <li>تصدير بياناتك الدراسية</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. التواصل</h2>
            <p>
              لأي استفسار بخصوص سياسة الخصوصية، تواصل معنا عبر:{' '}
              <a href="mailto:mohamedalix546@gmail.com" className="text-cyan-400 hover:underline">
                mohamedalix546@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-6 text-center">
        <p className="text-sm text-gray-600">© 2025 Math Hub. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
