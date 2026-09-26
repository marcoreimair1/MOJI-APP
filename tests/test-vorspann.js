/* Testlauf: Vorspann — Ladebalken und die Reihenfolge Symbol → Profilbild.
   Abgemeldet. Geprueft werden die gesetzten Werte, nicht das Aussehen:
   jsdom rechnet keine CSS-Uebergaenge, aber die Inline-Werte am Balken
   sagen genau, was der Browser animieren wuerde. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(fs.readFileSync(DATEI, 'utf8'), {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* ── 1 · Zeiten stehen und sind plausibel ── */
ok('INTRO_MIN 2,45 s', INTRO_MIN === 2450, INTRO_MIN);
ok('INTRO_LANG laenger als INTRO_MIN', INTRO_LANG > INTRO_MIN, INTRO_LANG + ' > ' + INTRO_MIN);
ok('Notbremse liegt hinter beiden', INTRO_MAX > INTRO_LANG, INTRO_MAX);

/* ── 2 · Auf dem Vorspann stehen das Maennchen und ein leiser Balken ──
   Wortmarke und Slogan sind am 14.09.2026 entfallen. Der Balken kam
   zurueck, nachdem der Vorspann ohne ihn wie ein Haenger aussah. */
ok('Der leise Balken ist da',     !!document.querySelector('#splash .sp-lade #sp-bar'));
ok('Und steht im gesicherten Markup', INTRO_HTML.indexOf('sp-bar') > -1);
ok('Das Bild liegt im Vorspann',  !!document.querySelector('#splash .mark-logo #mark-img'));
ok('Der Glanz liegt darueber',    !!document.querySelector('#splash .mark-logo #mark-glanz'));
ok('Der Balken kommt nach dem Hintergrund', BALKEN_AB > 0 && BALKEN_AB < LOGO_AB,
   BALKEN_AB + ' < ' + LOGO_AB);
ok('Das Zeichen kommt vor dem Ende', LOGO_AB < INTRO_MIN, LOGO_AB + ' < ' + INTRO_MIN);
/* Der Vorspann soll ein Moment sein, kein Warten: wer ihn wieder
   verlaengert, faellt hier auf. */
ok('Das Zeichen kommt in der ersten Sekunde', LOGO_AB < 1000, LOGO_AB);
ok('Der Vorspann steht keine drei Sekunden', INTRO_LANG < 3000, INTRO_LANG);

/* ── 3 · playIntro setzt das freigestellte Maennchen ── */
ME = null;
playIntro();
var bild = document.querySelector('#mark-img');
ok('Vorspann laeuft', window.__introLaeuft === true);
ok('Freigestellt, nicht die Kachel', bild.getAttribute('src') === LOGO_MOJI);
ok('Der Glanz traegt es als Maske',
   document.querySelector('#mark-glanz').style.getPropertyValue('--moji-maske').indexOf('data:image/webp') > -1);
ok('Noch kein Ende gesetzt', !window.__introEnde, window.__introEnde);

/* ── 3b · Das Zeichen wartet, bis es wirklich dekodiert ist ──
   Direkt nach playIntro() steht die Huelle noch ohne Vermerk da — und
   damit unsichtbar. Frueher blendete sie nach fester Uhr auf und war
   beim ersten Besuch kurz leer. */
ok('Das Zeichen ist noch verdeckt', !document.getElementById('mark-wrap').classList.contains('da'));
ok('Und der Balken noch bei null', document.getElementById('sp-bar').style.width === '0px'
   || document.getElementById('sp-bar').style.width === '', document.getElementById('sp-bar').style.width);

/* ── 3c · Kein Zug nimmt einen spaeteren zurueck ──
   Meldet sich eine Ansicht frueh, laeuft der letzte Zug sofort. Der
   Zug auf 86 %, der per Uhr noch aussteht, darf ihn nicht zurueckholen. */
balkenZug(3, 100, '100%');
ok('Letzter Zug sitzt', document.getElementById('sp-bar').style.width === '100%');
balkenZug(2, 100, '86%');
ok('Ein frueherer Zug holt ihn nicht zurueck',
   document.getElementById('sp-bar').style.width === '100%',
   document.getElementById('sp-bar').style.width);
playIntro();
ok('Neuer Durchlauf faengt wieder bei null an', _balkenZug === 0, _balkenZug);

/* ── 4 · Ohne Anmeldung die lange Fassung ──
   Gemessen wird der gemerkte Endzeitpunkt. Frueher lief diese Pruefung
   ueber die Dauer des letzten Balkenzugs — ein Umweg, der mit dem
   Balken weggefallen ist. */
introAppSteht();
var langRest = window.__introEnde - window.__introStart;
ok('Ohne Anmeldung: rund INTRO_LANG',
   Math.abs(langRest - INTRO_LANG) < 250, langRest + ' ms');
endIntro();

/* ── 5 · Angemeldet die kuerzere Fassung ── */
playIntro();
ME = { vorname: 'Test', nachname: 'Fall', dob: '1990-01-01' };
introAppSteht();
var kurzRest = window.__introEnde - window.__introStart;
ok('Angemeldet: kuerzer als ohne Anmeldung', kurzRest < langRest,
   kurzRest + ' ms < ' + langRest + ' ms');
ok('Angemeldet: rund INTRO_MIN', Math.abs(kurzRest - INTRO_MIN) < 250, kurzRest + ' ms');

/* ── 6 · Zweimal melden aendert nichts ── */
var vorher = window.__introEnde;
introAppSteht();
ok('Zweite Meldung laesst das Ende in Ruhe', window.__introEnde === vorher);

/* ── 7 · Der Gruss wartet, statt sich darueberzulegen ── */
var hallo = document.querySelector('#hallo');
var sp = document.querySelector('#splash');
hallo.classList.remove('on','weg','ab','neu');
zeigeGruss('an');
ok('Waehrend des Vorspanns liegt kein Profilbild oben', !hallo.classList.contains('on'));
ok('Der Gruss steht in der Schlange', _nachIntro.length === 1, _nachIntro.length);

/* ── 8 · Uebergabe: der Gruss kommt sofort, der Vorspann bleibt stehen ──
   Frueher blendete der Vorspann erst ganz aus, gab dabei den Kalender frei
   und der Gruss legte sich danach wieder darueber. Genau diese Luecke
   wird hier ausgeschlossen. */
endIntro();
ok('Der Gruss ist sofort da', hallo.classList.contains('on'), 'Klassen: ' + hallo.className);
ok('Der Vorspann blendet dabei NICHT aus', !sp.classList.contains('done'));
ok('Der Vorspann steht noch', sp.style.display !== 'none', sp.style.display || '(leer)');
ok('Der Vorspann ist als Uebergabe vermerkt', sp.dataset.uebergabe === '1');
ok('Schlange ist leer', _nachIntro.length === 0, _nachIntro.length);
ok('Vorspann gilt als aus', window.__introLaeuft === false);
/* Seit 26.09.2026: die App kommt erst hoch, wenn der Gruss deckt. Der
   Vorspann ist durchsichtig — sofort freigegeben, schienen Kalender und
   Leiste durch den noch halb aufgeblendeten Gruss. */
ok('Die App wartet, bis der Gruss deckt', !document.querySelector('#app').classList.contains('on'));
ok('Die Leiste bleibt so lange versteckt', document.body.classList.contains('locked'));
ok('Und das Warten ist nicht kuerzer als das Aufblenden', UEBERGABE >= GRUSS_REIN,
   UEBERGABE + ' >= ' + GRUSS_REIN);

window.__WEITER = function(){
  ok('Danach kommt die App darunter hoch', document.querySelector('#app').classList.contains('on'));
  ok('Und die Leiste ist frei', !document.body.classList.contains('locked'));
  ok('Vorspann ist danach abgeraeumt', sp.style.display === 'none', sp.style.display);
  ok('Uebergabe-Vermerk ist weg', !sp.dataset.uebergabe);
  ok('Der Gruss liegt immer noch oben', hallo.classList.contains('on'));

  /* ── 9 · Ohne Gruss der normale Weg: ausblenden, App freigeben ── */
  playIntro();
  ok('playIntro raeumt den Uebergabe-Vermerk weg', !sp.dataset.uebergabe);
  ME = null;
  introAppSteht();
  endIntro();
  ok('Ohne Gruss blendet der Vorspann aus', sp.classList.contains('done'));
  ok('Ausblenden dauert INTRO_WEG', INTRO_WEG >= 900, INTRO_WEG);
  ok('Der Gruss blendet mindestens so lang aus wie frueher', GRUSS_WEG >= 560, GRUSS_WEG);
  ok('Uebergabe ist kuerzer als das Ausblenden', UEBERGABE < INTRO_WEG,
     UEBERGABE + ' < ' + INTRO_WEG);

  /* ── 10 · Die Kopfleiste wartet auf den freien Schirm ──
     Das Tier rutscht nach unten und die rote Zahl poppt auf. Frueher
     lief das stur 4,5 s nach dem Betreten — also genau hinter dem
     Gruss, und niemand sah es. */
  var echtPfNeu = window.pfNeu;
  window.pfNeu = function(){ return [{ id:'x' }]; };
  ME = { vorname:'Test', nachname:'Fall', dob:'1990-01-01' };
  var w = document.querySelector('#avwrap');
  playIntro();
  zaehlerAnlauf();
  ok('Waehrend des Vorspanns keine Meldung', !w.classList.contains('meldung'));
  ok('Der Anlauf steht in der Warteschlange', _wennFrei.length === 1, _wennFrei.length);
  var hallo2 = document.querySelector('#hallo');
  hallo2.classList.add('on');
  endIntro();
  /* Der Vorspann raeumt sich erst nach INTRO_WEG ab. Hier geht es um die
     zweite Sperre — den Gruss —, also den Vorspann von Hand beenden. */
  window.__introLaeuft = false;
  schirmPruefen();
  ok('Mit dem Gruss oben gilt der Schirm als belegt', schirmBelegt());
  ok('Und der Anlauf wartet weiter', _wennFrei.length === 1, _wennFrei.length);
  hallo2.classList.remove('on');
  schirmPruefen();
  ok('Schirm frei -> Warteschlange geleert', _wennFrei.length === 0);
  ok('Der Atemzug laeuft noch', !w.classList.contains('meldung'));
  ok('Atemzug ist kurz genug zum Wahrnehmen', ZAEHLER_ATEM <= 1000, ZAEHLER_ATEM);

  setTimeout(function(){
    ok('Nach dem Atemzug ist die Meldung da', w.classList.contains('meldung'),
       'Klassen: ' + w.className);

    /* ── 11 · Anmelden: erst der Vorhang, dann der Wechsel ──
       Frueher: enterApp(); zeigeHallo(); — also Kalender aufbauen und
       ihn dann zudecken. Man sah ihn kurz aufblitzen, und der Anlauf
       der Kopfleiste lief hinter dem Gruss ab, weil der Schirm zum
       Zeitpunkt von enterApp() noch frei war. */
    _wennFrei = [];
    w.classList.remove('meldung');
    /* Vollstaendig normalisiert: enterApp() rechnet Urlaub, Konten und
       Kalender durch — ein halbes Profil bricht dabei ab. */
    ME = normalize({ id:'t2', vorname:'Test', nachname:'Fall', dob:'1990-01-01' });
    loginScreen();
    var hallo3 = document.querySelector('#hallo');
    hallo3.classList.remove('on','weg','ab','neu');
    ok('Vor dem Anmelden steht die Anmeldeseite',
       document.querySelector('#v-login').classList.contains('on'));

    appBetreten(true);
    ok('Der Gruss ist sofort oben', hallo3.classList.contains('on'));
    ok('Die Ansicht hat NOCH nicht gewechselt',
       !document.querySelector('#v-cal').classList.contains('on'));
    ok('Und die Kopfleiste laeuft noch nicht an', !w.classList.contains('meldung'));

    setTimeout(function(){
      ok('Unter dem deckenden Gruss wechselt die Ansicht',
         document.querySelector('#v-cal').classList.contains('on'));
      ok('Der Anlauf der Kopfleiste steht jetzt an', _wennFrei.length === 1, _wennFrei.length);

      /* ── 12 · Waehrend des Vorspanns bleibt die alte Reihenfolge ──
         Sonst meldete go() dem Vorspann nie, dass der Start durch ist,
         und er stuende bis zur Notbremse. */
      _wennFrei = [];
      hallo3.classList.remove('on','weg','ab','neu');
      playIntro();
      loginScreen();
      appBetreten(true);
      ok('Bei laufendem Vorspann wechselt die Ansicht sofort',
         document.querySelector('#v-cal').classList.contains('on'));
      ok('Und der Vorspann weiss, dass der Start durch ist', _appSteht === true);
      endIntro();

      window.pfNeu = echtPfNeu;
      ME = null;
      window.__FERTIG = true;
    }, GRUSS_REIN + 250);
  }, ZAEHLER_ATEM + 300);
};
setTimeout(window.__WEITER, UEBERGABE + 400);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  /* Abmelden laesst sich hier nicht durchspielen — signOut() ginge ins
     Netz. Geprueft wird deshalb am Quelltext, dass der sichtbare Teil
     hinter der Uhr liegt, die den Gruss decken laesst. */
  const roh = fs.readFileSync(DATEI, 'utf8');
  [['Abmelden wartet, bis der Gruss deckt', /const gedeckt = wait\(GRUSS_REIN\);/],
   ['Und wechselt die Seite erst danach', /await gedeckt;[\s\S]{0,400}loginScreen\(\);/],
   ['GRUSS_REIN passt zu halloRein', /\.hallo\.on\{display:grid;animation:halloRein \.62s/],
   /* Seit 14.09.2026 steht auf dem Vorspann nur das freigestellte Bild. */
   ['Der Glanz liegt in einer eigenen Huelle', /\.mark-glanz::after\{[\s\S]{0,700}kartenGlanz/],
   ['Er wandert in der gedrehten Achse', /@keyframes kartenGlanz\{[\s\S]{0,200}rotate\(45deg\) translateX/],
   ['Die Huelle traegt das Bild als Maske', /\.mark-glanz\{[\s\S]{0,400}mask-image:var\(--moji-maske\)/],
   ['Ohne Maskenunterstuetzung kein Band', /@supports \(\(-webkit-mask-image[\s\S]{0,220}\.mark-glanz\{ display:block \}/],
   ['Das Bild steht frei — keine Flaeche, kein Schatten',
    /\.mark-logo\{[\s\S]{0,260}box-shadow:none!important/],
   ['Weniger Bewegung schaltet den Glanz ab',
    /prefers-reduced-motion:reduce\)\{\s*\n\s*\.mark-glanz\{ display:none!important \}/],
   /* Der Balken traegt keine eigene Farbe: im Hellen Grau, im Dunkeln
      ein leises Weiss — beides aus --tx-rgb. */
   ['Der Balken nimmt die Textfarbe der Fassung',
    /\.sp-lade i\{[\s\S]{0,220}background:rgba\(var\(--tx-rgb\),\.45\)/],
   ['Und bleibt duenn und schmal',
    /\.sp-lade\{[\s\S]{0,120}width:min\(38vw,132px\); height:2px/],
   ['Der Glanz laeuft genau einmal',
    /\.mark-wrap\.da \.mark-glanz::after\{[\s\S]{0,120}kartenGlanz [\d.]+s [\d.]+s var\(--ease\) 1 both/],
   ['Das Zeichen ist erst mit dem Vermerk zu sehen',
    /\.mark-wrap\{[\s\S]{0,220}opacity:0[\s\S]{0,220}\.mark-wrap\.da\{opacity:1/],
   ['Und es wartet auf das dekodierte Bild', /bild\.decode \? bild\.decode\(\)/],
   /* ─── 20.09.2026: Milchglas ohne Schliere ──────────────────────
      Ein Verlauf im Grund und ein ueberall gleich starker
      Weichzeichner passen nicht zusammen: unten sieht man durch eine
      fast ungetoente, aber kraeftig verwaschene Schicht, darunter ist
      der Inhalt gestochen scharf. Die Leiste liest sich dann als
      Schliere, und was darin sitzt, steht halb drin. */
   ['Die Kopfleiste traegt eine gleichmaessige Toenung',
    /\.topbar\{position:sticky[\s\S]{0,240}background:rgba\(var\(--s-tief\),\.78\);/],
   ['Auch am Handy, wo sie duenner ist',
    /\.topbar\{background:rgba\(var\(--s-tief\),\.72\)\}/],
   ['Und nirgends mehr einen Verlauf', (roh) => !/\.topbar\{[^}]*linear-gradient/.test(roh)],
   /* Die beiden Leisten, die absichtlich auslaufen, tragen dafuer gar
      keinen Weichzeichner mehr — der Verlauf allein reicht. */
   ['Die Fusszeile laeuft aus, ohne zu verwaschen',
    (roh) => /\.fabbar\{[\s\S]{0,400}rgba\(var\(--s-tief\),\.94\) 42%\)\}/.test(roh)
             && !/\.fabbar\{[\s\S]{0,400}backdrop-filter/.test(roh)],
   ['Und die klebende Knopfzeile auch',
    (roh) => /\.navrow\.sticky\.solid\{background:linear-gradient\(180deg,rgba\(var\(--s-tief\),0\),rgba\(var\(--s-tief\),\.94\) 42%\)\}/.test(roh)],
   /* Am 15.09.2026 war das lebende Maennchen kurz hier. Es steht jetzt
      im Ladekreis beim Export — siehe test-export.js. Der Vorspann
      zeigt wieder nur das Standbild aus dem Quelltext. */
   ['Der Vorspann nimmt nur das Standbild',
    /bild\.src = LOGO_MOJI;\s*\n\s*const glanz = \$\('#mark-glanz'\);/]
  ].forEach(([n, re]) => {
    const gut = (typeof re === 'function') ? re(roh) : re.test(roh);
    E.push({ n, ok: gut, z: gut ? '' : 'fehlt' });
  });
  [['Und holt sich dafuer keine Datei', roh.indexOf('lebenHolen') < 0],
   ['Keine zweite Kachelgroesse im Vorspann', roh.indexOf('.mark-logo.lebt') < 0],
   ['Und kein preload im Kopf', roh.indexOf('rel="preload"') < 0]
  ].forEach(([n, gut]) => E.push({ n, ok: gut, z: gut ? '' : 'steht noch drin' }));
  /* Im Vorspann-Markup darf nichts davon mehr vorkommen. */
  const splash = (roh.match(/<div id="splash"[\s\S]*?\n<\/div>/) || [''])[0];
  [['Keine Unterzeile im Vorspann', splash.indexOf('subline') < 0],
   ['Keine Wortmarke im Vorspann',  splash.indexOf('mark-wort') < 0],
   ['Der Balken steht im Vorspann', splash.indexOf('sp-lade') > -1],
   ['Bild und Glanz sind da',       splash.indexOf('mark-img') > -1 && splash.indexOf('mark-glanz') > -1]
  ].forEach(([n, gut]) => E.push({ n, ok: gut, z: gut ? '' : 'siehe #splash' }));
  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
}, 6200);
