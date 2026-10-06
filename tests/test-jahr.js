/* Testlauf: Jahresrueckblick — Rechnen, Zeitfenster, Banner, Bubble Teas,
   Abzeichen, Kapitel und die Buehne. Seit 27.09.2026. Abgemeldet. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const roh = fs.readFileSync(DATEI, 'utf8');
const MIG = path.join(__dirname, '..', 'supabase', 'migrations', '20260927090000_tee_protokoll.sql');
const sql = fs.existsSync(MIG) ? fs.readFileSync(MIG, 'utf8') : '';
const MIG2 = path.join(__dirname, '..', 'supabase', 'migrations', '20260927100000_tee_log_anon.sql');
const sql2 = fs.existsSync(MIG2) ? fs.readFileSync(MIG2, 'utf8') : '';
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(roh, {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

/* Im Pruefteil keine regulaeren Ausdruecke mit Backslash — er steckt in
   einer Vorlage, dort waere \\d nur ein d. */
const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

/* ── 1 · Das Zeitfenster ── */
ok('Im Dezember blickt das laufende Jahr zurueck', jrJahr(new Date(2026, 11, 5, 12)) === 2026);
ok('Im Jaenner das Vorjahr',                       jrJahr(new Date(2027, 0, 20, 12)) === 2026);
ok('Im September gibt es keinen',                  jrJahr(new Date(2026, 8, 27, 12)) === null);
/* Seit 06.10.2026 schon ab 1. November (Marco). */
ok('Ab 1. November das laufende Jahr',             jrJahr(new Date(2026, 10, 1, 12)) === 2026 && jrJahr(new Date(2026, 10, 30, 12)) === 2026);
ok('Ende Oktober noch nicht',                      jrJahr(new Date(2026, 9, 31, 12)) === null);
ok('Tausender mit Punkt', jrTausend(1642) === '1.642' && jrTausend(12) === '12' && jrTausend(1234567) === '1.234.567',
   jrTausend(1642));

/* ── 2 · Ein handgebautes Jahr: 2025 ──
   Mo–Fr 8–12 und 13–17, Sa 8–12. Urlaub 28.–30. April und 2. Mai —
   der 1. Mai ist Feiertag, also zwei Brueckentage und fuenf Tage am
   Stueck. Zeitausgleich +2 h am 10. Maerz. Jaenner puenktlich
   abgegeben, Februar zu spaet. */
ME = normalize({ id:'j', vorname:'Anna', nachname:'Muster', dob:'1994-03-14', av:3,
  seit: new Date(2025, 0, 10, 12).getTime(),
  events: {
    '2025-04-28':{ t:'urlaub', s:'full' }, '2025-04-29':{ t:'urlaub', s:'full' },
    '2025-04-30':{ t:'urlaub', s:'full' }, '2025-05-02':{ t:'urlaub', s:'full' },
    '2025-03-10':{ t:'zeit', za:2 }
  },
  exp: { '2025-0': new Date(2025, 1, 3, 12).getTime(), '2025-1': new Date(2025, 2, 20, 12).getTime() }
});
const heute = new Date(2026, 0, 15, 12);
const d = jrDaten(2025, heute);
let soll = 0;
for(let m = 0; m < 12; m++) soll += monthSums(monthRows(ME, 2025, m)).work;
ok('Die Stunden sind die Summe der zwoelf Monate', Math.abs(d.work - soll) < 0.001, d.work + ' / ' + soll);
ok('Alle zwoelf Monate zaehlen', d.verfuegbar === 12 && d.monate.every(x => !!x), d.verfuegbar);
ok('Vier Urlaubstage', Math.abs(d.urlaub - 4) < 0.001, d.urlaub);
ok('Zwei Brueckentage', d.bruecken === 2, d.bruecken);
ok('Fuenf Tage Urlaub am Stueck, der Feiertag zaehlt mit', d.urlaubLang === 5, d.urlaubLang);
ok('Zwei Stunden Zeitausgleich gesammelt', Math.abs(d.zaPlus - 2) < 0.001, d.zaPlus);
ok('Zwei Monate abgegeben', d.abgegeben === 2, d.abgegeben);
ok('Einer davon puenktlich', d.puenktlich === 1, d.puenktlich);
ok('Fruehester Dienstbeginn 08:00', d.frueh === '08:00', d.frueh);
let sa = 0;
for(let x = new Date(2025, 0, 1, 12); x.getFullYear() === 2025; x.setDate(x.getDate() + 1)){
  if(x.getDay() === 6 && !holidays(2025)[key(2025, x.getMonth(), x.getDate())]) sa++;
}
ok('Samstage gezaehlt, Feiertage nicht', d.samstage === sa, d.samstage + ' / ' + sa);
const topSoll = d.monate.reduce((t, x) => (!t || x.work > t.work) ? x : t, null);
ok('Der staerkste Monat stimmt', d.top && d.top.m === topSoll.m, d.top && d.top.m);
ok('Zwoelf Monate mit MOJI', d.dabei === 12, d.dabei);
ok('Keine Aufstiege mit zwei Monaten', d.aufstiege === 0 && d.stufe === 1, d.stufe);
ok('Tage am Stueck als Vergleich', d.tageAmStueck === Math.round(d.work / 24), d.tageAmStueck);

/* Im laufenden Jahr nur bis heute */
const d2 = jrDaten(2025, new Date(2025, 5, 15, 12));
/* Seit 02.10.2026 ist ein Monat erst nach seiner Frist (5. des Folgemonats)
   offen: am 15. Juni zaehlen Jaenner bis Mai, der Juni noch nicht. */
ok('Im laufenden Jahr zaehlt nur bis heute', d2.verfuegbar === 5 && d2.monate[5] !== null && d2.monate[6] === null, d2.verfuegbar);
let bisHeute = 0;
for(let m = 0; m < 5; m++) bisHeute += monthSums(monthRows(ME, 2025, m)).work;
bisHeute += monthSums(monthRows(ME, 2025, 5).filter(r => r.day <= 15)).work;
ok('Und der Juni nur bis zum 15.', Math.abs(d2.work - bisHeute) < 0.001, d2.work + ' / ' + bisHeute);

/* ── 2b · Befunde der Pruefung vom 02.10.2026 ── */
{
  const MEvor = ME;
  const mk = (o) => normalize(Object.assign({ id:'r', vorname:'R', nachname:'S', dob:'1990-01-01', av:3,
                                              seit: new Date(2025, 0, 2, 12).getTime() }, o));
  /* a · Abgegeben zaehlt der ERSTE Export — ein spaeteres Jahres-PDF macht
     den Jaenner nicht nachtraeglich verspaetet. */
  ME = mk({ exp:{ '2025-0': new Date(2025, 11, 20, 12).getTime() }, expErst:{ '2025-0': new Date(2025, 1, 2, 12).getTime() } });
  ok('Erster Export zaehlt fuer puenktlich', jrDaten(2025, new Date(2026, 0, 15, 12)).puenktlich === 1);
  const n1 = normalize({ id:'n', vorname:'N', dob:'1990-01-01', exp:{ '2025-3': 123 } });
  ok('Altbestand: der bekannte Zeitpunkt wird der erste', n1.expErst['2025-3'] === 123);
  ME = mk({}); ME.exp = {}; ME.expErst = {};
  merkeExporte([{ y:2025, m:4 }]);
  const erst = ME.expErst['2025-4'];
  ME.exp['2025-4'] = erst + 1000; merkeExporte([{ y:2025, m:4 }]);
  ok('Ein zweiter Export aendert den ersten nicht', ME.expErst['2025-4'] === erst && ME.exp['2025-4'] >= erst);
  /* b · Monate vor dem Beitritt zaehlen nicht, ausser sie wurden abgegeben. */
  ME = mk({ seit: new Date(2025, 6, 10, 12).getTime(), exp:{ '2025-2': new Date(2025, 3, 2, 12).getTime() } });
  const db = jrDaten(2025, new Date(2026, 0, 15, 12));
  ok('Beitritt im Juli: Jaenner bis Juni zaehlen nicht', db.monate[0] === null && db.monate[5] === null && db.monate[6] !== null);
  ok('Ausser der abgegebene Maerz', db.monate[2] !== null && db.verfuegbar === 7 && db.abgegeben === 1, db.verfuegbar);
  /* c · Brueckentag nur neben einem freien Diensttag-Feiertag. */
  ME = mk({ events:{
    '2025-10-27':{ t:'urlaub', s:'full' },               /* Mo nach dem Nationalfeiertag am Sonntag */
    '2025-12-08':{ t:'zeit', za:6 },                     /* am Feiertag gearbeitet */
    '2025-12-09':{ t:'urlaub', s:'full' },
    '2025-05-02':{ t:'urlaub', s:'full' }                /* Fr nach dem 1. Mai: echt */
  }});
  const dc = jrDaten(2025, new Date(2026, 0, 15, 12));
  ok('Nur der Freitag nach dem 1. Mai ist ein Brueckentag', dc.bruecken === 1, dc.bruecken);
  /* d · Laengster Urlaub: nicht ueber einen gearbeiteten Feiertag, nicht
     verlaengert durch einen mitgewaehlten Sonntag am Rand. */
  ME = mk({ events:{
    '2025-12-04':{ t:'urlaub', s:'full' }, '2025-12-05':{ t:'urlaub', s:'full' }, '2025-12-06':{ t:'urlaub', s:'full' },
    '2025-12-08':{ t:'zeit', za:6 },
    '2025-12-09':{ t:'urlaub', s:'full' }, '2025-12-10':{ t:'urlaub', s:'full' },
    '2025-03-10':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' }, '2025-03-11':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' },
    '2025-03-12':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' }, '2025-03-13':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' },
    '2025-03-14':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' }, '2025-03-15':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16' },
    '2025-03-16':{ t:'urlaub', s:'full', ser:'2025-03-10>2025-03-16', frei:true }
  }});
  const dd = jrDaten(2025, new Date(2026, 0, 15, 12));
  ok('Mo–Sa mit Sonntag am Rand: 6 Tage, nicht 7', dd.urlaubLang === 6, dd.urlaubLang);
  /* e · Volle Wochen: die mittlere Woche des Plans (44 h), nicht Woche 1 allein. */
  ME = mk({}); ME.sched.weekCount = 2;
  [1,2,3,4,5,6].forEach(function(t){ ME.sched.weeks[1][t] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' }; });
  const de = jrDaten(2025, new Date(2026, 0, 15, 12));
  ok('Zwei Wochen, eine davon frei: geteilt durch 22 h', de.wochen === Math.round(de.work / 22), de.wochen + ' / ' + de.work);
  /* f · Im Dezember ist der Dezember noch nicht offen. */
  ME = mk({ exp:{} });
  for(let m = 0; m < 11; m++) ME.exp['2025-' + m] = new Date(2025, m + 1, 2, 12).getTime();
  normalize(ME);
  const df = jrDaten(2025, new Date(2025, 11, 10, 12));
  ok('Am 10. Dezember: 11/11, lueckenlos', df.verfuegbar === 11 && df.abgegeben === 11, df.abgegeben + '/' + df.verfuegbar);
  ok('Und das Abzeichen kommt', jrAbzeichen(df).some(function(a){ return a.t === 'Lückenlos abgegeben'; }));
  ME = MEvor;
}

/* ── 3 · Die laengste Tagesserie je Jahr ── */
ME.serie = { tage:5, letzt:'2025-06-10' };
serieZaehlen();
ok('Die laengste Serie bleibt ihrem Jahr', ME.serie.best && ME.serie.best['2025'] === 5, JSON.stringify(ME.serie.best));
ok('Heute beginnt eine neue', ME.serie.tage === 1);
ok('Der Rueckblick nimmt die laengste', jrDaten(2025, heute).serie === 5);

/* ── 4 · Bubble Teas ── */
UID = 'ich';
const team = [{ user_id:'x', vorname:'Anna', kuerzel:'M', avatar:7 }, { user_id:'y', vorname:'Ben', kuerzel:'K', avatar:2 }];
const paare = [{ a:'ich', b:'x', punkte:24, letzt_a:'2026-09-20', letzt_b:'2026-09-21' },
               { a:'y', b:'ich', punkte:3, letzt_a:'2026-09-18', letzt_b:null }];
const t26 = jrTeeAus(2026, paare, [], team);
ok('Vor dem Protokoll zaehlt die Summe je Paar', t26 && t26.buddy && t26.buddy.name === 'Anna M.', t26 && t26.buddy && t26.buddy.name);
ok('Mit ihren 24 Teas', t26.buddy.punkte === 24 && t26.buddy.lvl === 3 && t26.buddy.tee.n === 'Matcha Melt',
   t26.buddy.punkte + ' / ' + t26.buddy.lvl);
ok('Insgesamt 27 Teas', t26.summe === 27, t26.summe);
ok('Beschenkt hat man nur, wem man selbst geschickt hat', t26.beschenkt === 1, t26.beschenkt);
const log = [{ von:'ich', an:'y', am:'2027-02-01' }, { von:'y', an:'ich', am:'2027-02-02' }, { von:'ich', an:'x', am:'2027-03-01' },
             { von:'ich', an:'x', am:'2026-12-30' }];
const t27 = jrTeeAus(2027, paare, log, team);
ok('Ab 2027 zaehlt nur das Protokoll', t27.buddy.name === 'Ben K.' && t27.buddy.punkte === 2, t27.buddy.name + ' ' + t27.buddy.punkte);
ok('Nur Becher aus dem Jahr', t27.summe === 3, t27.summe);
ok('Zwei verschiedene beschenkt', t27.beschenkt === 2, t27.beschenkt);
ok('Ohne Teas kein Buddy', jrTeeAus(2027, [], [], team) === null);

/* ── 5 · Abzeichen ── */
const dA = jrDaten(2025, heute);
dA.tee = t26;
const abz = jrAbzeichen(dA);
ok('Die laengste Serie steht oben', abz[0].t === 'Längste Tagesserie' && abz[0].w === '5 Tage', abz[0].t);
ok('Hoechstens sechs', abz.length <= 6, abz.length);
ok('Mindestens zwei, damit es ein Kapitel gibt', abz.length >= 2, abz.length);
ok('Brueckentage sind dabei', abz.some(a => a.t === 'Brückentage genutzt' && a.w === '2'));
ok('Kein Wort ueber Krankheit', !abz.some(a => a.t.toLowerCase().indexOf('krank') > -1));

/* ── 6 · Die Kapitel ── */
dA.p = jrPalette(dA.stufe);
const ids = jrKapitel(dA).map(k => k.id).join(',');
ok('Mit Buddy sechs Kapitel', ids === 'auf,std,stufe,buddy,abz,ende', ids);
dA.tee = null;
const ids2 = jrKapitel(dA).map(k => k.id).join(',');
ok('Ohne Teas faellt der Buddy weg', ids2 === 'auf,std,stufe,abz,ende', ids2);
const kach = jrKapitel(dA).find(k => k.ende).kacheln;
ok('Die Abschlusskarte traegt sechs Kacheln', kach.length === 6, kach.length);
ok('Mit Urlaub und Abgegeben vorn', kach[0].t === 'Urlaubstage' && kach[1].t === 'Abgegeben' && kach[1].w === '2/12', kach[1].w);
ok('Und der laengsten Serie', kach.some(k => k.t === 'Längste Serie' && k.w === '5 T.'));
/* Die Stufe: alle Karten wischen vorbei bis zur aktuellen */
const dS = jrDaten(2025, heute); dS.p = jrPalette(4); dS.stufe = 4; dS.aufstiege = 2;
const kS = jrKapitel(dS).find(k => k.id === 'stufe');
const tS = document.createElement('div'); tS.innerHTML = kS.html;
ok('Vier Stufenkarten fuer Stufe 4', tS.querySelectorAll('.jr-fahrt .jr-lk').length === 4, tS.querySelectorAll('.jr-lk').length);
ok('Die drei erreichten tragen einen gruenen Haken', tS.querySelectorAll('.jr-lk .jr-lk-haken svg').length === 3);
ok('Jede in ihrer Stufenfarbe', tS.querySelector('.jr-lk').getAttribute('style').indexOf(jrPalette(1).hochk) > -1);
ok('Die letzte ist die aktuelle, mit Holo-Folie', tS.querySelector('.jr-lk:last-child').classList.contains('aktuell')
   && !!tS.querySelector('.jr-lk:last-child .jr-folie') && tS.querySelector('.jr-lk:last-child .jr-lk-band b').textContent === rang(4).n);
ok('Die Fahrt dauert je Karte ein Stueck', kS.fahrt === 1300 + 3 * 430, kS.fahrt);
ok('Das Kapitel steht lang genug fuer Fahrt und Text', kS.dauer >= (700 + kS.fahrt) / 1000 + 4, kS.dauer);
ok('Spruch und Text kommen erst nach der Fahrt', !!tS.querySelector('.jr-spruch.jr-nach') && tS.querySelector('.jr-spruch').textContent === JR_STUFE_SPRUCH[3]);
ok('Zwoelf Sprueche fuer zwoelf Stufen', JR_STUFE_SPRUCH.length === RAENGE.length);
/* Am Ende der Fahrt: die aktuelle wird zur Holo-Karte */
const schS = document.createElement('div'); schS.innerHTML = kS.html; document.body.appendChild(schS);
JR.still = false; jrStufenFahrt(schS, 0);
const lkS = schS.querySelectorAll('.jr-lk');
ok('Ohne Fahrt steht sofort die aktuelle in der Mitte', lkS[3].id === 'jr-holo' && lkS[3].classList.contains('ziel') && lkS[3].classList.contains('lebt'));
ok('Die vorigen treten zurueck', lkS[2].classList.contains('vorbei'));
ok('Dann kommt der Text', schS.classList.contains('fertig'));
schS.remove();
dS.stufe = 1; dS.aufstiege = 0;
const k1 = jrKapitel(dS).find(k => k.id === 'stufe');
const t1 = document.createElement('div'); t1.innerHTML = k1.html;
ok('Auf Stufe 1 eine Karte, keine Fahrt', k1.fahrt === 0 && t1.querySelectorAll('.jr-lk').length === 1, t1.querySelectorAll('.jr-lk').length);
/* Feste Farben: nicht mehr von der Stufe abhaengig */
dS.stufe = 12;
const f12 = jrKapitel(dS).map(k => k.st.join());
dS.stufe = 2;
const f2 = jrKapitel(dS).map(k => k.st.join());
ok('Die Kapitelfarben haengen nicht an der Stufe', f12.join('|') === f2.join('|'));
ok('Violett fuer die Eroeffnung', JR_STIMMUNG.auf.st.indexOf('#C643FE') > -1);
ok('Gruen fuer Buddy und Abzeichen', JR_STIMMUNG.buddy.st.indexOf('#60E0A6') > -1 && JR_STIMMUNG.abz.st.indexOf('#97E66E') > -1);
/* Abzeichen als Muenzen */
dA.p = jrPalette(dA.stufe);
const kA = jrKapitel(dA).find(k => k.id === 'abz');
const tA = document.createElement('div'); tA.innerHTML = kA.html; document.body.appendChild(tA);
ok('Eine grosse Medaille vorn', !!tA.querySelector('.jr-held .jr-muenze.gross .jr-m-rand'));
ok('Die uebrigen als kleine Muenzen', tA.querySelectorAll('.jr-muenzen .jr-mz .jr-muenze').length === jrAbzeichen(dA).length - 1);
jrMuenzenFlug(tA);
ok('Ihr Flug aus der grossen wird gemessen', tA.querySelector('.jr-mz').style.getPropertyValue('--dx') !== '');
tA.remove();
/* Der Buddy bekommt seinen Spruch */
dA.tee = t26;
const tB = document.createElement('div'); tB.innerHTML = jrKapitel(dA).find(k => k.id === 'buddy').html;
ok('Unter der Tee-Zahl ein Spruch', !!tB.querySelector('.jr-buddy-zahl + .jr-spruch'), tB.querySelector('.jr-spruch') && tB.querySelector('.jr-spruch').textContent);
ok('Kollegial gestaffelt', jrTeeSpruch(1, 'Anna M.') !== jrTeeSpruch(24, 'Anna M.') && jrTeeSpruch(5, 'Anna M.').indexOf('Anna') > -1);
/* Die Abschlusskarte kennt den besten Tee-Freund */
const tE = document.createElement('div'); tE.innerHTML = jrKapitel(dA).find(k => k.ende).html;
ok('Die Karte ist das Teilbild im Format 4:5', !!tE.querySelector('.jr-holo.jr-share'));
ok('Mit dem besten Tee-Freund', tE.querySelector('.jr-sh-buddy b').textContent === 'Anna M. · 24 Teas', tE.querySelector('.jr-sh-buddy b').textContent);
ok('Mit Stufe und Stunden', tE.querySelector('.jr-sh-lvl').textContent === 'LVL ' + dA.stufe && tE.querySelector('.jr-sh-held b').textContent === jrTausend(dA.work));
dA.tee = null;
const tE2 = document.createElement('div'); tE2.innerHTML = jrKapitel(dA).find(k => k.ende).html;
ok('Ohne Tee-Freund steht dort das staerkste Abzeichen', tE2.querySelector('.jr-sh-buddy small').textContent === 'Längste Tagesserie');
ok('Die Farben kommen aus der Stufe', jrPalette(1).a === rang(1).a && jrPalette(12).glanz === '#FFE9A8');
const leer = normalize({ id:'n', vorname:'Neu', nachname:'Ling', dob:'2000-01-01', seit: new Date(2025, 0, 1).getTime(),
  sched: { weeks: [[0,1,2,3,4,5,6].map(() => ({ vmOn:false, nmOn:false, vmFrom:'08:00', vmTo:'12:00', nmFrom:'13:00', nmTo:'17:00' }))], offset:0 } });
const merk = ME; ME = leer;
const dL = jrDaten(2025, heute); dL.p = jrPalette(dL.stufe);
ok('Ohne Stunden kein Stunden-Kapitel', jrKapitel(dL).map(k => k.id).indexOf('std') < 0, jrKapitel(dL).map(k => k.id).join(','));
ME = merk;

/* ── 7 · Das Banner ── */
UID = null;
const J = new Date().getFullYear();
ME = normalize({ id:'b', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3, seit: new Date(J, 0, 5).getTime() });
enterApp();
go('v-export');
const ban = document.getElementById('jr-banner');
const m = new Date().getMonth();
if(m !== 10 && m !== 11 && m !== 0) ok('Ausserhalb von November bis Jaenner versteckt', ban.hidden);
ok('Das Banner steht ueber dem Exportkopf', ban.nextElementSibling && ban.nextElementSibling.classList.contains('exhead'));
_jrTest = true;
malJrBanner();
ok('Mit dem Pruefschalter sichtbar', !ban.hidden);
ok('Mit dem Jahr', document.getElementById('jr-banner-j').textContent === 'Dein Jahr ' + J, document.getElementById('jr-banner-j').textContent);
ok('In der Farbe der Stufe', ban.style.getPropertyValue('--jr-a') === rang(stufe()).a, ban.style.getPropertyValue('--jr-a'));
ok('Mit dem Profilbild', (document.getElementById('jr-banner-img').getAttribute('src') || '').indexOf('av-') === 0);
ok('Noch nicht gesehen: der Glanz laeuft', !ban.classList.contains('gesehen'));

/* ── 8 · Die Buehne ── */
ban.dispatchEvent(new window.MouseEvent('click', { bubbles:true, clientX:120, clientY:90 }));
const jr = document.getElementById('jr');
ok('Ein Tipp oeffnet den Rueckblick', !!jr && jr.classList.contains('offen'));
ok('Die Leiste unten ist gesperrt', document.body.classList.contains('locked'));
ok('Ein Strich je Kapitel', jr.querySelectorAll('.jr-fort i').length === JR.kap.length, JR.kap.length);
ok('Es beginnt mit der Eroeffnung', JR.jetzt === 0 && !!jr.querySelector('.jr-kap .jr-open'));
ok('Das Jahr steht gross da', jr.querySelector('.jr-jahr').textContent === String(J));
ok('Gesehen wird vermerkt', !!(ME.rueckblick && ME.rueckblick[J]));
ok('Danach laeuft der Glanz nicht mehr', ban.classList.contains('gesehen'));
jrZeige(1, null);
ok('Weiter geht es zum naechsten Kapitel', JR.jetzt === 1);
jrZeige(0, null);
ok('Und zurueck', JR.jetzt === 0);
jrZeige(99, null);
ok('Ueber das Ende hinaus passiert nichts', JR.jetzt === 0);
const letzte = JR.kap.length - 1;
jrZeige(letzte, null);
ok('Am Ende stehen Teilen und Nochmal', !!document.getElementById('jr-teilen') && !!document.getElementById('jr-nochmal'));
ok('Das letzte Kapitel laeuft nicht von selbst weiter', JR.kap[letzte].dauer === 0);
jrZu();
ok('Schliessen gibt die Leiste frei', !document.body.classList.contains('locked'));
window.__WEITER = function(){
  ok('Und raeumt die Buehne ab', !jr.classList.contains('offen') && !jr.querySelector('.jr-kap'));
  ME = null;
  window.__FERTIG = true;
};
setTimeout(window.__WEITER, 200);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  const fn = name => { const a = roh.indexOf('function ' + name + '('); return a < 0 ? '' : roh.slice(a, roh.indexOf('\n}\n', a)); };
  [['Das Protokoll gibt es', /create table if not exists public\.tee_log/.test(sql)],
   ['Lesen nur, woran man beteiligt ist', /using \(von = auth\.uid\(\) or an = auth\.uid\(\)\)/.test(sql)],
   ['Geschrieben wird nur ein gezaehlter Becher',
    /if not war and not dran then[\s\S]{0,500}insert into public\.tee_log \(von, an, am\) values \(ich, an, heute\);\s*\n\s*end if;/.test(sql)],
   ['Die Migration prueft sich selbst', /tee_senden schreibt nicht ins Protokoll/.test(sql)],
   ['Anonym ist das Protokoll gar nicht abfragbar', /revoke all on public\.tee_log from anon;/.test(sql2)
    && /has_table_privilege\('anon', 'public\.tee_log', 'select'\)/.test(sql2)],
   ['Das Protokoll zaehlt ab dem 27.09.2026', /const TEE_LOG_AB = '2026-09-27';/.test(roh)],
   ['Pruefschalter ueber die Adresse', /\[\?&\]rueckblick\\b/.test(roh)],
   ['Das Banner kommt vor dem Exportkopf', roh.indexOf('id="jr-banner"') > -1 && roh.indexOf('id="jr-banner"') < roh.indexOf('<h1 class="exh">')],
   ['Die Exportseite malt das Banner', /if\(id === 'v-export'\) malJrBanner\(\);/.test(roh)],
   ['Die Serie merkt sich die laengste je Jahr', /if\(\(s\.best\[jahr\] \|\| 0\) < s\.tage\) s\.best\[jahr\] = s\.tage;/.test(roh)],
   ['Krankentage kommen im Rueckblick nicht vor', fn('jrAbzeichen').length > 0 && !/krank/i.test(fn('jrAbzeichen'))],
   ['Die Kapitel oeffnen sich vom Finger aus', /clipPath: auf \? zu : ganz/.test(roh)],
   ['Zahlen rollen Ziffer fuer Ziffer', /\.an \.jr-rz-s\{transition:transform 1\.9s/.test(roh)],
   ['Die Holo-Karte traegt eine Folie', /\.jr-folie\{[\s\S]{0,120}mix-blend-mode:color-dodge/.test(roh)],
   ['Weniger Bewegung: alles steht', /prefers-reduced-motion:reduce\)\{\s*\n\s*\.jr-kap\{animation:none\}/.test(roh)],
   ['Auf der Leinwand echte Farben', /async function jrBild\(\)\{[\s\S]{0,900}getPropertyValue\('--font-dis'\)/.test(roh)],
   ['Das Teilbild ist ein JPEG, kein 3-MB-PNG', /'moji-jahr-' \+ d\.y \+ '\.jpg', \{ type:'image\/jpeg' \}\) : null\), 'image\/jpeg', \.92\)/.test(roh)],
   ['Die Folie waescht die Teilkarte nicht aus', /\.jr-share \.jr-folie\{mix-blend-mode:soft-light;opacity:\.6\}/.test(roh)],
   ['Keine Stufenfarben mehr im Kapitelhintergrund', fn('jrKapitel').length > 0 && !/p\.nacht|p\.kuehl|p\.warm/.test(fn('jrKapitel'))],
   ['Die Teilkarte ist fest violett', /\.jr-holo\.jr-share\{[\s\S]{0,500}linear-gradient\(160deg,#C643FE 0%,#8E1AD6 48%,#2E0A52 100%\)/.test(roh)
    && /lg\.addColorStop\(0, '#C643FE'\)/.test(roh)],
   ['Die Stufe traegt sie als Punkt', /\.jr-sh-lvl::before\{[\s\S]{0,200}background:var\(--lv,#fff\)/.test(roh)],
   ['Kein Uebergang auf der Deckkraft, die jedes Bild neu kommt', /\.jr-lk\{[\s\S]{0,700}transition:scale \.9s var\(--ease-out\)\}/.test(roh)
    && /\.jr-lk\.vorbei\{animation:jrVorbei/.test(roh)],
   ['Die 6 in 2026 hat Luft', /\.jr-jahr \.jr-wk\{padding:0 \.09em \.06em\}/.test(roh)],
   ['Die Haken sind von Anfang an da, nicht erst im Vorbeifahren',
    /\.jr-lk-haken\{[^}]*\}/.test(roh) && !/\.jr-lk-haken\{[^}]*transform:scale\(0\)/.test(roh) && !/toggle\('erreicht'/.test(roh)],
   ['Leerzeichen im Rollzaehler bleiben stehen', /\(c === ' ' \? '&nbsp;' : esc\(c\)\)/.test(roh)],
   ['Die Stunden-Ziffern stehen so eng wie die Jahreszahl', /\.jr-rz\{[^}]*margin-inline:-\.036em\}/.test(roh)],
   ['Die grosse Medaille dreht sich herein', /@keyframes jrMuenzeDreh\{0%\{opacity:0;transform:rotateY\(-540deg\)/.test(roh)],
   ['Die kleinen fliegen aus ihr heraus', /@keyframes jrAusflug\{0%\{opacity:0;transform:translate\(var\(--dx,0\),var\(--dy,-120px\)\)/.test(roh)],
   ['Das Teilbild ist 4:5', /const B = 1080, H = 1350, S = B \/ 330/.test(roh) && /\.jr-holo\.jr-share\{aspect-ratio:4\/5;/.test(roh)],
   ['Das Profilbild ist ein weiches Viereck wie ueberall', /\.jr-av img\{[^}]*border-radius:27%/.test(roh)],
   ['Das Profilbild bleibt quadratisch, auch in der Spalte', /\.jr-av\{[^}]*flex:none;width:132px;height:132px;min-height:0/.test(roh)],
   ['Kein runder Schein mehr dahinter', /\.jr-av::before\{[^}]*border-radius:34%/.test(roh)],
   ['Die Ziffern werden nicht mehr abgeschnitten',
    /\.jr-zahl\{[^}]*letter-spacing:0;/.test(roh) && /\.jr-rz\{[^}]*height:1\.12em/.test(roh) && /translateY\(calc\(var\(--d\) \* -1\.12em\)\)/.test(roh)],
   ['Alles mit eigenem Vorsatz', !/\n\.kap\{|\n\.holo\{|\n\.medaille\{/.test(roh)]
  ].forEach(([n, gut]) => E.push({ n, ok: !!gut, z: gut ? '' : 'Regel fehlt' }));

  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  if (!dom.window.__FERTIG) console.log('  FEHL  Der Testlauf ist vorzeitig abgebrochen.');
  process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
}, 3500);
