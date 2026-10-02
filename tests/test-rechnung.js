/* Testlauf: Die Tagesrechnung — evalDay, dayPlan, monthSums, Feiertage.

   Entstanden aus der Pruefung aller Rechnungen am 02.10.2026 (Recherche
   zum oesterreichischen Recht, ein Pruefer je Bereich, jeder Befund
   zweimal gegengeprueft). Jeder Abschnitt haelt einen bestaetigten
   Befund fest, damit er nicht wiederkommt.

   Standard-Dienstplan: Mo–Fr 08–12 + 13–17 (8 h, 1 h Pause), Sa 08–12. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const roh = fs.readFileSync(DATEI, 'utf8');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));
const dom = new JSDOM(roh, { url: 'https://moji-app.at/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }
function profil(ev){
  var p = normalize({ id:'t', vorname:'A', nachname:'B', dob:'1990-01-01', av:3, events: ev || {} });
  return p;
}
function tag(p, iso){ var t = iso.split('-').map(Number); return evalDay(p, t[0], t[1] - 1, t[2]); }

/* ── 1 · Feiertage: genau die 13 aus § 7 Abs 2 ARG, Ostern richtig ── */
var OSTERN = { 2024:'2024-03-31', 2025:'2025-04-20', 2026:'2026-04-05', 2027:'2027-03-28', 2028:'2028-04-16',
               2029:'2029-04-01', 2030:'2030-04-21', 2031:'2031-04-13', 2032:'2032-03-28', 2033:'2033-04-17',
               2034:'2034-04-09', 2035:'2035-03-25' };
var plus = function(iso, n){ var t = iso.split('-').map(Number); var d = new Date(t[0], t[1] - 1, t[2] + n); return key(d.getFullYear(), d.getMonth(), d.getDate()); };
var fehler = [];
Object.keys(OSTERN).forEach(function(y){
  var h = holidays(+y), o = OSTERN[y];
  var soll = [y+'-01-01', y+'-01-06', plus(o,1), y+'-05-01', plus(o,39), plus(o,50), plus(o,60),
              y+'-08-15', y+'-10-26', y+'-11-01', y+'-12-08', y+'-12-25', y+'-12-26'];
  soll.forEach(function(k){ if(!h[k]) fehler.push(k); });
  if(Object.keys(h).length !== new Set(soll).size) fehler.push(y + ': ' + Object.keys(h).length + ' statt 13');
  if(h[plus(o,-2)]) fehler.push(y + ': Karfreitag');
  if(h[y+'-12-24'] || h[y+'-12-31']) fehler.push(y + ': 24./31.12.');
});
ok('2024–2035: genau die 13 gesetzlichen Feiertage, Ostern richtig, kein Karfreitag, kein 24./31.12.', !fehler.length, fehler.join(', '));

/* ── 2 · Nur echte Eintragsarten ──
   Ein gespeicherter Eintrag 'feier' loeschte die Planstunden eines
   normalen Tages (TYPES kennt 'feier' fuer die Anzeige). */
var pF = profil({ '2026-09-16': { t:'feier', s:'full' }, '2026-09-17': { t:'urlaub', s:'xy' } });
ok('normalize wirft einen Eintrag "feier" hinaus', !pF.events['2026-09-16']);
ok('Ein unbekannter Umfang wird zum ganzen Tag', pF.events['2026-09-17'].s === 'full');
var pR = profil(); pR.events['2026-09-16'] = { t:'feier', s:'full' };
ok('Auch ohne normalize: evalDay uebergeht ihn, der Tag hat seine 8 h', tag(pR, '2026-09-16').work === 8 && tag(pR, '2026-09-16').type === null);
pR.events['2026-09-16'] = { t:'urlaub', s:'abc' };
ok('Und rechnet einen unbekannten Umfang als ganzen Tag, nicht als Nachmittag', tag(pR, '2026-09-16').urlaub === 8 && tag(pR, '2026-09-16').scope === 'full');

/* ── 3 · Am Feiertag ── */
var pH = profil({ '2026-12-08': { t:'eigen', s:'full', text:'Inventur', aw:false } });
var h8 = tag(pH, '2026-12-08');
ok('Ein Vermerk am Feiertag steht in der Zeile', h8.note === 'Mariä Empfängnis · Inventur', h8.note);
ok('Und aendert keine Stunden', h8.type === 'feier' && h8.feier === 8 && h8.sonst === 0 && h8.work === 0);
pH.events['2026-12-08'] = { t:'zeit', za:30 };
ok('Am Feiertag gesammelt: hoechstens 24 h', tag(pH, '2026-12-08').za === 24 && tag(pH, '2026-12-08').feier === 8);

/* ── 4 · Zeitausgleich ── */
var pZ = profil({ '2026-09-20': { t:'zeit', za:-2 }, '2026-09-21': { t:'zeit', za:20 }, '2026-09-22': { t:'zeit', za:-10 } });
var so = tag(pZ, '2026-09-20');
ok('Einloesen am Sonntag: nichts, und kein -0', so.za === 0 && !Object.is(so.za, -0), so.za);
ok('Und die Zeile sagt es', so.note === 'Zeitausgleich · kein Dienst, nichts eingelöst', so.note);
var mo = tag(pZ, '2026-09-21');
ok('Sammeln am Montag: hoechstens 24 − 8 h − 1 h Pause = 15 h', mo.za === 15 && mo.work === 23, mo.za + ' / ' + mo.work);
ok('Einloesen hoechstens, was geplant ist', tag(pZ, '2026-09-22').za === -8 && tag(pZ, '2026-09-22').work === 0);

/* ── 5 · Vermerk als Arbeitszeit behaelt Uhrzeiten und Pause ── */
var pA = profil({ '2026-09-16': { t:'eigen', s:'full', text:'Messe', aw:true }, '2026-09-17': { t:'eigen', s:'vm', text:'Kurs', aw:true },
                  '2026-09-18': { t:'eigen', s:'vm', text:'Arzt', aw:false } });
var a1 = tag(pA, '2026-09-16');
ok('Ganzer Tag als Arbeitszeit: 8 h, Zeiten und Pause wie geplant',
   a1.work === 8 && a1.sonst === 0 && a1.pause === 1 && a1.vmFrom === '08:00' && a1.nmTo === '17:00', JSON.stringify([a1.work, a1.pause, a1.vmFrom, a1.nmTo]));
var a2 = tag(pA, '2026-09-17');
ok('Vormittag als Arbeitszeit: weiter 8 h, nicht doppelt', a2.work === 8 && a2.sonst === 0 && a2.vmFrom === '08:00', a2.work);
var a3 = tag(pA, '2026-09-18');
ok('Ohne Arbeitszeit: 4 h Vermerk, 4 h Arbeit, keine Pause', a3.work === 4 && a3.sonst === 4 && a3.pause === 0 && !a3.vmFrom);

/* ── 6 · Freier Tag im Zeitraum folgt dem Plan ──
   Bekam ein „freier" Tag spaeter Dienst, zaehlte er als Urlaub und sagte
   trotzdem „kein Dienst" / „wird nicht abgezogen". */
var pS = profil({ '2026-09-19': { t:'urlaub', s:'full', ser:'2026-09-14>2026-09-25', frei:true },
                  '2026-09-20': { t:'urlaub', s:'full', ser:'2026-09-14>2026-09-25', frei:true } });
var sa = tag(pS, '2026-09-19'), sn = tag(pS, '2026-09-20');
ok('Samstag mit Dienst: zaehlt als Urlaubstag des Zeitraums, ohne „kein Dienst"', sa.urlaub === 4 && !sa.frei && sa.note === 'Urlaub', JSON.stringify([sa.urlaub, sa.frei, sa.note]));
ok('Sonntag: bleibt frei, zaehlt nichts', sn.urlaub === 0 && sn.frei === true && sn.note === 'Urlaub · kein Dienst');

/* ── 7 · Feiertag mit Arbeit ist ein ganzer Feiertag ── */
var dez0 = monthSums(monthRows(profil(), 2026, 11));
var pD = profil({ '2026-12-08': { t:'zeit', za:6 } });
var dez = monthSums(monthRows(pD, 2026, 11));
ok('Dezember 2026: 3 Feiertage, auch mit 6 h Arbeit am 8.12.', dez.dFeier === 3 && dez0.dFeier === 3, dez.dFeier);
ok('Die Tage gesamt bleiben gleich', dez.dTotal === dez0.dTotal);
ok('Die Arbeit am Feiertag steht eigens', dez.feierArbeit === 6 && dez.dFeierArbeit === 1);
ok('Gesammelt und eingeloest getrennt summiert', dez.zaPlus === 6 && dez.zaMinus === 0);
ok('Die Stunden: 6 h mehr Arbeit', Math.abs(dez.work - dez0.work - 6) < 1e-9);

/* ── 8 · Ueberlappende Bloecke zaehlen einmal ── */
var pU = profil();
[1,2,3,4,5].forEach(function(t){ pU.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'08:00', vmTo:'13:00', nmOn:true, nmFrom:'12:00', nmTo:'17:00' }; }); });
var u = dayPlan(pU.sched, new Date(2026, 8, 16));
ok('08–13 und 12–17: 9 h, nicht 10', u.vm + u.nm === 9 && u.pause === 0, u.vm + ' + ' + u.nm);
pU.sched.weeks.forEach(function(w){ w[3] = { vmOn:true, vmFrom:'08:00', vmTo:'16:00', nmOn:true, nmFrom:'09:00', nmTo:'11:00' }; });
var u2 = dayPlan(pU.sched, new Date(2026, 8, 16));
ok('Ein Nachmittag ganz im Vormittag zaehlt nicht dazu', u2.vm + u2.nm === 8, u2.vm + ' + ' + u2.nm);

/* ── 8b · Ein halber Tag zaehlt 0,5, auch bei ungleichen Haelften ──
   Vorher zaehlte er seinen Stundenanteil: 5 + 3 h, Vormittag Urlaub = 0,625,
   zwei davon im PDF „1,5 Tage". */
var pH2 = profil({ '2026-09-16': { t:'urlaub', s:'vm' }, '2026-09-17': { t:'urlaub', s:'vm' }, '2026-09-18': { t:'krank', s:'nm' } });
[1,2,3,4,5].forEach(function(t){ pH2.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'08:00', vmTo:'13:00', nmOn:true, nmFrom:'14:00', nmTo:'17:00' }; }); });
var sH = monthSums(monthRows(pH2, 2026, 8));
ok('Zwei Vormittage Urlaub (je 5 h): genau 1 Urlaubstag', Math.abs(sH.dUrlaub - 1) < 1e-9 && sH.urlaub === 10, sH.dUrlaub);
ok('Ein Nachmittag Krankenstand (3 h): 0,5 Tage', Math.abs(sH.dKrank - 0.5) < 1e-9 && sH.krank === 3, sH.dKrank);
ok('Die Tage ergeben weiter die Kalendertage', Math.abs(sH.dWork + sH.dUrlaub + sH.dKrank + sH.dFeier + sH.dSonst + sH.dZeit - sH.dTotal) < 1e-9);
var pZ2 = profil({ '2026-09-16': { t:'zeit', za:-1 } });
ok('Zeitausgleich bleibt anteilig: 1 von 8 h', Math.abs(monthSums(monthRows(pZ2, 2026, 8)).dZeit - 0.125) < 1e-9);
/* Einloesen genau eines (eindeutigen) Blocks: der Block faellt weg. */
var pB2 = profil({ '2026-09-16': { t:'zeit', za:-3 }, '2026-09-17': { t:'zeit', za:-5 }, '2026-09-18': { t:'zeit', za:-2 } });
[1,2,3,4,5].forEach(function(t){ pB2.sched.weeks.forEach(function(w){ w[t] = { vmOn:true, vmFrom:'08:00', vmTo:'13:00', nmOn:true, nmFrom:'14:00', nmTo:'17:00' }; }); });
var b16 = tag(pB2, '2026-09-16'), b17 = tag(pB2, '2026-09-17'), b18 = tag(pB2, '2026-09-18');
ok('Nachmittag (3 h) eingeloest: nur der Vormittag steht, keine Pause',
   b16.vmFrom === '08:00' && !b16.nmFrom && b16.pause === 0 && b16.work === 5 && !b16.zeiten, JSON.stringify([b16.vmFrom, b16.nmFrom, b16.pause]));
ok('Vormittag (5 h) eingeloest: nur der Nachmittag', !b17.vmFrom && b17.nmFrom === '14:00' && b17.pause === 0 && b17.work === 3);
ok('2 h eingeloest: Zeiten laut Plan, vermerkt', b18.vmFrom === '08:00' && b18.nmFrom === '14:00' && b18.zeiten === 'plan' && b18.work === 6);
var pG = profil({ '2026-09-16': { t:'zeit', za:-4 } });
ok('Gleich lange Haelften: welche frei war, ist offen — Zeiten laut Plan', tag(pG, '2026-09-16').zeiten === 'plan' && tag(pG, '2026-09-16').nmFrom === '13:00');
ok('Sammeln am Sonntag: Zeiten nicht erfasst', tag(profil({ '2026-09-20': { t:'zeit', za:3 } }), '2026-09-20').zeiten === 'fehlt');
/* Gegenpruefung vor dem Ausrollen: Arbeit an einem Feiertag ohne Plan
   (Allerheiligen 2026 ist ein Sonntag) zaehlt als Feiertagsarbeit. */
var nov = monthSums(monthRows(profil({ '2026-11-01': { t:'zeit', za:5 } }), 2026, 10));
ok('Sonntagsfeiertag mit 5 h: Feiertagsarbeit 5 h an 1 Tag', nov.feierArbeit === 5 && nov.dFeierArbeit === 1 && nov.zaPlus === 5, JSON.stringify([nov.feierArbeit, nov.dFeierArbeit]));
var dz2 = monthSums(monthRows(profil({ '2026-11-01': { t:'zeit', za:5 }, '2026-11-02': { t:'zeit', za:1 } }), 2026, 10));
ok('Gemischt: nur die Feiertagsstunden', dz2.feierArbeit === 5 && dz2.zaPlus === 6);
/* Monatsuebersicht: die Kachel Arbeit steht auch, wenn nur am Feiertag gearbeitet wurde. */
ME = profil({ '2026-12-08': { t:'zeit', za:6 } });
ME.sched.weeks.forEach(function(w){ for(var d = 1; d <= 6; d++) w[d] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; });
enterApp(); CAL.y = 2026; CAL.m = 11; renderCal();
ok('Nur Feiertagsarbeit: die Kachel Arbeit mit 6 h', document.querySelector('#mb-leg').textContent.indexOf('Arbeit6,00 h') >= 0, document.querySelector('#mb-leg').textContent);
ME = null;

/* ── 9 · Die Kalenderzelle zeigt eingeloesten Zeitausgleich mit ── */
ME = profil({ '2026-09-16': { t:'zeit', za:-3 } });
enterApp(); CAL.y = 2026; CAL.m = 8; renderCal();
var zelle = document.querySelector('#cal-grid .cell[data-d="16"] .hrs');
ok('Zelle: 8,00 wie Bilanz und Monatssumme (5 h Arbeit + 3 h eingeloest)', zelle && zelle.textContent === '8,00', zelle && zelle.textContent);

ME = null;
window.__FERTIG = true;
`;
const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);
const E = dom.window.__E || [];
let schlecht = 0;
console.log('');
E.forEach(e => { if (!e.ok) schlecht++; console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z)); });
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
