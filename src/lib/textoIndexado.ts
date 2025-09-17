export function buildTextoIndexado(titulo: string, descripcion: string, funcionalidades: string[]) {
  const base = `${titulo} ${descripcion} ${funcionalidades.join(' ')}`.toLowerCase();
  return base.replace(/\s+/g, ' ').trim();
}
