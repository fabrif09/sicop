export function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // quita signos raros
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildTextoIndexado(titulo: string, descripcion: string, funcionalidades: string[]) {
  const parts = [
    normalize(titulo),
    normalize(descripcion),
    normalize(funcionalidades.join(' ')),
  ].filter(Boolean);
  return parts.join(' ');
}
