/* ============================= STATE ============================= */
let itemSeq = 0;
const state = {
  template: 'modern',
  items: [],
  sigMode: 'draw',
  sigDataUrl: null
};

function newItem(){
  itemSeq++;
  return { id: itemSeq, name:'', desc:'', qty:1, rate:0, subitems:[] };
}
state.items.push(newItem());

/* ============================= TEMPLATES ============================= */
const templates = [
  {key:'modern', label:'Modern', color:'#8a5cf6', file:'modern.html'},
  {key:'classic', label:'Classic', color:'#5a1c1c', file:'classic.html'},
  {key:'minimal', label:'Minimal', color:'#1c1b19', file:'minimal.html'},
  {key:'bold', label:'Bold', color:'#ff6b35', file:'bold.html'}
];

const templateBar = document.getElementById('templateBar');
let loadedTemplates = {};

async function loadTemplate(key){
  if(loadedTemplates[key]) return loadedTemplates[key];
  const t = templates.find(x => x.key === key);
  if(!t) throw new Error('Template not found: ' + key);
  const response = await fetch(t.file);
  if(!response.ok) throw new Error('Could not load ' + t.file);
  const html = await response.text();
  loadedTemplates[key] = html;
  return html;
}

templates.forEach(t=>{
  const btn = document.createElement('button');
  btn.className = 'template-chip' + (t.key===state.template?' active':'');
  btn.innerHTML = `<span class="swatch" style="background:${t.color}"></span>${t.label}`;
  btn.onclick = async ()=>{
    state.template = t.key;
    document.querySelectorAll('.template-chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    await render();
  };
  templateBar.appendChild(btn);
});

/* ============================= MOBILE TOGGLE ============================= */
document.getElementById('viewToggle').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  document.querySelectorAll('#viewToggle button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const layout = document.getElementById('layout');
  layout.classList.remove('show-form','show-preview');
  layout.classList.add(btn.dataset.view==='form' ? 'show-form' : 'show-preview');
});

/* ============================= ITEMS UI ============================= */
const itemsList = document.getElementById('itemsList');
function renderItemsUI(){
  itemsList.innerHTML = '';
  state.items.forEach((item, idx)=>{
    const card = document.createElement('div');
    card.className = 'item-card';

    const subitemsHtml = (item.subitems || []).map((sub, sidx)=>`
      <div class="subitem-row">
        <input data-subfield="name" data-item-id="${item.id}" data-sub-id="${sub.id}"
               value="${escapeAttr(sub.name)}" placeholder="Sub-item name">
        <input data-subfield="desc" data-item-id="${item.id}" data-sub-id="${sub.id}"
               value="${escapeAttr(sub.desc)}" placeholder="Optional detail">
        <button type="button" data-remove-sub="${sub.id}" data-item-id="${item.id}">Remove</button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="item-card-head">
        <span>Item ${idx+1}</span>
        <button type="button" data-remove="${item.id}">Remove</button>
      </div>
      <div class="field"><label>Product / service</label>
        <input data-field="name" data-id="${item.id}" value="${escapeAttr(item.name)}" placeholder="e.g. Website Development">
      </div>
      <div class="field"><label>Description</label>
        <input data-field="desc" data-id="${item.id}" value="${escapeAttr(item.desc)}" placeholder="Optional short description">
      </div>

      <div class="subitems-wrap">
        ${subitemsHtml}
        <button class="add-subitem-btn" type="button" data-add-sub="${item.id}">+ Add Sub-item</button>
      </div>

      <div class="row3">
        <div class="field"><label>Qty</label>
          <input data-field="qty" data-id="${item.id}" type="number" min="0" step="1" value="${item.qty}">
        </div>
        <div class="field"><label>Rate (₹)</label>
          <input data-field="rate" data-id="${item.id}" type="number" min="0" step="0.01" value="${item.rate}">
        </div>
        <div class="field"><label>Amount</label>
          <input value="₹ ${(item.qty*item.rate).toFixed(2)}" disabled>
        </div>
      </div>
    `;
    itemsList.appendChild(card);
  });
}

itemsList.addEventListener('input', (e)=>{
  const f = e.target.dataset.field;
  const id = Number(e.target.dataset.id);

  if(f){
    const item = state.items.find(i=>i.id===id);
    if(!item) return;
    item[f] = (f==='qty'||f==='rate') ? Number(e.target.value||0) : e.target.value;
    const card = e.target.closest('.item-card');
    const amtInput = card.querySelector('.row3 .field:last-child input');
    amtInput.value = '₹ ' + (item.qty*item.rate).toFixed(2);
    render();
    return;
  }

  const sf = e.target.dataset.subfield;
  if(sf){
    const item = state.items.find(i=>i.id===Number(e.target.dataset.itemId));
    if(!item) return;
    const sub = (item.subitems || []).find(s=>s.id===Number(e.target.dataset.subId));
    if(!sub) return;
    sub[sf] = e.target.value;
    render();
  }
});

itemsList.addEventListener('click', (e)=>{
  const rid = e.target.dataset.remove;
  if(rid){
    state.items = state.items.filter(i=>i.id !== Number(rid));
    if(state.items.length===0) state.items.push(newItem());
    renderItemsUI();
    render();
    return;
  }

  const addSub = e.target.dataset.addSub;
  if(addSub){
    const item = state.items.find(i=>i.id===Number(addSub));
    if(!item) return;
    item.subitems = item.subitems || [];
    item.subitems.push({
      id: Date.now() + Math.floor(Math.random()*1000),
      name:'',
      desc:''
    });
    renderItemsUI();
    render();
    return;
  }

  const removeSub = e.target.dataset.removeSub;
  if(removeSub){
    const item = state.items.find(i=>i.id===Number(e.target.dataset.itemId));
    if(!item) return;
    item.subitems = (item.subitems || []).filter(s=>s.id !== Number(removeSub));
    renderItemsUI();
    render();
  }
});

document.getElementById('addItemBtn').onclick = ()=>{
  state.items.push(newItem());
  renderItemsUI();
  render();
};

renderItemsUI();

/* ============================= SIGNATURE ============================= */
const sigPad = document.getElementById('sigPad');
const sigCtx = sigPad.getContext('2d');
sigCtx.lineWidth = 3;
sigCtx.lineCap = 'round';
sigCtx.strokeStyle = '#1c1b19';
let drawing = false;
function getPos(e){
  const rect = sigPad.getBoundingClientRect();
  const scaleX = sigPad.width / rect.width;
  const scaleY = sigPad.height / rect.height;
  const t = e.touches ? e.touches[0] : e;
  return { x:(t.clientX-rect.left)*scaleX, y:(t.clientY-rect.top)*scaleY };
}
function start(e){ drawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x,p.y); e.preventDefault(); }
function move(e){ if(!drawing) return; const p = getPos(e); sigCtx.lineTo(p.x,p.y); sigCtx.stroke(); e.preventDefault(); }
function end(){ if(!drawing) return; drawing=false; state.sigDataUrl = sigPad.toDataURL('image/png'); render(); }
sigPad.addEventListener('mousedown', start);
sigPad.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);
sigPad.addEventListener('touchstart', start, {passive:false});
sigPad.addEventListener('touchmove', move, {passive:false});
sigPad.addEventListener('touchend', end);

document.getElementById('sigClear').onclick = ()=>{
  sigCtx.clearRect(0,0,sigPad.width,sigPad.height);
  state.sigDataUrl = null;
  document.getElementById('sigTypeInput').value = '';
  render();
};
document.querySelectorAll('.sig-tabs button').forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll('.sig-tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    state.sigMode = btn.dataset.sig;
    const isDraw = state.sigMode==='draw';
    sigPad.style.display = isDraw ? 'block':'none';
    document.getElementById('sigTypeInput').style.display = isDraw ? 'none':'block';
    render();
  };
});
document.getElementById('sigTypeInput').addEventListener('input', render);

/* ============================= NUMBER TO WORDS (Indian system) ============================= */
function numToWords(num){
  num = Math.round(num);
  if(num===0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function twoDigits(n){
    if(n<20) return ones[n];
    return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  }
  function threeDigits(n){
    if(n<100) return twoDigits(n);
    return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + twoDigits(n%100) : '');
  }
  let result = '';
  const crore = Math.floor(num/10000000); num%=10000000;
  const lakh = Math.floor(num/100000); num%=100000;
  const thousand = Math.floor(num/1000); num%=1000;
  const rest = num;
  if(crore) result += threeDigits(crore) + ' Crore ';
  if(lakh) result += threeDigits(lakh) + ' Lakh ';
  if(thousand) result += threeDigits(thousand) + ' Thousand ';
  if(rest) result += threeDigits(rest);
  return result.trim();
}
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttrInner(s){ return esc(s); }
function escapeAttr(s){ return (s||'').toString().replace(/"/g,'&quot;'); }
function fmt(n){ return '₹' + (Number(n)||0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function fmtDate(d){
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  if(isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric', weekday:'long'});
}
function fmtDateShort(d){
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  if(isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
}

/* ============================= RENDER ============================= */
function val(id){ return document.getElementById(id).value; }

async function render(){
  const preview = document.getElementById('invoicePreview');

  const biz = {
    name:val('bizName')||'Your Name',
    email:val('bizEmail'),
    phone:val('bizPhone'),
    address:val('bizAddress')
  };
  const cli = {
    name:val('cliName')||'Client Name',
    email:val('cliEmail'),
    phone:val('cliPhone'),
    address:val('cliAddress')
  };
  const meta = {
    title:val('invTitle')||'INVOICE',
    no:val('invNo'),
    date:val('invDate'),
    due:val('invDue')
  };

  const subtotal = state.items.reduce((s,i)=>s + (Number(i.qty)||0)*(Number(i.rate)||0), 0);
  const discType = val('discType');
  const discVal = Number(val('discVal'))||0;
  const discountAmt = discType==='percent' ? subtotal*discVal/100 : discVal;
  const couponAmt = Number(val('couponAmt'))||0;
  const couponCode = val('couponCode');
  const afterDiscount = Math.max(subtotal - discountAmt - couponAmt, 0);
  const gstPct = Number(val('gstPct'))||0;
  const cgstPct = Number(val('cgstPct'))||0;
  const sgstPct = Number(val('sgstPct'))||0;
  const gstAmt = afterDiscount*gstPct/100;
  const cgstAmt = afterDiscount*cgstPct/100;
  const sgstAmt = afterDiscount*sgstPct/100;
  const extraLabel = val('extraLabel') || 'Extra expense';
  const extraAmt = Number(val('extraAmt'))||0;
  const grandTotal = afterDiscount + gstAmt + cgstAmt + sgstAmt + extraAmt;

  const itemsRows = state.items.map((it,idx)=>`
    <tr>
      <td>${idx+1}</td>
      <td>
        <div class="item-name">${esc(it.name)||'—'}</div>
        ${it.desc ? `<div class="item-desc">${esc(it.desc)}</div>` : ''}
        ${(it.subitems && it.subitems.length) ? `<div class="inv-subitems">${
          it.subitems.filter(s=>s.name||s.desc).map(s=>`<div>${esc(s.name)}${s.desc ? ' — '+esc(s.desc) : ''}</div>`).join('')
        }</div>` : ''}
      </td>
      <td class="num">${Number(it.qty)||0}</td>
      <td class="num">${fmt(it.rate)}</td>
      <td class="num">${fmt((Number(it.qty)||0)*(Number(it.rate)||0))}</td>
    </tr>
  `).join('');

  let sigHtml = '';
  if(state.sigMode==='draw' && state.sigDataUrl){
    sigHtml = `<img src="${state.sigDataUrl}">`;
  } else if(state.sigMode==='type' && val('sigTypeInput')){
    sigHtml = `<div class="typed-sig">${esc(val('sigTypeInput'))}</div>`;
  }

  const data = {
    biz, cli, meta, subtotal, discountAmt, couponAmt, couponCode,
    gstPct, gstAmt, cgstPct, cgstAmt, sgstPct, sgstAmt,
    extraLabel, extraAmt, grandTotal, itemsRows, sigHtml,
    terms: val('terms'),
    bankName: val('bankName'),
    bankAcc: val('bankAcc'),
    bankIfsc: val('bankIfsc'),
    upiId: val('upiId'),
    thankYou: val('thankYou'),
    numToWords,
    fmt,
    fmtDate,
    fmtDateShort,
    esc
  };

  try {
    const templateHtml = await loadTemplate(state.template);
    preview.innerHTML = templateHtml;
    if(window.applyInvoiceTemplate){
      window.applyInvoiceTemplate(preview, data);
    }
  } catch(err) {
    preview.innerHTML = `<div style="padding:40px;font-family:Inter,sans-serif;color:#b3413e">
      <strong>Template could not be loaded.</strong><br><br>${esc(err.message)}
    </div>`;
  }
}

/* ============================= PHASE 1 PROFILES ============================= */
/*
  Replace the placeholder values below with the real saved details.
  "new" intentionally starts blank.
*/
const profiles = {
  purva: {
    label: 'Invoice by Purva',
    bizName: 'Purva',
    bizEmail: 'purvajadhavv@gmail.com',
    bizPhone: '7887393270',
    bizAddress: 'Nashik',
    bankName: 'Bank of Baroda',
    bankAcc: '97590100010822',
    bankIfsc: 'BARB0DBGNGA',
    upiId: 'purvajadhavv@ybl'
  },
  person2: {
    label: 'Invoice by Harsh',
    bizName: 'Harsh',
    bizEmail: 'harshdesale.nsk@gmail.com',
    bizPhone: '8888004769',
    bizAddress: 'Mumbai',
    bankName: 'ICICI Bank',
    bankAcc: '108801002126',
    bankIfsc: 'ICIC0001088',
    upiId: 'harshdesalee@ybl'
  },
  new: {
    label: 'New Invoice',
    bizName: '',
    bizEmail: '',
    bizPhone: '',
    bizAddress: '',
    bankName: '',
    bankAcc: '',
    bankIfsc: '',
    upiId: ''
  }
};

function setField(id, value){
  const el = document.getElementById(id);
  if(el) el.value = value || '';
}

function loadProfile(key){
  const p = profiles[key] || profiles.new;

  setField('bizName', p.bizName);
  setField('bizEmail', p.bizEmail);
  setField('bizPhone', p.bizPhone);
  setField('bizAddress', p.bizAddress);
  setField('bankName', p.bankName);
  setField('bankAcc', p.bankAcc);
  setField('bankIfsc', p.bankIfsc);
  setField('upiId', p.upiId);

  document.getElementById('currentProfileName').textContent = p.label;
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';

  render();
}

document.querySelectorAll('[data-profile]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    loadProfile(btn.dataset.profile);
  });
});

document.getElementById('changeProfileBtn').addEventListener('click', ()=>{
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('homeScreen').style.display = 'flex';
});

document.getElementById('formPanel').addEventListener('input', render);
document.getElementById('formPanel').addEventListener('change', render);
render();

/* ============================= PDF DOWNLOAD ============================= */
document.getElementById('downloadBtn').addEventListener('click', async ()=>{
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Preparing PDF…';
  try{
    const node = document.getElementById('invoicePreview');
    const canvas = await html2canvas(node, {scale:2, backgroundColor:'#ffffff', useCORS:true});
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    if(imgHeight <= pageHeight){
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // slice into multiple pages
      let renderedHeight = 0;
      const pageCanvasHeightPx = Math.floor(canvas.width * (pageHeight / imgWidth));
      while(renderedHeight < canvas.height){
        const sliceHeight = Math.min(pageCanvasHeightPx, canvas.height - renderedHeight);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceImgHeight = sliceHeight * imgWidth / canvas.width;
        if(renderedHeight > 0) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, sliceImgHeight);
        renderedHeight += sliceHeight;
      }
    }
    const fname = (val('invNo') ? 'invoice-'+val('invNo') : 'invoice') + '.pdf';
    pdf.save(fname.replace(/[^a-z0-9\-_.]/gi,'_'));
  } catch(err){
    alert('Could not generate PDF: ' + err.message + '\n\nThis usually means the page needs an internet connection the first time, to load the PDF library from the CDN.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});
