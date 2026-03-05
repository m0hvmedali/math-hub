/**
 * MathNormalization.ts
 * Normalizes mathematical input into a format suitable for nerdamer/mathjs calculations.
 * Handles LaTeX, human input variability, Arabic symbols, and advanced notation.
 *
 * Engineering fixes applied (2026-02-22):
 *  1. e^ unclosed parenthesis — now captures the operand e.g. e^2 → exp(2)
 *  2. \int double-replacement — single-pass: \int → integrate(...) directly
 *  3. Definite integral regex preserves bounds + variable → defint(expr,var,lo,hi)
 *  4. Implicit multiplication skips known function names (sin, cos, etc.)
 *  5. Arabic substitutions use word-boundary regex to avoid partial matches
 *  6. safeRegex is now open/extensible (unicode flag) + \text{} stripped in normalize
 */

// All known math function names — used to guard implicit multiplication
const MATH_FUNCS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln',
    'sqrt', 'abs', 'exp', 'log10', 'integrate', 'diff', 'defint', 'delta'];
const FUNC_ALT = MATH_FUNCS.join('|');

// Variables for Arabic support
const ARABIC_VARS = 'س|ص|ن|ز|ط|ء|√';
const ARABIC_RE = new RegExp(`[${ARABIC_VARS}]`, 'g');

export function normalizeMath(input: string, variablePrefix: string = 'x'): string {
    if (!input) return "";

    let normalized = input;

    // ── Step 0: Handle MathLive placeholders and placeholders ──
    normalized = normalized.replace(/\\\#\?/g, "?").replace(/\#\?/g, "?").replace(/\\placeholder\{.*?\}/g, "?");

    // ── Step 1: Strip \text{} wrappers ──
    normalized = normalized.replace(/\\text\{(.+?)\}/g, "$1");

    // ── Pre-Step 1: Map Arabic symbols EARLY so LaTeX regexes see standard letters ──
    const arabicSubs: [RegExp, string][] = [
        [/\bجتا⁻¹\b/g, 'acos'], [/\bجا⁻¹\b/g, 'asin'], [/\bظا⁻¹\b/g, 'atan'],
        [/\bجتا\b/g, 'cos'], [/\bجا\b/g, 'sin'], [/\bظا\b/g, 'tan'],
        [/\bلو₁₀\b/g, 'log10'], [/\bلو\b/g, 'log'],
        [/س/g, 'x'], [/ص/g, 'y'], [/ن/g, variablePrefix === 'n' ? 'n' : 't'], [/ز/g, 't'], [/ط/g, 'PI'], [/ء/g, 'd'], [/√/g, 'sqrt'],
    ];
    arabicSubs.forEach(([re, en]) => {
        normalized = normalized.replace(re, en);
    });

    // ── Step 2: LaTeX → ASCII ──
    if (normalized.includes('\\')) {
        normalized = normalized
            // 1. Specialized Calculus (Match these before generic fractions)
            .replace(/\\int_\{?(-?[\d.]+)\}?\^\{?(-?[\d.]+)\}?\s*(.+?)\s*d([a-zA-Z])/g, "defint($3,$4,$1,$2)")
            .replace(/\\int\s*(.+?)\s*d([a-zA-Z])/g, "integrate($1,$2)")
            .replace(/\\frac\{d\}\{d([a-zA-Z])\}\((.+?)\)/g, "diff($2,$1)")

            // 2. Generic Fractions & Roots
            .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, "($1)/($2)")
            .replace(/\\sqrt\{(.+?)\}/g, "sqrt($1)")

            // 3. Functions
            .replace(/\\sin/g, "sin")
            .replace(/\\cos/g, "cos")
            .replace(/\\tan/g, "tan")
            .replace(/\\arcsin/g, "asin")
            .replace(/\\arccos/g, "acos")
            .replace(/\\arctan/g, "atan")
            .replace(/\\asin/g, "asin")
            .replace(/\\acos/g, "acos")
            .replace(/\\atan/g, "atan")
            .replace(/\\log/g, "log")
            .replace(/\\ln/g, "ln")

            // 4. Constants & Operators
            .replace(/\\pi/g, "PI")
            .replace(/\\partial/g, "d")
            .replace(/\\Delta/g, "delta")
            .replace(/\\infty/g, "Infinity")
            .replace(/\\cdot/g, "*")
            .replace(/\\left|\\right/g, "")

            // 5. Bare Integra
            .replace(/\\int/g, "integrate")

            // 6. Cleanup
            .replace(/\{(.+?)\}/g, "($1)")
            .replace(/\\/g, "");
    }

    // ── Step 2.5: Strip Math. prefix (e.g., Math.sin -> sin) ──
    normalized = normalized.replace(/Math\./g, "");

    // ── Step 3: Primary sanitization — strip zero-width chars, normalize spaces ──
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();

    // ── Step 4: Scientific / constant mapping ──
    normalized = normalized
        .replace(/∞/g, "Infinity")
        // Scientific notation: 3e10 → 3*10^10
        .replace(/(\d+)e([+-]?\d+)/g, "$1*10^$2")
        // FIX 1: e^x — capture the operand so the parenthesis is closed
        .replace(/e\^([^\s+\-*/^(),]+)/g, "exp($1)");

    // ── Step 3: Primary sanitization ──

    // ── Step 6: Root & absolute value (nested, multi-pass) ──
    for (let i = 0; i < 10; i++) {
        normalized = normalized.replace(/sqrt\s*\(([^()]+)\)/g, "sqrt($1)");
        normalized = normalized.replace(/sqrt\s+([a-zA-Z0-9x]+)\b/g, "sqrt($1)");
        normalized = normalized.replace(/\|([^|]+)\|/g, "abs($1)");
    }

    // ── Step 7: Calculus notation (unicode ∫ path, after LaTeX handled above) ──
    normalized = normalized
        // FIX 3: Definite integral ∫_{lo}^{hi} expr d var → defint(expr,var,lo,hi)
        .replace(/∫_(-?[\d.]+)\^(-?[\d.]+)\s*(.+?)\s*d([a-zA-Z])/g, "defint($3,$4,$1,$2)")
        // Indefinite ∫ expr d var → integrate(expr,var)
        .replace(/∫\s*(.+?)\s*d([a-zA-Z])/g, "integrate($1,$2)")
        .replace(/∫/g, "integrate")
        // Differential operator d/dx(f) → diff(f,x)
        .replace(/d\/d([a-zA-Z])\s*\((.+?)\)/g, "diff($2,$1)")
        // f''(x), f'(x) shorthand
        .replace(/f''\((\w)\)/g, "diff(diff(f($1),$1),$1)")
        .replace(/f'\((\w)\)/g, "diff(f($1),$1)")
        // English/Arabic differential (dx/dt or د س / د ن) -> diff(x,t)
        .replace(/\bd([a-zA-Z])\/d([a-zA-Z])\b/g, "diff($1,$2)")
        .replace(/د(\w)\/د(\w)/g, "diff($1,$2)");

    // ── Step 8: Vector syntax <a,b,c> → [a,b,c] ──
    normalized = normalized.replace(/<([^>]+)>/g, "[$1]");

    // ── Step 9: Implicit multiplication (FIX 4: skip function names) ──
    const fnGuardRe = new RegExp(`\\b(?:${FUNC_ALT})\\b`, 'g');
    // Temporarily mask function names so they don't get '*' injected
    const masks: string[] = [];
    normalized = normalized.replace(fnGuardRe, (m) => {
        masks.push(m);
        return `__FN${masks.length - 1}__`;
    });

    normalized = normalized
        // digit followed by letter or open paren: 2x → 2*x, 2(x+1) → 2*(x+1)
        .replace(/(\b\d+)\s*([a-zA-Z(])/g, (m, d, next) => {
            if (m === '10(') return m; // keep 10^
            return `${d}*${next}`;
        })
        // closing paren followed by letter or digit: (x)y → (x)*y
        .replace(/\)\s*([a-zA-Z\d\\])/g, ")*$1")
        .replace(/\)\s*\(/g, ")*(");

    // Restore masked function names
    masks.forEach((fn, i) => {
        normalized = normalized.replace(`__FN${i}__`, fn);
    });

    // ── Step 10: Function name cleanup (space before argument) ──
    MATH_FUNCS.forEach(f => {
        const re = new RegExp(`\\b${f}\\s+([a-zA-Z0-9x]+)\\b`, 'g');
        normalized = normalized.replace(re, `${f}($1)`);
    });

    // ── Step 11: Superscript conversion (² → ^2) ──
    const superMap: Record<string, string> = {
        '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
        '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9', '⁻': '^-',
    };
    normalized = normalized.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, c => superMap[c] ?? c);

    // ── Step 12: Parentheses balancing ──
    const openCount = (normalized.match(/\(/g) || []).length;
    const closeCount = (normalized.match(/\)/g) || []).length;
    if (openCount > closeCount) normalized += ")".repeat(openCount - closeCount);

    // ── Step 13: Final Sanitization & Space Stripping ──
    normalized = normalized.replace(/\s*([\+\-\*\/\^=,])\s*/g, "$1"); // Strip spaces around operators

    // Allowed characters: standard math, calculus symbols, e notation, ?, and LaTeX/Equation symbols (\, =)
    const dangerRegex = /[<>'"`;]/u; // Removed { } to avoid crashing on remaining LaTeX if any
    if (dangerRegex.test(normalized)) {
        const bad = normalized.match(dangerRegex);
        throw new Error(`Invalid symbol detected: ${bad ? bad[0] : 'Unknown'}. Please use standard math notation.`);
    }

    // Final brace stripping just in case
    normalized = normalized.replace(/[{}]/g, "");

    return normalized;
}

/**
 * arabizeMath — converts normalized math output back to Arabic display notation.
 */
export function arabizeMath(input: string): string {
    if (!input) return "";

    const phraseMap: Record<string, string> = {
        'First Derivative': 'المشتقة الأولى',
        'Second Derivative': 'المشتقة الثانية',
        'Antiderivative': 'التكامل غير المحدد',
        'Definite Integral': 'التكامل المحدد',
        'Critical Point': 'نقطة حرجة',
        'Local maximum': 'نهاية عظمى محلية',
        'Local minimum': 'نهاية صغرى محلية',
        'Inflection point': 'نقطة انقلاب',
    };

    let result = input;
    Object.entries(phraseMap).forEach(([en, ar]) => {
        result = result.replace(new RegExp(en, 'gi'), ar);
    });

    return result
        .replace(/\basin\b/g, "جا⁻¹")
        .replace(/\bacos\b/g, "جتا⁻¹")
        .replace(/\batan\b/g, "ظا⁻¹")
        .replace(/\bsin\b/g, "جا")
        .replace(/\bcos\b/g, "جتا")
        .replace(/\btan\b/g, "ظا")
        .replace(/\bPI\b/g, "ط")
        .replace(/\bsqrt\b/g, "√")
        .replace(/\bdiff\b/g, "تفاضل")
        .replace(/\bintegrate\b/g, "تكامل")
        .replace(/\bdefint\b/g, "تكامل محدد")
        .replace(/\bx\b/g, "س")
        .replace(/\by\b/g, "ص")
        .replace(/\bt\b/g, "ن");
}

/**
 * Caches a compiled expression and its first + second derivatives.
 * Use this instead of calling nerdamer.diff() multiple times in the same session.
 */
export interface CompiledExpr {
    expr: string; // normalized expression
    d1: string; // first derivative (nerdamer string)
    d2: string; // second derivative
    variable: string;
}

export function compileExpr(nerdamer: any, normalized: string, variable: string = 'x'): CompiledExpr {
    const compiled = nerdamer(normalized);
    const d1str = nerdamer.diff(normalized, variable).toString();
    const d2str = nerdamer.diff(d1str, variable).toString();
    return { expr: normalized, d1: d1str, d2: d2str, variable };
}
