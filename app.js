const $ = id => document.getElementById(id);
let refreshCount = 0;

const perfumes = [
  {name:'Carthusia Essence of the Park', temp:'mild', vibe:'weich-luftig, ruhig, warm genug'},
  {name:'Carthusia Uomo EDP', temp:'mild', vibe:'klar, gepflegt, smart casual'},
  {name:'Roberto Ugolini Blue Suede Shoes', temp:'mild', vibe:'sauber, präsent, bürotauglich'},
  {name:'L’Erbolario Ginepro Nero', temp:'cool', vibe:'ruhig würzig, guter Drydown'},
  {name:'Diptyque Eau Duelle', temp:'cool', vibe:'trocken-cremig, warm, weich'},
  {name:'Carthusia Terra Mia', temp:'cool', vibe:'warm, rund, beruhigend'},
  {name:'Hermès Terre d’Hermès Eau Givrée', temp:'warm', vibe:'klar und frisch, eher warme Tage'},
  {name:'Jo Malone Orange Bitters', temp:'cool', vibe:'zitrisch-warm, ruhig festlich'},
  {name:'Chanel Bleu de Chanel EDP', temp:'mild', vibe:'sicher, sauber, etwas formeller'}
];

function getWeekNumber(d=new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}
$('week').value = getWeekNumber();

function hash(str){let h=2166136261; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i); h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return h>>>0;}
function rng(seed){let s=seed>>>0; return()=>{s=(s*1664525+1013904223)>>>0; return s/4294967296;};}
function pick(list, rand, avoid=[]){ const pool=list.filter(x=>x && !avoid.includes(x.name)); if(!pool.length) return null; return pool[Math.floor(rand()*pool.length)]; }
function active(){ return (window.WARDROBE||[]).filter(x=>x.active!==false); }
function byCat(cat){ return active().filter(x=>x.category===cat); }
function tempFromWeather(txt){ const m=(txt||'').match(/-?\d+/); if(!m) return 20; return parseInt(m[0],10); }
function hasRain(txt){ return /regen|schauer|nass|gewit/i.test(txt||''); }
function weatherMode(temp){ if(temp<=8) return 'cold'; if(temp<=16) return 'cool'; if(temp<=22) return 'mild'; return 'warm'; }
function warmthAllowed(item,temp){
  if(!item) return false;
  if(temp<=10) return ['warm','mittel','-'].includes(item.warmth);
  if(temp<=18) return ['warm','mittel','leicht','-'].includes(item.warmth);
  if(temp<=23) return ['mittel','leicht','-'].includes(item.warmth) || item.category==='Schuhe';
  return ['leicht','-'].includes(item.warmth) || item.category==='Schuhe';
}
function findWish(text){ if(!text.trim()) return null; const q=text.trim().toLowerCase(); return active().find(x=>x.name.toLowerCase().includes(q) || x.color.toLowerCase().includes(q)); }
function filter(cat,temp){ return byCat(cat).filter(x=>warmthAllowed(x,temp)); }
function colorStory(items){
  const colors = items.filter(Boolean).map(x=>x.color).join(', ');
  if(/ice|hellblau|graublau|navy|dunkelblau|grau|schwarz|weiß|petrol/i.test(colors)) return 'kühle, ruhige Farbbasis – passend zu kaltem Hauttyp und Glatze.';
  if(/olive|grün|wald|caramel|braun|beige|natur/i.test(colors)) return 'erdiger Akzent auf ruhiger Basis; durch kühle T-Shirt-Farbe ausgeglichen.';
  if(/pink|beere|bordeaux/i.test(colors)) return 'gedämpfter Farbakzent, nicht laut; am besten mit Navy/Grau/Schwarz beruhigt.';
  return 'reduzierte Farbstory mit ruhiger Basis und kleinem Akzent.';
}
function socksFor(outfit){
  const names = Object.values(outfit).filter(Boolean).map(x=>`${x.name} ${x.color}`).join(' ').toLowerCase();
  if(names.includes('navy') || names.includes('dunkelblau')) return 'dunkelblaue Socken';
  if(names.includes('schwarz')) return 'schwarze Socken';
  if(names.includes('beige') || names.includes('natur') || names.includes('caramel')) return 'hellgraue oder dunkelblaue Socken';
  if(names.includes('olive') || names.includes('grün')) return 'dunkelblaue oder anthrazitfarbene Socken';
  return 'mittelgraue Socken';
}
function perfumeFor(temp, seed){
  const mode = weatherMode(temp);
  const pool = perfumes.filter(p => p.temp===mode || (mode==='mild' && p.temp!=='warm') || (mode==='cool' && p.temp!=='warm'));
  return pool[seed % pool.length] || perfumes[0];
}
function buildOutfit(i, rand, temp, rain, wish, used){
  const pants = wish?.category==='Hose' ? wish : pick(filter('Hose',temp),rand,used);
  let tshirt = wish?.category==='Tshirt' ? wish : pick(filter('Tshirt',temp),rand,used);
  let top = null, layer = null;
  const mode = weatherMode(temp);
  const wishCat = wish?.category;

  if(['Hemd','Pullover','Longsleeve','Overshirt','Blazer','Cardigan','Weste','Jacke'].includes(wishCat)) {
    if(['Hemd','Pullover','Longsleeve'].includes(wishCat)) top = wish;
    else layer = wish;
  }

  if(!top){
    const topCats = mode==='warm' ? ['Tshirt','Hemd'] : mode==='mild' ? ['Tshirt','Longsleeve','Hemd'] : ['Longsleeve','Pullover','Hemd'];
    const cat = topCats[(i + Math.floor(rand()*topCats.length)) % topCats.length];
    top = cat==='Tshirt' ? tshirt : pick(filter(cat,temp),rand,used);
  }
  if(top?.category==='Tshirt') tshirt = top;
  if(!tshirt) tshirt = pick(filter('Tshirt',temp),rand,used);

  if(!layer){
    const layerCats = temp>=23 ? ['Overshirt'] : temp>=18 ? ['Overshirt','Jacke'] : temp>=11 ? ['Overshirt','Cardigan','Blazer','Weste'] : ['Cardigan','Blazer','Weste','Jacke'];
    const cat = layerCats[(i + Math.floor(rand()*layerCats.length)) % layerCats.length];
    layer = pick(filter(cat,temp),rand,used);
  }
  if(rain){ layer = pick(byCat('Jacke').filter(x=>x.name.includes('Regenjacke')),rand) || layer; }
  if(layer?.name.includes('dunkelblaue Stoffsommerjacke') && temp < 18) layer = pick(filter('Overshirt',temp),rand,used) || layer;
  if(layer?.name.includes('blauer Strickkapuzenpullover') && temp > 12) layer = pick(filter('Pullover',temp).filter(x=>!x.name.includes('Strickkapuzen')),rand,used) || layer;

  const shoes = wish?.category==='Schuhe' ? wish : pick(byCat('Schuhe'),rand,used);
  const head = temp<=10 ? pick(byCat('Mütze'),rand) : pick(byCat('Kappe'),rand);
  const scarf = temp<=14 ? pick(byCat('Schal').filter(x=>warmthAllowed(x,temp)),rand) : null;
  const watch = pick(byCat('Uhr'),rand);
  const perfume = perfumeFor(temp, Math.floor(rand()*1000)+i);

  [pants,tshirt,top,layer,shoes].filter(Boolean).forEach(x=>used.push(x.name));
  return {pants,tshirt,top,layer,shoes,head,scarf,watch,perfume};
}
function renderCard(outfit, idx, temp){
  const title = ['Ruhige Basis','Etwas mehr Akzent','Bequeme Rotation'][idx] || `Option ${idx+1}`;
  const topText = outfit.top?.category==='Hemd' ? `${outfit.top.name} (${outfit.top.color}) – T-Shirt darunter: ${outfit.tshirt.name} (${outfit.tshirt.color})` : `${outfit.top?.name || outfit.tshirt.name} (${(outfit.top||outfit.tshirt).color})`;
  const acc = [outfit.watch?.name, outfit.head?.name, outfit.scarf?.name].filter(Boolean).join(' · ');
  return `<article class="card">
    <h2>Option ${idx+1}: ${title}</h2>
    <span class="badge">warm genug</span><span class="badge">minimal</span><span class="badge">KW-Rotation</span>
    <div class="line"><div class="label">Hose</div><div class="value">${outfit.pants.name} (${outfit.pants.color})</div></div>
    <div class="line"><div class="label">Oben</div><div class="value">${topText}</div></div>
    <div class="line"><div class="label">Layer</div><div class="value">${outfit.layer ? `${outfit.layer.name} (${outfit.layer.color})` : 'kein zusätzlicher Layer'}</div></div>
    <div class="line"><div class="label">Schuhe</div><div class="value">${outfit.shoes.name} (${outfit.shoes.color})</div></div>
    <div class="line"><div class="label">Socken</div><div class="value">${socksFor(outfit)}</div></div>
    <div class="line"><div class="label">Accessoires</div><div class="value">${acc || 'reduziert, ohne zusätzliches Accessoire'}</div></div>
    <div class="line"><div class="label">Parfum</div><div class="value">${outfit.perfume.name} – ${outfit.perfume.vibe}</div></div>
    <div class="why">${colorStory([outfit.pants,outfit.tshirt,outfit.top,outfit.layer,outfit.shoes])}</div>
  </article>`;
}
function generate(){
  const week = $('week').value || getWeekNumber();
  const weather = $('weather').value || '';
  const wishText = $('wish').value || '';
  const temp = tempFromWeather(weather);
  const rain = hasRain(weather);
  const wish = findWish(wishText);
  const seed = hash(`${week}|${weather}|${wishText}|${refreshCount}`);
  const rand = rng(seed);
  const used = [];
  const cards = [0,1,2].map(i=>buildOutfit(i,rand,temp,rain,wish,used));
  $('hint').innerHTML = `${weather ? `Erkannt: ca. <strong>${temp} °C</strong>${rain ? ', Regen berücksichtigt' : ''}.` : 'Keine Temperatur erkannt – die App rechnet neutral mit ca. 20 °C.'} ${wishText ? (wish ? `Wunschteil gefunden: <strong>${wish.name}</strong>.` : `Wunschteil nicht eindeutig gefunden – Vorschläge trotzdem erstellt.`) : 'Ohne Wunschteil erstellt.'}`;
  $('cards').innerHTML = cards.map((c,i)=>renderCard(c,i,temp)).join('');
}
$('generate').addEventListener('click',()=>{refreshCount=0;generate();});
$('refresh').addEventListener('click',()=>{refreshCount++;generate();});
generate();
