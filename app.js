const DATA=window.SKO_DATA;
const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
const fmt0=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
const state={year:2024,district:'petropavl',operational:[]};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safe=v=>String(v??'').trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const valueOrDash=(v,suffix='')=>v==null?'нет данных':`${fmt.format(v)}${suffix}`;
const growth=(a,b)=>a==null||b==null||b===0?null:(a/b-1)*100;
const pearson=pairs=>{const r=pairs.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b));if(r.length<3)return null;const ax=r.reduce((s,x)=>s+x[0],0)/r.length,ay=r.reduce((s,x)=>s+x[1],0)/r.length;const n=r.reduce((s,x)=>s+(x[0]-ax)*(x[1]-ay),0),d=Math.sqrt(r.reduce((s,x)=>s+(x[0]-ax)**2,0)*r.reduce((s,x)=>s+(x[1]-ay)**2,0));return d?n/d:null};

function renderKpis(){
  const i=DATA.region.findIndex(r=>r.year===state.year),row=DATA.region[i],prev=DATA.region[i-1];
  const cards=[
    ['investment','Инвестиции в основной капитал','млрд ₸',1000,row.investmentIndex?`ИФО ${fmt.format(row.investmentIndex)}%`:null],
    ['industry','Промышленный выпуск','млрд ₸',1000,row.industryIndex?`ИФО ${fmt.format(row.industryIndex)}%`:null],
    ['grp','ВРП','млрд ₸',1000,row.grpIndex?`ИФО ${fmt.format(row.grpIndex)}%`:null],
    ['industryEmployment','Занятые в промышленности','тыс. чел.',1,null],
    ['industrySalary','Зарплата в промышленности','тыс. ₸',1000,null]
  ];
  $('#kpiGrid').innerHTML=cards.map(([key,label,unit,scale,note])=>{const v=row[key],ch=growth(v,prev?.[key]),cls=ch==null?'neutral':ch>=0?'positive':'negative';return `<article class="kpi"><div class="kpi-label">${label}</div><strong class="kpi-value">${v==null?'—':fmt.format(v/scale)}</strong><div class="kpi-change ${cls}">${ch==null?'Сопоставление недоступно':`${ch>=0?'+':''}${fmt.format(ch)}% к ${prev.year}`}</div><div class="panel-sub">${unit}${note?` · ${note}`:''}</div></article>`}).join('');
  $('#yearStatus').textContent=row.preliminary?'предварительные данные':'полный год';
}

function lineChart(el,rows,series){
  const W=760,H=330,p={l:54,r:20,t:22,b:42},vals=rows.flatMap(r=>series.map(s=>r[s.key])).filter(Number.isFinite),min=Math.min(...vals),max=Math.max(...vals),pad=(max-min)*.08||1,y0=min-pad,y1=max+pad;
  const x=i=>p.l+i*(W-p.l-p.r)/(rows.length-1),y=v=>p.t+(y1-v)*(H-p.t-p.b)/(y1-y0);
  const grid=[0,.25,.5,.75,1].map(t=>{const yy=p.t+t*(H-p.t-p.b),val=y1-t*(y1-y0);return `<line class="gridline" x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/><text class="chart-label" x="${p.l-8}" y="${yy+4}" text-anchor="end">${fmt0.format(val/1000)}</text>`}).join('');
  const paths=series.map(s=>{const pts=rows.map((r,i)=>Number.isFinite(r[s.key])?`${x(i)},${y(r[s.key])}`:null).filter(Boolean).join(' ');return `<polyline fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`+rows.map((r,i)=>Number.isFinite(r[s.key])?`<circle class="chart-point" data-label="${r.year}: ${fmt.format(r[s.key]/1000)} млрд ₸" cx="${x(i)}" cy="${y(r[s.key])}" r="4" fill="${s.color}"/>`:'').join('')}).join('');
  const labels=rows.map((r,i)=>i%2===0||i===rows.length-1?`<text class="chart-label" x="${x(i)}" y="${H-14}" text-anchor="middle">${r.year}</text>`:'').join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Динамика показателей по годам">${grid}<line class="axis" x1="${p.l}" y1="${H-p.b}" x2="${W-p.r}" y2="${H-p.b}"/>${paths}${labels}<text class="chart-label" x="10" y="16">млрд ₸</text></svg><div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>`;bindTooltips(el)
}

function scatterChart(el,rows,xKey,yKey){
  const valid=rows.filter(r=>Number.isFinite(r[xKey])&&Number.isFinite(r[yKey])),W=620,H=330,p={l:62,r:22,t:22,b:48},xs=valid.map(r=>r[xKey]),ys=valid.map(r=>r[yKey]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const x=v=>p.l+(v-xmin)*(W-p.l-p.r)/(xmax-xmin||1),y=v=>p.t+(ymax-v)*(H-p.t-p.b)/(ymax-ymin||1);
  const grid=[0,.25,.5,.75,1].map(t=>{const xx=p.l+t*(W-p.l-p.r),yy=p.t+t*(H-p.t-p.b);return `<line class="gridline" x1="${xx}" y1="${p.t}" x2="${xx}" y2="${H-p.b}"/><line class="gridline" x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/>`}).join('');
  const dots=valid.map(r=>`<g><circle class="chart-point" data-label="${r.year}: инвестиции ${fmt.format(r[xKey]/1000)}; выпуск ${fmt.format(r[yKey]/1000)} млрд ₸" cx="${x(r[xKey])}" cy="${y(r[yKey])}" r="6" fill="${r.year===2024?'#c9912b':'#0f766e'}" opacity=".82"/><text class="chart-label" x="${x(r[xKey])+7}" y="${y(r[yKey])-7}">${r.year}</text></g>`).join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Диаграмма взаимосвязи инвестиций и промышленного выпуска">${grid}<line class="axis" x1="${p.l}" y1="${H-p.b}" x2="${W-p.r}" y2="${H-p.b}"/><line class="axis" x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}"/>${dots}<text class="chart-label" x="${W/2}" y="${H-10}" text-anchor="middle">Инвестиции в основной капитал, млн ₸</text><text class="chart-label" transform="translate(15 ${H/2}) rotate(-90)" text-anchor="middle">Промышленный выпуск, млн ₸</text></svg>`;bindTooltips(el)
}

function bindTooltips(root){$$('.chart-point',root).forEach(p=>{p.addEventListener('mousemove',e=>{const t=$('#tooltip');t.textContent=p.dataset.label;t.style.left=`${e.clientX+12}px`;t.style.top=`${e.clientY+12}px`;t.classList.add('visible')});p.addEventListener('mouseleave',()=>$('#tooltip').classList.remove('visible'))})}

function renderCharts(){
  const complete=DATA.region.filter(r=>r.year<=2024);
  lineChart($('#trendChart'),DATA.region,[{key:'investment',label:'Инвестиции в основной капитал',color:'#0f766e'},{key:'industry',label:'Промышленный выпуск',color:'#2f6ea3'}]);scatterChart($('#scatterChart'),complete,'investment','industry');
  const r=pearson(complete.map(x=>[x.investment,x.industry]));$('#correlationValue').textContent=r==null?'—':r.toFixed(2).replace('.',',');$('#correlationText').textContent='Высокая положительная связь уровней показателей. Оба ряда номинальные и имеют общий временной тренд, поэтому коэффициент не доказывает причинность.'
}

function renderInsights(){
  const a=DATA.region.find(r=>r.year===2010),b=DATA.region.find(r=>r.year===2024);
  const items=[
    [`${fmt.format(b.industry/a.industry)}×`,`Промышленный выпуск вырос с ${fmt.format(a.industry/1000)} до ${fmt.format(b.industry/1000)} млрд тенге.`],
    [`${fmt.format(b.investment/a.investment)}×`,`Инвестиции в основной капитал росли быстрее выпуска, но динамика была неравномерной.`],
    [`${fmt.format(b.industryGva/b.grp*100)}%`,`Доля промышленной ВДС в ВРП в 2024 году против ${fmt.format(a.industryGva/a.grp*100)}% в 2010 году.`],
    [`${fmt.format((b.population/a.population-1)*100)}%`,`Изменение численности населения при росте выпуска указывает на кадровое ограничение.`],
    [`68,5%`,`Доля Петропавловска в выпуске обрабатывающей промышленности области в 2024 году.`]
  ];
  $('#insightList').innerHTML=items.map((x,i)=>`<div class="insight"><div class="insight-num">${i+1}</div><div><strong>${x[0]}</strong><p>${x[1]}</p></div></div>`).join('')
}

function renderDistricts(){
  $('#districtGrid').innerHTML=DATA.districts.map(d=>`<button class="district-button ${state.district===d.id?'active':''}" data-id="${d.id}" data-known="${d.processing2024!=null}"><strong>${d.name}</strong><span>${d.processing2024==null?'отдельные данные не загружены':`${fmt.format(d.processingShare2024)}% выпуска обработки`}</span></button>`).join('');
  $$('.district-button').forEach(b=>b.addEventListener('click',()=>{state.district=b.dataset.id;renderDistricts()}));
  const d=DATA.districts.find(x=>x.id===state.district);$('#districtTitle').textContent=d.name;$('#districtType').textContent=d.type==='город'?'областной центр':'территориальный профиль';$('#districtOutput').textContent=d.processing2024==null?'нет данных':`${fmt.format(d.processing2024)} млрд ₸`;$('#districtShare').textContent=d.processingShare2024==null?'нет данных':`${fmt.format(d.processingShare2024)}%`;$('#districtDataNote').textContent=d.processing2024==null?'В исходных материалах нет отдельного итогового значения для этой территории. Загрузите рабочий CSV, чтобы добавить инвестиционные и процессные показатели.':'Значение приведено по материалам магистерского проекта на основе данных Бюро национальной статистики за 2024 год.'
}

const csvColumns=['district','population','priority_sites','ready_sites','qualified_contacts','meetings','project_passports','decisions','projects_launched','planned_private_investment_mln','actual_private_investment_mln','manufacturing_investment_mln','median_response_days','projects_on_time','jobs_created','issues_total','issues_resolved','local_suppliers'];
function downloadTemplate(){const lines=[csvColumns.join(';'),...DATA.districts.map(d=>[d.name,...Array(csvColumns.length-1).fill('')].join(';'))],blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='шаблон_районной_инвестиционной_воронки.csv';a.click();URL.revokeObjectURL(a.href)}
function parseCsv(text){const lines=text.replace(/^\ufeff/,'').split(/\r?\n/).filter(Boolean),delim=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',',headers=lines[0].split(delim).map(x=>x.trim());if(!csvColumns.every(c=>headers.includes(c)))throw new Error('Структура файла не соответствует шаблону.');return lines.slice(1).map(line=>{const vals=line.split(delim),r={};headers.forEach((h,i)=>r[h]=(vals[i]||'').trim());csvColumns.slice(1).forEach(k=>r[k]=safe(String(r[k]).replace(',','.')));return r}).filter(r=>r.district)}
function renderOperational(){
  const body=$('#scoreBody');if(!state.operational.length){body.innerHTML='<tr class="empty-row"><td colspan="8">Загрузите заполненный CSV. До загрузки сайт не присваивает районам вымышленные оценки.</td></tr>';$('#importStatus').textContent='Данные не загружены';return}
  body.innerHTML=state.operational.map(r=>{const readiness=r.priority_sites?100*r.ready_sites/r.priority_sites:null,conversion=r.qualified_contacts?100*r.projects_launched/r.qualified_contacts:null,plan=r.planned_private_investment_mln?100*r.actual_private_investment_mln/r.planned_private_investment_mln:null,resolution=r.issues_total?100*r.issues_resolved/r.issues_total:null,perCapita=r.population&&r.actual_private_investment_mln!=null?1000*r.actual_private_investment_mln/r.population:null;return `<tr><td>${escapeHtml(r.district)}</td><td>${valueOrDash(readiness,'%')}</td><td>${valueOrDash(r.median_response_days,' дн.')}</td><td>${valueOrDash(conversion,'%')}</td><td>${valueOrDash(plan,'%')}</td><td>${valueOrDash(perCapita,' тыс. ₸/чел.')}</td><td>${valueOrDash(resolution,'%')}</td><td>${valueOrDash(r.jobs_created)}</td></tr>`}).join('');$('#importStatus').textContent=`Загружено территорий: ${state.operational.length}`
}

function setup(){
  const year=$('#yearSelect');year.innerHTML=DATA.region.map(r=>`<option value="${r.year}" ${r.year===state.year?'selected':''}>${r.year}${r.preliminary?'*':''}</option>`).join('');year.addEventListener('change',e=>{state.year=Number(e.target.value);renderKpis()});
  $('#presentationToggle').addEventListener('click',()=>{document.body.classList.toggle('presentation-mode');$('#presentationToggle').textContent=document.body.classList.contains('presentation-mode')?'Полный режим':'Режим защиты'});
  $('#templateDownload').addEventListener('click',downloadTemplate);$('#uploadButton').addEventListener('click',()=>$('#csvInput').click());$('#csvInput').addEventListener('change',async e=>{try{state.operational=parseCsv(await e.target.files[0].text());renderOperational()}catch(err){$('#importStatus').textContent=err.message}});
  renderKpis();renderCharts();renderInsights();renderDistricts();renderOperational();$('#updated').textContent=DATA.meta.updated
}
document.addEventListener('DOMContentLoaded',setup);
