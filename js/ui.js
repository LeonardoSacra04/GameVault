//  UI — utilitários compartilhados 

// Cache de jogos para acesso rápido
const cache = {};// cria obj pra guardar os jogos na memoria
const cachear = (jogos) => (Array.isArray(jogos) ? jogos : [jogos]).forEach(g => { cache[g.id] = g; });// arrowF q recebe um jogo ou varios, se for array usa normal se nao transforma em array(salva o jogo usando o id dele)

// Toast
function toast(msg, tipo = 'padrao', ms = 3000) //notf de popup aparece por 3sec
{
  let c = document.getElementById('toastContainer');//pega onde vai ficar o toast

  if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; document.body.appendChild(c); }// se n tiver lugar ele cria uma div e com c.id coloca o id nela e boda esse id dentro do body
  const t = document.createElement('div');//cria uma div pra ser a notif
  t.className = `toast ${tipo}`;// bota classe toast
  t.innerHTML = msg;// coloca o texto dentro do toast
  c.appendChild(t);// bota o texto dentro do toast
  setTimeout(() => { t.style.animation = 'none'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, ms); //espera um tempo, n tem animacao, opacidade fica em 0(transparente). e no tempo remove esse componente
}

// Skeletons
function skeletons(n = 8) {
  return Array.from({ length: n }, () => `
    <article class="skCard">
      <div class="skImagem skeleton"></div>
      <div class="skCorpo">
        <div class="skTitulo skeleton"></div>
        <div class="skTag skeleton"></div>
        <div class="skPreco skeleton"></div>
      </div>
    </article>
  `).join('');
}


// Formatar preço
function precoHTML(g) //recebe o jogo
{// se o desconto for maior q 0 vai retornar o preco padrao dele e o preco dps do disconto, se n tiver preco volta como gratuiro, ai volta normal se n tem desconto
  if (g.discount > 0) return `
    <div>
      <span class="precoOriginal">R$ ${g.originalPrice.toFixed(2).replace('.', ',')}</span>
      <span class="precoFinal"> R$ ${g.price.toFixed(2).replace('.', ',')}</span>
    </div>`;
  if (!g.price) return '<span class="precoGratuito">Gratuito</span>';
  return `<span class="precoFinal">R$ ${g.price.toFixed(2).replace('.', ',')}</span>`;
}

// HTML de um card
function cardHTML(g) 
{
  const isFav = Storage.isFavorite(g.id);// retirba true ou false se e fav ou n
  const tags = (g.genres || []).slice(0, 2).map(x => `<span class="tag">${x.name}</span>`).join('') || '<span class="tag">Game</span>';// pega as tags e se n tiver usa nada, bota no max 2 generos ai transforma cada um dos generos em um span no html e junta tudo num so, se nao tiver tag volta como game apenas
  const img = g.background_image || 'https://placehold.co/460x260/0d1525/4a5e80?text=No+Image';//pega a foto de fundo do jogo e se n tiver uma um placeholder q n tem imagem
  return `
    <article class="cardJogo" data-id="${g.id}" tabindex="0" role="button">
      <div class="cardImagem">
        <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.src='https://placehold.co/460x260/0d1525/4a5e80?text=?'">
        ${g.discount > 0 ? `<span class="badgeDesconto">-${g.discount}%</span>` : ''}
        <button class="btnFavoritar ${isFav ? 'ativo' : ''}" data-id="${g.id}" aria-label="Favoritar">${isFav ? '♥' : '♡'}</button>
      </div>
      <div class="cardCorpo">
        <div class="cardTitulo">${g.name}</div>
        <div class="cardTags">${tags}</div>
        <div class="cardMeta">
          <span class="cardNota">★ ${g.rating?.toFixed(1) || '?'}</span>
          ${precoHTML(g)}
        </div>
      </div>
    </article>`;//retorna o card bonitinho
}

// Renderizar cards em um container
function renderCards(el, jogos, append = false) {
  const jogosFiltrados = FiltroNsfw.filtrar(jogos);
  cachear(jogosFiltrados);
  const html = jogosFiltrados.map(cardHTML).join('');
  if (append) el.insertAdjacentHTML('beforeend', html);
  else el.innerHTML = html;
  bindCards(el);
}

// Vincular eventos dos cards
function bindCards(el) {
  el.querySelectorAll('.cardJogo').forEach(card => {
    const id = parseInt(card.dataset.id);

    card.querySelector('.btnFavoritar')?.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (Storage.isFavorite(id)) {
        Storage.removeFavorite(id);
        btn.textContent = '♡';
        btn.classList.remove('ativo');
        toast('Removido dos favoritos');
      } else {
        Storage.addFavorite(cache[id]);
        btn.textContent = '♥';
        btn.classList.add('ativo');
        toast('❤️ Adicionado aos favoritos!', 'sucesso');
      }
    });

    const abrir = () => {
      if (cache[id]) abrirModal(cache[id]);
      else Api.getJogo(id).then(g => { cachear(g); abrirModal(g); });
    };
    card.addEventListener('click', abrir);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(); });
  });
}

// Modal de detalhe
function abrirModal(g) {
  document.getElementById('modalJogo')?.remove();

  const img = g.background_image || 'https://placehold.co/680x240/0d1525/4a5e80?text=No+Image';
  const genres = (g.genres || []).map(x => `<span class="tag">${x.name}</span>`).join('');
  const released = g.released ? new Date(g.released).toLocaleDateString('pt-BR') : 'Desconhecido';
  const desc = (g.description_raw || g.description || 'Sem descrição disponível.').slice(0, 400);
  const minhaNota = Storage.getRating(g.id);
  const isFav = Storage.isFavorite(g.id);
  const isPlaying = Storage.isPlaying(g.id);
  const isConcluido = Storage.isConcluido(g.id);
  const isQueroJogar = Storage.isQueroJogar(g.id);

  let precoSec = '';
  if (g.discount > 0) precoSec = `<div class="modalPreco">
    <span class="badgeDesconto" style="position:static;display:inline-block;margin-right:8px">-${g.discount}%</span>
    <span class="precoOriginal">R$ ${g.originalPrice?.toFixed(2).replace('.', ',')}</span>
    <span class="precoFinal" style="font-size:20px;font-family:var(--fontMono);margin-left:8px"> R$ ${g.price?.toFixed(2).replace('.', ',')}</span>
  </div>`;
  else if (g.price) precoSec = `<div class="modalPreco"><span class="precoFinal" style="font-size:18px;font-family:var(--fontMono)">R$ ${g.price.toFixed(2).replace('.', ',')}</span></div>`;

  const estrelas = [1,2,3,4,5].map(n =>
    `<button class="estrela ${n <= minhaNota ? 'ativa' : ''}" data-val="${n}">★</button>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modalOverlay';
  overlay.id = 'modalJogo';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modalHero">
        <img src="${img}" alt="${g.name}" onerror="this.src='https://placehold.co/680x240/0d1525/4a5e80?text=?'">
        <button class="btnFecharModal" id="btnFecharModal">✕</button>
      </div>
      <div class="modalCorpo">
        <h2 class="modalTitulo">${g.name}</h2>
        <div class="modalMeta">
          <span class="nota">★ ${g.rating?.toFixed(1) || '?'}/5</span>
          <span>📅 ${released}</span>
          ${g.playtime ? `<span>🕐 ~${g.playtime}h</span>` : ''}
        </div>
        <div class="modalTags">${genres}</div>
        ${precoSec}
        <p class="modalDesc">${desc}${desc.length >= 400 ? '…' : ''}</p>
        <div style="margin-bottom:18px">
          <div style="font-size:12px;color:var(--textSub);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.8px">Sua nota</div>
          <div class="estrelas">${estrelas}</div>
        </div>
        <div class="modalAcoes">
          <button class="btn btnPrimario" id="btnModalFav">${isFav ? '♥ Desfavoritar' : '♡ Favoritar'}</button>
          <button class="btn btnSecundario" id="btnModalPlaying">${isPlaying ? '✓ Jogando' : '🎮 Jogando agora'}</button>
          <button class="btn btnSecundario" id="btnModalConcluido">${isConcluido ? '🏆 Concluído' : '🏁 Marcar concluído'}</button>
          <button class="btn btnSecundario" id="btnModalQueroJogar">${isQueroJogar ? '📌 Na lista' : '📌 Quero jogar'}</button>
          <button class="btn btnSecundario" id="btnModalReview">✍️ Review</button>
        </div>
        <div class="reviewInline" id="reviewInlineModal">
          <textarea placeholder="Escreva sua review..."></textarea>
          <button class="btn btnPrimario" id="btnSubmitReviewModal">Publicar Review</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const fechar = () => overlay.remove();
  overlay.querySelector('#btnFecharModal').addEventListener('click', fechar);
  overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); } });

  // Estrelas
  overlay.querySelectorAll('.estrela').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val);
      Storage.setRating(g.id, val);
      overlay.querySelectorAll('.estrela').forEach((b, i) => b.classList.toggle('ativa', i < val));
      toast(`⭐ ${val} estrela${val > 1 ? 's' : ''} para ${g.name}!`, 'sucesso');
    });
  });

  // Favoritar
  overlay.querySelector('#btnModalFav').addEventListener('click', () => {
    const btn = overlay.querySelector('#btnModalFav');
    if (Storage.isFavorite(g.id)) {
      Storage.removeFavorite(g.id);
      btn.textContent = '♡ Favoritar';
      toast('Removido dos favoritos');
    } else {
      Storage.addFavorite(g);
      btn.textContent = '♥ Desfavoritar';
      toast('❤️ Adicionado!', 'sucesso');
    }
    document.querySelectorAll(`.btnFavoritar[data-id="${g.id}"]`).forEach(b => {
      b.textContent = Storage.isFavorite(g.id) ? '♥' : '♡';
      b.classList.toggle('ativo', Storage.isFavorite(g.id));
    });
  });

  // Playing
  overlay.querySelector('#btnModalPlaying').addEventListener('click', () => {
    const btn = overlay.querySelector('#btnModalPlaying');
    if (Storage.isPlaying(g.id)) {
      Storage.removePlaying(g.id);
      btn.textContent = '🎮 Jogando agora';
      toast('Removido de jogando');
    } else {
      Storage.addPlaying(g);
      btn.textContent = '✓ Jogando';
      toast('🎮 Adicionado!', 'sucesso');
    }
  });

  // Concluído
  overlay.querySelector('#btnModalConcluido').addEventListener('click', () => {
    const btn = overlay.querySelector('#btnModalConcluido');
    if (Storage.isConcluido(g.id)) {
      Storage.removeConcluido(g.id);
      btn.textContent = '🏁 Marcar concluído';
      toast('Removido de concluídos');
    } else {
      Storage.addConcluido(g);
      btn.textContent = '🏆 Concluído';
      toast('🏆 Marcado como concluído!', 'sucesso');
    }
  });

  // Quero jogar
  overlay.querySelector('#btnModalQueroJogar').addEventListener('click', () => {
    const btn = overlay.querySelector('#btnModalQueroJogar');
    if (Storage.isQueroJogar(g.id)) {
      Storage.removeQueroJogar(g.id);
      btn.textContent = '📌 Quero jogar';
      toast('Removido da lista');
    } else {
      Storage.addQueroJogar(g);
      btn.textContent = '📌 Na lista';
      toast('📌 Adicionado à lista!', 'sucesso');
    }
  });

  // Review
  const reviewBox = overlay.querySelector('#reviewInlineModal');
  overlay.querySelector('#btnModalReview').addEventListener('click', () => {
    reviewBox.style.display = reviewBox.style.display === 'block' ? 'none' : 'block';
  });

  overlay.querySelector('#btnSubmitReviewModal').addEventListener('click', () => {
    const txt = reviewBox.querySelector('textarea').value.trim();
    if (!txt) return toast('Escreva algo!', 'aviso');
    const p = Storage.getProfile();
    Storage.addReview({ gameId: g.id, gameName: g.name, gameImg: g.background_image, user: p.nickname || 'Gamer', avatar: p.avatar || '', text: txt, rating: Storage.getRating(g.id) });
    toast('✍️ Review publicada!', 'sucesso');
    reviewBox.style.display = 'none';
    reviewBox.querySelector('textarea').value = '';
  });
}

// Carrossel
function initCarrossel(track, prev, next) {
  if (!track || !prev || !next) return;
  const scroll = () => (track.querySelector('.cardJogo')?.offsetWidth || 216) + 16;
  prev.addEventListener('click', () => track.scrollBy({ left: -scroll() * 3, behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: scroll() * 3, behavior: 'smooth' }));
}

// Busca na navbar
function initBuscaNavbar() {
  const input = document.getElementById('buscaNavbar');
  const results = document.getElementById('resultadosBusca');
  if (!input || !results) return;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { results.classList.remove('aberto'); return; }
    timer = setTimeout(async () => {
      try {
        const jogos = await Api.buscar(q);
        const jogosFiltrados = FiltroNsfw.filtrar(jogos);
        cachear(jogosFiltrados);
        results.innerHTML = jogosFiltrados.slice(0, 6).map(g => `
          <div class="itemResultado" data-id="${g.id}">
            <img src="${g.background_image || 'https://placehold.co/48x32/0d1525/4a5e80?text=?'}" alt="${g.name}" onerror="this.src='https://placehold.co/48x32'">
            <div>
              <div class="nome">${g.name}</div>
              <div class="meta">★ ${g.rating?.toFixed(1) || '?'} · ${(g.genres || []).slice(0, 2).map(x => x.name).join(', ')}</div>
            </div>
          </div>`).join('');
        results.classList.add('aberto');
        results.querySelectorAll('.itemResultado').forEach(item => {
          item.addEventListener('click', () => {
            const jogo = cache[parseInt(item.dataset.id)];
            if (jogo) { abrirModal(jogo); results.classList.remove('aberto'); input.value = ''; }
          });
        });
      } catch(e) { console.error(e); }
    }, 400);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.navSearch')) results.classList.remove('aberto');
  });
}

// Atualizar avatar na navbar
function atualizarAvatarNavbar() {
  const p = Storage.getProfile();
  const nav = document.getElementById('avatarNavbar');
  if (nav) nav.src = p.avatar || `https://placehold.co/36x36/0d1525/4a5e80?text=${(p.nickname || 'G')[0].toUpperCase()}`;
}

// Inicializar menu mobile e busca mobile (para páginas SEM busca local)
function initNavbarMobile() {
  const menuBtn  = document.getElementById('menuMobileBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('ativo'));
    // Fechar menu ao clicar em link
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('ativo'));
    });
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
    // Fechar busca ao clicar fora
    document.addEventListener('click', e => {
      if (!e.target.closest('.navSearch') && !e.target.closest('.searchMobileBtn')) {
        navSearch.classList.remove('ativo');
      }
    });
  }
}