/* ══════════════════════════════════════════════════════════════
   MOJI · Monats-Erinnerung
   Läuft am Ersten jedes Monats und schreibt allen, die im Profil
   zugestimmt haben, eine kurze Mail: der Vormonat ist jetzt zum
   Abgeben frei.

   Wer keine Zustimmung gegeben hat, bekommt nichts.
   Wer den Monat schon exportiert hat, bekommt nichts.
   Wer die Mail für diesen Monat schon hat, bekommt nichts —
   dafür sorgt die Tabelle mail_log.

   Nötige Secrets in Supabase:
     RESEND_API_KEY      Schlüssel von resend.com
     MAIL_VON            Absender, Standard "MOJI <no-reply@moji-app.at>"
     MAIL_ANTWORT        Adresse für Antworten, Standard maru.arbeitszeiten@gmail.com

   Hinter no-reply@moji-app.at steckt kein Postfach — für den Versand
   genügen die DNS-Einträge von Resend. Damit eine Antwort trotzdem
   irgendwo ankommt, geht Reply-To an eine echte Adresse.
   Automatisch vorhanden:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
     Achtung: SUPABASE_SERVICE_ROLE_KEY enthaelt inzwischen den
     neuen sb_secret-Schluessel (41 Zeichen), nicht den Legacy-JWT
     (219 Zeichen), den der Zeitplan mitschickt. Deshalb prueft
     darfRein() beide Formen.
   ══════════════════════════════════════════════════════════════ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MONATE = ['Jänner','Februar','März','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Dezember'];
const LINK = 'https://moji-app.at/';
const LINK_TEE = 'https://moji-app.at/?tee';
const LINK_JAHR = 'https://moji-app.at/?jahr';

/* ─── Jahresrueckblick ─────────────────────────────────────────────
   Seit 06.10.2026 (Marco): der Rueckblick ist ab 1. November in der
   App. Am 1. November bekommt jedes Konto einmal davon Nachricht — wer
   an dem Tag ohnehin die Erinnerung bekommt, in derselben Mail als
   eigene Karte, alle anderen als kurze eigene Mail. Auch Konten ohne
   Zustimmung zur Erinnerung (Entscheidung Marco). mail_log mit
   lauf "rueckblick-JJJJ", art "rueckblick" haelt fest, wer sie hat. */
function rueckblickJahr(heute: Date){
  return heute.getUTCMonth() === 10 ? heute.getUTCFullYear() : null;
}
function betreffRueckblick(jahr: number){
  return 'Dein Jahr ' + jahr + ' mit MOJI ist da';
}
function textRueckblickTeil(jahr: number){
  return 'Dein Jahresrückblick ' + jahr + ' ist da: deine Stunden, dein stärkster Monat, deine Stufe '
    + 'und alles, was du dieses Jahr geschafft hast. Zum Durchtippen wie eine Story.\n'
    + 'Du findest ihn in MOJI auf der Export-Seite ganz oben, bis Ende Jänner:\n'
    + LINK_JAHR + '\n\n';
}
function textRueckblick(vorname: string, jahr: number){
  return 'Hallo ' + vorname + ',\n\n'
    + 'ab heute wartet in MOJI dein Jahresrückblick ' + jahr + ': deine Stunden, dein stärkster Monat, '
    + 'deine Stufe und alles, was du dieses Jahr geschafft hast. Zum Durchtippen wie eine Story.\n\n'
    + 'Du findest ihn in MOJI auf der Export-Seite ganz oben:\n' + LINK_JAHR + '\n\n'
    + 'Er bleibt bis Ende Jänner für dich da.\n\n'
    + 'MOJI · Mehr Zeit fürs Wesentliche\n'
    + 'Eine App von Studio MARU 丸\n\n'
    + 'Eine einmalige Nachricht zu deinem Jahresrückblick in MOJI.';
}
/* In der eigenen Mail der Hauptknopf; unter der Erinnerung zweitrangig
   wie „Bubble Tea zurückschicken" — dort ist „Abgeben" die Hauptsache. */
function rueckblickKnopf(zweit = false){
  if(zweit) return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="m-knopf2" style="border-radius:999px;background:#F5EAFE;"><a href="${LINK_JAHR}" style="display:inline-block;padding:13px 24px;border-radius:999px;font:600 14.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A21FE0;text-decoration:none;">Rückblick ansehen</a></td>
    </tr></table>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:999px;background:#C643FE;"><a href="${LINK_JAHR}" style="display:inline-block;padding:15px 28px;border-radius:999px;font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FFFFFF;text-decoration:none;">Rückblick ansehen</a></td>
    </tr></table>`;
}
/* Die Karte unter der Erinnerung (wie die Bubble-Tea-Karte). */
function rueckblickTeil(jahr: number | null){
  if(!jahr) return '';
  return `  <tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>
  <tr><td class="m-karte" style="background:#FFFFFF;border:1px solid #ECE6F3;border-radius:24px;padding:30px 32px 30px;">
    <h2 class="m-titel" style="margin:0 0 6px;font:600 19px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.01em;color:#1A1026;">Dein Jahr ${jahr} mit MOJI ist da</h2>
    <p class="m-text" style="margin:0 0 20px;font:400 14.5px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#5E5569;">Deine Stunden, dein stärkster Monat, deine Stufe und alles, was du dieses Jahr geschafft hast. Zum Durchtippen wie eine Story, auf der Export-Seite ganz oben, bis Ende Jänner.</p>
    ${rueckblickKnopf(true)}
  </td></tr>
`;
}

/* Der Monat, an den erinnert wird: der gerade abgeschlossene. */
function vormonat(heute: Date){
  const y = heute.getUTCFullYear(), m = heute.getUTCMonth();
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}

function betreff(name: string){
  return name + ' ist bereit zum Abgeben';
}

/* Wer einem einen Bubble Tea geschickt hat, auf den man noch nicht
   geantwortet hat — dieselbe Regel wie tee_senden(): die Seite, deren
   Datum juenger ist, wartet auf die andere. */
type Tee = { vorname: string, kuerzel: string, avatar: number, am: string };

/* Kurze, warme Ansprache — kein Werbeton. */
function textFassung(vorname: string, monat: string, tee: Tee[] = [], jahr: number | null = null){
  return 'Hallo ' + vorname + ',\n\n'
    + 'dein ' + monat + ' ist abgeschlossen und bereit zum Abgeben.\n'
    + 'Ein Blick in MOJI, Export drücken, fertig.\n\n'
    + LINK + '\n\n'
    + (jahr ? textRueckblickTeil(jahr) : '')
    + (tee.length
        ? teeTitel(tee.length) + ': ' + tee.map(teeName).join(', ') + '.\n'
          + 'Schick einen zurück: ' + LINK_TEE + '\n\n'
        : '')
    + 'MOJI · Mehr Zeit fürs Wesentliche\n'
    + 'Eine App von Studio MARU 丸\n\n'
    + 'Diese Erinnerung kommt einmal im Monat, weil du sie erlaubt hast. '
    + 'Im Profilmenü der App schaltest du sie jederzeit ab.';
}

/* Der Vorname kommt aus dem Profil, das jeder selbst schreibt — ins HTML
   nur maskiert. */
function esc(s: string){
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as Record<string,string>)[c]);
}

/* ─── Die Bubble Teas unter der Karte ──────────────────────────────
   Eine Zeile je Kollegin oder Kollege, mit dem Profilbild aus der App
   (als quadratisches JPEG unter mail-av/, weil Outlook kein WebP zeigt),
   hoechstens fuenf, der Rest als Zahl. Darunter ein Knopf, der in MOJI
   direkt die Bubble-Tea-Seite oeffnet (?tee). */
const AV_MAX = 116;
const ZAHLWORT = ['', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn'];
function avBild(n: number){
  return 'https://moji-app.at/mail-av/av-' + (Number.isInteger(n) && n >= 1 && n <= AV_MAX ? n : 1) + '.jpg';
}
function teeName(t: Tee){ return t.vorname + (t.kuerzel ? ' ' + t.kuerzel + '.' : ''); }
function teeTitel(n: number){
  return (ZAHLWORT[n] || String(n)) + (n === 1 ? ' Bubble Tea wartet' : ' Bubble Teas warten') + ' auf dich';
}
function teeTag(iso: string){
  const t = String(iso).split('-').map(Number);
  return t.length === 3 && t[1] >= 1 && t[1] <= 12 ? t[2] + '. ' + MONATE[t[1] - 1] : '';
}
/* Die andere Seite hat zuletzt geschickt, man selbst seither nicht:
   ihr Datum ist juenger als das eigene, oder man hat nie geschickt.
   Gleicher Tag heisst, beide haben — dann wartet niemand. */
function wartendFuer(uid: string, reihen: any[], person: Map<string, any>): Tee[] {
  const aus: Tee[] = [];
  for(const t of reihen){
    if(t.a !== uid && t.b !== uid) continue;
    const ichA = t.a === uid;
    const meins = ichA ? t.letzt_a : t.letzt_b;
    const seins = ichA ? t.letzt_b : t.letzt_a;
    if(!seins || (meins && meins >= seins)) continue;
    const m = person.get(ichA ? t.b : t.a);
    if(!m) continue;
    aus.push({ vorname: String(m.vorname || '').trim() || 'Jemand',
               kuerzel: String(m.kuerzel || '').trim(),
               avatar: Number(m.avatar), am: String(seins) });
  }
  return aus.sort((x, y) => y.am.localeCompare(x.am));
}
function teeTeil(tee: Tee[]){
  if(!tee.length) return '';
  const zeig = tee.slice(0, 5), rest = tee.length - zeig.length;
  const satz = tee.length === 1
    ? esc(tee[0].vorname) + ' hat dir einen geschickt. Jetzt bist du dran.'
    : 'Sie haben dir einen geschickt. Jetzt bist du dran.';
  const zeilen = zeig.map((t, i) => `
      <tr><td class="m-linie" style="padding:12px 0;${i ? 'border-top:1px solid #F0EBF5;' : ''}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:13px;vertical-align:middle;"><img src="${avBild(t.avatar)}" width="40" height="40" alt="" style="display:block;border:0;border-radius:12px;"></td>
          <td style="vertical-align:middle;">
            <div class="m-titel" style="font:600 15px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1026;">${esc(teeName(t))}</div>
            <div class="m-leise" style="font:400 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A39AAF;">${teeTag(t.am) ? 'am ' + teeTag(t.am) : ''}</div>
          </td>
        </tr></table>
      </td></tr>`).join('');
  return `  <tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>
  <tr><td class="m-karte" style="background:#FFFFFF;border:1px solid #ECE6F3;border-radius:24px;padding:30px 32px 30px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle;">
        <h2 class="m-titel" style="margin:0 0 6px;font:600 19px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.01em;color:#1A1026;">${teeTitel(tee.length)}</h2>
        <p class="m-text" style="margin:0;font:400 14.5px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#5E5569;">${satz}</p>
      </td>
      <td width="36" style="padding-left:14px;vertical-align:middle;"><img src="https://moji-app.at/mail-tee.png" width="28" height="48" alt="" style="display:block;border:0;"></td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">${zeilen}
    </table>${rest > 0 ? `
    <p class="m-leise" style="margin:4px 0 0;font:400 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A39AAF;">und ${rest} ${rest === 1 ? 'weitere Person' : 'weitere'}</p>` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr>
      <td class="m-knopf2" style="border-radius:999px;background:#F5EAFE;"><a href="${LINK_TEE}" style="display:inline-block;padding:13px 24px;border-radius:999px;font:600 14.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A21FE0;text-decoration:none;">Bubble Tea zurückschicken</a></td>
    </tr></table>
  </td></tr>
`;
}

/* Seit 27.09.2026 dieselbe Huelle wie die beiden Anmeldemails in mail/:
   hell, eine weisse Karte, das App-Symbol mit Wortmarke oben, ein Knopf.
   Im Dunkelmodus (Apple Mail, Outlook am Mac) die dunkle Fassung. */
/* Die Huelle aller MOJI-Mails: Kopf mit Wortmarke, eine weisse Karte,
   darunter weitere Karten (nach) und der Fuss. */
function huelle(titel: string, vorschau: string, karte: string, nach: string){
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${titel}</title>
<!-- MOJI · Mail-Huelle. Dieselbe in mail/anmeldung.html, mail/registrierung.html
     und monatsmail.ts — tests/test-mail.js prueft, dass sie gleich bleibt. -->
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark}
  body{margin:0;padding:0;-webkit-text-size-adjust:100%}
  a{text-decoration:none}
  @media (prefers-color-scheme:dark){
    .m-grund{background:#0C090F !important}
    .m-karte{background:#16111D !important;border-color:#271F30 !important}
    .m-titel,.m-code{color:#F3EEFF !important}
    .m-text{color:#B3A9C1 !important}
    .m-leise{color:#766D83 !important}
    .m-feld{background:#211A2B !important;border-color:#2E2539 !important}
    .m-linie{border-color:#271F30 !important}
    .m-link{color:#DC8AFF !important}
    .m-knopf2{background:#2A1E37 !important}
    .m-knopf2 a{color:#E4A4FF !important}
    .m-wort-tinte{display:none !important}
    .m-wort-hell{display:inline-block !important}
  }
</style>
</head>
<body class="m-grund" style="margin:0;padding:0;background:#F6F3FA;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;">${vorschau}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="m-grund" style="background:#F6F3FA;">
<tr><td align="center" style="padding:44px 16px 52px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;">
  <tr><td style="padding:0 6px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:11px;vertical-align:middle;"><img src="https://moji-app.at/icon-180.png" width="34" height="34" alt="" style="display:block;border:0;border-radius:10px;"></td>
      <td style="vertical-align:middle;"><img class="m-wort-tinte" src="https://moji-app.at/moji-mail-wort-tinte.png" width="61" height="16" alt="MOJI" style="display:inline-block;border:0;"><img class="m-wort-hell" src="https://moji-app.at/moji-mail-wort-hell.png" width="61" height="16" alt="MOJI" style="display:none;mso-hide:all;border:0;"></td>
    </tr></table>
  </td></tr>
  <tr><td class="m-karte" style="background:#FFFFFF;border:1px solid #ECE6F3;border-radius:24px;padding:38px 32px 34px;">
${karte}  </td></tr>
${nach}  <tr><td class="m-leise" style="padding:22px 8px 0;font:400 12px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A39AAF;text-align:center;">
    MOJI · Mehr Zeit fürs Wesentliche<br>Eine App von Studio MARU 丸
  </td></tr>
</table>
</td></tr></table>
</body>
</html>
`;
}
function htmlFassung(vorname: string, monat: string, tee: Tee[] = [], jahr: number | null = null){
  vorname = esc(vorname);
  const teeHtml = rueckblickTeil(jahr) + teeTeil(tee);
  return huelle(monat + ' ist bereit zum Abgeben', monat + ' ist bereit zum Abgeben.', `    <h1 class="m-titel" style="margin:0 0 12px;font:600 26px/1.22 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.02em;color:#1A1026;">${monat} ist bereit.</h1>
    <p class="m-text" style="margin:0 0 26px;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#5E5569;">Hallo ${vorname}, dein ${monat} ist abgeschlossen. Ein Blick in MOJI, Export drücken, fertig.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:999px;background:#C643FE;"><a href="${LINK}" style="display:inline-block;padding:15px 28px;border-radius:999px;font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FFFFFF;text-decoration:none;">${monat} abgeben</a></td>
    </tr></table>
    <p class="m-leise m-linie" style="margin:28px 0 0;padding-top:20px;border-top:1px solid #F0EBF5;font:400 12.5px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A39AAF;">Diese Erinnerung kommt einmal im Monat, weil du sie erlaubt hast. Im Profilmenü der App schaltest du sie jederzeit ab.</p>
`, teeHtml);
}
/* Die kurze eigene Mail zum Jahresrueckblick — fuer alle, die am
   1. November keine Erinnerung bekommen. */
function htmlRueckblick(vorname: string, jahr: number){
  vorname = esc(vorname);
  return huelle('Dein Jahr ' + jahr + ' mit MOJI ist da', 'Dein Jahresrückblick ' + jahr + ' wartet in MOJI.', `    <h1 class="m-titel" style="margin:0 0 12px;font:600 26px/1.22 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.02em;color:#1A1026;">Dein Jahr ${jahr} ist da.</h1>
    <p class="m-text" style="margin:0 0 14px;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#5E5569;">Hallo ${vorname}, ab heute wartet in MOJI dein Jahresrückblick ${jahr}: deine Stunden, dein stärkster Monat, deine Stufe und alles, was du dieses Jahr geschafft hast. Zum Durchtippen wie eine Story.</p>
    <p class="m-text" style="margin:0 0 26px;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#5E5569;">Du findest ihn in MOJI auf der Export-Seite ganz oben. Er bleibt bis Ende Jänner für dich da.</p>
    ${rueckblickKnopf()}
    <p class="m-leise m-linie" style="margin:28px 0 0;padding-top:20px;border-top:1px solid #F0EBF5;font:400 12.5px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#A39AAF;">Eine einmalige Nachricht zu deinem Jahresrückblick in MOJI.</p>
`, '');
}

/* ─── Versand in Ruhe ──────────────────────────────────────────────
   Resend nimmt im freien Zugang 2 Anfragen pro Sekunde an. Am
   01.09.2026 gingen alle Mails ohne Pause hinaus — 4 von 10 kamen an,
   alle in derselben Sekunde, der Rest bekam eine Absage. Jetzt:
   zwischen zwei Mails mindestens PAUSE_MS, und bei "zu schnell" (429)
   oder einem Fehler bei Resend (5xx) bis zu vier neue Versuche —
   so lange, wie Resend im Kopf retry-after verlangt, sonst 1, 2, 4, 8 s.
   Was dann noch scheitert, holt der naechste Lauf am selben Tag nach:
   mail_log kennt nur, was wirklich hinausging. */
const PAUSE_MS = 650;
const VERSUCHE = 5;
/* Supabase beendet eine Funktion im freien Zugang nach 150 s, der
   Zeitplan wartet 120 s. Nach 100 s bleibt der Rest liegen — der
   naechste Lauf am selben Tag holt ihn. */
const ZEIT_MS = 100000;
const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
function wartezeit(antwort: Response, versuch: number){
  const s = Number(antwort.headers.get('retry-after'));
  return Number.isFinite(s) && s > 0 ? Math.min(s * 1000, 20000) : 1000 * 2 ** versuch;
}
async function sendeMitGeduld(key: string, inhalt: unknown): Promise<Response> {
  let antwort: Response | null = null;
  for(let versuch = 0; versuch < VERSUCHE; versuch++){
    antwort = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(inhalt)
    });
    if(antwort.status !== 429 && antwort.status < 500) return antwort;
    if(versuch < VERSUCHE - 1) await warte(wartezeit(antwort, versuch));
  }
  return antwort!;
}

Deno.serve(async (req) => {
  /* ── Wer darf die Funktion aufrufen? ───────────────────────────
     Am Gateway ist "Verify JWT with legacy secret" eingeschaltet,
     die Signatur ist also schon geprueft, wenn wir hier ankommen.
     Der anon-Schluessel steht aber offen in index.html — deshalb
     muss zusaetzlich die Rolle stimmen.

     Zwei erlaubte Formen:
       a) der Schluessel aus SUPABASE_SERVICE_ROLE_KEY (neues
          sb_secret-Format, direkter Vergleich)
       b) der Legacy-JWT mit role = service_role

     WICHTIG: "Verify JWT with legacy secret" muss eingeschaltet
     bleiben. Ohne die Signaturpruefung am Gateway koennte sonst
     jeder ein JWT mit role=service_role zusammenbasteln.
     ─────────────────────────────────────────────────────────── */
  const dienst = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if(!dienst){
    return new Response('SUPABASE_SERVICE_ROLE_KEY nicht verfuegbar', { status: 500 });
  }

  const mitgebracht = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

  function darfRein(t: string): boolean {
    if(!t) return false;
    if(t === dienst) return true;                 /* a) */
    const teile = t.split('.');                   /* b) */
    if(teile.length !== 3) return false;
    try{
      const roh = teile[1].replace(/-/g, '+').replace(/_/g, '/');
      const p = JSON.parse(atob(roh + '='.repeat((4 - roh.length % 4) % 4)));
      return p.role === 'service_role';
    }catch(_e){ return false; }
  }

  if(!darfRein(mitgebracht)){
    return new Response('nein', { status: 401 });
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, dienst);
  const key = Deno.env.get('RESEND_API_KEY');
  const von = Deno.env.get('MAIL_VON') || 'MOJI <no-reply@moji-app.at>';
  const antwortAn = Deno.env.get('MAIL_ANTWORT') || 'maru.arbeitszeiten@gmail.com';
  if(!key) return new Response('RESEND_API_KEY fehlt', { status: 500 });

  const heute = new Date();
  const vm = vormonat(heute);
  const monat = MONATE[vm.m];                       /* "Juli" */
  const expKey = vm.y + '-' + vm.m;                 /* "2026-6" */
  const lauf = vm.y + '-' + String(vm.m + 1).padStart(2, '0'); /* "2026-07" */
  const jahr = rueckblickJahr(heute);              /* im November das Jahr, sonst null */
  const laufJr = jahr ? 'rueckblick-' + jahr : '';

  /* Alle Profile holen. Klein genug für einen Zug; bei Wachstum
     kommt hier ein Filter auf data->>'mailOk' dazu. */
  const { data: reihen, error } = await sb
    .from('records').select('user_id, data');
  if(error) return new Response(error.message, { status: 500 });

  const bericht = { gesendet: 0, rueckblick: 0, uebersprungen: 0, vertagt: 0, fehler: [] as string[] };
  let zuletzt = 0;
  const schluss = Date.now() + ZEIT_MS;

  /* Die Bubble Teas: alle Paare und alle Mitglieder einmal holen. Geht
     das schief, kommt die Erinnerung trotzdem — nur ohne die Liste. */
  const { data: teeReihen } = await sb.from('tee').select('a, b, letzt_a, letzt_b');
  const { data: leute } = await sb.from('mitglieder').select('user_id, vorname, kuerzel, avatar');
  const person = new Map((leute || []).map((m: any) => [m.user_id, m]));

  for(const r of (reihen || [])){
    const p = r.data || {};
    /* Die Nachricht zum Jahresrueckblick: im November einmal an jedes
       Konto, auch ohne Zustimmung zur Erinnerung (Marco, 06.10.2026). */
    let rueckblick = false;
    if(laufJr){
      const { data: altJr } = await sb.from('mail_log')
        .select('user_id').eq('user_id', r.user_id).eq('lauf', laufJr).maybeSingle();
      rueckblick = !altJr;
    }
    /* Die Erinnerung: nur mit Zustimmung, nur wer noch nicht abgegeben
       hat, nur einmal im Monat. */
    let erinnern = true;
    if(p.mailOk !== true) erinnern = false;
    else if(p.exp && p.exp[expKey]) erinnern = false;
    else {
      /* Schon geschrieben? Der eindeutige Index in mail_log fängt
         Doppelläufe ohnehin ab, aber wir fragen vorher, um die
         Zustellung nicht unnötig anzustoßen. */
      const { data: alt } = await sb.from('mail_log')
        .select('user_id').eq('user_id', r.user_id).eq('lauf', lauf).maybeSingle();
      if(alt) erinnern = false;
    }
    if(!erinnern && !rueckblick){ bericht.uebersprungen++; continue; }

    const { data: u } = await sb.auth.admin.getUserById(r.user_id);
    const mail = u && u.user && u.user.email;
    if(!mail){ bericht.uebersprungen++; continue; }

    const vorname = (p.vorname || '').trim() || 'du';
    const tee = wartendFuer(r.user_id, teeReihen || [], person);

    if(Date.now() > schluss){ bericht.vertagt++; continue; }
    /* Abstand zur vorigen Mail — auch nach einem Fehler. */
    const seit = Date.now() - zuletzt;
    if(seit < PAUSE_MS) await warte(PAUSE_MS - seit);
    zuletzt = Date.now();
    try{
      /* Eine Mail je Person: die Erinnerung (mit der Rueckblick-Karte,
         wenn faellig) oder die kurze Rueckblick-Mail. */
      const antwort = await sendeMitGeduld(key, erinnern ? {
        from: von, to: [mail],
        reply_to: [antwortAn],
        subject: betreff(monat),
        text: textFassung(vorname, monat, tee, rueckblick ? jahr : null),
        html: htmlFassung(vorname, monat, tee, rueckblick ? jahr : null)
      } : {
        from: von, to: [mail],
        reply_to: [antwortAn],
        subject: betreffRueckblick(jahr!),
        text: textRueckblick(vorname, jahr!),
        html: htmlRueckblick(vorname, jahr!)
      });
      if(!antwort.ok) throw new Error(antwort.status + ' ' + await antwort.text());
      if(erinnern) await sb.from('mail_log').insert({ user_id: r.user_id, lauf: lauf, art: 'monat' });
      if(rueckblick) await sb.from('mail_log').insert({ user_id: r.user_id, lauf: laufJr, art: 'rueckblick' });
      if(erinnern) bericht.gesendet++;
      if(rueckblick) bericht.rueckblick++;
    }catch(e){
      /* Ohne Adresse im Protokoll der Funktion — nur die Kennung. */
      console.error('[monatsmail] nicht zugestellt', r.user_id, String(e));
      bericht.fehler.push(r.user_id + ': ' + String(e));
    }
  }

  return new Response(JSON.stringify({ monat, lauf, ...bericht }, null, 2),
    { headers: { 'Content-Type': 'application/json' } });
});
