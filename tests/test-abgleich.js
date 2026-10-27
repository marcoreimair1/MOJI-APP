/* Testlauf: Sichern mit Abgleich (seit 27.10.2026).
   Eine offene App schrieb vorher beim Sichern ihren ganzen Stand hoch und
   überschrieb, was inzwischen in der Cloud stand. Geprüft wird das
   Zusammenführen selbst, das Sichern gegen eine nachgebaute Cloud und die
   Entscheidung beim Anmelden. */
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
function kopie(x){ return JSON.parse(JSON.stringify(x)); }

/* ── Nachgebaute Cloud: eine Zeile, Filter wie PostgREST ── */
const WOLKE = { zeile:null, schreiben:0, filterAus:false, fehler:null };
function wolkeIst(k){
  const z = WOLKE.zeile;
  if(k === 'user_id') return z.user_id;
  if(k === 'data->>updated') return z.data.updated == null ? null : String(z.data.updated);
}
sb = {
  from(){
    return {
      upsert(row){
        if(WOLKE.fehler) return Promise.resolve({ error: WOLKE.fehler });
        WOLKE.zeile = kopie(row); WOLKE.schreiben++;
        return Promise.resolve({ error:null });
      },
      select(){
        return { eq(){ return { maybeSingle(){
          return Promise.resolve({ data: WOLKE.zeile ? { data: kopie(WOLKE.zeile.data) } : null, error:null });
        } }; } };
      },
      update(row){
        const filter = [];
        const q = {
          eq(k, v){ filter.push([k, 'eq', v]); return q; },
          is(k, v){ filter.push([k, 'is', v]); return q; },
          select(){
            if(WOLKE.fehler) return Promise.resolve({ data:null, error: WOLKE.fehler });
            const z = WOLKE.zeile;
            const passt = !!z && filter.every(f => f[1] === 'is' ? wolkeIst(f[0]) === null
              : (f[0] !== 'user_id' && WOLKE.filterAus) ? false : wolkeIst(f[0]) === String(f[2]));
            if(passt){ z.data = kopie(row.data); z.updated_at = row.updated_at; WOLKE.schreiben++; }
            return Promise.resolve({ data: passt ? [{ user_id: z.user_id }] : [], error:null });
          }
        };
        return q;
      }
    };
  }
};
CLOUD_ON = true;
UID = 'u-test';

function profil(){
  const p = normalize({ id:'pT', vorname:'Tina', nachname:'Test', dob:'1990-01-01', sched: defaultSched() });
  p.sched.weekCount = 2; p.sched.offset = 1;
  p.events = { '2026-10-05': { t:'urlaub', s:'full' } };
  p.post = [{ id:'a', text:'A' }];
  p.gelesen = ['n1'];
  p.updated = 1000;
  return p;
}

(async () => {
try {

/* ── 1 · Zusammenführen ── */
{
  const b = profil(), l = kopie(b), c = kopie(b);
  c.sched.offset = 0;                                   /* Korrektur in der Cloud */
  l.events['2026-10-27'] = { t:'urlaub', s:'full' };    /* neuer Eintrag hier */
  const evVorher = l.events;
  const r = abgFeld(l, b, c, true);
  ok('Nur in der Cloud geändert: kommt von dort', r.sched.offset === 0, r.sched.offset);
  ok('Nur hier geändert: bleibt', !!r.events['2026-10-27']);
  ok('Dasselbe Objekt bleibt erhalten (offene Ansichten behalten ihren Verweis)', r === l && r.events === evVorher);
  r.sched.offset = 7;
  ok('Übernommenes ist eine Kopie, die Cloud-Fassung bleibt unberührt', c.sched.offset === 0);
}
{
  const b = profil(), l = kopie(b), c = kopie(b);
  l.events['2026-10-27'] = { t:'urlaub', s:'full' };
  c.events['2026-10-28'] = { t:'krank', s:'full' };
  abgFeld(l, b, c, true);
  ok('Zwei neue Tage auf zwei Seiten: beide da', !!l.events['2026-10-27'] && !!l.events['2026-10-28']);
}
{
  const b = profil(), l = kopie(b), c = kopie(b);
  delete l.events['2026-10-05'];
  abgFeld(l, b, c, false);
  ok('Hier gelöscht, Cloud unverändert: bleibt gelöscht', !('2026-10-05' in l.events));
  const l2 = kopie(b), c2 = kopie(b);
  delete c2.events['2026-10-05'];
  l2.gelesen.push('n9');                                /* hier anderswo geändert */
  const r2 = abgFeld(l2, b, c2, true);
  ok('In der Cloud gelöscht, hier unverändert: fällt weg', r2 === l2 && !('2026-10-05' in l2.events));
  const l3 = kopie(b), c3 = kopie(b);
  delete c3.events['2026-10-05'];
  const r3 = abgFeld(l3, b, c3, true);
  ok('Hier gar nichts geändert: das Ergebnis ist der Cloud-Stand', abgGleich(r3, c3) && r3 !== c3);
}
{
  const b = profil();
  let l = kopie(b), c = kopie(b);
  l.events['2026-10-05'] = { t:'krank', s:'full' }; c.events['2026-10-05'] = { t:'eigen', s:'full', text:'Kurs' };
  abgFeld(l, b, c, true);
  ok('Beide ändern denselben Tag, hier jünger: hier gilt', l.events['2026-10-05'].t === 'krank');
  l = kopie(b); c = kopie(b);
  l.events['2026-10-05'] = { t:'krank', s:'full' }; c.events['2026-10-05'] = { t:'eigen', s:'full', text:'Kurs' };
  abgFeld(l, b, c, false);
  ok('... Cloud jünger: Cloud gilt, ganz', l.events['2026-10-05'].t === 'eigen' && l.events['2026-10-05'].text === 'Kurs');
}
{
  const b = profil(), l = kopie(b), c = kopie(b);
  l.post.push({ id:'b', text:'B' }); c.post.push({ id:'c', text:'C' });
  l.gelesen.push('n2'); c.gelesen = [];
  abgFeld(l, b, c, true);
  ok('Nachrichten mit Kennung: beide neuen da, keine doppelt', l.post.map(x => x.id).join() === 'a,b,c', l.post.map(x => x.id).join());
  ok('Gelesen-Liste: hier neu bleibt, in der Cloud entfernt fällt weg', l.gelesen.join() === 'n2', l.gelesen.join());
}
{
  const b = profil(), l = kopie(b), c = kopie(b);
  l.sched.weeks[0][1].vmTo = '11:00'; c.sched.weeks[0][2].vmTo = '10:00';
  abgFeld(l, b, c, false);
  ok('Wochen im Dienstplan (Liste ohne Kennung) gelten als ein Feld: die jüngere Fassung ganz',
     l.sched.weeks[0][2].vmTo === '10:00' && l.sched.weeks[0][1].vmTo === b.sched.weeks[0][1].vmTo);
}
{
  ok('Reihenfolge der Felder zählt nicht', abgGleich({ a:1, b:{ c:2, d:3 } }, { b:{ d:3, c:2 }, a:1 }));
  ok('Reihenfolge in Listen schon', !abgGleich([1, 2], [2, 1]));
  ok('Fehlendes Feld ist nicht gleich null', !abgGleich({ a:null }, {}));
}

/* ── 2 · Sichern gegen die Cloud ── */
{
  const p = profil();
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' }; WOLKE.schreiben = 0;
  ME = kopie(p); basisSetzen(p);
  ME.events['2026-10-27'] = { t:'urlaub', s:'full' }; ME.updated = 5000; _dirty = true;
  await cloudFlush();
  ok('Normal: einmal geschrieben', WOLKE.schreiben === 1, WOLKE.schreiben);
  ok('... die Cloud trägt den neuen Tag', !!WOLKE.zeile.data.events['2026-10-27']);
  ok('... die Basis ist jetzt der gesendete Stand', _basis.updated === 5000);
  ok('... auch im Gerätespeicher', JSON.parse(localStorage.getItem(basisKey())).updated === 5000);
  ok('... nichts mehr offen', _dirty === false);
}
{
  /* Der Fall vom 27.10.2026: Korrektur von Hand, die App lag offen. */
  const p = profil();
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' }; WOLKE.schreiben = 0;
  ME = kopie(p); basisSetzen(p);
  WOLKE.zeile.data.sched.offset = 0; WOLKE.zeile.data.updated = 2000;
  ME.events['2026-10-27'] = { t:'urlaub', s:'full' }; ME.updated = 3000; _dirty = true;
  const evVorher = ME.events, meVorher = ME;
  await cloudFlush();
  ok('Korrektur in der Cloud bleibt stehen', WOLKE.zeile.data.sched.offset === 0, WOLKE.zeile.data.sched.offset);
  ok('... und der neue Tag vom Gerät kommt dazu', !!WOLKE.zeile.data.events['2026-10-27']);
  ok('... auch die offene App zeigt jetzt die Korrektur', ME.sched.offset === 0);
  ok('... ME und seine Teile bleiben dieselben Objekte', ME === meVorher && ME.events === evVorher);
  ok('... der neue Stand ist jünger als die Korrektur', WOLKE.zeile.data.updated > 2000 && ME.updated === WOLKE.zeile.data.updated);
  ok('... nur einmal geschrieben (der erste Versuch traf nichts)', WOLKE.schreiben === 1, WOLKE.schreiben);
  ok('... nichts mehr offen', _dirty === false);
}
{
  /* Greift der Filter nicht, obwohl die Cloud auf der Basis steht: nicht
     endlos versuchen, sondern sichern wie früher. */
  const p = profil();
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' }; WOLKE.schreiben = 0; WOLKE.filterAus = true;
  ME = kopie(p); basisSetzen(p);
  ME.events['2026-10-29'] = { t:'krank', s:'full' }; ME.updated = 4000; _dirty = true;
  await cloudFlush();
  WOLKE.filterAus = false;
  ok('Filter greift nicht: trotzdem gesichert', WOLKE.schreiben === 1 && !!WOLKE.zeile.data.events['2026-10-29'], WOLKE.schreiben);
  ok('... und nichts mehr offen', _dirty === false);
}
{
  WOLKE.zeile = null; WOLKE.schreiben = 0;
  ME = profil(); basisSetzen(null); _dirty = true;
  await cloudFlush();
  ok('Ohne Basis (erstes Sichern): die Zeile wird angelegt', WOLKE.schreiben === 1 && WOLKE.zeile && WOLKE.zeile.data.vorname === 'Tina');
  ok('... danach gibt es eine Basis', _basis && _basis.vorname === 'Tina');
}
{
  const p = profil();
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' }; WOLKE.schreiben = 0;
  ME = kopie(p); basisSetzen(p);
  ME.updated = 6000; _dirty = true;
  const a = cloudFlush(), b = cloudFlush();
  await Promise.all([a, b]);
  ok('Zwei Sichern auf einmal laufen nacheinander, ohne Abgleich dazwischen',
     WOLKE.schreiben === 1 && WOLKE.zeile.data.updated === 6000 && _dirty === false, WOLKE.schreiben);
}
{
  const p = profil();
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' }; WOLKE.schreiben = 0;
  WOLKE.fehler = { message:'offline' };
  ME = kopie(p); basisSetzen(p); ME.updated = 7000; _dirty = true;
  await cloudFlush();
  WOLKE.fehler = null;
  ok('Fehler beim Sichern: bleibt offen, die Basis bleibt die alte', _dirty === true && _basis.updated === 1000);
}

/* ── 3 · Beim Anmelden ── */
{
  /* Was afterLogin sonst noch anstößt, hier still. */
  teamGesehen = () => {}; teeOffenLaden = () => {};
  pkRefresh = () => Promise.resolve();
  askPasskey = () => {}; appBetreten = () => {};
  const sitzung = { user:{ id: UID, email:'t@example.com' } };

  /* a) Ungesendetes hier, Korrektur in der Cloud */
  const p = profil();
  const cache = kopie(p); cache.events['2026-10-27'] = { t:'urlaub', s:'full' }; cache.updated = 3000;
  const cloud = kopie(p); cloud.sched.offset = 0; cloud.updated = 2000;
  localStorage.setItem(cacheKey(), JSON.stringify(cache));
  localStorage.setItem(basisKey(), JSON.stringify(p));
  WOLKE.zeile = { user_id: UID, data: kopie(cloud), updated_at:'' };
  _dirty = false;
  await afterLogin(sitzung, false); clearTimeout(_saveT);
  ok('Anmelden: Ungesendetes bleibt', !!ME.events['2026-10-27']);
  ok('... die Korrektur aus der Cloud auch', ME.sched.offset === 0);
  ok('... und geht gleich hoch', _dirty === true);
  ok('... gegen den Cloud-Stand als Basis', _basis.updated === 2000);

  /* b) Hier alles gesendet, Cloud jünger: die Cloud gilt */
  const c2 = kopie(p); c2.sched.offset = 0; c2.updated = 2500;
  localStorage.setItem(cacheKey(), JSON.stringify(p));
  localStorage.setItem(basisKey(), JSON.stringify(p));
  WOLKE.zeile = { user_id: UID, data: kopie(c2), updated_at:'' };
  _dirty = false;
  await afterLogin(sitzung, false); clearTimeout(_saveT);
  ok('Anmelden ohne Ungesendetes: Stand der Cloud', ME.sched.offset === 0 && ME.updated === 2500);
  ok('... nichts hochzuschicken', _dirty === false);

  /* c) Ungesendetes hier, Cloud unverändert seit der Basis */
  const c3 = kopie(p); c3.events['2026-10-30'] = { t:'krank', s:'full' }; c3.updated = 3300;
  localStorage.setItem(cacheKey(), JSON.stringify(c3));
  localStorage.setItem(basisKey(), JSON.stringify(p));
  WOLKE.zeile = { user_id: UID, data: kopie(p), updated_at:'' };
  _dirty = false;
  await afterLogin(sitzung, false); clearTimeout(_saveT);
  ok('Nur hier geändert: Stand vom Gerät, geht hoch', !!ME.events['2026-10-30'] && _dirty === true);

  /* d) Noch keine Basis (erstes Öffnen mit dieser Fassung): wie bisher */
  localStorage.setItem(cacheKey(), JSON.stringify(c3));
  localStorage.removeItem(basisKey());
  const c4 = kopie(p); c4.sched.offset = 0; c4.updated = 2000;
  WOLKE.zeile = { user_id: UID, data: kopie(c4), updated_at:'' };
  _dirty = false;
  await afterLogin(sitzung, false); clearTimeout(_saveT);
  ok('Ohne Basis: der jüngere Stand gilt ganz, wie bisher', !!ME.events['2026-10-30'] && ME.sched.offset === 1);
  ok('... und die Basis steht jetzt', _basis && _basis.updated === 2000);
}

/* ── 4 · Im Quelltext ── */
{
  const roh = document.documentElement.outerHTML;
  const loe = roh.indexOf('async function loeschenJetzt');
  ok('Konto löschen räumt auch die Basis weg', loe > 0 && roh.indexOf('basisSetzen(null);', loe) > 0
     && roh.indexOf('basisSetzen(null);', loe) < roh.indexOf("toast('Profil und Konto gelöscht')", loe));
}

} catch(e){ ok('Lauf ohne Ausnahme', false, e && e.stack); }
ME = null; CLOUD_ON = false; UID = null;
window.__FERTIG = true;
})();
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

const t0 = Date.now();
const warten = setInterval(() => {
  if (!dom.window.__FERTIG && Date.now() - t0 < 15000) return;
  clearInterval(warten);
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
}, 50);
