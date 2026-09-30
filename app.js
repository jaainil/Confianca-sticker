const $ = s => document.querySelector(s);
const PXMM = 96 / 25.4;
const PAGE_W = 210, PAGE_H = 297, MARGIN = 10, MAX_STICKERS = 1200;
const SIZE_MIN = 4, SIZE_MAX = 90;
const FONT_SCALE_MIN = 50, FONT_SCALE_MAX = 180;
const MIXED_JITTER = [0.88, 1.14, 0.93, 1.18, 0.85, 1.10, 0.97, 1.16, 0.90, 1.12, 1.05, 0.86];

const THEMES = {
  black:    {name:'Black',    colors:['#232738']},
  rainbow:  {name:'Rainbow',  colors:['#FF6B4A','#FFC531','#57CC99','#4CC9F0','#9B5DE5','#FF70A6']},
  sunshine: {name:'Sunshine', colors:['#FFC531','#FF9E1B','#FFB800','#FFD97A']},
  bubblegum:{name:'Bubblegum',colors:['#FF70A6','#FF9EC6','#F65C93','#FFC2DA']},
  ocean:    {name:'Ocean',    colors:['#4CC9F0','#2D9CDB','#7BD5F5','#1B7FBF']},
  forest:   {name:'Forest',   colors:['#57CC99','#80ED99','#2FA071','#B8F0C9']},
  chalk:    {name:'Chalk',    colors:['#F4F1E8','#EDE9DC'], ring:'#DBD6C6'}
};
const THEME_ORDER = ['black','rainbow','sunshine','bubblegum','ocean','forest','chalk'];
const FONTS = {
  Fredoka:{family:'Fredoka', weight:600},
  Bungee: {family:'Bungee',  weight:400},
  Caveat: {family:'Caveat',  weight:700}
};

/* ---------- shape geometry ---------- */
function starD(R=47,r=29){let p='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const rad=i%2?r:R;
  p+=(i?'L':'M')+(50+rad*Math.cos(a)).toFixed(2)+','+(50+rad*Math.sin(a)).toFixed(2);}return p+'Z';}
function hexD(R=45){let p='';for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;
  p+=(i?'L':'M')+(50+R*Math.cos(a)).toFixed(2)+','+(50+R*Math.sin(a)).toFixed(2);}return p+'Z';}
const roundedD = 'M26,4 h48 a22,22 0 0 1 22,22 v48 a22,22 0 0 1 -22,22 h-48 a22,22 0 0 1 -22,-22 v-48 a22,22 0 0 1 22,-22 Z';
const circleD  = 'M50,3.5 a46.5,46.5 0 1 0 0.01,0 Z';
const rectD    = 'M21,3 h118 a18,18 0 0 1 18,18 v58 a18,18 0 0 1 -18,18 h-118 a18,18 0 0 1 -18,-18 v-58 a18,18 0 0 1 18,-18 Z';
const rectVertD = 'M21,3 h58 a18,18 0 0 1 18,18 v118 a18,18 0 0 1 -18,18 h-58 a18,18 0 0 1 -18,-18 v-118 a18,18 0 0 1 18,-18 Z';

const SHAPES = {
  rect:   {label:'Rect',   d:rectD,    cx:80, cy:50, w:160, h:100, vb:'-12 -12 184 124', ratio:0.625, fsf:1},
  circle: {label:'Circle', d:circleD,  cx:50, cy:50, w:100, h:100, vb:'-10 -10 120 120', ratio:1,     fsf:1},
  square: {label:'Square', d:roundedD, cx:50, cy:50, w:100, h:100, vb:'-10 -10 120 120', ratio:1,     fsf:1},
  hex:    {label:'Hex',    d:hexD(),   cx:50, cy:50, w:100, h:100, vb:'-10 -10 120 120', ratio:1,     fsf:0.82},
  star:   {label:'Star',   d:starD(),  cx:50, cy:50, w:100, h:100, vb:'-10 -10 120 120', ratio:1,     fsf:0.62}
};
const SHAPE_ORDER = ['rect','circle','square','hex','star'];

function getShapeSpec(){
  const isSquare = state.radius === 'square';
  if(state.shape === 'rect'){
    if(state.orientation === 'vertical'){
      const d = isSquare ? 'M3,3 h94 v154 h-94 Z' : rectVertD;
      return {label:'Rect (Vert)', d, cx:50, cy:80, w:100, h:160, vb:'-12 -12 124 184', ratio:1.6, fsf:0.88};
    }
    const d = isSquare ? 'M3,3 h154 v94 h-154 Z' : rectD;
    return {label:'Rect', d, cx:80, cy:50, w:160, h:100, vb:'-12 -12 184 124', ratio:0.625, fsf:1};
  }
  if(state.shape === 'square'){
    const d = isSquare ? 'M4,4 h92 v92 h-92 Z' : roundedD;
    return {label:'Square', d, cx:50, cy:50, w:100, h:100, vb:'-10 -10 120 120', ratio:1, fsf:1};
  }
  return SHAPES[state.shape] || SHAPES.rect;
}

/* DEFAULTS: border-only + black, ampoule-friendly */
const DEFAULTS = {from:1, to:30, size:14, gap:0, orientation:'horizontal', flow:'column',
                  align:'left', kits:1, fillColumn:false, fillMode:'restart',
                  shape:'rect', radius:'rounded', borderWidth:6, borderStyle:'solid',
                  theme:'black', font:'Bungee',
                  fontScale:180, fontVariation:'uniform', zoom:'fit', mobileView:'controls',
                  alt:false, guides:true, outline:true, dot:true};
const state = Object.assign({}, DEFAULTS, {customColor:'#1D6FE0'});
let build = null;

/* ---------- localStorage state persistence ---------- */
const STORAGE_KEY = 'confianca_sticker_maker_state_v2';

function saveState(){
  try {
    const toSave = {
      from: state.from,
      to: state.to,
      size: state.size,
      gap: state.gap,
      orientation: state.orientation,
      flow: state.flow,
      align: state.align,
      kits: state.kits,
      fillColumn: state.fillColumn ?? true,
      fillMode: state.fillMode || 'continue',
      shape: state.shape,
      radius: state.radius,
      borderWidth: state.borderWidth,
      borderStyle: state.borderStyle,
      theme: state.theme,
      customColor: state.customColor,
      font: state.font,
      fontScale: state.fontScale,
      fontVariation: state.fontVariation,
      alt: state.alt,
      guides: state.guides,
      outline: state.outline,
      dot: state.dot
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch(e) {}
}

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    if(typeof data !== 'object' || !data) return false;

    if(typeof data.from === 'number' && !isNaN(data.from)) state.from = Math.max(0, Math.min(999, data.from));
    if(typeof data.to === 'number' && !isNaN(data.to)) state.to = Math.max(0, Math.min(999, data.to));
    if(typeof data.size === 'number' && !isNaN(data.size)) state.size = Math.max(SIZE_MIN, Math.min(SIZE_MAX, data.size));
    if(typeof data.gap === 'number' && !isNaN(data.gap)) state.gap = Math.max(0, Math.min(16, data.gap));
    if(typeof data.kits === 'number' && !isNaN(data.kits)) state.kits = Math.max(1, Math.min(50, Math.round(data.kits)));
    if(typeof data.fillColumn === 'boolean') state.fillColumn = data.fillColumn;
    if(['continue','restart'].includes(data.fillMode)) state.fillMode = data.fillMode;
    if(['horizontal','vertical'].includes(data.orientation)) state.orientation = data.orientation;
    if(['row','column'].includes(data.flow)) state.flow = data.flow;
    if(['left','center'].includes(data.align)) state.align = data.align;
    if(SHAPES[data.shape]) state.shape = data.shape;
    if(['square','rounded'].includes(data.radius)) state.radius = data.radius;
    if(typeof data.borderWidth === 'number' && !isNaN(data.borderWidth)) state.borderWidth = Math.max(0, Math.min(14, data.borderWidth));
    if(['solid','dashed','dotted','none'].includes(data.borderStyle)) state.borderStyle = data.borderStyle;
    if(THEMES[data.theme] || data.theme === 'custom') state.theme = data.theme;
    if(typeof data.customColor === 'string') state.customColor = data.customColor;
    if(FONTS[data.font]) state.font = data.font;
    if(typeof data.fontScale === 'number' && !isNaN(data.fontScale)) state.fontScale = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, data.fontScale));
    if(['uniform','autofit','alt','mixed'].includes(data.fontVariation)) state.fontVariation = data.fontVariation;
    if(typeof data.alt === 'boolean') state.alt = data.alt;
    if(typeof data.guides === 'boolean') state.guides = data.guides;
    if(typeof data.outline === 'boolean') state.outline = data.outline;
    if(typeof data.dot === 'boolean') state.dot = data.dot;
    return true;
  } catch(e) {
    return false;
  }
}

function syncAllInputs(){
  if($('#from')) $('#from').value = state.from;
  if($('#to')) $('#to').value = state.to;
  if($('#size')) $('#size').value = state.size;
  if($('#sizeVal')) $('#sizeVal').textContent = state.size + ' mm';
  if($('#gapInput')) $('#gapInput').value = state.gap;
  if($('#gapVal')) $('#gapVal').textContent = state.gap + ' mm';
  if($('#multInput')) $('#multInput').value = state.kits;
  if($('#multVal')) $('#multVal').textContent = `${state.kits} kit${state.kits === 1 ? '' : 's'}`;
  if($('#fillColumn')) $('#fillColumn').checked = state.fillColumn ?? true;
  syncFillModeControls();
  if($('#bwInput')) $('#bwInput').value = state.borderWidth ?? 6;
  if($('#bwVal')) $('#bwVal').textContent = (state.borderWidth ?? 6) + ' px';
  syncToggles();
  syncFontSizeControls();
  syncDirectionControls();
  syncAlignmentControls();
  syncRadiusControls();
  syncBorderStyleControls();
  updateSizePresets();
  updateGapPresets();
  updateMultPresets();
  updateBwPresets();
  updateRangeChips();
}

function currentTheme(){
  if(state.theme==='custom') return {name:'Custom', colors:[state.customColor]};
  return THEMES[state.theme];
}

/* ---------- helpers ---------- */
function inkFor(hex){
  const n=parseInt(hex.slice(1),16), r=n>>16, g=n>>8&255, b=n&255;
  return (r*299+g*587+b*114)/1000 >= 150 ? '#232738' : '#FFFFFF';
}
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600);
}

function updateRangeChips(){
  const chips = document.querySelectorAll('#rangePresets .range-chip');
  chips.forEach(chip => {
    const cf = parseInt(chip.dataset.from, 10);
    const ct = parseInt(chip.dataset.to, 10);
    chip.classList.toggle('sel', cf === state.from && ct === state.to);
  });
}

function commitRange(notify = true){
  const fromEl = $('#from');
  const toEl = $('#to');
  let f = parseInt(fromEl.value, 10);
  let t = parseInt(toEl.value, 10);

  if(isNaN(f)) f = state.from ?? 1;
  if(isNaN(t)) t = state.to ?? Math.max(f, f + 29);

  f = Math.max(0, Math.min(999, f));
  t = Math.max(0, Math.min(999, t));

  if(f > t){
    [f, t] = [t, f];
    if(notify) toast('Swapped range: ' + f + ' → ' + t + ' 🙂');
  }

  if(t - f + 1 > MAX_STICKERS){
    t = f + MAX_STICKERS - 1;
    if(notify) toast('Capped at ' + MAX_STICKERS + ' stickers');
  }

  fromEl.value = f;
  toEl.value = t;
  state.from = f;
  state.to = t;
  const hint = $('#rangeHint');
  if(hint) hint.textContent = '';
  updateRangeChips();
  render(true);
}

function handleRangeInput(){
  const fromEl = $('#from');
  const toEl = $('#to');
  const fromVal = fromEl.value.trim();
  const toVal = toEl.value.trim();
  const hint = $('#rangeHint');

  // If user is actively clearing the field to type a new number, DO NOT overwrite!
  if(fromVal === '' || toVal === ''){
    if(hint) hint.textContent = 'Enter both numbers';
    return;
  }

  const f = parseInt(fromVal, 10);
  const t = parseInt(toVal, 10);

  if(isNaN(f) || isNaN(t)){
    if(hint) hint.textContent = 'Please enter valid numbers';
    return;
  }

  if(f < 0 || t > 999 || !Number.isInteger(Number(fromVal)) || !Number.isInteger(Number(toVal))){
    if(hint) hint.textContent = 'Use whole numbers from 0 to 999';
    return;
  }
  if(f > t){
    if(hint) hint.textContent = 'FROM (' + f + ') is greater than TO (' + t + ')';
    return; // Don't swap while user is actively typing!
  }

  if(hint) hint.textContent = '';
  const count = t - f + 1;
  if(count > MAX_STICKERS){
    if(hint) hint.textContent = 'Max ' + MAX_STICKERS + ' stickers allowed';
    state.from = Math.max(0, f);
    state.to = Math.min(999, f + MAX_STICKERS - 1);
  } else {
    state.from = Math.max(0, f);
    state.to = Math.min(999, t);
  }

  updateRangeChips();
  render(true); // keepInputs = true: do not overwrite the user's active inputs while typing!
}
function cellDims(){
  const s = getShapeSpec();
  if(state.shape === 'rect' && state.orientation === 'vertical'){
    return {cellW: +(state.size * 0.625).toFixed(2), cellH: state.size};
  }
  return {cellW: state.size, cellH: +(state.size * s.ratio).toFixed(2)};
}
let currentMaxNumber = 30;
function labelFor(n){ return state.dot ? n + '.' : String(n); }
function fontSize(n, spec, index=0){
  const maxVal = Math.max(state.to || 30, currentMaxNumber || state.to || 30);
  const maxDigits = Math.max(String(state.from || 1).length, String(maxVal).length);
  let base;
  if(state.fontVariation === 'autofit'){
    const digits = String(n).length;
    base = digits <= 1 ? 50 : digits === 2 ? 44 : digits === 3 ? 36 : 28;
  } else {
    // Uniform mode: all numbers share the exact same font size based on the range max digits
    base = maxDigits <= 2 ? 44 : maxDigits === 3 ? 36 : 28;
  }

  let vMult = 1.0;
  if(state.fontVariation === 'mixed'){
    vMult = MIXED_JITTER[index % MIXED_JITTER.length];
  } else if(state.fontVariation === 'alt'){
    vMult = (index % 2 === 0) ? 0.88 : 1.15;
  }

  const scale = (state.fontScale || 100) / 100;
  return Math.max(8, Math.round(base * spec.fsf * (state.dot ? 0.86 : 1) * scale * vMult));
}

/* ---------- sticker SVG ---------- */
function stickerSVG(n, themeColor, ring, guides, index=0){
  const s = getShapeSpec();
  const fs = fontSize(n,s,index);
  const F = FONTS[state.font];
  const fill   = state.outline ? '#FFFFFF' : themeColor;
  const stroke = state.outline ? themeColor : ring;
  const ink    = state.outline ? '#232738' : inkFor(themeColor);
  const guide = guides
    ? `<g transform="translate(${s.cx} ${s.cy}) scale(1.13) translate(-${s.cx} -${s.cy})">
         <path d="${s.d}" fill="none" stroke="#BCC3D2" stroke-width="1.4" stroke-dasharray="5 5"/></g>` : '';

  const bw = state.borderStyle === 'none' ? 0 : (typeof state.borderWidth === 'number' ? state.borderWidth : 6);
  const lineJoin = state.radius === 'square' ? 'miter' : 'round';
  let dashAttr = '';
  if(state.borderStyle === 'dashed'){
    dashAttr = ' stroke-dasharray="10 8" stroke-linecap="round"';
  } else if(state.borderStyle === 'dotted'){
    dashAttr = ' stroke-dasharray="3 7" stroke-linecap="round"';
  }
  const strokeAttr = bw > 0 ? `stroke="${stroke}" stroke-width="${bw}" stroke-linejoin="${lineJoin}"${dashAttr}` : 'stroke="none"';

  return `<svg viewBox="${s.vb}" aria-hidden="true">
    ${guide}
    <path d="${s.d}" fill="${fill}" ${strokeAttr}/>
    <text x="${s.cx}" y="${s.cy+1}" text-anchor="middle" dominant-baseline="central"
      font-family="'${F.family}',sans-serif" font-weight="${F.weight}" font-size="${fs}" fill="${ink}">${labelFor(n)}</text>
  </svg>`;
}

/* ---------- build sheets ---------- */
function render(keepInputs = false){
  if(!keepInputs){
    $('#from').value = state.from;
    $('#to').value = state.to;
  }
  updateRangeChips();

  const size = state.size;
  const {cellW, cellH} = cellDims();
  const gap = Math.max(0, Math.min(16, typeof state.gap === 'number' ? state.gap : 4));
  const kits = Math.max(1, Math.min(50, parseInt(state.kits, 10) || 1));
  const align = state.align || 'left';
  const flow = state.flow || 'row';
  const shouldFill = state.fillColumn ?? true;
  const fillMode = state.fillMode || 'continue';

  const maxCols = Math.max(1, Math.floor((PAGE_W - 2 * MARGIN + gap) / (cellW + gap)));
  const maxRows = Math.min(50, Math.max(1, Math.floor((PAGE_H - 2 * MARGIN + gap) / (cellH + gap))));

  const baseNumbers = [];
  for(let n = state.from; n <= state.to; n++) baseNumbers.push(n);

  const sheetsData = buildKitSheets({from: state.from, to: state.to, kits,
    maxCols, maxRows, flow, fill: shouldFill, fillMode});
  currentMaxNumber = sheetsData.reduce((max, sheet) =>
    sheet.cells.reduce((value, cell) => Math.max(value, cell.n), max), state.to);

  const sheetCount = sheetsData.length;
  const totalStickersCount = sheetsData.reduce((acc, sh) => acc + sh.cells.length, 0);
  const theme = currentTheme();
  const ring = theme.ring || '#FFFFFF';

  const alignJustify = align === 'center' ? 'center' : 'start';
  const alignContent = align === 'center' ? 'center' : 'start';

  const root = $('#printRoot'); root.innerHTML = '';
  const frag = document.createDocumentFragment();

  sheetsData.forEach((sh, s) => {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.style.cssText += `grid-template-columns:repeat(${sh.cols},${cellW}mm);grid-template-rows:repeat(${sh.rows},${cellH}mm);gap:${gap}mm;padding:${MARGIN}mm;justify-content:${alignJustify};align-content:${alignContent};`;

    const tag = document.createElement('div');
    tag.className = 'sheetTag'; tag.textContent = `Sheet ${s+1} / ${sheetCount}`;
    sheet.appendChild(tag);


    sh.cells.forEach(cellData => {
      const color = state.alt ? theme.colors[cellData.globalIdx % theme.colors.length] : theme.colors[0];
      const cell = document.createElement('div');
      cell.className = 'stk pop';
      cell.style.gridColumn = cellData.col + 1;
      cell.style.gridRow = cellData.row + 1;
      cell.style.animationDelay = Math.min(cellData.globalIdx * 10, 420) + 'ms';
      cell.innerHTML = stickerSVG(cellData.n, color, ring, state.guides, cellData.globalIdx);
      sheet.appendChild(cell);
    });

    frag.appendChild(sheet);
  });
  root.appendChild(frag);

  build = {
    baseNumbers,
    sheets: sheetsData,
    sheetCount,
    totalStickersCount,
    maxCols,
    maxRows,
    gap,
    kits,
    size,
    cellW,
    cellH,
    align,
    flow
  };

  $('#sizeVal').textContent = size + ' mm';
  if($('#size') && document.activeElement !== $('#size')) $('#size').value = size;
  if(typeof updateSizePresets === 'function') updateSizePresets();
  if($('#gapVal')) $('#gapVal').textContent = gap + ' mm';
  if($('#gapInput') && document.activeElement !== $('#gapInput')) $('#gapInput').value = gap;
  if(typeof updateGapPresets === 'function') updateGapPresets();

  if($('#multVal')) $('#multVal').textContent = `${kits} kit${kits === 1 ? '' : 's'}`;
  if($('#multInput') && document.activeElement !== $('#multInput')) $('#multInput').value = kits;
  if(typeof updateMultPresets === 'function') updateMultPresets();

  if($('#bwVal')) $('#bwVal').textContent = (state.borderWidth ?? 6) + ' px';
  if($('#bwInput') && document.activeElement !== $('#bwInput')) $('#bwInput').value = state.borderWidth ?? 6;
  if(typeof updateBwPresets === 'function') updateBwPresets();
  if(typeof syncRadiusControls === 'function') syncRadiusControls();
  if(typeof syncBorderStyleControls === 'function') syncBorderStyleControls();

  $('#fontScaleVal').textContent = state.fontScale + '%';
  const dim = state.shape === 'rect'
    ? ` &nbsp;·&nbsp; label ≈ <b>${cellW} × ${cellH} mm</b> (${state.orientation === 'vertical' ? 'vert' : 'horiz'})`
    : ` &nbsp;·&nbsp; size ≈ <b>${cellW} × ${cellH} mm</b>`;
  const flowDesc = flow === 'column' ? 'down columns' : 'across rows';
  const alignDesc = align === 'left' ? 'left-aligned ⇤' : 'centered ⇥⇤';
  $('#capText').innerHTML = `<b>${alignDesc}</b> &nbsp;·&nbsp; <b>${flowDesc}</b> &nbsp;·&nbsp; <b>${maxCols} × ${maxRows}</b> max/sheet${dim}`;
  const multInfo = ` · ${kits} kit${kits === 1 ? '' : 's'}`;
  const fillInfo = (shouldFill && totalStickersCount > baseNumbers.length * kits)
    ? (fillMode === 'continue' ? ` · continued to ${currentMaxNumber}` : ` · extra space filled from ${state.from}`)
    : '';
  $('#stats').textContent = `${totalStickersCount} sticker${totalStickersCount !== 1 ? 's' : ''}${multInfo}${fillInfo} · ${sheetCount} A4 sheet${sheetCount !== 1 ? 's' : ''}`;
  $('#chip').textContent = `${totalStickersCount} stickers · ${sheetCount} sheet${sheetCount !== 1 ? 's' : ''}`;

  const shapeLabel = SHAPES[state.shape].label + (state.shape === 'rect' ? (state.orientation === 'vertical' ? ' · vert' : ' · horiz') : '');
  const cornerSuffix = ['rect','square'].includes(state.shape) ? ` · ${state.radius || 'rounded'}` : '';
  $('#pillShape').textContent = shapeLabel + cornerSuffix + (state.outline ? ' · outline' : '') + (state.dot ? ' · 1. 2. 3.' : '');
  if($('#pillBorder')) $('#pillBorder').textContent = state.borderStyle === 'none' ? 'borderless' : `${state.borderWidth ?? 6}px ${state.borderStyle || 'solid'}`;
  $('#pillSize').textContent = size + ' mm';
  if($('#pillGap')) $('#pillGap').textContent = 'gap ' + gap + ' mm';
  if($('#pillAlign')) $('#pillAlign').textContent = align === 'left' ? 'left ⇤' : 'center ⇥';
  if($('#pillMult')) $('#pillMult').textContent = `${kits} kit${kits === 1 ? '' : 's'}`;
  const varSuffix = state.fontVariation !== 'uniform' ? ` · ${state.fontVariation}` : '';
  $('#pillFont').textContent = `${state.font} · ${state.fontScale}%${varSuffix}`;

  const badge = $('#mTabBadge');
  if(badge) badge.textContent = sheetCount;
  $('#sequenceSummary').textContent = `${baseNumbers.length} numbers × ${kits} kits = ${baseNumbers.length * kits} requested stickers. ${maxRows} fit per column at this size.${flow === 'column' ? ` Next kit restarts at ${state.from} after ${state.to}.` : ''}`;
  syncFillModeControls();
  document.querySelectorAll('button.sel, button[data-mode], .dir-btn, .range-chip, .tile, .fontbtn, .fs-btn, .sw').forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('sel')));
  });
  updateMobileBar();
  saveState();
  layout();
}

function layout(){
  if(!build) return;
  const scroller=$('#scroll');
  const pad = window.innerWidth < 640 ? 16 : 40;
  const avail = Math.max(100, scroller.clientWidth - pad);
  const sheetW=PAGE_W*PXMM, sheetH=PAGE_H*PXMM;
  let s;
  if(state.zoom === '100'){
    s = 1;
  } else {
    s = Math.max(.2, Math.min(1, avail/sheetW));
  }
  const root=$('#printRoot');
  root.style.transform=`scale(${s})`;
  $('#fitBox').style.width=(sheetW*s)+'px';
  $('#fitBox').style.height=(build.sheetCount*sheetH*s+(build.sheetCount-1)*28*s)+'px';
}
new ResizeObserver(layout).observe($('#scroll'));
window.addEventListener('resize',layout);
window.addEventListener('orientationchange',()=>setTimeout(layout,200));

/* ---------- sticker size controls ---------- */
function updateSizePresets(){
  const chips = document.querySelectorAll('#sizePresets .range-chip');
  chips.forEach(chip => {
    const sz = parseInt(chip.dataset.size, 10);
    chip.classList.toggle('sel', sz === state.size);
  });
}

function setSize(v){
  if(isNaN(v)) return;
  v = Math.max(SIZE_MIN, Math.min(SIZE_MAX, Math.round(v)));
  if(v === state.size) return;
  state.size = v;
  if($('#size')) $('#size').value = v;
  if($('#sizeVal')) $('#sizeVal').textContent = v + ' mm';
  updateSizePresets();
  render();
}

function initSizeControls(){
  document.querySelectorAll('#sizePresets .range-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sz = parseInt(chip.dataset.size, 10);
      if(isNaN(sz)) return;
      setSize(sz);
      toast(`Sticker size set to ${sz} mm 📏`);
    });
  });
}
function holdStep(btn, stepFn){
  btn.addEventListener('click',()=>stepFn());
  btn.addEventListener('contextmenu',e=>e.preventDefault());
  let t1,t2;
  const stop=()=>{clearTimeout(t1); clearInterval(t2); t1=t2=null;};
  btn.addEventListener('pointerdown',()=>{
    t1=setTimeout(()=>{ t2=setInterval(stepFn,110); },380);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>btn.addEventListener(ev,stop));
}
holdStep($('#minus'),()=>setSize(state.size-1));
holdStep($('#plus'),()=>setSize(state.size+1));
holdStep($('#fsMinus'),()=>setFontScale(state.fontScale-5));
holdStep($('#fsPlus'),()=>setFontScale(state.fontScale+5));

/* ---------- control builders ---------- */
function buildShapeTiles(){
  const box=$('#shapes'); box.innerHTML='';
  const isSquare = state.radius === 'square';
  SHAPE_ORDER.forEach(sh=>{
    let d, vb;
    if(sh === 'rect'){
      if(state.orientation === 'vertical'){
        d = isSquare ? 'M3,3 h94 v154 h-94 Z' : rectVertD;
        vb = '-5 -5 110 170';
      } else {
        d = isSquare ? 'M3,3 h154 v94 h-154 Z' : rectD;
        vb = '-5 -5 170 110';
      }
    } else if(sh === 'square'){
      d = isSquare ? 'M4,4 h92 v92 h-92 Z' : roundedD;
      vb = '-8 -8 116 116';
    } else {
      d = SHAPES[sh].d;
      vb = SHAPES[sh].vb || '-8 -8 116 116';
    }
    const label = SHAPES[sh].label;
    const b=document.createElement('button');
    b.className='tile'+(sh===state.shape?' sel':'');
    b.innerHTML=`<svg viewBox="${vb}"><path d="${d}" fill="#232738"/></svg><span>${label}</span>`;
    b.onclick=()=>{state.shape=sh; [...box.children].forEach(c=>c.classList.remove('sel')); b.classList.add('sel'); render();};
    box.appendChild(b);
  });
}
function buildSwatches(){
  const box=$('#themes'); box.innerHTML='';
  THEME_ORDER.forEach(key=>{
    const t=THEMES[key];
    const b=document.createElement('button');
    b.className='sw'+(key===state.theme?' sel':''); b.title=t.name;
    b.style.background = key==='rainbow'
      ? 'conic-gradient(#FF6B4A 0 60deg,#FFC531 0 120deg,#57CC99 0 180deg,#4CC9F0 0 240deg,#9B5DE5 0 300deg,#FF70A6 0)'
      : t.colors[0];
    b.onclick=()=>{state.theme=key; [...box.children].forEach(c=>c.classList.remove('sel')); b.classList.add('sel'); render();};
    box.appendChild(b);
  });
  /* custom color picker swatch */
  const cp=document.createElement('span');
  cp.className='sw custom'+(state.theme==='custom'?' sel':'');
  cp.title='Pick a custom color';
  cp.style.background=state.customColor;
  const ci=document.createElement('input');
  ci.type='color'; ci.value=state.customColor;
  ci.addEventListener('input',e=>{
    state.customColor=e.target.value;
    state.theme='custom';
    cp.style.background=state.customColor;
    [...box.children].forEach(c=>c.classList.remove('sel'));
    cp.classList.add('sel');
    render();
  });
  cp.appendChild(ci);
  box.appendChild(cp);
}
function buildFonts(){
  const box=$('#fonts'); box.innerHTML='';
  Object.entries(FONTS).forEach(([key,f])=>{
    const b=document.createElement('button');
    b.className='fontbtn'+(key===state.font?' sel':'');
    b.innerHTML=`<b style="font-family:'${f.family}';font-weight:${f.weight}">123</b><span>${key}</span>`;
    b.onclick=()=>{state.font=key; [...box.children].forEach(c=>c.classList.remove('sel')); b.classList.add('sel'); updateFsPresetFont(); render();};
    box.appendChild(b);
  });
}
function syncToggles(){
  $('#alt').checked=state.alt; $('#guides').checked=state.guides;
  $('#outline').checked=state.outline; $('#dot').checked=state.dot;
}

/* ---------- PNG export (150 dpi A4 = 1240×1754) ---------- */
async function downloadPNGs(singleSheetIdx = null){
  if(!build || !build.sheets) return;
  const isSingle = typeof singleSheetIdx === 'number';
  toast(isSingle ? `Rendering Sheet ${singleSheetIdx + 1} PNG…` : 'Rendering PNG sheets…');
  await document.fonts.ready;
  const W=1240, H=1754, k=W/PAGE_W;
  const theme=currentTheme(), ring=theme.ring||'#FFFFFF', F=FONTS[state.font];
  const s = getShapeSpec();
  const {gap, cellW, cellH, align} = build;

  const startSh = isSingle ? singleSheetIdx : 0;
  const endSh = isSingle ? singleSheetIdx + 1 : build.sheetCount;

  for(let shIdx=startSh; shIdx<endSh; shIdx++){
    const sheetData = build.sheets[shIdx];
    const c=document.createElement('canvas'); c.width=W; c.height=H;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);

    let ox, oy;
    if(align === 'center'){
      const totalW = sheetData.cols * cellW + (sheetData.cols - 1) * gap;
      const totalH = sheetData.rows * cellH + (sheetData.rows - 1) * gap;
      ox = (PAGE_W - totalW) / 2;
      oy = (PAGE_H - totalH) / 2;
    } else {
      ox = MARGIN;
      oy = MARGIN;
    }

    sheetData.cells.forEach(cellData => {
      const x = ox + cellData.col * (cellW + gap);
      const y = oy + cellData.row * (cellH + gap);
      const color = state.alt ? theme.colors[cellData.globalIdx % theme.colors.length] : theme.colors[0];
      ctx.save();
      ctx.translate(x*k, y*k);
      const [vx, vy, vw, vh] = s.vb.split(' ').map(Number);
      const sc = Math.min(cellW * k / vw, cellH * k / vh);
      ctx.translate((cellW * k - vw * sc) / 2, (cellH * k - vh * sc) / 2);
      ctx.scale(sc, sc);
      ctx.translate(-vx, -vy);
      if(state.guides){
        ctx.save(); ctx.translate(s.cx, s.cy); ctx.scale(1.13, 1.13); ctx.translate(-s.cx, -s.cy);
        ctx.setLineDash([5, 5]); ctx.strokeStyle='#BCC3D2'; ctx.lineWidth=1.4;
        ctx.stroke(new Path2D(s.d)); ctx.restore();
      }
      const p = new Path2D(s.d);
      ctx.fillStyle = state.outline ? '#FFFFFF' : color;
      ctx.fill(p);
      const bw = state.borderStyle === 'none' ? 0 : (typeof state.borderWidth === 'number' ? state.borderWidth : 6);
      if(bw > 0 && state.borderStyle !== 'none'){
        ctx.lineJoin = state.radius === 'square' ? 'miter' : 'round';
        ctx.strokeStyle = state.outline ? color : ring;
        ctx.lineWidth = bw;
        if(state.borderStyle === 'dashed'){
          ctx.setLineDash([10, 8]);
          ctx.lineCap = 'round';
        } else if(state.borderStyle === 'dotted'){
          ctx.setLineDash([3, 7]);
          ctx.lineCap = 'round';
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke(p);
        ctx.setLineDash([]);
      }
      ctx.fillStyle = state.outline ? '#232738' : inkFor(color);
      ctx.font = `${F.weight} ${fontSize(cellData.n, s, cellData.globalIdx)}px '${F.family}'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labelFor(cellData.n), s.cx, s.cy + 2);
      ctx.restore();
    });

    await new Promise(res=>c.toBlob(b=>{
      const a=document.createElement('a');
      a.href=URL.createObjectURL(b);
      a.download=`stickers-sheet-${shIdx+1}-of-${build.sheetCount}.png`;
      a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); res();
    },'image/png'));
    if(!isSingle && shIdx < endSh - 1) await new Promise(r=>setTimeout(r,350));
  }
  toast(isSingle ? `Sheet ${singleSheetIdx + 1} PNG downloaded! 📥` : 'Done! Check your downloads 📥');
}

/* ---------- zoom controls ---------- */
function setZoom(mode){
  state.zoom = mode;
  const fitBtn = $('#zoomFit');
  const actualBtn = $('#zoom100');
  if(fitBtn) fitBtn.classList.toggle('active', mode === 'fit');
  if(actualBtn) actualBtn.classList.toggle('active', mode === '100');
  layout();
}

/* ---------- mobile view switcher & action bar ---------- */
function updateMobileBar(){
  const toggleIcon = $('#mBarToggleIcon');
  const toggleText = $('#mBarToggleText');
  if(!toggleText) return;
  const count = build?.totalStickersCount ?? (state.to - state.from + 1);
  if(state.mobileView === 'preview'){
    toggleIcon.textContent = '⚙️';
    toggleText.textContent = 'Edit Stickers';
  } else {
    toggleIcon.textContent = '📄';
    toggleText.textContent = 'View Sheet (' + count + ')';
  }
}

function setMobileView(view){
  state.mobileView = view;
  const layoutEl = $('main.layout');
  if(layoutEl){
    layoutEl.classList.remove('view-controls', 'view-preview');
    layoutEl.classList.add(view === 'preview' ? 'view-preview' : 'view-controls');
  }
  const tabC = $('#tabControls');
  const tabP = $('#tabPreview');
  if(tabC) tabC.classList.toggle('active', view === 'controls');
  if(tabP) tabP.classList.toggle('active', view === 'preview');
  updateMobileBar();
  if(view === 'preview'){
    setTimeout(layout, 50);
    window.scrollTo({top: 0, behavior: 'smooth'});
  } else {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
}

function initMobileAndRangeControls(){
  // Mobile tabs
  $('#tabControls')?.addEventListener('click', () => setMobileView('controls'));
  $('#tabPreview')?.addEventListener('click', () => setMobileView('preview'));

  // Mobile sticky bottom bar
  $('#mBarToggle')?.addEventListener('click', () => {
    setMobileView(state.mobileView === 'controls' ? 'preview' : 'controls');
  });
  $('#mBarPrint')?.addEventListener('click', () => {
    triggerPrint();
  });

  // Zoom buttons
  $('#zoomFit')?.addEventListener('click', () => setZoom('fit'));
  $('#zoom100')?.addEventListener('click', () => setZoom('100'));

  // Range preset chips
  document.querySelectorAll('#rangePresets .range-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const f = parseInt(chip.dataset.from, 10);
      const t = parseInt(chip.dataset.to, 10);
      if(isNaN(f) || isNaN(t)) return;
      state.from = f;
      state.to = t;
      $('#from').value = f;
      $('#to').value = t;
      const hint = $('#rangeHint');
      if(hint) hint.textContent = '';
      updateRangeChips();
      render(true);
      toast('Selected range ' + f + ' → ' + t + ' 🏷️');
    });
  });
}

/* ---------- events ---------- */
let debounce;
const schedule=()=>{clearTimeout(debounce); debounce=setTimeout(render,90);};

$('#from').addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(handleRangeInput, 90);
});
$('#to').addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(handleRangeInput, 90);
});
$('#from').addEventListener('blur', () => commitRange(true));
$('#to').addEventListener('blur', () => commitRange(true));
$('#from').addEventListener('change', () => commitRange(true));
$('#to').addEventListener('change', () => commitRange(true));
['from','to'].forEach(id => {
  $('#' + id).addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      commitRange(true);
      $('#' + id).blur();
    }
  });
});

$('#size').addEventListener('input', e => {
  state.size = Math.max(SIZE_MIN, Math.min(SIZE_MAX, +e.target.value));
  if($('#sizeVal')) $('#sizeVal').textContent = state.size + ' mm';
  updateSizePresets();
  schedule();
});
$('#alt').addEventListener('change',e=>{state.alt=e.target.checked; render();});
$('#guides').addEventListener('change',e=>{state.guides=e.target.checked; render();});
$('#outline').addEventListener('change',e=>{state.outline=e.target.checked; render();});
$('#dot').addEventListener('change',e=>{state.dot=e.target.checked; render();});
$('#fillColumn')?.addEventListener('change', e => {
  state.fillColumn = e.target.checked;
  syncFillModeControls();
  render();
  toast(state.fillColumn ? 'Full sheet fill active' : 'Sheet fill turned off');
});

/* ---------- font size variation controls ---------- */
function updateFsPresetSelection(){
  const box = $('#fsPresets');
  if(!box) return;
  [...box.children].forEach(btn=>{
    const sc = parseInt(btn.dataset.scale, 10);
    btn.classList.toggle('sel', sc === state.fontScale);
  });
}

function updateFsPresetFont(){
  const F = FONTS[state.font];
  if(!F) return;
  document.querySelectorAll('.fs-sample').forEach(el=>{
    el.style.fontFamily = `'${F.family}', sans-serif`;
    el.style.fontWeight = F.weight;
  });
}

function setFontScale(v){
  v = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, Math.round(v/5)*5));
  if(v === state.fontScale) return;
  state.fontScale = v;
  $('#fontScale').value = v;
  updateFsPresetSelection();
  render();
}

function setFontVariation(mode){
  state.fontVariation = mode;
  const box = $('#varModes');
  if(box){
    [...box.children].forEach(btn=>{
      btn.classList.toggle('sel', btn.dataset.mode === mode);
    });
  }
  render();
}

function syncFontSizeControls(){
  $('#fontScale').value = state.fontScale;
  $('#fontScaleVal').textContent = state.fontScale + '%';
  updateFsPresetSelection();
  updateFsPresetFont();
  const varBox = $('#varModes');
  if(varBox){
    [...varBox.children].forEach(btn=>{
      btn.classList.toggle('sel', btn.dataset.mode === state.fontVariation);
    });
  }
}

function initFontSizeControls(){
  const presetBox = $('#fsPresets');
  if(presetBox){
    [...presetBox.children].forEach(btn=>{
      btn.onclick = () => setFontScale(parseInt(btn.dataset.scale, 10));
    });
  }
  const varBox = $('#varModes');
  if(varBox){
    [...varBox.children].forEach(btn=>{
      btn.onclick = () => setFontVariation(btn.dataset.mode);
    });
  }
  $('#fontScale').addEventListener('input', e=>{
    state.fontScale = +e.target.value;
    updateFsPresetSelection();
    schedule();
  });
}

/* ---------- gap (spacing) controls ---------- */
function updateGapPresets(){
  const chips = document.querySelectorAll('#gapPresets .range-chip');
  chips.forEach(chip => {
    const g = parseFloat(chip.dataset.gap);
    chip.classList.toggle('sel', Math.abs(g - state.gap) < 0.05);
  });
}

function setGap(v){
  v = Math.max(0, Math.min(16, Math.round(v * 2) / 2));
  if(v === state.gap) return;
  state.gap = v;
  if($('#gapInput')) $('#gapInput').value = v;
  if($('#gapVal')) $('#gapVal').textContent = v + ' mm';
  updateGapPresets();
  render();
}

function initGapControls(){
  holdStep($('#gapMinus'), () => setGap(state.gap - 0.5));
  holdStep($('#gapPlus'), () => setGap(state.gap + 0.5));

  const gapIn = $('#gapInput');
  if(gapIn){
    gapIn.addEventListener('input', e => {
      state.gap = +e.target.value;
      if($('#gapVal')) $('#gapVal').textContent = state.gap + ' mm';
      updateGapPresets();
      schedule();
    });
  }

  document.querySelectorAll('#gapPresets .range-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const g = parseFloat(chip.dataset.gap);
      setGap(g);
      toast('Sticker spacing set to ' + g + ' mm ↔');
    });
  });
}

/* ---------- direction & orientation controls ---------- */
function setOrientation(orient){
  if(state.orientation === orient) return;
  state.orientation = orient;
  syncDirectionControls();
  buildShapeTiles();
  render();
  toast(orient === 'vertical' ? 'Vertical orientation ↕' : 'Horizontal orientation ↔');
}

function setFlow(flow){
  if(state.flow === flow) return;
  state.flow = flow;
  syncDirectionControls();
  render();
  toast(flow === 'column' ? 'Filling down columns ⬇️' : 'Filling across rows ➡️');
}

function syncDirectionControls(){
  document.querySelectorAll('#orientGroup .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.orient === state.orientation);
  });
  document.querySelectorAll('#flowGroup .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.flow === state.flow);
  });
}

function initDirectionControls(){
  document.querySelectorAll('#orientGroup .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setOrientation(btn.dataset.orient));
  });
  document.querySelectorAll('#flowGroup .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setFlow(btn.dataset.flow));
  });
}

/* ---------- kits columns controls ---------- */
function updateMultPresets(){
  const chips = document.querySelectorAll('#multPresets .range-chip');
  chips.forEach(chip => {
    const m = parseInt(chip.dataset.mult, 10);
    chip.classList.toggle('sel', m === state.kits);
  });
}

function setKits(v){
  v = Math.max(1, Math.min(50, Math.round(v)));
  if(v === state.kits) return;
  state.kits = v;
  if($('#multInput')) $('#multInput').value = v;
  if($('#multVal')) $('#multVal').textContent = `${v} kit${v === 1 ? '' : 's'}`;
  updateMultPresets();
  render();
  toast(`${v} kit${v === 1 ? '' : 's'} selected`);
}

function initMultControls(){
  holdStep($('#multMinus'), () => setKits((state.kits || 1) - 1));
  holdStep($('#multPlus'), () => setKits((state.kits || 1) + 1));

  const multIn = $('#multInput');
  if(multIn){
    multIn.addEventListener('input', e => {
      state.kits = Math.max(1, Math.min(50, Math.round(+e.target.value) || 1));
      if($('#multVal')) $('#multVal').textContent = `${state.kits} kit${state.kits === 1 ? '' : 's'}`;
      updateMultPresets();
      schedule();
    });
  }

  document.querySelectorAll('#multPresets .range-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const m = parseInt(chip.dataset.mult, 10);
      setKits(m);
    });
  });
}

/* ---------- fill mode controls ---------- */
function setFillMode(mode){
  if(mode !== 'continue' && mode !== 'restart') return;
  state.fillMode = mode;
  syncFillModeControls();
  render();
  toast(mode === 'continue' ? `Extra space continues from ${state.to + 1}` : `Extra space repeats from ${state.from}`);
}

function syncFillModeControls(){
  $('#fillModeContinue .dir-label').textContent = `Continue from ${state.to + 1}`;
  $('#fillModeRestart .dir-label').textContent = `Repeat from ${state.from}`;
  const wrap = $('#fillModeWrap');
  const isFill = state.fillColumn ?? true;
  if(wrap){
    wrap.style.display = isFill ? 'grid' : 'none';
  }
  document.querySelectorAll('#fillModeWrap .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.fillmode === (state.fillMode || 'continue'));
  });
}

function initFillModeControls(){
  document.querySelectorAll('#fillModeWrap .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setFillMode(btn.dataset.fillmode));
  });
}

/* ---------- sheet alignment controls ---------- */
function setAlignment(align){
  if(state.align === align) return;
  state.align = align;
  syncAlignmentControls();
  render();
  toast(align === 'left' ? 'Starting stickers from left margin ⇤' : 'Centered stickers on sheet ⇥⇤');
}

function syncAlignmentControls(){
  document.querySelectorAll('#alignGroup .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.align === (state.align || 'left'));
  });
}

function initAlignmentControls(){
  document.querySelectorAll('#alignGroup .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setAlignment(btn.dataset.align));
  });
}

/* ---------- corner radius controls ---------- */
function setRadius(r){
  if(r !== 'square' && r !== 'rounded') return;
  if(state.radius === r) return;
  state.radius = r;
  syncRadiusControls();
  buildShapeTiles();
  render();
  toast(r === 'square' ? 'Sharp square corners ⬛' : 'Curved rounded corners ▢');
}

function syncRadiusControls(){
  document.querySelectorAll('#radiusGroup .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.radius === (state.radius || 'rounded'));
  });
}

function initRadiusControls(){
  document.querySelectorAll('#radiusGroup .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setRadius(btn.dataset.radius));
  });
}

/* ---------- border line & style controls ---------- */
function setBorderWidth(w){
  if(isNaN(w)) return;
  w = Math.max(0, Math.min(14, Math.round(w)));
  if(state.borderWidth === w) return;
  state.borderWidth = w;
  if($('#bwInput')) $('#bwInput').value = w;
  if($('#bwVal')) $('#bwVal').textContent = w + ' px';
  updateBwPresets();
  render();
}

function updateBwPresets(){
  const chips = document.querySelectorAll('#bwPresets .range-chip');
  chips.forEach(chip => {
    const bw = parseInt(chip.dataset.bw, 10);
    chip.classList.toggle('sel', bw === state.borderWidth);
  });
}

function setBorderStyle(style){
  if(!['solid','dashed','dotted','none'].includes(style)) return;
  if(state.borderStyle === style) return;
  state.borderStyle = style;
  syncBorderStyleControls();
  render();
  toast(`Line style set to ${style}`);
}

function syncBorderStyleControls(){
  document.querySelectorAll('#bStyleGroup .dir-btn').forEach(btn => {
    btn.classList.toggle('sel', btn.dataset.style === (state.borderStyle || 'solid'));
  });
}

function initBorderControls(){
  holdStep($('#bwMinus'), () => setBorderWidth((state.borderWidth ?? 6) - 1));
  holdStep($('#bwPlus'), () => setBorderWidth((state.borderWidth ?? 6) + 1));

  const bwIn = $('#bwInput');
  if(bwIn){
    bwIn.addEventListener('input', e => {
      state.borderWidth = Math.max(0, Math.min(14, +e.target.value));
      if($('#bwVal')) $('#bwVal').textContent = state.borderWidth + ' px';
      updateBwPresets();
      schedule();
    });
  }

  document.querySelectorAll('#bwPresets .range-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const bw = parseInt(chip.dataset.bw, 10);
      if(isNaN(bw)) return;
      setBorderWidth(bw);
    });
  });

  document.querySelectorAll('#bStyleGroup .dir-btn').forEach(btn => {
    btn.addEventListener('click', () => setBorderStyle(btn.dataset.style));
  });
}

function applyContainerPreset(name, size){
  Object.assign(state, {
    size: size,
    gap: 0,
    shape: 'rect',
    radius: 'rounded',
    orientation: 'horizontal',
    flow: 'column',
    align: 'left',
    fillColumn: false,
    fillMode: 'restart',
    borderWidth: 6,
    borderStyle: 'solid',
    font: 'Bungee',
    fontScale: 180,
    fontVariation: 'uniform',
    dot: true,
    outline: true,
    alt: false,
    guides: true,
    theme: 'black'
  });
  syncAllInputs();
  buildShapeTiles();
  buildSwatches();
  buildFonts();
  render();
  toast(`${name} preset applied 🧪 ${size} mm · 0 gap · Down columns · Bungee 180% · 6px solid · outline · dot`);
}

$('#preset1mlAmpoule')?.addEventListener('click', () => applyContainerPreset('1 ml Ampoule', 6));
$('#preset1mlVial')?.addEventListener('click', () => applyContainerPreset('1 ml Vial', 10));
$('#preset10mlAmpoule')?.addEventListener('click', () => applyContainerPreset('10 ml Ampoule', 10));
$('#preset10mlVial')?.addEventListener('click', () => applyContainerPreset('10 ml Vial', 10));
$('#ampoulePreset')?.addEventListener('click', () => applyContainerPreset('1 ml Ampoule', 6));

const triggerPrint = () => {
  clearTimeout(debounce);
  commitRange(false);
  toast('Opening print dialog — pick “Save as PDF” 🖨');
  setTimeout(() => window.print(), 350);
};

$('#printBtn').onclick = triggerPrint;
$('#pngBtn').onclick = () => downloadPNGs();

$('#resetBtn').onclick=()=>{
  Object.assign(state, DEFAULTS);
  try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  setZoom('fit'); setMobileView('controls');
  syncAllInputs();
  buildShapeTiles(); buildSwatches(); buildFonts(); render();
  toast('Back to defaults ✨ 14 mm size · 0 mm gap · down columns');
};

document.getElementById('starDeco').setAttribute('d',starD());
document.getElementById('starDeco').setAttribute('fill','#FFC531');
document.getElementById('starDeco').setAttribute('stroke','#fff');
document.getElementById('starDeco').setAttribute('stroke-width','6');
document.getElementById('starDeco').setAttribute('stroke-linejoin','round');
document.getElementById('logoStar').setAttribute('d',starD(50,31));

loadState();
syncAllInputs();
initSizeControls();
initRadiusControls();
initBorderControls();
initFontSizeControls();
initMobileAndRangeControls();
initGapControls();
initDirectionControls();
initMultControls();
initFillModeControls();
initAlignmentControls();
buildShapeTiles(); buildSwatches(); buildFonts(); syncToggles(); syncFontSizeControls(); syncDirectionControls(); syncAlignmentControls(); syncRadiusControls(); syncBorderStyleControls(); syncFillModeControls(); updateSizePresets(); updateGapPresets(); updateMultPresets(); updateBwPresets(); render();
