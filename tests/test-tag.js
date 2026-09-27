/* Testlauf: Das Tagesblatt — einen einzelnen Tag eintragen.

   Seit 27.09.2026 in der Sprache von „Mehrere Tage eintragen": oben ein
   Kalenderblatt, das die Farbe der Art annimmt, die vier Arten als
   Kacheln zwei und zwei, die gewaehlte mit Haken, Umfang als Umschalter,
   ein Knopf, der sagt, was er tut. Schliessen gleitet nach unten weg,
   der eingetragene Tag blitzt im Kalender auf.

   Gerechnet wird am Mittwoch, 16. September 2026 (8 h Dienst). */
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
function kachel(t){ return document.querySelector('#sh-opts .sho[data-t="' + t + '"]'); }
var bl = document.querySelector('#sheet');

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
enterApp();
CAL.y = 2026; CAL.m = 8; renderCal();

/* ── 1 · Der Kopf ── */
openSheet(2026, 8, 16);
ok('Das Blatt ist offen', bl.classList.contains('on'));
ok('Und steigt beim Oeffnen gestaffelt herauf', bl.classList.contains('frisch'));
ok('Das Kalenderblatt zeigt Wochentag und Tag',
   document.querySelector('#sh-wt').textContent === 'Mi' && document.querySelector('#sh-tag').textContent === '16');
var jahr = new Date().getFullYear() === 2026 ? '' : ' 2026';
ok('Daneben ausgeschrieben, das Jahr nur, wenn es nicht das laufende ist',
   document.querySelector('#sh-title').textContent === 'Mittwoch, 16. September' + jahr,
   document.querySelector('#sh-title').textContent);
ok('Darunter der Dienstplan mit Uhr',
   !!document.querySelector('#sh-sub svg') && /8,00 h$/.test(document.querySelector('#sh-sub').textContent),
   document.querySelector('#sh-sub').textContent);

/* ── 2 · Die vier Arten als Kacheln ── */
var alle = document.querySelectorAll('#sh-opts .sho');
ok('Vier Kacheln', alle.length === 4);
ok('Urlaub, Krankenstand, Zeitausgleich, Vermerk',
   Array.prototype.map.call(alle, function(k){ return k.dataset.t; }).join(',') === 'urlaub,krank,zeit,eigen');
ok('Jede sagt in einem Satz, was sie bewirkt',
   kachel('urlaub').querySelector('small').textContent === 'Vom Urlaub abgezogen'
   && kachel('krank').querySelector('small').textContent === 'Ohne Abzug vom Urlaub');
ok('Jede traegt einen Haken fuer spaeter', Array.prototype.every.call(alle, function(k){ return !!k.querySelector('.sho-haken svg'); }));
ok('Noch keine gewaehlt', !document.querySelector('#sh-opts .sho.on') && !bl.classList.contains('hat'));
ok('Der Knopf sagt, was fehlt', document.querySelector('#sh-save-t').textContent === 'Art wählen');
ok('Und ist aus', document.querySelector('#sh-save').disabled);
ok('Ohne Eintrag heisst der zweite Knopf Abbrechen', document.querySelector('#sh-del').textContent === 'Abbrechen');

/* ── 3 · Urlaub waehlen ── */
tipp(kachel('urlaub'));
ok('Urlaub ist gewaehlt', SH.type === 'urlaub' && kachel('urlaub').classList.contains('on'));
ok('Fuer Vorlesegeraete gedrueckt', kachel('urlaub').getAttribute('aria-pressed') === 'true');
ok('Die anderen bleiben da und antippbar',
   document.querySelectorAll('#sh-opts .sho').length === 4 && document.querySelector('#sh-opts').classList.contains('gewaehlt'));
ok('Das Blatt traegt die Farbe der Art', bl.classList.contains('hat') && !!bl.style.getPropertyValue('--zrf'));
ok('Das Kalenderblatt federt beim Wechsel nach', document.querySelector('#sh-blatt').classList.contains('neu'));
ok('Der Umfang ist ein Umschalter ohne „Nur"',
   document.querySelector('#sh-scope').textContent.indexOf('Nur') < 0);
ok('Der Knopf ist an und sagt Eintragen',
   !document.querySelector('#sh-save').disabled && document.querySelector('#sh-save-t').textContent === 'Eintragen');
tipp(document.querySelector('#sh-scope [data-s="nm"]'));
ok('Nachmittag gewaehlt, der Schieber steht rechts',
   SH.scope === 'nm' && document.querySelector('#sh-scope').style.getPropertyValue('--i') === '2');

/* ── 4 · Umentscheiden ist ein Tipp ── */
tipp(kachel('krank'));
ok('Ein Tipp auf eine andere Art wechselt', SH.type === 'krank' && !kachel('urlaub').classList.contains('on'));
tipp(kachel('krank'));
ok('Nochmal auf die gewaehlte nimmt sie zurueck', SH.type === null && !bl.classList.contains('hat'));
ok('Dann ist die Farbe wieder weg', !bl.style.getPropertyValue('--zrf'));
tipp(kachel('urlaub'));

/* ── 5 · Eintragen ── */
tipp(document.querySelector('#sh-save'));
ok('Der Tag steht im Profil', ME.events['2026-09-16'] && ME.events['2026-09-16'].t === 'urlaub'
   && ME.events['2026-09-16'].s === 'nm', JSON.stringify(ME.events['2026-09-16']));
ok('Das Blatt gleitet nach unten weg', bl.classList.contains('zu'));
ok('Die Seite ist schon frei', !document.body.classList.contains('locked'));
ok('Der Tag blitzt im Kalender auf',
   document.querySelector('#cal-grid .cell[data-d="16"]').classList.contains('flash'));
ok('Die Meldung nennt die Art', /Urlaub eingetragen/.test(document.querySelector('#toast-t').textContent),
   document.querySelector('#toast-t').textContent);

/* ── 6 · Ein bestehender Eintrag ── */
openSheet(2026, 8, 16);
ok('Beim Oeffnen waehrend des Wegschliessens bleibt es offen',
   bl.classList.contains('on') && !bl.classList.contains('zu'));
ok('Die Art ist schon gewaehlt', kachel('urlaub').classList.contains('on'));
ok('Der Knopf heisst Speichern', document.querySelector('#sh-save-t').textContent === 'Speichern');
ok('Der zweite Zuruecksetzen', document.querySelector('#sh-del').textContent === 'Zurücksetzen');
tipp(document.querySelector('#sh-del'));
/* Zurueckgesetzt wird nach der Abraeum-Animation — geprueft am Ende. */

/* ── 7 · Abbrechen an einem leeren Tag ── */
openSheet(2026, 8, 17);
tipp(document.querySelector('#sh-del'));
ok('Abbrechen schliesst nur', bl.classList.contains('zu') && !ME.events['2026-09-17']);

/* ── 8 · Zeitausgleich und Vermerk ── */
openSheet(2026, 8, 18);
tipp(kachel('zeit'));
ok('Beim Zeitausgleich kommen Richtung und Menge', document.querySelector('#sh-zawrap').style.display === 'block');
ok('Und kein Umfang', document.querySelector('#sh-scopewrap').style.display === 'none');
tipp(kachel('eigen'));
ok('Beim Vermerk das Textfeld', document.querySelector('#sh-textwrap').style.display === 'block');
closeSheet();

window.__WEITER = function(){
  ok('Nach dem Wegschliessen ist es ganz zu', !bl.classList.contains('on') && !bl.classList.contains('zu'));
  ok('Zuruecksetzen hat den Tag wieder abgeraeumt', !ME.events['2026-09-16'],
     JSON.stringify(ME.events['2026-09-16']));
  ME = null;
  window.__FERTIG = true;
};
setTimeout(window.__WEITER, 1500);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  [['Das Kalenderblatt nimmt die Farbe der Art an', /#sheet\.hat \.shblatt\{background-color:var\(--zrf\)/],
   ['Die Kacheln stehen zwei und zwei', /#sh-opts\{display:grid;grid-template-columns:1fr 1fr;/],
   ['Die nicht gewaehlten treten zurueck, statt zu verschwinden', /#sh-opts\.gewaehlt \.sho:not\(\.on\)\{opacity:\.48\}/],
   ['Die alten Zeilen, die weggeklappt wurden, sind weg', !/\.opt\.weg\{/.test(roh)],
   ['Andruecken ueber scale', /\.sho:active\{scale:\.96\}/],
   ['Der Umfang nutzt denselben Umschalter wie der Zeitraum', /#q-scope::before,#sh-scope::before\{/],
   ['Schliessen gleitet nach unten weg', /#sheet\.zu \.sheet-card\{animation:shRaus/],
   ['Nach einem Wurf mit dem Finger sofort', /karte\.classList\.contains\('weg'\)\)\)\{\s*\n\s*bl\.classList\.remove\('on', 'zu', 'frisch'\)/],
   ['Die Farbe kommt aus den Marken der Fassung', /getPropertyValue\('--c-' \+ SH\.type\)/],
   ['Weniger Bewegung: alles ruhig',
    /#sheet\.frisch \.shkopf,#sheet\.frisch \.sheet-actions,#sheet\.frisch \.fnote,#sheet\.frisch \.sho,\s*\n\s*\.shblatt\.neu/]
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
}, 2200);
