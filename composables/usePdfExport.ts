import { missions } from '~/data/missions'
import type { CreationRecord, DreamEntry, MissionProgress, PassportSession } from '~/types/mission'

export function usePdfExport() {
  async function generatePassportPdf(options: {
    session: PassportSession
    progress: Record<string, MissionProgress>
    creations: Record<string, CreationRecord>
    dream?: DreamEntry
  }) {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const width = pdf.internal.pageSize.getWidth()
    const height = pdf.internal.pageSize.getHeight()

    const addPageShell = (title: string) => {
      pdf.setFillColor(245, 231, 199)
      pdf.rect(0, 0, width, height, 'F')
      pdf.setDrawColor(15, 48, 83)
      pdf.setLineWidth(0.8)
      pdf.rect(10, 10, width - 20, height - 20)
      pdf.setTextColor(20, 34, 55)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text(title, width / 2, 24, { align: 'center' })
      pdf.setFont('helvetica', 'normal')
    }

    addPageShell('דרכון משימת רקיע')
    pdf.setFontSize(28)
    pdf.text(options.session.name, width / 2, 58, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`, width / 2, 72, { align: 'center' })
    if (options.session.photoUrl) {
      try {
        pdf.addImage(options.session.photoUrl, 'JPEG', width / 2 - 28, 88, 56, 70)
      } catch {
        pdf.rect(width / 2 - 28, 88, 56, 70)
      }
    }
    pdf.setFontSize(15)
    pdf.text('אין חלום רחוק מדי', width / 2, 190, { align: 'center' })

    pdf.addPage()
    addPageShell('סיכום מסלול')
    const completed = Object.values(options.progress).filter((item) => item.status === 'completed').length
    const skipped = Object.values(options.progress).filter((item) => item.status === 'skipped').length
    const score = Object.values(options.progress).reduce((sum, item) => sum + (item.status === 'completed' ? item.score : 0), 0)
    pdf.setFontSize(16)
    pdf.text(`ניקוד: ${score}`, width - 30, 52, { align: 'right' })
    pdf.text(`חותמות שהושלמו: ${completed}`, width - 30, 66, { align: 'right' })
    pdf.text(`תחנות שדולגו: ${skipped}`, width - 30, 80, { align: 'right' })
    pdf.text(`דירוג: ${options.session.rank}`, width - 30, 94, { align: 'right' })

    pdf.addPage()
    addPageShell('חותמות המשימה')
    const stampMissions = missions.filter((mission) => mission.baseScore > 0)
    stampMissions.forEach((mission, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const x = 34 + col * 58
      const y = 48 + row * 29
      const item = options.progress[mission.id]
      pdf.setDrawColor(item?.status === 'completed' ? 11 : 120, item?.status === 'completed' ? 125 : 120, item?.status === 'completed' ? 79 : 120)
      pdf.circle(x, y, 12)
      pdf.setFontSize(8)
      pdf.text(item?.status === 'completed' ? 'הושלם' : item?.status === 'skipped' ? 'דולג' : 'ריק', x, y + 1, { align: 'center' })
      pdf.setFontSize(7)
      pdf.text(`${mission.order}. ${mission.title}`, x, y + 17, { align: 'center', maxWidth: 44 })
    })

    pdf.addPage()
    addPageShell('פאץ׳ אישי')
    if (options.creations.patch?.imageUrl) {
      try {
        pdf.addImage(options.creations.patch.imageUrl, 'PNG', 45, 52, 120, 120)
      } catch {
        pdf.text('הפאץ׳ נשמר במערכת', width / 2, 84, { align: 'center' })
      }
    }

    pdf.addPage()
    addPageShell('ניסוי תכשיט במיקרו-כבידה')
    if (options.creations.jewelry?.imageUrl) {
      try {
        pdf.addImage(options.creations.jewelry.imageUrl, 'PNG', 35, 50, 140, 95)
      } catch {
        pdf.text('התכשיט נשמר במערכת', width / 2, 84, { align: 'center' })
      }
    }
    pdf.setFontSize(12)
    pdf.text('התכנון מדגים כיצד תנועה וחומר משתנים בין כדור הארץ למיקרו-כבידה.', width / 2, 170, { align: 'center', maxWidth: 150 })

    pdf.addPage()
    addPageShell('חלום אישי')
    pdf.setFontSize(18)
    pdf.text(options.dream?.dream || 'החלום נשמר בלב המסע.', width / 2, 88, { align: 'center', maxWidth: 150 })

    pdf.addPage()
    addPageShell('אין חלום רחוק מדי')
    pdf.setFontSize(20)
    pdf.text('משימת רקיע', width / 2, 92, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text('תודה שהשתתפתם במסע החלל הישראלי.', width / 2, 112, { align: 'center' })

    const safeName = options.session.name.replace(/[\\/:*?"<>|]/g, '').slice(0, 40) || options.session.id
    pdf.save(`rakia-passport-${safeName}.pdf`)
    return pdf
  }

  return { generatePassportPdf }
}
