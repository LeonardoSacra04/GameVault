Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    const grid = document.getElementById('gridDeals');
    let todosDeals = [], ordemAtual = 'descPct';

    // Banner
    async function carregarBanner() {
      const banner = document.getElementById('bannerDeals');
      try {
        let results = [], p = 1;
        while (results.length < 3 && p <= 5) {
          const d = await Api.getDeals(p++, 20);
          results = results.concat(d.results.filter(g => g.discount >= 40));
        }
        const top = results.slice(0, 3);
        if (!top.length) { banner.style.display = 'none'; return; }
        cachear(top);
        banner.innerHTML = top.map(g => `
          <div class="cardDestaqueDeal" onclick="abrirModal(cache[${g.id}])">
            <div class="dealBg" style="background-image:url('${g.background_image || ''}')"></div>
            <div class="dealConteudo">
              <span class="dealBadge">-${g.discount}%</span>
              <div class="dealNome">${g.name}</div>
              <div class="dealPrecos">
                <span class="dealPrecoOriginal">R$ ${g.originalPrice.toFixed(2).replace('.', ',')}</span>
                <span class="dealPrecoFinal">R$ ${g.price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>`).join('');
      } catch(e) { banner.style.display = 'none'; }
    }

    // Carregar todos
    async function carregarTodos() {
      document.getElementById('loaderDeals').style.display = 'flex';
      try {
        let results = [];
        for (let p = 1; p <= 6; p++) {
          const d = await Api.getDeals(p, 20);
          results = results.concat(d.results);
          if (!d.next) break;
        }
        todosDeals = results;
        cachear(todosDeals);
        document.getElementById('contagemDeals').textContent = `${todosDeals.length} jogos em promoção`;
        renderDeals();
      } catch(e) { console.error(e); }
      finally { document.getElementById('loaderDeals').style.display = 'none'; document.getElementById('fimDeals').style.display = 'block'; }
    }

    function ordenar(arr) {
      return [...arr].sort((a, b) => {
        if (ordemAtual === 'descPct') return b.discount - a.discount;
        if (ordemAtual === 'ascPreco') return a.price - b.price;
        if (ordemAtual === 'nota') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
    }

    function renderDeals(q = '') {
      let lista = todosDeals;
      if (q) lista = lista.filter(g => g.name.toLowerCase().includes(q.toLowerCase()));
      renderCards(grid, ordenar(lista));
    }

    document.getElementById('ordemDeals').addEventListener('change', e => {
      ordemAtual = e.target.value;
      renderDeals(document.getElementById('buscaDeals').value);
    });

    let timer;
    document.getElementById('buscaDeals').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => renderDeals(e.target.value), 300);
    });

    carregarBanner();
    carregarTodos();

    // config responsividade da navbar
    const menuBtn = document.getElementById("menuMobileBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("ativo");
      });
    }