export function mailtoLink(to: string, subject = 'SICOP', body = '') {
  const addr = (to || '').trim();              // ⬅️ quita espacios que suelen romper mailto:
  const s = encodeURIComponent(subject ?? '');
  const b = encodeURIComponent(body ?? '');
  return `mailto:${addr}?subject=${s}&body=${b}`;
}

export function whatsappLink(rawPhone: string, text = '') {
  // Convierte “(11) 5555-5555” → “1155555555”, etc.
  const digits = (rawPhone || '').replace(/\D/g, '');
  const t = encodeURIComponent(text ?? '');
  return `https://wa.me/${digits}${t ? `?text=${t}` : ''}`;
}
