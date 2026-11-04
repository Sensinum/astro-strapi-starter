document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-podcast-filters]').forEach((bar) => {
    const root = bar.closest('.block-podcasts-slider') || document;
    const slides = [...root.querySelectorAll('.podcast-slide')];
    const apply = (area) => {
      slides.forEach((slide) => {
        const areas = (slide.getAttribute('data-areas') || '').split(',');
        slide.classList.toggle('is-visible', !area || areas.includes(String(area)));
      });
    };
    const current = bar.querySelector('.area-btn.active');
    apply(current ? current.getAttribute('data-area') : '');
    bar.querySelectorAll('.area-btn').forEach((button) => {
      button.addEventListener('click', () => {
        bar.querySelectorAll('.area-btn').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        apply(button.getAttribute('data-area'));
      });
    });
  });

  document.querySelectorAll('[data-filter-root]').forEach((root) => {
    const cards = [...root.querySelectorAll('[data-filter-card]')];
    const search = root.querySelector('[data-filter-search]');
    const count = root.querySelector('[data-filter-count]');
    const pills = root.querySelector('[data-filter-pills]');
    const title = root.querySelector('[data-filter-title]');
    const pageSize = Number(root.getAttribute('data-page-size') || 0);
    const selected = { cats: new Set(), tags: new Set(), search: '' };
    let page = 1;

    const paint = () => {
      const query = selected.search.trim().toLowerCase();
      const matched = cards.filter((card) => {
        const cats = (card.getAttribute('data-cats') || '').split(',').filter(Boolean);
        const tags = (card.getAttribute('data-tags') || '').split(',').filter(Boolean);
        const haystack = `${card.getAttribute('data-title') || ''} ${card.getAttribute('data-people') || ''} ${card.getAttribute('data-name') || ''} ${card.getAttribute('data-position') || ''}`.toLowerCase();
        if (query && !haystack.includes(query)) return false;
        if (selected.cats.size && ![...selected.cats].some((id) => cats.includes(id))) return false;
        if (selected.tags.size && ![...selected.tags].some((id) => tags.includes(id))) return false;
        return true;
      });
      const start = pageSize ? (page - 1) * pageSize : 0;
      const end = pageSize ? start + pageSize : matched.length;
      cards.forEach((card) => card.classList.add('is-hidden'));
      matched.forEach((card, index) => {
        card.classList.toggle('is-hidden', index < start || index >= end);
      });
      if (count) count.textContent = String(matched.length);
      if (title) title.classList.toggle('results', Boolean(query || selected.cats.size || selected.tags.size));
      if (pills) {
        pills.innerHTML = '';
        if (query) pills.insertAdjacentHTML('beforeend', `<span class="pill search">${query} <i class="fas fa-times" data-clear="search"></i></span>`);
        selected.cats.forEach((id) => {
          const name = root.querySelector(`[data-cat="${id}"] span`)?.textContent || id;
          pills.insertAdjacentHTML('beforeend', `<span class="pill cat" data-id="${id}">${name}<i class="fas fa-times" data-clear="cat" data-id="${id}"></i></span>`);
        });
        selected.tags.forEach((id) => {
          const name = root.querySelector(`[data-tag="${id}"] span`)?.textContent || id;
          pills.insertAdjacentHTML('beforeend', `<span class="pill tag" data-id="${id}">${name}<i class="fas fa-times" data-clear="tag" data-id="${id}"></i></span>`);
        });
        if (query || selected.cats.size || selected.tags.size) {
          pills.insertAdjacentHTML('beforeend', `<span class="pill close show">Clear all <i class="fas fa-times" data-clear="all"></i></span>`);
        }
      }
      const pager = root.querySelector('[data-filter-pager]');
      if (pager) {
        const pages = Math.max(1, Math.ceil(matched.length / (pageSize || matched.length || 1)));
        pager.innerHTML = page > 1 ? `<button class="page-numbers" data-page="${page - 1}"><i class="fas fa-arrow-left"></i></button>` : '';
        pager.innerHTML += `<span class="page-numbers current">${page} / ${pages}</span>`;
        if (page < pages) pager.innerHTML += `<button class="page-numbers" data-page="${page + 1}"><i class="fas fa-arrow-right"></i></button>`;
      }
    };

    root.querySelectorAll('[data-cat]').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-cat');
        if (!id) return;
        selected.cats.has(id) ? selected.cats.delete(id) : selected.cats.add(id);
        item.classList.toggle('active');
        page = 1;
        paint();
      });
    });
    root.querySelectorAll('[data-tag]').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-tag');
        if (!id) return;
        selected.tags.has(id) ? selected.tags.delete(id) : selected.tags.add(id);
        item.classList.toggle('active');
        page = 1;
        paint();
      });
    });
    search?.addEventListener('input', () => {
      selected.search = search.value;
      page = 1;
      paint();
    });
    root.addEventListener('click', (event) => {
      const target = event.target.closest('[data-clear],[data-page]');
      if (!target || !root.contains(target)) return;
      const clear = target.getAttribute('data-clear');
      if (clear === 'search') selected.search = '';
      if (clear === 'all') {
        selected.search = '';
        selected.cats.clear();
        selected.tags.clear();
        if (search) search.value = '';
        root.querySelectorAll('.item.active').forEach((item) => item.classList.remove('active'));
      }
      if (clear === 'cat') selected.cats.delete(target.getAttribute('data-id'));
      if (clear === 'tag') selected.tags.delete(target.getAttribute('data-id'));
      if (target.hasAttribute('data-page')) page = Number(target.getAttribute('data-page'));
      paint();
    });
    root.querySelectorAll('.filters__dropdown-label').forEach((label) => {
      label.addEventListener('click', () => label.parentElement?.classList.toggle('opened'));
    });
    paint();
  });

  document.querySelectorAll('[data-past-events]').forEach((root) => {
    const rows = [...root.querySelectorAll('[data-event-row]')];
    const size = Number(root.getAttribute('data-page-size') || rows.length);
    let page = 1;
    const paint = () => {
      rows.forEach((row, index) => {
        const visible = index >= (page - 1) * size && index < page * size;
        row.hidden = !visible;
      });
    };
    root.querySelector('[data-past-prev]')?.addEventListener('click', () => {
      page = Math.max(1, page - 1);
      paint();
    });
    root.querySelector('[data-past-next]')?.addEventListener('click', () => {
      page = Math.min(Math.ceil(rows.length / size), page + 1);
      paint();
    });
    paint();
  });
});
