export const EMPLOYEE = {
  id: 'emp_001',
  name: 'Alex Engineer',
  role: 'Senior Frontend Developer',
  joinedAt: '2022-03-15',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
};

export const SKILLS = [
  { id: 's1', name: 'Technical Mastery', description: 'Expertise in core tech stack', color: '#38bdf8' }, // Sky Blue
  { id: 's2', name: 'Delivery & Execution', description: 'Reliability and speed of output', color: '#22d3ee' }, // Cyan
  { id: 's3', name: 'Communication', description: 'Clarity in writing and speaking', color: '#facc15' }, // Yellow
  { id: 's4', name: 'Leadership & Mentorship', description: 'Helping others grow', color: '#a855f7' }, // Purple
  { id: 's5', name: 'Strategic Thinking', description: 'Understanding the big picture', color: '#f43f5e' }, // Rose
  { id: 's6', name: 'Adaptability', description: 'Speed of learning new context', color: '#10b981' }, // Emerald
];

export const INITIAL_SCORES = {
  s1: 75, // Tech
  s2: 82, // Delivery
  s3: 45, // Comm
  s4: 30, // Leadership
  s5: 15, // Strategy
  s6: 60, // Adaptability
};

export const HISTORY = [
  { id: 1, skillId: 's1', delta: 5, reason: 'Completed Adv React Patterns', date: '2d ago' },
  { id: 2, skillId: 's2', delta: 2, reason: 'Shipped Project Alpha', date: '5d ago' },
  { id: 3, skillId: 's6', delta: 3, reason: 'Learned Rust Basics', date: '1w ago' },
];

export const COMPANY_NEEDS = [
  { skillId: 's5', priority: 'High', reason: 'Team needs more strategic input' },
  { skillId: 's1', priority: 'Medium', reason: 'Maintain technical edge' },
];


export const CONTENT_DB = [
  { id: 'c1', title: 'System Design Interview Guide', type: 'Course', skillId: 's1', minLevel: 60, xp: 5, duration: '2h 15m', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: 'c2', title: 'Lead a Tech Talk', type: 'Action', skillId: 's3', minLevel: 40, xp: 8, duration: '1h', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
  { id: 'c3', title: 'Mentor a Junior Dev', type: 'Action', skillId: 's4', minLevel: 20, xp: 10, duration: 'Ongoing', gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { id: 'c4', title: 'Product Strategy 101', type: 'Course', skillId: 's5', minLevel: 0, xp: 5, duration: '3h', gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' },
  { id: 'c5', title: 'Rust for JS Developers', type: 'Course', skillId: 's6', minLevel: 50, xp: 5, duration: '5h', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { id: 'c6', title: 'Advanced GraphQL Patterns', type: 'Course', skillId: 's1', minLevel: 70, xp: 8, duration: '3h', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  { id: 'c7', title: 'Negotiation for Engineers', type: 'Workshop', skillId: 's5', minLevel: 0, xp: 5, duration: '8h', gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' },
  { id: 'c8', title: 'AWS Solutions Architect', type: 'Cert', skillId: 's1', minLevel: 60, xp: 15, duration: '30h', gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' },
  { id: 'c9', title: 'Public Speaking Masterclass', type: 'Course', skillId: 's3', minLevel: 30, xp: 6, duration: '5h', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' },
  // New Long Courses
  { id: 'c10', title: 'Full Stack Security Standards', type: 'Course', skillId: 's1', minLevel: 50, xp: 12, duration: '12h', gradient: 'linear-gradient(135deg, #4b5563 0%, #111827 100%)' },
  { id: 'c11', title: 'Mastering Enterprise Scalability', type: 'Course', skillId: 's2', minLevel: 80, xp: 20, duration: '8h', gradient: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)' },
  { id: 'c12', title: 'Deep Dive into System Architecture', type: 'Course', skillId: 's1', minLevel: 90, xp: 25, duration: '15h', gradient: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' },
];
