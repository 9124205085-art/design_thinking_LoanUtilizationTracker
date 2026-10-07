export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const maxWidth = 720
      const scale = image.width > maxWidth ? maxWidth / image.width : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.62))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    image.src = url
  })
}

export function makeReceiptImage(input: { shop: string; line: string; amount: string; date: string }): string {
  const canvas = document.createElement('canvas')
  canvas.width = 420
  canvas.height = 560
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.fillStyle = '#fffdf8'
  context.fillRect(0, 0, 420, 560)
  context.strokeStyle = '#e6ddd0'
  context.lineWidth = 2
  context.strokeRect(14, 14, 392, 532)
  context.fillStyle = '#0f766e'
  context.fillRect(14, 14, 392, 78)
  context.fillStyle = '#ffffff'
  context.font = '700 28px Segoe UI, sans-serif'
  context.fillText('RECEIPT', 32, 62)
  context.fillStyle = '#14343a'
  context.font = '700 24px Segoe UI, sans-serif'
  context.fillText(input.shop.slice(0, 24), 32, 140)
  context.font = '20px Segoe UI, sans-serif'
  context.fillStyle = '#3e585f'
  context.fillText(input.line.slice(0, 32), 32, 178)
  context.fillText(input.date, 32, 214)
  context.strokeStyle = '#e6ddd0'
  context.beginPath()
  context.moveTo(32, 246)
  context.lineTo(388, 246)
  context.stroke()
  context.fillStyle = '#14343a'
  context.font = '700 36px Segoe UI, sans-serif'
  context.fillText(input.amount, 32, 310)
  context.font = '700 22px Segoe UI, sans-serif'
  context.fillStyle = '#166534'
  context.fillText('PAID', 32, 360)
  context.font = '18px Segoe UI, sans-serif'
  context.fillStyle = '#3e585f'
  context.fillText('Saved as proof in LoanTrack', 32, 500)
  return canvas.toDataURL('image/jpeg', 0.66)
}
