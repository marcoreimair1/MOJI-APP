/* Testlauf: Die Mails an die Mitglieder.

   Seit 27.09.2026 tragen alle drei dieselbe Huelle: hell, eine weisse
   Karte, App-Symbol und Wortmarke oben, die Markenfarbe nur im Code-Feld,
   im Knopf und im Link, dazu eine dunkle Fassung.

     mail/anmeldung.html      Supabase → Magic link or OTP
     mail/registrierung.html  Supabase → Confirm signup
     monatsmail.ts            die Monats-Erinnerung (Edge Function)

   Die Mails prueft diese Reihe in den Dateien im Projekt. Nur den Weg
   ?tee in der App prueft sie an index.html — oder an der Datei, die
   alle.js als Argument mitgibt. */
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const lies = n => fs.readFileSync(path.join(WURZEL, n), 'utf8');
const anm = lies('mail/anmeldung.html');
const reg = lies('mail/registrierung.html');
const mon = lies('monatsmail.ts');

const E = [];
const ok = (n, b, z) => E.push({ n, ok: !!b, z: z === undefined ? '' : String(z) });

/* ── 1 · Eine Huelle fuer alle drei ── */
const stil = s => (s.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
ok('Die Anmeldung hat die Huelle', stil(anm).length > 300);
ok('Die Registrierung dieselbe', stil(reg) === stil(anm));
ok('Die Erinnerung dieselbe', stil(mon) === stil(anm));
const kopfZeile = s => (s.match(/<img class="m-wort-tinte"[^>]*>/) || [''])[0];
ok('Derselbe Kopf mit Wortmarke', kopfZeile(anm) && kopfZeile(reg) === kopfZeile(anm) && kopfZeile(mon) === kopfZeile(anm));
const fuss = 'MOJI · Mehr Zeit fürs Wesentliche<br>Eine App von Studio MARU 丸';
ok('Derselbe Fuss', [anm, reg, mon].every(s => s.includes(fuss)));

/* ── 2 · Hell und dunkel ── */
ok('Alle erlauben beide Fassungen', [anm, reg, mon].every(s =>
  s.includes('<meta name="color-scheme" content="light dark">')
  && s.includes('<meta name="supported-color-schemes" content="light dark">')));
ok('Im Dunkeln tauscht die Wortmarke', /@media \(prefers-color-scheme:dark\)\{[\s\S]*\.m-wort-tinte\{display:none !important\}[\s\S]*\.m-wort-hell\{display:inline-block !important\}/.test(anm));
ok('Die helle Wortmarke ist sonst versteckt, auch in Outlook', /class="m-wort-hell"[^>]*style="display:none;mso-hide:all;/.test(anm));

/* ── 3 · Die Marke, nicht mehr Nachtblau und Gelb ── */
ok('Knopf in Markenviolett', mon.includes('background:#C643FE;'));
ok('Das alte Nachtblau ist weg', ![anm, reg, mon].some(s => /#050d24|#0b1533/i.test(s)));
ok('Das alte Gelb ist weg', ![anm, reg, mon].some(s => /#F7D774/i.test(s)));
ok('Die alte Wortmarke auf Nachtblau wird nicht mehr benutzt',
   ![anm, reg, mon].some(s => s.includes('moji-mail-wortmarke.png')));

/* ── 4 · Bilder: absolut und im Projekt vorhanden ── */
/* Feste Adressen; die Profilbilder der Bubble-Tea-Liste stehen als
   \${avBild(...)} da und werden unten eigens geprueft. */
const bilder = [...new Set([anm, reg, mon].flatMap(s => [...s.matchAll(/src="([^"$]+)"/g)].map(m => m[1])))];
ok('Vier feste Bilder: Symbol, zwei Wortmarken, der Becher', bilder.length === 4, bilder.join(', '));
ok('Alle von moji-app.at geladen — Mailprogramme kennen keine relativen Pfade',
   bilder.every(b => b.startsWith('https://moji-app.at/')), bilder.join(', '));
ok('Und alle liegen im Projekt, also auch auf der Seite',
   bilder.every(b => fs.existsSync(path.join(WURZEL, b.replace('https://moji-app.at/', '')))));
ok('Alle mit Breite, Hoehe und Alternativtext',
   [anm, reg, mon].every(s => [...s.matchAll(/<img [^>]*>/g)].every(m => /width="\d+"/.test(m[0]) && /height="\d+"/.test(m[0]) && / alt="/.test(m[0]))));

/* ── 5 · Die Anmeldemails ── */
ok('Anmeldung: der Code steht im Code-Feld', /class="m-feld m-code"[^>]*>\{\{ \.Token \}\}<\/td>/.test(anm));
ok('Anmeldung: der Link als Ausweg', anm.includes('href="{{ .ConfirmationURL }}"'));
ok('Anmeldung: der Code steht schon in der Vorschauzeile', /mso-hide:all;opacity:0;">Dein Code für MOJI: \{\{ \.Token \}\}<\/div>/.test(anm));
ok('Registrierung: Code und Link', /class="m-feld m-code"[^>]*>\{\{ \.Token \}\}<\/td>/.test(reg) && reg.includes('href="{{ .ConfirmationURL }}"'));
ok('Registrierung: begruesst', reg.includes('>Willkommen bei MOJI</h1>'));
ok('„E‑Mail‑Adresse" bricht nicht um', reg.includes('E&#8209;Mail&#8209;Adresse'));
ok('Keine anderen Platzhalter als diese beiden',
   [anm, reg].every(s => [...s.matchAll(/\{\{[^}]*\}\}/g)].every(m => /^\{\{ \.(Token|ConfirmationURL) \}\}$/.test(m[0]))));

/* ── 6 · Die Erinnerung rechnet und maskiert ──
   monatsmail.ts ist TypeScript fuer Deno; die drei Funktionen fuer den
   Text werden herausgeloest, von ihren Typen befreit und hier ausgefuehrt. */
const stueck = (von, bis) => mon.slice(mon.indexOf(von), mon.indexOf(bis));
let fn = stueck('function textFassung(', 'Deno.serve(')
  .replace(/ as Record<string,string>/g, '')
  .replace(/: Map<string, any>/g, '')
  .replace(/: Promise<Response>/g, '').replace(/: Response \| null/g, '')
  .replace(/antwort!;/g, 'antwort;')
  .replace(/: (unknown|Response)(?=[,)=\s])/g, '')
  .replace(/\): Tee\[\] \{/g, ') {')
  .replace(/: (string|number|any\[\]|Tee\[\]|Tee)(?=[,)=\s])/g, '');
const LINK = 'https://moji-app.at/', LINK_TEE = 'https://moji-app.at/?tee';
const MONATE = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
let bau;
/* fetch und setTimeout kommen von aussen — so laesst sich der Versand
   ohne Netz und ohne echtes Warten pruefen. */
const NETZ = { antworten: [], aufrufe: 0, gewartet: [] };
function falschesFetch(){
  NETZ.aufrufe++;
  const a = NETZ.antworten.shift() || { status: 200 };
  return Promise.resolve({ status: a.status, ok: a.status >= 200 && a.status < 300,
    headers: { get: k => (k === 'retry-after' && a.retry) ? String(a.retry) : null }, text: () => Promise.resolve('') });
}
function falschesWarten(f, ms){ NETZ.gewartet.push(ms); f(); }
try{ bau = new Function('LINK', 'LINK_TEE', 'MONATE', 'fetch', 'setTimeout',
       fn + '; return { textFassung, htmlFassung, esc, wartendFuer, teeTeil, sendeMitGeduld, PAUSE_MS, VERSUCHE, ZEIT_MS };')
       (LINK, LINK_TEE, MONATE, falschesFetch, falschesWarten); }
catch(e){ ok('Die Textfunktionen lassen sich ausfuehren', false, e.message); }
if(bau){
  const h = bau.htmlFassung('<b>Ann</b> & "Co"', 'September');
  ok('Der Monat steht im Titel', h.includes('>September ist bereit.</h1>'));
  ok('Der Knopf fuehrt in die App', h.includes('<a href="https://moji-app.at/"') && h.includes('>September abgeben</a>'));
  ok('Der Name wird maskiert', h.includes('Hallo &lt;b&gt;Ann&lt;/b&gt; &amp; &quot;Co&quot;,') && !h.includes('<b>Ann</b>'));
  ok('Kein Platzhalter bleibt stehen', !/\$\{|\{\{/.test(h));
  const t = bau.textFassung('Ann', 'September');
  ok('Die Textfassung sagt dasselbe', t.includes('dein September ist abgeschlossen') && t.includes(LINK));
  ok('Und nennt, wie man sie abschaltet', t.includes('Im Profilmenü der App schaltest du sie jederzeit ab.'));
}

/* ── 7 · Die Bubble Teas, die auf Antwort warten ── */
if(bau){
  const ohne = bau.htmlFassung('Ann', 'September');
  ok('Ohne wartende Bubble Teas keine zweite Karte', !ohne.includes('Bubble Tea') && !ohne.includes('mail-tee.png'));
  const anna = { vorname:'Anna', kuerzel:'M', avatar:7, am:'2026-09-24' };
  const eins = bau.htmlFassung('Ann', 'September', [anna]);
  ok('Mit einem: „Ein Bubble Tea wartet auf dich"', eins.includes('>Ein Bubble Tea wartet auf dich</h2>'));
  ok('Mit Namen im Satz', eins.includes('Anna hat dir einen geschickt. Jetzt bist du dran.'));
  ok('Die Zeile zeigt Profilbild, Namen und Tag',
     eins.includes('src="https://moji-app.at/mail-av/av-7.jpg"') && eins.includes('>Anna M.</div>') && eins.includes('>am 24. September</div>'));
  ok('Der Knopf fuehrt in die Bubble-Tea-Seite', eins.includes('<a href="https://moji-app.at/?tee"') && eins.includes('>Bubble Tea zurückschicken</a>'));
  ok('Die Karte steht unter der Erinnerung, vor dem Fuss',
     eins.indexOf('September abgeben') < eins.indexOf('Bubble Tea wartet') && eins.indexOf('Bubble Tea wartet') < eins.indexOf('MOJI · Mehr Zeit'));
  ok('Kein Platzhalter bleibt stehen', !/\$\{|\{\{/.test(eins));
  const sieben = Array.from({ length: 7 }, (_, i) => ({ vorname:'P' + i, kuerzel:'', avatar:i + 1, am:'2026-09-0' + (i + 1) }));
  const viele = bau.htmlFassung('Ann', 'September', sieben);
  ok('Sieben: die Zahl als Wort', viele.includes('>Sieben Bubble Teas warten auf dich</h2>'));
  ok('Hoechstens fuenf Zeilen', (viele.match(/mail-av\/av-/g) || []).length === 5);
  ok('Der Rest als Zahl', viele.includes('>und 2 weitere</p>'));
  ok('Ohne Kuerzel kein Punkt', viele.includes('>P0</div>'));
  const fremd = bau.htmlFassung('Ann', 'September', [{ vorname:'<i>X</i>', kuerzel:'', avatar:999, am:'2026-09-01' }]);
  ok('Fremde Namen werden maskiert', fremd.includes('&lt;i&gt;X&lt;/i&gt;') && !fremd.includes('<i>X</i>'));
  ok('Ein unbekanntes Bild faellt auf das erste zurueck', fremd.includes('mail-av/av-1.jpg') && !fremd.includes('av-999'));
  const t = bau.textFassung('Ann', 'September', [anna]);
  ok('Die Textfassung nennt sie auch', t.includes('Ein Bubble Tea wartet auf dich: Anna M.') && t.includes(LINK_TEE));

  /* Wer wartet: dieselbe Regel wie tee_senden(). */
  const P = new Map([['b', { vorname:'Bea', kuerzel:'K', avatar:3 }], ['c', { vorname:'Cem', kuerzel:'', avatar:4 }],
                     ['d', { vorname:'Dora', kuerzel:'', avatar:5 }], ['e', { vorname:'Emil', kuerzel:'', avatar:6 }]]);
  const R = [
    { a:'a', b:'b', letzt_a:'2026-09-10', letzt_b:'2026-09-20' },   /* Bea juenger: wartet */
    { a:'a', b:'c', letzt_a:'2026-09-22', letzt_b:'2026-09-20' },   /* ich juenger: nicht */
    { a:'a', b:'d', letzt_a:null,         letzt_b:'2026-09-25' },   /* nie geschickt: wartet */
    { a:'a', b:'e', letzt_a:'2026-09-21', letzt_b:'2026-09-21' },   /* gleicher Tag: nicht */
    { a:'b', b:'c', letzt_a:null,         letzt_b:'2026-09-26' },   /* nicht meins */
    { a:'a', b:'x', letzt_a:null,         letzt_b:'2026-09-26' }    /* ausgetreten */
  ];
  const w = bau.wartendFuer('a', R, P);
  ok('Es warten genau Dora und Bea, die juengste zuerst', w.map(x => x.vorname).join(',') === 'Dora,Bea', w.map(x => x.vorname).join(','));
  ok('Mit dem Tag der anderen Seite', w[1].am === '2026-09-20');
  ok('Auch von der b-Seite aus gerechnet', bau.wartendFuer('c', R, new Map([['b', { vorname:'Bea' }], ['a', { vorname:'Al' }]])).length === 1);
}
ok('Jedes Profilbild liegt als JPEG bereit',
   Array.from({ length: 116 }, (_, i) => 'mail-av/av-' + (i + 1) + '.jpg').every(f => fs.existsSync(path.join(WURZEL, f))));
ok('So viele wie in der App', fs.readdirSync(WURZEL).filter(f => /^av-\d+\.webp$/.test(f)).length === 116
   && mon.includes('const AV_MAX = 116;'));
ok('Die Liste kommt auch dann, wenn die Abfrage scheitert, nur leer',
   mon.includes("const tee = wartendFuer(r.user_id, teeReihen || [], person);"));

/* ── 7b · Wirklich jede Mail kommt an ──
   Am 01.09.2026 gingen 4 von 10 hinaus, alle in einer Sekunde: Resend
   nimmt im freien Zugang 2 Anfragen pro Sekunde. */
async function versandPruefen(){
  if(!bau) return;
  ok('Zwischen zwei Mails mindestens 0,65 s — unter 2 pro Sekunde', bau.PAUSE_MS >= 500 && bau.PAUSE_MS < 2000, bau.PAUSE_MS);
  ok('Die Pause gilt auch nach einem Fehler, vor jeder Mail',
     /const seit = Date\.now\(\) - zuletzt;\s*\n\s*if\(seit < PAUSE_MS\) await warte\(PAUSE_MS - seit\);\s*\n\s*zuletzt = Date\.now\(\);\s*\n\s*try\{/.test(mon));
  const lauf = async (antworten) => {
    NETZ.antworten = antworten.slice(); NETZ.aufrufe = 0; NETZ.gewartet = [];
    const a = await bau.sendeMitGeduld('k', {});
    return { status: a.status, aufrufe: NETZ.aufrufe, gewartet: NETZ.gewartet.slice() };
  };
  let r = await lauf([{ status: 200 }]);
  ok('Klappt es sofort: ein Aufruf, kein Warten', r.aufrufe === 1 && r.gewartet.length === 0 && r.status === 200);
  r = await lauf([{ status: 429, retry: 2 }, { status: 200 }]);
  ok('„Zu schnell": wartet so lange, wie Resend sagt, und versucht es nochmal',
     r.aufrufe === 2 && r.gewartet.join() === '2000' && r.status === 200, JSON.stringify(r));
  r = await lauf([{ status: 429 }, { status: 503 }, { status: 200 }]);
  ok('Ohne Angabe wartet es 1 s, dann 2 s', r.aufrufe === 3 && r.gewartet.join() === '1000,2000' && r.status === 200, JSON.stringify(r));
  r = await lauf([{ status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }, { status: 200 }]);
  ok('Hoechstens fuenf Versuche, dann gibt es auf', r.aufrufe === 5 && r.status === 500 && r.gewartet.length === 4, JSON.stringify(r));
  r = await lauf([{ status: 422 }]);
  ok('Eine falsche Anfrage wird nicht wiederholt', r.aufrufe === 1 && r.status === 422);
  r = await lauf([{ status: 429, retry: 600 }, { status: 200 }]);
  ok('Hoechstens 20 s Wartezeit, auch wenn Resend mehr verlangt', r.gewartet.join() === '20000');
  ok('Nach 100 s bleibt der Rest dem naechsten Lauf', bau.ZEIT_MS === 100000
     && mon.includes('if(Date.now() > schluss){ bericht.vertagt++; continue; }'));
  ok('Ins Protokoll nur, was wirklich hinausging',
     /if\(!antwort\.ok\) throw new Error[^\n]*\n\s*await sb\.from\('mail_log'\)\.insert/.test(mon));
  ok('Keine Mailadressen im Bericht', !/bericht\.fehler\.push\(mail/.test(mon));
}

/* ── 7c · Zeitplan und Zustimmung (Migration) ── */
const mig = lies('supabase/migrations/20260927120000_monatsmail_alle.sql');
ok('Am Ersten dreimal: 05:10, 06:10, 08:10 UTC', mig.includes("schedule := '10 5,6,8 1 * *'"));
ok('Der Aufruf wartet 2 Minuten statt 5 Sekunden', mig.includes('timeout_milliseconds := 120000'));
ok('Die alten Antworten werden gesichert, bevor alle an sind',
   mig.indexOf('insert into public.mail_zustimmung_vorher') > 0
   && mig.indexOf('insert into public.mail_zustimmung_vorher') < mig.indexOf('update public.records'));
ok('Die Sicherung ist fuer niemanden lesbar', mig.includes('revoke all on public.mail_zustimmung_vorher from anon, authenticated;'));
ok('Ein Ausloeser haelt die Zustimmung gegen alte App-Fassungen',
   /if \(old\.data \? 'mailStand'\) and not \(new\.data \? 'mailStand'\) then/.test(mig));
ok('Die Migration probiert beides selbst aus', mig.includes('alte Fassung haette die Zustimmung ueberschrieben')
   && mig.includes('eine eigene Wahl wuerde nicht gelten'));

/* ── 8 · In der App: ?tee oeffnet die Bubble-Tea-Seite ──
   Zwei Instanzen: eine mit ?tee, eine ohne. Hier wird index.html
   geprueft — die Datei aus dem Argument, falls alle.js eine mitgibt. */
const { JSDOM, VirtualConsole } = require('jsdom');
const APP = process.argv[2] || path.join(WURZEL, 'index.html');
function starte(adresse){
  const vc = new VirtualConsole();
  ['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));
  const d = new JSDOM(fs.readFileSync(APP, 'utf8'), { url: adresse, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  const sk = d.window.document.createElement('script');
  sk.textContent = `window.__V = TEE_ZIEL;
    ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
    enterApp();
    window.__A = document.querySelector('.view.on') && document.querySelector('.view.on').id;
    window.__N = TEE_ZIEL;
    ME = null;`;
  d.window.document.body.appendChild(sk);
  return d.window;
}
const mit = starte('https://moji-app.at/?tee');
ok('Mit ?tee merkt sich die App den Wunsch', mit.__V === true);
ok('Und oeffnet nach dem Einstieg die Bubble-Tea-Seite', mit.__A === 'v-firma', mit.__A);
ok('Nur einmal', mit.__N === false && mit.sessionStorage.getItem('moji.tee') === null);
ok('Und ?tee ist aus der Adresse verschwunden', mit.location.search === '', mit.location.search);
const ohne = starte('https://moji-app.at/');
ok('Ohne ?tee beginnt sie im Kalender', ohne.__V === false && ohne.__A === 'v-cal', ohne.__A);
const aehnlich = starte('https://moji-app.at/?teeX=1');
ok('Ein aehnlicher Parameter zaehlt nicht', aehnlich.__V === false);

/* ── 9 · Die Versandlogik ist unberuehrt ── */
ok('Der Betreff bleibt', mon.includes("return name + ' ist bereit zum Abgeben';"));
ok('Nur mit Zustimmung', mon.includes("if(p.mailOk !== true){ bericht.uebersprungen++; continue; }"));
ok('Nicht, wer schon abgegeben hat', mon.includes("if(p.exp && p.exp[expKey]){ bericht.uebersprungen++; continue; }"));
ok('Nicht zweimal im Monat', mon.includes(".eq('user_id', r.user_id).eq('lauf', lauf).maybeSingle();"));
ok('Die Rolle wird weiter geprueft', mon.includes("return p.role === 'service_role';"));

/* ── 10 · Die App schreibt mailStand bei jeder eigenen Wahl ── */
const app = fs.readFileSync(APP, 'utf8');
ok('Die Fassung der Zustimmung steht in der App', app.includes('const MAIL_STAND = 2;'));
ok('An allen vier Stellen, an denen man waehlt, und beim Anlegen',
   (app.match(/ME\.mailStand = MAIL_STAND;/g) || []).length === 4 && app.includes('mailStand: MAIL_STAND,'));
ok('normalize erfindet ihn nicht — sonst wuerde ein alter Stand als eigene Wahl gelten',
   !/function normalize\([\s\S]{0,4000}mailStand/.test(app));

versandPruefen().then(ende);
function ende(){
let schlecht = 0;
console.log('');
E.forEach(e => {
  if (!e.ok) schlecht++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
}
