export interface MathLesson {
    id: string;
    titleKey: string;
    type: 'geogebra' | 'custom' | 'iframe';
    source: string; // GeoGebra ID, Component Name, or URL
}

export interface MathUnit {
    id: string;
    titleKey: string;
    lessons: MathLesson[];
}

export interface MathCategory {
    id: string;
    titleKey: string;
    units: MathUnit[];
}

export const MATH_CURRICULUM: MathCategory[] = [
    {
        id: 'pure-math',
        titleKey: 'pureMath',
        units: [
            {
                id: 'calculus-1',
                titleKey: 'calculusUnit1',
                lessons: [
                    { id: 'diff-trig', titleKey: 'diffTrig', type: 'geogebra', source: 'A5ZgT7fM' },
                { id: 'implicit-diff', titleKey: 'implicitDiff', type: 'geogebra', source: 'kF8p4F9Y' },
                { id: 'higher-deriv', titleKey: 'higherDeriv', type: 'geogebra', source: 'nmuvws42' },
                { id: 'tangent-normal', titleKey: 'tangentNormal', type: 'geogebra', source: 'nmuvws42' },
                { id: 'related-rates', titleKey: 'relatedRates', type: 'geogebra', source: 'A5ZgT7fM' },
                ]
            },
            {
                id: 'calculus-2',
                titleKey: 'calculusUnit2',
                lessons: [
                    { id: 'euler-e', titleKey: 'eulerNumber', type: 'geogebra', source: 'mny6szwa' },
                    { id: 'exp-log-der', titleKey: 'expLogDerivatives', type: 'geogebra', source: 'j6zxzpzw' }
                ]
            },
            {
                id: 'calculus-3',
                titleKey: 'calculusUnit3',
                lessons: [
                    { id: 'inc-dec', titleKey: 'incDecFunctions', type: 'geogebra', source: 'axuubx7e' },
                    { id: 'local-ext', titleKey: 'localExtrema', type: 'geogebra', source: 'vryjmfxt' },
                    { id: 'conv-inf', titleKey: 'convexityInflection', type: 'geogebra', source: 'mny6szwa' }
                ]
            },
            {
                id: 'calculus-4',
                titleKey: 'calculusUnit4',
                lessons: [
                    { id: 'int-meth', titleKey: 'integrationMethods', type: 'geogebra', source: 'j6zxzpzw' },
                    { id: 'area-calc', titleKey: 'areaCalculation', type: 'geogebra', source: 'axuubx7e' },
                    { id: 'vol-calc', titleKey: 'volumeCalculation', type: 'geogebra', source: 'vryjmfxt' }
                ]
            },
            {
                id: 'algebra',
                titleKey: 'algebraUnit1',
                lessons: [
                    { id: 'perm-comb', titleKey: 'permComb', type: 'geogebra', source: 'mny6szwa' },
                    { id: 'binomial', titleKey: 'binomialTheorem', type: 'geogebra', source: 'j6zxzpzw' },
                    { id: 'complex', titleKey: 'complexNumbers', type: 'geogebra', source: 'axuubx7e' },
                    { id: 'moivre', titleKey: 'moivreFormula', type: 'geogebra', source: 'vryjmfxt' },
                    { id: 'matrices', titleKey: 'matricesDet', type: 'geogebra', source: 'mny6szwa' }
                ]
            },
            {
                id: 'solid-geometry',
                titleKey: 'solidGeometry',
                lessons: [
                    { id: 'coord-3d', titleKey: 'coord3D', type: 'geogebra', source: 'j6zxzpzw' },
                    { id: 'vectors-3d', titleKey: 'vectors3D', type: 'geogebra', source: 'EOODXQMV' },
                { id: 'lines-3d', titleKey: 'lines3D', type: 'geogebra', source: 'EOODXQMV' },
                { id: 'planes-3d', titleKey: 'planes3D', type: 'geogebra', source: 'EOODXQMV' },
                    { id: 'plane-eq', titleKey: 'planeEquation', type: 'geogebra', source: 'j6zxzpzw' }
                ]
            }
        ]
    },
    {
        id: 'applied-math',
        titleKey: 'appliedMath',
        units: [
            {
                id: 'statics',
                titleKey: 'statics',
                lessons: [
                    { id: 'friction-plane', titleKey: 'frictionPlane', type: 'geogebra', source: 'HZYPFmMm' },
                { id: 'friction-inclined', titleKey: 'frictionInclined', type: 'geogebra', source: 'ebvIlU2M' },
                    { id: 'parallel', titleKey: 'staticsUnit3', type: 'geogebra', source: 'mny6szwa' },
                    { id: 'equilibrium', titleKey: 'staticsUnit4', type: 'geogebra', source: 'j6zxzpzw' },
                    { id: 'couples', titleKey: 'staticsUnit5', type: 'geogebra', source: 'axuubx7e' },
                    { id: 'center-g', titleKey: 'staticsUnit6', type: 'geogebra', source: 'vryjmfxt' }
                ]
            },
            {
                id: 'dynamics',
                titleKey: 'dynamics',
                lessons: [
                    { id: 'vector-fn', titleKey: 'dynamicsUnit1', type: 'geogebra', source: 'mny6szwa' },
                    { id: 'newton-laws', titleKey: 'dynamicsUnit2', type: 'geogebra', source: 'j6zxzpzw' },
                    { id: 'impulse', titleKey: 'dynamicsUnit3', type: 'geogebra', source: 'axuubx7e' },
                    { id: 'energy', titleKey: 'dynamicsUnit4', type: 'geogebra', source: 'vryjmfxt' }
                ]
            }
        ]
    }
];
