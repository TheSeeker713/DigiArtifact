'use client'

import FortuneCookie from './FortuneCookie'

interface HelpTabProps {
  onStartTutorial: () => void
}

export default function HelpTab({ onStartTutorial }: HelpTabProps) {
  return (
    <div className="space-y-6">
      {/* Tutorial Section */}
      <div className="card bg-gradient-to-r from-relic-gold/10 to-baked-clay/10 border-relic-gold/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-relic-gold/20 rounded-lg">
            <svg className="w-8 h-8 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-lg text-relic-gold mb-1">App Tutorial</h3>
            <p className="text-text-slate text-sm">
              New to the Workers Portal? Take a guided tour of all features.
            </p>
          </div>
          <button
            onClick={onStartTutorial}
            className="btn-rune flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Tutorial
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {/* Getting Started */}
          <FAQSection 
            icon="📚" 
            title="Getting Started"
            items={[
              {
                question: "How do I clock in?",
                answer: "From the Dashboard, click the \"Clock In\" button. You can optionally select a project before clocking in. Your time will start tracking immediately."
              },
              {
                question: "How do I take a break?",
                answer: "While clocked in, click the \"Start Break\" button. Your break time will be tracked separately and subtracted from your total work hours. Click \"End Break\" when you're ready to continue."
              }
            ]}
          />

          {/* Block Scheduling */}
          <FAQSection 
            icon="🧱" 
            title="Block-Based Scheduling"
            items={[
              {
                question: "What are schedule blocks?",
                answer: "Blocks are time periods you plan for your day. Each block has a label (e.g., \"Deep Work\", \"Break\"), duration, and category. You can create work blocks, break blocks, or custom categories to match your workflow."
              },
              {
                question: "How does dynamic scheduling work?",
                answer: "When you complete or skip a block, the schedule automatically adjusts. Future blocks shift to maintain your plan. The timeline shows \"Now\" indicator and updates in real-time to keep you on track."
              },
              {
                question: "What happens to incomplete blocks?",
                answer: "If you have incomplete blocks from yesterday, you'll see a Morning Check-In when you start your day. You can choose which tasks to carry over to today's schedule, and the rest will be archived."
              }
            ]}
          />

          {/* Gamification */}
          <FAQSection 
            icon="⭐" 
            title="XP & Gamification"
            items={[
              {
                question: "How do I earn XP?",
                answer: "You earn XP for completing blocks (+10 XP), maintaining streaks (+5 XP per day), adding notes (+2 XP), and completing Focus Timer sessions (+15 XP). Your XP accumulates and levels you up over time!"
              },
              {
                question: "What are streaks?",
                answer: "Streaks track consecutive days of activity. Clock in daily to maintain your streak. Higher streaks earn multiplied XP rewards and unlock special achievements!"
              }
            ]}
          />

          {/* Reports & Export */}
          <FAQSection 
            icon="📊" 
            title="Reports & Export"
            items={[
              {
                question: "How do I export my time data?",
                answer: "Go to Reports, select your date range, and click \"Export CSV\" for spreadsheet data or \"Export PDF\" for a beautifully formatted report with charts and graphs. PDFs include visual analytics, time breakdowns, and summary statistics."
              },
              {
                question: "What analytics are available?",
                answer: "View daily/weekly/monthly trends, project breakdowns, work vs break ratios, average session lengths, peak productivity hours, and more. Charts visualize your patterns to help optimize your work habits."
              }
            ]}
          />

          {/* Focus Timer */}
          <FAQSection 
            icon="🎯" 
            title="Focus Timer"
            items={[
              {
                question: "How does the Focus Timer work?",
                answer: "The Focus Timer uses Pomodoro technique - 25-minute focus sessions followed by 5-minute breaks. Complete 4 sessions for a longer break. You earn XP for completing full sessions, encouraging deep work habits."
              }
            ]}
          />

          {/* Account */}
          <FAQSection 
            icon="🔐" 
            title="Account & Security"
            noBorder
            items={[
              {
                question: "How do I change my PIN?",
                answer: "Go to Settings → Account and use the \"Change PIN\" form. You'll need to enter your current PIN first, then your new PIN (4-6 digits) twice to confirm."
              },
              {
                question: "What if I forget my PIN?",
                answer: "Contact your admin to have your PIN reset. They can set a new temporary PIN for you from the Admin → Users page, then you can change it to something personal."
              },
              {
                question: "Can I edit past time entries?",
                answer: "Admins can edit any time entry from the Admin → All Entries page. Regular users can view their history but cannot edit past entries. Contact your admin if you need corrections."
              }
            ]}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Need More Help?</h2>
        <p className="text-text-slate text-sm mb-4">
          If you can't find the answer to your question, reach out to us:
        </p>
        <div className="space-y-3">
          <a 
            href="mailto:support@digiartifact.com" 
            className="flex items-center gap-3 p-4 bg-obsidian/50 rounded-lg hover:bg-obsidian/70 transition-colors"
          >
            <svg className="w-5 h-5 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sand font-mono text-sm">Email Support</p>
              <p className="text-text-slate text-xs">support@digiartifact.com</p>
            </div>
          </a>
          <a 
            href="https://digiartifact.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-obsidian/50 rounded-lg hover:bg-obsidian/70 transition-colors"
          >
            <svg className="w-5 h-5 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <div>
              <p className="text-sand font-mono text-sm">Visit Website</p>
              <p className="text-text-slate text-xs">digiartifact.com</p>
            </div>
          </a>
        </div>
      </div>

      {/* Hidden Easter Egg - Fortune Cookie */}
      <FortuneCookie />
    </div>
  )
}

// FAQ Section Component
interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  icon: string
  title: string
  items: FAQItem[]
  noBorder?: boolean
}

function FAQSection({ icon, title, items, noBorder }: FAQSectionProps) {
  return (
    <div className={noBorder ? '' : 'border-b border-baked-clay/20 pb-4'}>
      <h3 className="text-sand font-mono text-sm mb-3 flex items-center gap-2">
        <span className="text-relic-gold">{icon}</span> {title}
      </h3>
      
      {items.map((item, index) => (
        <details key={index} className={`group ${index > 0 ? 'mt-2' : ''}`}>
          <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
            <span className="text-sand font-medium">{item.question}</span>
            <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-4 text-text-slate text-sm">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
