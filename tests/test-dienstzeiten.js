/* Testlauf: Dienstzeiten mit Datum.
   Abgemeldet — ohne ?desktop=1 kehrt boot() sofort zurück. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ZIEL = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(fs.readFileSync(ZIEL, 'utf8'), {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* Ein Plan mit frei waehlbaren Stunden pro Tag Mo–Fr. */
function planMit(von, bis){
  const s = defaultSched();
  for(let dow = 1; dow <= 5; dow++)
    s.weeks[0][dow] = { vmOn:true, vmFrom:von, vmTo:bis, nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  for(let dow = 6; dow <= 6; dow++)
    s.weeks[0][dow] = { vmOn:false, vmFrom:von, vmTo:bis, nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  return s;
}
const VIER  = planMit('08:00','12:00');   /* 4 h am Tag */
const ACHT  = planMit('08:00','16:00');   /* 8 h am Tag */

/* ── 1 · Ohne Verlauf verhaelt sich alles wie vorher ── */
const p0 = normalize({ id:'pA', vorname:'A', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
ok('normalize legt schedAlt als leere Liste an', Array.isArray(p0.schedAlt) && p0.schedAlt.length === 0);
ok('Ohne Verlauf liefert schedFuer den aktuellen Plan',
   schedFuer(p0, new Date(2020,0,15)) === p0.sched);
ok('schedGiltAb ist null ohne Verlauf', schedGiltAb(p0) === null);
/* Montag, 13.01.2020 — kein Feiertag (der 6. waere Heilige Drei Koenige) */
ok('Alter Monat rechnet mit dem einzigen Plan',
   evalDay(p0, 2020, 0, 13).work === 4, evalDay(p0, 2020, 0, 13).work);
/* Und die Gegenprobe: der Feiertag wird weiterhin als solcher erkannt */
ok('Heilige Drei Koenige bleibt Feiertag',
   evalDay(p0, 2020, 0, 6).type === 'feier' && evalDay(p0, 2020, 0, 6).work === 0,
   evalDay(p0, 2020, 0, 6).type);

/* ── 2 · Wechsel ab einem Datum ── */
const p = normalize({ id:'pB', vorname:'B', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
ok('Wechsel ab 01.10.2026 wird angenommen', schedWechsel(p, '2026-10-01', ACHT) === true);
ok('Verlauf hat jetzt eine Fassung', p.schedAlt.length === 1, p.schedAlt.length);
ok('Die alte Fassung endet am 30.09.2026', p.schedAlt[0].bis === '2026-09-30', p.schedAlt[0].bis);
ok('schedGiltAb sagt 01.10.2026', schedGiltAb(p) === '2026-10-01', schedGiltAb(p));

/* Montag 28.09.2026 → noch 4 h. Montag 05.10.2026 → schon 8 h. */
ok('Tag vor dem Wechsel rechnet mit dem alten Plan',
   evalDay(p, 2026, 8, 28).work === 4, evalDay(p, 2026, 8, 28).work);
ok('Tag nach dem Wechsel rechnet mit dem neuen Plan',
   evalDay(p, 2026, 9, 5).work === 8, evalDay(p, 2026, 9, 5).work);
/* Genau die Grenze: 30.09. ist ein Mittwoch, 01.10. ein Donnerstag */
ok('30.09.2026 gehoert noch zum alten Plan',
   evalDay(p, 2026, 8, 30).work === 4, evalDay(p, 2026, 8, 30).work);
ok('01.10.2026 gehoert schon zum neuen Plan',
   evalDay(p, 2026, 9, 1).work === 8, evalDay(p, 2026, 9, 1).work);

/* ── 3 · Ein zweiter Wechsel ── */
const ZWEI = planMit('08:00','10:00');    /* 2 h */
ok('Zweiter Wechsel ab 01.01.2027', schedWechsel(p, '2027-01-01', ZWEI) === true);
ok('Verlauf hat zwei Fassungen', p.schedAlt.length === 2, p.schedAlt.length);
ok('Drei Zeitraeume rechnen verschieden', (function(){
  return evalDay(p, 2026, 8, 28).work === 4      /* vor 01.10.26 */
      && evalDay(p, 2026, 10, 2).work === 8      /* dazwischen */
      && evalDay(p, 2027, 0, 4).work === 2;      /* ab 01.01.27 */
})(), evalDay(p,2026,8,28).work + ' / ' + evalDay(p,2026,10,2).work + ' / ' + evalDay(p,2027,0,4).work);

/* ── 4 · Rueckdatieren vor eine bestehende Grenze wird abgelehnt ── */
const vorher = JSON.stringify(p.schedAlt.map(e => e.bis));
ok('Wechsel vor die letzte Grenze wird abgelehnt',
   schedWechsel(p, '2026-06-01', VIER) === false);
ok('Der Verlauf bleibt dabei unangetastet',
   JSON.stringify(p.schedAlt.map(e => e.bis)) === vorher);

/* ── 5 · Fassung entfernen: keine Luecke ── */
const q = normalize({ id:'pC', vorname:'C', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
schedWechsel(q, '2026-10-01', ACHT);
schedWechsel(q, '2027-01-01', ZWEI);
/* Die mittlere Fassung (bis 2026-12-31, Plan ACHT) entfernen */
ok('Mittlere Fassung entfernen klappt', schedFassungWeg(q, 1) === true);
ok('Danach noch eine Fassung', q.schedAlt.length === 1, q.schedAlt.length);
ok('Die Zeit faellt an die naechstjuengere Fassung',
   evalDay(q, 2026, 10, 2).work === 2, evalDay(q, 2026, 10, 2).work);
ok('Vor der ersten Grenze bleibt es beim alten Plan',
   evalDay(q, 2026, 8, 28).work === 4, evalDay(q, 2026, 8, 28).work);

/* ── 6 · normalize raeumt kaputte Eintraege weg ── */
const r = normalize({ id:'pD', vorname:'D', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'kein-datum', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30' },
    null,
    { bis:'2026-03-31', sched: JSON.parse(JSON.stringify(ACHT)) }
  ]});
ok('Kaputte Eintraege fliegen raus', r.schedAlt.length === 1, r.schedAlt.length);
ok('Der brauchbare Eintrag bleibt', r.schedAlt[0].bis === '2026-03-31', r.schedAlt[0].bis);

/* Doppeltes Enddatum: nur eines bleibt uebrig */
const r2 = normalize({ id:'pE', vorname:'E', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ZWEI)) }
  ]});
ok('Doppeltes Enddatum wird entdoppelt', r2.schedAlt.length === 1, r2.schedAlt.length);

/* Unsortiert hereingegeben → sortiert heraus */
const r3 = normalize({ id:'pF', vorname:'F', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'2027-03-31', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ZWEI)) }
  ]});
ok('Verlauf kommt sortiert heraus',
   r3.schedAlt[0].bis === '2026-09-30' && r3.schedAlt[1].bis === '2027-03-31',
   r3.schedAlt.map(e => e.bis).join(', '));

/* ── 7 · Mehrfaches normalize aendert nichts mehr ── */
const vorN = JSON.stringify(p.schedAlt.map(e => e.bis));
normalize(p); normalize(p);
ok('normalize ist wiederholbar', JSON.stringify(p.schedAlt.map(e => e.bis)) === vorN);

/* ── 8 · schedGleich erkennt echte Aenderungen ── */
ok('Gleicher Plan gilt als gleich', schedGleich(VIER, JSON.parse(JSON.stringify(VIER))));
ok('Andere Zeiten gelten als verschieden', !schedGleich(VIER, ACHT));
const nurReiter = JSON.parse(JSON.stringify(VIER)); nurReiter.tab = 2; nurReiter.wcLock = false;
ok('Nur Reiter oder Schloss geaendert gilt als gleich', schedGleich(VIER, nurReiter));
const andererVersatz = JSON.parse(JSON.stringify(VIER)); andererVersatz.weekCount = 2; andererVersatz.offset = 1;
ok('Anderer Rhythmus gilt als verschieden', !schedGleich(VIER, andererVersatz));

/* ── 9 · Die Bedienteile sind da ── */
['sab','sab-korr','sab-wechsel','sab-ab','sab-ok','sab-zurueck','sched-hist']
  .forEach(id => ok('Element #' + id + ' vorhanden', !!document.getElementById(id)));

/* ── 10 · Der Zeitraum-Eintrag nutzt den Plan von damals ── */
ME = q;
ok('qTouched nutzt den Plan des jeweiligen Tages',
   qTouched(new Date(2026, 8, 28)) === true && qTouched(new Date(2026, 8, 26)) === false,
   'Mo 28.09. ' + qTouched(new Date(2026,8,28)) + ' · Sa 26.09. ' + qTouched(new Date(2026,8,26)));

/* ── 11 · Verlauf zeichnen ── */
malSchedHist();
const host = document.getElementById('sched-hist');
ok('Verlauf wird gezeichnet', host.innerHTML.indexOf('Frühere Dienstzeiten') >= 0);
ok('Die aktuelle Fassung ist hervorgehoben', !!host.querySelector('.shist-z.jetzt'));

/* ── 12 · Befunde der Pruefung vom 02.10.2026 ── */
{
  const tag = (vf, vt, nf, nt, nmOn) => ({ vmOn:true, vmFrom:vf, vmTo:vt, nmOn: nmOn !== false, nmFrom:nf, nmTo:nt });
  /* a · Ueberschneidung, vertauscht, rueckwaerts */
  ok('Normaler Tag: kein Fehler', zeitFehler(tag('08:00','12:00','13:00','17:00')) === '');
  ok('Ohne Pause aneinander: kein Fehler', zeitFehler(tag('08:00','12:00','12:00','16:00')) === '');
  ok('Nachmittag vor dem Ende des Vormittags', zeitFehler(tag('08:00','13:00','12:00','17:00')) === 'Der Nachmittag beginnt vor dem Ende des Vormittags.');
  ok('Vertauschte Bloecke ebenso', zeitFehler(tag('13:00','17:00','08:00','12:00')) === 'Der Nachmittag beginnt vor dem Ende des Vormittags.');
  ok('Ende vor Beginn', zeitFehler(tag('12:00','08:00','13:00','17:00')) === 'Beim Vormittag liegt das Ende vor dem Beginn.');
  ok('Ein ausgeschalteter Nachmittag stoert nicht', zeitFehler(tag('08:00','13:00','12:00','17:00', false)) === '');
  ok('Ueberschneidung zaehlt einmal: Tag 9 h, Woche entsprechend',
     hrTagH(tag('08:00','13:00','12:00','17:00')) === 9);
  const fp = defaultSched(); fp.weekCount = 2; fp.weeks[1][3] = tag('08:00','13:00','12:00','17:00');
  const f = schedFehler(fp);
  ok('schedFehler findet den Mittwoch in Woche 2', f && f.w === 1 && f.d === 3, JSON.stringify(f));
  ok('Woche 1 allein hat keinen', schedFehler(defaultSched()) === null);
  /* b · Pause nach § 11 AZG: mehr als 6 h, Luecke unter 30 Minuten */
  ok('Ein Block 08–15 (7 h): Hinweis', pauseFehlt(tag('08:00','15:00','13:00','17:00', false)));
  ok('Genau 6 h: kein Hinweis', !pauseFehlt(tag('08:00','14:00','13:00','17:00', false)));
  ok('7,75 h mit 15 Minuten: Hinweis', pauseFehlt(tag('08:00','12:00','12:15','16:00')));
  ok('7,5 h mit 30 Minuten: kein Hinweis', !pauseFehlt(tag('08:00','12:00','12:30','16:00')));
  /* c · Der Baustein zeigt beides und meldet den Fehler */
  let gemeldet = null;
  const zb = zeitBlock(tag('08:00','13:00','12:00','17:00'), (std, fehler) => { gemeldet = [std, fehler]; });
  const hw = zb.querySelector('.za-hinw');
  ok('Fehler steht unter der Summe', hw && !hw.hidden && hw.classList.contains('fehler') && hw.textContent.indexOf('Nachmittag beginnt') >= 0);
  ok('Und wird gemeldet, mit 9 h', gemeldet && gemeldet[0] === 9 && !!gemeldet[1], JSON.stringify(gemeldet));
  const zb2 = zeitBlock(tag('08:00','15:00','13:00','17:00', false), () => {});
  const hw2 = zb2.querySelector('.za-hinw');
  ok('Pausenhinweis ohne Fehlerfarbe', !hw2.hidden && !hw2.classList.contains('fehler') && hw2.textContent.indexOf('§ 11 AZG') >= 0);
  ok('Normaler Tag: kein Hinweis', zeitBlock(tag('08:00','12:00','13:00','17:00'), () => {}).querySelector('.za-hinw').hidden);
  /* d · Gesichert wird ein fehlerhafter Plan nicht */
  ME = normalize({ id:'pS', vorname:'S', dob:'1990-01-01' });
  const vorher = JSON.stringify(ME.sched);
  DRAFT = JSON.parse(JSON.stringify(ME.sched)); DRAFT.weeks[0][2] = tag('08:00','13:00','12:00','17:00');
  document.getElementById('hr-save').click();
  ok('Speichern mit Ueberschneidung: nicht gesichert, keine Rueckfrage',
     JSON.stringify(ME.sched) === vorher && !document.getElementById('sab').classList.contains('on'));
  ok('Die Meldung nennt den Tag', /^Dienstag: Der Nachmittag beginnt/.test(document.getElementById('toast-t').textContent),
     document.getElementById('toast-t').textContent);
  ok('Und der Tag ist aufgeklappt', _hrOffen === '0-2', _hrOffen);
  DRAFT = null;
  /* e · Zwei Wechsel ab demselben Tag: ersetzen, nicht ablegen */
  const pw = normalize({ id:'pW', vorname:'W', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
  schedWechsel(pw, '2026-10-01', ACHT);
  const drei = planMit('08:00','11:00');
  ok('Zweiter Wechsel am selben Tag geht', schedWechsel(pw, '2026-10-01', drei) === true);
  ok('Eine Fassung im Verlauf, die alte; der neue Plan gilt', pw.schedAlt.length === 1
     && weekTotal(pw.schedAlt[0].sched, 0) === 20 && weekTotal(pw.sched, 0) === 15, pw.schedAlt.length);
  ok('Davor 4 h, danach 3 h', evalDay(pw, 2026, 8, 28).work === 4 && evalDay(pw, 2026, 9, 5).work === 3);
  /* f · Der Assistent: Woche 1 ist die Woche ab dem Bezugsmontag */
  const bm = zaBezugMontag(), heute = new Date();
  ok('Der Bezugsmontag ist ein Montag in dieser oder der naechsten Woche',
     bm.getDay() === 1 && (bm - new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())) / 864e5 >= -6
     && (bm - new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())) / 864e5 <= 2, bm.toDateString());
  ZA.wc = 2; ZA.bezug = new Date(2026, 8, 28); ZA.sched = defaultSched();
  try{ zaFertig(); }catch(e){}
  ok('Nach dem Assistenten: KW 40 ist Woche 1, KW 41 Woche 2, KW 42 wieder 1',
     rhythmusWoche(OB.sched, new Date(2026, 8, 28)) === 0 && rhythmusWoche(OB.sched, new Date(2026, 9, 5)) === 1
     && rhythmusWoche(OB.sched, new Date(2026, 9, 14)) === 0, OB.sched.offset);
  ok('Und als bestaetigt vermerkt', OB.sched.rotOk === true && OB.sched.basis === 'lauf');
  ZA.wc = 3; ZA.bezug = new Date(2026, 9, 5); ZA.sched = defaultSched();
  try{ zaFertig(); }catch(e){}
  ok('Drei Wochen ab KW 41: KW 41 ist Woche 1, KW 43 Woche 3',
     rhythmusWoche(OB.sched, new Date(2026, 9, 5)) === 0 && rhythmusWoche(OB.sched, new Date(2026, 9, 21)) === 2);
  ZA.wc = 1; ZA.bezug = null;
  /* g · Planwechsel ab einem Datum: die Woche des Stichtags */
  ME = normalize({ id:'pR', vorname:'R', dob:'1990-01-01' });
  DRAFT = JSON.parse(JSON.stringify(ME.sched)); DRAFT.weekCount = 2;
  sabAuf(); sabSchritt(2);
  const feld = document.getElementById('sab-ab');
  feld.value = '2026-11-04'; feld.dispatchEvent(new window.Event('input'));
  const rotBox = document.getElementById('sab-rot');
  ok('Bei 2 Wochen fragt der Schritt nach der Woche am Stichtag', !rotBox.hidden
     && document.querySelectorAll('#sab-rot-w button').length === 2
     && document.getElementById('sab-rot-t').textContent.indexOf('ab Montag, 2. November (KW 45)') >= 0,
     document.getElementById('sab-rot-t').textContent);
  document.querySelector('#sab-rot-w [data-sabrot="1"]').click();
  ok('Woche 2 gewaehlt: am Stichtag laeuft Woche 2', rhythmusWoche(DRAFT, new Date(2026, 10, 4)) === 1
     && document.querySelector('#sab-rot-w [data-sabrot="1"]').classList.contains('on'));
  document.querySelector('#sab-rot-w [data-sabrot="0"]').click();
  ok('Und zurueck auf Woche 1', rhythmusWoche(DRAFT, new Date(2026, 10, 2)) === 0);
  DRAFT.weekCount = 1; sabRotMalen();
  ok('Bei einer Woche gibt es die Frage nicht', rotBox.hidden);
  sabZu(); DRAFT = null;
  /* h · Bestehende Konten mit 2 Wochen: einmal fragen */
  ME = normalize({ id:'pQ', vorname:'Q', dob:'1990-01-01' });
  ok('Eine Woche: keine Frage', !rotFrageNoetig());
  ME.sched.weekCount = 2;
  ok('Zwei Wochen ohne Bestaetigung: Frage', rotFrageNoetig());
  rotBarAuf();
  const rb = document.getElementById('rotbar');
  ok('Die Leiste nennt je Woche ihre Stunden', rb.classList.contains('on')
     && document.querySelectorAll('#rot-btns [data-rotw]').length === 2
     && document.querySelector('#rot-btns [data-rotw="0"] small').textContent === '44,00 h');
  const cur = rhythmusWoche(ME.sched, new Date()), ander = 1 - cur;
  document.querySelector('#rot-btns [data-rotw="' + ander + '"]').click();
  ok('Die andere gewaehlt: jetzt laeuft sie, und gefragt ist', rhythmusWoche(ME.sched, new Date()) === ander
     && ME.sched.rotOk === true && !rotFrageNoetig());
  ME = normalize({ id:'pQ2', vorname:'Q', dob:'1990-01-01' }); ME.sched.weekCount = 2;
  rotBarAuf();
  document.querySelector('#rotbar [data-close="rotbar"]').click();
  ok('Wegtippen ist auch eine Antwort', ME.sched.rotOk === true && !rotFrageNoetig());
  /* Gilt der aktuelle Plan erst ab spaeter, fragt die Leiste nicht. */
  ME = normalize({ id:'pQ3', vorname:'Q', dob:'1990-01-01' }); ME.sched.weekCount = 2;
  const morgen = new Date(); morgen.setDate(morgen.getDate() + 1);
  ME.schedAlt = [{ bis: key(morgen.getFullYear(), morgen.getMonth(), morgen.getDate()), sched: defaultSched() }];
  ok('Plan gilt erst ab spaeter: keine Frage', !rotFrageNoetig());
}
ME = null;
window.__FERTIG = true;
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

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
