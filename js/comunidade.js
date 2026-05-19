Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    let jogoSelecionado = null, notaSelecionada = 0;
    const likes = {};

    // Renderizar feed
    function renderFeed() {
      const reviews = Storage.getReviews();
      const feed = document.getElementById('feedReviews');

      if (!reviews.length) {
        feed.innerHTML = `<div class="estadoVazio"><span class="emoji">🎮</span><p>Nenhuma review ainda. Seja o primeiro!</p></div>`;
        return;
      }

      feed.innerHTML = reviews.map(r => {
        const avatar = r.avatar || `https://placehold.co/38x38/0d1525/4a5e80?text=${(r.user || 'G')[0].toUpperCase()}`;
        const data = new Date(r.date).toLocaleDateString('pt-BR');
        const estrelas = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '';
        const qtdLikes = likes[r.id] || r.likes || 0;
        const curtiu = likes[r.id + '_curtido'] || false;

        return `
          <article class="cardReview" data-id="${r.id}">
            <div class="cabecalhoReview">
              <img class="avatarReview" src="${avatar}" alt="${r.user}" onerror="this.src='https://placehold.co/38x38'">
              <div>
                <div class="nomeUsuario">${r.user || 'Anônimo'}</div>
                <div class="dataReview">${data}</div>
              </div>
              ${estrelas ? `<span class="notaReview">${estrelas}</span>` : ''}
            </div>
            ${r.gameName ? `
              <div class="jogoReview">
                ${r.gameImg ? `<img src="${r.gameImg}" alt="${r.gameName}" onerror="this.src='https://placehold.co/52x36'">` : ''}
                <div>
                  <div class="nome">${r.gameName}</div>
                  ${r.rating ? `<div style="color:var(--orange);font-size:11px">${'★'.repeat(r.rating)}</div>` : ''}
                </div>
              </div>` : ''}
            <p class="textoReview">${r.text}</p>
            <div class="acoesReview">
              <button class="btnLike ${curtiu ? 'ativo' : ''}" data-id="${r.id}">${curtiu ? '♥' : '♡'} ${qtdLikes}</button>
              <button class="btnDeletar" data-id="${r.id}">🗑 Excluir</button>
            </div>
          </article>`;
      }).join('');

      // Eventos de like e deletar
      feed.querySelectorAll('.btnLike').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          const curtiu = likes[id + '_curtido'] || false;
          likes[id + '_curtido'] = !curtiu;
          likes[id] = (likes[id] || 0) + (curtiu ? -1 : 1);
          btn.classList.toggle('ativo', !curtiu);
          btn.textContent = `${!curtiu ? '♥' : '♡'} ${Math.max(0, likes[id])}`;
        });
      });

      feed.querySelectorAll('.btnDeletar').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          Storage.removeReview(id);
          toast('Review excluída');
          renderFeed();
          renderTopReviews();
          renderPerfilMini();
        });
      });

      renderTopReviews();
    }

    // Top reviews na sidebar
    function renderTopReviews() {
      const reviews = Storage.getReviews();
      const el = document.getElementById('topReviews');
      if (!reviews.length) { el.innerHTML = '<p style="font-size:13px;color:var(--textMuted)">Nenhuma ainda.</p>'; return; }
      el.innerHTML = reviews.slice(0, 3).map(r => `
        <div style="padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:13px;font-weight:600;margin-bottom:2px">${r.gameName || 'Jogo'}</div>
          <div style="font-size:12px;color:var(--textMuted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.text}</div>
        </div>`).join('');
    }

    // Mini perfil sidebar
    function renderPerfilMini() {
      const p = Storage.getProfile();
      const avatar = p.avatar || `https://placehold.co/44x44/0d1525/4a5e80?text=${(p.nickname || 'G')[0].toUpperCase()}`;
      const qtd = Storage.getReviews().length;
      document.getElementById('perfilMini').innerHTML = `
        <img class="perfilMiniAvatar" src="${avatar}" alt="Perfil" onerror="this.src='https://placehold.co/44x44'">
        <div>
          <div class="perfilMiniNome">${p.nickname || 'Gamer'}</div>
          <div class="perfilMiniInfo">${qtd} review${qtd !== 1 ? 's' : ''}</div>
        </div>`;
    }

    // Jogos em destaque (sidebar)
    Api.getPopular(1, 5).then(d => {
      cachear(d.results);
      document.getElementById('jogosDestaque').innerHTML = d.results.map(g => `
        <div class="jogoSidebar" onclick="abrirModal(cache[${g.id}])">
          <img src="${g.background_image || 'https://placehold.co/40x28'}" alt="${g.name}" onerror="this.src='https://placehold.co/40x28'">
          <div>
            <div class="nome">${g.name}</div>
            <div class="nota">★ ${g.rating?.toFixed(1) || '?'}</div>
          </div>
        </div>`).join('');
    }).catch(() => { document.getElementById('jogosDestaque').innerHTML = '<p style="font-size:13px;color:var(--textMuted)">Erro.</p>'; });

    // Abrir/fechar painel
    document.getElementById('btnNovaReview').addEventListener('click', () => {
      const p = document.getElementById('painelNovaReview');
      p.style.display = p.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('btnCancelarReview').addEventListener('click', () => {
      document.getElementById('painelNovaReview').style.display = 'none';
    });

    // Busca de jogo no formulário
    let timerBuscaJogo;
    document.getElementById('buscaJogoReview').addEventListener('input', e => {
      clearTimeout(timerBuscaJogo);
      const q = e.target.value.trim();
      const resultados = document.getElementById('resultadosJogoReview');
      if (!q) { resultados.style.display = 'none'; return; }
      timerBuscaJogo = setTimeout(async () => {
        const jogos = await Api.buscar(q);
        cachear(jogos);
        resultados.innerHTML = jogos.slice(0, 5).map(g => `
          <div class="opcaoJogo" data-id="${g.id}">
            <img src="${g.background_image || 'https://placehold.co/44x30'}" alt="${g.name}" onerror="this.src='https://placehold.co/44x30'">
            ${g.name}
          </div>`).join('');
        resultados.style.display = 'block';

        resultados.querySelectorAll('.opcaoJogo').forEach(op => {
          op.addEventListener('click', () => {
            jogoSelecionado = cache[parseInt(op.dataset.id)];
            document.getElementById('buscaJogoReview').value = jogoSelecionado.name;
            resultados.style.display = 'none';
            const info = document.getElementById('jogoSelecionadoInfo');
            info.style.display = 'block';
            document.getElementById('jogoSelecionadoDisplay').innerHTML = `
              <div class="jogoReview">
                ${jogoSelecionado.background_image ? `<img src="${jogoSelecionado.background_image}" alt="">` : ''}
                <div class="nome">${jogoSelecionado.name}</div>
              </div>`;
          });
        });
      }, 400);
    });

    // Estrelas do formulário
    const estrelasEl = document.getElementById('estrelasReview');
    estrelasEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        notaSelecionada = parseInt(btn.dataset.val);
        estrelasEl.querySelectorAll('button').forEach((b, i) => {
          b.classList.toggle('ativa', i < notaSelecionada);
          b.style.color = i < notaSelecionada ? 'var(--orange)' : 'var(--textMuted)';
        });
      });
    });

    // Publicar review
    document.getElementById('btnPublicarReview').addEventListener('click', () => {
      const texto = document.getElementById('textoReview').value.trim();
      if (!texto) return toast('Escreva algo!', 'aviso');
      const p = Storage.getProfile();
      Storage.addReview({
        gameId: jogoSelecionado?.id,
        gameName: jogoSelecionado?.name || '',
        gameImg: jogoSelecionado?.background_image || '',
        user: p.nickname || 'Gamer',
        avatar: p.avatar || '',
        text: texto,
        rating: notaSelecionada,
      });
      toast('✍️ Review publicada!', 'sucesso');
      document.getElementById('painelNovaReview').style.display = 'none';
      document.getElementById('textoReview').value = '';
      document.getElementById('buscaJogoReview').value = '';
      document.getElementById('jogoSelecionadoInfo').style.display = 'none';
      jogoSelecionado = null; notaSelecionada = 0;
      estrelasEl.querySelectorAll('button').forEach(b => { b.classList.remove('ativa'); b.style.color = ''; });
      renderFeed();
      renderPerfilMini();
    });

    renderFeed();
    renderPerfilMini();