const SIZE = 160
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** Reduz a imagem para 160×160 em WebP antes de enviar. Rejeita arquivos que não são imagem. */
export async function resizeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  if (file.size > MAX_FILE_BYTES) throw new Error('A imagem precisa ter no máximo 5 MB.')
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar a imagem.')
  // Recorte central quadrado, para não distorcer fotos retangulares.
  const side = Math.min(bitmap.width, bitmap.height)
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}