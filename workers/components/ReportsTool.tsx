'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  FileText, 
  Download, 
  Send, 
  Calendar, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Copy,
  Check,
  Printer
} from 'lucide-react'
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions'
import SmartSuggestionBubble from './SmartSuggestionBubble'
import { useSettings } from '@/contexts/SettingsContext'

interface ReportData {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'project' | 'custom'
  content: string
  generated_at: string
  period_start?: string
  period_end?: string
}

interface ReportsToolProps {
  onReportGenerated?: (report: ReportData) => void
  compact?: boolean
}

const REPORT_TEMPLATES = [
  {
    id: 'daily',
    name: 'Daily Summary',
    icon: '📅',
    description: 'Summary of today\'s work',
    template: `# Daily Work Summary - {{date}}

## Time Logged
- Total Hours: {{totalHours}}
- Projects Worked: {{projects}}

## Accomplishments
{{accomplishments}}

## Blockers/Challenges
{{blockers}}

## Tomorrow's Plan
{{tomorrowPlan}}

## Notes
{{notes}}`
  },
  {
    id: 'weekly',
    name: 'Weekly Report',
    icon: '📊',
    description: 'Week overview and metrics',
    template: `# Weekly Report - {{weekRange}}

## Overview
- Total Hours: {{totalHours}}
- Projects: {{projects}}
- Productivity Score: {{productivityScore}}

## Key Accomplishments
{{accomplishments}}

## Challenges Faced
{{challenges}}

## Next Week Goals
{{nextWeekGoals}}

## Additional Notes
{{notes}}`
  },
  {
    id: 'project',
    name: 'Project Update',
    icon: '🎯',
    description: 'Project-specific report',
    template: `# Project Update: {{projectName}}

## Status
- Current Phase: {{phase}}
- Progress: {{progress}}%
- Hours Spent: {{hoursSpent}}

## Completed This Period
{{completed}}

## In Progress
{{inProgress}}

## Upcoming Tasks
{{upcoming}}

## Risks/Issues
{{risks}}

## Notes
{{notes}}`
  },
  {
    id: 'custom',
    name: 'Custom Report',
    icon: '✏️',
    description: 'Free-form report',
    template: `# {{title}}

{{content}}`
  }
]

export default function ReportsTool({ 
  onReportGenerated,
  compact = false 
}: ReportsToolProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [reportContent, setReportContent] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([])
  const [copied, setCopied] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { formatDate, formatDateTime } = useSettings()

  // Smart suggestions integration
  const {
    currentSuggestion,
    showSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    checkForKeywords,
    resetIdleTimer,
    suggestionsEnabled,
    toggleSuggestions
  } = useSmartSuggestions({
    context: 'reports',
    enabled: true
  })

  // Handle text changes with smart suggestions
  const handleTextChange = useCallback((text: string) => {
    setReportContent(text)
    checkForKeywords(text)
  }, [checkForKeywords])

  // Handle accepting a suggestion
  const handleAcceptSuggestion = useCallback(() => {
    const suggestionText = acceptSuggestion()
    if (suggestionText) {
      setReportContent(prev => {
        if (prev.trim()) {
          return `${prev}\n\n💡 ${suggestionText}`
        }
        return `💡 ${suggestionText}`
      })
    }
  }, [acceptSuggestion])

  // Select template
  const handleSelectTemplate = (templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      
      // Pre-fill with template, replacing placeholders with current data
      let content = template.template
      content = content.replace('{{date}}', formatDate(new Date().toISOString()))
      content = content.replace('{{weekRange}}', `${formatDate(new Date().toISOString())} Week`)
      content = content.replace('{{totalHours}}', '[Enter hours]')
      content = content.replace('{{projects}}', '[Enter projects]')
      content = content.replace('{{productivityScore}}', '[Calculate]')
      content = content.replace('{{accomplishments}}', '- ')
      content = content.replace('{{blockers}}', '- None')
      content = content.replace('{{challenges}}', '- ')
      content = content.replace('{{tomorrowPlan}}', '- ')
      content = content.replace('{{nextWeekGoals}}', '- ')
      content = content.replace('{{notes}}', '')
      content = content.replace('{{projectName}}', '[Project Name]')
      content = content.replace('{{phase}}', '[Current Phase]')
      content = content.replace('{{progress}}', '[0-100]')
      content = content.replace('{{hoursSpent}}', '[Hours]')
      content = content.replace('{{completed}}', '- ')
      content = content.replace('{{inProgress}}', '- ')
      content = content.replace('{{upcoming}}', '- ')
      content = content.replace('{{risks}}', '- None')
      content = content.replace('{{title}}', reportTitle || 'Custom Report')
      content = content.replace('{{content}}', '')

      setReportContent(content)
      setReportTitle(template.name)
    }
  }

  // Generate report
  const handleGenerateReport = () => {
    if (!reportContent.trim()) return

    const report: ReportData = {
      id: crypto.randomUUID(),
      title: reportTitle || 'Untitled Report',
      type: (selectedTemplate as ReportData['type']) || 'custom',
      content: reportContent,
      generated_at: new Date().toISOString()
    }

    // Save to localStorage (mock storage)
    const saved = localStorage.getItem('worker_reports')
    const reports = saved ? JSON.parse(saved) : []
    reports.unshift(report)
    localStorage.setItem('worker_reports', JSON.stringify(reports.slice(0, 50)))
    
    setGeneratedReports(prev => [report, ...prev].slice(0, 10))
    onReportGenerated?.(report)

    // Reset form
    setReportContent('')
    setReportTitle('')
    setSelectedTemplate(null)
  }

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Print report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${reportTitle || 'Report'}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              h1 { color: #1e293b; }
              h2 { color: #475569; margin-top: 1.5rem; }
              ul { margin: 0.5rem 0; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${reportContent}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="
          flex items-center gap-2 
          px-3 py-2 
          bg-slate-800/50 hover:bg-slate-800
          border border-slate-700/50 hover:border-slate-600
          rounded-lg transition-colors
          text-sm text-slate-300
        "
      >
        <FileText className="w-4 h-4 text-emerald-400" />
        <span>Reports</span>
        <ChevronDown className="w-4 h-4 ml-auto" />
      </button>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="font-medium text-slate-200">Reports</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Smart Suggestions Toggle */}
          <button
            onClick={() => toggleSuggestions(!suggestionsEnabled)}
            className={`
              p-1.5 rounded transition-colors
              ${suggestionsEnabled 
                ? 'text-amber-400 bg-amber-400/10' 
                : 'text-slate-500 hover:text-slate-400'
              }
            `}
            title={suggestionsEnabled ? 'Disable suggestions' : 'Enable suggestions'}
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Template Selection */}
      {!selectedTemplate && (
        <div className="p-4 border-b border-slate-700/50">
          <p className="text-sm text-slate-400 mb-3">Choose a report template:</p>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className="
                  p-3 text-left
                  bg-slate-800/50 hover:bg-slate-800
                  border border-slate-700/50 hover:border-emerald-600/50
                  rounded-lg transition-colors
                "
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{template.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{template.name}</span>
                </div>
                <p className="text-xs text-slate-500">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Editor */}
      {selectedTemplate && (
        <div className="p-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Report Title"
            className="
              w-full px-3 py-2
              bg-slate-800/50 border border-slate-700/50
              rounded text-slate-200 text-sm
              placeholder:text-slate-500
              focus:outline-none focus:border-emerald-600/50
            "
          />

          {/* Content */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={reportContent}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={resetIdleTimer}
              placeholder="Write your report..."
              rows={12}
              className="
                w-full px-3 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg text-sm text-slate-200 font-mono
                placeholder:text-slate-500
                focus:outline-none focus:border-emerald-600/50
                resize-none
              "
            />
            
            {/* Smart Suggestion */}
            <SmartSuggestionBubble
              suggestion={currentSuggestion}
              show={showSuggestion}
              onDismiss={dismissSuggestion}
              onAccept={handleAcceptSuggestion}
              position="top"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedTemplate(null)
                setReportContent('')
                setReportTitle('')
                dismissSuggestion()
              }}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              ← Back to templates
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5
                  bg-slate-700/50 hover:bg-slate-700
                  border border-slate-600/50
                  rounded text-sm text-slate-300
                  transition-colors
                "
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePrint}
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5
                  bg-slate-700/50 hover:bg-slate-700
                  border border-slate-600/50
                  rounded text-sm text-slate-300
                  transition-colors
                "
                title="Print report"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={!reportContent.trim()}
                className="
                  flex items-center gap-1.5
                  px-4 py-1.5
                  bg-emerald-600 hover:bg-emerald-500
                  disabled:bg-slate-700 disabled:text-slate-500
                  rounded text-sm text-white
                  transition-colors
                "
              >
                <Send className="w-4 h-4" />
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {generatedReports.length > 0 && !selectedTemplate && (
        <div className="border-t border-slate-700/50">
          <div className="px-4 py-2 bg-slate-800/30">
            <p className="text-xs text-slate-500 font-medium">Recent Reports</p>
          </div>
          <div className="divide-y divide-slate-700/30 max-h-40 overflow-y-auto">
            {generatedReports.map(report => (
              <div
                key={report.id}
                className="px-4 py-2 hover:bg-slate-800/30 cursor-pointer"
                onClick={() => {
                  setSelectedTemplate(report.type)
                  setReportContent(report.content)
                  setReportTitle(report.title)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{report.title}</span>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(report.generated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
