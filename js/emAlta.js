Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    const grid = document.getElementById('gridTrend');
    const loader = document.getElementById('loaderTrend');
    let pagina = 1, carregando = false, temMais = true;

    // Ranking
    Api.getTrending(1, 10).then(d => {
      const jogos = d.results;
      cachear(jogos);
      const maxAdded = Math.max(...jogos.map(g => g.added || 0));
      const lista = document.getElementById('listaRanking');
      lista.innerHTML = jogos.map((g, i) => {
        const posClass = i === 0 ? 'ouro' : i === 1 ? 'prata' : i === 2 ? 'bronze' : '';
        const pct = maxAdded ? Math.round((g.added || 0) / maxAdded * 100) : Math.round((10 - i) / 10 * 100);
        return `
          <div class="itemRanking" onclick="abrirModal(cache[${g.id}])">
            <span class="posicaoRanking ${posClass}">${String(i + 1).padStart(2, '0')}</span>
            <img class="imagemRanking" src="${g.background_image || 'https://placehold.co/60x44'}" alt="${g.name}" onerror="this.src='https://placehold.co/60x44'">
            <div class="infoRanking">
              <div class="nomeRanking">${g.name}</div>
              <div class="metaRanking">
                <span class="notaRanking">★ ${g.rating?.toFixed(1) || '?'}</span>
                <span>${(g.genres || []).slice(0, 2).map(x => x.name).join(', ')}</span>
                ${g.added ? `<span>${g.added.toLocaleString('pt-BR')} jogadores</span>` : ''}
              </div>
            </div>
            <div class="barraRanking"><div class="barraRankingFill" style="width:${pct}%"></div></div>
          </div>`;
      }).join('');
    }).catch(() => { document.getElementById('listaRanking').innerHTML = `<p style="color:var(--textMuted)">Erro ao carregar ranking.</p>`; });

    // Grid trending
    async function carregarTrend() {
      if (carregando || !temMais) return;
      carregando = true; loader.style.display = 'flex';
      try {
        const d = await Api.getTrending(pagina, 20);
        renderCards(grid, d.results, pagina > 1);
        document.getElementById('contagemTrend').textContent = `${d.count?.toLocaleString('pt-BR') || ''} jogos`;
        pagina++;
        if (!d.next || pagina > 10) { temMais = false; document.getElementById('fimTrend').style.display = 'block'; }
      } catch(e) { console.error(e); }
      finally { carregando = false; loader.style.display = 'none'; }
    }

    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !carregando && temMais) carregarTrend();
    }, { rootMargin: '200px' }).observe(loader);

    carregarTrend();