import { getCollection, type CollectionEntry } from 'astro:content';
import { parseEventDate } from './format';

export type PageEntry = CollectionEntry<'pages'>;
export type PostEntry = CollectionEntry<'posts'>;
export type EventEntry = CollectionEntry<'events'>;
export type SeriesEntry = CollectionEntry<'eventSeries'>;
export type SpeakerEntry = CollectionEntry<'speakers'>;
export type TalkEntry = CollectionEntry<'talks'>;
export type PodcastEntry = CollectionEntry<'podcasts'>;
export type AnyEntry = PageEntry | PostEntry | EventEntry | SeriesEntry | SpeakerEntry | TalkEntry | PodcastEntry;

export interface Library {
  pages: PageEntry[];
  posts: PostEntry[];
  events: EventEntry[];
  series: SeriesEntry[];
  speakers: SpeakerEntry[];
  talks: TalkEntry[];
  podcasts: PodcastEntry[];
  speakerById: Map<number, SpeakerEntry>;
  talkById: Map<number, TalkEntry>;
  eventById: Map<number, EventEntry>;
}

let cached: Library | null = null;

export async function loadLibrary(): Promise<Library> {
  if (cached) return cached;
  const [pages, posts, events, series, speakers, talks, podcasts] = await Promise.all([
    getCollection('pages'),
    getCollection('posts'),
    getCollection('events'),
    getCollection('eventSeries'),
    getCollection('speakers'),
    getCollection('talks'),
    getCollection('podcasts'),
  ]);
  const byId = <T extends { data: { wpId: number } }>(items: T[]) => new Map(items.map((item) => [item.data.wpId, item]));
  cached = {
    pages,
    posts,
    events,
    series,
    speakers,
    talks,
    podcasts,
    speakerById: byId(speakers),
    talkById: byId(talks),
    eventById: byId(events),
  };
  return cached;
}

export function talksWithVideo(talks: TalkEntry[]) {
  return talks
    .filter((talk) => Boolean(talk.data.acf?.talk_video))
    .sort((a, b) => Date.parse(String(b.data.acf?.talk_date || b.data.date)) - Date.parse(String(a.data.acf?.talk_date || a.data.date)));
}

export function isUpcoming(event: EventEntry, now = new Date()) {
  const date = parseEventDate(event.data.acf?.event_date);
  if (!date) return false;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  return date >= cutoff;
}

export function sortEvents(events: EventEntry[], direction: 'asc' | 'desc') {
  return [...events].sort((a, b) => {
    const left = parseEventDate(a.data.acf?.event_date)?.getTime() || 0;
    const right = parseEventDate(b.data.acf?.event_date)?.getTime() || 0;
    return direction === 'asc' ? left - right : right - left;
  });
}

export function eventsInSeries(events: EventEntry[], termId?: number | null) {
  if (!termId) return events;
  return events.filter((event) => (event.data.terms?.event_series_taxonomy || []).some((term) => term.id === Number(termId)));
}

export function htmlOf(entry: { data: { blocks?: { kind: string; html?: string }[] } }) {
  return (entry.data.blocks || [])
    .filter((block) => block.kind === 'html' && block.html)
    .map((block) => block.html)
    .join('\n');
}

export function scrollMenu(entry: AnyEntry) {
  if (!entry.data.acf?.alt_dynamic_menu) return [];
  return (entry.data.blocks || [])
    .filter((block) => block.kind === 'acf' && block.data?.menu_label && block.anchor)
    .map((block) => ({ label: String(block.data?.menu_label), href: `#${block.anchor}` }));
}
