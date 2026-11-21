export function htmlToPlainText(html: string, maxLen = 120_000): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
  }
  return text;
}