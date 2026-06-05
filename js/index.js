// ===== INICIALIZAÇÃO =====
Temas.init();
atualizarAvatarNavbar();
initBuscaNavbar();

// HERO CARROSSEL
let heroJogos = [];
let heroIdx = 0;
let heroTimer;

function renderHero(g)//carrossel principal 
{
  document.getElementById('heroBg').style.backgroundImage = `url('${g.background_image || ''}')`;//foto de capa do jogo

  document.getElementById('heroTitulo').textContent = g.name;//nome do jogo

  document.getElementById('heroDesc').textContent = (g.genres || [])//genero do jogo
    .slice(0, 3)// ate 3 generos
    .map(x => x.name)// nome do genero
    .join(' · ');// junta os nomes com ` . `

  document.getElementById('heroMeta').innerHTML = `
    <span class="heroNota">★ ${g.rating?.toFixed(1) || '?'}</span>
    ${g.released ? `<span class="heroData">📅 ${new Date(g.released).toLocaleDateString('pt-BR')}</span>` : ''}
    ${g.discount > 0 ? `<span class="heroDesconto">-${g.discount}%</span>` : ''}
  `;// nota do jogo to fixed:1 casa dps da virgula, || new date: data de lancamento converte pra formato br ||

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
  });// cria botao de ver detalhes com o jogo selecionado heroJogos(pela lista dos jogos) e o heroidx(indice atual) abrindo o modal do jogo atualk || segundo btn ve se ta salvo no Storage.isFavorite se o jogo ta favoritado ou n Se estiver: ♥ Favoritado Se não: ♡ Favoritar|| terceiro botao pega td q tem aql classe e com o toggle tira e poe a classe ativo so se o i for igual o indice do jogo atual(a bolinha do slide atual fica iluminada)

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
  //pega o botao btnHeroFav(?se ecistir) e se o jogo ja tiver esse id como favorito ele tira do favorito, caso n tenha ele adiciona(toast e aquela mensagenzinha q some dps tipo um alert)
}

function irHero(idx) 
{
  heroIdx = (idx + heroJogos.length) % heroJogos.length;
  renderHero(heroJogos[heroIdx]);
}//atualiza o carrosel de hero no indice, recebe um indice e usa o % pra ver se ta dentro do tamano da array(se passar do ultimo volta pro primeiro, se for negativo volta pro ultimo), e ai chama a funcao de renderizar esse carrossel pra att o conteudo na tela

function resetTimerHero() 
{
  clearInterval(heroTimer);

  heroTimer = setInterval(() => {
    irHero(heroIdx + 1);
  }, 5000);
}//troca os indices no tempo passado(5000) mas primeiro limpa o ultimo pra n ficar igual carro de formula 1 indo mt rapido saprr quando trocar de um pro otro

document.getElementById('heroPrev').addEventListener('click', () => {
  irHero(heroIdx - 1);
  resetTimerHero();
});// carrossel voltar o indice 1(voltar no carrossel)

document.getElementById('heroNext').addEventListener('click', () => {
  irHero(heroIdx + 1);
  resetTimerHero();
});// carrossel andar o indice 1(andar no carrossel)

async function carregarHero()//carrega os jogo asincronamente?(n sei como escreve)
{
  try //tebta executar isso aqui primeiro
  {
    const d = await Api.getPopular(1, 6);//busca na api primeiro

    heroJogos = d.results.filter(g => !FiltroNsfw.ehAdulto(g));

    cachear(heroJogos);// guarda em memoria pra n ficar buscabdi toda gr essa mnerda

    document.getElementById('heroPontos').innerHTML = heroJogos.map((_, i) => `
      <button
        class="heroPonto ${i === 0 ? 'ativo' : ''}"
        onclick="irHero(${i});resetTimerHero()">
      </button>
    `).join('');// pega o indice atual pra atualizar os pontinhos da barra do carrossel, passa por todos os jogos e cria pontinho pra cada um, ai se o pontinhno condizer com o indice atual do jogo ele bota a classe atibvo, se nao n bota nada, ai reseta o timer do carrossel automatico


    // ai reseta tudo
    renderHero(heroJogos[0]);

    resetTimerHero();

  } 
  catch (e) // catch se o try falhar faz (tipo um if else// e de erro lol)
  {
    document.getElementById('heroTitulo').textContent = 'GameVault';
  }// se falhar o titulo ffica com o nome da pagina
}

//CARROSSEIS 
async function carregarCarrossel(trackId, prevId, nextId, fetchFn)// carregaa carrossel (track id: onde vai aparecer, previd: botao de voltar, nextid: botao de avancar, fetchfn: busca ops dados da api) 
{
  const track = document.getElementById(trackId);//pega o elemento q vao ficar os cards

  track.innerHTML = skeletons(8);//8 carrosseis skeletons e o nome dos esqueletos q ta no formato, caixas fake

  try 
  {
    const d = await fetchFn();//pega dados da api

    renderCards(track, d.results);//renderiza com os resulktados 

    initCarrossel(//ativa o carrossel conecta lista de cards com os botes de voltar e avancar
      track,
      document.getElementById(prevId),
      document.getElementById(nextId)
    );

  } catch (e) // se n funcionar coloca um texto
  {
    track.innerHTML = `
      <p style="color:var(--textMuted);padding:20px">
        Erro ao carregar.
      </p>
    `;
  }
}

//  EXECUÇÃO 
carregarHero(); //puxa funcao la de cima, pega jogos em destaque blablabla

carregarCarrossel( // cria carrossel dos jogos pop
  'trackPopular',//onde os cards aparecem
  'prevPopular',//botao de voltrar
  'nextPopular',// botao de avancar
  () => Api.getPopular(1, 16)// pega 16 jogos
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
    let results = [];// array vazio de jogos
    let p = 1;// pagina atual da api

    while (results.length < 10 && p <= 3) // enqnt a array tiver menos q 10 jogos e nao passar de 3 pags ele busca mais
    {
      const d = await Api.getDeals(p++, 20);// busca na pag atual +20 e dps passa a pagina no p++

      results = results.concat(d.results);//junta os jogos q ja tinha na array com os novos q achou
    }

    return {
      results: results.slice(0, 10)// retorna os 10 primeiros jogos
    };
  }
);

// config responsividade da navbar
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

// config responsividade barra de pesquisa da navbar
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

