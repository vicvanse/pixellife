/**
 * Helpers para disparar eventos customizados quando localStorage muda
 * Isso permite que componentes no mesmo tab sejam notificados de mudanças
 */

/**
 * Dispara um evento customizado quando o localStorage é atualizado
 * Útil para sincronizar componentes no mesmo tab
 */
export function triggerStorageChange(key: string): void {
  if (typeof window === "undefined") return;
  
  // Dispara evento customizado para componentes no mesmo tab
  window.dispatchEvent(new CustomEvent("pixel-life-storage-change", {
    detail: { key }
  }));
  
  // O evento 'storage' do navegador só funciona entre tabs diferentes
  // Por isso usamos um evento customizado para o mesmo tab
}
























