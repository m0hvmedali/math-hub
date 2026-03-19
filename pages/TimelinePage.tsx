import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, ArrowLeftIcon, AlertCircleIcon, TrendingUpIcon } from '../components/Icons';
import { Lesson } from '../types';

const TimelinePage: React.FC = () => {
  const { subjects, isLoading } = useContext(AppContext);
  const navigate = useNavigate();

  const smartTimeline = useMemo(() => {
    const allLessons: { subjectName: string; subjectId: string; branchId: string; lesson: Lesson }[] = [];

    subjects.forEach(s => {
      s.branches.forEach(b => {
        b.lessons.forEach(l => {
          allLessons.push({
            subjectName: s.name,
            subjectId: s.id,
            branchId: b.id,
            lesson: l
          });
        });
      });
    });

    // Smart Sort Algorithm
    return allLessons.sort((a, b) => {
      if (a.lesson.status === 'completed' && b.lesson.status !== 'completed') return 1;
      if (a.lesson.status !== 'completed' && b.lesson.status === 'completed') return -1;

      // Prioritize Weak Understanding
      const uMap = { weak: 3, average: 2, strong: 1 };
      const uDiff = uMap[b.lesson.understanding_level] - uMap[a.lesson.understanding_level];
      if (uDiff !== 0) return uDiff;

      // Prioritize High Importance
      const iMap = { high: 3, medium: 2, low: 1 };
      const iDiff = iMap[b.lesson.importance] - iMap[a.lesson.importance];
      if (iDiff !== 0) return iDiff;

      // Prioritize Hard Difficulty
      const dMap = { hard: 3, medium: 2, easy: 1 };
      return dMap[b.lesson.difficulty] - dMap[a.lesson.difficulty];
    });
  }, [subjects]);

  const pressureInfo = useMemo(() => {
    let totalRemainingMinutes = 0;
    let earliestExamDate: Date | null = null;

    subjects.forEach(s => {
      if (s.exam_date) {
        const date = new Date(s.exam_date);
        if (!earliestExamDate || date < earliestExamDate) earliestExamDate = date;
      }
      s.branches.forEach(b => {
        b.lessons.forEach(l => {
          if (l.status !== 'completed') {
            totalRemainingMinutes += l.estimated_time_minutes || 60;
          }
        });
      });
    });

    if (!earliestExamDate) return null;

    const daysLeft = Math.ceil((earliestExamDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const hoursPerDay = daysLeft > 0 ? (totalRemainingMinutes / 60) / daysLeft : totalRemainingMinutes / 60;

    return {
      hoursPerDay: hoursPerDay.toFixed(1),
      daysLeft,
      status: hoursPerDay > 4 ? 'high' : hoursPerDay > 2 ? 'medium' : 'low'
    };
  }, [subjects]);

  if (isLoading) return <div className="p-10 text-center text-white">Calculating Smart Timeline...</div>;

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto pb-32 animate-fade-in">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
          <TrendingUpIcon className="w-12 h-12 text-brand-cyan" /> Smart Timeline
        </h1>
        <p className="text-gray-400 text-xl font-medium">Your path to mastery, automatically optimized.</p>
      </header>

      {/* Pressure Indicator */}
      {pressureInfo && (
        <div className={`mb-12 p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${pressureInfo.status === 'high' ? 'bg-red-900/10 border-red-500/50' : pressureInfo.status === 'medium' ? 'bg-yellow-900/10 border-yellow-500/50' : 'bg-green-900/10 border-green-500/50'
          }`}>
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${pressureInfo.status === 'high' ? 'bg-red-500 text-white' : 'bg-brand-cyan text-white'
              }`}>
              <AlertCircleIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Pressure Level: {pressureInfo.status.toUpperCase()}</h3>
              <p className="text-gray-400 font-medium">You need to study ~{pressureInfo.hoursPerDay} hours per day to finish before your exams.</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white whitespace-nowrap">
            {pressureInfo.daysLeft} Days Left
          </div>
        </div>
      )}

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-8 before:h-full before:w-1 before:bg-gray-800">
        {smartTimeline.map(({ subjectName, subjectId, branchId, lesson }, index) => {
          const isCompleted = lesson.status === 'completed';
          return (
            <div
              key={lesson.id}
              onClick={() => navigate(`/subject/${subjectId}/branch/${branchId}/lesson/${lesson.id}`)}
              className={`relative pl-20 group cursor-pointer transition-all ${isCompleted ? 'opacity-50' : 'hover:scale-[1.02]'}`}
            >
              <div className={`absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-transparent z-10 transition-colors ${isCompleted ? 'bg-accent-green' : lesson.understanding_level === 'weak' ? 'bg-red-500' : 'bg-gray-700 group-hover:bg-brand-cyan'
                }`}></div>

              <div className={`p-6 rounded-2xl border transition-all ${isCompleted ? 'bg-gray-900/30 border-gray-800' : 'glass-card border-[var(--glass-border)] group-hover:border-brand-cyan shadow-lg'
                }`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 px-2 py-1 rounded text-gray-400">
                        {subjectName}
                      </span>
                      {lesson.understanding_level === 'weak' && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-red-900/30 px-2 py-1 rounded text-red-500">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{lesson.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {lesson.estimated_time_minutes || 60}m</span>
                      <span className="uppercase tracking-tighter">{lesson.difficulty}</span>
                    </div>
                  </div>
                  {isCompleted && <CheckCircleIcon className="w-8 h-8 text-accent-green" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelinePage;