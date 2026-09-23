const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');if(toggle){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open)})}document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const assetBase=document.documentElement.dataset.base||'';
const pageLang=document.documentElement.lang||'tr';
const uiMessages={
  tr:{
    invalidFormat:'Lütfen PDF, JPEG veya PNG formatında bir logo dosyası seçin.',
    readError:'Logo okunamadı. Lütfen dosyanızı kontrol edip tekrar deneyin.',
    downloadError:'Önizleme indirilemedi. Lütfen tekrar deneyin.'
  },
  en:{
    invalidFormat:'Please select a logo file in PDF, JPEG or PNG format.',
    readError:'Could not read the logo. Please check your file and try again.',
    downloadError:'Could not download the preview. Please try again.'
  }
};
const ui=uiMessages[pageLang]||uiMessages.tr;

// Product size tabs
document.querySelectorAll('.product-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    document.querySelectorAll('.product-tab').forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.product-panel').forEach(panel => {
      const active = panel.id === `panel-${key}`;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  });
});

// Live PDF / JPEG / PNG logo -> printed cup preview
(async function initLogoMockup(){
  const pdfInput=document.getElementById('pdfInput');
  const chooseBtn=document.getElementById('pdfChooseBtn');
  const dropZone=document.getElementById('pdfDropZone');
  const canvas=document.getElementById('logoCanvas');
  const stage=document.getElementById('mockupStage');
  const cup=document.getElementById('cupMockup');
  const cupSizeLabel=document.getElementById('cupSizeLabel');
  const cupPhoto=document.getElementById('cupPhoto');
  const downloadBtn=document.getElementById('downloadMockup');
  const scale=document.getElementById('logoScale');
  const x=document.getElementById('logoX');
  const y=document.getElementById('logoY');
  const rotate=document.getElementById('logoRotate');
  const removeWhite=document.getElementById('removeWhite');
  if(!pdfInput||!canvas)return;

  let pdfjs=null;
  const state={scale:100,x:0,y:0,rotate:0,size:'4'};
  let sourceCanvas=null;
  let userLogo=false;
  const demoBadge=document.getElementById('demoBadge');
  const demoLogoSrc=assetBase+'images/Logo/logo.png';
  const sizeScale={4:0.759,7:1,8:1.139};
  const mockupBase={w:390,h:520};

  function updateDownloadButton(){
    if(downloadBtn) downloadBtn.disabled=!stage.classList.contains('has-logo');
  }

  function readPrintVars(){
    const cs=getComputedStyle(cup);
    return {
      left:parseFloat(cs.getPropertyValue('--print-left'))/100,
      width:parseFloat(cs.getPropertyValue('--print-width'))/100,
      top:parseFloat(cs.getPropertyValue('--print-top'))/100,
      height:parseFloat(cs.getPropertyValue('--print-height'))/100
    };
  }

  function clipPrintArea(ctx,pl,pt,pw,ph){
    ctx.beginPath();
    ctx.moveTo(pl+pw*0.005,pt);
    ctx.lineTo(pl+pw*0.995,pt);
    ctx.lineTo(pl+pw*0.90,pt+ph);
    ctx.lineTo(pl+pw*0.10,pt+ph);
    ctx.closePath();
  }

  function fitLogoBox(boxW,boxH){
    const fit=Math.min(boxW/canvas.width,boxH/canvas.height);
    return {w:canvas.width*fit,h:canvas.height*fit};
  }

  function drawLogoInPrintArea(ctx,pw,ph){
    const zoom=state.scale/100;
    const {w,h}=fitLogoBox(pw,ph);
    ctx.translate(state.x,state.y);
    ctx.scale(zoom,zoom);
    ctx.rotate(state.rotate*Math.PI/180);
    ctx.globalCompositeOperation='multiply';
    ctx.drawImage(canvas,-w/2,-h/2,w,h);
  }

  function downloadMockupPreview(){
    if(!stage.classList.contains('has-logo')||!sourceCanvas||!canvas.width){
      alert(ui.downloadError);
      return;
    }
    if(!cupPhoto.complete||!cupPhoto.naturalWidth){
      alert(ui.downloadError);
      return;
    }
    try{
      const print=readPrintVars();
      const currentScale=sizeScale[state.size]||1;
      const pixelRatio=2;
      const baseW=mockupBase.w;
      const baseH=mockupBase.h;
      const out=document.createElement('canvas');
      out.width=Math.round(baseW*currentScale*pixelRatio);
      out.height=Math.round(baseH*currentScale*pixelRatio);
      const ctx=out.getContext('2d');
      ctx.scale(pixelRatio*currentScale,pixelRatio*currentScale);
      ctx.drawImage(cupPhoto,0,0,baseW,baseH);
      const pl=baseW*print.left;
      const pt=baseH*print.top;
      const pw=baseW*print.width;
      const ph=baseH*print.height;
      ctx.save();
      clipPrintArea(ctx,pl,pt,pw,ph);
      ctx.clip();
      ctx.save();
      ctx.translate(pl+pw/2,pt+ph/2);
      drawLogoInPrintArea(ctx,pw,ph);
      ctx.restore();
      ctx.restore();
      const link=document.createElement('a');
      link.download=`tepecup-${state.size}oz-onizleme.png`;
      link.href=out.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }catch(err){
      console.error(err);
      alert(ui.downloadError);
    }
  }

  function showDemoBadge(show){
    if(demoBadge) demoBadge.hidden=!show;
    stage.classList.toggle('has-demo',show);
  }

  async function loadDemoLogo(){
    const img=new Image();
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=reject;
      img.src=demoLogoSrc;
    });
    const maxSide=900;
    const ratio=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    const temp=document.createElement('canvas');
    temp.width=Math.max(1,Math.round(img.naturalWidth*ratio));
    temp.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const ctx=temp.getContext('2d');
    ctx.drawImage(img,0,0,temp.width,temp.height);
    sourceCanvas=temp;
    userLogo=false;
    state.scale=88;
    scale.value=88;
    drawSource();
    stage.classList.add('has-logo');
    showDemoBadge(true);
    updateDownloadButton();
  }

  function updateLabels(){
    document.getElementById('logoScaleValue').textContent=state.scale+'%';
    document.getElementById('logoXValue').textContent=state.x;
    document.getElementById('logoYValue').textContent=state.y;
    document.getElementById('logoRotateValue').textContent=state.rotate+'°';
    const zoom=state.scale/100;
    canvas.style.transform=`translate(${state.x}px,${state.y}px) scale(${zoom}) rotate(${state.rotate}deg)`;
  }

  function applySize(size){
    state.size=size;
    cup.classList.remove('size-4','size-7','size-8');
    cup.classList.add('size-'+size);
    cupSizeLabel.textContent=size+' OZ';
    document.querySelectorAll('.size-choice-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.cupSize===size));
  }

  function makeTransparent(inputCanvas){
    const out=document.createElement('canvas');
    out.width=inputCanvas.width; out.height=inputCanvas.height;
    const ctx=out.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(inputCanvas,0,0);
    if(!removeWhite.checked)return out;
    const img=ctx.getImageData(0,0,out.width,out.height);
    const d=img.data;
    for(let i=0;i<d.length;i+=4){
      const r=d[i],g=d[i+1],b=d[i+2];
      if(r>245&&g>245&&b>245){d[i+3]=0;}
      else if(r>225&&g>225&&b>225){
        const min=Math.min(r,g,b);
        d[i+3]=Math.max(0,Math.round((245-min)*5));
      }
    }
    ctx.putImageData(img,0,0);
    return trimTransparent(out);
  }

  function trimTransparent(inputCanvas){
    const ctx=inputCanvas.getContext('2d',{willReadFrequently:true});
    const img=ctx.getImageData(0,0,inputCanvas.width,inputCanvas.height);
    const d=img.data; let minX=inputCanvas.width,minY=inputCanvas.height,maxX=-1,maxY=-1;
    for(let yy=0;yy<inputCanvas.height;yy++){
      for(let xx=0;xx<inputCanvas.width;xx++){
        if(d[(yy*inputCanvas.width+xx)*4+3]>12){
          if(xx<minX)minX=xx; if(xx>maxX)maxX=xx; if(yy<minY)minY=yy; if(yy>maxY)maxY=yy;
        }
      }
    }
    if(maxX<0)return inputCanvas;
    const pad=Math.max(8,Math.round(Math.min(inputCanvas.width,inputCanvas.height)*0.02));
    minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad); maxX=Math.min(inputCanvas.width-1,maxX+pad); maxY=Math.min(inputCanvas.height-1,maxY+pad);
    const out=document.createElement('canvas');
    out.width=maxX-minX+1; out.height=maxY-minY+1;
    out.getContext('2d').drawImage(inputCanvas,minX,minY,out.width,out.height,0,0,out.width,out.height);
    return out;
  }

  function drawSource(){
    if(!sourceCanvas)return;
    const clean=makeTransparent(sourceCanvas);
    const max=1400;
    const ratio=Math.min(1,max/Math.max(clean.width,clean.height));
    canvas.width=Math.max(1,Math.round(clean.width*ratio));
    canvas.height=Math.max(1,Math.round(clean.height*ratio));
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(clean,0,0,canvas.width,canvas.height);
    updateLabels();
  }

  async function renderPdf(file){
    if(!file||file.type!=='application/pdf')throw new Error('PDF değil');
    if(!pdfjs){
      pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    }
    const bytes=new Uint8Array(await file.arrayBuffer());
    const pdf=await pdfjs.getDocument({data:bytes}).promise;
    const page=await pdf.getPage(1);
    const viewport=page.getViewport({scale:2.2});
    const temp=document.createElement('canvas');
    temp.width=Math.ceil(viewport.width); temp.height=Math.ceil(viewport.height);
    const ctx=temp.getContext('2d');
    await page.render({canvasContext:ctx,viewport,background:'white'}).promise;
    sourceCanvas=temp;
    drawSource();
  }

  async function renderImage(file){
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;
        img.onerror=reject;
        img.src=url;
      });
      const maxSide=1800;
      const ratio=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const temp=document.createElement('canvas');
      temp.width=Math.max(1,Math.round(img.naturalWidth*ratio));
      temp.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      const ctx=temp.getContext('2d');
      ctx.drawImage(img,0,0,temp.width,temp.height);
      sourceCanvas=temp;
      drawSource();
    }finally{
      URL.revokeObjectURL(url);
    }
  }

  function isRasterLogo(file){
    const type=(file.type||'').toLowerCase();
    const name=(file.name||'').toLowerCase();
    return type==='image/jpeg'||type==='image/png'||type==='image/jpg'
      ||name.endsWith('.jpg')||name.endsWith('.jpeg')||name.endsWith('.png');
  }

  async function handleFile(file){
    if(!file)return;
    const type=file.type.toLowerCase();
    const name=file.name.toLowerCase();
    try{
      if(type==='application/pdf'||name.endsWith('.pdf')){
        await renderPdf(file);
      }else if(isRasterLogo(file)){
        await renderImage(file);
      }else{
        alert(ui.invalidFormat);
        return;
      }
      stage.classList.add('has-logo');
      userLogo=true;
      showDemoBadge(false);
      updateDownloadButton();
    }catch(err){
      console.error(err);
      alert(ui.readError);
    }
  }

  chooseBtn.addEventListener('click',()=>pdfInput.click());
  pdfInput.addEventListener('change',e=>handleFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('dragging')}));
  ['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('dragging')}));
  dropZone.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0]));
  document.querySelectorAll('.size-choice-btn').forEach(btn=>btn.addEventListener('click',()=>applySize(btn.dataset.cupSize)));
  scale.addEventListener('input',()=>{state.scale=+scale.value;updateLabels()});
  x.addEventListener('input',()=>{state.x=+x.value;updateLabels()});
  y.addEventListener('input',()=>{state.y=+y.value;updateLabels()});
  rotate.addEventListener('input',()=>{state.rotate=+rotate.value;updateLabels()});
  removeWhite.addEventListener('change',drawSource);
  if(downloadBtn) downloadBtn.addEventListener('click',downloadMockupPreview);
  document.getElementById('resetMockup').addEventListener('click',async()=>{
    state.scale=100;state.x=0;state.y=0;state.rotate=0;
    scale.value=100;x.value=0;y.value=0;rotate.value=0;
    applySize('4');
    if(userLogo && sourceCanvas){
      state.scale=100;
      scale.value=100;
      updateLabels();
      drawSource();
      updateDownloadButton();
      return;
    }
    await loadDemoLogo();
  });
  applySize('4');
  try{
    await loadDemoLogo();
  }catch(err){
    console.error(err);
    updateLabels();
    updateDownloadButton();
  }
})();

(function initReferencesPage(){
  const grid=document.querySelector('.reference-grid-page');
  if(!grid) return;

  const filters=document.querySelectorAll('.reference-filter');
  const cards=grid.querySelectorAll('.reference-card');
  const emptyEl=document.getElementById('referenceEmpty');
  const modal=document.getElementById('referenceModal');
  const modalImg=document.getElementById('referenceModalImg');
  const modalNum=document.getElementById('referenceModalNum');
  const modalTitle=document.getElementById('referenceModalTitle');
  const modalTag=document.getElementById('referenceModalTag');
  const modalSize=document.getElementById('referenceModalSize');
  const modalPrint=document.getElementById('referenceModalPrint');
  const modalSector=document.getElementById('referenceModalSector');
  const modalDesc=document.getElementById('referenceModalDesc');
  const modalQuote=document.getElementById('referenceModalQuote');
  let lastFocus=null;

  function applyFilter(sector){
    let visible=0;
    cards.forEach(card=>{
      const match=sector==='all'||card.dataset.sector===sector;
      card.classList.toggle('is-hidden',!match);
      if(match) visible+=1;
    });
    if(emptyEl) emptyEl.hidden=visible>0;
  }

  filters.forEach(btn=>{
    btn.addEventListener('click',()=>{
      filters.forEach(b=>b.classList.toggle('active',b===btn));
      applyFilter(btn.dataset.sector||'all');
    });
  });

  function openModal(card){
    if(!modal) return;
    lastFocus=document.activeElement;
    modalImg.src=card.dataset.image||'';
    modalImg.alt=card.dataset.name||'';
    modalNum.textContent=card.dataset.number||'';
    modalTitle.textContent=card.dataset.name||'';
    modalTag.textContent=card.dataset.tag||'';
    modalSize.textContent=card.dataset.size||'';
    modalPrint.textContent=card.dataset.print||'';
    modalSector.textContent=card.dataset.sectorLabel||'';
    modalDesc.textContent=card.dataset.desc||'';
    modalQuote.href=card.dataset.quoteHref||'#';
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    modal.querySelector('.reference-modal-close')?.focus();
  }

  function closeModal(){
    if(!modal||modal.hidden) return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(lastFocus&&lastFocus.focus) lastFocus.focus();
  }

  grid.querySelectorAll('.reference-card-clickable').forEach(card=>{
    card.addEventListener('click',()=>openModal(card));
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        openModal(card);
      }
    });
  });

  modal?.querySelectorAll('[data-ref-close]').forEach(el=>{
    el.addEventListener('click',closeModal);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') closeModal();
  });
})();
