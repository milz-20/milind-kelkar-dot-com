const MAX_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_EMBEDDED_IMAGE_BYTES = 320 * 1024
const MAX_IMAGE_DIMENSION = 1200

const byteLength = (value: string) => new Blob([value]).size

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load that image.'))
    image.src = src
  })

export async function imageFileToDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('That image is too large. Please export a smaller screenshot.')
  }

  const src = await readAsDataUrl(file)
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not prepare that image.')
  }

  let maxDimension = MAX_IMAGE_DIMENSION
  let dataUrl = ''

  while (maxDimension >= 640) {
    const scale = Math.min(1, maxDimension / image.width, maxDimension / image.height)
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    let quality = 0.86
    while (quality >= 0.56) {
      dataUrl = canvas.toDataURL('image/webp', quality)
      if (byteLength(dataUrl) <= MAX_EMBEDDED_IMAGE_BYTES) {
        return dataUrl
      }
      quality -= 0.1
    }

    maxDimension -= 200
  }

  throw new Error('That image is still too large after compression. Try a smaller crop.')
}
