/* Testlauf: Exportseite — was abgegeben ist, muss man sehen.
   Abgemeldet. */
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

/* ─── Zurueck vom PDF, seit 27.09.2026 ───
   Zwei weitere Starts: einer mit frischem Vermerk (so, als kaeme man
   gerade vom PDF zurueck) und einer mit einem alten. */
const zuStart = alter => new JSDOM(roh, {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w){ w.localStorage.setItem('moji.pdf.zurueck', String(Date.now() - alter)); }
});
const rueck = zuStart(30 * 1000);
const alt   = zuStart(11 * 60 * 1000);

/* jsPDF hineinreichen: der CDN-Aufruf laeuft in jsdom nicht, aber ohne
   ihn liesse sich die Seite nicht bauen. */
try {
  const jsPDFmod = require('jspdf/dist/jspdf.node.js');
  dom.window.jspdf = { jsPDF: jsPDFmod.jsPDF };
} catch(e) { console.warn('jsPDF fehlt — die Seitenpruefungen fallen aus'); }

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
var TAG = 864e5, JETZT = 1757700000000;   /* fester Zeitpunkt, kein Date.now() */

/* ── 1 · Das Exportbuch fuehrt wirklich Buch ── */
ME.exp = {};
merkeExporte([{ y:2026, m:0 }, { y:2026, m:1 }]);
ok('merkeExporte traegt beide Monate ein', expAnzahl() === 2, expAnzahl());
ok('Mit Zeitstempel', typeof ME.exp['2026-0'] === 'number', ME.exp['2026-0']);
merkeExporte([{ y:2026, m:0 }]);
ok('Zweimal derselbe Monat zaehlt nur einmal', expAnzahl() === 2, expAnzahl());

/* ── 2 · Die Kachel zeigt es ──
   Das war der Kern der Meldung: abgegeben wurde mitgefuehrt, aber
   nirgends angezeigt. Man sah einen Jahrgang erledigter Monate und
   keinen Unterschied zum leeren. */
ME.exp = {};
[0,1,2,3,4,5,6,7].forEach(function(m){ ME.exp['2026-'+m] = JETZT - (250 - m*30) * TAG; });
ME.exp['2025-10'] = JETZT - 320 * TAG;
EX.year = 2026;
EX.set = new Set(['2026-7','2026-8']);
go('v-export'); exYear();
var kacheln = document.querySelectorAll('#ex-months .chip');
ok('Zwoelf Kacheln', kacheln.length === 12, kacheln.length);
ok('Acht tragen den Haken', document.querySelectorAll('#ex-months .chip.fertig').length === 8,
   document.querySelectorAll('#ex-months .chip.fertig').length);
ok('Jaenner ist abgegeben und nicht gewaehlt',
   kacheln[0].classList.contains('fertig') && !kacheln[0].classList.contains('on'));
ok('September ist gewaehlt und nicht abgegeben',
   kacheln[8].classList.contains('on') && !kacheln[8].classList.contains('fertig'));
ok('August ist beides zugleich',
   kacheln[7].classList.contains('on') && kacheln[7].classList.contains('fertig'),
   kacheln[7].className);
ok('Der Haken steckt nur in abgegebenen Kacheln',
   document.querySelectorAll('#ex-months .exhaken').length === 8,
   document.querySelectorAll('#ex-months .exhaken').length);
ok('Vorlesegeraete bekommen beides als Text',
   /schon abgegeben/.test(kacheln[7].getAttribute('aria-label'))
   && /gewählt/.test(kacheln[7].getAttribute('aria-label')),
   kacheln[7].getAttribute('aria-label'));

/* ── 3 · Die Zeile darunter sagt es auch ── */
ok('Hinweis nennt die schon abgegebenen',
   /1 davon schon abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);
EX.set = new Set(['2026-0']); exYear();
ok('Ein einzelner schon abgegebener Monat',
   /· schon abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);
EX.set = new Set(['2026-8']); exYear();
ok('Ein frischer Monat bekommt keinen Zusatz',
   !/abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);

/* ── 4 · Der Zeitstempel rechnet in Ortszeit ──
   Frueher new Date(ts).toISOString().slice(0,10) — also UTC. Wer um
   halb eins nachts exportierte, bekam den Vortag angezeigt. */
var nachts = new Date(2026, 0, 5, 0, 30).getTime();
ok('Halb eins nachts bleibt der 5. Jaenner',
   fmtStempel(nachts) === '5. Jän 2026 um 00:30', fmtStempel(nachts));
var abends = new Date(2026, 6, 20, 23, 45).getTime();
ok('Und spaet abends der 20. Juli',
   fmtStempel(abends) === '20. Jul 2026 um 23:45', fmtStempel(abends));

/* ── 5 · Der Verlauf sagt, was welches Datum ist ──
   "Dezember" links und "27.11.2025" rechts, ohne ein Wort dazwischen,
   las sich wie ein Widerspruch. */
EX.set = new Set();
malVerlauf();
var zeilen = document.querySelectorAll('#vl-liste .exh-z');
ok('Neun Zeilen im Verlauf', zeilen.length === 9, zeilen.length);
ok('Jede Zeile sagt, wann abgegeben wurde',
   [].every.call(zeilen, function(z){ return /abgegeben am .* um \\d\\d:\\d\\d/.test(z.textContent); }),
   zeilen[0].textContent.replace(/\\s+/g,' '));
ok('Jede Zeile traegt den Haken',
   document.querySelectorAll('#vl-liste .exh-hk svg').length === 9);
ok('Nach Jahren gruppiert',
   document.querySelectorAll('#vl-liste .exh-jahr').length === 2,
   document.querySelectorAll('#vl-liste .exh-jahr').length);
ok('Neueste zuerst', zeilen[0].textContent.indexOf('August') === 0, zeilen[0].textContent.slice(0,12));

/* ── 6 · Der zweite Knopf ist weg ── */
ok('Kein "eigene Datei pro Monat" mehr', !document.querySelector('#ex-single'));
ok('Der Exportknopf steht noch', !!document.querySelector('#ex-go'));
ok('buildPdf nimmt nur noch die Liste', buildPdf.length === 1, buildPdf.length);

/* ── 7 · Die Seite selbst ──
   Sie muss zwei Dinge zugleich sein: eine Aufzeichnung nach § 26 AZG
   und etwas, das man gern in der Hand haelt. Geprueft wird hier das
   Erste — dass jede Pflichtangabe darauf steht und nichts abstuerzt.
   Wie es aussieht, steht als Bild im Commit. */
if (window.jspdf && window.jspdf.jsPDF) {
  ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
  ME.events['2026-01-14'] = { t:'urlaub', s:'full', text:'', aw:false };
  ME.events['2026-01-15'] = { t:'krank',  s:'full', text:'', aw:false };
  ME.events['2026-01-16'] = { t:'eigen',  s:'vm',   text:'Schulung', aw:false };
  ME.events['2026-01-20'] = { t:'zeit',   s:'full', text:'', za:-4 };

  var doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4', orientation:'portrait', compress:true });
  var geknallt = null;
  try { drawPage(doc, ME, 2026, 0); } catch(e){ geknallt = String(e); }
  ok('Die Seite baut sich ohne Absturz', !geknallt, geknallt);
  ok('Die Blockhandschrift steckt im Dokument', doc.__hand === true);
  ok('Und MOJIs Anzeigeschrift auch', doc.__brico === true);
  ok('Beide sind angemeldet',
     Object.keys(doc.getFontList()).indexOf('MojiBrico') >= 0);
  ok('Sie ist auch als Schrift angemeldet',
     Object.keys(doc.getFontList()).indexOf('MojiHand') >= 0,
     Object.keys(doc.getFontList()).join(','));

  /* Jede Pflichtangabe muss im Text der Seite stehen. */
  var roh = doc.output();
  ok('Ein PDF kommt heraus', roh.slice(0,5) === '%PDF-', roh.slice(0,8));
  ok('Zweimal aufrufen aendert nichts an der Schrift',
     handAn(doc) === true);

  /* Ein 31-Tage-Monat darf die Tabelle nicht in die Summen schieben. */
  var n31 = monthRows(ME, 2026, 0).length;
  ok('Jaenner hat 31 Zeilen', n31 === 31, n31);
  var startY = 61.6 + 6.4 + 1;
  var rowH = Math.min(5.4, (228 - startY) / n31);
  ok('31 Zeilen enden vor den Summen', startY + n31 * rowH <= 228.1,
     (startY + n31 * rowH).toFixed(1) + ' mm');
  /* Die Summenkarten duerfen die Unterschrift bei 274 mm nicht erreichen. */
  ok('Summen und Hinweise bleiben ueber der Unterschrift',
     startY + n31 * rowH + 7 + 18.6 + 8 < 272,
     (startY + n31 * rowH + 33.6).toFixed(1) + ' mm');
  ok('Und bleiben lesbar hoch', rowH >= 4.6, rowH.toFixed(2) + ' mm');
} else {
  ok('jsPDF fehlt — Seitenpruefungen ausgelassen', false, 'npm i jspdf');
}

/* ── 8 · Die Bausteine ── */
ok('Die Handschrift liegt in der Datei', typeof HAND_TTF === 'string' && HAND_TTF.length > 20000,
   typeof HAND_TTF === 'string' ? HAND_TTF.length : 'fehlt');
ok('MOJIs Anzeigeschrift auch', typeof BRICO_TTF === 'string' && BRICO_TTF.length > 20000,
   typeof BRICO_TTF === 'string' ? BRICO_TTF.length : 'fehlt');
/* Das App-Symbol ist freigestellt: der violette Seitengrund der Vorlage
   steckte bis zuletzt in den Ecken. */
ok('Das App-Symbol hat durchsichtige Ecken', LOGO_ICON.indexOf('data:image/png;base64,') === 0);
ok('Der QR liegt als PNG in der Datei',
   QR_PNG.indexOf('data:image/png;base64,') === 0 && QR_PNG.length > 500,
   QR_PNG.slice(0, 30) + ' … ' + QR_PNG.length);
ok('Jede Kategorie hat eine kraeftige UND eine Pastellfarbe',
   ['urlaub','krank','feier','eigen','zeit'].every(function(k){
     return Array.isArray(TYPES[k].pdf) && Array.isArray(TYPES[k].pdfF); }));
ok('Die PDF-Farben sind die der App',
   TYPES.urlaub.pdf.join(',') === '225,160,29' && TYPES.feier.pdf.join(',') === '0,167,203',
   TYPES.urlaub.pdf.join(',') + ' / ' + TYPES.feier.pdf.join(','));

/* ── Unterschreiben vor dem Export ──
   jsdom malt nichts, aber der ganze Ablauf drumherum laesst sich pruefen. */
const pad = document.getElementById('sigpad');
ok('Das Feld liegt in der Kachel', !!pad && pad.parentElement.id === 'ex-card');
ok('Mit einer Leinwand',           !!document.getElementById('sig-canvas'));
ok('Und einer Linie',              !!pad.querySelector('.sig-linie'));
ok('Der grosse Knopf heisst Signieren',
   document.getElementById('sig-ok').textContent.trim() === 'Signieren',
   document.getElementById('sig-ok').textContent.trim());
ok('Er steht bei Kalender und Export',
   document.getElementById('sig-ok').parentElement.id === 'fabbar');

ok('Ueber der Kachel steht das Wort',
   document.getElementById('sig-titel').textContent === 'Unterschrift',
   document.getElementById('sig-titel').textContent);
ok('Aber erst beim Unterschreiben', document.getElementById('sig-titel').hidden);

const kopfVor = document.querySelector('#v-export .exh').textContent;
EX.year = new Date().getFullYear(); EX.set = new Set([EX.year + '-0']);
sigAuf();
ok('Das Feld geht auf',            pad.classList.contains('da'));
ok('Die App merkt es sich',        document.body.classList.contains('sigmodus'));
ok('Und der Kopf fragt danach',
   document.querySelector('#v-export .exh').textContent === 'Bestätige jetzt mit deiner Unterschrift.',
   document.querySelector('#v-export .exh').textContent);
ok('Signieren geht erst mit Strich', document.getElementById('sig-ok').disabled);
ok('Jetzt steht das Wort da',        !document.getElementById('sig-titel').hidden);
sigZu();
ok('Zumachen raeumt auf',          !pad.classList.contains('da')
   && !document.body.classList.contains('sigmodus')
   && document.getElementById('sig-titel').hidden);
ok('Und der Kopf heisst wieder wie vorher',
   document.querySelector('#v-export .exh').textContent === kopfVor,
   document.querySelector('#v-export .exh').textContent);
/* Ohne Strich gibt es kein Bild — und damit keinen stillen Export. */
ok('Ohne Strich kein Bild',        sigBild() === null);
/* Ein Wechsel der Ansicht beendet das Unterschreiben. */
sigAuf(); go('v-cal');
ok('Die Ansicht zu wechseln beendet es', !document.body.classList.contains('sigmodus'));

/* ── Das Warten beim Export: ein Blatt, das sich schreibt ──
   Seit 27.09.2026. Vorher schloss sich ein Ring um das Maennchen. */
SIG_BILD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const ov = exOverlay(1);
ok('Die Buehne liegt ueber dem ganzen Schirm', ov.el.parentElement === document.body);
ok('Auf der Farbflaeche der App', !!ov.el.querySelector('.exd-grund.aurahg'));
ok('In der Mitte steht ein Blatt', !!ov.el.querySelector('.exstapel .exblatt.vorn'));
ok('Bei einem Monat ohne Blaetter dahinter', !ov.el.querySelector('.exblatt.h1'));
ok('Mit MOJI als Briefkopf',
   (ov.el.querySelector('.exb-kopf .exmoji img').getAttribute('src') || '').indexOf('data:image/webp') === 0);
ok('Und einer Tabelle mit zehn Zeilen', ov.el.querySelectorAll('.exb-zeilen .exz').length === 10);
ok('Je Zeile Datum, Zeiten und Stunden', ov.el.querySelectorAll('.exb-zeilen .exz b').length === 30);
ok('Sie faengt leer an', !ov.el.querySelector('.exz.da'));
ok('Die eigene Unterschrift steht darauf', ov.el.querySelector('#ex-sig').getAttribute('src') === SIG_BILD);
ok('Noch nicht geschrieben', ov.el.querySelector('.exb-sig').style.getPropertyValue('--s') === '0.000');
ok('Das Siegel wartet auf den Schluss', !!ov.el.querySelector('.exb-siegel svg'));
ok('Darunter die Lichtspur', !!ov.el.querySelector('.exspur i'));
ok('Der Text sagt, was passiert',
   document.getElementById('ex-ov-t').textContent === 'Deine Arbeitszeit wird geschrieben …',
   document.getElementById('ex-ov-t').textContent);
ok('Darunter steht die Zahl',      document.getElementById('ex-ov-s').textContent === '0 %',
   document.getElementById('ex-ov-s').textContent);
ov.finish('PDF erstellt · 1 Seite', 'datei.pdf');
ok('Fertig stempelt das Siegel',   document.querySelector('.exdone').classList.contains('fertig'));
ok('Und nennt die Datei',          document.getElementById('ex-ov-s').textContent === 'datei.pdf');
ok('Ohne Ziffernsperrung',         !document.getElementById('ex-ov-s').classList.contains('expro'));
ov.stop(); ov.el.remove();
/* Mehrere Monate: der Stapel dahinter, hoechstens zwei Blaetter. */
SIG_BILD = null;
const ov3 = exOverlay(5);
ok('Bei mehreren Monaten liegen Blaetter dahinter',
   ov3.el.querySelectorAll('.exblatt.h1, .exblatt.h2').length === 2);
ok('Ohne Unterschrift kein leeres Bild', !ov3.el.querySelector('#ex-sig'));
ov3.stop(); ov3.el.remove();

/* ── Das lebende Maennchen auf dem Blatt ──
   Ohne die Datei bleibt es beim Standbild aus dem Quelltext — das ist
   der Fall gerade eben. Liegt sie vor, tritt sie an seine Stelle. */
_lebtDa = true;
const ov2 = exOverlay();
const m2 = ov2.el.querySelector('.exmoji');
ok('Liegt die Datei vor, bewegt es sich',
   (m2.querySelector('img').getAttribute('src') || '') === 'moji-leben.webp',
   m2.querySelector('img').getAttribute('src'));
ok('Und die Kachel weiss davon',   m2.classList.contains('lebt'));
ov2.stop(); ov2.el.remove();
/* Das Blatt fuehrt zum Dokument: am Ende laesst es sich antippen. */
const ov6 = exOverlay(1);
ok('Waehrend geschrieben wird, ist das Blatt kein Knopf', !ov6.el.classList.contains('tippbar')
   && !ov6.el.querySelector('.exstapel').getAttribute('role'));
window.__w6 = 0;
ov6.wahl(() => { window.__w6++; return Promise.resolve(); });
const st6 = ov6.el.querySelector('.exstapel');
ok('Am Ende ist das Blatt antippbar', ov6.el.classList.contains('tippbar') && st6.getAttribute('role') === 'button');
ok('Mit einem Zeichen zum Oeffnen', !!st6.querySelector('.exb-auf svg'));
ok('Und einem Satz darunter', st6.querySelector('.exhinweis').textContent === 'Zum Ansehen antippen');
st6.click();
setTimeout(() => { window.__w6Tipp = window.__w6; ov6.stop(); ov6.el.remove(); }, 30);

/* ── Am Ende: teilen oder fertig, seit 27.09.2026 ──
   Vorher wurde das PDF als blob-Adresse im selben Tab geoeffnet — nach
   einem Neuladen stand dort "WebKitBlobResource-Fehler 1". */
ok('Ohne Teilen-Funktion bleibt es beim Oeffnen', pdfDatei({ output(){ return new Blob(['x']); } }, 'x.pdf') === null);
const ov4 = exOverlay(1);
ok('Die Knoepfe warten versteckt', ov4.el.querySelector('.exwahl').hidden);
window.__w4 = 'offen';
ov4.wahl(() => Promise.reject(Object.assign(new Error('abgebrochen'), { name:'AbortError' })))
   .then(() => { window.__w4 = 'zu'; });
ok('Am Ende stehen Teilen und Fertig', !ov4.el.querySelector('.exwahl').hidden
   && ov4.el.querySelector('#ex-teilen').textContent.indexOf('PDF teilen') > -1
   && ov4.el.querySelector('#ex-fertig').textContent === 'Fertig');
ov4.el.querySelector('#ex-teilen').click();
const ov5 = exOverlay(1);
window.__w5 = 'offen';
ov5.wahl(() => Promise.resolve()).then(() => { window.__w5 = 'zu'; });
ov5.el.querySelector('#ex-teilen').click();
setTimeout(() => {
  window.__w4NachAbbruch = window.__w4;
  ov4.el.querySelector('#ex-fertig').click();
  setTimeout(() => { window.__w4NachFertig = window.__w4; ov4.stop(); ov4.el.remove(); ov5.stop(); ov5.el.remove(); }, 30);
}, 30);
/* Das Aufmachen der Exportseite stoesst das Laden an. */
_lebtDa = false;
let geholt = '';
const echtImage = window.Image;
window.Image = function(){ const o = {}; Object.defineProperty(o, 'src', { set(v){ geholt = v; } }); return o; };
go('v-export');
window.Image = echtImage;
ok('Die Exportseite holt die Datei', geholt === 'moji-leben.webp', geholt || '(nichts)');

ME = null;
window.__FERTIG = true;
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  /* Die Rueckkehr vom PDF. */
  const rw = rueck.window;
  E.push({ n:'Mit frischem Vermerk gilt der Start als Rueckkehr vom PDF', ok: rw.eval('ZURUECK_VOM_PDF') === true, z:'' });
  E.push({ n:'Der Vermerk gilt nur fuer diesen einen Start', ok: rw.localStorage.getItem('moji.pdf.zurueck') === null, z:'' });
  rw.eval("ME = normalize({ id:'r', vorname:'Anna', nachname:'Muster', dob:'1994-03-14' }); enterApp();");
  E.push({ n:'Und die App steht wieder auf der Exportseite', ok: rw.document.querySelector('#v-export').classList.contains('on'), z:'' });
  rw.eval("enterApp();");
  E.push({ n:'Ein spaeteres Anmelden landet wieder im Kalender', ok: rw.document.querySelector('#v-cal').classList.contains('on'), z:'' });
  E.push({ n:'Ein alter Vermerk zaehlt nicht mehr', ok: alt.window.eval('ZURUECK_VOM_PDF') === false, z:'' });
  E.push({ n:'Wird aber trotzdem weggeraeumt', ok: alt.window.localStorage.getItem('moji.pdf.zurueck') === null, z:'' });
  E.push({ n:'Ohne Vermerk ist es ein normaler Start', ok: dom.window.eval('ZURUECK_VOM_PDF') === false, z:'' });
  E.push({ n:'Abbrechen des Teilen-Blatts laesst die Buehne stehen', ok: dom.window.__w4NachAbbruch === 'offen', z: dom.window.__w4NachAbbruch });
  E.push({ n:'Fertig schliesst sie', ok: dom.window.__w4NachFertig === 'zu', z: dom.window.__w4NachFertig });
  E.push({ n:'Geteilt schliesst sie auch', ok: dom.window.__w5 === 'zu', z: dom.window.__w5 });
  E.push({ n:'Ein Tipp aufs Blatt fuehrt zum Dokument', ok: dom.window.__w6Tipp === 1, z: dom.window.__w6Tipp });
  /* Regeln, die jsdom nicht rechnet — aber dastehen muessen. */
  [['Abgegeben faerbt nur, wenn nicht gewaehlt', /\.mgrid \.chip\.fertig:not\(\.on\)\{/],
   ['Der Haken liegt in der Ecke der Kachel', /\.mgrid \.chip \.exhaken\{/],
   ['Auf der gewaehlten Kachel kehrt er sich um', /\.mgrid \.chip\.on \.exhaken\{/],
   ['Verlaufszeile steht untereinander', /\.exh-t b\{display:block/],
   /* Nur echter Code zaehlt — der Kommentar, der den alten Stand
      erklaert, enthaelt den Ausdruck absichtlich. */
   /* Gemeint ist die ALTE sigImage()-Leinwand, die den getippten Namen
      in einer Zufallsschrift des Geraets abmalte. Seit 14.09.2026 wird
      wieder auf einer Leinwand unterschrieben — aber von Hand. */
   ['Kein abgemalter Name mehr', !/function sigImage/.test(roh)],
   ['Und die Wortmarke nicht mehr aus logoBlack', !/function logoBlack/.test(roh)],
   ['Kein UTC-Datum mehr fuer Ortszeit-Anzeigen',
    !/(?<!Hier stand )new Date\([^)]*\)\.toISOString\(\)\.slice\(0,10\)/.test(roh)],
   /* Seit 14.09.2026 wird vor jedem Export unterschrieben. */
   ['Der Knopf fuehrt zum Unterschreiben', /\$\('#ex-go'\)\.addEventListener\('click', sigAuf\)/.test(roh)],
   ['Die Unterschrift steht im PDF', /doc\.addImage\(SIG_BILD, 'PNG'/.test(roh)],
   ['Wo es geht, kommt das PDF ueber das Teilen-Blatt',
    /const datei = pdfDatei\(doc, name\);\s*\n\s*if\(datei\)\{[\s\S]{0,200}await ov\.wahl\(\(\) => navigator\.share\(\{ files:\[datei\], title:name \}\)\);/.test(roh)],
   ['Der Monat zaehlt auch dort erst mit der fertigen Datei',
    /if\(datei\)\{[\s\S]{0,120}merkeExporte\(list\);/.test(roh)],
   ['Vor dem Oeffnen des PDFs merkt sich die App die Rueckkehr', /pdfVermerken\(\);\s*\n\s*doc\.save\(name\);/.test(roh)],
   ['Zurueck vom PDF: kein Vorspann', /if\(FASSUNG_NEU \|\| ZURUECK_VOM_PDF\) vorspannUeberspringen\(\);/.test(roh)],
   ['Und kein Gruss', /afterLogin\(session, !FASSUNG_NEU && !ZURUECK_VOM_PDF\)/.test(roh)],
   ['Bleibt die Seite stehen, geht der Vermerk beim Wiedersehen', /const zurueck = \(\) => \{\s*\n\s*if\(document\.visibilityState !== 'visible'\) return;/.test(roh)],
   ['Mit dem Vermerk darunter',
    /doc\.text\('Elektronisch unterschrieben in der MOJI App'/.test(roh)],
   ['Sie wird nicht aufgehoben', /\n  SIG_BILD = null;\n  _busy = false/.test(roh)],
   ['Und nicht verzerrt', /if\(hoch > maxH\)\{ hoch = maxH; bre = hoch \* \(SIG_VERH \|\| 3\.4\); \}/.test(roh)],
   /* Die Leiste war 86 mm lang und die Unterschrift bis 15 mm hoch —
      das sah nach Formularfeld aus, nicht nach Unterschrift. */
   ['Die Unterschrift nutzt die Hoehe',
    /const maxH = clamp\(\(sy \+ 2\) - \(by \+ bh \+ 7\.4\) - 1\.6, 9, 15\);/.test(roh)],
   /* Eine hohe, schmale Unterschrift kann nur so breit werden, wie die
      Hoehe es zulaesst — auf einer festen Linie sah sie verloren aus. */
   ['Die Leiste richtet sich nach der Unterschrift',
    /sw = clamp\(bre \+ 10, 46, 68\);/.test(roh)],
   ['Ohne Bild bleibt sie fest',        /let sw = 62;/.test(roh)],
   /* Am rechten Blattrand gehoerte der Vermerk zu nichts. */
   ['Der Vermerk steht unter der Leiste',
    /doc\.text\('Elektronisch unterschrieben in der MOJI App', L, sy \+ 9\.6\)/.test(roh)],
   ['Und nicht mehr rechts aussen',
    !/'Elektronisch unterschrieben in der MOJI App', R,/.test(roh)],
   ['Das Blatt blendet im Dunkeln nicht',
    /:root\[data-theme="dark"\] \.sigpad\{background:#ded9e6/.test(roh)],
   ['Das Wort darueber traegt die Markenfarbe',
    /\.sig-titel\{[^}]*color:var\(--butter\)/.test(roh)],
   /* Das Bierglas ist am 14.09.2026 gegangen — es hatte mit Arbeitszeit
      nichts zu tun. */
   ['Kein Glas mehr beim Export',       !/\.exglas\{/.test(roh)],
   ['Keine Wellen, keine Blasen',       !/@keyframes exwave/.test(roh) && !/@keyframes exbub/.test(roh)],
   ['Und kein Prost',                   !/Prost!/.test(roh)],
   /* ─── Das Blatt, seit 27.09.2026 ─────────────────────────────── */
   ['Kein Ladekreis mehr', !/\.exring\{/.test(roh) && !/const EX_U/.test(roh)],
   ['Und keine Schnittmaske, die niemand mehr braucht', !/const MOJI_MASKE/.test(roh)],
   ['Das Blatt kommt aus der Unschaerfe wie das Profilbild',
    /\.exblatt\.vorn\{[\s\S]{0,120}animation:halloBild 1\.25s/.test(roh)],
   ['Die Zeilen fuellen sich von 4 bis 80, die Unterschrift bis 97',
    /const ZEILEN_AB = 4, ZEILEN_BIS = 80, SIG_BIS = 97;/.test(roh)],
   ['Die Unterschrift wird von links nach rechts freigelegt',
    /clip-path:inset\(0 calc\(\(1 - var\(--s, 0\)\) \* 100%\) 0 0\)/.test(roh)],
   /* 27.09.2026: keine violetten Balken mit Funken mehr in den Zeilen. */
   ['Keine violetten Balken mehr in der Tabelle', !/\.exz\.schreibt/.test(roh) && !/\.exz b::after/.test(roh)],
   ['Die Zeilen tauchen aus der Unschaerfe auf',
    /\.exz b\{[\s\S]{0,200}opacity:0;transform:translateX\(-5px\);filter:blur\(3px\)/.test(roh) && /\.exz\.da b\{opacity:1;transform:none;filter:none\}/.test(roh)],
   ['Fertig waechst das Blatt', /\.exdone\.fertig \.exstapel\{width:min\(68vw,258px\)/.test(roh)],
   ['Beim Druecken gibt es nach, solange der Finger liegt', /\.exdone\.tippbar \.exstapel:active\{scale:\.965\}/.test(roh)
    && /stapel\.addEventListener\('touchstart', \(\) => \{\}, \{ passive:true \}\);/.test(roh)],
   ['Fertig stempelt sich das Siegel', /\.exdone\.fertig \.exb-siegel\{animation:exStempel/.test(roh)],
   ['Und eine Lichtwelle geht vom Blatt aus, nicht zu weit',
    /\.exdone\.fertig \.exwelle\{animation:exWelle /.test(roh) && /@keyframes exWelle\{[^}]*\}[^}]*\}[^}]*scale\(1\.28\)/.test(roh)],
   ['Die Buehne blendet weich aus', /await ov\.weg\(\);/.test(roh) && /\.exdone\.weg\{animation:halloWeg/.test(roh)],
   ['Der Stapel zaehlt die Monate mit', /const ov = exOverlay\(list\.length\), t0 = performance\.now\(\);/.test(roh)],
   /* ─── Das lebende Maennchen, seit 15.09.2026 ─────────────────── */
   ['Das Blatt kennt die bewegte Fassung',
    /const MOJI_LEBT\s+= 'moji-leben\.webp';/.test(roh)],
   ['Getauscht wird nicht mitten im Warten',
    /const lebt = _lebtDa && !ruhigGestellt\(\);/.test(roh)],
   ['Wer Bewegung abbestellt hat, bekommt das Standbild',
    /function lebenVorladen\(\)\{\s*\n\s*if\(_lebtDa \|\| ruhigGestellt\(\)\) return;/.test(roh)],
  ].forEach(([n, re]) => {
    const gut = (typeof re === 'boolean') ? re : re.test(roh);
    E.push({ n, ok: gut, z: gut ? '' : 'Regel fehlt' });
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
}, 1500);
