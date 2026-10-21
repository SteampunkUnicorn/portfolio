'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const products = ['Atlas', 'Beacon', 'Canvas', 'Orbit', 'Pulse'];
  const channels = ['Organic', 'Direct', 'Social', 'Email'];
  const regions = ['North', 'South', 'East', 'West'];
  const statuses = ['Healthy', 'Watch', 'At risk'];
  const names = ['Launch', 'Discover', 'Explore', 'Connect', 'Refresh', 'Grow'];
  const fmt = new Intl.NumberFormat('en-US');
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const expected = ['date', 'product', 'channel', 'region', 'sessions', 'conversions', 'revenue', 'status'];
  const generate = () => Array.from({length:120}, (_, i) => {
    const product = products[i % products.length];
    const channel = channels[Math.floor(i / 3) % channels.length];
    const region = regions[Math.floor(i / 7) % regions.length];
    const sessions = 280 + ((i * 137 + 67 * (i % 7)) % 4400);
    const conversions = Math.floor(sessions * (0.012 + ((i * 7) % 31) / 1000));
    return { id: `DP-${String(i+1).padStart(3,'0')}`, date: `2026-${String(i % 12 + 1).padStart(2,'0')}`, product, channel, region, campaign: `${names[i % names.length]} ${Math.floor(i / 12) + 1}`, sessions, conversions, revenue: Math.round(conversions * (35 + (i * 13) % 115)), status: statuses[(i + Math.floor(i / 8)) % 3] };
  });
  let source = generate();
  let filtered = [];
  let sorting = {key:'date', direction:'asc'};
  let page = 1;
  const controls = ['search','product','channel','region','status'];
  const form = Object.fromEntries(controls.map(id => [id, $(`#${id}`)]));
  const say = message => { $('#notice').textContent = message; };
  const clean = text => String(text).toLowerCase().trim();
  const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const display = (value, key) => key === 'revenue' ? usd.format(value) : fmt.format(value);
  function refillSelects() {
    ['product','channel','region','status'].forEach(key => {
      const value = form[key].value;
      const values = [...new Set(source.map(row=>row[key]))].sort();
      form[key].replaceChildren(new Option(`All ${key === 'status' ? 'statuses' : key === 'product' ? 'products' : key === 'region' ? 'regions' : 'channels'}`, 'all'), ...values.map(item=>new Option(item,item)));
      form[key].value = values.includes(value) ? value : 'all';
    });
  }
  function calculate() {
    const term = clean(form.search.value);
    filtered = source.filter(row => (!term || Object.values(row).some(value=>clean(value).includes(term))) && ['product','channel','region','status'].every(key => form[key].value === 'all' || row[key] === form[key].value));
    filtered.sort((a,b) => {
      const left=a[sorting.key],right=b[sorting.key];
      const result = typeof left === 'number' && typeof right === 'number' ? left-right : String(left).localeCompare(String(right));
      return result * (sorting.direction === 'asc' ? 1 : -1);
    });
  }
  function aggregate(rows, key) { return rows.reduce((sum,record)=>sum+record[key],0); }
  function updateMetrics() {
    const sessions=aggregate(filtered,'sessions'),conversions=aggregate(filtered,'conversions');
    $('#metric-records').textContent=fmt.format(filtered.length);
    $('#metric-records-detail').textContent=`${fmt.format(source.length)} total records`;
    $('#metric-sessions').textContent=fmt.format(sessions);
    $('#metric-conversion').textContent=sessions ? `${(conversions / sessions * 100).toFixed(2)}%` : '—';
    $('#metric-revenue').textContent=usd.format(aggregate(filtered,'revenue'));
  }
  function updateBars() {
    const measure=$('#measure').value;
    const groups=[...new Set(source.map(row=>row.channel))].sort().map(name=>({name,value:aggregate(filtered.filter(row=>row.channel===name),measure)}));
    const max=Math.max(1,...groups.map(group=>group.value));
    $('#bar-chart').innerHTML=groups.length?groups.map(group=>`<div class="bar-row"><span>${escape(group.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${(group.value/max*100).toFixed(2)}%"></div></div><span class="bar-number">${escape(display(group.value,measure))}</span></div>`).join(''):'<p>No channels available.</p>';
    $('#bar-chart').setAttribute('aria-label',`${measure} by channel: ${groups.map(g=>`${g.name} ${display(g.value,measure)}`).join('; ') || 'none'}`);
    $('#bar-chart-note').textContent=`${measure[0].toUpperCase()+measure.slice(1)} grouped by channel from ${filtered.length} filtered records.`;
  }
  function updateTrend() {
    const months=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`);
    const values=months.map(month=>aggregate(filtered.filter(r=>r.date===month),'sessions'));
    const max=Math.max(1,...values), left=18, top=15, width=560,height=172;
    const points=values.map((v,i)=>`${left+i*width/11},${top+height-(v/max)*height}`).join(' ');
    const labels=[0,2,4,6,8,10,11].map(i=>`<text x="${left+i*width/11}" y="227" text-anchor="middle">${months[i].slice(5)}</text>`).join('');
    $('#trend-chart').innerHTML=`<svg viewBox="0 0 595 245" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path d="M18 187 H580 M18 101 H580 M18 15 H580" fill="none" stroke="#39545d" stroke-dasharray="3 5"/><polyline fill="none" stroke="#d9fa72" stroke-width="3" stroke-linejoin="round" points="${points}"/>${values.map((value,i)=>`<circle cx="${left+i*width/11}" cy="${top+height-(value/max)*height}" r="4" fill="#d9fa72"/>`).join('')}${labels}</svg>`;
    $('#trend-chart').setAttribute('aria-label',`Monthly sessions for 2026: ${months.map((m,i)=>`${m} ${fmt.format(values[i])}`).join('; ')}`);
  }
  function updateTable() {
    const size=Number($('#page-size').value);
    const totalPages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,totalPages);
    const first=(page-1)*size, subset=filtered.slice(first,first+size);
    $('#rows').innerHTML=subset.map(row=>`<tr><td>${escape(row.date)}</td><td>${escape(row.product)}</td><td>${escape(row.channel)}</td><td>${escape(row.region)}</td><td class="number">${fmt.format(row.sessions)}</td><td class="number">${fmt.format(row.conversions)}</td><td class="number">${usd.format(row.revenue)}</td><td><span class="state ${clean(row.status).replaceAll(' ','-')}">${escape(row.status)}</span></td><td><button class="button subtle" data-record="${escape(row.id)}" aria-label="View details for ${escape(row.id)}" type="button">View ↗</button></td></tr>`).join('') || '<tr><td colspan="9">No records match the current filters.</td></tr>';
    $('#page-number').textContent=`${page} / ${totalPages}`;
    $('#page-summary').textContent=filtered.length?`Showing ${first+1}–${Math.min(first+size,filtered.length)} of ${filtered.length} matching records`:'0 matching records';
    $('#previous').disabled=page===1;$('#next').disabled=page===totalPages;
    document.querySelectorAll('th[data-unused]').forEach(el=>el.removeAttribute('data-unused'));
    document.querySelectorAll('th[aria-sort]').forEach(el=>el.removeAttribute('aria-sort'));
    const current=document.querySelector(`[data-sort="${sorting.key}"]`);
    if(current)current.closest('th').setAttribute('aria-sort',sorting.direction==='asc'?'ascending':'descending');
  }
  function render() {calculate();updateMetrics();updateBars();updateTrend();updateTable();}
  controls.forEach(id=>form[id].addEventListener(id==='search'?'input':'change',()=>{page=1;render();}));
  $('#measure').addEventListener('change',updateBars);
  $('#page-size').addEventListener('change',()=>{page=1;updateTable();});
  $('#previous').addEventListener('click',()=>{page--;updateTable();});
  $('#next').addEventListener('click',()=>{page++;updateTable();});
  $('#clear').addEventListener('click',()=>{form.search.value='';['product','channel','region','status'].forEach(id=>form[id].value='all');page=1;render();say('Filters cleared.');});
  $('#restore').addEventListener('click',()=>{source=generate();form.search.value='';refillSelects();page=1;render();$('#dataset-note').textContent='Demo dataset: 120 generated records · 2026 reporting periods';say('Demo dataset restored.');});
  document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.sort;sorting={key,direction:key===sorting.key && sorting.direction==='asc'?'desc':'asc'};page=1;render();say(`Sorted by ${key}, ${sorting.direction === 'asc'?'ascending':'descending'}.`);}));
  $('#rows').addEventListener('click',event=>{const button=event.target.closest('[data-record]');if(!button)return;const record=source.find(r=>r.id===button.dataset.record);if(!record)return;$('#details-title').textContent=`${record.product} · ${record.id}`;$('#details-list').replaceChildren(...Object.entries(record).flatMap(([key,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key.replaceAll('_',' ').toUpperCase();dd.textContent=key==='revenue'?usd.format(value):String(value);return [dt,dd];}));$('#details-dialog').showModal();});
  $('#close-dialog').addEventListener('click',()=>$('#details-dialog').close());
  $('#details-dialog').addEventListener('click',event=>{if(event.target===$('#details-dialog'))$('#details-dialog').close();});
  function csvCell(value){const str=String(value);return /[",\r\n]/.test(str)?`"${str.replaceAll('"','""')}"`:str;}
  $('#export').addEventListener('click',()=>{const headers=['id','date','product','channel','region','campaign','sessions','conversions','revenue','status'];const text=[headers.join(','),...filtered.map(row=>headers.map(key=>csvCell(row[key]??'')).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='data-playground-filtered.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say(`Exported ${filtered.length} rows as CSV.`);});
  function parseCsv(text){const result=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));result.push(row);row=[];cell='';}else cell+=ch;}if(quoted)throw new Error('Unclosed CSV quote');if(cell||row.length){row.push(cell.replace(/\r$/,''));result.push(row);}const [headers,...rows]=result;if(!headers)throw new Error('Empty CSV');const keys=headers.map(h=>h.trim().replace(/^\uFEFF/,''));return rows.filter(r=>r.some(c=>c.trim())).map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]??''])));}
  function validate(records){if(!Array.isArray(records)||records.length===0||records.length>10000)throw new Error('Use an array of 1–10,000 records');return records.map((record,i)=>{if(!record||typeof record!=='object'||Array.isArray(record))throw new Error(`Row ${i+1} must be an object`);for(const key of expected){if(!(key in record))throw new Error(`Missing required column: ${key}`);}const item={...record,id:String(record.id||`ROW-${i+1}`),date:String(record.date),product:String(record.product),channel:String(record.channel),region:String(record.region),status:String(record.status),campaign:String(record.campaign||'')};for(const key of ['sessions','conversions','revenue']){item[key]=Number(record[key]);if(!Number.isFinite(item[key])||item[key]<0)throw new Error(`Invalid ${key} in row ${i+1}`);}if(item.conversions>item.sessions)throw new Error(`Conversions exceed sessions in row ${i+1}`);return item;});}
  $('#file-input').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>3_000_000)throw new Error('File exceeds 3 MB');const content=await file.text();const parsed=file.name.toLowerCase().endsWith('.json')?JSON.parse(content):parseCsv(content);const imported=validate(parsed);source=imported;form.search.value='';refillSelects();page=1;render();$('#dataset-note').textContent=`Local import: ${file.name} · ${source.length} records`;say(`Imported ${source.length} records from ${file.name}.`);}catch(error){say(`Import failed: ${error.message}`);window.alert(`Unable to import: ${error.message}`);}finally{event.target.value='';}});
  refillSelects();render();
})();
