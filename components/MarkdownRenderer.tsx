import React from 'react';

/**
 * RichMarkdown — A beautiful, zero-dependency Markdown renderer
 * Supports: headings, bold, italic, code, tables, lists, horizontal rules,
 *           blockquotes, and inline math notation.
 * Designed for AI chat responses in a dark-themed app.
 */

type Block = { type: string; [key: string]: any };

// ── Inline parser: bold, italic, code, math ─────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Patterns: **bold**, *italic*, `code`, $math$
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\$(.+?)\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined)
      parts.push(<strong key={key++} className="font-black text-white">{m[2]}</strong>);
    else if (m[3] !== undefined)
      parts.push(<em key={key++} className="italic text-brand-cyan/90">{m[3]}</em>);
    else if (m[4] !== undefined)
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-white/10 text-brand-cyan font-mono text-[0.85em]">
          {m[4]}
        </code>
      );
    else if (m[5] !== undefined)
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[0.85em]">
          {m[5]}
        </code>
      );
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Block parser ──────────────────────────────────────────────────────────────
function parseBlocks(raw: string): Block[] {
  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue; }

    // Heading
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) { blocks.push({ type: 'h', level: hMatch[1].length, text: hMatch[2] }); i++; continue; }

    // Blockquote
    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quote.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({ type: 'blockquote', lines: quote });
      continue;
    }

    // Unordered list
    if (/^[\*\-•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-•]\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Table (pipe-separated)
    if (line.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows (e.g. |---|---|)
      const rows = tableLines.filter(l => !l.replace(/[\|\-\s:]/g, '').trim() === false || !/^[\|\-\s:]+$/.test(l));
      const cells = rows.map(r =>
        r.split('|').map(c => c.trim()).filter((_, j, a) => j > 0 && j < a.length - 1)
      );
      if (cells.length > 0) { blocks.push({ type: 'table', cells }); continue; }
    }

    // Paragraph
    const pLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].includes('|') && !/^[\*\-•]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith('>') && !/^---+$/.test(lines[i])) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) blocks.push({ type: 'p', text: pLines.join(' ') });
  }

  return blocks;
}

// ── Heading colors ────────────────────────────────────────────────────────────
const H_STYLES: Record<number, string> = {
  1: 'text-xl font-black text-brand-cyan tracking-tight mt-3 mb-2',
  2: 'text-base font-black text-purple-300 tracking-tight mt-3 mb-1.5',
  3: 'text-sm font-black text-emerald-400 uppercase tracking-widest mt-2 mb-1',
  4: 'text-xs font-black text-yellow-400 uppercase tracking-widest mt-2 mb-1',
};

const H_BORDERS: Record<number, string> = {
  1: 'border-l-4 border-brand-cyan pl-3',
  2: 'border-l-2 border-purple-400 pl-2',
  3: '',
  4: '',
};

// ── Renderer ──────────────────────────────────────────────────────────────────
interface Props {
  content: string;
  /** Override text color class for paragraphs */
  textColor?: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content, textColor = 'text-gray-200' }) => {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 text-sm leading-relaxed ${textColor}`} dir="auto">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'hr':
            return <hr key={idx} className="border-white/10 my-3" />;

          case 'h': {
            const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag key={idx} className={`${H_STYLES[block.level] || H_STYLES[2]} ${H_BORDERS[block.level] || ''}`}>
                {parseInline(block.text)}
              </Tag>
            );
          }

          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-4 border-yellow-500/50 pl-3 py-1 bg-yellow-500/5 rounded-r-lg italic text-yellow-200/80">
                {block.lines.map((l: string, j: number) => (
                  <p key={j}>{parseInline(l)}</p>
                ))}
              </blockquote>
            );

          case 'ul':
            return (
              <ul key={idx} className="space-y-1.5 ml-2">
                {block.items.map((item: string, j: number) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-cyan flex-shrink-0" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="space-y-1.5 ml-2">
                {block.items.map((item: string, j: number) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black flex-shrink-0 flex items-center justify-center">
                      {j + 1}
                    </span>
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'code':
            return (
              <div key={idx} className="rounded-2xl bg-black/60 border border-white/10 overflow-hidden">
                {block.lang && (
                  <div className="px-3 py-1 bg-white/5 border-b border-white/5 text-[9px] font-black text-brand-cyan uppercase tracking-widest">
                    {block.lang}
                  </div>
                )}
                <pre className="p-4 overflow-x-auto text-xs text-green-300 font-mono leading-relaxed custom-scrollbar">
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case 'table': {
            const [header, ...rows] = block.cells as string[][];
            return (
              <div key={idx} className="overflow-x-auto rounded-2xl border border-white/10 my-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.05] border-b border-white/10">
                      {header?.map((cell: string, j: number) => (
                        <th key={j} className="px-3 py-2 text-left font-black text-brand-cyan uppercase tracking-widest">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row: string[], ri: number) => (
                      <tr key={ri} className="hover:bg-white/[0.03] transition-colors">
                        {row.map((cell: string, ci: number) => (
                          <td key={ci} className={`px-3 py-2 ${ci === 0 ? 'font-bold text-white' : 'text-gray-300'}`}>
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'p':
          default:
            return (
              <p key={idx} className="leading-relaxed">
                {parseInline(block.text || '')}
              </p>
            );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
