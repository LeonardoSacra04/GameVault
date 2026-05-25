Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    const grid = document.getElementById('gridLancamentos');
    const loader = document.getElementById('loaderLancamentos');
    const fim = document.getElementById('fimLancamentos');
    let pagina = 1, carregando = false, temMais = true;

    // Destaque
    Api.getLancamentos(1, 1).then(d => {
      const g = FiltroNsfw.filtrar(d.results)[0];
      const el = document.getElementById('destaqueRelease');
      if (!g) { el.style.display = 'none'; return; }
      cachear(g);
      el.innerHTML = `
        <div class="destaqueBg" style="background-image:url('${g.background_image || ''}')"></div>
        <div class="destaqueConteudo">
          <span class="destaqueBadge">🆕 MAIS RECENTE</span>
          <h2 class="destaqueTitulo">${g.name}</h2>
          <div class="destaqueMeta">
            <span>★ ${g.rating?.toFixed(1) || '?'}</span>
            ${g.released ? `<span>📅 ${new Date(g.released).toLocaleDateString('pt-BR')}</span>` : ''}
            <span>${(g.genres || []).slice(0, 3).map(x => x.name).join(' · ')}</span>
          </div>
          <button class="btn btnPrimario" onclick="abrirModal(cache[${g.id}])">Ver Detalhes</button>
        </div>`;
    }).catch(() => { document.getElementById('destaqueRelease').style.display = 'none'; });

    async function carregarPagina() {
      if (carregando || !temMais) return;
      carregando = true; loader.style.display = 'flex';
      try {
        const d = await Api.getLancamentos(pagina, 20);
        renderCards(grid, d.results, pagina > 1);
        document.getElementById('contagemLancamentos').textContent = `${d.count?.toLocaleString('pt-BR') || ''} jogos`;
        pagina++;
        if (!d.next) { temMais = false; fim.style.display = 'block'; }
      } catch(e) { console.error(e); }
      finally { carregando = false; loader.style.display = 'none'; }
    }

    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !carregando && temMais) carregarPagina();
    }, { rootMargin: '200px' }).observe(loader);

    let timer;
    document.getElementById('buscaLancamentos').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = e.target.value.trim();
        if (!q) { pagina = 1; temMais = true; grid.innerHTML = ''; carregarPagina(); return; }
        const jogos = await Api.buscar(q);
        renderCards(grid, jogos);
      }, 500);
    });

    carregarPagina();
    initNavbarMobile();