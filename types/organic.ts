
export interface OrgLesson {
    id: string;
    slug: string;
    title_ar: string;
    title_en: string;
    description: string;
    order_index: number;
}

export interface OrgCompound {
    id: string;
    name_ar: string;
    name_en: string;
    formula: string;
    molar_mass?: number;
    structure_svg?: string;
    lesson_id?: string;
    description?: string;
    tags: string[];
}

export interface OrgReaction {
    id: string;
    name?: string;
    reactants: string[]; // Compound names or IDs
    products: string[];  // Compound names or IDs
    reagents?: string;
    conditions?: string;
    mechanism_type?: string;
    balanced_equation?: string;
    lesson_id?: string;
    reversible: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    references_link?: string;
}

export interface OrgReactionEdge {
    id: string;
    reaction_id: string;
    from_compound_id: string;
    to_compound_id: string;
}

export interface OrgQuestion {
    id: string;
    question_text: string;
    answer: string;
    type: 'mcq' | 'fill' | 'short' | 'step';
    options?: string[];
    lesson_id?: string;
    difficulty: 'easy' | 'medium' | 'hard';
}
