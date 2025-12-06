/**
 * DigiArtifact Workers Portal - Enhanced Presentation PDF Generator
 * 
 * Generates a comprehensive presentation document with detailed content
 * from analyzed codebase documentation.
 * 
 * Usage: node scripts/generate-presentation.js
 */

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Paths
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DOCUMENTS_DIR = path.join(__dirname, '..', 'documents');
const CONTENT_DIR = path.join(DOCUMENTS_DIR, 'content');
const OUTPUT_FILE = path.join(DOCUMENTS_DIR, 'DigiArtifact_Workers_Portal_Presentation.pdf');

// Brand Colors (RGB)
const COLORS = {
  gold: [204, 164, 59],
  obsidian: [15, 23, 42],
  slate: [51, 65, 85],
  white: [255, 255, 255],
  lightSlate: [148, 163, 184],
  darkSlate: [30, 41, 59],
  cyan: [0, 240, 255],
};

// Screenshot mappings
const SCREENSHOTS = [
  { file: 'Screenshot 2025-12-05 161908.png', title: 'Login Screen', description: 'Secure authentication with email and PIN system for team members.' },
  { file: 'Screenshot 2025-12-05 161924.png', title: 'Dashboard Overview', description: 'The main command center showing clock status, active time tracking, and quick actions.' },
  { file: 'Screenshot 2025-12-05 161934.png', title: 'Time Tracking', description: 'Real-time clock in/out with break management and session notes.' },
  { file: 'Screenshot 2025-12-05 161951.png', title: 'Block Schedule', description: 'Time-block planning for focused work sessions with the Pomodoro technique.' },
  { file: 'Screenshot 2025-12-05 162012.png', title: 'Journal System', description: 'Rich-text journaling with auto-save, tagging, and cloud sync.' },
  { file: 'Screenshot 2025-12-05 162030.png', title: 'Analytics Dashboard', description: 'Visual insights into productivity patterns and time allocation.' },
  { file: 'Screenshot 2025-12-05 162050.png', title: 'Project Management', description: 'Organize work by projects with color-coding and time tracking integration.' },
  { file: 'Screenshot 2025-12-05 162105.png', title: 'Goal Tracking', description: 'Set and track personal and professional goals with progress visualization.' },
  { file: 'Screenshot 2025-12-05 162123.png', title: 'Settings & Preferences', description: 'Customize your experience with themes, notifications, and storage options.' },
];

// Feature sections for detailed pages
const FEATURE_SECTIONS = [
  {
    title: 'Dashboard',
    subtitle: 'Command Center',
    content: [
      'The Dashboard is the central hub providing an at-a-glance view of work status.',
      '',
      'Key Components:',
      '- Clock Widget: Large, prominent clock in/out button with real-time timer',
      '- Quick Stats: Today\'s hours, weekly total, active projects, current streak',
      '- Focus Timer: Pomodoro-style sessions with configurable intervals',
      '- Body Doubling Timer: Virtual co-working for accountability',
      '- Today\'s Agenda: Scheduled blocks and planned work sessions',
      '- Quick Notes Widget: Rapid note capture that auto-saves to Journal',
      '- Gamification Widget: XP progress, level, and achievements',
      '- Weekly Chart: Visual pattern of hours worked per day',
      '',
      'Layout: Three-column responsive grid optimized for desktop and mobile.'
    ]
  },
  {
    title: 'Time Tracking',
    subtitle: 'Core Functionality',
    content: [
      'Precise work hour tracking with project assignment and break management.',
      '',
      'Features:',
      '- One-click clock in/out with automatic timestamps',
      '- Project assignment with color-coded indicators',
      '- Break management with pause/resume functionality',
      '- Session notes for adding context to entries',
      '',
      'Calculations:',
      '- Net Hours = (clock_out - clock_in) - break_minutes',
      '- Weekly Hours = Sum of all net hours (Mon-Sun)',
      '',
      'Data stored in Cloudflare D1 with real-time sync across devices.'
    ]
  },
  {
    title: 'Block Schedule',
    subtitle: 'Time-Block Planning',
    content: [
      'Pre-plan your workday with structured focus blocks based on proven methodologies.',
      '',
      'Templates:',
      '- Standard Workday: 4 blocks, 8 hours total',
      '- Pomodoro Extended: 8 sessions (25 min work, 5 min break)',
      '- Deep Work Day: 3 long sessions for complex work',
      '- Flexible Half-Day: 4-hour schedule',
      '',
      'Features:',
      '- Visual timeline with color-coded blocks',
      '- Block completion tracking with XP rewards',
      '- Carry-over system for incomplete days',
      '- Customizable start times',
      '',
      'Integrated with gamification for motivation.'
    ]
  },
  {
    title: 'Journal System',
    subtitle: 'Personal Archive',
    content: [
      'Rich-text journaling for capturing notes, thoughts, and reflections.',
      '',
      'Editor Features:',
      '- Bold, italic, underline, strikethrough',
      '- Headings, block quotes, lists',
      '- Links and code blocks',
      '- Auto-save after 3 seconds of inactivity',
      '',
      'Organization:',
      '- Tagging system for filtering',
      '- Search by title, content, or tags',
      '- Multiple source types (quick note, clock note, etc.)',
      '- PDF export per entry',
      '',
      'Storage: Cloudflare D1 or personal Google Drive (unlimited).'
    ]
  },
  {
    title: 'Analytics',
    subtitle: 'Productivity Insights',
    content: [
      'Comprehensive data visualization of work patterns.',
      '',
      'Views:',
      '- Week, Month, and Quarter periods',
      '- Comparison mode vs. previous period',
      '',
      'Charts:',
      '- Daily hours (line/bar)',
      '- Productivity score over time',
      '- Project breakdown (pie chart)',
      '- Hourly distribution heat map',
      '',
      'Auto-generated Insights:',
      '- Positive: "You worked 15% more than last week!"',
      '- Neutral: "Your peak hours are 9 AM - 11 AM"',
      '- Warning: "Remember to take breaks!"'
    ]
  },
  {
    title: 'Goal Tracking',
    subtitle: 'Achievement System',
    content: [
      'Define targets and track progress with visual feedback.',
      '',
      'Goal Types:',
      '- Total Hours: Overall time targets',
      '- Project Goals: Hours on specific projects',
      '',
      'Periods: Daily, Weekly, Monthly, Custom',
      '',
      'Templates:',
      '- Full-Time Week (40h)',
      '- Part-Time Week (20h)',
      '- Daily Focus (8h)',
      '- Work-Life Balance (35h)',
      '',
      'Progress Tracking:',
      '- Real-time progress bars',
      '- Streak counting for consecutive completions',
      '- XP rewards for achievements'
    ]
  },
  {
    title: 'Gamification',
    subtitle: 'XP & Achievements',
    content: [
      'Game-like mechanics to motivate consistent work.',
      '',
      'XP Sources:',
      '- Clock in/out: +10 XP each',
      '- Complete work block: +25 XP',
      '- Complete all daily blocks: +50 XP bonus',
      '- Achieve a goal: +100 XP',
      '',
      'Level System:',
      '- Levels 1-5: Novice',
      '- Levels 6-10: Apprentice',
      '- Levels 11-15: Journeyman',
      '- Levels 16-20: Expert',
      '- Levels 21+: Master',
      '',
      'Achievements: First Clock In, 7-Day Streak, 100 Hours Worked, etc.'
    ]
  },
  {
    title: 'Technical Stack',
    subtitle: 'Architecture',
    content: [
      'Modern, performant, and globally distributed.',
      '',
      'Frontend:',
      '- Next.js 14 with App Router',
      '- React 18 with TypeScript',
      '- Tailwind CSS custom design system',
      '',
      'Backend:',
      '- Cloudflare Workers (Edge computing)',
      '- Cloudflare D1 (SQLite at the edge)',
      '- RESTful API with JWT authentication',
      '',
      'Security:',
      '- PIN hashed with SHA-256',
      '- Role-based access control',
      '- HTTPS everywhere',
      '',
      'Deployment: Global edge network via Cloudflare'
    ]
  }
];

function createPDF() {
  console.log('Creating DigiArtifact Workers Portal Presentation (Enhanced)...\n');

  // Ensure directories exist
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }

  // Create PDF (A4 landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  let pageNumber = 1;

  // Helper function to add page number
  const addPageNumber = () => {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.lightSlate);
    doc.text(`${pageNumber}`, pageWidth - 15, pageHeight - 10);
    pageNumber++;
  };

  // Helper function to add header bar
  const addHeader = (title, subtitle = '') => {
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(...COLORS.obsidian);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 14);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin + doc.getTextWidth(title) + 10, 14);
    }
  };

  // ========== TITLE SLIDE ==========
  console.log('Page 1: Title slide...');
  
  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Gold accent bars
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

  // Title
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(52);
  doc.setFont('helvetica', 'bold');
  doc.text('DigiArtifact', pageWidth / 2, 65, { align: 'center' });

  // Subtitle
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'normal');
  doc.text('Workers Portal', pageWidth / 2, 85, { align: 'center' });

  // Tagline
  doc.setTextColor(...COLORS.lightSlate);
  doc.setFontSize(14);
  doc.text('Comprehensive Time Tracking & Productivity Management', pageWidth / 2, 105, { align: 'center' });

  // Feature highlights
  const features = ['Time Tracking', 'Analytics', 'Journal', 'Goals', 'Gamification'];
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.cyan);
  const featureText = features.join('  |  ');
  doc.text(featureText, pageWidth / 2, 125, { align: 'center' });

  // URL
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(12);
  doc.text('workers.digiartifact.com', pageWidth / 2, 145, { align: 'center' });

  // Date and version
  doc.setTextColor(...COLORS.obsidian);
  doc.setFontSize(10);
  doc.text('Product Presentation  |  December 2025  |  Version 1.0', pageWidth / 2, pageHeight - 5, { align: 'center' });

  addPageNumber();

  // ========== TABLE OF CONTENTS ==========
  doc.addPage();
  console.log('Page 2: Table of contents...');

  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  addHeader('Table of Contents');

  const tocItems = [
    { num: '01', title: 'Product Overview', page: 3 },
    { num: '02', title: 'Dashboard - Command Center', page: 4 },
    { num: '03', title: 'Time Tracking System', page: 5 },
    { num: '04', title: 'Block Schedule Planning', page: 6 },
    { num: '05', title: 'Journal System', page: 7 },
    { num: '06', title: 'Analytics & Insights', page: 8 },
    { num: '07', title: 'Goal Tracking', page: 9 },
    { num: '08', title: 'Gamification System', page: 10 },
    { num: '09', title: 'Technical Architecture', page: 11 },
    { num: '10', title: 'Screenshots Gallery', page: '12-20' },
  ];

  let tocY = 45;
  tocItems.forEach((item) => {
    doc.setFillColor(...COLORS.darkSlate);
    doc.roundedRect(margin, tocY - 7, pageWidth - margin * 2, 14, 3, 3, 'F');
    
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(item.num, margin + 10, tocY);
    
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(item.title, margin + 30, tocY);
    
    doc.setTextColor(...COLORS.lightSlate);
    doc.text(String(item.page), pageWidth - margin - 10, tocY, { align: 'right' });
    
    tocY += 18;
  });

  addPageNumber();

  // ========== OVERVIEW SLIDE ==========
  doc.addPage();
  console.log('Page 3: Overview slide...');

  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  addHeader('Product Overview', 'What is the Workers Portal?');

  // Main description
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const overviewText = 'The DigiArtifact Workers Portal is a comprehensive productivity and time management platform designed for remote teams and individual professionals. Built with modern web technologies, it offers seamless time tracking, insightful analytics, powerful organizational tools, and motivating gamification elements.';
  const overviewLines = doc.splitTextToSize(overviewText, pageWidth - margin * 2);
  doc.text(overviewLines, margin, 38);

  // Feature grid
  const gridFeatures = [
    { title: 'Time Tracking', desc: 'Clock in/out with breaks and notes' },
    { title: 'Analytics', desc: 'Visual reports and insights' },
    { title: 'Journal', desc: 'Rich-text notes with cloud sync' },
    { title: 'Block Schedule', desc: 'Pomodoro and deep work planning' },
    { title: 'Goals', desc: 'Track targets and milestones' },
    { title: 'Projects', desc: 'Organize by client or task' },
    { title: 'Gamification', desc: 'XP, levels, and achievements' },
    { title: 'Reports', desc: 'PDF and CSV exports' },
  ];

  const colWidth = (pageWidth - margin * 2 - 20) / 2;
  const startY = 65;
  const rowHeight = 22;

  gridFeatures.forEach((feature, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (colWidth + 20);
    const y = startY + row * rowHeight;

    doc.setFillColor(...COLORS.darkSlate);
    doc.roundedRect(x, y, colWidth, rowHeight - 4, 3, 3, 'F');

    // Number badge
    doc.setFillColor(...COLORS.gold);
    doc.circle(x + 12, y + 9, 7, 'F');
    doc.setTextColor(...COLORS.obsidian);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), x + 12, y + 11.5, { align: 'center' });

    // Title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.text(feature.title, x + 25, y + 9);

    // Description
    doc.setTextColor(...COLORS.lightSlate);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(feature.desc, x + 25, y + 16);
  });

  // Tech stack footer
  doc.setFillColor(...COLORS.darkSlate);
  doc.roundedRect(margin, pageHeight - 35, pageWidth - margin * 2, 20, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Built With:', margin + 10, pageHeight - 22);
  
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text('Next.js 14  |  React 18  |  TypeScript  |  Tailwind CSS  |  Cloudflare Workers  |  D1 Database  |  Chart.js', margin + 55, pageHeight - 22);

  addPageNumber();

  // ========== FEATURE DETAIL SLIDES ==========
  FEATURE_SECTIONS.forEach((section, index) => {
    doc.addPage();
    console.log(`Page ${4 + index}: ${section.title} slide...`);

    doc.setFillColor(...COLORS.obsidian);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    addHeader(section.title, section.subtitle);

    let yPos = 38;
    
    section.content.forEach((line) => {
      if (line === '') {
        yPos += 4;
        return;
      }

      if (line.endsWith(':')) {
        // Section header
        doc.setTextColor(...COLORS.gold);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        yPos += 3;
      } else if (line.startsWith('-')) {
        // Bullet point
        doc.setTextColor(...COLORS.lightSlate);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        line = '  ' + line;
      } else {
        // Regular text
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 1;
    });

    addPageNumber();
  });

  // ========== SCREENSHOT SLIDES ==========
  SCREENSHOTS.forEach((screenshot, index) => {
    const filePath = path.join(ASSETS_DIR, screenshot.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  - Skipping missing screenshot: ${screenshot.file}`);
      return;
    }

    doc.addPage();
    console.log(`Page ${12 + index}: Screenshot - ${screenshot.title}...`);

    doc.setFillColor(...COLORS.obsidian);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    addHeader(screenshot.title, 'Screenshot');

    try {
      const imageData = fs.readFileSync(filePath);
      const base64 = imageData.toString('base64');

      // Calculate dimensions to fit
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - 55;

      doc.addImage(
        `data:image/png;base64,${base64}`,
        'PNG',
        margin,
        28,
        maxWidth,
        maxHeight * 0.88,
        undefined,
        'FAST'
      );
    } catch (err) {
      console.log(`  - Could not load image: ${screenshot.file}`);
      doc.setFillColor(...COLORS.darkSlate);
      doc.rect(margin, 28, pageWidth - margin * 2, pageHeight - 55, 'F');
      doc.setTextColor(...COLORS.lightSlate);
      doc.setFontSize(14);
      doc.text('[Screenshot Unavailable]', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }

    // Description
    doc.setTextColor(...COLORS.lightSlate);
    doc.setFontSize(10);
    doc.text(screenshot.description, margin, pageHeight - 12);

    addPageNumber();
  });

  // ========== CLOSING SLIDE ==========
  doc.addPage();
  console.log('Final page: Closing slide...');

  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top accent
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Thank you
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(44);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You', pageWidth / 2, 65, { align: 'center' });

  // Subtitle
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Ready to boost your productivity?', pageWidth / 2, 90, { align: 'center' });

  // Links
  doc.setTextColor(...COLORS.cyan);
  doc.setFontSize(14);
  doc.text('workers.digiartifact.com', pageWidth / 2, 115, { align: 'center' });

  doc.setTextColor(...COLORS.lightSlate);
  doc.setFontSize(12);
  doc.text('digiartifact.com', pageWidth / 2, 130, { align: 'center' });

  // Feature summary
  doc.setFillColor(...COLORS.darkSlate);
  doc.roundedRect(pageWidth / 2 - 100, 145, 200, 30, 5, 5, 'F');
  
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.text('Time Tracking  |  Analytics  |  Journal  |  Goals  |  Gamification', pageWidth / 2, 163, { align: 'center' });

  // Footer
  doc.setTextColor(...COLORS.lightSlate);
  doc.setFontSize(9);
  doc.text('(c) 2025 DigiArtifact. All rights reserved.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  addPageNumber();

  // ========== SAVE ==========
  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(OUTPUT_FILE, Buffer.from(pdfBuffer));

  console.log(`\n========================================`);
  console.log(`PDF saved to: ${OUTPUT_FILE}`);
  console.log(`Total pages: ${doc.getNumberOfPages()}`);
  console.log(`Content sections: ${FEATURE_SECTIONS.length}`);
  console.log(`Screenshots included: ${SCREENSHOTS.length}`);
  console.log(`========================================`);
}

// Run
createPDF();
