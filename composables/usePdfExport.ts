import { missions } from '~/data/missions'
import type { CreationRecord, DreamEntry, MissionProgress, PassportSession } from '~/types/mission'

type PdfOptions = {
  session: PassportSession
  progress: Record<string, MissionProgress>
  creations: Record<string, CreationRecord>
  dream?: DreamEntry
}

type PdfResult = {
  blob: Blob
  fileName: string
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export function usePdfExport() {
  async function generatePassportPdf(options: PdfOptions): Promise<PdfResult> {
    if (!import.meta.client) throw new Error('PDF export is only available in the browser.')

    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])
    const html2canvas = html2canvasModule.default
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const fileName = buildPdfFileName(options.session)

    const [photoSrc, patchSrc, jewelrySrc] = await Promise.all([
      resolveImageSource(options.session.photoUrl),
      resolveImageSource(options.creations.patch?.imageDataUrl || options.creations.patch?.imageUrl),
      resolveImageSource(options.creations.jewelry?.imageDataUrl || options.creations.jewelry?.imageUrl)
    ])

    const container = createRenderContainer()
    const pages = [
      buildCoverPage(options.session, photoSrc),
      buildSummaryPage(options),
      buildStampPage(options.progress),
      buildCreationPage('פאץ׳ אישי', patchSrc, 'הפאץ׳ נשמר במערכת ויצורף למסע האישי.'),
      buildCreationPage('ניסוי תכשיט במיקרו-כבידה', jewelrySrc, 'התכנון מדגים כיצד תנועה וחומר משתנים בין כדור הארץ למיקרו-כבידה.'),
      buildTextPage('חלום אישי', options.dream?.dream || 'החלום נשמר בלב המסע.'),
      buildTextPage('אין חלום רחוק מדי', 'תודה שהשתתפתם במסע החלל הישראלי.')
    ]

    try {
      pages.forEach((page) => container.appendChild(page))
      document.body.appendChild(container)
      await waitForImages(container)

      for (const [index, page] of pages.entries()) {
        if (index > 0) pdf.addPage()
        const canvas = await html2canvas(page, {
          backgroundColor: '#f5e7c7',
          scale: Math.min(2, window.devicePixelRatio || 1.5),
          useCORS: true,
          logging: false
        })
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfWidth, pdfHeight)
      }
    } finally {
      container.remove()
    }

    return { blob: pdf.output('blob'), fileName }
  }

  async function sharePassportPdf(options: PdfOptions) {
    const result = await generatePassportPdf(options)
    const file = new File([result.blob], result.fileName, { type: 'application/pdf' })
    const shareData = {
      title: 'דרכון משימת רקיע',
      text: 'דרכון משימת רקיע האישי שלי',
      files: [file]
    }

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData)
        return 'shared' as const
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
      }
    }

    downloadBlob(result.blob, result.fileName)
    return 'downloaded' as const
  }

  async function downloadPassportPdf(options: PdfOptions) {
    const result = await generatePassportPdf(options)
    downloadBlob(result.blob, result.fileName)
    return result
  }

  return { generatePassportPdf, sharePassportPdf, downloadPassportPdf }
}

function buildPdfFileName(session: PassportSession) {
  const safeName = session.name.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || session.id
  return `rakia-passport-${safeName}.pdf`
}

async function resolveImageSource(src?: string) {
  if (!src) return ''
  if (src.startsWith('data:')) return src

  try {
    const response = await fetch(src, { mode: 'cors' })
    if (!response.ok) return src
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch {
    return src
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1200)
}

function createRenderContainer() {
  const container = document.createElement('div')
  setStyle(container, {
    position: 'absolute',
    left: '-10000px',
    top: '0',
    width: `${PAGE_WIDTH}px`,
    direction: 'rtl',
    fontFamily: '"Segoe UI", Arial, "Noto Sans Hebrew", sans-serif',
    color: '#172033'
  })
  return container
}

function buildPage(title: string) {
  const page = document.createElement('section')
  setStyle(page, {
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    boxSizing: 'border-box',
    padding: '54px 62px',
    direction: 'rtl',
    background: '#f5e7c7',
    border: '10px solid #07172f',
    outline: '3px solid #c9a45a',
    outlineOffset: '-24px',
    overflow: 'hidden'
  })

  const heading = document.createElement('h1')
  heading.textContent = title
  setStyle(heading, {
    margin: '0 0 30px',
    color: '#10233d',
    fontSize: '38px',
    lineHeight: '1.2',
    textAlign: 'center',
    fontWeight: '900'
  })
  page.appendChild(heading)
  return page
}

function buildCoverPage(session: PassportSession, photoSrc: string) {
  const page = buildPage('דרכון משימת רקיע')

  const name = document.createElement('h2')
  name.textContent = session.name
  setStyle(name, {
    margin: '34px 0 18px',
    color: '#10233d',
    fontSize: '44px',
    textAlign: 'center'
  })
  page.appendChild(name)

  if (photoSrc) {
    const photo = image(photoSrc)
    setStyle(photo, {
      display: 'block',
      width: '220px',
      height: '275px',
      margin: '0 auto 28px',
      objectFit: 'cover',
      border: '4px solid #c9a45a',
      borderRadius: '12px'
    })
    page.appendChild(photo)
  }

  paragraph(page, `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`, { textAlign: 'center', fontSize: '25px' })
  paragraph(page, 'אין חלום רחוק מדי', { marginTop: '76px', textAlign: 'center', fontSize: '30px', fontWeight: '900', color: '#896b2c' })
  return page
}

function buildSummaryPage(options: PdfOptions) {
  const page = buildPage('סיכום מסלול')
  const completed = Object.values(options.progress).filter((item) => item.status === 'completed').length
  const skipped = Object.values(options.progress).filter((item) => item.status === 'skipped').length
  const score = Object.values(options.progress).reduce((sum, item) => sum + (item.status === 'completed' ? item.score : 0), 0)

  const grid = document.createElement('div')
  setStyle(grid, { display: 'grid', gap: '22px', marginTop: '56px' })
  page.appendChild(grid)
  summaryLine(grid, 'ניקוד', `${score}`)
  summaryLine(grid, 'חותמות שהושלמו', `${completed}`)
  summaryLine(grid, 'תחנות שדולגו', `${skipped}`)
  summaryLine(grid, 'דירוג', options.session.rank)
  return page
}

function buildStampPage(progress: Record<string, MissionProgress>) {
  const page = buildPage('חותמות המשימה')
  const grid = document.createElement('div')
  setStyle(grid, {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '18px',
    marginTop: '10px'
  })

  missions.filter((mission) => mission.baseScore > 0).forEach((mission) => {
    const item = progress[mission.id]
    const card = document.createElement('div')
    setStyle(card, {
      minHeight: '100px',
      padding: '12px 8px',
      border: `3px ${item?.status === 'completed' ? 'solid #0b7d4f' : 'dashed #8c7d59'}`,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      color: item?.status === 'completed' ? '#0b6a43' : '#6e5c36',
      background: 'rgba(255, 250, 232, .62)'
    })
    const number = document.createElement('strong')
    number.textContent = String(mission.order)
    setStyle(number, { display: 'block', fontSize: '26px' })
    const label = document.createElement('span')
    label.textContent = item?.status === 'completed' ? 'הושלם' : item?.status === 'skipped' ? 'דולג' : 'ריק'
    setStyle(label, { display: 'block', fontSize: '16px', fontWeight: '800' })
    card.append(number, label)
    grid.appendChild(card)
  })

  page.appendChild(grid)
  return page
}

function buildCreationPage(title: string, src: string, fallback: string) {
  const page = buildPage(title)
  if (src) {
    const preview = image(src)
    setStyle(preview, {
      display: 'block',
      width: '520px',
      maxHeight: '560px',
      margin: '45px auto 32px',
      objectFit: 'contain',
      borderRadius: '16px',
      border: '4px solid #c9a45a',
      background: '#fff7e5'
    })
    page.appendChild(preview)
  }
  paragraph(page, fallback, { textAlign: 'center', fontSize: '24px', marginTop: src ? '18px' : '180px' })
  return page
}

function buildTextPage(title: string, text: string) {
  const page = buildPage(title)
  paragraph(page, text, {
    margin: '180px auto 0',
    maxWidth: '560px',
    textAlign: 'center',
    fontSize: '32px',
    lineHeight: '1.55',
    fontWeight: '800'
  })
  return page
}

function summaryLine(parent: HTMLElement, label: string, value: string) {
  const row = document.createElement('div')
  setStyle(row, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid rgba(16, 35, 61, .2)',
    paddingBottom: '14px',
    fontSize: '28px',
    fontWeight: '800'
  })
  const labelEl = document.createElement('span')
  labelEl.textContent = label
  const valueEl = document.createElement('strong')
  valueEl.textContent = value
  setStyle(valueEl, { color: '#896b2c' })
  row.append(labelEl, valueEl)
  parent.appendChild(row)
}

function paragraph(parent: HTMLElement, text: string, styles: Partial<CSSStyleDeclaration> = {}) {
  const p = document.createElement('p')
  p.textContent = text
  setStyle(p, {
    margin: '0 0 18px',
    color: '#172033',
    fontSize: '22px',
    lineHeight: '1.45',
    ...styles
  })
  parent.appendChild(p)
}

function image(src: string) {
  const img = document.createElement('img')
  img.crossOrigin = 'anonymous'
  img.src = src
  return img
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve()
    return new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.onerror = () => resolve()
    })
  }))
}

function setStyle(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles)
}
