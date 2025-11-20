/**
 * Role-based templates for onboarding wizard
 * Provides career-stage-specific guidance for headline, summary, and experience descriptions
 */

export interface RoleTemplate {
  id: string
  label: string
  description: string
  icon: string
  headlineTemplate: string
  summaryTemplate: string
  experienceDescriptionGuidance: string
}

export type RoleId =
  | 'student'
  | 'recent_graduate'
  | 'junior_professional'
  | 'mid_level_professional'
  | 'senior_professional'
  | 'freelancer'

export const ROLE_TEMPLATES: Record<RoleId, RoleTemplate> = {
  student: {
    id: 'student',
    label: 'Student',
    description: 'Currently enrolled in college or university',
    icon: 'GraduationCap',
    headlineTemplate: '{Major} Student at {University}',
    summaryTemplate:
      'Passionate {major} student with hands-on experience in {skills}. Eager to apply academic knowledge to real-world challenges.',
    experienceDescriptionGuidance:
      'Focus on internships, coursework projects, and campus activities. Highlight what you learned and how you applied it.',
  },

  recent_graduate: {
    id: 'recent_graduate',
    label: 'Recent Graduate',
    description: 'Graduated within the past 2 years',
    icon: 'Trophy',
    headlineTemplate: '{Degree} Graduate | Aspiring {Role}',
    summaryTemplate:
      'Recent {degree} graduate with strong foundation in {skills}. Seeking opportunities to launch career in {field}.',
    experienceDescriptionGuidance:
      'Emphasize academic projects, internships, and transferable skills. Show how your education prepared you for professional work.',
  },

  junior_professional: {
    id: 'junior_professional',
    label: 'Junior Professional (0-3 years)',
    description: 'Early-career professional with foundational experience',
    icon: 'Briefcase',
    headlineTemplate: 'Junior {Role} | {Specialization}',
    summaryTemplate:
      'Results-driven {role} with {years} years of experience in {industry}. Skilled in {skills}.',
    experienceDescriptionGuidance:
      'Highlight specific contributions and measurable outcomes. Show growth from entry-level to increasing responsibility.',
  },

  mid_level_professional: {
    id: 'mid_level_professional',
    label: 'Mid-Level Professional (3-7 years)',
    description: 'Experienced professional with proven track record',
    icon: 'TrendingUp',
    headlineTemplate: '{Role} | {Years}+ Years in {Industry}',
    summaryTemplate:
      'Accomplished {role} with {years}+ years driving impact in {industry}. Expert in {skills}.',
    experienceDescriptionGuidance:
      'Focus on leadership, cross-functional collaboration, and strategic impact. Quantify results (revenue, efficiency, team growth).',
  },

  senior_professional: {
    id: 'senior_professional',
    label: 'Senior Professional (7+ years)',
    description: 'Seasoned leader with extensive expertise',
    icon: 'Crown',
    headlineTemplate: 'Senior {Role} | {Specialization} Leader',
    summaryTemplate:
      'Strategic {role} with {years}+ years leading high-performing teams. Deep expertise in {skills}.',
    experienceDescriptionGuidance:
      'Emphasize strategic vision, team leadership, and business outcomes. Showcase mentorship, organizational impact, and industry influence.',
  },

  freelancer: {
    id: 'freelancer',
    label: 'Freelancer / Consultant',
    description: 'Independent contractor or consultant',
    icon: 'Laptop',
    headlineTemplate: 'Freelance {Role} | {Specialization}',
    summaryTemplate:
      'Independent {role} helping clients achieve {outcome} through {skills}.',
    experienceDescriptionGuidance:
      'Highlight client diversity, project outcomes, and specialized expertise. Mention notable clients or industries served.',
  },
}

/**
 * Get role template by ID
 */
export function getRoleTemplate(roleId: RoleId): RoleTemplate {
  return ROLE_TEMPLATES[roleId]
}

/**
 * Get all role templates as array
 */
export function getAllRoleTemplates(): RoleTemplate[] {
  return Object.values(ROLE_TEMPLATES)
}

/**
 * Validate if a role ID is valid
 */
export function isValidRoleId(roleId: string): roleId is RoleId {
  return roleId in ROLE_TEMPLATES
}
