const PIXEL = new Set(['i', 'I', 'o', 'O', 'p', 'r', 'R', 'N', 'S', 'A', 'P', 'U', '?', '.']);

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pixelHeader(input: string) {
  const text = input.replace(/'/g, '’');
  return [...text]
    .map((char) => (PIXEL.has(char) ? `<span class="header-pixel">${escapeHtml(char)}</span>` : escapeHtml(char)))
    .join('');
}

export function parseEventDate(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}

export function formatClock(value?: string | null) {
  if (!value) return '';
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function youtubeId(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const embed = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
    const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts) return shorts[1];
  } catch {
    const loose = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
    return loose?.[1] || null;
  }
  return null;
}

export function vimeoId(url?: string | null) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
}

export function seoTitle(title: string | undefined, fallback: string) {
  const raw = title || `${fallback} | Sphere.it`;
  return raw
    .replace(/%%title%%/g, fallback)
    .replace(/%%sitename%%/g, 'Sphere.it')
    .replace(/%%sep%%/g, '|')
    .replace(/%%page%%/g, '')
    .trim();
}

export function plainText(html?: string | null, words = 40) {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = text.split(' ');
  if (parts.length <= words) return text;
  return `${parts.slice(0, words).join(' ')}…`;
}

export function eventParts(date?: string | null) {
  const bits = (date || '').split('.');
  return { dayMonth: bits.length >= 2 ? `${bits[0]}.${bits[1]}` : '', year: bits[2] || '' };
}
