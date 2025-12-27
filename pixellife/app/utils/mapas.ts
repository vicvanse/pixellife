/**
 * Função helper para gerar ID numérico estilo dex a partir do UUID
 * Usa hash do UUID para garantir estabilidade (não depende de index/ordenação)
 * Retorna formato #043 ou #1043 (4 dígitos para reduzir colisões)
 */
export function getElementDexId(elementId: string): string {
  // Hash simples do UUID para gerar número estável
  let hash = 0;
  for (let i = 0; i < elementId.length; i++) {
    const char = elementId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Converter para número positivo de 4 dígitos (0001-9999)
  const num = Math.abs(hash) % 9999;
  const paddedNum = String(num + 1).padStart(4, '0'); // +1 para evitar #0000
  
  return `#${paddedNum}`;
}

