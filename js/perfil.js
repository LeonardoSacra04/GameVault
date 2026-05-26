/* ===== perfil.js =====
   Depende de: storage.js  →  Storage, Temas
              filtroNsfw.js → FiltroNsfw
              ui.js         →  toast, abrirModal
================================================================ */

/* ============================================================
   AVATAR EDITOR (integrado — ex-avatar-editor.js)
============================================================ */
const AvatarEditor = (() => {
  const SIZE    = 300;
  const QUALITY = 0.92;

  let img = null, scale = 1, ox = 0, oy = 0;
  let dragging = false, lastX = 0, lastY = 0;
  let canvas, ctx, clip, slider, editor, zoomVal, inputFile;

  function draw() {
    if (!img) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, ox, oy, img.naturalWidth * scale, img.naturalHeight * scale);
    _syncPreviews();
  }

  function _syncPreviews() {
    const url = canvas.toDataURL('image/jpeg', QUALITY);
    document.querySelectorAll('[data-avatar-preview]').forEach(el => {
      el.src = url;
      el.style.objectFit = 'cover';
      el.style.width = '100%';
      el.style.height = '100%';
    });
  }

  function _fitAndCenter() {
    const ratio = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    scale = ratio;
    slider.min   = Math.round(ratio * 100);
    slider.max   = 300;
    slider.value = Math.round(ratio * 100);
    zoomVal.textContent = Math.round(ratio * 100) + '%';
    ox = (SIZE - img.naturalWidth  * scale) / 2;
    oy = (SIZE - img.naturalHeight * scale) / 2;
    draw();
  }

  function _loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast('Imagem muito grande (máx 5 MB)', 'aviso'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const i = new Image();
      i.onload = () => {
        img = i;
        editor.classList.add('av-show');
        editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        _fitAndCenter();
      };
      i.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function _getPos(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX,            y: e.clientY };
  }

  function _startDrag(e) { dragging = true; const p = _getPos(e); lastX = p.x; lastY = p.y; }
  function _doDrag(e) {
    if (!dragging) return;
    const p = _getPos(e);
    ox += p.x - lastX; oy += p.y - lastY;
    lastX = p.x; lastY = p.y;
    draw();
  }
  function _endDrag() { dragging = false; }

  function _onWheel(e) {
    e.preventDefault();
    const delta    = e.deltaY < 0 ? 0.06 : -0.06;
    const minScale = parseFloat(slider.min) / 100;
    const newScale = Math.max(minScale, Math.min(3, scale + delta));
    const cx = SIZE / 2 - ox, cy = SIZE / 2 - oy;
    const ratio = newScale / scale;
    scale = newScale;
    ox = SIZE / 2 - cx * ratio;
    oy = SIZE / 2 - cy * ratio;
    slider.value        = Math.round(scale * 100);
    zoomVal.textContent = Math.round(scale * 100) + '%';
    draw();
  }

  function _onSlider() {
    const newScale = parseInt(slider.value) / 100;
    const cx = SIZE / 2 - ox, cy = SIZE / 2 - oy;
    const ratio = newScale / scale;
    scale = newScale;
    ox = SIZE / 2 - cx * ratio;
    oy = SIZE / 2 - cy * ratio;
    zoomVal.textContent = Math.round(newScale * 100) + '%';
    draw();
  }

  function salvar() {
  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

  try {
    Storage.setProfile({ avatar: dataUrl });
  } catch (e) {
    toast('Imagem muito grande para salvar localmente.', 'erro');
    return;
  }

  // Atualiza TODOS os avatares
  document.querySelectorAll('[data-avatar]').forEach(el => {
    el.src = dataUrl;
  });

  // Atualiza preview do modal
  const previewModal = document.getElementById('previewAvatarModal');
  if (previewModal) {
    previewModal.src = dataUrl;
  }

  // Atualiza avatar navbar
  const navAvatar = document.getElementById('avatarNavbar');
  if (navAvatar) {
    navAvatar.src = dataUrl;
  }

  editor.classList.remove('av-show');
  img = null;

  toast('✅ Foto de perfil salva!', 'sucesso');
}

  function cancelar() {
    editor.classList.remove('av-show');
    img = null;
  }

  function init() {
    canvas    = document.getElementById('avCanvas');
    ctx       = canvas?.getContext('2d');
    clip      = document.getElementById('avClip');
    slider    = document.getElementById('avZoomSlider');
    editor    = document.getElementById('avEditor');
    zoomVal   = document.getElementById('avZoomVal');
    inputFile = document.getElementById('avInputFile');

    if (!canvas) return;
    canvas.width  = SIZE;
    canvas.height = SIZE;

    document.getElementById('avBtnEditarAvatar')
      ?.addEventListener('click', () => inputFile.click());

    inputFile.addEventListener('change', e => _loadFile(e.target.files[0]));

    clip.addEventListener('mousedown',  _startDrag);
    clip.addEventListener('touchstart', _startDrag, { passive: true });
    window.addEventListener('mousemove', _doDrag);
    window.addEventListener('touchmove', _doDrag,  { passive: true });
    window.addEventListener('mouseup',  _endDrag);
    window.addEventListener('touchend', _endDrag);

    clip.addEventListener('wheel', _onWheel, { passive: false });
    slider.addEventListener('input', _onSlider);

    document.getElementById('avBtnSalvar')  ?.addEventListener('click', salvar);
    document.getElementById('avBtnCancelar')?.addEventListener('click', cancelar);
    document.getElementById('avBtnOutra')   ?.addEventListener('click', () => inputFile.click());

    const p = Storage.getProfile();
    if (p.avatar) {
      document.querySelectorAll('[data-avatar]').forEach(el => { el.src = p.avatar; });
    }
  }

  return { init, salvar, cancelar };
})();

/* ============================================================
   INICIALIZAÇÃO
============================================================ */
function initPerfil() {
  AvatarEditor.init();
  Temas.init();
  _carregarCabecalho();
  _carregarTemaAtivo();
  _carregarFavoritos();
  _carregarReviews();
  _carregarJogando();
  _carregarConcluidos();
  _carregarQueroJogar();
  _carregarStats();
  _bindTabs();
  _bindBtnEditar();
  _bindModalEdicao();
  _bindTemas();
  _bindToggleAdultos();
  _bindBanner();
  _bindNavbarAvatar();
  _bindMenuMobile();
  initBuscaNavbar();
}

/* ============================================================
   CABEÇALHO
============================================================ */
function _carregarCabecalho() {
  const p = Storage.getProfile();
  _aplicarNome(p.nickname || 'Gamer');
  _aplicarBio(p.bio || '');

  if (p.avatar) {
    document.getElementById('avatarPerfil').src = p.avatar;
  }

  if (p.banner) {
    const banner = document.getElementById('perfilBanner');
    banner.style.backgroundImage = `url('${p.banner}')`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
    banner.classList.add('temImagem');
  }
}

function _aplicarNome(nome) {
  document.getElementById('nomePerfil').textContent = nome;
  document.getElementById('handlePerfil').textContent =
    '@' + nome.toLowerCase().replace(/\s+/g, '') + ' · GameVault';
}

function _aplicarBio(bio) {
  const el = document.getElementById('textoBio');
  if (bio) {
    el.textContent = bio;
    el.classList.remove('vazio');
  } else {
    el.textContent = 'Nenhuma bio ainda. Clique em "Editar Perfil" para adicionar.';
    el.classList.add('vazio');
  }
}

function _bindNavbarAvatar(src) {
  const nav = document.getElementById('avatarNavbar');
  if (!nav) return;
  if (src) { nav.src = src; return; }
  const p = Storage.getProfile();
  nav.src = p.avatar ||
    `https://placehold.co/36x36/0d1525/4a5e80?text=${(p.nickname || 'G')[0].toUpperCase()}`;
}

/* ============================================================
   BANNER CUSTOMIZÁVEL
============================================================ */
function _bindBanner() {
  const btnBanner  = document.getElementById('btnEditarBanner');
  const inputBanner = document.getElementById('inputBanner');
  if (!btnBanner || !inputBanner) return;

  btnBanner.addEventListener('click', () => inputBanner.click());

  inputBanner.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠️ Imagem muito grande (máx 4 MB)', 'aviso'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      const banner = document.getElementById('perfilBanner');
      banner.style.backgroundImage = `url('${base64}')`;
      banner.style.backgroundSize  = 'cover';
      banner.style.backgroundPosition = 'center';
      banner.classList.add('temImagem');
      Storage.setProfile({ banner: base64 });
      toast('🖼️ Banner atualizado!', 'sucesso');
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   BOTÃO "EDITAR PERFIL"
============================================================ */
function _bindBtnEditar() {
  document.getElementById('btnEditar')?.addEventListener('click', _abrirModalEdicao);
}

document.querySelector('.previewAvatarWrap')
  ?.addEventListener('click', () => {
    document.getElementById('avInputFile')?.click();
  });

/* ============================================================
   MODAL DE EDIÇÃO
============================================================ */
function _abrirModalEdicao() {
  const p     = Storage.getProfile();
  const modal = document.getElementById('modalEdicaoPerfil');

  const inputNome   = document.getElementById('inputNomeModal');
  const textareaBio = document.getElementById('textareaBioModal');
  inputNome.value   = p.nickname || 'Gamer';
  textareaBio.value = p.bio || '';

  _atualizarPreviewModal(inputNome.value);
  _contadorModal('contadorNome', inputNome, 32);
  _contadorModal('contadorBio', textareaBio, 300);

  const previewImg = document.getElementById('previewAvatarModal');
  previewImg.src = p.avatar ||
    `https://placehold.co/80x80/0d1525/4a5e80?text=${(p.nickname || 'G')[0].toUpperCase()}`;

  modal.style.display = '';
  modal.removeAttribute('style');
  document.body.style.overflow = 'hidden';
  inputNome.focus();
  inputNome.select();
  document.getElementById('badgeEditando').classList.add('visivel');
}

function _fecharModalEdicao(salvar = false) {
  if (salvar) {
    const nome = (document.getElementById('inputNomeModal').value.trim()) || 'Gamer';
    const bio  = document.getElementById('textareaBioModal').value.trim();
    Storage.setProfile({ nickname: nome, bio });
    _aplicarNome(nome);
    _aplicarBio(bio);
    _bindNavbarAvatar();
    toast('✅ Perfil salvo!', 'sucesso');
  }
  document.getElementById('modalEdicaoPerfil').style.display = 'none';
  document.body.style.overflow = '';
  document.getElementById('badgeEditando').classList.remove('visivel');
}

function _atualizarPreviewModal(nome) {
  document.getElementById('previewNomeModal').textContent = nome || 'Gamer';
  document.getElementById('previewHandleModal').textContent =
    '@' + (nome || 'gamer').toLowerCase().replace(/\s+/g, '') + ' · GameVault';
}

function _contadorModal(idContador, campo, max) {
  const el = document.getElementById(idContador);
  const att = () => {
    const len = campo.value.length;
    el.textContent = `${len}/${max}`;
    el.classList.toggle('quase', len >= max * 0.8 && len < max);
    el.classList.toggle('limite', len >= max);
  };
  campo.removeEventListener('input', campo._contadorFn);
  campo._contadorFn = att;
  campo.addEventListener('input', att);
  att();
}

function _bindModalEdicao() {
  const modal = document.getElementById('modalEdicaoPerfil');

  document.getElementById('btnFecharModalEdicao')?.addEventListener('click', () => _fecharModalEdicao(false));
  document.getElementById('btnCancelarEdicao')?.addEventListener('click', () => _fecharModalEdicao(false));
  document.getElementById('btnSalvarEdicao')?.addEventListener('click', () => _fecharModalEdicao(true));

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) _fecharModalEdicao(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const computed = modal ? window.getComputedStyle(modal) : null;
      if (computed && computed.display !== 'none') _fecharModalEdicao(false);
    }
  });

  document.getElementById('inputNomeModal')?.addEventListener('input', (e) => {
    _atualizarPreviewModal(e.target.value.trim());
  });
}

/* ============================================================
   TEMAS
============================================================ */
function _bindTemas() {
  document.querySelectorAll('.btnTema').forEach(btn => {
    btn.addEventListener('click', () => {
      Temas.aplicar(btn.dataset.tema);
      _carregarTemaAtivo();
      toast('🎨 Tema aplicado!', 'sucesso');
    });
  });
}

function _carregarTemaAtivo() {
  const atual = Storage.getTheme() || 'padrao';
  document.querySelectorAll('.btnTema').forEach(b => {
    b.classList.toggle('ativo', b.dataset.tema === atual);
  });
}

/* ============================================================
   TOGGLE CONTEÚDO ADULTO
============================================================ */
function _bindToggleAdultos() {
  const toggle = document.getElementById('toggleAdultos');
  if (!toggle) return;
  toggle.checked = Storage.getMostrarAdultos();
  toggle.addEventListener('change', () => {
    Storage.setMostrarAdultos(toggle.checked);
    toast(toggle.checked ? '🔞 Conteúdo adulto ativado' : '🔒 Conteúdo adulto ocultado',
          toggle.checked ? 'aviso' : 'sucesso');
  });
}

/* ============================================================
   TABS
============================================================ */
function _bindTabs() {
  document.querySelectorAll('.tabPerfil').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tabPerfil').forEach(t => {
        t.classList.remove('ativo');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.conteudoTab').forEach(c => c.classList.remove('ativo'));

      tab.classList.add('ativo');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById('tab-' + tab.dataset.tab)?.classList.add('ativo');

      if (tab.dataset.tab === 'favoritos')  _carregarFavoritos();
      if (tab.dataset.tab === 'reviews')    _carregarReviews();
      if (tab.dataset.tab === 'jogando')    _carregarJogando();
      if (tab.dataset.tab === 'concluidos') _carregarConcluidos();
      if (tab.dataset.tab === 'queroJogar') _carregarQueroJogar();
    });
  });
}

/* ============================================================
   STATS
============================================================ */
function _carregarStats() {
  document.getElementById('statFavs')       .textContent = Storage.getFavorites().length;
  document.getElementById('statReviews')    .textContent = Storage.getReviews().length;
  document.getElementById('statJogando')    .textContent = Storage.getPlaying().length;
  document.getElementById('statConcluidos') .textContent = Storage.getConcluidos().length;
  document.getElementById('statQueroJogar') .textContent = Storage.getQueroJogar().length;
}

/* ============================================================
   HELPER: renderizar grid de cards (reutilizado em 4 seções)
============================================================ */
function _renderGridCards({ lista, gridId, contId, emptyEmoji, emptyMsg, metaFn, removeFn, statFn }) {
  const grid = document.getElementById(gridId);
  const cont = document.getElementById(contId);

  if (statFn) statFn(lista.length);
  cont.textContent = `${lista.length} jogo${lista.length !== 1 ? 's' : ''}`;

  if (!lista.length) {
    grid.innerHTML = `
      <div class="estadoVazio" style="grid-column:1/-1">
        <span class="emoji">${emptyEmoji}</span>
        <p>${emptyMsg}</p>
      </div>`;
    return;
  }

  grid.innerHTML = lista.map(g => `
    <article class="cardFavorito" data-id="${g.id}">
      <img
        src="${g.background_image || 'https://placehold.co/200x130/0d1525/4a5e80?text=?'}"
        alt="${g.name}"
        loading="lazy"
        onerror="this.src='https://placehold.co/200x130/0d1525/4a5e80?text=?'"
      >
      <button class="btnRemoverFav" data-id="${g.id}" title="Remover">✕</button>
      <div class="cardFavoritoInfo">
        <div class="cardFavoritoNome">${g.name}</div>
        <div class="cardFavoritoMeta">${metaFn(g)}</div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.btnRemoverFav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFn(parseInt(btn.dataset.id));
      _carregarStats();
    });
  });

  grid.querySelectorAll('.cardFavorito').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btnRemoverFav')) return;
      const id = parseInt(card.dataset.id);
      const g  = lista.find(x => x.id === id);
      if (g) abrirModal(g);
    });
  });
}

/* ============================================================
   FAVORITOS
============================================================ */
function _carregarFavoritos() {
  const favs = Storage.getFavorites();
  _renderGridCards({
    lista:      favs,
    gridId:     'gridFavoritos',
    contId:     'contagemFavs',
    emptyEmoji: '🎮',
    emptyMsg:   'Você ainda não tem favoritos.<br>Explore o catálogo e salve seus jogos!',
    metaFn:     g => `★ ${g.rating?.toFixed(1) || '?'}`,
    removeFn:   id => { Storage.removeFavorite(id); toast('Removido dos favoritos'); _carregarFavoritos(); },
    statFn:     n => document.getElementById('statFavs').textContent = n,
  });
}

/* ============================================================
   JOGANDO AGORA
============================================================ */
function _carregarJogando() {
  const lista = Storage.getPlaying();
  _renderGridCards({
    lista:      lista,
    gridId:     'gridJogando',
    contId:     'contagemJogando',
    emptyEmoji: '🕹️',
    emptyMsg:   'Nenhum jogo marcado como "jogando".<br>Abra um jogo e marque como jogando!',
    metaFn:     () => '🎮 Jogando',
    removeFn:   id => { Storage.removePlaying(id); toast('Removido de jogando'); _carregarJogando(); },
    statFn:     n => document.getElementById('statJogando').textContent = n,
  });
}

/* ============================================================
   JOGOS CONCLUÍDOS
============================================================ */
function _carregarConcluidos() {
  const lista = Storage.getConcluidos();
  _renderGridCards({
    lista:      lista,
    gridId:     'gridConcluidos',
    contId:     'contagemConcluidos',
    emptyEmoji: '🏆',
    emptyMsg:   'Nenhum jogo concluído ainda.<br>Abra um jogo e marque como concluído!',
    metaFn:     g => `★ ${g.rating?.toFixed(1) || '?'}`,
    removeFn:   id => { Storage.removeConcluido(id); toast('Removido de concluídos'); _carregarConcluidos(); },
    statFn:     n => document.getElementById('statConcluidos').textContent = n,
  });
}

/* ============================================================
   QUERO JOGAR
============================================================ */
function _carregarQueroJogar() {
  const lista = Storage.getQueroJogar();
  _renderGridCards({
    lista:      lista,
    gridId:     'gridQueroJogar',
    contId:     'contagemQueroJogar',
    emptyEmoji: '📌',
    emptyMsg:   'Nenhum jogo na sua lista.<br>Abra um jogo e adicione à sua lista de desejos!',
    metaFn:     g => `★ ${g.rating?.toFixed(1) || '?'}`,
    removeFn:   id => { Storage.removeQueroJogar(id); toast('Removido da lista'); _carregarQueroJogar(); },
    statFn:     n => document.getElementById('statQueroJogar').textContent = n,
  });
}

/* ============================================================
   REVIEWS
============================================================ */
function _carregarReviews() {
  const reviews = Storage.getReviews();
  const lista   = document.getElementById('listaReviews');
  const cont    = document.getElementById('contagemReviews');

  document.getElementById('statReviews').textContent = reviews.length;
  cont.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;

  if (!reviews.length) {
    lista.innerHTML = `
      <div class="estadoVazio">
        <span class="emoji">✍️</span>
        <p>Você ainda não escreveu reviews.<br>Avalie os jogos que já jogou!</p>
      </div>`;
    return;
  }

  lista.innerHTML = reviews.map(r => {
    const estrelas = r.rating
      ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)
      : '—';
    const data = r.date
      ? new Date(r.date).toLocaleDateString('pt-BR')
      : '';
    return `
      <div class="cardReview" data-id="${r.id}">
        <div class="cabecalhoReview">
          <img
            class="jogoReviewImg"
            src="${r.gameImg || 'https://placehold.co/56x38/0d1525/4a5e80?text=?'}"
            alt="${r.gameName || 'Jogo'}"
            onerror="this.src='https://placehold.co/56x38/0d1525/4a5e80?text=?'"
          >
          <div>
            <div class="jogoReviewNome">${r.gameName || 'Jogo desconhecido'}</div>
            <div class="jogoReviewNota">${estrelas}</div>
          </div>
          <span class="dataReview">${data}</span>
        </div>
        <p class="textoReview">${r.text}</p>
        <button class="btnDeletarReview" data-id="${r.id}">🗑 Apagar review</button>
      </div>`;
  }).join('');

  lista.querySelectorAll('.btnDeletarReview').forEach(btn => {
    btn.addEventListener('click', () => {
      Storage.removeReview(parseInt(btn.dataset.id));
      toast('Review apagada');
      _carregarReviews();
      _carregarStats();
    });
  });
}

/* ============================================================
   MENU MOBILE
============================================================ */
function _bindMenuMobile() {
  const menuBtn  = document.getElementById('menuMobileBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('ativo'));
  }

  const searchBtn = document.getElementById('searchMobileBtn');
  const navSearch = document.querySelector('.navSearch');
  if (searchBtn && navSearch) {
    searchBtn.addEventListener('click', () => {
      navSearch.classList.toggle('ativo');
      if (navSearch.classList.contains('ativo')) {
        setTimeout(() => navSearch.querySelector('input')?.focus(), 200);
      }
    });
  }
}

/* ============================================================
   ARRANQUE
============================================================ */
document.addEventListener('DOMContentLoaded', initPerfil);