/**
 * Stress-test seed script — generates 1000 notes for performance testing.
 * 700 text notes + 300 checklist notes across 10 folders with varied colors.
 */

import { expoDb } from '../db/db';

const now = Math.floor(Date.now() / 1000);
let idCounter = 0;

function uid(prefix: string): string {
  idCounter++;
  return `s_${prefix}_${idCounter}_${(now + idCounter) % 999999}`;
}

// ── Content Pools ──────────────────────────────────────────

const COLORS = [
  '#FFFFFF', '#FAAFA8', '#F39F76', '#FFF8B8', '#E2F6D3', '#B4DDD3',
  '#D4E4ED', '#AECCDC', '#D3BFDB', '#F6E2DD', '#E9E3D4', '#EFEFF1',
];

const FOLDER_DEFS = [
  { name: '💼 Work',       color: '#4F46E5', icon: 'briefcase' },
  { name: '💡 Ideas',      color: '#F59E0B', icon: 'bulb' },
  { name: '🏋️ Fitness',   color: '#10B981', icon: 'fitness' },
  { name: '📚 Study',      color: '#8B5CF6', icon: 'book' },
  { name: '🏠 Personal',   color: '#EC4899', icon: 'home' },
  { name: '💰 Finance',    color: '#059669', icon: 'cash' },
  { name: '🎵 Music',      color: '#6366F1', icon: 'musical-notes' },
  { name: '✈️ Travel',     color: '#0EA5E9', icon: 'airplane' },
  { name: '🍳 Recipes',    color: '#EF4444', icon: 'restaurant' },
  { name: '🔧 Projects',   color: '#64748B', icon: 'construct' },
];

const TITLES = [
  'Meeting Notes', 'Project Roadmap', 'API Design', 'Bug Fixes', 'Sprint Planning',
  'Code Review Feedback', 'Architecture Decisions', 'Database Schema', 'Deployment Steps', 'Performance Audit',
  'Morning Routine', 'Evening Routine', 'Weekly Goals', 'Monthly Targets', 'Year-End Review',
  'Book Summary', 'Course Notes', 'Research Paper', 'Study Plan', 'Exam Prep',
  'Workout Plan', 'Diet Tracker', 'Meal Prep Ideas', 'Supplement Stack', 'Running Log',
  'Budget Tracker', 'Investment Notes', 'Tax Filing', 'Expense Report', 'Savings Goals',
  'Song Lyrics', 'Guitar Chords', 'Playlist Ideas', 'Concert Wishlist', 'Music Theory',
  'Trip Itinerary', 'Packing List', 'Hotel Bookings', 'Flight Details', 'Travel Budget',
  'Butter Chicken', 'Pasta Recipe', 'Smoothie Bowl', 'Salad Dressing', 'Baking Notes',
  'Side Project', 'Feature Spec', 'User Feedback', 'Analytics Report', 'Design System',
  'App Ideas', 'Startup Pitch', 'Market Research', 'Competitor Analysis', 'GTM Strategy',
  'Meditation Log', 'Gratitude Journal', 'Dream Diary', 'Habit Tracker', 'Self-Care',
  'Team Standup', 'Client Call', 'Retrospective', 'Interview Prep', 'Resume Notes',
  'React Native Tips', 'TypeScript Tricks', 'CSS Snippets', 'Git Commands', 'Docker Setup',
  'Shopping List', 'Gift Ideas', 'Birthday Plans', 'Party Checklist', 'Home Repairs',
  'Podcast Notes', 'Documentary Ideas', 'Movie Watchlist', 'TV Shows', 'Game Notes',
  'Garden Plan', 'Plant Care', 'DIY Projects', 'Furniture Ideas', 'Room Decor',
  'Yoga Poses', 'Stretch Routine', 'Sleep Schedule', 'Water Intake', 'Step Count Log',
  'Newsletter Draft', 'Blog Post', 'Social Media Plan', 'Content Calendar', 'Branding Notes',
  'Quote Collection', 'Poem Draft', 'Story Outline', 'Character Sketch', 'Worldbuilding',
];

const PARAGRAPHS = [
  'This is an important note that captures key decisions and action items from today. Follow up with the team by end of week.',
  'Key takeaways:\n• Focus on user experience above all else\n• Ship MVP by next milestone\n• Gather feedback from beta testers\n• Iterate based on real usage data',
  'Research indicates a 40% improvement in productivity when tasks are broken into 25-minute focused intervals. Consider implementing the Pomodoro technique.',
  'Steps to complete:\n1. Draft initial design\n2. Get stakeholder approval\n3. Build prototype\n4. User testing round 1\n5. Iterate and refine\n6. Final QA pass\n7. Ship to production',
  'Remember:\n→ Keep it simple\n→ Write clean, readable code\n→ Document edge cases\n→ Test on multiple devices\n→ Monitor crash rates post-launch',
  'Budget breakdown for this quarter:\n• Infrastructure: ₹15,000/mo\n• Marketing: ₹8,000/mo\n• Tools & Subscriptions: ₹3,500/mo\n• Contingency: ₹5,000\n\nTotal monthly burn: ₹31,500',
  'The architecture should follow clean separation of concerns:\n- UI Layer (React Native components)\n- State Layer (Zustand stores)\n- Data Layer (SQLite repositories)\n- Service Layer (business logic)',
  '🎯 Goals for this week:\n1. Complete feature implementation\n2. Write unit tests (>80% coverage)\n3. Code review for team PRs\n4. Update documentation\n5. Prepare demo for stakeholders',
  'Interesting patterns observed in user behavior:\n• 70% users prefer dark mode\n• Average session: 4.2 minutes\n• Most active time: 9-11 PM\n• Top feature: Quick notes\n• Least used: Voice memos',
  'Debugging checklist:\n1. Check console logs for errors\n2. Verify network requests\n3. Inspect component state\n4. Check for memory leaks\n5. Profile render performance\n6. Test on low-end devices',
  'Recipe: Quick Oatmeal Bowl\n\n• 1/2 cup oats\n• 1 cup milk\n• 1 tbsp honey\n• Handful of berries\n• Chia seeds\n\nCook oats in milk for 3 min. Top with berries, honey, and chia.',
  'Fitness goals:\n💪 Bench: 80kg → 100kg\n🏃 5K time: 28min → 24min\n🧘 Flexibility: Touch toes\n⚖️ Weight: Maintain 75kg\n\nTimeline: 6 months',
  '"The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb\n\nApply this to learning, investing, and building.',
  'Travel essentials:\n• Passport & visa copies\n• Universal adapter\n• Portable charger (20000mAh)\n• Noise-cancelling headphones\n• Offline maps downloaded\n• Basic first-aid kit',
  'Design principles to follow:\n1. Consistency over novelty\n2. Accessibility is not optional\n3. White space is your friend\n4. Progressive disclosure\n5. Feedback for every action\n6. Error prevention > error handling',
];

const CHECKLIST_TEMPLATES = [
  { title: 'Shopping List', items: ['Milk', 'Bread', 'Eggs', 'Chicken', 'Rice', 'Vegetables', 'Fruits', 'Yogurt'] },
  { title: 'Sprint Tasks', items: ['Setup project', 'Create API endpoints', 'Write unit tests', 'Code review', 'Deploy to staging', 'QA testing'] },
  { title: 'Morning Routine', items: ['Wake up at 6 AM', 'Meditate 10 min', 'Exercise 30 min', 'Cold shower', 'Healthy breakfast', 'Plan the day'] },
  { title: 'Trip Packing', items: ['Passport', 'Charger', 'Clothes (3 days)', 'Toiletries', 'Headphones', 'Snacks', 'Travel pillow', 'Adapter'] },
  { title: 'Home Cleaning', items: ['Vacuum floors', 'Clean bathroom', 'Wash dishes', 'Laundry', 'Organize desk', 'Take out trash'] },
  { title: 'Weekly Goals', items: ['Read 50 pages', 'Gym 4 times', 'No junk food', 'Call family', 'Side project 2hrs', 'Sleep by 11 PM'] },
  { title: 'App Launch', items: ['Final QA', 'Update screenshots', 'Write release notes', 'Bump version', 'Build APK', 'Submit to Play Store'] },
  { title: 'Meeting Prep', items: ['Review agenda', 'Prepare slides', 'Gather metrics', 'Test demo', 'Send calendar invite', 'Book room'] },
  { title: 'Grocery Run', items: ['Bananas', 'Almonds', 'Green tea', 'Olive oil', 'Oats', 'Peanut butter', 'Dark chocolate'] },
  { title: 'Project Setup', items: ['Init git repo', 'Setup CI/CD', 'Configure linting', 'Add README', 'Setup database', 'Deploy staging'] },
  { title: 'Fitness Plan', items: ['Bench press 4x8', 'Squats 4x10', 'Pull-ups 3xMax', 'Plank 3x60s', 'Cardio 20min', 'Stretching'] },
  { title: 'Birthday Party', items: ['Book venue', 'Send invites', 'Order cake', 'Buy decorations', 'Arrange DJ', 'Plan games', 'Get gifts'] },
  { title: 'Code Review', items: ['Check naming conventions', 'Verify error handling', 'Look for memory leaks', 'Test edge cases', 'Review performance'] },
  { title: 'Finance Check', items: ['Review bank statement', 'Pay credit card', 'Check SIP status', 'Update budget', 'File expense claims'] },
  { title: 'Content Plan', items: ['Draft blog post', 'Design social graphics', 'Schedule tweets', 'Record video', 'Edit newsletter', 'Engage comments'] },
];

// ── Helpers ──────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickIndex(len: number): number {
  return Math.floor(Math.random() * len);
}

function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

// ── Main Seed Function ──────────────────────────────

export async function seedDemoData(): Promise<{ folders: number; notes: number; checklists: number }> {
  idCounter = 0;

  const TEXT_COUNT = 700;
  const CHECKLIST_COUNT = 300;
  const TOTAL = TEXT_COUNT + CHECKLIST_COUNT;
  let totalChecklistItems = 0;

  // Ensure folders exist and collect valid IDs
  const folderIds: string[] = [];

  try {
    // ── Batch 1: Folders ──
    expoDb.execSync('BEGIN TRANSACTION;');

    for (let i = 0; i < FOLDER_DEFS.length; i++) {
      const f = FOLDER_DEFS[i];
      let existingId: string | null = null;
      try {
        const rows = expoDb.getAllSync<{ id: string }>(
          `SELECT id FROM folders WHERE name = '${escSql(f.name)}' LIMIT 1;`
        );
        if (rows && rows.length > 0) {
          existingId = rows[0].id;
        }
      } catch (_) {}

      if (existingId) {
        folderIds.push(existingId);
      } else {
        const newId = uid('f');
        expoDb.execSync(
          `INSERT INTO folders (id, name, color, icon, order_index, created_at) VALUES ('${newId}', '${escSql(f.name)}', '${f.color}', '${f.icon}', ${i}, ${now - i * 3600})`
        );
        folderIds.push(newId);
      }
    }

    expoDb.execSync('COMMIT;');

    // ── Batch 2: Text Notes (in chunks of 100) ──
    for (let chunk = 0; chunk < TEXT_COUNT; chunk += 100) {
      expoDb.execSync('BEGIN TRANSACTION;');
      const end = Math.min(chunk + 100, TEXT_COUNT);

      for (let i = chunk; i < end; i++) {
        const noteId = uid('n');
        const titleBase = TITLES[i % TITLES.length];
        const suffix = i >= TITLES.length ? ` #${Math.floor(i / TITLES.length) + 1}` : '';
        const title = titleBase + suffix;
        const content = PARAGRAPHS[i % PARAGRAPHS.length];
        const color = COLORS[i % COLORS.length];
        const isPinned = i < 15 ? 1 : (Math.random() < 0.12 ? 1 : 0); // ~12% pinned
        const folderId = folderIds[i % folderIds.length];
        const createdAt = now - (TOTAL - i) * 600; // stagger by 10 min each

        expoDb.execSync(
          `INSERT INTO notes (id, folder_id, title, content, note_type, color, is_pinned, is_archived, is_deleted, is_locked, created_at, updated_at) VALUES ('${noteId}', '${folderId}', '${escSql(title)}', '${escSql(content)}', 'text', '${color}', ${isPinned}, 0, 0, 0, ${createdAt}, ${createdAt})`
        );

        // FTS index
        try {
          expoDb.execSync(
            `INSERT INTO notes_fts (note_id, title, content) VALUES ('${noteId}', '${escSql(title)}', '${escSql(content)}')`
          );
        } catch (_) {}
      }

      expoDb.execSync('COMMIT;');
    }

    // ── Batch 3: Checklist Notes (in chunks of 100) ──
    for (let chunk = 0; chunk < CHECKLIST_COUNT; chunk += 100) {
      expoDb.execSync('BEGIN TRANSACTION;');
      const end = Math.min(chunk + 100, CHECKLIST_COUNT);

      for (let i = chunk; i < end; i++) {
        const noteId = uid('cn');
        const template = CHECKLIST_TEMPLATES[i % CHECKLIST_TEMPLATES.length];
        const suffix = i >= CHECKLIST_TEMPLATES.length ? ` #${Math.floor(i / CHECKLIST_TEMPLATES.length) + 1}` : '';
        const title = template.title + suffix;
        const color = COLORS[(i + 3) % COLORS.length]; // offset for variety
        const isPinned = i < 5 ? 1 : 0;
        const folderId = folderIds[(i + 5) % folderIds.length];
        const createdAt = now - (CHECKLIST_COUNT - i) * 900;

        expoDb.execSync(
          `INSERT INTO notes (id, folder_id, title, content, note_type, color, is_pinned, is_archived, is_deleted, is_locked, created_at, updated_at) VALUES ('${noteId}', '${folderId}', '${escSql(title)}', '', 'checklist', '${color}', ${isPinned}, 0, 0, 0, ${createdAt}, ${createdAt})`
        );

        // Insert checklist items
        for (let j = 0; j < template.items.length; j++) {
          const itemId = uid('ci');
          const isDone = Math.random() < 0.4 ? 1 : 0; // 40% completed
          expoDb.execSync(
            `INSERT INTO checklist_items (id, note_id, text, is_completed, order_index, created_at) VALUES ('${itemId}', '${noteId}', '${escSql(template.items[j])}', ${isDone}, ${j}, ${createdAt})`
          );
          totalChecklistItems++;
        }

        // FTS
        try {
          expoDb.execSync(
            `INSERT INTO notes_fts (note_id, title, content) VALUES ('${noteId}', '${escSql(title)}', '')`
          );
        } catch (_) {}
      }

      expoDb.execSync('COMMIT;');
    }

    return {
      folders: FOLDER_DEFS.length,
      notes: TOTAL,
      checklists: totalChecklistItems,
    };
  } catch (error) {
    try { expoDb.execSync('ROLLBACK;'); } catch (_) {}
    console.error('Seed demo data failed:', error);
    throw error;
  }
}

// ── Curated Demo Data (17 Notes for Play Store Screenshots) ──
export async function seedCuratedDemoData(): Promise<{ folders: number; notes: number; checklists: number }> {
  idCounter = 0;
  const demoFolders = [
    { id: uid('f'), name: '💼 Work',     color: '#4F46E5', icon: 'briefcase' },
    { id: uid('f'), name: '💡 Ideas',    color: '#F59E0B', icon: 'bulb' },
    { id: uid('f'), name: '🏋️ Fitness',  color: '#10B981', icon: 'fitness' },
    { id: uid('f'), name: '📚 Study',    color: '#8B5CF6', icon: 'book' },
    { id: uid('f'), name: '🏠 Personal', color: '#EC4899', icon: 'home' },
  ];

  const curatedNotes = [
    {
      title: '🎯 Project Roadmap Q4',
      content: 'Key Milestones:\n• Launch v2.0 with redesigned Keep UI\n• User feedback collection (Oct 20-30)\n• Performance optimization & SQLite FTS5\n• Holiday feature drop\n\nSuccess Metrics:\n→ 4.8+ star rating on Play Store\n→ < 50ms search latency',
      color: '#FAAFA8',
      pinned: 1,
      folderIdx: 0,
    },
    {
      title: '💡 App Feature Ideas',
      content: 'Next release brainstorm:\n1. Biometric app lock per folder\n2. Audio memo transcription\n3. Export notes to Markdown/PDF\n4. Cloud sync with WebDAV\n5. Widget support for home screen',
      color: '#FFF8B8',
      pinned: 1,
      folderIdx: 1,
    },
    {
      title: '🏋️ Weekly Workout Routine',
      content: 'Monday: Chest & Triceps\nTuesday: Back & Biceps\nWednesday: Rest / Light Cardio\nThursday: Shoulders & Abs\nFriday: Legs & Calves\nSaturday: 5K Morning Run\nSunday: Active Recovery & Mobility',
      color: '#B4DDD3',
      pinned: 1,
      folderIdx: 2,
    },
    {
      title: '📚 Books to Read This Year',
      content: '1. Designing Data-Intensive Applications — Martin Kleppmann\n2. Atomic Habits — James Clear\n3. The Pragmatic Programmer\n4. Deep Work — Cal Newport\n5. Clean Architecture — Robert C. Martin',
      color: '#D3BFDB',
      pinned: 0,
      folderIdx: 3,
    },
    {
      title: '🏠 Apartment To-Do',
      content: 'Weekend maintenance:\n• Fix balcony light fixture\n• Plant monstera & snake plant\n• Organize work desk cables\n• Order water filter replacement',
      color: '#F39F76',
      pinned: 0,
      folderIdx: 4,
    },
    {
      title: '🍳 Butter Chicken Recipe',
      content: 'Ingredients:\n• 500g chicken thigh, cubed\n• 2 tbsp Greek yogurt + ginger garlic paste\n• Pureed tomatoes + cashew paste\n• Butter, kasuri methi, heavy cream\n\nMarinate 2 hrs, roast, simmer sauce 20 min!',
      color: '#F6E2DD',
      pinned: 0,
      folderIdx: 4,
    },
    {
      title: '💰 Monthly Budget & SIPs',
      content: 'Income allocation (50/30/20 rule):\n• Index Funds: ₹25,000/mo\n• Emergency Fund: ₹10,000/mo\n• Rent & Utilities: ₹28,000\n• Discretionary: ₹15,000',
      color: '#E2F6D3',
      pinned: 0,
      folderIdx: 0,
    },
    {
      title: '🎵 Favorite Chill Tracks',
      content: '• Tycho — A Walk\n• Bonobo — Kerala\n• Ludovico Einaudi — Nuvole Bianche\n• FKJ — Ylang Ylang\n• Emancipator — Soon It Will Be Cold Enough',
      color: '#D4E4ED',
      pinned: 0,
      folderIdx: 4,
    },
    {
      title: '✈️ Japan Trip Bucket List',
      content: 'Places to visit:\n• Tokyo: Akihabara & Shinjuku Gyoen\n• Kyoto: Fushimi Inari at dawn\n• Osaka: Dotonbori street food\n• Mount Fuji: Lake Kawaguchiko view\n• Nara: Deer park',
      color: '#AECCDC',
      pinned: 0,
      folderIdx: 4,
    },
    {
      title: '⚡ React Native Performance Tips',
      content: '• Use getItemLayout on FlatList\n• Remove console.logs in production\n• Memoize expensive renderItem with React.memo\n• Use SQLite WAL mode for fast queries\n• Keep animations on the UI thread with Reanimated',
      color: '#E9E3D4',
      pinned: 0,
      folderIdx: 0,
    },
    {
      title: '🧘 Morning Mindfulness Routine',
      content: '1. Wake at 6:30 AM (no phone for 30m)\n2. 500ml warm water with lemon\n3. 10 minutes breath meditation\n4. Write 3 things grateful for\n5. Review daily top 3 priorities',
      color: '#FFFFFF',
      pinned: 0,
      folderIdx: 2,
    },
    {
      title: '🔧 Setup New Mac Dev Environment',
      content: 'Steps:\n• brew install node watchman git\n• nvm use --lts\n• Setup SSH keys & GPG signing\n• Install VSCode extensions\n• Android Studio SDK & adb configuration',
      color: '#EFEFF1',
      pinned: 0,
      folderIdx: 0,
    },
  ];

  const curatedChecklists = [
    {
      title: '🛒 Grocery List for the Week',
      color: '#FFF8B8',
      pinned: 1,
      folderIdx: 4,
      items: [
        { text: 'Greek yogurt & oat milk', done: true },
        { text: 'Sourdough bread', done: true },
        { text: 'Organic eggs (dozen)', done: false },
        { text: 'Avocados & tomatoes', done: false },
        { text: 'Dark roast coffee beans', done: true },
        { text: 'Olive oil & sea salt', done: false },
      ],
    },
    {
      title: '🚀 Notelo Play Store Release Checklist',
      color: '#E2F6D3',
      pinned: 1,
      folderIdx: 0,
      items: [
        { text: 'Generate signed Release AAB', done: true },
        { text: 'Take high-res phone screenshots', done: false },
        { text: 'Write feature release notes', done: true },
        { text: 'Privacy policy URL verified', done: true },
        { text: 'Test offline backup & restore', done: true },
        { text: 'Submit to Google Play Console', done: false },
      ],
    },
    {
      title: '🎒 Weekend Hiking Gear Checklist',
      color: '#B4DDD3',
      pinned: 0,
      folderIdx: 2,
      items: [
        { text: '35L daypack + rain cover', done: true },
        { text: 'Trekking poles', done: true },
        { text: '2L hydration bladder filled', done: false },
        { text: 'Energy gels & protein bars', done: false },
        { text: 'First-aid kit + blister tape', done: true },
        { text: 'Power bank & charging cable', done: false },
      ],
    },
    {
      title: '🏠 Apartment Deep Clean Checklist',
      color: '#F6E2DD',
      pinned: 0,
      folderIdx: 4,
      items: [
        { text: 'Vacuum rugs and mop hardwood', done: true },
        { text: 'Dust bookshelves and monitors', done: true },
        { text: 'Wipe kitchen backsplash & stove', done: false },
        { text: 'Change bedsheets and pillowcases', done: false },
        { text: 'Empty all recycle bins', done: true },
      ],
    },
    {
      title: '💡 Startup Validation Checklist',
      color: '#FAAFA8',
      pinned: 0,
      folderIdx: 1,
      items: [
        { text: 'Interview 10 potential users', done: true },
        { text: 'Identify top 3 pain points', done: true },
        { text: 'Create clickable Figma prototype', done: true },
        { text: 'Run usability tests with prototype', done: false },
        { text: 'Analyze pricing willingness', done: false },
      ],
    },
  ];

  try {
    expoDb.execSync('BEGIN TRANSACTION;');

    // 1. Folders
    const finalFolderIds: string[] = [];
    for (let i = 0; i < demoFolders.length; i++) {
      const f = demoFolders[i];
      let existingId: string | null = null;
      try {
        const rows = expoDb.getAllSync<{ id: string }>(
          `SELECT id FROM folders WHERE name = '${escSql(f.name)}' LIMIT 1;`
        );
        if (rows && rows.length > 0) {
          existingId = rows[0].id;
        }
      } catch (_) {}

      if (existingId) {
        finalFolderIds.push(existingId);
      } else {
        expoDb.execSync(
          `INSERT INTO folders (id, name, color, icon, order_index, created_at) VALUES ('${f.id}', '${escSql(f.name)}', '${f.color}', '${f.icon}', ${i}, ${now - i * 3600})`
        );
        finalFolderIds.push(f.id);
      }
    }

    // 2. Text Notes
    for (let i = 0; i < curatedNotes.length; i++) {
      const n = curatedNotes[i];
      const noteId = uid('n');
      const folderId = finalFolderIds[n.folderIdx];
      const createdAt = now - (curatedNotes.length - i) * 1800;

      expoDb.execSync(
        `INSERT INTO notes (id, folder_id, title, content, note_type, color, is_pinned, is_archived, is_deleted, is_locked, created_at, updated_at) VALUES ('${noteId}', '${folderId}', '${escSql(n.title)}', '${escSql(n.content)}', 'text', '${n.color}', ${n.pinned}, 0, 0, 0, ${createdAt}, ${createdAt})`
      );

      try {
        expoDb.execSync(
          `INSERT INTO notes_fts (note_id, title, content) VALUES ('${noteId}', '${escSql(n.title)}', '${escSql(n.content)}')`
        );
      } catch (_) {}
    }

    // 3. Checklist Notes
    let totalItems = 0;
    for (let i = 0; i < curatedChecklists.length; i++) {
      const c = curatedChecklists[i];
      const noteId = uid('cn');
      const folderId = finalFolderIds[c.folderIdx];
      const createdAt = now - (curatedChecklists.length - i) * 2400;

      expoDb.execSync(
        `INSERT INTO notes (id, folder_id, title, content, note_type, color, is_pinned, is_archived, is_deleted, is_locked, created_at, updated_at) VALUES ('${noteId}', '${folderId}', '${escSql(c.title)}', '', 'checklist', '${c.color}', ${c.pinned}, 0, 0, 0, ${createdAt}, ${createdAt})`
      );

      for (let j = 0; j < c.items.length; j++) {
        const item = c.items[j];
        const itemId = uid('ci');
        expoDb.execSync(
          `INSERT INTO checklist_items (id, note_id, text, is_completed, order_index, created_at) VALUES ('${itemId}', '${noteId}', '${escSql(item.text)}', ${item.done ? 1 : 0}, ${j}, ${createdAt})`
        );
        totalItems++;
      }

      try {
        expoDb.execSync(
          `INSERT INTO notes_fts (note_id, title, content) VALUES ('${noteId}', '${escSql(c.title)}', '')`
        );
      } catch (_) {}
    }

    expoDb.execSync('COMMIT;');

    return {
      folders: demoFolders.length,
      notes: curatedNotes.length + curatedChecklists.length,
      checklists: totalItems,
    };
  } catch (error) {
    try { expoDb.execSync('ROLLBACK;'); } catch (_) {}
    console.error('Seed curated demo data failed:', error);
    throw error;
  }
}

// ── Clear Seeded Data Helper ──
export async function clearSeededData(): Promise<{ deletedNotes: number; deletedFolders: number }> {
  try {
    expoDb.execSync('BEGIN TRANSACTION;');

    // Count before deleting
    let deletedNotes = 0;
    let deletedFolders = 0;
    try {
      const countRes = expoDb.getAllSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM notes WHERE id LIKE 's_%' OR id LIKE 'demo_%';"
      );
      deletedNotes = countRes[0]?.count ?? 0;
    } catch (_) {}

    try {
      const fCountRes = expoDb.getAllSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM folders WHERE id LIKE 's_%' OR id LIKE 'demo_%';"
      );
      deletedFolders = fCountRes[0]?.count ?? 0;
    } catch (_) {}

    // Delete checklist items
    expoDb.execSync(
      "DELETE FROM checklist_items WHERE note_id IN (SELECT id FROM notes WHERE id LIKE 's_%' OR id LIKE 'demo_%');"
    );

    // Delete FTS entries
    try {
      expoDb.execSync(
        "DELETE FROM notes_fts WHERE note_id LIKE 's_%' OR note_id LIKE 'demo_%';"
      );
    } catch (_) {}

    // Delete notes
    expoDb.execSync("DELETE FROM notes WHERE id LIKE 's_%' OR id LIKE 'demo_%';");

    // Delete folders
    expoDb.execSync("DELETE FROM folders WHERE id LIKE 's_%' OR id LIKE 'demo_%';");

    expoDb.execSync('COMMIT;');

    return { deletedNotes, deletedFolders };
  } catch (error) {
    try { expoDb.execSync('ROLLBACK;'); } catch (_) {}
    console.error('Clear seeded data failed:', error);
    throw error;
  }
}

