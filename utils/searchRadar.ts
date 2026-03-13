import lunr from 'lunr';
import { Subject, CustomNode } from '../types';

export interface SearchResult {
    ref: string; // lessonId
    score: number;
    matchData: any;
    item: {
        id: string;
        subjectId: string;
        branchId: string;
        name: string;
        subjectName: string;
        branchName: string;
    }
}

let searchIndex: lunr.Index | null = null;
let lessonMap: Record<string, any> = {};

export const rebuildSearchIndex = (subjects: Subject[], customNodes: CustomNode[] = []) => {
    const builder = new lunr.Builder();
    builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
    builder.searchPipeline.add(lunr.stemmer);

    builder.ref('id');
    builder.field('name', { boost: 10 });
    builder.field('subjectName', { boost: 5 });
    builder.field('branchName', { boost: 5 });
    builder.field('content');
    builder.field('fileNames');
    builder.field('tags', { boost: 20 });

    lessonMap = {};

    subjects.forEach(subject => {
        subject.branches?.forEach(branch => {
            branch.lessons?.forEach(lesson => {
                // Extract deep content from blocks
                const deepContent = (lesson.content || [])
                    .map(block => {
                        let text = '';
                        if (block.type === 'markdown' || block.type === 'whiteboard') text += block.content;
                        if (block.question) text += ` ${block.question}`;
                        if (block.options) text += ` ${block.options.join(' ')}`;
                        return text;
                    })
                    .join(' ');

                const fileNames = (lesson.content || [])
                    .map(block => block.fileName || '')
                    .filter(name => name)
                    .join(' ');

                const doc = {
                    id: lesson.id,
                    name: lesson.name,
                    subjectName: subject.name,
                    branchName: branch.name,
                    content: deepContent,
                    fileNames: fileNames,
                    tags: (lesson.tags || []).join(' ')
                };

                builder.add(doc);

                lessonMap[lesson.id] = {
                    id: lesson.id,
                    name: lesson.name,
                    subjectName: subject.name,
                    branchName: branch.name,
                    subjectId: subject.id,
                    branchId: branch.id
                };
            });
        });
    });

    // Add Custom Nodes to index
    customNodes.forEach(node => {
        const subject = subjects.find(s => s.id === node.subject_id);
        const doc = {
            id: node.id,
            name: node.label,
            subjectName: subject?.name || 'External',
            branchName: 'External Resource',
            content: node.url,
            fileNames: '',
            tags: (node.tags || []).join(' ')
        };

        builder.add(doc);

        lessonMap[node.id] = {
            id: node.id,
            name: node.label,
            subjectName: subject?.name || 'External',
            branchName: 'External Resource',
            subjectId: node.subject_id,
            branchId: 'external'
        };
    });

    searchIndex = builder.build();
};

export const searchRadar = (query: string): SearchResult[] => {
    if (!searchIndex || !query.trim()) return [];

    try {
        const results = searchIndex.search(`${query}*`); // Basic wildcard search
        return results.map(res => ({
            ...res,
            item: lessonMap[res.ref]
        })).filter(res => res.item);
    } catch (e) {
        console.error("Search error:", e);
        return [];
    }
};

export interface TavilyResult {
    title: string;
    url: string;
    content: string;
}

export interface TavilyResponse {
    answer?: string;
    results: TavilyResult[];
}

const TAVILY_API_KEY = "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";

export const checkSearchLimit = (user: string): { allowed: boolean; remaining: number } => {
    if (user === '8128') return { allowed: true, remaining: Infinity };

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `search_usage_${user}`;
    const usageData = JSON.parse(localStorage.getItem(storageKey) || '{"date": "", "count": 0}');

    if (usageData.date !== today) {
        return { allowed: true, remaining: 10 };
    }

    return { 
        allowed: usageData.count < 10, 
        remaining: Math.max(0, 10 - usageData.count) 
    };
};

export const incrementSearchUsage = (user: string) => {
    if (user === '8128') return;

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `search_usage_${user}`;
    let usageData = JSON.parse(localStorage.getItem(storageKey) || '{"date": "", "count": 0}');

    if (usageData.date !== today) {
        usageData = { date: today, count: 1 };
    } else {
        usageData.count += 1;
    }

    localStorage.setItem(storageKey, JSON.stringify(usageData));
};

export const fetchTavilyResults = async (query: string, user: string): Promise<TavilyResponse | null> => {
    const limit = checkSearchLimit(user);
    if (!limit.allowed) {
        throw new Error("LIMIT_EXCEEDED");
    }

    try {
        console.log("🚀 AI Search: Manual Query Triggered...");
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: `${query} ثانوية عامة مصر`,
                search_depth: "basic", // Switched to basic to save units
                include_answer: false, // Disabled to save units as requested
                max_results: 5
            })
        });

        if (!response.ok) throw new Error(`Tavily HTTP Error ${response.status}`);
        
        const data = await response.json();
        const results = (data.results || []).map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content
        }));

        incrementSearchUsage(user);
        saveSearchToHistory(user, query, results);

        return {
            results
        };
    } catch (error) {
        console.error("❌ AI Search Error:", error);
        return null;
    }
};

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    results: TavilyResult[];
}

export const saveSearchToHistory = (user: string, query: string, results: TavilyResult[]) => {
    const historyKey = `search_history_${user}`;
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        query,
        timestamp: Date.now(),
        results
    };

    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
};

export const getSearchHistory = (user: string): HistoryItem[] => {
    const historyKey = `search_history_${user}`;
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
};

export const clearSearchHistory = (user: string) => {
    localStorage.removeItem(`search_history_${user}`);
};
