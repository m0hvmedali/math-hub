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

export const fetchDuckDuckGoResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
    // List of proxies to try in order
    const targetUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&t=mathhub`;
    
    // Attempt 1: AllOrigins (JSON Wrapper - most permissive)
    try {
        console.log("🔍 Global Intelligence: Trying AllOrigins JSON Wrapper...");
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
            const wrapper = await response.json();
            if (wrapper.contents) {
                const data = JSON.parse(wrapper.contents);
                return parseDDGData(data);
            }
        }
    } catch (e) {
        console.warn("⚠️ AllOrigins failed, trying fallback...");
    }

    // Attempt 2: CodeTabs Proxy (Secondary)
    try {
        console.log("🔍 Global Intelligence: Trying CodeTabs Proxy...");
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
            const data = await response.json();
            return parseDDGData(data);
        }
    } catch (e) {
        console.error("❌ All proxies failed:", e);
    }

    return [];
};

// Helper to parse DuckDuckGo API response
const parseDDGData = (data: any): Array<{ title: string; url: string }> => {
    const results: Array<{ title: string; url: string }> = [];

    if (data.AbstractURL) {
        results.push({ title: data.AbstractSource || 'Main Answer', url: data.AbstractURL });
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.forEach((topic: any) => {
            if (topic.Text && topic.FirstURL) {
                results.push({ title: topic.Text, url: topic.FirstURL });
            } else if (topic.Topics && Array.isArray(topic.Topics)) {
                topic.Topics.forEach((sub: any) => {
                    if (sub.Text && sub.FirstURL) {
                        results.push({ title: sub.Text, url: sub.FirstURL });
                    }
                });
            }
        });
    }

    // Unique by URL
    return Array.from(new Map(results.map(item => [item.url, item])).values()).slice(0, 8);
};
