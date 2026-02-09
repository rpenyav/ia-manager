export function getCookieValue(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}
