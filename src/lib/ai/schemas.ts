export const ideaAssistantSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    problem_clarity: { type: 'string' },
    solution_ideas: { type: 'array', items: { type: 'string' } },
    technical_challenges: { type: 'array', items: { type: 'string' } },
    suggested_skills: { type: 'array', items: { type: 'string' } },
    prototype_roadmap: { type: 'array', items: { type: 'string' } },
    existing_technologies: { type: 'array', items: { type: 'string' } },
    research_directions: { type: 'array', items: { type: 'string' } },
    collaborator_types: { type: 'array', items: { type: 'string' } },
    commercial_opportunities: { type: 'array', items: { type: 'string' } },
    established_facts: { type: 'array', items: { type: 'string' } },
    unverified_claims: { type: 'array', items: { type: 'string' } },
    disclaimers: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'problem_clarity', 'solution_ideas', 'technical_challenges',
    'suggested_skills', 'prototype_roadmap', 'established_facts', 'unverified_claims', 'disclaimers'],
};

export interface IdeaAssistantResult {
  summary: string;
  problem_clarity: string;
  solution_ideas: string[];
  technical_challenges: string[];
  suggested_skills: string[];
  prototype_roadmap: string[];
  existing_technologies?: string[];
  research_directions?: string[];
  collaborator_types?: string[];
  commercial_opportunities?: string[];
  established_facts: string[];
  unverified_claims: string[];
  disclaimers: string[];
}

const FALLBACK: IdeaAssistantResult = {
  summary: 'AI assistance is unavailable right now. Here is a structured self-check instead.',
  problem_clarity: 'State the problem in one sentence, then name who is hurt by it and how often.',
  solution_ideas: ['Draft the smallest version that delivers the core value.', 'List two alternatives to your current approach.'],
  technical_challenges: ['Identify the hardest technical risk.', 'Name what you do not yet know how to build.'],
  suggested_skills: ['Define the top 3–5 skills a team would need.'],
  prototype_roadmap: ['Week 1: validate the problem with 5 conversations.', 'Week 2: build the narrowest demo.', 'Week 3: test with real users.'],
  established_facts: [],
  unverified_claims: ['None recorded — add any claims you made here and mark them for verification.'],
  disclaimers: ['This template is generated locally, not by a model.', 'AI never certifies originality or patentability.'],
};

export function isValidIdeaAssistantResult(v: unknown): v is IdeaAssistantResult {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.summary === 'string' &&
    typeof o.problem_clarity === 'string' &&
    Array.isArray(o.solution_ideas) &&
    Array.isArray(o.technical_challenges) &&
    Array.isArray(o.suggested_skills) &&
    Array.isArray(o.prototype_roadmap) &&
    Array.isArray(o.established_facts) &&
    Array.isArray(o.unverified_claims) &&
    Array.isArray(o.disclaimers)
  );
}