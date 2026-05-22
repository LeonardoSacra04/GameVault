Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    const grid = document.getElementById('gridCatalogo');
    const loader = document.getElementById('loaderCatalogo');
    const fim = document.getElementById('fimCatalogo');
    const contagem = document.getElementById('contagemCatalogo');

    let pagina = 1, carregando = false, temMais = true;
    let generoAtivo = '', ordemAtiva = '-rating', busca = '', precoMax = 500, somenteDesconto = false;

    // Gêneros
    Api.getGeneros().then(d => {
      const lista = document.getElementById('listaGeneros');
      lista.innerHTML = `<button class="btnGenero ativo" data-slug="">Todos</button>` +
        d.results.map(g => `<button class="btnGenero" data-slug="${g.slug}">${g.name}</button>`).join('');
      lista.addEventListener('click', e => {
        const btn = e.target.closest('.btnGenero');
        if (!btn) return;
        lista.querySelectorAll('.btnGenero').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        generoAtivo = btn.dataset.slug;
        resetarECarregar();
      });
    });

    function resetarECarregar() {
      pagina = 1; temMais = true;
      grid.innerHTML = skeletons(12);
      fim.style.display = 'none';
      carregarPagina();
    }

    async function carregarPagina() {
      if (carregando || !temMais) return;
      carregando = true;
      loader.style.display = 'flex';
      try {
        const d = await Api.getCatalogo({ page: pagina, pageSize: 24, search: busca, genres: generoAtivo, ordering: ordemAtiva });
        let jogos = d.results;
        if (somenteDesconto) jogos = jogos.filter(g => g.discount > 0);
        if (precoMax < 500) jogos = jogos.filter(g => g.price <= precoMax);

        renderCards(grid, jogos, pagina > 1);

        const total = d.count;
        const carregados = grid.querySelectorAll('.cardJogo').length;
        contagem.textContent = `Mostrando ${carregados}${total ? ' de ' + total.toLocaleString('pt-BR') : ''} jogos`;

        pagina++;
        if (!d.next || pagina > 25) { temMais = false; fim.style.display = 'block'; }
      } catch(e) {
        grid.innerHTML += `<div style="grid-column:1/-1;text-align:center;color:var(--textMuted);padding:40px">Erro ao carregar.</div>`;
      } finally {
        carregando = false;
        loader.style.display = 'none';
      }
    }

    // Infinite scroll
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !carregando && temMais) carregarPagina();
    }, { rootMargin: '200px' }).observe(loader);

    // Filtros
    document.getElementById('filtroPreco').addEventListener('input', e => {
      document.getElementById('exibePreco').textContent = e.target.value;
    });

    document.getElementById('btnAplicar').addEventListener('click', () => {
      ordemAtiva = document.getElementById('filtroOrdem').value;
      precoMax = parseInt(document.getElementById('filtroPreco').value);
      somenteDesconto = document.getElementById('filtroDesconto').checked;
      resetarECarregar();
    });

    document.getElementById('btnLimpar').addEventListener('click', () => {
      document.getElementById('filtroOrdem').value = '-rating';
      document.getElementById('filtroPreco').value = 500;
      document.getElementById('filtroDesconto').checked = false;
      document.getElementById('exibePreco').textContent = '500';
      document.querySelectorAll('.btnGenero').forEach(b => b.classList.toggle('ativo', b.dataset.slug === ''));
      ordemAtiva = '-rating'; precoMax = 500; somenteDesconto = false; generoAtivo = '';
      resetarECarregar();
    });

    let timerBusca;
    document.getElementById('buscaCatalogo').addEventListener('input', e => {
      clearTimeout(timerBusca);
      timerBusca = setTimeout(() => { busca = e.target.value.trim(); resetarECarregar(); }, 500);
    });

    resetarECarregar();

    // config responsividade da navbar
    const menuBtn = document.getElementById("menuMobileBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("ativo");
      });
    }