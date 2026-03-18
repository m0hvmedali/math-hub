import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col" dir="rtl">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">Math Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">سياسة الخصوصية</Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            تسجيل الدخول
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"/>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold mb-6">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              منصة الطالب الذكية
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
              <span className="text-white">Math Hub</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
                مساعدك الأكاديمي
              </span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              منصة تعليمية متكاملة تساعد الطلاب على تنظيم دراستهم، تتبع تقدمهم، وتحليل أدائهم الأكاديمي باستخدام أحدث تقنيات الذكاء الاصطناعي.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/30 transition-all text-lg"
            >
              ابدأ الآن مجاناً
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">ما الذي يقدمه Math Hub؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🧠',
                title: 'ذكاء اصطناعي متكامل',
                desc: 'تحليل يومي لأدائك الدراسي وخطط مخصصة لك بالعربية والإنجليزية.'
              },
              {
                icon: '📚',
                title: 'تنظيم المواد الدراسية',
                desc: 'أضف مواد وفروع ودروس، وتتبع تقدمك في كل موضوع بسهولة.'
              },
              {
                icon: '⏱️',
                title: 'مؤقت الدراسة الذكي',
                desc: 'مؤقت Pomodoro احترافي يتابعك ويسجل ساعات دراستك عبر الأجهزة.'
              },
              {
                icon: '🔍',
                title: 'بحث موسّع',
                desc: 'بحث داخل التطبيق والويب وGoogle Drive وYouTube في نفس الوقت.'
              },
              {
                icon: '📊',
                title: 'تحليلات تفصيلية',
                desc: 'إحصاءات وتقارير دقيقة عن مستواك الدراسي وتطورك عبر الوقت.'
              },
              {
                icon: '🔬',
                title: 'مختبرات تفاعلية',
                desc: 'مختبرات افتراضية للكيمياء العضوية، الرياضيات، وغيرها.'
              },
            ].map(f => (
              <div key={f.title} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.06] transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-xl mx-auto bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-10">
            <h2 className="text-3xl font-black mb-4">جاهز للبدء؟</h2>
            <p className="text-gray-400 mb-8">Math Hub مجاني تماماً للطلاب. سجّل وابدأ رحلتك الأكاديمية.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all"
            >
              ابدأ الآن
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <span>© 2025 Math Hub. جميع الحقوق محفوظة.</span>
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">سياسة الخصوصية</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
