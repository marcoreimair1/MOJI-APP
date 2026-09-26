/* Testlauf: Kalender — nochmal auf den Tab tippen holt den laufenden
   Monat. Abgemeldet. */
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

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
enterApp();
var v = document.querySelector('#v-cal');
/* Kalender und Export stehen seit dem 21. September 2026 in der Leiste
   unten. Vorher waren es zwei Knoepfe in #fabbar — als die wegfielen,
   fand dieser Test sie nicht mehr, brach vor dem Zaehlen ab und
   meldete "0 gescheitert". Dabei war genau das Verhalten verloren, das
   er prueft. */
var tabKal = document.querySelector('#tabbar .tab[data-go="v-cal"]');
var tabExp = document.querySelector('#tabbar .tab[data-go="v-export"]');
var heute = new Date();
function imLaufenden(){ return CAL.y === heute.getFullYear() && CAL.m === heute.getMonth(); }
function woanders(){ CAL.y = 2025; CAL.m = 2; renderCal(); }

/* ── 1 · Steht man schon auf dem Kalender, holt der Tipp den Monat ── */
woanders();
ok('Vorher Maerz 2025', CAL.y === 2025 && CAL.m === 2);
ok('Der Kalender ist die offene Ansicht', v.classList.contains('on'));
tabKal.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Zweiter Tipp holt den laufenden Monat', imLaufenden(), CAL.m + '/' + CAL.y);
ok('Die Ansicht ist als frisch vermerkt', v.classList.contains('frisch'));

/* ── 2 · Die Bewegung laeuft wirklich ──
   jsdom kennt Element.getAnimations() nicht; dort wird nur geprueft,
   dass die Regel greifen KANN. Der Ablauf selbst ist im Browser
   nachgemessen: 0,15 / 0,27 / 0,57 / 0,88 / 1,00 ueber 550 ms. */
var g = document.querySelector('#cal-grid');
var ti = document.querySelector('#cal-title');
if (typeof g.getAnimations === 'function') {
  ok('Das Gitter laedt sichtbar neu',
     g.getAnimations().map(function(a){ return a.animationName; }).indexOf('calFrisch') >= 0,
     g.getAnimations().map(function(a){ return a.animationName; }).join(','));
  ok('Der Titel kommt mit',
     ti.getAnimations().map(function(a){ return a.animationName; }).indexOf('calFrischT') >= 0);
} else {
  ok('Gitter und Titel liegen beide in #v-cal',
     v.contains(g) && v.contains(ti));
}

/* ── 3 · Ein Wechsel VON woanders laedt nicht neu ──
   Wer vom Export kommt, will die Ansicht wechseln, nicht neu laden —
   und soll den Monat wiederfinden, in dem er war. */
v.classList.remove('frisch');
woanders();
tabExp.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Export ist offen', document.querySelector('#v-export').classList.contains('on'));
tabKal.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Der Wechsel laedt nicht neu', !v.classList.contains('frisch'));
ok('Und laesst den Monat stehen', CAL.y === 2025 && CAL.m === 2, CAL.m + '/' + CAL.y);

/* ── 4 · Der Heute-Knopf macht jetzt dasselbe ── */
document.querySelector('#cal-today').dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Heute-Knopf holt den laufenden Monat', imLaufenden());
ok('Mit derselben Bewegung', v.classList.contains('frisch'));

/* ── 5 · Waehrend eines Zeitraums ruehrt sich nichts ──
   Dort ist der Kalender die Auswahlflaeche; ein Monatssprung mitten in
   der Auswahl waere ein Verlust. */
v.classList.remove('frisch');
woanders();
document.body.classList.add('zrmodus');
kalenderFrisch();
ok('Im Zeitraum-Modus bleibt der Monat', CAL.y === 2025 && CAL.m === 2);
ok('Und nichts laedt neu', !v.classList.contains('frisch'));
document.body.classList.remove('zrmodus');

/* ── 6 · Und nicht mitten im Blaettern ── */
_blaettert = true;
kalenderFrisch();
ok('Waehrend des Blaetterns bleibt der Monat', CAL.y === 2025 && CAL.m === 2);
_blaettert = false;

/* ── 7 · Das Osterei ──
   Ein Tipp auf den Schriftzug, und das Maennchen schaut vorbei. */
var marke = document.querySelector('#brand');
var wort  = document.querySelector('#brand-word');
var mo    = document.querySelector('#brand-moji');
ok('Der Schriftzug ist da', !!wort);
ok('Die Huelle fuers Maennchen liegt daneben', !!mo && !!mo.querySelector('img'));
ok('Das Bild ist noch nicht geladen', !mo.querySelector('img').getAttribute('src'),
   'so schleppt kein Start 16 KB mit, die niemand sieht');
ok('Und die Huelle liegt ausserhalb', !marke.classList.contains('eier'));

wort.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Der Tipp startet das Osterei', marke.classList.contains('eier'));
ok('Jetzt ist das Bild da', !!mo.querySelector('img').getAttribute('src'));
ok('Es ist das Maennchen, nicht die Kachel',
   mo.querySelector('img').getAttribute('src') === LOGO_MOJI);

/* Ein zweiter Tipp mittendrin darf nichts neu anwerfen. */
marke.classList.remove('eier');
wort.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Ein zweiter Tipp mittendrin prallt ab', !marke.classList.contains('eier'));

window.__EI = function(){
  ok('Danach ist das Osterei wieder weg', !marke.classList.contains('eier'));
  wort.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  ok('Und laesst sich erneut ausloesen', marke.classList.contains('eier'));
  marke.classList.remove('eier');
};

/* Es kommt seit 14.09.2026 auch von selbst vorbei — aber selten, und nur
   wenn der Schriftzug wirklich zu sehen ist. */
ok('Das erste Mal kommt frueh',              EI_ERST === 60000, EI_ERST);
ok('Aber nicht sofort',                      EI_ERST > EI_DAUER * 20);
ok('Danach faengt der Abstand bei vier Minuten an', EI_VON === 240000, EI_VON);
ok('Und reicht bis neun',                    EI_BIS === 540000, EI_BIS);
ok('Spaeter also seltener als am Anfang',    EI_VON > EI_ERST_BIS);
ok('Gewuerfelt, nicht getaktet',             EI_BIS > EI_VON && EI_ERST_BIS > EI_ERST);
setTimeout(window.__EI, EI_DAUER + 250);

/* ── 8 · Der Vermerk loest sich von selbst wieder ── */
kalenderFrisch();
ok('Frisch steht erst mal', v.classList.contains('frisch'));
window.__WEITER = function(){
  ok('Und ist danach wieder weg', !v.classList.contains('frisch'));
  ME = null;
  window.__FERTIG = true;
};
setTimeout(window.__WEITER, EI_DAUER + 700);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  [['Das Datum wird frisch geholt, nicht aus NOW',
    /function kalenderFrisch\(\)\{[\s\S]{0,400}const heute = new Date\(\);/],
   ['Die Bewegung nimmt die symmetrische Kurve',
    /#v-cal\.frisch #cal-grid\{animation:calFrisch \.55s var\(--ease-blend\)\}/],
   ['Wer weniger Bewegung will, bekommt keine',
    /@media \(prefers-reduced-motion:reduce\)\{\s*\n\s*#v-cal\.frisch #cal-grid/],
   /* Seit 14.09.2026 als WebP und in voller Aufloesung — 385 x 315
      statt 120 x 98, und dabei kleiner als das PNG davor. */
   ['Das Maskottchen liegt freigestellt in der Datei',
    /const LOGO_MOJI = 'data:image\/webp;base64,/],
   ['Der Schriftzug macht Platz', /@keyframes eiWort\{/],
   ['Das Maennchen kommt und geht', /@keyframes eiRein\{/],
   ['Und wackelt dazwischen', /@keyframes eiWackel\{/],
   ['Die Huelle hat Hoehe, bevor das Bild da ist', /\.bmoji\{[\s\S]{0,200}aspect-ratio:385\/315/],
   ['Auch das Osterei achtet auf weniger Bewegung',
    /prefers-reduced-motion:reduce\)\{\s*\n\s*\.brand\.eier \.bmoji/],
   /* Von selbst nur dort, wo der Schriftzug steht — nicht hinter einem
      Blatt, nicht im Funnel, nicht bei ruhiger Bewegung. */
   ['Von selbst nur bei ruhigem Schirm', /function eiFrei\(\)\{/],
   ['Nicht hinter einem Blatt',          /if\(k\.contains\('locked'\)\) return false;/],
   ['Nicht ohne Kopfleiste',             /if\(k\.contains\('nobar'\)\) return false;/],
   ['Nicht im Zeitraum',                 /if\(k\.contains\('zrmodus'\)\) return false;/],
   ['Nicht im offenen Menue',            /\$\('#menu'\)\.classList\.contains\('on'\)\) return false;/],
   ['Und nicht, wenn die Seite ruht',    /if\(document\.hidden\) return false;/],
   ['Jedes Mal neu gewuerfelt',
    /von \+ Math\.random\(\) \* \(bis - von\)/],
   ['Das erste Mal kommt frueher',       /planen\(true\);/]
  ].forEach(([n, re]) => E.push({ n, ok: re.test(roh), z: re.test(roh) ? '' : 'fehlt' }));

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
