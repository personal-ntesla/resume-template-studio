export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path.replace(/^\/+/, '')}`;
}

export function cleanCategory(category: string): string {
  return category.replace(/^【\d+】\s*/, '');
}
