export interface OSSUCourse {
    title: string;
    description: string;
    url: string;
    status: 'core' | 'advanced';
    category: string;
}

export const OSSU_MATH_CURRICULUM: OSSUCourse[] = [
    // Core mathematics
    {
        title: "Introduction to Mathematical Thinking",
        description: "Learn how to think like a mathematician.",
        url: "https://www.coursera.org/learn/mathematical-thinking",
        status: 'core',
        category: "Introduction"
    },
    {
        title: "Algebra Basic",
        description: "Fundamentals of algebra.",
        url: "https://www.khanacademy.org/math/algebra",
        status: 'core',
        category: "Core Math"
    },
    {
        title: "Introduction to Statistics",
        description: "General introduction to statistics.",
        url: "https://www.udacity.com/course/intro-to-statistics--st101",
        status: 'core',
        category: "Statistics"
    },
    {
        title: "Single Variable Calculus",
        description: "Foundations of calculus.",
        url: "https://ocw.mit.edu/courses/mathematics/18-01sc-single-variable-calculus-fall-2010/",
        status: 'core',
        category: "Calculus"
    },
    {
        title: "Linear Algebra",
        description: "Study of vectors and matrices.",
        url: "https://ocw.mit.edu/courses/mathematics/18-06sc-linear-algebra-fall-2011/",
        status: 'core',
        category: "Linear Algebra"
    },
    {
        title: "Multivariable Calculus",
        description: "Calculus in multiple dimensions.",
        url: "https://ocw.mit.edu/courses/mathematics/18-02sc-multivariable-calculus-fall-2010/",
        status: 'core',
        category: "Calculus"
    },
    // Advanced topics
    {
        title: "Real Analysis",
        description: "Rigorous study of real numbers and functions.",
        url: "https://www.youtube.com/playlist?list=PL0E75469604470701",
        status: 'advanced',
        category: "Analysis"
    },
    {
        title: "Modern Algebra",
        description: "Groups, rings, and fields.",
        url: "https://ocw.mit.edu/courses/mathematics/18-701-algebra-i-fall-2010/",
        status: 'advanced',
        category: "Algebra"
    },
    {
        title: "Complex Analysis",
        description: "Calculus of complex-valued functions.",
        url: "https://www.youtube.com/playlist?list=PL6763F57A3D765621",
        status: 'advanced',
        category: "Analysis"
    },
    {
        title: "Differential Geometry",
        description: "Geometry of curves and surfaces.",
        url: "https://ocw.mit.edu/courses/mathematics/18-950-differential-geometry-fall-2008/",
        status: 'advanced',
        category: "Geometry"
    }
];
