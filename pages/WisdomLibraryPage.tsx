import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { supabase } from '../supabaseClient';
import { WisdomItem } from '../hooks/useWisdom';
import WisdomCard from '../components/WisdomCard';
import { SearchIcon, FilterIcon, TrashIcon, SparkleIcon } from '../components/Icons';

const WisdomLibraryPage: React.FC = () => {
    const { user, language, wisdomProgress, updateWisdomProgress } = useContext(AppContext) as any;
    const [items, setItems] = useState<WisdomItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            if (!user) return;
            setIsLoading(true);
            let query = supabase.from('wisdom_items').select('*');
            
            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            const { data } = await query.order('created_at', { ascending: false });
            if (data) setItems(data);
            setIsLoading(false);
        };
        fetchItems();
    }, [user, filterType]);

    const filteredItems = items.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20">
                        <SparkleIcon className="w-8 h-8 text-brand-cyan" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black">{language === 'ar' ? 'مكتبة الحكمة' : 'Wisdom Library'}</h1>
                        <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Universe Knowledge Repository</p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                        type="text"
                        placeholder={language === 'ar' ? 'بحث في المخطوطات...' : 'Search manuscripts...'}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand-cyan outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'hadith', 'poetry', 'scholar_quote', 'general_wisdom'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filterType === type ? 'bg-brand-cyan text-white shadow-glow-cyan' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            {type === 'all' ? (language === 'ar' ? 'الكل' : 'All') : type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <div className="w-16 h-16 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin shadow-glow-cyan"></div>
                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm animate-pulse">Retrieving Wisdom...</p>
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in">
                    {filteredItems.map(item => (
                        <WisdomCard 
                            key={item.id}
                            item={item}
                            onUpdate={(action) => updateWisdomProgress(item.id, action)}
                            variant="compact"
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 mb-6">
                        <FilterIcon className="w-16 h-16 text-gray-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">{language === 'ar' ? 'لا توجد نتائج' : 'No manuscripts found'}</h3>
                    <p className="text-gray-500 max-w-sm">{language === 'ar' ? 'جرب البحث بكلمات أخرى أو تغيير التصنيف.' : 'Try different search terms or change the filters.'}</p>
                </div>
            )}
        </div>
    );
};

export default WisdomLibraryPage;
