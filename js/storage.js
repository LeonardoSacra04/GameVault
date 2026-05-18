/* ===== storage.js ===== */
const Storage = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },

  getProfile: () => Storage.get('gv_profile', { nickname: 'Gamer', bio: 'Sem bio ainda.', avatar: '' }),
  setProfile: (d) => Storage.set('gv_profile', d),

  getFavorites: () => Storage.get('gv_favorites', []),
  addFavorite: (g) => { const f = Storage.getFavorites(); if (!f.find(x => x.id === g.id)) { f.push(g); Storage.set('gv_favorites', f); } },
  removeFavorite: (id) => Storage.set('gv_favorites', Storage.getFavorites().filter(g => g.id !== id)),
  isFavorite: (id) => Storage.getFavorites().some(g => g.id === id),

  getPlaying: () => Storage.get('gv_playing', []),
  addPlaying: (g) => { const p = Storage.getPlaying(); if (!p.find(x => x.id === g.id)) { p.push(g); Storage.set('gv_playing', p); } },
  removePlaying: (id) => Storage.set('gv_playing', Storage.getPlaying().filter(g => g.id !== id)),
  isPlaying: (id) => Storage.getPlaying().some(g => g.id === id),

  getReviews: () => Storage.get('gv_reviews', []),
  addReview: (r) => { const reviews = Storage.getReviews(); reviews.unshift({ ...r, id: Date.now(), date: new Date().toISOString(), likes: 0 }); Storage.set('gv_reviews', reviews); },
  removeReview: (id) => Storage.set('gv_reviews', Storage.getReviews().filter(r => r.id !== id)),

  getRating: (id) => (Storage.get('gv_ratings', {}))[id] || 0,
  setRating: (id, val) => { const r = Storage.get('gv_ratings', {}); r[id] = val; Storage.set('gv_ratings', r); },

  getTheme: () => Storage.get('gv_theme', 'padrao'),
  setTheme: (t) => Storage.set('gv_theme', t),
};

/* ===== Temas ===== */
const Temas = {
  lista: [
    { id: 'padrao', nome: 'Deep Space', icone: '🌌' },
    { id: 'neon',   nome: 'Neon Cyber', icone: '⚡' },
    { id: 'sunset', nome: 'Sunset',     icone: '🌅' },
    { id: 'forest', nome: 'Floresta',   icone: '🌲' },
    { id: 'light',  nome: 'Claro',      icone: '☀️' },
  ],
  aplicar(id) {
    document.documentElement.setAttribute('data-theme', id === 'padrao' ? '' : id);
    Storage.setTheme(id);
  },
  init() {
    this.aplicar(Storage.getTheme() || 'padrao');
  },
};
