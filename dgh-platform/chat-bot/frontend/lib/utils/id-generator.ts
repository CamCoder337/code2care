let counter = 0;

export function generateStableId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function generateUniqueId(): string {
  if (typeof window !== 'undefined') {
    // Côté client seulement
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  // Côté serveur, utiliser un ID stable
  return generateStableId('temp');
}