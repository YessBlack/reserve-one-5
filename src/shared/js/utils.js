export const validarTextosVacios = (text) => {
  if (!text || text?.trim()) {
    return null
  }

  return text
}

export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(price)
}

export const cleanPayload = (value) => {
  const text = String(value ?? '').trim()
  return text === '' ? null : text
}