/* ===== avatar-editor.js =====
   Depende de: storage.js (Storage), ui.js (toast)
   Exporta: AvatarEditor.init()
   Chamado em: perfil.js → initPerfil()
================================================================ */

const AvatarEditor = (() => {

  const SIZE    = 300;   // resolução do canvas em px
  const QUALITY = 0.92;  // qualidade JPEG ao exportar

  let img    = null;
  let scale  = 1;
  let ox     = 0, oy = 0;
  let dragging = false;
  let lastX  = 0, lastY = 0;

  let canvas, ctx, clip, slider, editor, zoomVal, inputFile;

  /* ============================================================
     RENDER
  ============================================================ */
  function draw() {
    if (!img) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, ox, oy, img.naturalWidth * scale, img.naturalHeight * scale);
    _syncPreviews();
  }

  function _syncPreviews() {
    const url = canvas.toDataURL('image/jpeg', QUALITY);
    document.querySelectorAll('[data-avatar-preview]').forEach(el => {
      el.src = url;
      el.style.objectFit = 'cover';
      el.style.width = '100%';
      el.style.height = '100%';
    });
  }

  /* ============================================================
     FIT — escala inicial cobre o círculo inteiro
  ============================================================ */
  function _fitAndCenter() {
    const ratio = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    scale = ratio;
    slider.min   = Math.round(ratio * 100);
    slider.max   = 300;
    slider.value = Math.round(ratio * 100);
    zoomVal.textContent = Math.round(ratio * 100) + '%';
    ox = (SIZE - img.naturalWidth  * scale) / 2;
    oy = (SIZE - img.naturalHeight * scale) / 2;
    draw();
  }

  /* ============================================================
     LOAD
  ============================================================ */
  function _loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      _toast('Imagem muito grande (máx 5 MB)', 'aviso');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const i = new Image();
      i.onload = () => {
        img = i;
        editor.classList.add('av-show');
        // rola suavemente até o editor
        editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        _fitAndCenter();
      };
      i.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ============================================================
     DRAG
  ============================================================ */
  function _getPos(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX,            y: e.clientY };
  }

  function _startDrag(e) { dragging = true; const p = _getPos(e); lastX = p.x; lastY = p.y; }
  function _doDrag(e)    {
    if (!dragging) return;
    const p = _getPos(e);
    ox += p.x - lastX; oy += p.y - lastY;
    lastX = p.x; lastY = p.y;
    draw();
  }
  function _endDrag()    { dragging = false; }

  /* ============================================================
     ZOOM via scroll
  ============================================================ */
  function _onWheel(e) {
    e.preventDefault();
    const delta    = e.deltaY < 0 ? 0.06 : -0.06;
    const minScale = parseFloat(slider.min) / 100;
    const newScale = Math.max(minScale, Math.min(3, scale + delta));
    const cx = SIZE / 2 - ox;
    const cy = SIZE / 2 - oy;
    const ratio = newScale / scale;
    scale = newScale;
    ox = SIZE / 2 - cx * ratio;
    oy = SIZE / 2 - cy * ratio;
    slider.value        = Math.round(scale * 100);
    zoomVal.textContent = Math.round(scale * 100) + '%';
    draw();
  }

  /* ============================================================
     ZOOM via slider
  ============================================================ */
  function _onSlider() {
    const newScale = parseInt(slider.value) / 100;
    const cx = SIZE / 2 - ox;
    const cy = SIZE / 2 - oy;
    const ratio = newScale / scale;
    scale = newScale;
    ox = SIZE / 2 - cx * ratio;
    oy = SIZE / 2 - cy * ratio;
    zoomVal.textContent = Math.round(newScale * 100) + '%';
    draw();
  }

  /* ============================================================
     SALVAR
  ============================================================ */
  function salvar() {
    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
    try {
      Storage.setProfile({ avatar: dataUrl });
    } catch (e) {
      _toast('Imagem muito grande para salvar localmente.', 'erro');
      return;
    }
    // Atualiza todos os [data-avatar] da página imediatamente
    document.querySelectorAll('[data-avatar]').forEach(el => { el.src = dataUrl; });
    editor.classList.remove('av-show');
    img = null;
    _toast('✅ Foto de perfil salva!', 'sucesso');
  }

  /* ============================================================
     CANCELAR
  ============================================================ */
  function cancelar() {
    editor.classList.remove('av-show');
    img = null;
  }

  /* ============================================================
     TOAST helper
  ============================================================ */
  function _toast(msg, tipo) {
    if (typeof toast === 'function') { toast(msg, tipo); return; }
    console.info('[AvatarEditor]', msg);
  }

  /* ============================================================
     INIT — chamado pelo perfil.js
  ============================================================ */
  function init() {
    canvas    = document.getElementById('avCanvas');
    ctx       = canvas.getContext('2d');
    clip      = document.getElementById('avClip');
    slider    = document.getElementById('avZoomSlider');
    editor    = document.getElementById('avEditor');
    zoomVal   = document.getElementById('avZoomVal');
    inputFile = document.getElementById('avInputFile');

    if (!canvas) return;

    canvas.width  = SIZE;
    canvas.height = SIZE;

    // Botão câmera no cabeçalho → abre file picker
    document.getElementById('avBtnEditarAvatar')
      ?.addEventListener('click', () => inputFile.click());

    // Seleção de arquivo
    inputFile.addEventListener('change', e => _loadFile(e.target.files[0]));

    // Arrastar dentro do canvas
    clip.addEventListener('mousedown',  _startDrag);
    clip.addEventListener('touchstart', _startDrag, { passive: true });
    window.addEventListener('mousemove', _doDrag);
    window.addEventListener('touchmove', _doDrag,  { passive: true });
    window.addEventListener('mouseup',  _endDrag);
    window.addEventListener('touchend', _endDrag);

    // Zoom
    clip.addEventListener('wheel', _onWheel, { passive: false });
    slider.addEventListener('input', _onSlider);

    // Botões do editor
    document.getElementById('avBtnSalvar')  ?.addEventListener('click', salvar);
    document.getElementById('avBtnCancelar')?.addEventListener('click', cancelar);
    document.getElementById('avBtnOutra')   ?.addEventListener('click', () => inputFile.click());

    // Aplica foto já salva nos avatares da página
    const p = Storage.getProfile();
    if (p.avatar) {
      document.querySelectorAll('[data-avatar]').forEach(el => { el.src = p.avatar; });
    }
  }

  return { init, salvar, cancelar };

})();