// Role -> module mapping (decided by the builder, per the society brief).
// President has ALL access. Every other role sees only its own module(s)
// plus its own profile. Module keys are the 8 modules in the brief.

export const ROLES = [
  'President',
  'Vice President',
  'General Secretary',
  'Treasurer',
  'CV/Resume Reviewer',
  'Social Media Manager',
  'LinkedIn Mentor',
  'LinkedIn Lead Generation',
  'Research & Publication Manager',
  'Opportunity/Scholarship',
  'Job Board Manager',
  'Alumni Relation Head',
  'Logistic Head',
  'Event Manager',
  'Human Resource',
  'Graphic Designing',
  'Operation & Planning Manager',
  'International Officer',
  'Document Controller',
  'Workshop Training & Certification',
];

export const MODULES = [
  { key: 'admin', name: 'Admin', desc: 'Performance & analysis, member addition, all access, terms & policies' },
  { key: 'hr', name: 'HR', desc: 'Membership control, role recruitment' },
  { key: 'customer', name: 'Customer Relationship', desc: 'Customer issues, add tasks, event addition' },
  { key: 'research', name: 'Research', desc: 'Scholarship research, jobs board, companies contact, international competitions, projects research lead' },
  { key: 'administration', name: 'Administration Management', desc: 'Accountant, performance analysis, docs management' },
  { key: 'companies', name: 'Companies Connectivity', desc: 'Event addition, performance success rate' },
  { key: 'profiles', name: "Students' Profile Management", desc: 'CV / resume statuses, LinkedIn growth' },
  { key: 'settings', name: 'Settings', desc: 'Account, theme and society settings' },
];

// Primary module for each role (used in README + the dashboard "My module" hint).
export const ROLE_PRIMARY_MODULE = {
  'President': 'ALL',
  'Vice President': 'admin',
  'General Secretary': 'admin',
  'Treasurer': 'administration',
  'CV/Resume Reviewer': 'profiles',
  'Social Media Manager': 'profiles',
  'LinkedIn Mentor': 'profiles',
  'LinkedIn Lead Generation': 'profiles',
  'Research & Publication Manager': 'research',
  'Opportunity/Scholarship': 'research',
  'Job Board Manager': 'research',
  'Alumni Relation Head': 'companies',
  'Logistic Head': 'customer',
  'Event Manager': 'customer',
  'Human Resource': 'hr',
  'Graphic Designing': 'customer',
  'Operation & Planning Manager': 'customer',
  'International Officer': 'research',
  'Document Controller': 'administration',
  'Workshop Training & Certification': 'customer',
};

export const MODULE_ROLES = {
  admin: ['Vice President', 'General Secretary'],
  hr: ['Human Resource', 'Vice President', 'General Secretary'],
  customer: ['Event Manager', 'Logistic Head', 'Operation & Planning Manager', 'Graphic Designing', 'Workshop Training & Certification'],
  research: ['Research & Publication Manager', 'Opportunity/Scholarship', 'Job Board Manager', 'International Officer'],
  administration: ['Treasurer', 'Document Controller', 'General Secretary'],
  companies: ['Alumni Relation Head', 'International Officer', 'Job Board Manager', 'Event Manager'],
  profiles: ['CV/Resume Reviewer', 'LinkedIn Mentor', 'LinkedIn Lead Generation', 'Social Media Manager'],
  settings: ['Vice President', 'General Secretary'],
};

export function canAccessModule(role, moduleKey) {
  if (!role || !moduleKey) return false;
  if (role === 'President') return true;
  return (MODULE_ROLES[moduleKey] || []).includes(role);
}

export function visibleModules(role) {
  return MODULES.filter((m) => canAccessModule(role, m.key));
}
