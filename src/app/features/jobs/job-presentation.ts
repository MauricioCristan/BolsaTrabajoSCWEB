export function contractLabel(value: string): string {
  return ({ TIEMPO_COMPLETO: 'Tiempo completo', MEDIO_TIEMPO: 'Medio tiempo', BECA: 'Beca', TEMPORAL: 'Temporal', POR_HONORARIOS: 'Por honorarios' } as Record<string, string>)[value] || value;
}

export function salaryLabel(min?: number | null, max?: number | null): string {
  const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  if (min != null && max != null) return `${money(min)} – ${money(max)} MXN`;
  if (min != null) return `Desde ${money(min)} MXN`;
  if (max != null) return `Hasta ${money(max)} MXN`;
  return 'Sueldo por acordar';
}

export function localDate(value = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function isExpired(date: string): boolean { return date < localDate(); }
