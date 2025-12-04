'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Types for report data
export interface ReportData {
  month: string
  userName: string
  totalHours: number
  totalEntries: number
  averagePerDay: number
  projectBreakdown: { name: string; hours: number; color: string }[]
  dailyHours: { date: string; hours: number }[]
  weeklyTotals?: { week: string; hours: number }[]
  streakData?: {
    currentStreak: number
    longestStreak: number
    totalDaysWorked: number
  }
  gamificationData?: {
    level: number
    totalXP: number
    levelTitle: string
  }
}

// Color palette for PDF
const COLORS = {
  primary: '#cca43b',      // Relic gold
  secondary: '#1e1e24',    // Dark slate
  background: '#0a0a0a',   // Obsidian
  text: '#e3d5ca',         // Sand
  accent: '#22c55e',       // Emerald
  accent2: '#3b82f6',      // Blue
  accent3: '#f59e0b',      // Amber
  muted: '#94a3b8',        // Slate
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

/**
 * Generate a comprehensive PDF report with charts, tables, and visuals
 */
export async function generatePDFReport(
  data: ReportData,
  chartElements: { dailyChart?: HTMLCanvasElement; projectChart?: HTMLCanvasElement }
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // ============================================
  // PAGE 1: Cover & Summary
  // ============================================

  // Background gradient effect (simulated with rectangles)
  pdf.setFillColor(...hexToRgb(COLORS.background))
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Decorative header bar
  pdf.setFillColor(...hexToRgb(COLORS.primary))
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // Gradient overlay on header
  const grd = pdf.setFillColor(204, 164, 59)
  pdf.setGState(pdf.GState({ opacity: 0.1 }))
  pdf.rect(0, 35, pageWidth, 10, 'F')
  pdf.setGState(pdf.GState({ opacity: 1 }))

  // Logo/Title
  pdf.setTextColor(...hexToRgb('#ffffff'))
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DIGIARTIFACT', margin, 22)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Workers Portal - Time Report', margin, 32)

  yPos = 55

  // Report Title
  pdf.setTextColor(...hexToRgb(COLORS.text))
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Monthly Report: ${data.month}`, margin, yPos)
  yPos += 10

  // User info
  pdf.setFontSize(11)
  pdf.setTextColor(...hexToRgb(COLORS.muted))
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Prepared for: ${data.userName}`, margin, yPos)
  yPos += 5
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, yPos)
  yPos += 15

  // ============================================
  // SUMMARY CARDS
  // ============================================
  
  const cardWidth = (contentWidth - 10) / 3
  const cardHeight = 35
  const cardY = yPos

  // Card 1: Total Hours
  drawSummaryCard(pdf, margin, cardY, cardWidth, cardHeight, {
    title: 'Total Hours',
    value: data.totalHours.toFixed(1),
    unit: 'hrs',
    color: COLORS.primary,
    icon: '⏱️'
  })

  // Card 2: Time Entries
  drawSummaryCard(pdf, margin + cardWidth + 5, cardY, cardWidth, cardHeight, {
    title: 'Time Entries',
    value: data.totalEntries.toString(),
    unit: 'sessions',
    color: COLORS.accent2,
    icon: '📋'
  })

  // Card 3: Daily Average
  drawSummaryCard(pdf, margin + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, {
    title: 'Daily Average',
    value: data.averagePerDay.toFixed(1),
    unit: 'hrs/day',
    color: COLORS.accent,
    icon: '📊'
  })

  yPos = cardY + cardHeight + 15

  // ============================================
  // DAILY HOURS CHART
  // ============================================
  
  if (chartElements.dailyChart) {
    pdf.setTextColor(...hexToRgb(COLORS.text))
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('📈 Daily Hours Overview', margin, yPos)
    yPos += 5

    try {
      const chartCanvas = chartElements.dailyChart
      const chartImage = chartCanvas.toDataURL('image/png', 1.0)
      
      // Chart container with border
      const chartWidth = contentWidth
      const chartHeight = 55
      
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(margin, yPos, chartWidth, chartHeight, 3, 3, 'F')
      
      pdf.setDrawColor(...hexToRgb(COLORS.primary))
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, yPos, chartWidth, chartHeight, 3, 3, 'S')
      
      pdf.addImage(chartImage, 'PNG', margin + 5, yPos + 3, chartWidth - 10, chartHeight - 6)
      yPos += chartHeight + 10
    } catch (e) {
      console.error('Failed to add daily chart:', e)
      yPos += 10
    }
  }

  // ============================================
  // PROJECT BREAKDOWN CHART
  // ============================================
  
  if (chartElements.projectChart && data.projectBreakdown.length > 0) {
    pdf.setTextColor(...hexToRgb(COLORS.text))
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('🎯 Project Breakdown', margin, yPos)
    yPos += 5

    try {
      const chartCanvas = chartElements.projectChart
      const chartImage = chartCanvas.toDataURL('image/png', 1.0)
      
      const chartWidth = contentWidth * 0.5
      const chartHeight = 50
      
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(margin, yPos, chartWidth, chartHeight, 3, 3, 'F')
      
      pdf.addImage(chartImage, 'PNG', margin + 5, yPos + 3, chartWidth - 10, chartHeight - 6)
      
      // Project legend/table on the right
      const tableX = margin + chartWidth + 10
      const tableWidth = contentWidth - chartWidth - 10
      
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(tableX, yPos, tableWidth, chartHeight, 3, 3, 'F')
      
      let legendY = yPos + 8
      pdf.setFontSize(9)
      
      data.projectBreakdown.slice(0, 5).forEach((project, index) => {
        const percentage = data.totalHours > 0 ? ((project.hours / data.totalHours) * 100).toFixed(1) : '0'
        
        // Color dot
        pdf.setFillColor(...hexToRgb(project.color))
        pdf.circle(tableX + 5, legendY - 1.5, 2, 'F')
        
        // Project name
        pdf.setTextColor(...hexToRgb(COLORS.text))
        pdf.setFont('helvetica', 'normal')
        const displayName = project.name.length > 12 ? project.name.substring(0, 12) + '...' : project.name
        pdf.text(displayName, tableX + 10, legendY)
        
        // Hours and percentage
        pdf.setTextColor(...hexToRgb(COLORS.muted))
        pdf.text(`${project.hours.toFixed(1)}h (${percentage}%)`, tableX + tableWidth - 25, legendY)
        
        legendY += 8
      })
      
      yPos += chartHeight + 10
    } catch (e) {
      console.error('Failed to add project chart:', e)
      yPos += 10
    }
  }

  // ============================================
  // PAGE 2: Detailed Tables
  // ============================================
  
  pdf.addPage()
  yPos = margin

  // Page header
  pdf.setFillColor(...hexToRgb(COLORS.primary))
  pdf.rect(0, 0, pageWidth, 20, 'F')
  pdf.setTextColor(...hexToRgb('#ffffff'))
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Time Report: ${data.month}`, margin, 13)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Page 2`, pageWidth - margin - 15, 13)
  
  yPos = 30

  // ============================================
  // DAILY HOURS TABLE
  // ============================================
  
  pdf.setTextColor(...hexToRgb(COLORS.text))
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('📅 Daily Time Log', margin, yPos)
  yPos += 8

  // Table header
  const colWidths = [35, 25, 40, contentWidth - 100]
  const tableStartY = yPos
  
  pdf.setFillColor(...hexToRgb(COLORS.primary))
  pdf.rect(margin, yPos, contentWidth, 8, 'F')
  
  pdf.setTextColor(...hexToRgb('#ffffff'))
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Date', margin + 3, yPos + 5.5)
  pdf.text('Hours', margin + colWidths[0] + 3, yPos + 5.5)
  pdf.text('Status', margin + colWidths[0] + colWidths[1] + 3, yPos + 5.5)
  pdf.text('Visual Progress', margin + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 5.5)
  
  yPos += 8

  // Table rows
  pdf.setFont('helvetica', 'normal')
  const maxHours = Math.max(...data.dailyHours.map(d => d.hours), 8)
  
  data.dailyHours.forEach((day, index) => {
    if (yPos > pageHeight - 30) {
      // Add new page if running out of space
      pdf.addPage()
      yPos = 30
      
      // Repeat header on new page
      pdf.setFillColor(...hexToRgb(COLORS.primary))
      pdf.rect(margin, yPos, contentWidth, 8, 'F')
      pdf.setTextColor(...hexToRgb('#ffffff'))
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Date', margin + 3, yPos + 5.5)
      pdf.text('Hours', margin + colWidths[0] + 3, yPos + 5.5)
      pdf.text('Status', margin + colWidths[0] + colWidths[1] + 3, yPos + 5.5)
      pdf.text('Visual Progress', margin + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 5.5)
      pdf.setFont('helvetica', 'normal')
      yPos += 8
    }

    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.rect(margin, yPos, contentWidth, 7, 'F')
    }

    pdf.setTextColor(...hexToRgb(COLORS.text))
    pdf.setFontSize(8)
    
    // Date
    const dateStr = new Date(day.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
    pdf.text(dateStr, margin + 3, yPos + 5)
    
    // Hours
    pdf.setTextColor(...hexToRgb(COLORS.primary))
    pdf.text(day.hours.toFixed(1) + 'h', margin + colWidths[0] + 3, yPos + 5)
    
    // Status
    const status = day.hours >= 8 ? '✓ Full Day' : day.hours > 0 ? '◐ Partial' : '○ Off'
    const statusColor = day.hours >= 8 ? COLORS.accent : day.hours > 0 ? COLORS.accent3 : COLORS.muted
    pdf.setTextColor(...hexToRgb(statusColor))
    pdf.text(status, margin + colWidths[0] + colWidths[1] + 3, yPos + 5)
    
    // Progress bar
    const barX = margin + colWidths[0] + colWidths[1] + colWidths[2] + 3
    const barWidth = colWidths[3] - 10
    const barHeight = 4
    const barY = yPos + 2
    
    // Background
    pdf.setFillColor(...hexToRgb(COLORS.secondary))
    pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F')
    
    // Fill
    const fillWidth = Math.min((day.hours / maxHours) * barWidth, barWidth)
    if (fillWidth > 0) {
      const barColor = day.hours >= 8 ? COLORS.accent : day.hours >= 4 ? COLORS.primary : COLORS.accent3
      pdf.setFillColor(...hexToRgb(barColor))
      pdf.roundedRect(barX, barY, fillWidth, barHeight, 1, 1, 'F')
    }
    
    yPos += 7
  })

  yPos += 10

  // ============================================
  // PROJECT BREAKDOWN TABLE
  // ============================================
  
  if (data.projectBreakdown.length > 0 && yPos < pageHeight - 60) {
    pdf.setTextColor(...hexToRgb(COLORS.text))
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('📁 Project Time Allocation', margin, yPos)
    yPos += 8

    // Table header
    pdf.setFillColor(...hexToRgb(COLORS.primary))
    pdf.rect(margin, yPos, contentWidth, 8, 'F')
    
    pdf.setTextColor(...hexToRgb('#ffffff'))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Project', margin + 3, yPos + 5.5)
    pdf.text('Hours', margin + 80, yPos + 5.5)
    pdf.text('Percentage', margin + 110, yPos + 5.5)
    pdf.text('Distribution', margin + 145, yPos + 5.5)
    
    yPos += 8
    pdf.setFont('helvetica', 'normal')

    data.projectBreakdown.forEach((project, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(...hexToRgb(COLORS.secondary))
        pdf.rect(margin, yPos, contentWidth, 8, 'F')
      }

      const percentage = data.totalHours > 0 ? (project.hours / data.totalHours) * 100 : 0

      // Color indicator
      pdf.setFillColor(...hexToRgb(project.color))
      pdf.circle(margin + 5, yPos + 4, 2.5, 'F')

      // Project name
      pdf.setTextColor(...hexToRgb(COLORS.text))
      pdf.setFontSize(9)
      pdf.text(project.name, margin + 12, yPos + 5.5)

      // Hours
      pdf.setTextColor(...hexToRgb(COLORS.primary))
      pdf.text(project.hours.toFixed(1) + 'h', margin + 80, yPos + 5.5)

      // Percentage
      pdf.setTextColor(...hexToRgb(COLORS.muted))
      pdf.text(percentage.toFixed(1) + '%', margin + 110, yPos + 5.5)

      // Distribution bar
      const barX = margin + 145
      const barWidth = contentWidth - 150
      const barHeight = 5
      const barY = yPos + 2
      
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F')
      
      const fillWidth = (percentage / 100) * barWidth
      if (fillWidth > 0) {
        pdf.setFillColor(...hexToRgb(project.color))
        pdf.roundedRect(barX, barY, fillWidth, barHeight, 1, 1, 'F')
      }

      yPos += 8
    })
  }

  // ============================================
  // GAMIFICATION & STREAK DATA (if available)
  // ============================================
  
  if (data.gamificationData || data.streakData) {
    if (yPos > pageHeight - 50) {
      pdf.addPage()
      yPos = 30
    }
    
    yPos += 10
    pdf.setTextColor(...hexToRgb(COLORS.text))
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('🏆 Achievements & Streaks', margin, yPos)
    yPos += 10

    const achievementCardWidth = (contentWidth - 10) / 2

    if (data.gamificationData) {
      // Level card
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(margin, yPos, achievementCardWidth, 25, 3, 3, 'F')
      pdf.setDrawColor(...hexToRgb(COLORS.primary))
      pdf.roundedRect(margin, yPos, achievementCardWidth, 25, 3, 3, 'S')
      
      pdf.setTextColor(...hexToRgb(COLORS.muted))
      pdf.setFontSize(9)
      pdf.text('Current Level', margin + 5, yPos + 8)
      
      pdf.setTextColor(...hexToRgb(COLORS.primary))
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Level ${data.gamificationData.level}`, margin + 5, yPos + 18)
      
      pdf.setTextColor(...hexToRgb(COLORS.muted))
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(data.gamificationData.levelTitle, margin + achievementCardWidth - 30, yPos + 18)
    }

    if (data.streakData) {
      // Streak card
      const streakX = margin + achievementCardWidth + 10
      pdf.setFillColor(...hexToRgb(COLORS.secondary))
      pdf.roundedRect(streakX, yPos, achievementCardWidth, 25, 3, 3, 'F')
      pdf.setDrawColor(...hexToRgb(COLORS.accent3))
      pdf.roundedRect(streakX, yPos, achievementCardWidth, 25, 3, 3, 'S')
      
      pdf.setTextColor(...hexToRgb(COLORS.muted))
      pdf.setFontSize(9)
      pdf.text('Current Streak', streakX + 5, yPos + 8)
      
      pdf.setTextColor(...hexToRgb(COLORS.accent3))
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`🔥 ${data.streakData.currentStreak} days`, streakX + 5, yPos + 18)
      
      pdf.setTextColor(...hexToRgb(COLORS.muted))
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Best: ${data.streakData.longestStreak}`, streakX + achievementCardWidth - 25, yPos + 18)
    }
  }

  // ============================================
  // FOOTER
  // ============================================
  
  const footerY = pageHeight - 10
  pdf.setTextColor(...hexToRgb(COLORS.muted))
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.text('Generated by DigiArtifact Workers Portal', margin, footerY)
  pdf.text(`© ${new Date().getFullYear()} DigiArtifact`, pageWidth - margin - 30, footerY)

  // ============================================
  // SAVE PDF
  // ============================================
  
  const filename = `DigiArtifact-TimeReport-${data.month.replace(' ', '-')}.pdf`
  pdf.save(filename)
}

/**
 * Draw a summary card with icon, title, value, and unit
 */
function drawSummaryCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    title: string
    value: string
    unit: string
    color: string
    icon: string
  }
) {
  // Card background
  pdf.setFillColor(...hexToRgb(COLORS.secondary))
  pdf.roundedRect(x, y, width, height, 3, 3, 'F')
  
  // Color accent bar
  pdf.setFillColor(...hexToRgb(options.color))
  pdf.rect(x, y, 3, height, 'F')
  
  // Title
  pdf.setTextColor(...hexToRgb(COLORS.muted))
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(options.title, x + 8, y + 10)
  
  // Value
  pdf.setTextColor(...hexToRgb(options.color))
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text(options.value, x + 8, y + 24)
  
  // Unit
  pdf.setTextColor(...hexToRgb(COLORS.muted))
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(options.unit, x + 8, y + 31)
}

/**
 * Capture an HTML element as an image for PDF inclusion
 */
export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
  } as any)
  return canvas.toDataURL('image/png')
}
