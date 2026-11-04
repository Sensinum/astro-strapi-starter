import site from './site.json';

export interface MenuItem {
  id: number;
  parent: number;
  title: string;
  url: string;
  classes: string[] | string;
  target?: string;
}

export interface TermInfo {
  id: number;
  slug: string;
  name: string;
  description?: string;
  parent?: number;
  color?: string;
}

export const siteData = site as {
  url: string;
  name: string;
  description: string;
  contactUrl: string;
  menus: {
    main: { name: string; items: MenuItem[] };
    footer: { name: string; items: MenuItem[] };
    podcast: { name: string; items: MenuItem[] };
  };
  options: {
    allSpeakers: { title: string; url: string; target?: string } | null;
    becomeSpeaker: { title: string; url: string; target?: string } | null;
    nominateSpeaker: { title: string; url: string; target?: string } | string | null;
    eventsPage: { title: string; url: string } | null;
    talksPage: { title: string; url: string } | null;
  };
  taxonomies: Record<string, TermInfo[]>;
  socials: { href: string; title: string; icon: string }[];
};

export function terms(taxonomy: string) {
  return siteData.taxonomies[taxonomy] || [];
}

export function termById(taxonomy: string, id: number) {
  return terms(taxonomy).find((term) => term.id === Number(id));
}
