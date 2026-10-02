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
/* Seit 02.10.2026 steht der Vermerk am Feiertag in der PDF-Zeile
   („Nationalfeiertag · Inventur") und als Punkt im Kalender. */
ok('Die Bilanz zeigt den Feiertag und sagt, dass der Vermerk keine Stunden zaehlt',
   /Feiertag 8,00 h/.test(document.querySelector('#sh-bil').textContent)
   && document.querySelector('#sh-bil').textContent.indexOf('der Vermerk steht im PDF, zählt aber keine Stunden') >= 0,
   document.querySelector('#sh-bil').textContent);
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

/* ── 11c · Das Urlaubskonto: wertneutral in Urlaubswochen ──
   Gepruefte Rechtslage 02.10.2026: 5 Wochen im Jahr (§ 2 UrlG); ein
   Urlaubstag kostet einen Diensttag (OGH 9 ObA 78/24x); in Stunden nur
   wertneutral (Wochen × Wochenstunden); aendert sich der Plan, bleiben
   die Wochen (OGH 8 ObA 35/12y). Standardplan: Mo–Fr 8 h, Sa 4 h. */
var pwS = planWoche(defaultSched());
ok('Der Standardplan: 44 h an 6 Diensttagen', pwS.std === 44 && pwS.tage === 6, JSON.stringify(pwS));
var alt = normalize({ id:'a', vorname:'A', nachname:'B', dob:'1990-01-01', av:3, konten:{ topf:25, anspruch:25 } });
ok('Ein alter Topf von 25 Tagen bleibt 25 Tage', Math.abs(alt.konten.topfW * 6 - 25) < 1e-9, alt.konten.topfW);
ok('Und das Konto rechnet ab jetzt in Stunden', alt.konten.modus === 'stunden');
var alt28 = normalize({ id:'b', vorname:'A', nachname:'B', dob:'1990-01-01', av:3, konten:{ topf:25, topfStd:200, anspruch:25 } });
ok('Die Fassung vom 28.09. (200 h = 25 × 8 h) wird ebenso 25 Tage', Math.abs(alt28.konten.topfW * 6 - 25) < 1e-9, alt28.konten.topfW);
ok('Wer schon Wochen hat, wird nicht nochmal umgestellt',
   normalize({ id:'c', vorname:'A', nachname:'B', dob:'1990-01-01', av:3, konten:{ topf:99, topfStd:9, topfW:5 } }).konten.topfW === 5);
var j = new Date().getFullYear();
function probe(konten, ev, plan){
  var p = normalize({ id:'k', vorname:'K', nachname:'L', dob:'1990-01-01', av:3,
    konten: Object.assign({ topfW:5, anspruch:30, startJahr:j, gutJahr:j, gutJahrW:j }, konten || {}) });
  if(plan) plan(p);
  Object.keys(ev || {}).forEach(function(k){ p.events[k] = ev[k]; });
  return p;
}
/* Im Februar: der hat in Oesterreich nie einen Feiertag (im Juni koennen
   Pfingstmontag und Fronleichnam in die erste Woche fallen). */
function samstagIn(jahr){ for(var t = 1; t <= 7; t++){ if(new Date(jahr, 1, t).getDay() === 6) return t; } }
function montagIn(jahr){ for(var t = 1; t <= 7; t++){ if(new Date(jahr, 1, t).getDay() === 1) return t; } }
var kSa = key(j, 1, samstagIn(j)), kMo = key(j, 1, montagIn(j));
var b0 = kontenRechnen(probe());
ok('5 Wochen sind 220 h oder 30 Tage', b0.urlaubStd === 220 && Math.abs(b0.urlaub - 30) < 1e-9, b0.urlaubStd + ' / ' + b0.urlaub);
var ev1 = {}; ev1[kSa] = { t:'urlaub', s:'full' };
var sa = kontenRechnen(probe(null, ev1));
ok('Stundenkonto: ein Samstag mit 4 h kostet 4 h', sa.urlaubStd === 216, sa.urlaubStd);
var ev2 = {}; ev2[kMo] = { t:'urlaub', s:'full' };
var mo = kontenRechnen(probe(null, ev2));
ok('Und ein Montag 8 h', mo.urlaubStd === 212, mo.urlaubStd);
var saT = kontenRechnen(probe({ modus:'tage' }, ev1));
ok('Tagekonto: der Samstag ist ein ganzer Urlaubstag (OGH 9 ObA 78/24x)', Math.abs(saT.urlaub - 29) < 1e-9, saT.urlaub);
var ev3 = {}; ev3[kMo] = { t:'urlaub', s:'vm' };
ok('Tagekonto: ein Vormittag ist ein halber', Math.abs(kontenRechnen(probe({ modus:'tage' }, ev3)).urlaub - 29.5) < 1e-9);
/* Eine ganze Woche Urlaub kostet in beiden Rechenarten genau eine Woche. */
var woche = {}, mo0 = montagIn(j);
for(var t = 0; t < 6; t++) woche[key(j, 1, mo0 + t)] = { t:'urlaub', s:'full' };
ok('Eine Woche Urlaub: in Stunden genau 1 Woche weg', Math.abs(kontenRechnen(probe(null, woche)).urlaubW - 4) < 1e-9);
ok('Und in Tagen ebenso', Math.abs(kontenRechnen(probe({ modus:'tage' }, woche)).urlaubW - 4) < 1e-9);
/* Ungleiche Haelften: Vormittag bis zur Mittagspause, Nachmittag danach. */
var ung = probe(null, ev3, function(p){
  [1,2,3,4,5].forEach(function(t){ p.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'07:00', vmTo:'12:00', nmOn:true, nmFrom:'13:00', nmTo:'16:00' }; }); });
});
var uk = kontenRechnen(ung);
ok('Vormittag 07–12: genau 5 h weg', uk.urlaubStd === 215, uk.urlaubStd);
ok('Immer auf die Viertelstunde', [sa, mo, uk].every(function(x){ return Math.abs(x.urlaubStd * 4 - Math.round(x.urlaubStd * 4)) < 1e-9; }));
/* Teilzeit: drei Tage zu je 6 h. 5 Wochen sind 15 Tage oder 90 h. */
function teilzeit(p){
  p.sched.weeks.forEach(function(w){ for(var d = 1; d <= 6; d++) w[d] = (d <= 3)
    ? { vmOn:true, vmFrom:'08:00', vmTo:'12:00', nmOn:true, nmFrom:'13:00', nmTo:'15:00' }
    : { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; });
}
var tz = kontenRechnen(probe(null, null, teilzeit));
ok('Teilzeit 3 × 6 h: 5 Wochen sind 90 h oder 15 Tage', tz.urlaubStd === 90 && Math.abs(tz.urlaub - 15) < 1e-9, tz.urlaubStd + ' / ' + tz.urlaub);
/* Planwechsel: die Wochen bleiben, die Anzeige rechnet mit dem neuen Plan. */
var pw2 = probe(null, null, teilzeit);
ok('Wechsel von 6 auf 3 Diensttage: weiter 5 Wochen offen', kontenRechnen(pw2).urlaubW === 5);
/* Gegenpruefung vor dem Ausrollen (02.10.2026) */
{
  const zuk = new Date(); zuk.setDate(zuk.getDate() + 30);
  const bisIso = key(zuk.getFullYear(), zuk.getMonth(), zuk.getDate());
  const mf = normalize({ id:'mf', vorname:'M', nachname:'F', dob:'1990-01-01', av:3 });
  mf.sched.weeks.forEach(function(w){ w[6] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; });
  const zwei = JSON.parse(JSON.stringify(mf.sched));
  [3,4,5].forEach(function(t){ zwei.weeks.forEach(function(w){ w[t] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; }); });
  /* Gespeichert mit der alten Fassung: ein gedrehter Topf von 20 Tagen,
     Mo–Fr gilt bis in einem Monat, danach nur Mo+Di. */
  const um = normalize({ id:'um', vorname:'U', nachname:'M', dob:'1990-01-01', av:3,
    konten:{ topf:20, anspruch:25, startJahr:j, gutJahr:j }, sched: zwei, schedAlt:[{ bis: bisIso, sched: mf.sched }] });
  ok('Umstellung mit dem heute geltenden Plan: 20 Tage bleiben 20 (4 Wochen bei Mo–Fr)', Math.abs(um.konten.topfW - 4) < 1e-9, um.konten.topfW);
  ok('Und angezeigt 20 Tage', Math.abs(kontenRechnen(um).urlaub - 20) < 1e-9, kontenRechnen(um).urlaub);
  /* Einheit wechseln nach einem Planwechsel im Jahr: 5 Wochen bleiben 5. */
  const sechs = normalize({ id:'s6', vorname:'S', nachname:'X', dob:'1990-01-01', av:3 }).sched;
  const meAlt = ME;
  ME = probe({ anspruchW:5 }); ME.sched = JSON.parse(JSON.stringify(mf.sched)); ME.schedAlt = [{ bis: key(j, 0, 15), sched: sechs }];
  uaAuf(true); uaFrei(true);
  const knopf = function(e){ return document.querySelector('#ua-einheit [data-ue="' + e + '"]'); };
  tipp(knopf('tage'));
  ok('Nach dem Wechsel auf Mo–Fr: 5 Wochen sind 25 Tage', ME.konten.anspruch === 25, ME.konten.anspruch);
  tipp(knopf('wochen'));
  ok('Und zurueck genau 5 Wochen', ME.konten.anspruchW === 5, ME.konten.anspruchW);
  tipp(knopf('stunden')); tipp(knopf('wochen'));
  ok('Auch ueber Stunden', ME.konten.anspruchW === 5, ME.konten.anspruchW);
  uaFrei(false); uaAuf(false); ME = meAlt;
  /* tagLaengeAlt rechnet wie damals: rohe Bloecke, auch ueberlappend. */
  const ue = normalize({ id:'ue', vorname:'U', nachname:'E', dob:'1990-01-01', av:3 });
  [1,2,3,4,5].forEach(function(t){ ue.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'08:00', vmTo:'13:00', nmOn:true, nmFrom:'12:00', nmTo:'17:00' }; }); });
  ok('tagLaengeAlt bei 08–13 + 12–17: 10 h wie der alte Faktor', tagLaengeAlt(ue) === 10, tagLaengeAlt(ue));
}
/* Gutgeschrieben: der Anspruch in Tagen, mit dem Plan vom 1. Jaenner. */
var gut = probe({ topfW:0, anspruch:30, gutJahrW:j - 1, gutJahr:j - 1 });
urlaubGutschreiben(gut);
ok('30 Tage Anspruch bei 6 Diensttagen: 5 Wochen gutgeschrieben', Math.abs(gut.konten.topfW - 5) < 1e-9 && gut.konten.gutJahrW === j, gut.konten.topfW);
ok('Fuer aeltere Fassungen mitgefuehrt: 30 Tage, 220 h, Jahr', gut.konten.topf === 30 && gut.konten.topfStd === 220 && gut.konten.gutJahr === j);
var gutS = probe({ topfW:0, anspruch:220, anspruchEinheit:'stunden', gutJahrW:j - 1, gutJahr:j - 1 });
urlaubGutschreiben(gutS);
ok('220 h Anspruch bei 44 h pro Woche: ebenso 5 Wochen', Math.abs(gutS.konten.topfW - 5) < 1e-9, gutS.konten.topfW);
urlaubGutschreiben(gutS);
ok('Zweimal am selben Tag schreibt nicht doppelt gut', Math.abs(gutS.konten.topfW - 5) < 1e-9);
/* Die Anzeige: Stundenkonto vorn in Stunden, die Tage ungefaehr dahinter. */
ok('urlaubText im Stundenkonto', urlaubText(probe(), 5) === '220,00 h · ≈ 30 Tage', urlaubText(probe(), 5));
ok('urlaubText im Tagekonto', urlaubText(probe({ modus:'tage' }), 5) === '30 Tage · 220,00 h', urlaubText(probe({ modus:'tage' }), 5));
ok('Ein Tag heisst Tag', urlaubText(probe({ modus:'tage' }), 1/6, true) === '1 Tag');
/* Die alte Vorgabe „25 Tage" war als 5 Wochen gemeint (02.10.2026: 20 von
   21 Konten hatten sie nie geaendert, 11 davon mit 5½ oder 6 Diensttagen). */
function altProfil(konten, plan){
  var p = { id:'m', vorname:'M', nachname:'N', dob:'1990-01-01', av:3, konten: konten };
  if(plan){ var q = normalize({ id:'x', vorname:'X', nachname:'Y', dob:'1990-01-01', av:3 }); plan(q); p.sched = q.sched; }
  return normalize(p);
}
var v6 = altProfil({ topf:25, anspruch:25, startJahr:j, gutJahr:j });
ok('Nie geaendert, Mo–Sa: aus 25 Tagen werden 5 Wochen = 30 Tage', v6.konten.anspruchW === 5 && v6.konten.topfW === 5
   && Math.abs(kontenRechnen(v6).urlaub - 30) < 1e-9 && kontenRechnen(v6).urlaubStd === 220, JSON.stringify([v6.konten.anspruchW, v6.konten.topfW]));
var v5 = altProfil({ topf:25, anspruch:25, startJahr:j, gutJahr:j }, function(q){ q.sched.weeks.forEach(function(w){ w[6] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; }); });
ok('Mo–Fr: es bleiben 25 Tage, 200 h', v5.konten.topfW === 5 && Math.abs(kontenRechnen(v5).urlaub - 25) < 1e-9 && kontenRechnen(v5).urlaubStd === 200);
var vZwei = altProfil({ topf:50, anspruch:25, startJahr:j - 1, gutJahr:j });
ok('Zwei Jahre nur Vorgabe: 10 Wochen', vZwei.konten.topfW === 10, vZwei.konten.topfW);
var vDreh = altProfil({ topf:23, anspruch:25, startJahr:j, gutJahr:j });
ok('Am Rad gedreht: der Topf behaelt seine Tage, der Anspruch wird 5 Wochen',
   Math.abs(vDreh.konten.topfW * 6 - 23) < 1e-9 && vDreh.konten.anspruchW === 5, vDreh.konten.topfW);
var vEigen = altProfil({ topf:25, anspruch:28.5, startJahr:j, gutJahr:j });
ok('Ein eigener Anspruch bleibt, wie er ist', vEigen.konten.anspruch === 28.5 && !('anspruchW' in vEigen.konten)
   && Math.abs(vEigen.konten.topfW * 6 - 25) < 1e-9);
var vStd = altProfil({ topf:27.5, anspruch:200, anspruchEinheit:'stunden', startJahr:j, gutJahr:j });
ok('Ein Anspruch in Stunden ebenso', vStd.konten.anspruch === 200 && vStd.konten.anspruchEinheit === 'stunden' && !('anspruchW' in vStd.konten));
var vNeu = normalize({ id:'n', vorname:'N', nachname:'O', dob:'1990-01-01', av:3 });
ok('Ein neues Profil: 5 Wochen, leerer Topf', vNeu.konten.anspruchW === 5 && vNeu.konten.topfW === 0);
urlaubGutschreiben(vNeu);
ok('Gutgeschrieben: 5 Wochen', vNeu.konten.topfW === 5 && vNeu.konten.gutJahrW === j);
ok('Fuer aeltere Fassungen in Tagen gespiegelt, nie als „wochen"',
   vNeu.konten.anspruch === 30 && vNeu.konten.anspruchEinheit === 'tage', JSON.stringify([vNeu.konten.anspruch, vNeu.konten.anspruchEinheit]));
var vRund = normalize(JSON.parse(JSON.stringify(vNeu)));
ok('Neu geladen: weiter 5 Wochen, nichts doppelt', vRund.konten.anspruchW === 5 && vRund.konten.topfW === 5 && anspruchWochen(vRund) === 5);
/* Eine alte Fassung schrieb den Spiegel um (etwa Teilzeit-Plan dort) —
   die Wochen gelten trotzdem. */
vRund.konten.anspruch = 15; vRund.konten.topf = 3;
ok('Der Spiegel zaehlt nicht, die Wochen schon', anspruchWochen(vRund) === 5 && kontenRechnen(vRund).urlaubW === 5);
ok('anspruchWort in Wochen', anspruchWort(vNeu) === '5 Wochen im Jahr', anspruchWort(vNeu));
ok('anspruchWort in Tagen', anspruchWort(vEigen) === '28,5 Tage im Jahr (4,8 Wochen)', anspruchWort(vEigen));

/* Der Hinweis zum Anspruch nennt das gesetzliche Minimum, wenn es fehlt. */
var meVor = ME;
ME = probe({ anspruch:25 }); uaAuf(true);
var hint = document.querySelector('#ua-hint');
ok('25 Tage bei 6 Diensttagen: Hinweis auf 5 Wochen = 30 Tage',
   !!hint.querySelector('.uamin') && hint.textContent.indexOf('mindestens 5 Wochen') >= 0 && hint.textContent.indexOf('30 Tage oder 220,00 h') >= 0, hint.textContent);
ME.konten.anspruch = 30; malAnspruch();
ok('30 Tage: kein Hinweis', !hint.querySelector('.uamin') && hint.textContent.indexOf('5 Wochen') >= 0, hint.textContent);
/* Drei Einheiten; der Wechsel nimmt denselben Anspruch mit, ueber die Wochen. */
ME = probe({ anspruchW:5 }); uaAuf(true); uaFrei(true);
var ein = function(e){ return document.querySelector('#ua-einheit [data-ue="' + e + '"]'); };
ok('Drei Knoepfe: Wochen, Tage, Stunden', document.querySelectorAll('#ua-einheit button').length === 3 && ein('wochen').classList.contains('on'));
ok('In Wochen: 5 Wochen, darunter 30 Tage oder 220 h', document.querySelector('#ua-wert').textContent === '5'
   && document.querySelector('#ua-einh').textContent === 'Wochen' && hint.textContent.indexOf('sind das 30 Tage oder 220,00 h') >= 0, hint.textContent);
ok('Und kein Hinweis aufs Minimum', !hint.querySelector('.uamin'));
tipp(ein('tage'));
ok('Wechsel zu Tagen: 30 Tage', ME.konten.anspruch === 30 && ME.konten.anspruchEinheit === 'tage' && !('anspruchW' in ME.konten)
   && document.querySelector('#ua-wert').textContent === '30');
tipp(ein('stunden'));
ok('Zu Stunden: 220 h', ME.konten.anspruch === 220 && ME.konten.anspruchEinheit === 'stunden');
tipp(ein('wochen'));
ok('Zurueck zu Wochen: genau 5', ME.konten.anspruchW === 5, ME.konten.anspruchW);
uaSchritt(1);
ok('Plus in Wochen: eine halbe mehr', ME.konten.anspruchW === 5.5);
uaSchritt(-1); uaSchritt(-1);
ok('Unter 5 Wochen kommt der Hinweis', ME.konten.anspruchW === 4.5 && !!hint.querySelector('.uamin'));
uaFrei(false); uaAuf(false); ME = meVor;
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

/* ── 13 · Befunde der Pruefung vom 02.10.2026 ── */
var zaH = function(){ return document.querySelector('#sh-za-h'); };
/* nicht save nennen, das ist die Speicherfunktion der App */
var spKnopf = function(){ return document.querySelector('#sh-save'); };
/* a · Eine gespeicherte Einloesung am Sonntag und am Feiertag zaehlt 0 h.
   Frueher drehte das Blatt sie still zu „Sammeln" — Speichern buchte +4 h. */
[[2026, 10, 8, 'Sonntag'], [2026, 11, 8, 'Feiertag']].forEach(function(f){
  var k = key(f[0], f[1], f[2]);
  ME.events[k] = { t:'zeit', za:-4 };
  var zaVor = kontenRechnen(ME).za;
  openSheet(f[0], f[1], f[2]);
  ok(f[3] + ': die Einloesung bleibt Einloesung', SH.zaDir === 'minus' && SH.zaH === 4, SH.zaDir + ' ' + SH.zaH);
  ok(f[3] + ': der Hinweis sagt, dass sie 0 h zaehlt', !zaH().hidden && zaH().textContent.indexOf('der Eintrag zählt 0 h') >= 0, zaH().textContent);
  ok(f[3] + ': Speichern ist aus', spKnopf().disabled);
  tipp(spKnopf());
  ok(f[3] + ': nichts gebucht', ME.events[k].za === -4 && kontenRechnen(ME).za === zaVor);
  tipp(document.querySelector('#sh-zadir [data-dir="plus"]'));
  ok(f[3] + ': bewusst Sammeln faengt bei 1 h an', SH.zaDir === 'plus' && SH.zaH === 1 && !spKnopf().disabled && zaH().hidden);
  closeSheet(); delete ME.events[k];
});
/* b · Zeitausgleich ohne gueltige Menge: nicht still 1 h vorbelegen. */
ME.events['2026-11-10'] = { t:'zeit', za:0 };
openSheet(2026, 10, 10);
ok('Ohne Menge steht 0 da, Speichern ist aus', SH.zaH === 0 && spKnopf().disabled);
closeSheet(); delete ME.events['2026-11-10'];
/* c · Sammeln: hoechstens, was der Tag hergibt. */
openSheet(2026, 10, 11); tipp(kachel('zeit'));
zaSetz(30);
ok('Am 8-h-Tag mit 1 h Pause hoechstens 15 h', SH.zaH === 15 && document.querySelector('#sh-zaplus').disabled, SH.zaH);
ok('Ueber 12 h Arbeit warnt die Bilanz (§ 9 AZG)', !!document.querySelector('#sh-bil .shbil-warn'));
zaSetz(2);
ok('Bei 10 h nicht', !document.querySelector('#sh-bil .shbil-warn'));
closeSheet();
openSheet(2026, 11, 8); tipp(kachel('zeit')); zaSetz(30);
ok('Am Feiertag hoechstens 24 h', SH.zaH === 24, SH.zaH);
closeSheet();
/* d · Einloesen an zwei ungleichen Bloecken: Vormittag und Nachmittag. */
var schedVor = JSON.parse(JSON.stringify(ME.sched));
ME.sched.weeks.forEach(function(w){ w[3] = { vmOn:true, vmFrom:'08:00', vmTo:'13:00', nmOn:true, nmFrom:'14:00', nmTo:'17:00' }; });
openSheet(2026, 10, 11); tipp(kachel('zeit')); tipp(document.querySelector('#sh-zadir [data-dir="minus"]'));
var kn = Array.prototype.map.call(document.querySelectorAll('#sh-zatag button'), function(b){ return b.textContent; });
ok('Einloesen: Vormittag 5 h, Nachmittag 3 h, ganzer Tag 8 h',
   kn.join('|') === 'Vormittag5,00 h|Nachmittag3,00 h|Ganzer Tag8,00 h', kn.join('|'));
tipp(document.querySelector('#sh-zadir [data-dir="plus"]'));
ok('Sammeln: halber und ganzer Tag', document.querySelectorAll('#sh-zatag button').length === 2);
closeSheet();
ME.sched = schedVor;
/* e · Zaehlt der gespeicherte Eintrag anders, steht der bisherige Stand dabei. */
ME.events['2026-11-14'] = { t:'urlaub', s:'nm', text:'', aw:false };     /* Samstag, nur 08–12 */
openSheet(2026, 10, 14);
var bis = document.querySelector('#sh-bil .shbil-bisher');
ok('Alter „Nachmittag" am Samstag: Bisher gezaehlt 4 h Arbeit', !!bis && bis.textContent === 'Bisher gezählt: Arbeit 4,00 h', bis && bis.textContent);
closeSheet();
ME.events['2026-11-14'] = { t:'urlaub', s:'full', text:'', aw:false };
openSheet(2026, 10, 14);
ok('Zaehlt er gleich, steht nichts dabei', !document.querySelector('#sh-bil .shbil-bisher'));
tipp(kachel('krank'));
ok('Ein Wechsel der Art zeigt, was bisher galt', document.querySelector('#sh-bil .shbil-bisher').textContent === 'Bisher gezählt: Urlaub 4,00 h');
closeSheet(); delete ME.events['2026-11-14'];
/* f · Der Vermerk am Feiertag ist im Kalender zu sehen. */
ME.events['2026-12-08'] = { t:'eigen', s:'full', text:'Inventur', aw:false };
CAL.y = 2026; CAL.m = 11; renderCal();
var z8 = document.querySelector('#cal-grid .cell[data-d="8"]');
ok('Feiertag mit Vermerk: Punkt in der Zelle', z8.classList.contains('vermerk') && z8.dataset.t === 'feier');
ok('Ohne Vermerk keiner', !document.querySelector('#cal-grid .cell[data-d="25"]').classList.contains('vermerk'));
delete ME.events['2026-12-08'];
/* g · Ein Serientag, unveraendert gespeichert, bleibt in der Serie. */
ME.events['2026-11-16'] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-11-16>2026-11-17' };
ME.events['2026-11-17'] = { t:'urlaub', s:'full', text:'', aw:false, ser:'2026-11-16>2026-11-17' };
openSheet(2026, 10, 17); tipp(kachel('urlaub')); tipp(kachel('urlaub'));
ok('Vor dem Speichern noch Urlaub gewaehlt', SH.type === 'urlaub');
tipp(spKnopf());
ok('Unveraendert gespeichert: Kennung bleibt', ME.events['2026-11-17'].ser === '2026-11-16>2026-11-17');
openSheet(2026, 10, 17); tipp(kachel('krank')); tipp(spKnopf());
ok('Zu Krankenstand geaendert: nicht mehr Teil des Urlaubs', !ME.events['2026-11-17'].ser && serieVon(2026, 10, 16).length === 1);
delete ME.events['2026-11-16']; delete ME.events['2026-11-17'];
CAL.y = 2026; CAL.m = 8; renderCal();

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
