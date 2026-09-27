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

/* ── 9 · Als Arbeitszeit zaehlen nur, wo Dienst waere ──
   27.09.2026, Marco: an einem Tag ohne Dienst soll der Schalter nicht
   gehen. Dasselbe am Feiertag und fuer eine Tageshaelfte ohne Dienst. */
var awS = document.querySelector('#sh-aw'), awT = document.querySelector('#sh-aw-t');
function vermerk(y, m, d){ openSheet(y, m, d); tipp(kachel('eigen')); }

vermerk(2026, 8, 15);                               /* Dienstag, 8 h, unberuehrt */
ok('An einem Arbeitstag geht der Schalter', !awS.disabled, awT.textContent);
ok('Und sagt, wie viele Stunden zaehlen', awT.textContent === 'Stunden als Arbeitszeit zählen · 8,00 h', awT.textContent);
tipp(awS);
ok('Er laesst sich einschalten', SH.aw === true && awS.getAttribute('aria-pressed') === 'true');
tipp(document.querySelector('#sh-save'));
ok('Und wird gespeichert', ME.events['2026-09-15'] && ME.events['2026-09-15'].aw === true);
ok('Die Stunden zaehlen als Arbeit', evalDay(ME, 2026, 8, 15).work === 8 && evalDay(ME, 2026, 8, 15).sonst === 0);
delete ME.events['2026-09-15'];

vermerk(2026, 8, 27);                               /* Sonntag, frei */
ok('An einem freien Tag ist er gesperrt', awS.disabled && !SH.aw);
ok('Und nennt den Grund', awT.textContent === 'An diesem Tag hast du keinen Dienst', awT.textContent);
ok('Die Zeile tritt zurueck', document.querySelector('#sh-aw-zeile').classList.contains('aus'));
tipp(awS);
ok('Ein Tipp aendert nichts', SH.aw === false);
SH.aw = true;                                       /* auch wenn ihn etwas von aussen setzt */
tipp(document.querySelector('#sh-save'));
ok('Gespeichert wird er dort nie', ME.events['2026-09-27'] && ME.events['2026-09-27'].aw === false,
   JSON.stringify(ME.events['2026-09-27']));
delete ME.events['2026-09-27'];

vermerk(2026, 8, 26);                               /* Samstag, nur vormittags */
ok('Samstag: die 4 h des einen Dienstblocks', !awS.disabled && / 4,00 h$/.test(awT.textContent), awT.textContent);
closeSheet();

vermerk(2026, 9, 26);                               /* Nationalfeiertag, Montag */
ok('Am Feiertag gesperrt', awS.disabled, awT.textContent);
ok('Weil der Feiertag gilt', awT.textContent === 'Am Feiertag zählt nichts als Arbeitszeit', awT.textContent);
closeSheet();

/* ── 10 · Halbe Tage nur, wo es zwei Dienstbloecke gibt ──
   Nachgerechnet am 27.09.2026: am Samstag (nur 08–12) war „Vormittag
   Urlaub" ein ganzer Urlaubstag und „Nachmittag Urlaub" zaehlte nichts. */
openSheet(2026, 8, 26); tipp(kachel('urlaub'));
var umf = function(w){ return document.querySelector('#sh-scope [data-s="' + w + '"]'); };
ok('Samstag: Vormittag und Nachmittag sind gesperrt', umf('vm').disabled && umf('nm').disabled && !umf('full').disabled);
ok('Der Hinweis nennt den einen Block',
   !document.querySelector('#sh-scope-h').hidden
   && document.querySelector('#sh-scope-h').textContent === 'An diesem Tag hast du nur einen Dienstblock (08:00–12:00) — es zählt der ganze Tag.',
   document.querySelector('#sh-scope-h').textContent);
tipp(umf('nm'));
ok('Ein Tipp auf Nachmittag aendert nichts', SH.scope === 'full');
SH.scope = 'vm'; paintSheet();
ok('Auch von aussen gesetzt wird es der ganze Tag', SH.scope === 'full');
ok('Die Bilanz: 4 h Urlaub, nichts gearbeitet', /Urlaub 4,00 h/.test(document.querySelector('#sh-bil').textContent)
   && !/Arbeit/.test(document.querySelector('#sh-bil').textContent), document.querySelector('#sh-bil').textContent);
closeSheet();
openSheet(2026, 8, 17); tipp(kachel('urlaub'));
ok('Donnerstag mit zwei Bloecken: halbe Tage gehen', !umf('vm').disabled && !umf('nm').disabled
   && document.querySelector('#sh-scope-h').hidden);
tipp(umf('vm'));
var bil = document.querySelector('#sh-bil').textContent;
ok('Vormittag Urlaub: die Bilanz zeigt 4 h Arbeit und 4 h Urlaub', /Arbeit 4,00 h/.test(bil) && /Urlaub 4,00 h/.test(bil), bil);
ok('Und oben die Summe des Tages', document.querySelector('.shbil-kopf b').textContent === '8,00 h');
var kz = document.querySelector('#sh-konto').textContent;
var kzStd = (kz.match(/([0-9]+,[0-9]{2}) h/g) || []).map(function(x){ return parseFloat(x.replace(',', '.')); });
ok('Das Urlaubskonto rechnet 4 h ab — einen halben Tag', kzStd.length === 2 && Math.abs(kzStd[0] - kzStd[1] - 4) < 0.001, kz);
tipp(kachel('krank'));
ok('Krankenstand am Vormittag: 4 h Krankenstand, 4 h Arbeit', /Krankenstand 4,00 h/.test(document.querySelector('#sh-bil').textContent)
   && /Arbeit 4,00 h/.test(document.querySelector('#sh-bil').textContent));
tipp(kachel('eigen'));
tipp(umf('full'));
ok('Vermerk ganzer Tag: 8 h Vermerk', /Vermerk 8,00 h/.test(document.querySelector('#sh-bil').textContent));
tipp(awS);
ok('Als Arbeitszeit: 8 h Arbeit, kein Vermerk mehr', /Arbeit 8,00 h/.test(document.querySelector('#sh-bil').textContent)
   && document.querySelector('#sh-bil').textContent.indexOf('Vermerk 8') < 0, document.querySelector('#sh-bil').textContent);
closeSheet();

/* ── 11 · Was an einem Tag nichts zaehlen kann, ist nicht waehlbar ── */
openSheet(2026, 8, 27);                             /* Sonntag */
ok('Sonntag: Urlaub und Krankenstand gesperrt', kachel('urlaub').disabled && kachel('krank').disabled);
ok('Mit Grund in der Kachel', kachel('urlaub').querySelector('small').textContent === 'Kein Dienst an diesem Tag');
ok('Zeitausgleich und Vermerk gehen', !kachel('zeit').disabled && !kachel('eigen').disabled);
tipp(kachel('urlaub'));
ok('Ein Tipp auf die gesperrte Kachel waehlt nichts', SH.type === null);
tipp(kachel('eigen'));
ok('Vermerk am Sonntag: die Bilanz sagt, dass nichts zaehlt',
   /Kein Dienst geplant/.test(document.querySelector('#sh-bil').textContent));
ok('Und es gibt keinen Umfang', document.querySelector('#sh-scopewrap').style.display === 'none');
tipp(kachel('zeit'));
ok('Zeitausgleich am Sonntag: Einloesen gesperrt, Sammeln gewaehlt',
   document.querySelector('#sh-zadir [data-dir="minus"]').disabled && SH.zaDir === 'plus');
ok('Sammeln zaehlt als Arbeit und aufs Konto', /Arbeit 1,00 h/.test(document.querySelector('#sh-bil').textContent)
   && document.querySelector('#sh-bil').textContent.indexOf('+1,00 h auf dein Zeitausgleich-Konto') >= 0, document.querySelector('#sh-bil').textContent);
closeSheet();
openSheet(2026, 9, 26);                             /* Nationalfeiertag */
ok('Feiertag: Urlaub und Krankenstand gesperrt, Zeitausgleich und Vermerk gehen',
   kachel('urlaub').disabled && kachel('krank').disabled && !kachel('zeit').disabled && !kachel('eigen').disabled);
tipp(kachel('eigen'));
ok('Die Bilanz zeigt den Feiertag und sagt, dass der Eintrag nichts aendert',
   /Feiertag 8,00 h/.test(document.querySelector('#sh-bil').textContent)
   && /ein Eintrag ändert an diesem Tag nichts/.test(document.querySelector('#sh-bil').textContent));
closeSheet();

/* ── 11b · Am Feiertag gearbeitet: Zeitausgleich sammeln ──
   Marco, 28.09.2026: im Handel hat man an manchen Feiertagen offen. */
openSheet(2026, 9, 26); tipp(kachel('zeit'));
ok('Einloesen ist am Feiertag gesperrt', document.querySelector('#sh-zadir [data-dir="minus"]').disabled && SH.zaDir === 'plus');
zaSetz(6);
var bF = document.querySelector('#sh-bil').textContent;
ok('Die Bilanz: Feiertag 8 h und 6 h Arbeit', /Feiertag 8,00 h/.test(bF) && /Arbeit 6,00 h/.test(bF), bF);
ok('Und die 6 h aufs Konto', bF.indexOf('+6,00 h auf dein Zeitausgleich-Konto') >= 0 && bF.indexOf('ändert an diesem Tag nichts') < 0, bF);
var zaVor = kontenRechnen(ME).za;
tipp(document.querySelector('#sh-save'));
var fT = evalDay(ME, 2026, 9, 26);
ok('Gerechnet: Feiertag bleibt, 6 h Arbeit, 6 h Zeitausgleich', fT.type === 'feier' && fT.feier === 8 && fT.work === 6 && fT.za === 6);
ok('Die Zeile fuers PDF nennt beides', fT.note === 'Nationalfeiertag · 6,00 h gesammelt', fT.note);
ok('Das Konto steigt um 6 h', Math.abs(kontenRechnen(ME).za - zaVor - 6) < 0.001);
ME.events['2026-10-26'] = { t:'zeit', za:-4 };
ok('Ein Einloesen am Feiertag zaehlt nichts', evalDay(ME, 2026, 9, 26).za === 0 && evalDay(ME, 2026, 9, 26).work === 0);
delete ME.events['2026-10-26'];

/* ── 11c · Das Urlaubskonto rechnet in Stunden ──
   Marco, 28.09.2026: im Hintergrund immer in Viertelstunden, Tage nur
   zum Anzeigen — umgerechnet mit dem ueblichen Diensttag. */
ok('Der uebliche Diensttag ist 8 h, nicht der Durchschnitt 7,33 h', tagFaktor(ME) === 8, tagFaktor(ME));
var alt = normalize({ id:'a', vorname:'A', nachname:'B', dob:'1990-01-01', av:3, konten:{ topf:25, anspruch:25 } });
ok('Ein alter Topf in Tagen wird zu Stunden', alt.konten.topfStd === 200, alt.konten.topfStd);
ok('25 Tage Anspruch sind 200 h', anspruchStd(alt) === 200);
/* Anspruch in Stunden: 200 h wurden frueher mit dem Schnitt 7,25 h zu
   27,5 Tagen. Zurueck mit demselben Schnitt, nicht mit 8 h. */
var altStd = normalize({ id:'s', vorname:'S', nachname:'T', dob:'1990-01-01', av:3,
  konten:{ topf:27.5, anspruch:200, anspruchEinheit:'stunden' } });
/* Genauer als die alte Rundung auf halbe Tage geht es nicht: 27,5 x 7,25
   = 199,375, auf die Viertelstunde 199,5 h. Mit 8 h waeren es 220 h. */
ok('Wer in Stunden rechnete, behaelt seine Stunden (bis auf die alte Rundung)',
   altStd.konten.topfStd === 199.5, altStd.konten.topfStd);
alt.konten.gutJahr = new Date().getFullYear() - 1; urlaubGutschreiben(alt);
ok('Gutgeschrieben wird in Stunden', alt.konten.topfStd === 400 && alt.konten.topf === 50, alt.konten.topfStd);
var j = new Date().getFullYear();
function probeKonto(ev, y, m, d){
  var p = normalize({ id:'k', vorname:'K', nachname:'L', dob:'1990-01-01', av:3, konten:{ topfStd:200, anspruch:25, startJahr:j, gutJahr:j } });
  if(ev) p.events[key(y, m, d)] = ev;
  return kontenRechnen(p);
}
var basis = probeKonto(null);
ok('Ohne Urlaub: 200 h, 25 Tage', basis.urlaubStd === 200 && basis.urlaub === 25);
function samstagIn(jahr){ for(var t = 1; t <= 7; t++){ if(new Date(jahr, 5, t).getDay() === 6) return t; } }
function montagIn(jahr){ for(var t = 1; t <= 7; t++){ if(new Date(jahr, 5, t).getDay() === 1) return t; } }
var sa = probeKonto({ t:'urlaub', s:'full' }, j, 5, samstagIn(j));
ok('Ein Samstag mit 4 h: 4 h weg, ein halber Tag', sa.urlaubStd === 196 && sa.urlaub === 24.5, sa.urlaubStd);
var mo = probeKonto({ t:'urlaub', s:'full' }, j, 5, montagIn(j));
ok('Ein Montag mit 8 h: ein ganzer Tag', mo.urlaubStd === 192 && mo.urlaub === 24);
/* Ungleiche Haelften: Vormittag bis zur Mittagspause, Nachmittag danach. */
var ung = normalize({ id:'u', vorname:'U', nachname:'V', dob:'1990-01-01', av:3, konten:{ topfStd:200, anspruch:25, startJahr:j, gutJahr:j } });
[1,2,3,4,5].forEach(function(t){ ung.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'07:00', vmTo:'12:00', nmOn:true, nmFrom:'13:00', nmTo:'16:00' }; }); });
ung.events[key(j, 5, montagIn(j))] = { t:'urlaub', s:'vm' };
var uk = kontenRechnen(ung);
ok('Vormittag 07–12 bei einem 8-h-Tag: genau 5 h weg', uk.urlaubStd === 195, uk.urlaubStd);
ok('Das sind 0,625 Tage, angezeigt 0,6', Math.abs(uk.genommen - 0.625) < 0.001 && fmtUT(uk.genommen) === '0,6');
ok('Immer auf die Viertelstunde', [sa, mo, uk].every(function(x){ return Math.abs(x.urlaubStd * 4 - Math.round(x.urlaubStd * 4)) < 1e-9; }));
closeSheet();

/* ── 12 · Einloesen hoechstens, was geplant ist ──
   Vorher liess sich −10 h einstellen, abgezogen wurden 8. */
openSheet(2026, 8, 17); tipp(kachel('zeit'));
tipp(document.querySelector('#sh-zadir [data-dir="minus"]'));
zaSetz(10);
ok('Einloesen bleibt bei den 8 geplanten Stunden', SH.zaH === 8, SH.zaH);
ok('Plus ist dann aus', document.querySelector('#sh-zaplus').disabled);
ok('Die Bilanz: 8 h aus dem Konto, keine Arbeit', /8,00 h aus deinem Zeitausgleich-Konto/.test(document.querySelector('#sh-bil').textContent)
   && !/Arbeit/.test(document.querySelector('#sh-bil').textContent), document.querySelector('#sh-bil').textContent);
tipp(document.querySelector('#sh-zadir [data-dir="plus"]'));
zaSetz(10);
ok('Sammeln darf mehr', SH.zaH === 10 && !document.querySelector('#sh-zaplus').disabled);
ok('Und rechnet 18 h Arbeit', /Arbeit 18,00 h/.test(document.querySelector('#sh-bil').textContent));
tipp(document.querySelector('#sh-zadir [data-dir="minus"]'));
ok('Zurueck auf Einloesen: wieder hoechstens 8', SH.zaH === 8, SH.zaH);
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
   ['Der Umfang hat einen Schieber', /#sh-scope::before\{/],
   ['Schliessen gleitet nach unten weg', /#sheet\.zu \.sheet-card\{animation:shRaus/],
   ['Nach einem Wurf mit dem Finger sofort', /karte\.classList\.contains\('weg'\)\)\)\{\s*\n\s*bl\.classList\.remove\('on', 'zu', 'frisch'\)/],
   ['Die Farbe kommt aus den Marken der Fassung', /getPropertyValue\('--c-' \+ SH\.type\)/],
   ['Gesperrte Schalter sind blass', /\.toggle:disabled\{opacity:\.38;cursor:not-allowed\}/],
   ['Gespeichert wird aw nur, wo es Stunden gibt', /aw:SH\.type === 'eigen' \? \(SH\.aw && shAwStunden\(\) > 0\) : false/],
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
