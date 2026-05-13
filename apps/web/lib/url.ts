export function getAbsoluteLink(link: string): string {
  if (!link) return "";

  try {
    return new URL(link, window.location.origin).toString();
  } catch {
    return `${window.location.origin}${link.startsWith("/") ? "" : "/"}${link}`;
  }
}
