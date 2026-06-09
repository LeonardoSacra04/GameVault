const API_KEY = 'b3b0db1042ec4be1b8fc13ebffe0f382';
const BASE = 'https://api.rawg.io/api';

function gerarPreco(rating, released) {
  if (!released) return { price: 0, originalPrice: 0, discount: 0 };
  const base = rating > 4 ? 199.90 : rating > 3 ? 149.90 : rating > 2 ? 99.90 : 59.90;
  const temDesconto = Math.random() > 0.6;
  const pct = temDesconto ? [10, 20, 25, 33, 50, 66, 75][Math.floor(Math.random() * 7)] : 0;
  return { price: temDesconto ? +(base * (1 - pct / 100)).toFixed(2) : base, originalPrice: base, discount: pct };
}

const Api = {
  async fetch(endpoint, params = {}) {
    const url = new URL(`${BASE}${endpoint}`);
    url.searchParams.set('key', API_KEY);
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, v); });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },

  enriquecer: (g) => ({ ...g, ...gerarPreco(g.rating, g.released) }),

  async getPopular(page = 1, pageSize = 20) {
    const d = await this.fetch('/games', { ordering: '-rating', page, page_size: pageSize, metacritic: '70,100' });
    return { ...d, results: d.results.map(this.enriquecer) };
  },

  async getLancamentos(page = 1, pageSize = 20) {
    const hoje = new Date().toISOString().split('T')[0];
    const tresM = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const d = await this.fetch('/games', { dates: `${tresM},${hoje}`, ordering: '-released', page, page_size: pageSize });
    return { ...d, results: d.results.map(this.enriquecer) };
  },

  async getDeals(page = 1, pageSize = 20) {
    const d = await this.fetch('/games', { ordering: '-added', page, page_size: pageSize });
    return { ...d, results: d.results.map(this.enriquecer).filter(g => g.discount > 0) };
  },

  async getTrending(page = 1, pageSize = 20) {
    const hoje = new Date().toISOString().split('T')[0];
    const tresM = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const d = await this.fetch('/games', { ordering: '-added', page, page_size: pageSize, dates: `${tresM},${hoje}` });
    return { ...d, results: d.results.map(this.enriquecer) };
  },

  async getCatalogo({ page = 1, pageSize = 24, search = '', genres = '', ordering = '-rating' } = {}) {
    const params = { page, page_size: pageSize, ordering };
    if (search) params.search = search;
    if (genres) params.genres = genres;
    const d = await this.fetch('/games', params);
    return { ...d, results: d.results.map(this.enriquecer) };
  },

  async getJogo(id) {
    return this.enriquecer(await this.fetch(`/games/${id}`));
  },

  async getGeneros() {
    return this.fetch('/genres', { page_size: 20 });
  },

  async buscar(q) {
    const d = await this.fetch('/games', { search: q, page_size: 8 });
    return d.results.map(this.enriquecer);
  },
};

const FiltroNsfw = (() => {

  const TAGS_ADULTAS = [
    'hentai', 'eroge', 'erotic', 'erotica', 'adult', 'nsfw',
    'nudity', 'sexual content', 'explicit', 'pornographic',
    'adult only', 'sexually explicit', 'ecchi', 'lewd',
    '18+', 'nude', 'sex', 'xxx', 'porn', 'eroge'
  ];

  const PALAVRAS_BLOQUEADAS = [
    'hentai', 'eroge', 'erotic', 'erotica', 'nsfw', 'nude',
    'naked', 'xxx', 'porn', 'lewd', 'ecchi', 'adult game',
    'adult visual novel', 'dating sim adult', 'jogo adulto',
    'sexo', 'simulador sexual', 'sexual simulator'
  ];

  const GENEROS_ADULTOS = ['adult'];

  const TAGS_RAWG_ADULTAS = [
    'adult', 'adult content', 'hentai', 'eroge', 'nsfw',
    'mature content', 'nude', 'nudity', 'sexual content',
    'erotic', 'lewd', 'ecchi', 'adult only'
  ];

  function _nomeSuspeito(nome = '') {
    const n = nome.toLowerCase();
    return PALAVRAS_BLOQUEADAS.some(p => n.includes(p));
  }

  function _temGeneroAdulto(genres = []) {
    return genres.some(g =>
      GENEROS_ADULTOS.includes((g.slug || '').toLowerCase()) ||
      GENEROS_ADULTOS.includes((g.name || '').toLowerCase())
    );
  }

  function _temTagAdulta(tags = []) {
    return tags.some(t => {
      const name = (t.name || t.slug || '').toLowerCase();
      return TAGS_RAWG_ADULTAS.some(a => name.includes(a));
    });
  }

  function _esrbAdulto(esrb) {
    if (!esrb) return false;
    const slug = (esrb.slug || esrb.name || '').toLowerCase();
    return slug === 'adults-only' || slug === 'ao';
  }

  return {
    ehAdulto(jogo) {
      if (!jogo) return false;
      return (
        _nomeSuspeito(jogo.name) ||
        _temGeneroAdulto(jogo.genres || []) ||
        _temTagAdulta(jogo.tags || []) ||
        _esrbAdulto(jogo.esrb_rating)
      );
    },

    filtrar(jogos = []) {
      if (Storage.getMostrarAdultos()) return jogos; // filtro desligado → passa tudo
      return jogos.filter(g => !this.ehAdulto(g));
    },

    mostrarAdultos() {
      return Storage.getMostrarAdultos();
    },
  };
})();

