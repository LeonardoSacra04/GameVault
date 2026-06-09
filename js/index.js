Temas.init();
atualizarAvatarNavbar();
initBuscaNavbar();

let heroJogos = [];
let heroIdx = 0;
let heroTimer;

function renderHero(g)
{
  document.getElementById('heroBg').style.backgroundImage = `url('${g.background_image || ''}')`;

  document.getElementById('heroTitulo').textContent = g.name;

  document.getElementById('heroDesc').textContent = (g.genres || [])
    .slice(0, 3)
    .map(x => x.name)
    .join(' · ');

  document.getElementById('heroMeta').innerHTML = `
    <span class="heroNota">★ ${g.rating?.toFixed(1) || '?'}</span>
    ${g.released ? `<span class="heroData">📅 ${new Date(g.released).toLocaleDateString('pt-BR')}</span>` : ''}
    ${g.discount > 0 ? `<span class="heroDesconto">-${g.discount}%</span>` : ''}
  `;

  document.getElementById('heroAcoes').innerHTML = `
    <button class="btn btnPrimario" onclick="abrirModal(heroJogos[heroIdx])">
      Ver Detalhes
    </button>

    <button class="btn btnSecundario" id="btnHeroFav">
      ${Storage.isFavorite(g.id) ? '♥ Favoritado' : '♡ Favoritar'}
    </button>
  `;

  document.querySelectorAll('.heroPonto').forEach((d, i) => {
    d.classList.toggle('ativo', i === heroIdx);
  });

  document.getElementById('btnHeroFav')?.addEventListener('click', () => {
    const jogo = heroJogos[heroIdx];

    if (Storage.isFavorite(jogo.id)) 
    {
      Storage.removeFavorite(jogo.id);
      toast('Removido dos favoritos');
    } 
    else 
    {
      Storage.addFavorite(jogo);
      toast('❤️ Adicionado!', 'sucesso');
    }

    renderHero(jogo);
  });

}

function irHero(idx) 
{
  heroIdx = (idx + heroJogos.length) % heroJogos.length;
  renderHero(heroJogos[heroIdx]);
}

function resetTimerHero() 
{
  clearInterval(heroTimer);

  heroTimer = setInterval(() => {
    irHero(heroIdx + 1);
  }, 5000);
}

document.getElementById('heroPrev').addEventListener('click', () => {
  irHero(heroIdx - 1);
  resetTimerHero();
});

document.getElementById('heroNext').addEventListener('click', () => {
  irHero(heroIdx + 1);
  resetTimerHero();
});

async function carregarHero()
{
  try
  {
    const d = await Api.getPopular(1, 6);

    heroJogos = d.results.filter(g => !FiltroNsfw.ehAdulto(g));

    cachear(heroJogos);

    document.getElementById('heroPontos').innerHTML = heroJogos.map((_, i) => `
      <button
        class="heroPonto ${i === 0 ? 'ativo' : ''}"
        onclick="irHero(${i});resetTimerHero()">
      </button>
    `).join('');

    renderHero(heroJogos[0]);

    resetTimerHero();

  } 
  catch (e)
  {
    document.getElementById('heroTitulo').textContent = 'GameVault';
  }
}

async function carregarCarrossel(trackId, prevId, nextId, fetchFn)
{
  const track = document.getElementById(trackId);

  track.innerHTML = skeletons(8);

  try 
  {
    const d = await fetchFn();

    renderCards(track, d.results);

    initCarrossel(
      track,
      document.getElementById(prevId),
      document.getElementById(nextId)
    );

  } catch (e)
  {
    track.innerHTML = `
      <p style="color:var(--textMuted);padding:20px">
        Erro ao carregar.
      </p>
    `;
  }
}

carregarHero(); 

carregarCarrossel( 
  'trackPopular',
  'prevPopular',
  'nextPopular',
  () => Api.getPopular(1, 16)
);

carregarCarrossel(
  'trackLancamentos',
  'prevLancamentos',
  'nextLancamentos',
  () => Api.getLancamentos(1, 16)
);

carregarCarrossel(
  'trackDeals',
  'prevDeals',
  'nextDeals',
  async () => {
    let results = [];
    let p = 1;

    while (results.length < 10 && p <= 3)
    {
      const d = await Api.getDeals(p++, 20);

      results = results.concat(d.results);
    }

    return {
      results: results.slice(0, 10)
    };
  }
);

const menuBtn = document.getElementById("menuMobileBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("ativo");

    if (navSearch.classList.contains("ativo")) {
      navSearch.classList.remove("ativo");
    }
  });
}

const searchBtn = document.getElementById("searchMobileBtn");
const navSearch = document.querySelector(".navSearch");

if (searchBtn && navSearch) {

  searchBtn.addEventListener("click", () => {

    navSearch.classList.toggle("ativo");

    if (navSearch.classList.contains("ativo")) {

      setTimeout(() => {

        const input = navSearch.querySelector("input");

        if (input) input.focus();

      }, 200);
    }
  });
}

