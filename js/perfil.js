/* ===== perfil.js =====
   Depende de: storage.js  →  Storage, Temas
   Depende de: ui.js       →  toast, abrirModal (opcional)
   Deve ser carregado no final do <body> da página perfil.html
================================================================ */

/* ============================================================
   INICIALIZAÇÃO — ponto de entrada
============================================================ */
function initPerfil() {
  AvatarEditor.init();        // editor de foto de perfil
  Temas.init();               // aplica tema salvo (igual às outras páginas)
  _carregarCabecalho();       // nome, handle, avatar, stats
  _carregarTemaAtivo();       // marca botão de tema correto
  _carregarFavoritos();       // tab favoritos + stat
  _carregarReviews();         // tab reviews + stat
  _carregarStats();           // stat jogando
  _bindTabs();                // navegação entre tabs
  _bindEdicao();              // botões editar / salvar / cancelar
  // _bindAvatar() — substituído por AvatarEditor.init()
  _bindTemas();               // seleção de tema
  _bindNavbarAvatar();        // atualiza avatar da navbar
}

/* ============================================================
   CABEÇALHO — nome, handle, bio, avatar
============================================================ */
function _carregarCabecalho() {
  const p = Storage.getProfile();
  _aplicarNome(p.nickname || 'Gamer');
  _aplicarBio(p.bio || '');
  if (p.avatar) {
    document.getElementById('avatarPerfil').src = p.avatar;
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
    el.textContent = 'Nenhuma bio ainda. Clique em "Editar perfil" para adicionar.';
    el.classList.add('vazio');
  }
}

/* ============================================================
   AVATAR — upload, base64, persist
============================================================ */
function _bindAvatar() {
  const btnEditar = document.getElementById('btnEditarAvatar');
  const input     = document.getElementById('inputAvatar');

  if (!btnEditar || !input) return;

  btnEditar.addEventListener('click', () => input.click());

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast('⚠️ Imagem muito grande (máx 2 MB)', 'aviso');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      document.getElementById('avatarPerfil').src = base64;
      _bindNavbarAvatar(base64);
      Storage.setProfile({ avatar: base64 });
      toast('📷 Foto atualizada!', 'sucesso');
    };
    reader.readAsDataURL(file);
  });
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
   MODO EDIÇÃO
============================================================ */
let _snapshot = {}; // estado antes de editar (para cancelar)

function _bindEdicao() {
  document.getElementById('btnEditar')  ?.addEventListener('click', _entrarEdicao);
  document.getElementById('btnSalvar')  ?.addEventListener('click', () => _sairEdicao(true));
  document.getElementById('btnCancelar')?.addEventListener('click', () => _sairEdicao(false));

  // Enter salva no campo nome, Escape cancela
  document.getElementById('inputNome')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); _sairEdicao(true); }
    if (e.key === 'Escape') { _sairEdicao(false); }
  });

  // Escape global fecha edição se estiver aberta
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _estaEditando()) _sairEdicao(false);
  });

  // Contador de caracteres na bio
  document.getElementById('textareaBio')?.addEventListener('input', _atualizarContador);
}

function _estaEditando() {
  return document.getElementById('btnSalvar')?.style.display !== 'none';
}

function _entrarEdicao() {
  const p = Storage.getProfile();
  _snapshot = { nickname: p.nickname || 'Gamer', bio: p.bio || '' };

  // Campo nome
  const inputNome = document.getElementById('inputNome');
  inputNome.value = _snapshot.nickname;
  inputNome.style.display = 'block';
  document.getElementById('nomePerfil').style.display = 'none';

  // Textarea bio
  const ta = document.getElementById('textareaBio');
  ta.value = _snapshot.bio;
  ta.style.display = 'block';
  document.getElementById('textoBio').style.display = 'none';
  _atualizarContador();
  document.getElementById('contadorBio').classList.add('visivel');

  // Botões
  document.getElementById('btnEditar').style.display  = 'none';
  document.getElementById('btnSalvar').style.display  = '';
  document.getElementById('btnCancelar').style.display = '';
  document.getElementById('badgeEditando').classList.add('visivel');

  inputNome.focus();
  inputNome.select();
}

function _sairEdicao(salvar) {
  if (salvar) {
    const nome = (document.getElementById('inputNome').value.trim()) || 'Gamer';
    const bio  = document.getElementById('textareaBio').value.trim();

    Storage.setProfile({ nickname: nome, bio });
    _aplicarNome(nome);
    _aplicarBio(bio);
    _bindNavbarAvatar(); // re-aplica avatar (nome pode ter mudado no placeholder)
    toast('✅ Perfil salvo!', 'sucesso');
  } else {
    // Restaura visual sem salvar
    _aplicarNome(_snapshot.nickname);
    _aplicarBio(_snapshot.bio);
  }

  // Esconde campos de edição
  document.getElementById('inputNome').style.display    = 'none';
  document.getElementById('nomePerfil').style.display   = 'block';
  document.getElementById('textareaBio').style.display  = 'none';
  document.getElementById('textoBio').style.display     = 'block';
  document.getElementById('contadorBio').classList.remove('visivel');

  // Restaura botões
  document.getElementById('btnEditar').style.display   = '';
  document.getElementById('btnSalvar').style.display   = 'none';
  document.getElementById('btnCancelar').style.display = 'none';
  document.getElementById('badgeEditando').classList.remove('visivel');
}

function _atualizarContador() {
  const ta      = document.getElementById('textareaBio');
  const contador = document.getElementById('contadorBio');
  const len = ta.value.length;
  const max = parseInt(ta.getAttribute('maxlength') || 300);
  contador.textContent = `${len} / ${max}`;
  contador.classList.toggle('quase',  len >= max * 0.8 && len < max);
  contador.classList.toggle('limite', len >= max);
}

/* ============================================================
   TEMAS — bind nos botões + marca ativo ao carregar
============================================================ */
function _bindTemas() {
  document.querySelectorAll('.btnTema').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tema;
      Temas.aplicar(id);          // aplica data-theme + salva 'gv_theme'
      _carregarTemaAtivo();       // atualiza visual dos botões
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
   TABS
============================================================ */
function _bindTabs() {
  document.querySelectorAll('.tabPerfil').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tabPerfil').forEach(t => t.classList.remove('ativo'));
      document.querySelectorAll('.conteudoTab').forEach(c => c.classList.remove('ativo'));
      tab.classList.add('ativo');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('ativo');

      if (tab.dataset.tab === 'favoritos') _carregarFavoritos();
      if (tab.dataset.tab === 'reviews')   _carregarReviews();
    });
  });
}

/* ============================================================
   STATS
============================================================ */
function _carregarStats() {
  document.getElementById('statFavs')    .textContent = Storage.getFavorites().length;
  document.getElementById('statReviews') .textContent = Storage.getReviews().length;
  document.getElementById('statJogando') .textContent = Storage.getPlaying().length;
}

/* ============================================================
   FAVORITOS
============================================================ */
function _carregarFavoritos() {
  const favs = Storage.getFavorites();
  const grid = document.getElementById('gridFavoritos');
  const cont = document.getElementById('contagemFavs');

  document.getElementById('statFavs').textContent = favs.length;
  cont.textContent = `${favs.length} jogo${favs.length !== 1 ? 's' : ''}`;

  if (!favs.length) {
    grid.innerHTML = `
      <div class="estadoVazio" style="grid-column:1/-1">
        <span class="emoji">🎮</span>
        <p>Você ainda não tem favoritos.<br>Explore o catálogo e salve seus jogos!</p>
      </div>`;
    return;
  }

  grid.innerHTML = favs.map(g => `
    <article class="cardFavorito" data-id="${g.id}">
      <img
        src="${g.background_image || 'https://placehold.co/140x140/0d1525/4a5e80?text=?'}"
        alt="${g.name}"
        loading="lazy"
        onerror="this.src='https://placehold.co/140x140/0d1525/4a5e80?text=?'"
      >
      <button class="btnRemoverFav" data-id="${g.id}" title="Remover">✕</button>
      <div class="cardFavoritoInfo">
        <div class="cardFavoritoNome">${g.name}</div>
        <div class="cardFavoritoMeta">★ ${g.rating?.toFixed(1) || '?'}</div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.btnRemoverFav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      Storage.removeFavorite(parseInt(btn.dataset.id));
      toast('Removido dos favoritos');
      _carregarFavoritos();
    });
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
            src="${r.gameImg || 'https://placehold.co/52x36/0d1525/4a5e80?text=?'}"
            alt="${r.gameName || 'Jogo'}"
            onerror="this.src='https://placehold.co/52x36/0d1525/4a5e80?text=?'"
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
    });
  });
}

/* ============================================================
   ARRANQUE
============================================================ */
document.addEventListener('DOMContentLoaded', initPerfil);