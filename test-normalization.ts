import { normalizeMath } from './utils/MathNormalization.ts';

const testCases = [
    // Standard ASCII
    { input: 'س² + 3س', expected: 'x^2 + 3*x' },
    { input: '√(س²+1)', expected: 'sqrt(x^2+1)' },

    // LaTeX (MathLive Output)
    { input: '\\frac{1}{2}x', expected: '(1)/(2)*x' },
    { input: '\\sqrt{x^2+1}', expected: 'sqrt(x^2+1)' },
    { input: '\\sin(x) + \\cos(x)', expected: 'sin(x)+cos(x)' },
    { input: '\\int x^2 dx', expected: 'integrate(x^2,x)' },
    { input: '\\int_{0}^{5} x^2 dx', expected: 'defint(x^2,x,0,5)' },
    { input: '\\pi', expected: 'PI' },

    // Physics
    { input: 'ن^2', expected: 't^2' },
    { input: 'v = d\\text{س}/d\\text{ن}', expected: 'v=diff(x,t)' },
    { input: '\\frac{d}{dس}(x^2)', expected: 'diff(x^2,x)' },
    { input: '\\frac{d}{dس}(#?)', expected: 'diff(?,x)' }, // Testing placeholder behavior
    { input: 'e^2 + e^x', expected: 'exp(2)+exp(x)' }
];

console.log("--- DYNAMO Keyboard Integration Test ---");
let passed = 0;
testCases.forEach(({ input, expected }, i) => {
    try {
        const result = normalizeMath(input);
        const normalizedResult = result.replace(/\s+/g, "");
        const normalizedExpected = expected.replace(/\s+/g, "");

        if (normalizedResult.includes(normalizedExpected)) {
            console.log(`[PASS] Case ${i + 1}: "${input}" -> "${result}"`);
            passed++;
        } else {
            console.log(`[FAIL] Case ${i + 1}: "${input}"\n  Expected: "${expected}"\n  Got:      "${result}"`);
        }
    } catch (e) {
        console.log(`[ERROR] Case ${i + 1}: "${input}" -> ${e.message}`);
    }
});

console.log(`\nResult: ${passed}/${testCases.length} Passed`);
