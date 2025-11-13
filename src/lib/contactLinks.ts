// src/lib/contactLinks.ts
export function mailtoLink(to: string, subject = 'SICOP', body = '') {
  const addr = (to || '').trim();             
  const s = encodeURIComponent(subject ?? '');
  const b = encodeURIComponent(body ?? '');
  return `mailto:${addr}?subject=${s}&body=${b}`;
}

export function whatsappLink(rawPhone: string, text = '') {
  const digits = (rawPhone || '').replace(/\D/g, '');
  const t = encodeURIComponent(text ?? '');
  return `https://wa.me/${digits}${t ? `?text=${t}` : ''}`;
}
