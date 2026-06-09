Temas.init();
    atualizarAvatarNavbar();
    initBuscaNavbar();

    const grid = document.getElementById('gridCatalogo');
    const loader = document.getElementById('loaderCatalogo');
    const fim = document.getElementById('fimCatalogo');
    const contagem = document.getElementById('contagemCatalogo');

    let pagina = 1, carregando = false, temMais = true;
    let generoAtivo = '', ordemAtiva = '-rating', busca = '', precoMax = 500, somenteDesconto = false;

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

       renderCards(grid, jogos);
        const total = d.count;
        const totalPaginas = Math.ceil(total / 24);
        renderizarPaginacao(totalPaginas);
        const carregados = grid.querySelectorAll('.cardJogo').length;
        contagem.textContent = `Mostrando ${carregados}${total ? ' de ' + total.toLocaleString('pt-BR') : ''} jogos`;

        if (!d.next || pagina > 25) { temMais = false; fim.style.display = 'block'; }
      } catch(e) {
        grid.innerHTML += `<div style="grid-column:1/-1;text-align:center;color:var(--textMuted);padding:40px">Erro ao carregar.</div>`;
      } finally {
        carregando = false;
        loader.style.display = 'none';
      }
    }

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

       function criarBotao(texto, paginaDestino, ativo = false) {
        const btn = document.createElement('button');

        btn.className = 'btnPagina';
        btn.textContent = texto;
        btn.dataset.pagina = paginaDestino;

        if (ativo) {
            btn.classList.add('ativo');
        }

        return btn;
    }

    function renderizarPaginacao(totalPaginas) {

        const paginacao = document.getElementById('paginacao');
        paginacao.innerHTML = '';

        if (pagina > 1) {
            paginacao.appendChild(
                criarBotao('‹', pagina - 1)
            );
        }

        const inicio = Math.max(1, pagina - 2);
        const fim = Math.min(totalPaginas, pagina + 2);

        for (let i = inicio; i <= fim; i++) {
            paginacao.appendChild(
                criarBotao(i, i, i === pagina)
            );
        }

        if (pagina < totalPaginas) {
            paginacao.appendChild(
                criarBotao('›', pagina + 1)
            );
        }
    }

      document.getElementById('paginacao').addEventListener('click', (e) => {

        const btn = e.target.closest('.btnPagina');

        if (!btn) return;

        pagina = Number(btn.dataset.pagina);

        carregarPagina();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    });

    resetarECarregar();
    initNavbarMobile();