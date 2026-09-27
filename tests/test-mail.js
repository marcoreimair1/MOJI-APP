/* Testlauf: Die Mails an die Mitglieder.

   Seit 27.09.2026 tragen alle drei dieselbe Huelle: hell, eine weisse
   Karte, App-Symbol und Wortmarke oben, die Markenfarbe nur im Code-Feld,
   im Knopf und im Link, dazu eine dunkle Fassung.

     mail/anmeldung.html      Supabase → Magic link or OTP
     mail/registrierung.html  Supabase → Confirm signup
     monatsmail.ts            die Monats-Erinnerung (Edge Function)

   Diese Reihe prueft die Dateien im Projekt, nicht index.html — ein
   Dateiname als Argument (von alle.js) wird ignoriert. */
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
const bilder = [...new Set([anm, reg, mon].flatMap(s => [...s.matchAll(/src="([^"]+)"/g)].map(m => m[1])))];
ok('Drei Bilder insgesamt', bilder.length === 3, bilder.join(', '));
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
  .replace(/: string/g, '').replace(/ as Record<string,string>/g, '');
const LINK = 'https://moji-app.at/';
let bau;
try{ bau = new Function('LINK', fn + '; return { textFassung, htmlFassung, esc };')(LINK); }
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

/* ── 7 · Die Versandlogik ist unberuehrt ── */
ok('Der Betreff bleibt', mon.includes("return name + ' ist bereit zum Abgeben';"));
ok('Nur mit Zustimmung', mon.includes("if(p.mailOk !== true){ bericht.uebersprungen++; continue; }"));
ok('Nicht, wer schon abgegeben hat', mon.includes("if(p.exp && p.exp[expKey]){ bericht.uebersprungen++; continue; }"));
ok('Nicht zweimal im Monat', mon.includes(".eq('user_id', r.user_id).eq('lauf', lauf).maybeSingle();"));
ok('Die Rolle wird weiter geprueft', mon.includes("return p.role === 'service_role';"));

let schlecht = 0;
console.log('');
E.forEach(e => {
  if (!e.ok) schlecht++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
