/* Testlauf: Mehrere Tage eintragen (frueher „Zeitraum eintragen").

   Seit 27.09.2026 zeigt die Kachel die drei Arten als Zeichen, eine Wahl
   klappt darunter auf und erklaert jede Art, im Kalender stehen Von und
   Bis wie in einem Buchungskalender, die gewaehlten Tage liegen auf einem
   Band, und der Eintragen-Knopf nennt die Zahl der Tage.

   Gerechnet wird im Maerz 2025: Mo–Fr 8 h, Sa 4 h, Sonntag frei, kein
   Feiertag zwischen 10. und 21. Abgemeldet — wie die anderen Reihen. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const roh = fs.readFileSync(DATEI, 'utf8');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(roh, {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }
function tipp(el){ el.dispatchEvent(new window.MouseEvent('click', { bubbles:true })); }
function tag(d){ return document.querySelector('#cal-grid .cell[data-d="' + d + '"]'); }
function klein(){ return document.querySelector('#cal-title small'); }

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
enterApp();

/* ── 1 · Die Kachel sagt, was sie tut ── */
var kopf = document.querySelector('#qopen');
ok('Die Kachel nennt Urlaub und Krankenstand',
   kopf.textContent.indexOf('Urlaub, Krankenstand') >= 0, kopf.textContent);
ok('Und dass es um einen oder mehrere Tage geht',
   kopf.textContent.indexOf('mehrere Tage') >= 0);
ok('Das abstrakte „Zeitraum eintragen" steht nicht mehr darauf',
   kopf.textContent.indexOf('Zeitraum') < 0);
var zeichen = document.querySelectorAll('.zrk-arten [data-zi]');
ok('Drei Zeichen fuer die drei Arten', zeichen.length === 3);
ok('Alle drei tragen ihr Symbol aus ICONS',
   Array.prototype.every.call(zeichen, function(z){
     /* Verglichen wird, was der Browser aus ICONS macht — er schreibt
        <path/> beim Einsetzen als <path></path> zurueck. */
     var soll = document.createElement('i'); soll.innerHTML = ICONS[z.dataset.zi];
     return !!z.querySelector('svg') && z.innerHTML === soll.innerHTML;
   }));

/* ── 2 · Die Wahl ── */
var zrk = document.querySelector('#zrk');
tipp(kopf);
ok('Ein Tipp klappt die Wahl auf', zrk.classList.contains('auf'));
ok('Und sagt das auch Vorlesegeraeten', kopf.getAttribute('aria-expanded') === 'true');
ok('Der Kalender tritt so lange zurueck', document.querySelector('#v-cal').classList.contains('zrk-offen'));
var zeilen = document.querySelectorAll('#zrk-opts .zo');
ok('Drei Zeilen: Urlaub, Krankenstand, Vermerk',
   zeilen.length === 3 && zeilen[0].dataset.zt === 'urlaub'
   && zeilen[1].dataset.zt === 'krank' && zeilen[2].dataset.zt === 'eigen');
ok('Jede Zeile erklaert sich mit einem Satz',
   Array.prototype.every.call(zeilen, function(z){ return z.querySelector('small').textContent.length > 10; }));
ok('Beim Urlaub steht, wie viel noch offen ist',
   /offen$/.test(document.querySelector('#zo-urlaub').textContent),
   document.querySelector('#zo-urlaub').textContent);
ok('Darunter die drei Schritte', document.querySelectorAll('.zrk-wie em').length === 3);

document.body.dispatchEvent(new window.Event('pointerdown', { bubbles:true }));
ok('Ein Tipp daneben schliesst sie', !zrk.classList.contains('auf'));
ok('Und der Kalender ist wieder da', !document.querySelector('#v-cal').classList.contains('zrk-offen'));
zrkAuf(true);
document.querySelector('.zo').dispatchEvent(new window.Event('pointerdown', { bubbles:true }));
ok('Ein Tipp in die Wahl schliesst sie nicht', zrk.classList.contains('auf'));
document.dispatchEvent(new window.KeyboardEvent('keydown', { key:'Escape' }));
ok('Escape schliesst sie', !zrk.classList.contains('auf'));

/* ── 3 · Urlaub gewaehlt: der erste Schritt ── */
CAL.y = 2025; CAL.m = 2; renderCal();
zrkAuf(true);
tipp(zeilen[0]);
ok('Der Modus laeuft', zrModus());
ok('Die Kachel faellt zusammen', zrk.classList.contains('weg'));
ok('Im Kopf des Kalenders steht der erste Schritt',
   klein().classList.contains('zr-schritt') && klein().textContent === 'Ersten Tag antippen', klein().textContent);
ok('Von ist das gefragte Feld', document.querySelector('#zrs-von').classList.contains('dran'));
ok('Bis noch nicht', !document.querySelector('#zrs-bis').classList.contains('dran'));
ok('Eintragen bleibt aus, bis ein Tag gewaehlt ist', document.querySelector('#zr-ok').disabled);
ok('Eine Welle zeigt, dass man jetzt in den Kalender tippt',
   document.querySelector('#cal-grid').classList.contains('zr-welle'));
ok('Jede Zelle hat ihre eigene Verzoegerung',
   tag(10).style.getPropertyValue('--w') !== tag(21).style.getPropertyValue('--w'));

/* ── 4 · Erster Tag ── */
tipp(tag(10));
ok('Der Tipp setzt den Anfang', Q.from && Q.from.getDate() === 10 && !Q.to);
ok('Der Tag ist markiert und federt nach',
   tag(10).classList.contains('zr-edge') && tag(10).classList.contains('zr-neu'));
var jahr = new Date().getFullYear() === 2025 ? '' : ' 2025';
ok('Von zeigt den Tag, kurz und mit Jahr, weil es nicht das laufende ist',
   document.querySelector('#zrs-von-b').textContent === 'Mo, 10. Mär' + jahr,
   document.querySelector('#zrs-von-b').textContent);
ok('Im laufenden Jahr ohne Jahr', zrTag(new Date()).indexOf(String(new Date().getFullYear())) < 0);
ok('Jetzt ist Bis gefragt',
   document.querySelector('#zrs-bis').classList.contains('dran')
   && document.querySelector('#zrs-von').classList.contains('voll'));
ok('Der Kopf sagt den zweiten Schritt', klein().textContent === 'Letzten Tag antippen', klein().textContent);
ok('Ein einzelner Tag laesst sich schon eintragen',
   !document.querySelector('#zr-ok').disabled
   && document.querySelector('#zr-ok-t').textContent === '1 Tag eintragen',
   document.querySelector('#zr-ok-t').textContent);
ok('Und die Zeile darunter sagt das', /Nur dieser eine Tag/.test(document.querySelector('#zr-sum').textContent));
ok('Noch kein Band bei einem einzelnen Tag', !document.querySelector('.zr-band'));

/* ── 5 · Letzter Tag ── */
tipp(tag(21));
ok('Der zweite Tipp setzt das Ende', Q.to && Q.to.getDate() === 21);
ok('10. bis 21. Maerz sind 11 Arbeitstage', zrZaehlen().tage === 11, zrZaehlen().tage);
ok('Der Knopf nennt sie', document.querySelector('#zr-ok-t').textContent === '11 Tage eintragen',
   document.querySelector('#zr-ok-t').textContent);
ok('Der Kopf auch', klein().textContent === '11 Arbeitstage gewählt', klein().textContent);
ok('Die Tage dazwischen liegen auf dem Band',
   tag(12).classList.contains('zr-mid') && tag(21).classList.contains('zr-edge'));
ok('Der Sonntag zaehlt nicht', tag(16).classList.contains('zr-off'));
var baender = document.querySelectorAll('#cal-grid .zr-band');
ok('Das Band ist gelegt', baender.length >= 1, baender.length);
ok('Es wischt herein, weil das Ende gerade gesetzt wurde',
   Array.prototype.every.call(baender, function(b){ return b.classList.contains('neu'); }));
ok('Es liegt vor den Zellen, also darunter', document.querySelector('#cal-grid').firstElementChild.classList.contains('zr-band'));
ok('Kein Feld ist mehr gefragt',
   !document.querySelector('#zrs-von').classList.contains('dran')
   && !document.querySelector('#zrs-bis').classList.contains('dran'));
renderCal();
ok('Neu gezeichnet liegt es ohne Wisch da',
   document.querySelectorAll('#cal-grid .zr-band.neu').length === 0
   && document.querySelectorAll('#cal-grid .zr-band').length >= 1);

/* ── 6 · Rueckwaerts und von vorn ── */
tipp(tag(20));
ok('Ein dritter Tipp faengt von vorn an', Q.from.getDate() === 20 && !Q.to);
tipp(tag(18));
ok('Ein frueherer Tag wird zum Anfang', Q.from.getDate() === 18 && Q.to.getDate() === 20);
tipp(document.querySelector('#zrs-bis'));
ok('Ein Tipp auf Bis nimmt nur das Ende heraus', Q.from.getDate() === 18 && !Q.to);
tipp(document.querySelector('#zrs-von'));
ok('Ein Tipp auf Von faengt ganz neu an', !Q.from && !Q.to);
ok('Dann ist Eintragen wieder aus', document.querySelector('#zr-ok').disabled);

/* ── 7 · Der Umfang ist ein Umschalter ── */
tipp(document.querySelector('#q-scope [data-s="vm"]'));
ok('Vormittag gewaehlt', Q.scope === 'vm');
ok('Der Schieber steht auf dem zweiten Feld',
   document.querySelector('#q-scope').style.getPropertyValue('--i') === '1');
ok('Die Beschriftung passt auf eine Zeile — ohne „Nur"',
   document.querySelector('#q-scope').textContent.indexOf('Nur') < 0);
tipp(document.querySelector('#q-scope [data-s="full"]'));

/* ── 8 · Eintragen ── */
tipp(tag(10)); tipp(tag(12));
tipp(document.querySelector('#zr-ok'));
var drei = ['2025-03-10','2025-03-11','2025-03-12'];
ok('Drei Urlaubstage stehen im Profil',
   drei.every(function(k){ return ME.events[k] && ME.events[k].t === 'urlaub'; }));
ok('Als eine Serie', ME.events['2025-03-10'].ser === '2025-03-10>2025-03-12', ME.events['2025-03-10'].ser);
ok('Der Modus ist vorbei', !zrModus());
ok('Der Kopf sagt wieder, wessen Kalender es ist', /^Kalender von/.test(klein().textContent));
ok('Der Knopf ist fuer das naechste Mal wieder an', !document.querySelector('#zr-ok').disabled);
ok('Kein Band bleibt liegen', !document.querySelector('#cal-grid .zr-band'));
ok('Die Kachel ist zurueck', !zrk.classList.contains('weg'));
_qBusy = false;

/* ── 9 · Schon belegte Tage werden genannt ── */
zrAn('urlaub');
tipp(tag(10)); tipp(tag(14));
ok('Die Zeile nennt die drei schon belegten',
   /3 schon belegt, werden ersetzt/.test(document.querySelector('#zr-sum').textContent),
   document.querySelector('#zr-sum').textContent);
tipp(document.querySelector('#zr-weg'));
ok('Abbrechen beendet den Modus', !zrModus());
ok('Der Knopf heisst jetzt Abbrechen', document.querySelector('#zr-weg').textContent.trim() === 'Abbrechen');

/* ── 10 · Krankenstand und Vermerk ── */
zrAn('krank');
ok('Beim Krankenstand gibt es keinen Umfang', document.querySelector('#zrp-umfang').style.display === 'none');
ok('Und kein Urlaubskonto oben', document.querySelector('#zrp-ist').hidden);
zrAus();
zrAn('eigen');
ok('Beim Vermerk steht das Textfeld da', document.querySelector('#q-textwrap').style.display === 'block');
ok('Oben heisst es „Vermerk eintragen"', document.querySelector('#zrp-b').textContent === 'Vermerk eintragen');
ok('Die Schriftfarbe ist gesetzt', !!document.body.style.getPropertyValue('--zrf-tx'));
zrAus();
ok('Und wieder weggeraeumt', !document.body.style.getPropertyValue('--zrf-tx'));

ME = null;
window.__FERTIG = true;
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

const E = dom.window.__E || [];
[['Die Kachel bleibt 52 px hoch, wie der Kopf im Export',
  /\.zrk\{position:relative;height:52px;/],
 ['Die Wahl legt sich ueber den Kalender, statt ihn zu schieben',
  /\.zrk-wahl\{position:absolute;/],
 ['Sie waechst aus der Kachel heraus', /\.zrk-wahl\{[\s\S]{0,700}transform-origin:50% -24px/],
 ['Das Band wischt mit clip-path, nicht mit scaleX', /@keyframes zrBand\{from\{clip-path:inset\(0 100% 0 0/],
 ['Die Tage im Band haben keinen eigenen Kasten',
  /body\.zrmodus \.cell\.zr-mid\{background:transparent;border-color:transparent\}/],
 ['Der Umfang hat einen Schieber', /#q-scope::before\{/],
 ['Andruecken ueber scale, nicht transform', /\.zrk:active\{scale:\.985\}/],
 ['Weniger Bewegung: Kachel und Wahl ruhig',
  /prefers-reduced-motion:reduce\)\{\s*\n\s*\.zrk::before,\.zrk-arten i\{animation:none\}/],
 ['Weniger Bewegung: Band, Nachfedern und Welle ruhig',
  /\.zr-band\.neu,body\.zrmodus \.cell\.zr-neu,#cal-grid\.zr-welle \.cell\{animation:none\}/],
 ['Die Welle fragt matchMedia in try/catch — jsdom kennt es nicht',
  /function zrWelle\(\)\{[\s\S]{0,120}try\{ if\(matchMedia/],
 ['Das Band folgt Groessenaenderungen', /addEventListener\('resize', \(\) => \{ if\(zrModus\(\)\) zrBand\(\); \}\);/],
 ['Die alte Pille ist weg', !roh.includes('<span class="zrk-txt">Zeitraum eintragen</span>')],
 ['„Eintrag verwerfen" heisst jetzt Abbrechen', !roh.includes('Eintrag verwerfen')]
].forEach(([n, t]) => {
  const b = t instanceof RegExp ? t.test(roh) : !!t;
  E.push({ n, ok: b, z: b ? '' : 'fehlt' });
});

let schlecht = 0;
console.log('');
E.forEach(e => {
  if (!e.ok) schlecht++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
