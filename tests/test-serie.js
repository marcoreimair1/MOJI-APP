/* Testlauf: Serien — erkennen, fragen, wegfliegen lassen.
   Abgemeldet. Der Dienstplan des Testprofils ist der Vorgabeplan:
   Montag bis Samstag Dienst, nur Sonntag frei. Ein Zeitraum ueber zwei
   Wochen schreibt also auch die Samstage mit. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(fs.readFileSync(DATEI, 'utf8'), {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
var TAGE = ['14','15','16','17','18','19','21','22','23','24','25'];   /* So 20. faellt aus */
function setzen(mitKennung, art, umfang, text){
  ME.events = {};
  var ser = '2026-09-14>2026-09-25';
  TAGE.forEach(function(d){
    var e = { t: art || 'urlaub', s: umfang || 'full', text: text || '', aw:false };
    if (mitKennung) e.ser = ser;
    ME.events['2026-09-' + d] = e;
  });
}

/* ── 1 · Der Dienstplan, auf dem alles beruht ── */
ok('Samstag ist Dienst, Sonntag nicht',
   qTouched(new Date(2026,8,19)) && !qTouched(new Date(2026,8,20)));

/* ── 2 · Mit Kennung ── */
setzen(true);
var a = serieVon(2026, 8, 16);
ok('Kennung findet alle elf Tage', a.length === 11, a.length);
ok('Von vorn nach hinten sortiert', a[0] === '2026-09-14' && a[10] === '2026-09-25', a[0]+' … '+a[10]);
ok('Auch vom letzten Tag aus', serieVon(2026, 8, 25).length === 11);

/* ── 3 · Ohne Kennung: der Altbestand ──
   Alles, was vor dem 13. September 2026 eingetragen wurde, hat keine
   Kennung. Es soll trotzdem als Serie gelten. */
setzen(false);
ok('Ohne Kennung genauso elf Tage', serieVon(2026, 8, 16).length === 11,
   serieVon(2026, 8, 16).length);
ok('Der freie Sonntag trennt nicht', serieVon(2026, 8, 19).indexOf('2026-09-21') >= 0);

/* ── 4 · Ein freier ARBEITSTAG trennt sehr wohl ── */
setzen(false);
delete ME.events['2026-09-18'];
var c = serieVon(2026, 8, 16);
ok('Luecke an einem Arbeitstag beendet die Serie', c.length === 4, c.join(' '));
ok('Der Rest steht fuer sich', serieVon(2026, 8, 22).length === 6, serieVon(2026,8,22).join(' '));

/* ── 5 · Was sonst noch trennt ── */
setzen(false);
ME.events['2026-09-17'] = { t:'krank', s:'full', text:'', aw:false };
ok('Anderer Eintragstyp trennt', serieVon(2026, 8, 15).length === 3, serieVon(2026,8,15).join(' '));
ok('Der einzelne Krankenstand ist keine Serie', serieVon(2026, 8, 17).length === 1);

setzen(false);
ME.events['2026-09-17'] = { t:'urlaub', s:'vm', text:'', aw:false };
ok('Halber Tag trennt vom ganzen', serieVon(2026, 8, 15).length === 3);

setzen(false, 'eigen', 'full', 'Schulung');
ME.events['2026-09-17'] = { t:'eigen', s:'full', text:'Behörde', aw:false };
ok('Gleicher Vermerk haelt zusammen', serieVon(2026, 8, 15).length === 3);
ok('Anderer Vermerk trennt', serieVon(2026, 8, 17).length === 1);

/* ── 6 · Ein einzelner Tag ist keine Serie ── */
ME.events = { '2026-09-16': { t:'urlaub', s:'full', text:'', aw:false } };
ok('Einzelner Tag: Serie der Laenge 1', serieVon(2026, 8, 16).length === 1);
ok('Leerer Tag: gar keine Serie', serieVon(2026, 8, 17).length === 0);

/* ── 6b · Befunde der Pruefung vom 02.10.2026 ── */
/* Zeitausgleich gibt es nur je Tag: drei Tage nebeneinander sind keine Serie. */
ME.events = { '2026-09-14': { t:'zeit', za:2 }, '2026-09-15': { t:'zeit', za:-3 }, '2026-09-16': { t:'zeit', za:1.5 } };
ok('Zeitausgleich nebeneinander: jeder Tag fuer sich',
   serieVon(2026, 8, 14).length === 1 && serieVon(2026, 8, 15).length === 1 && serieVon(2026, 8, 16).length === 1);
/* Altbestand ohne Kennung direkt neben einer Serie mit Kennung. */
ME.events = {};
['07','08','09','10','11','12'].forEach(function(d){ ME.events['2026-09-' + d] = { t:'urlaub', s:'full', text:'', aw:false }; });
['14','15','16','17','18'].forEach(function(d){ ME.events['2026-09-' + d] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-09-14>2026-09-18' }; });
ok('Vom Altbestand aus: nur die eigenen 6 Tage', serieVon(2026, 8, 9).length === 6, serieVon(2026, 8, 9).join(' '));
ok('Von der neuen Serie aus: ihre 5', serieVon(2026, 8, 15).length === 5);
/* Gleiche Kennung, andere Art (altes Datenbild): gehoert nicht dazu. */
ME.events['2026-09-17'] = { t:'krank', s:'full', text:'', aw:false, ser:'2026-09-14>2026-09-18' };
ok('Gleiche Kennung, andere Art: nicht mitgezaehlt', serieVon(2026, 8, 15).length === 4 && serieVon(2026, 8, 17).length === 1);
/* Freie Tage zaehlen beim Fragen nicht mit — wie beim Eintragen. */
setzen(true);
ME.events['2026-09-20'] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-09-14>2026-09-25', frei:true };
ok('12 Eintraege, davon 11 Tage', serieVon(2026, 8, 16).length === 12 && serieTageZahl(serieVon(2026, 8, 16)) === 11);
/* Ein freier Tag ohne Arbeitstage seiner Serie auf beiden Seiten faellt weg. */
['21','22','23','24','25'].forEach(function(d){ delete ME.events['2026-09-' + d]; });
ok('Aufraeumen: der Sonntag am Rand geht mit', freiAufraeumen() === 1 && !ME.events['2026-09-20']);
setzen(true);
ME.events['2026-09-20'] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-09-14>2026-09-25', frei:true };
ok('Liegt er dazwischen, bleibt er', freiAufraeumen() === 0 && !!ME.events['2026-09-20']);
ME.events['2026-09-13'] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-09-01>2026-09-12', frei:true };
ok('Ein freier Tag einer verschwundenen Serie geht', freiAufraeumen() === 1 && !ME.events['2026-09-13']);
ME.events = { '2026-09-16': { t:'urlaub', s:'full', text:'', aw:false } };   /* fuer 7 */

/* ── 7 · Die Rueckfrage kommt nur, wenn es etwas zu entscheiden gibt ── */
CAL.y = 2026; CAL.m = 8;
var bar = document.querySelector('#serbar');
ok('Frageleiste steht im Markup', !!bar);
openSheet(2026, 8, 16);
document.querySelector('#sh-del').click();
ok('Bei einem einzelnen Tag wird nicht gefragt', !bar.classList.contains('on'));
ok('Und der Tag fliegt gleich weg', _wegBusy === true);

window.__SCHRITT2 = function(){
  ok('Danach ist der Tag weg', !ME.events['2026-09-16']);
  ok('Und die Sperre ist wieder offen', _wegBusy === false);

  /* ── 8 · Bei einer Serie wird gefragt ── */
  setzen(true);
  openSheet(2026, 8, 16);
  document.querySelector('#sh-del').click();
  ok('Bei einer Serie wird gefragt', bar.classList.contains('on'));
  ok('Der Kopf nennt Art und Anzahl',
     document.querySelector('#ser-b').textContent === 'Urlaub · 11 Tage',
     document.querySelector('#ser-b').textContent);
  ok('Die Zeile nennt den Zeitraum',
     /14\\. Sep 2026 bis .*25\\. Sep 2026/.test(document.querySelector('#ser-s').textContent),
     document.querySelector('#ser-s').textContent);
  ok('Der Serienknopf nennt die Zahl',
     document.querySelector('#ser-alle').textContent === 'Alle 11 Tage',
     document.querySelector('#ser-alle').textContent);
  ok('Nichts ist geloescht, solange nicht geantwortet ist',
     Object.keys(ME.events).length === 11, Object.keys(ME.events).length);

  /* ── 9 · Nur dieser Tag ── */
  document.querySelector('#ser-tag').click();
  ok('Waehrend des Wegfliegens steht der Eintrag noch',
     !!ME.events['2026-09-16'], 'noch da');
  window.__SCHRITT3 = function(){
    ok('Nur der eine Tag ist weg', !ME.events['2026-09-16']);
    ok('Die uebrigen zehn stehen', Object.keys(ME.events).length === 10,
       Object.keys(ME.events).length);

    /* ── 10 · Die ganze Serie ── */
    setzen(true);
    openSheet(2026, 8, 22);
    document.querySelector('#sh-del').click();
    document.querySelector('#ser-alle').click();
    ok('Elf Kacheln sind als "weg" gezeichnet',
       document.querySelectorAll('#cal-grid .cell.weg').length === 11,
       document.querySelectorAll('#cal-grid .cell.weg').length);
    ok('Sie tragen ihr Zeichen noch, waehrend sie gehen',
       [].every.call(document.querySelectorAll('#cal-grid .cell.weg'),
                     function(c){ return !!c.querySelector('.ico'); }));
    ok('Nacheinander, gedeckelt',
       document.querySelectorAll('#cal-grid .cell.weg')[0].style.animationDelay === '0ms');
    window.__SCHRITT4 = function(){
      ok('Danach ist die ganze Serie weg', Object.keys(ME.events).length === 0,
         Object.keys(ME.events).length);
      ME = null;
      window.__FERTIG = true;
    };
    setTimeout(window.__SCHRITT4, 1300);
  };
  setTimeout(window.__SCHRITT3, 900);
};
setTimeout(window.__SCHRITT2, 900);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
}, 4200);
