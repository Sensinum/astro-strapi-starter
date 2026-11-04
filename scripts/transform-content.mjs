/**
 * Transform the WordPress export (scripts/source/sphere-content.json) into
 * Astro content-collection JSON, download referenced uploads, and write vercel.json.
 *
 * Usage: node scripts/transform-content.mjs [path-to-export.json]
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'scripts/source/sphere-content.json');
const CONTENT = path.join(ROOT, 'src/content');
const PUBLIC_UPLOADS = path.join(ROOT, 'public/uploads');
const VIRTUSLAB_CONTACT = 'https://virtuslab.com/contact';
const SITE = 'https://sphere.it';

const COLLECTION_DIRS = {
  page: 'pages',
  blog: 'posts',
  event: 'events',
  event_series: 'event-series',
  speakers: 'speakers',
  talks: 'talks',
  podcast: 'podcasts',
};

const IMAGE_TYPES = new Set(['image', 'file']);
const HTML_TYPES = new Set(['wysiwyg', 'textarea']);

function matchBrace(text, start) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error('Unbalanced JSON object');
}

function stripWpComments(html) {
  return html
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '')
    .replace(/\[gravityform[^\]]*\]/gi, '')
    .replace(/\[mc4wp[^\]]*\]/gi, '')
    .trim();
}

function splitContent(content) {
  if (!content || !content.trim()) return [];
  const parts = [];
  let rest = content;
  while (rest.length) {
    const start = rest.indexOf('<!-- wp:acf/');
    if (start === -1) {
      const html = stripWpComments(rest);
      if (html) parts.push({ kind: 'html', html });
      break;
    }
    const before = stripWpComments(rest.slice(0, start));
    if (before) parts.push({ kind: 'html', html: before });
    const jsonStart = rest.indexOf('{', start);
    if (jsonStart === -1) break;
    const jsonEnd = matchBrace(rest, jsonStart);
    const header = rest.slice(start, jsonStart);
    const nameMatch = header.match(/wp:(acf\/[a-z0-9-]+)/i);
    let parsed;
    try {
      parsed = JSON.parse(rest.slice(jsonStart, jsonEnd + 1));
    } catch (error) {
      console.warn('Failed to parse block JSON', nameMatch?.[1], error.message);
      rest = rest.slice(jsonEnd + 1);
      continue;
    }
    parts.push({
      kind: 'acf',
      name: nameMatch ? nameMatch[1] : parsed.name,
      anchor: parsed.anchor || undefined,
      className: parsed.className || undefined,
      data: parsed.data || {},
    });
    const end = rest.indexOf('/-->', jsonEnd);
    rest = rest.slice(end === -1 ? jsonEnd + 1 : end + 4);
  }
  return parts;
}

function asArray(value) {
  if (value == null || value === '' || value === false) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'number') return [value];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        /* fall through */
      }
    }
    if (trimmed.includes(',')) return trimmed.split(',').map((part) => part.trim()).filter(Boolean);
    return [trimmed];
  }
  return [value];
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function groupsForBlock(fieldGroups, blockName) {
  return fieldGroups.filter((group) =>
    (group.location || []).some((rules) =>
      (rules || []).some((rule) => rule.param === 'block' && rule.value === blockName),
    ),
  );
}

function mergeFields(groups) {
  const byName = new Map();
  for (const group of groups) {
    for (const field of group.fields || []) {
      if (!field.name || field.type === 'accordion' || field.type === 'message' || field.type === 'tab') continue;
      const existing = byName.get(field.name);
      if (!existing || (field.sub_fields && !existing.sub_fields)) byName.set(field.name, field);
    }
  }
  return [...byName.values()];
}

function unflatten(fields, data, prefix = '') {
  const out = {};
  for (const field of fields) {
    if (!field.name) continue;
    const key = prefix ? `${prefix}_${field.name}` : field.name;
    if (field.type === 'repeater' || field.type === 'flexible_content') {
      const count = Number(data[key] || 0) || 0;
      const rows = [];
      for (let i = 0; i < count; i++) {
        rows.push(unflatten(field.sub_fields || [], data, `${key}_${i}`));
      }
      out[field.name] = rows;
      continue;
    }
    if (field.type === 'group' && field.sub_fields) {
      out[field.name] = unflatten(field.sub_fields, data, key);
      continue;
    }
    out[field.name] = normalizeScalar(data[key], field);
  }
  return out;
}

function normalizeScalar(value, field) {
  if (field.type === 'true_false') {
    return value === true || value === 1 || value === '1';
  }
  if (value === '' || value == null || value === false) return null;
  if (IMAGE_TYPES.has(field.type)) {
    const id = toInt(value);
    return id ? { id, pending: true } : null;
  }
  if (field.type === 'gallery') {
    return asArray(value)
      .map((item) => toInt(item))
      .filter(Boolean)
      .map((id) => ({ id, pending: true }));
  }
  if (field.type === 'link' && value && typeof value === 'object') {
    return {
      title: value.title || '',
      url: value.url || '',
      target: value.target || '',
    };
  }
  if (HTML_TYPES.has(field.type)) return String(value);
  if (field.type === 'post_object' || field.type === 'relationship' || field.type === 'page_link') {
    const ids = asArray(value).map(toInt).filter((id) => id);
    if (field.multiple || field.type === 'relationship') return ids;
    return ids[0] ?? null;
  }
  if (field.type === 'taxonomy' || field.type === 'checkbox' || field.type === 'select') {
    if (field.multiple || field.type === 'checkbox') {
      return asArray(value).map((item) => {
        const n = toInt(item);
        return n ?? item;
      });
    }
    if (field.type === 'taxonomy') {
      const n = toInt(value);
      return n ?? null;
    }
  }
  if (field.type === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return value;
}

function slimImage(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (typeof obj.url === 'string' && (obj.ID || obj.id || obj.filename || obj.mime_type)) {
    return {
      id: Number(obj.ID || obj.id) || null,
      url: obj.url,
      alt: obj.alt || obj.title || '',
      width: obj.width || null,
      height: obj.height || null,
    };
  }
  return null;
}

function slimAcf(value) {
  if (Array.isArray(value)) return value.map(slimAcf);
  if (value && typeof value === 'object') {
    const image = slimImage(value);
    if (image) return image;
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith('_')) continue;
      out[key] = slimAcf(child);
    }
    return out;
  }
  return value;
}

function seoFromMeta(meta = {}) {
  const seo = {};
  if (meta._yoast_wpseo_title) seo.title = String(meta._yoast_wpseo_title);
  if (meta._yoast_wpseo_metadesc) seo.description = String(meta._yoast_wpseo_metadesc);
  if (meta._yoast_wpseo_opengraph_title || meta['_yoast_wpseo_opengraph-title']) {
    seo.ogTitle = String(meta._yoast_wpseo_opengraph_title || meta['_yoast_wpseo_opengraph-title']);
  }
  if (meta._yoast_wpseo_opengraph_description || meta['_yoast_wpseo_opengraph-description']) {
    seo.ogDescription = String(
      meta._yoast_wpseo_opengraph_description || meta['_yoast_wpseo_opengraph-description'],
    );
  }
  const og = meta._yoast_wpseo_opengraph_image || meta['_yoast_wpseo_opengraph-image'];
  if (og) seo.ogImage = String(og);
  return seo;
}

function termsOf(post) {
  const terms = {};
  const raw = post.terms || {};
  for (const [tax, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    terms[tax] = list.map((term) => ({
      id: Number(term.id),
      slug: term.slug,
      name: term.name,
    }));
  }
  return terms;
}

function pathFromUrl(url) {
  try {
    const parsed = new URL(url, SITE);
    let pathname = parsed.pathname || '/';
    if (!pathname.endsWith('/')) pathname += '/';
    return pathname;
  } catch {
    return '/';
  }
}

function collectIds(value, ids) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectIds(item, ids));
    return;
  }
  if (typeof value === 'object') {
    if (value.pending && value.id) ids.add(Number(value.id));
    for (const child of Object.values(value)) collectIds(child, ids);
  }
}

function applyMedia(value, media) {
  if (!value) return value;
  if (Array.isArray(value)) return value.map((item) => applyMedia(item, media));
  if (typeof value === 'object') {
    if (value.pending && value.id) {
      return media.get(Number(value.id)) || null;
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = applyMedia(child, media);
    return out;
  }
  return value;
}

async function fetchMedia(ids) {
  const map = new Map();
  const list = [...ids];
  const chunkSize = 40;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const url = `${SITE}/wp-json/wp/v2/media?include=${chunk.join(',')}&per_page=100&_fields=id,source_url,alt_text,media_details,title`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Media API failed', response.status, chunk.slice(0, 5));
      continue;
    }
    const items = await response.json();
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const details = item.media_details || {};
      map.set(item.id, {
        id: item.id,
        url: item.source_url,
        alt: item.alt_text || item.title?.rendered || '',
        width: details.width || null,
        height: details.height || null,
      });
    }
  }
  return map;
}

function collectUploadUrls(value, urls) {
  if (typeof value === 'string') {
    const re = /https?:\/\/sphere\.it\/wp-content\/uploads\/[^\s"'<>)\\]+/g;
    for (const match of value.match(re) || []) {
      urls.add(match.replace(/&amp;/g, '&').replace(/[.,;]+$/, ''));
    }
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => collectUploadUrls(item, urls));
  else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectUploadUrls(child, urls);
  }
}

function localUploadPath(remoteUrl) {
  const parsed = new URL(remoteUrl);
  const marker = '/wp-content/uploads/';
  const idx = parsed.pathname.indexOf(marker);
  if (idx === -1) return null;
  const rel = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  return { rel, publicPath: `/uploads/${rel.split('/').map(encodeURIComponent).join('/')}`.replace(/%2F/g, '/') };
}

async function downloadAll(urls) {
  await mkdir(PUBLIC_UPLOADS, { recursive: true });
  const failures = [];
  const queue = [...urls];
  let done = 0;
  async function worker() {
    while (queue.length) {
      const remote = queue.pop();
      const mapped = localUploadPath(remote);
      if (!mapped) continue;
      const dest = path.join(PUBLIC_UPLOADS, mapped.rel);
      try {
        await access(dest);
        done++;
        continue;
      } catch {
        /* download */
      }
      await mkdir(path.dirname(dest), { recursive: true });
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          const response = await fetch(remote);
          if (!response.ok || !response.body) throw new Error(String(response.status));
          await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
          ok = true;
        } catch (error) {
          if (attempt === 2) failures.push({ remote, error: error.message });
        }
      }
      done++;
      if (done % 50 === 0) console.log(`downloaded ${done}/${urls.size}`);
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`downloaded ${done} uploads, failures ${failures.length}`);
  return failures;
}

function rewriteString(value) {
  if (typeof value !== 'string' || !value.includes('sphere.it')) return value;
  let next = value.replace(/https?:\/\/sphere\.it\/wp-content\/uploads\//g, '/uploads/');
  next = next.replace(/https?:\/\/sphere\.it(?=[:\/?#]|$)/g, '');
  next = next.replace(/href=(["'])\/(?!\/)/g, 'href=$1/');
  return next;
}

function rewriteTree(value) {
  if (typeof value === 'string') return rewriteString(value);
  if (Array.isArray(value)) return value.map(rewriteTree);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = rewriteTree(child);
    return out;
  }
  return value;
}

function isFormTarget(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('become-a-speaker') ||
    lower.includes('gravity') ||
    lower.includes('gf_') ||
    lower.includes('admin-ajax')
  );
}

function rewriteHtmlHrefs(html) {
  return html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    if (isFormTarget(href)) return `href=${quote}${VIRTUSLAB_CONTACT}${quote}`;
    return match;
  });
}

function rewriteContactLinks(value, key = '') {
  if (typeof value === 'string') {
    if ((key === 'url' || key === 'href') && isFormTarget(value)) return VIRTUSLAB_CONTACT;
    if (key === 'html' || key === 'excerpt' || key === 'description' || key === 'block_description' || key === 'block_descriptionn') {
      return rewriteHtmlHrefs(value);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteContactLinks(item));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [childKey, child] of Object.entries(value)) {
      if (childKey === 'contact_email') {
        out[childKey] = child;
        out.contact_href = VIRTUSLAB_CONTACT;
      } else {
        out[childKey] = rewriteContactLinks(child, childKey);
      }
    }
    return out;
  }
  return value;
}

function safeSlug(slug) {
  return String(slug || 'untitled').replace(/[^\w.-]+/g, '-');
}

function buildRedirects(redirects, generatedPaths) {
  const kept = [];
  const dropped = [];
  const seen = new Set();
  for (const redirect of redirects) {
    const code = Number(redirect.action_code) || 301;
    let source = redirect.url || '';
    let destination = redirect.action_data || '';
    const reason = [];
    const blob = `${source} ${destination}`.toLowerCase();
    if (blob.includes('wp-admin') || blob.includes('wp-login') || blob.includes('gravity') || blob.includes('/gf_')) {
      reason.push('admin-or-form');
    }
    if (!source.startsWith('/')) source = `/${source}`;
    if (destination.startsWith(SITE)) destination = destination.slice(SITE.length) || '/';
    if (!destination.startsWith('/') && !destination.startsWith('http')) destination = `/${destination}`;
    const norm = (value) => value.split('?')[0].replace(/\/+$/, '') || '/';
    if (norm(source) === norm(destination)) reason.push('loop');
    source = source
      .replace(/[()]/g, (ch) => `\\${ch}`)
      .replace(/:([a-z])/gi, '\\:$1');
    if (seen.has(source)) reason.push('duplicate');
    if (reason.length) {
      dropped.push({ url: redirect.url, to: redirect.action_data, reason: reason.join(',') });
      continue;
    }
    seen.add(source);
    kept.push({
      source,
      destination,
      permanent: code === 301 || code === 308,
    });
  }
  return { kept, dropped };
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  console.log('reading', SOURCE);
  const raw = JSON.parse(await readFile(SOURCE, 'utf8'));
  const fieldGroups = raw.acf_field_groups || [];
  const mediaIds = new Set();

  const entries = [];
  for (const [type, posts] of Object.entries(raw.posts)) {
    for (const post of posts) {
      const blocks = splitContent(post.content || '').map((block) => {
        if (block.kind !== 'acf') return block;
        const fields = mergeFields(groupsForBlock(fieldGroups, block.name));
        const data = fields.length ? unflatten(fields, block.data || {}) : {};
        return { ...block, data };
      });
      const entry = {
        wpId: post.id,
        type,
        title: post.title || '',
        slug: post.slug,
        path: pathFromUrl(post.url),
        date: post.date,
        modified: post.modified,
        template: (post.template || '').replace(/^templates\//, '').replace(/\.php$/, '') || null,
        excerpt: stripWpComments(post.excerpt || ''),
        featuredImage: post.featured_image || null,
        seo: seoFromMeta(post.meta || {}),
        terms: termsOf(post),
        acf: slimAcf(post.acf || {}),
        blocks,
        formReplaced: post.template === 'templates/page-form.php',
      };
      if (entry.formReplaced) {
        entry.acf = {
          label: post.acf?.page_form_label || post.title,
          contactUrl: VIRTUSLAB_CONTACT,
        };
        entry.blocks = [];
      }
      collectIds(entry, mediaIds);
      entries.push(entry);
    }
  }

  console.log('resolving', mediaIds.size, 'attachment ids');
  const media = await fetchMedia(mediaIds);
  for (const entry of entries) {
    entry.blocks = entry.blocks.map((block) =>
      block.kind === 'acf' ? { ...block, data: applyMedia(block.data, media) } : block,
    );
    entry.acf = applyMedia(entry.acf, media);
  }

  const missingMedia = [...mediaIds].filter((id) => !media.has(id));
  console.log('unresolved attachment ids', missingMedia.length);

  let tree = { entries, menus: raw.menus, options: raw.acf_options, taxonomies: raw.taxonomies, site: raw.site };
  const uploadUrls = new Set();
  collectUploadUrls(tree, uploadUrls);
  for (const item of media.values()) if (item?.url) uploadUrls.add(item.url);
  console.log('unique upload urls', uploadUrls.size);
  const failures = await downloadAll(uploadUrls);

  tree = rewriteTree(tree);
  tree = rewriteContactLinks(tree);

  // Options: become-a-speaker button goes to VirtusLab. Nominate was empty.
  if (tree.options?.become_speaker_btn?.url) {
    tree.options.become_speaker_btn.url = VIRTUSLAB_CONTACT;
  }
  if (tree.options?.nominate_speaker_btn && typeof tree.options.nominate_speaker_btn === 'object') {
    if (tree.options.nominate_speaker_btn.url) tree.options.nominate_speaker_btn.url = VIRTUSLAB_CONTACT;
  }

  for (const menu of Object.values(tree.menus || {})) {
    for (const item of menu.items || []) {
      if (isFormTarget(item.url) || /become a partner/i.test(item.title || '')) {
        item.url = VIRTUSLAB_CONTACT;
        item.target = '_blank';
      }
    }
  }

  try {
    const fallback = JSON.parse(await readFile(path.join(ROOT, 'scripts/source/slideshow-gallery.json'), 'utf8'));
    const home = tree.entries.find((entry) => entry.type === 'page' && entry.slug === 'home');
    const slideshow = home?.blocks?.find((block) => block.name === 'acf/block-slideshow-v2');
    if (slideshow?.data && Array.isArray(fallback) && fallback.length) {
      const current = slideshow.data.block_gallery || [];
      if (!current.length || current.some((image) => !image?.url)) slideshow.data.block_gallery = fallback;
    }
  } catch {
    /* optional: private attachments the media API will not return */
  }

  // Clear collection dirs by rewriting every file we own. Remove stale files first.
  const { rm } = await import('node:fs/promises');
  for (const dir of Object.values(COLLECTION_DIRS)) {
    const full = path.join(CONTENT, dir);
    await rm(full, { recursive: true, force: true });
    await mkdir(full, { recursive: true });
  }

  const counts = {};
  const generatedPaths = new Set();
  const usedSlugs = new Map();
  for (const entry of tree.entries) {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
    const dir = COLLECTION_DIRS[entry.type];
    let fileSlug = safeSlug(entry.slug);
    const stamp = `${dir}/${fileSlug}`;
    if (usedSlugs.has(stamp)) {
      fileSlug = `${fileSlug}-${entry.wpId}`;
    }
    usedSlugs.set(`${dir}/${fileSlug}`, true);
    const { type, ...data } = entry;
    await writeJson(path.join(CONTENT, dir, `${fileSlug}.json`), data);
    generatedPaths.add(entry.path.replace(/\/+$/, '') || '/');
    generatedPaths.add(entry.path);
  }

  // Taxonomies derived from posts for talks_cat / talks_tags (not in the export list).
  const derived = {};
  for (const entry of tree.entries) {
    for (const [tax, terms] of Object.entries(entry.terms || {})) {
      derived[tax] ||= {};
      for (const term of terms) derived[tax][term.id] = term;
    }
  }
  const taxonomies = {};
  for (const [tax, terms] of Object.entries(tree.taxonomies || {})) {
    if (!Array.isArray(terms) || terms.length === 0) continue;
    taxonomies[tax] = terms.map((term) => {
      const acf = term.acf && typeof term.acf === 'object' ? term.acf : {};
      const color = Object.values(acf).find((value) => typeof value === 'string' && value.startsWith('#'));
      return {
        id: Number(term.id),
        slug: term.slug,
        name: term.name,
        description: term.description || '',
        parent: term.parent || 0,
        ...(color ? { color } : {}),
      };
    });
  }
  for (const [tax, map] of Object.entries(derived)) {
    if (!taxonomies[tax]) taxonomies[tax] = Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }

  const socials = [
    { href: 'https://www.facebook.com/sphereitconf/', title: 'Sphere.it Facebook profile', icon: 'fa-brands fa-facebook' },
    { href: 'https://twitter.com/sphere_it_', title: 'Sphere.it Twitter profile', icon: 'fa-brands fa-x-twitter' },
    { href: 'https://www.instagram.com/sphereit_/', title: 'Sphere.it Instagram profile', icon: 'fa-brands fa-instagram' },
    { href: 'https://www.linkedin.com/company/sphereit', title: 'Sphere.it LinkedIn profile', icon: 'fa-brands fa-linkedin' },
    { href: 'https://www.youtube.com/@sphere_it', title: 'Sphere.it YouTube channel', icon: 'fa-brands fa-youtube' },
  ];

  const site = {
    url: SITE,
    name: raw.site?.name || 'Sphere.it',
    description: raw.site?.description || '',
    contactUrl: VIRTUSLAB_CONTACT,
    menus: {
      main: tree.menus['main-menu-new'],
      footer: tree.menus['footer-main-pages'],
      podcast: tree.menus['podcast-menu'],
    },
    options: {
      allSpeakers: tree.options?.all_speakers_btn || null,
      becomeSpeaker: tree.options?.become_speaker_btn || null,
      nominateSpeaker: tree.options?.nominate_speaker_btn || null,
      eventsPage: tree.options?.events_page || null,
      talksPage: tree.options?.talks_page || null,
    },
    taxonomies,
    socials,
  };
  await writeJson(path.join(ROOT, 'src/data/site.json'), site);

  const { kept, dropped } = buildRedirects(raw.redirects || [], generatedPaths);
  const vercel = {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: 'astro',
    trailingSlash: true,
    redirects: kept,
  };
  await writeJson(path.join(ROOT, 'vercel.json'), vercel);

  const report = {
    counts,
    pages: tree.entries.filter((entry) => entry.type === 'page').map((entry) => ({ title: entry.title, path: entry.path, template: entry.template })),
    mediaDownloaded: uploadUrls.size - failures.length,
    mediaFailed: failures.slice(0, 40),
    unresolvedAttachmentIds: missingMedia,
    redirectsKept: kept.length,
    redirectsDropped: dropped.length,
    redirectsDroppedSample: dropped.slice(0, 30),
    formReplacement: VIRTUSLAB_CONTACT,
  };
  await writeJson(path.join(ROOT, 'src/data/transform-report.json'), report);
  console.log(JSON.stringify({ counts, redirectsKept: kept.length, redirectsDropped: dropped.length, failed: failures.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
