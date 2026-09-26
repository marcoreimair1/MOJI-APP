/* Testlauf: Profilmenü — Schliessen, Ruecksprung, Schieberegler.
   Abgemeldet. Masse und Ueberlauf lassen sich in jsdom nicht pruefen
   (es rechnet kein Layout) — die stehen im Browser nachgemessen im
   Commit. Hier geht es um Verhalten und darum, dass die Regeln, auf
   denen die Masse beruhen, ueberhaupt in der Datei stehen. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const roh = fs.readFileSync(DATEI, 'utf8');
/* Die Regeln der Datenbank stehen nicht in index.html — geprueft wird
   gegen die Migration, die sie zuletzt gesetzt hat. */
const policy = (function(){
  try{
    const d = path.join(__dirname, '..', 'supabase', 'migrations');
    return fs.readdirSync(d).filter(f => /team_policy|team_nachzug|team_ausloeser/.test(f))
             .map(f => fs.readFileSync(path.join(d, f), 'utf8')).join('\n')
             /* Kommentare heraus: dort steht die alte, falsche Regel als
                Erklaerung — die soll die Pruefung nicht finden. */
             .split('\n').filter(z => !/^\s*--/.test(z)).join('\n');
  }catch(e){ return ''; }
})();
/* Und einmal alle Migrationen zusammen, fuer Regeln, die nicht an einer
   bestimmten Datei haengen. Kommentare wieder heraus. */
const sql = (function(){
  try{
    const d = path.join(__dirname, '..', 'supabase', 'migrations');
    return fs.readdirSync(d).filter(f => /\.sql$/.test(f)).sort()
             .map(f => fs.readFileSync(path.join(d, f), 'utf8')).join('\n')
             .split('\n').filter(z => !/^\s*--/.test(z)).join('\n');
  }catch(e){ return ''; }
})();
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(roh, {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
var m = document.querySelector('#menu');
/* Die Wortmarke in der Kopfleiste folgt der Fassung mit einer eigenen
   Datei, nicht mit einem Filter — der machte sie im Milchglas unscharf. */
document.documentElement.dataset.theme = 'light';
document.getElementById('brand-word').src =
  document.documentElement.dataset.theme === 'dark' ? LOGO_WORD : LOGO_WORD_TINTE;
ok('Auf Hell steht die schwarze Wortmarke',
   document.getElementById('brand-word').getAttribute('src') === LOGO_WORD_TINTE);
go('v-cal');            /* die Seite unter dem Menue, samt Leiste */
menuAuf();
ok('Menue ist offen', m.classList.contains('on'));
ok('Menue ist im Vollbild gebaut', m.dataset.vollbild === '1');

/* ── 1 · Hinaus geht es ueber die Leiste ──
   Das Kreuz oben rechts ist weg: seit die Leiste unten auch im Menue
   steht, fuehrt jeder Weg hinaus ueber sie. Ein Kreuz daneben waere
   ein zweiter Ausgang fuer dasselbe. */
ok('Kein Schliessen-Kreuz mehr', !m.querySelector('.mzurueck'));
ok('Die Leiste steht auch im Menue',
   document.getElementById('tabbar').style.display === 'grid');
ok('Und das Profil ist der Punkt, auf dem man steht',
   document.getElementById('tab-pro').classList.contains('an')
   && document.querySelectorAll('#tabbar .tab[data-go].an').length === 0);
document.querySelector('#tabbar .tab[data-go="v-cal"]')
  .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Ein Ziel aus der Leiste schliesst das Menue', !m.classList.contains('on'));
ok('Und zwar ohne Nachlauf, weil die Seite gleichzeitig wechselt',
   !m.classList.contains('zu'));
ok('Die Seite ist gewechselt',
   document.querySelector('#v-cal').classList.contains('on'));
menuAuf();
document.getElementById('tab-pro').dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Noch einmal aufs Profilbild schliesst es auch', m.classList.contains('zu'));
m.classList.remove('on','zu','sofort'); menuAuf();

/* ── 2 · Ruecksprung aus einem Untermenue: ohne Pause ── */
m.classList.remove('on','zu','sofort');
_vonMenu = true;
zurueckInsMenu();
ok('Menue steht im selben Zug wieder', m.classList.contains('on'));
ok('Und ist als "sofort" gekennzeichnet', m.classList.contains('sofort'));

/* ── 3 · Schieberegler an den Zeilen, die einen Zustand haben ──
   Erscheinungsbild ist seit dem 21. September 2026 keine Zeile mehr,
   sondern eine Kachel unter der Karte. */
ok('Erscheinungsbild ist keine Menuezeile mehr',
   !m.querySelector('.mi[data-act="erscheinung"]'));
ok('Sondern eine Kachel unter der Karte',
   !!document.querySelector('#ik-mode[data-act="erscheinung"]'));
['erinnerung','passkey'].forEach(function(a){
  var z = m.querySelector('[data-act="' + a + '"]');
  ok('Zeile ' + a + ' hat einen Schieberegler', !!(z && z.querySelector('.mischalter')));
  ok('Zeile ' + a + ' hat KEINEN Pfeil daneben', !!z && !z.querySelector('.michev'));
});
var mitPfeil = [...m.querySelectorAll('.mi.michev, .mi')].filter(function(z){
  return z.querySelector('.mischalter') && z.querySelector('.michev'); });
ok('Nirgends Regler und Pfeil zugleich', mitPfeil.length === 0, mitPfeil.length);

/* ── 4 · Der Stand steht in aria-pressed ── */
var erin = m.querySelector('#mi-erin');
ME.mailOk = true;  malErinnerung();
ok('Erinnerung ein -> aria-pressed true', erin.getAttribute('aria-pressed') === 'true',
   erin.getAttribute('aria-pressed'));
ME.mailOk = false; malErinnerung();
ok('Erinnerung aus -> aria-pressed false', erin.getAttribute('aria-pressed') === 'false',
   erin.getAttribute('aria-pressed'));

var pk = m.querySelector('#mi-pk');
paintPasskey();
ok('Passkey traegt einen Stand', pk.hasAttribute('aria-pressed'), pk.getAttribute('aria-pressed'));

/* ── 5 · Passkey laesst das Menue offen ── */
m.classList.remove('zu'); menuAuf();
pk.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Tipp auf Passkey schliesst das Menue NICHT', !m.classList.contains('zu'));
try{ pkBarZu(); }catch(e){}

/* ── 6 · Wischen nach rechts geht zurueck ──
   jsdom rechnet kein Layout, clientWidth ist also 0 — die Schwelle
   "ein Viertel der Breite" laesst sich hier nicht pruefen (das ist im
   Browser nachgemessen). Was hier zaehlt: die richtige Flaeche wird
   geschlossen, die Richtung stimmt, und der Loeschen-Griff bleibt
   unberuehrt. */
function zeiger(art, x, ziel){
  var e = new window.MouseEvent(art, { bubbles:true, clientX:x, clientY:400, button:0 });
  (ziel || document.querySelector('#menu')).dispatchEvent(e);
}
function wisch(von, bis, ziel){
  zeiger('pointerdown', von, ziel);
  zeiger('pointermove', von + (bis > von ? 12 : -12));
  zeiger('pointermove', bis);
  zeiger('pointerup', bis);
}

m.classList.remove('zu'); menuAuf();
kontenAuf(true);
ok('Konten offen', kontenOffen());
wisch(40, 900);
ok('Wisch nach rechts schliesst das Untermenue', !kontenOffen());
ok('Das Menue bleibt dabei offen', m.classList.contains('on') && !m.classList.contains('zu'));

kontenAuf(true);
wisch(900, 40);
ok('Wisch nach links loest nicht aus', kontenOffen());
kontenAuf(false);

dlAuf();
ok('Loeschen offen', dlOffen());
var griff = document.querySelector('#dlbox .dlz');
ok('Loeschen-Griff ist da', !!griff);
wisch(40, 900, griff);
ok('Wisch AUF dem Loeschen-Griff schliesst nicht', dlOffen());
wisch(40, 900);
ok('Wisch daneben schliesst schon', !dlOffen());

wisch(40, 900);
ok('Im Menue selbst schliesst der Wisch das Menue', m.classList.contains('zu'));

/* ── 7 · Fassungswechsel laedt die Seite neu ──
   In jsdom ist location.reload folgenlos, also laesst sich hier
   nachsehen, was vor dem Neustart passiert. */
try{ sessionStorage.removeItem('moji.fassung'); }catch(e){}
var vorher = document.documentElement.dataset.theme;
var mt = document.querySelector('meta[name=theme-color]');
ME = normalize({ id:'t2', vorname:'Marco', nachname:'R', dob:'1990-05-04', av:3 });
erscheinungUmschalten();
var nachher = document.documentElement.dataset.theme;
ok('Die Fassung kippt sofort', nachher !== vorher, vorher + ' → ' + nachher);
ok('theme-color geht mit',
   mt.content === (nachher === 'dark' ? '#0B0711' : '#F4F1FA'), mt.content);
ok('Die Wahl liegt im Geraetespeicher',
   localStorage.getItem('moji.erscheinung') === nachher,
   localStorage.getItem('moji.erscheinung'));
ok('Und im Profil', ME.erscheinung === nachher, ME.erscheinung);
var deckel = document.querySelector('.fassungsdeckel');
ok('Ein Deckel liegt auf', !!deckel);
ok('Der Vermerk fuer den Neustart steht',
   sessionStorage.getItem('moji.fassung') === '1',
   String(sessionStorage.getItem('moji.fassung')));
/* Ein zweiter Tipp darf nicht noch einen Deckel legen. */
erscheinungUmschalten();
ok('Ein zweiter Tipp prallt ab',
   document.querySelectorAll('.fassungsdeckel').length === 1,
   document.querySelectorAll('.fassungsdeckel').length + ' Deckel');
ok('Und kippt die Fassung nicht zurueck',
   document.documentElement.dataset.theme === nachher);
if (deckel) deckel.remove();
try{ sessionStorage.removeItem('moji.fassung'); }catch(e){}

/* ── 8 · Nach dem Neustart kein Vorspann ── */
ok('Es gibt einen Weg am Vorspann vorbei', typeof vorspannUeberspringen === 'function');
playIntro();
ok('Vorspann laeuft', window.__introLaeuft === true);
vorspannUeberspringen();
ok('Uebersprungen: Vorspann aus', window.__introLaeuft === false);
ok('Der Vorspann ist weg', document.querySelector('#splash').style.display === 'none');
ok('Die App ist da', document.querySelector('#app').classList.contains('on'));
ok('Und blendet kurz auf statt lang',
   document.body.classList.contains('fassung-neu'));

/* ── 9 · menuZu nimmt "sofort" zurueck ── */
m.classList.add('sofort');
menuZu();
window.__WEITER = function(){
  ok('Nach dem Schliessen ist "sofort" weg', !m.classList.contains('sofort'));
  ME = null;
  /* ── Dienstzeiten bearbeiten: kompakte Liste statt Formular ──
     Weiter oben wurde abgemeldet, ME ist also leer — hier wieder eins. */
  ME = normalize({ id:'tz', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04',
                   sched:defaultSched() });
  DRAFT = JSON.parse(JSON.stringify(ME.sched)); DRAFT.tab = 0; _hrOffen = null;
  var host = document.getElementById('sched-edit');
  renderZeiten(host, DRAFT, null);
  ok('Das Wochenintervall steht oben', host.querySelectorAll('[data-wc]').length === 4);
  ok('Sechs Tage, je eine Zeile',      host.querySelectorAll('.hz-tag').length === 6,
     host.querySelectorAll('.hz-tag').length);
  ok('Zugeklappt stehen keine Raeder da', host.querySelectorAll('.rad').length === 0);
  ok('Die Zeile nennt die Zeiten',
     /08:00–12:00/.test(host.querySelector('.hz-zeit').textContent),
     host.querySelector('.hz-zeit').textContent);

  host.querySelector('[data-tag="1"]').click();
  ok('Antippen klappt auf',           !!host.querySelector('.hz-tag.auf'));
  ok('Und zeigt vier Raeder',         host.querySelectorAll('.hz-tag.auf .rad').length === 4,
     host.querySelectorAll('.hz-tag.auf .rad').length);
  ok('Mit denselben Abschnitten wie im Funnel',
     host.querySelectorAll('.hz-tag.auf .za-seg').length === 2);
  ok('Nur einer auf einmal',          host.querySelectorAll('.hz-tag.auf').length === 1);

  /* Der Schalter im Abschnitt regelt sich selbst und zieht die Zeile nach. */
  host.querySelector('.hz-tag.auf .za-seg[data-seg="nm"] .za-seg-kopf').click();
  ok('Nachmittag aus',                DRAFT.weeks[0][1].nmOn === false);
  ok('Die Zeile zieht mit',           host.querySelector('.hz-zeit').textContent === '08:00–12:00',
     host.querySelector('.hz-zeit').textContent);
  ok('Und die Stunden auch',          host.querySelector('.hz-std').textContent === '4,00 h',
     host.querySelector('.hz-std').textContent);
  host.querySelector('[data-tag="1"]').click();
  ok('Nochmal antippen klappt zu',    !host.querySelector('.hz-tag.auf'));

  /* Mehr Wochen: Reiter, Uebernahme, laufende Woche */
  host.querySelector('[data-wc="2"]').click();
  ok('Zwei Wochen gemerkt',           DRAFT.weekCount === 2, DRAFT.weekCount);
  ok('Es gibt Wochenreiter',          host.querySelectorAll('[data-tab]').length === 2);
  ok('Und die Frage nach der laufenden Woche', host.querySelectorAll('[data-rot]').length === 2);
  ok('Ganze Woche uebernehmen geht',  host.querySelectorAll('[data-copy]').length === 1);

  /* Hinauswischen fragt nur, wenn sich etwas geaendert hat. */
  ok('Geaendert heisst fragen',       !schedGleich(ME.sched, DRAFT));
  hoursRaus();
  ok('Die Rueckfrage kommt',          document.getElementById('hrbar').classList.contains('on'));
  ok('Und nennt das Verwerfen',       /verwerfen/i.test(document.getElementById('hrbar').textContent));
  document.querySelector('#hrbar [data-hrzu]').click();

  /* ── Das Schloss ──
     Die Seite faengt verschlossen an; erst ein Tipp gibt sie frei. */
  var sperre = document.getElementById('hr-sperre');
  var nav = document.getElementById('hr-nav');
  var schloss = document.getElementById('hr-lock');
  ok('Es gibt einen Zurueck-Knopf', !!document.getElementById('hr-back'));
  ok('Und er traegt das Wort',
     /Zurück/.test(document.getElementById('hr-back').textContent),
     document.getElementById('hr-back').textContent.trim());
  ok('Die alte Augenbraue ist weg', !document.querySelector('#v-hours .eyebrow'));
  ok('Und die alte Ueberschrift auch', !document.querySelector('#v-hours h1.dis')
     && !!document.querySelector('#v-hours h1.obh'));
  hrSchloss(false);
  ok('Verschlossen beginnt es',       sperre.classList.contains('zu'));
  ok('Ohne Leiste zum Speichern',     nav.classList.contains('hide'));
  ok('Das Schloss ist zu',            schloss.getAttribute('aria-pressed') === 'false');
  schloss.click();
  ok('Ein Tipp sperrt auf',           !sperre.classList.contains('zu'));
  ok('Jetzt kommt die Leiste',        !nav.classList.contains('hide'));
  ok('Und das Schloss steht offen',   schloss.getAttribute('aria-pressed') === 'true');
  schloss.click();
  ok('Nochmal tippen sperrt wieder zu', sperre.classList.contains('zu')
     && nav.classList.contains('hide'));
  /* Ein Tipp ins Gesperrte weist aufs Schloss, statt nichts zu tun. */
  sperre.click();
  ok('Der Tipp ins Gesperrte stupst das Schloss', schloss.classList.contains('stups'),
     schloss.className);

  /* ── Zeitausgleich und Urlaubstage: Schloss und Raeder ── */
  ME.konten.zaStart = 6.5; ME.konten.topf = 25;
  var kSchloss = document.getElementById('k-lock');
  ok('Das Schloss ist dasselbe wie bei den Dienstzeiten',
     kSchloss.classList.contains('swz') && kSchloss.classList.contains('hr-schloss'),
     kSchloss.className);
  ok('Der alte Riegel ist weg', !document.querySelector('.kschloss'));
  kontenFrei(false);
  ok('Verschlossen steht kein Rad da', document.querySelectorAll('#konten .rad').length === 0);
  kontenFrei(true);
  ok('Aufgesperrt kommen zwei Raeder', document.querySelectorAll('#konten .rad').length === 2,
     document.querySelectorAll('#konten .rad').length);
  ok('Zeitausgleich in Viertelstunden',
     document.querySelectorAll('#k-za-rad .rad-roll i').length === 801,
     document.querySelectorAll('#k-za-rad .rad-roll i').length);
  ok('Urlaub in halben Tagen',
     document.querySelectorAll('#k-ur-rad .rad-roll i').length === 561,
     document.querySelectorAll('#k-ur-rad .rad-roll i').length);
  ok('Und das Rad steht auf dem Stand',
     document.querySelector('#k-za-rad .rad-roll i.on').textContent === '+6,50 h',
     document.querySelector('#k-za-rad .rad-roll i.on').textContent);
  ok('Auch beim Urlaub',
     document.querySelector('#k-ur-rad .rad-roll i.on').textContent === '25 Tage',
     document.querySelector('#k-ur-rad .rad-roll i.on').textContent);
  kontenFrei(false);
  ok('Zusperren raeumt die Raeder wieder weg',
     document.querySelectorAll('#konten .rad').length === 0);
  /* Ein Tipp auf die Kachel weist aufs Schloss. */
  document.querySelector('#konten .kbox').dispatchEvent(
    new window.MouseEvent('click', { bubbles:true }));
  ok('Der Tipp ins Gesperrte stupst auch hier', kSchloss.classList.contains('stups'),
     kSchloss.className);

  /* ── Ein Zahlenrad kann man auch allein pruefen ── */
  var probe = radZahl(0, 2, 0.5, 1.5, v => v + ' x', function(){});
  ok('radZahl baut die Stufen', probe.querySelectorAll('i').length === 5,
     probe.querySelectorAll('i').length);
  ok('Und faengt beim naechsten Wert an',
     probe.querySelector('i.on').textContent === '1.5 x',
     probe.querySelector('i.on') && probe.querySelector('i.on').textContent);

  /* ── Urlaubsanspruch: neues Schloss, kein Rad ── */
  var uaSchloss = document.getElementById('ua-lock');
  ok('Auch hier dasselbe Schloss', uaSchloss.classList.contains('hr-schloss'));
  uaFrei(false);
  ok('Verschlossen', !document.getElementById('uabox').classList.contains('frei'));
  uaSchloss.click();
  ok('Aufgesperrt', document.getElementById('uabox').classList.contains('frei'));
  ok('Und dort steht kein Rad', document.querySelectorAll('#uabox .rad').length === 0);

  /* ── Meine Firma und das Team ── */
  ok('Die Firmenkachel faengt zugeklappt an', document.getElementById('fi-zeilen').hidden);
  /* Die Marke des Dienstgebers statt eines gezeichneten Hauses. */
  ok('Die Kachel zeigt die Wortmarke',
     document.querySelector('#fi-karte .fk-logo img').getAttribute('src')
       .indexOf('firma-miller-wort') === 0,
     document.querySelector('#fi-karte .fk-logo img').getAttribute('src'));
  /* Die Menuezeile "Meine Firma" gibt es nicht mehr — seit es ein Ziel
     in der Leiste unten ist, waere sie ein zweiter Eingang. */
  ok('Keine Menuezeile mehr fuer Meine Firma',
     !document.querySelector('.mi[data-act="firma"]'));
  ok('Aber ein Ziel in der Leiste',
     !!document.querySelector('#tabbar .tab[data-go="v-firma"]'));
  /* Der Punkt zeigt einen Becher statt Haus und Wort — das ist, was
     man dort tut. Ohne eigenen Becher den ersten: Ube Pop. */
  TEE_PAARE = {}; ME.teeLvl = 0; malTeeTab();
  ok('Ohne Becher steht Ube Pop in der Leiste',
     /tee-1\.webp$/.test(document.getElementById('tab-tee-b').getAttribute('src')),
     document.getElementById('tab-tee-b').getAttribute('src'));
  TEE_PAARE = { a:{punkte:25} }; malTeeTab();
  ok('Mit Bechern die weiteste Sorte',
     document.getElementById('tab-tee-b').getAttribute('src')
       === 'tee-' + teeLevel(25) + '.webp',
     document.getElementById('tab-tee-b').getAttribute('src'));
  ok('Und kein Wort daneben',
     !document.querySelector('#tabbar .tab[data-go="v-firma"] em'));
  TEE_PAARE = {};
  /* ── Der Kopf ist die Karte ──
     Seit 20.09.2026 stehen Name, Bild, Stufe und das dunkle Band in
     einem Stueck. Vorher waren es zwei Kaesten und ein eigener
     Menuepunkt: dreimal dieselbe Person. */
  malRang();
  var kopf = document.getElementById('mausweis');
  ok('Der Kopf ist die Karte',      !!kopf);
  ok('Die alte Stufenleiste ist weg', !document.getElementById('mrang'));
  ok('Und der eigene Menuepunkt auch',
     !document.querySelector('#menu [data-act="karte"]'));
  ok('Er traegt die Farbe der Stufe',
     kopf.style.getPropertyValue('--pa') !== '' && kopf.style.getPropertyValue('--rf') !== '',
     kopf.getAttribute('style'));
  /* Kein Muster mit Backslash — diese Pruefungen stehen in einer
     Schablonenzeichenkette, dort wird aus \d ein d. */
  ok('Im Band steht der Stand der Sammlung',
     document.getElementById('ma-stand').textContent === stufe() + ' von ' + RAENGE.length + ' Karten',
     document.getElementById('ma-stand').textContent);
  ok('Die Flaeche darunter oeffnet die Karte', !!document.getElementById('ma-auf'));
  /* Knoepfe ineinander gibt es in HTML nicht — Bild und Postfach muessen
     eigene bleiben und duerfen nicht im Oeffnen-Knopf stecken. */
  ok('Bild und Postfach sind eigene Knoepfe',
     document.getElementById('avbig').tagName === 'BUTTON'
     && document.getElementById('postfach').tagName === 'BUTTON'
     && !document.getElementById('ma-auf').contains(document.getElementById('avbig')));
  /* Die Liste aller Stufen gab es dreimal: als Flaeche im Menue, als
     eigenes Blatt und als Knopf in der Karte. Jetzt gar nicht mehr —
     der Stapel zeigt alle zwoelf, die erreichten und die verschlossenen. */
  ok('Keine eigene Zeile fuer die Stufen mehr',
     !document.querySelector('#menu .mi[data-act="raenge"]'));
  ok('Keine Flaeche dafuer im Menue',  !document.getElementById('rangbox'));
  ok('Und kein Knopf in der Karte',    !document.getElementById('mk-stufen'));

  /* ── Der Stapel ──
     Fuer jede Stufe eine Karte. Drei Zustaende, immer derselbe Aufbau,
     damit beim Wischen nichts springt. */
  ME.months = []; for(var mi = 0; mi < 39; mi++) ME.months.push({ y:2026 + (mi/12|0), m:mi%12 });
  ME.exp = {}; ME.months.forEach(function(o){ ME.exp[o.y + '-' + o.m] = 1; });
  malKarte();
  var kt = document.querySelectorAll('#kt-bahn .kt');
  var st = stufe();
  ok('Fuer jede Stufe eine Karte',  kt.length === RAENGE.length, kt.length);
  ok('Und die Stufe stimmt',        st === 10, st);
  ok('Die erreichten sind frei',
     [].every.call(kt, function(k, i){ return (i + 1 <= st) === k.classList.contains('frei'); }));
  ok('Die kommenden sind zu',
     [].every.call(kt, function(k, i){ return (i + 1 > st) === k.classList.contains('zu'); }));
  ok('Genau eine ist die aktuelle',
     document.querySelectorAll('#kt-bahn .kt.jetzt').length === 1
     && +document.querySelector('#kt-bahn .kt.jetzt').dataset.n === st);
  ok('Nur die verschlossenen tragen ein Schloss',
     [].every.call(kt, function(k, i){ return (i + 1 > st) === !!k.querySelector('.kt-schloss'); }));
  /* Keine Leiter mehr: die naechste Karte sagt ohnehin, wie viel fehlt,
     und ohne sie sind alle zwoelf gleich gross — beim Wischen springt
     nichts. */
  ok('Keine Leiter mehr auf der Karte',
     document.querySelectorAll('#kt-bahn .kt-leiter').length === 0);
  ok('Alle Karten sind gleich gebaut',
     [].every.call(kt, function(k){
       return k.querySelectorAll('.kt-band, .kt-fenster, .kt-wer, .kt-fach, .kt-fuss').length === 5;
     }));
  ok('Die erreichten tragen einen Stempel, die aktuelle nicht',
     document.querySelectorAll('#kt-bahn .kt-stempel').length === st - 1);
  ok('Und er sitzt im Fenster, nicht ueber dem Band',
     [].every.call(document.querySelectorAll('#kt-bahn .kt-stempel'),
                   function(p){ return !!p.closest('.kt-fenster'); }));

  /* ── Die Leiste unten ──
     Vier Ziele: Kalender, Export, Meine Firma und das Profil mit dem
     eigenen Bild. Das Bild sass vorher oben rechts in der Kopfleiste. */
  ok('Vier Punkte in der Leiste',
     document.querySelectorAll('#tabbar .tab[data-go]').length === 3
     && !!document.querySelector('#tabbar #avatar'));
  ok('Das Profilbild ist nicht mehr in der Kopfleiste',
     !document.querySelector('.topbar #avatar'));
  ok('Und der Zaehler sitzt bei ihm', !!document.querySelector('#tabbar #av-zaehler'));
  go('v-cal');
  ok('Die Leiste steht ueber dem Kalender',
     document.getElementById('tabbar').style.display === 'grid');
  ok('Kalender traegt sein Wort',
     document.querySelector('.tab[data-go="v-cal"]').classList.contains('an'));
  go('v-export');
  ok('Nach dem Wechsel traegt Export es',
     document.querySelector('.tab[data-go="v-export"]').classList.contains('an')
     && !document.querySelector('.tab[data-go="v-cal"]').classList.contains('an'));
  /* Auf jeder Seite, auch in den Unteransichten — nur der Einstieg
     kennt sie nicht. */
  go('v-hours');
  ok('Auch in Unteransichten steht sie',
     document.getElementById('tabbar').style.display === 'grid');
  ok('Und kein Punkt ist dort aktiv',
     document.querySelectorAll('#tabbar .tab.an').length === 0);
  go('v-login');
  ok('Beim Einstieg nicht',
     document.getElementById('tabbar').style.display === 'none');
  /* Meine Firma ist ein Ziel wie der Kalender — und Ziele haben kein
     Zurueck. Den Pfeil gibt es nicht mehr, auch nicht aus dem Menue:
     dort steht Meine Firma seit dem 21. September nicht mehr. */
  firmaAuf();
  ok('Meine Firma ohne Zurueck-Pfeil', !document.getElementById('fi-back'));
  ok('Und steht offen', document.querySelector('#v-firma').classList.contains('on'));
  go('v-cal');
  /* Die beiden Sonderfaelle, die am alten Kalender-Knopf hingen und
     mit ihm verloren gingen. */
  CAL.y = 2025; CAL.m = 2; renderCal();
  document.querySelector('#tabbar .tab[data-go="v-cal"]')
    .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  var h = new Date();
  ok('Zweiter Tipp auf Kalender holt den laufenden Monat',
     CAL.y === h.getFullYear() && CAL.m === h.getMonth(), CAL.m + '/' + CAL.y);

  /* ── Die Karte traegt nur noch, was sie zeigt ──
     Mail und Geburtsdatum sind in eine eigene Flaeche gewandert,
     Postfach und Sicherungsstand in die Kachelreihe darunter. */
  ok('Keine Mail mehr in der Karte', !document.getElementById('me-mail'));
  ok('Das Bild ist gross und traegt einen Stift',
     !!document.querySelector('#mausweis .avplatz .avstift'));
  ok('Postfach steht in der Kachelreihe, nicht in der Karte',
     !!document.querySelector('#ikonleiste #postfach')
     && !document.querySelector('#mausweis #postfach'));
  ok('Vier Kacheln, nicht mehr',
     document.querySelectorAll('#ikonleiste .ikon').length === 4);
  ok('Und zwar diese vier',
     [...document.querySelectorAll('#ikonleiste .ikon')]
       .map(function(k){ return k.id || k.dataset.act; }).join(',')
       === 'postfach,ik-sync,daten,ik-mode',
     [...document.querySelectorAll('#ikonleiste .ikon')].map(function(k){ return k.id || k.dataset.act; }).join(','));

  /* ── Die Becher-Plakette ──
     Summe aller Bubble Teas, Farbe der am weitesten freigeschalteten
     Sorte. Manuela 5, Luis 5, Marlene 3 macht 13. */
  TEE_PAARE = { a:{punkte:5}, b:{punkte:5}, c:{punkte:3} };
  malTeeBadge();
  /* Seit dem 21. September ist die Plakette das erste der drei Felder
     (#mw-tee). Der Test fragte noch nach #ma-tee, bekam null und brach
     ab — samt allem, was danach kommt. */
  var tb = document.getElementById('mw-tee');
  ok('Die Plakette zaehlt alle Becher zusammen',
     !tb.hidden && document.getElementById('ma-tee-n').textContent === '13',
     document.getElementById('ma-tee-n').textContent);
  ok('Und traegt die Farbe der hoechsten Sorte',
     tb.style.getPropertyValue('--tf') === TEE[teeLevel(5) - 1].f,
     tb.style.getPropertyValue('--tf'));
  ok('Darin steht der echte Becher dieser Sorte',
     /tee-1\.webp$/.test(document.getElementById('ma-tee-b').getAttribute('src')),
     document.getElementById('ma-tee-b').getAttribute('src'));
  ok('Sie steht in der Reihe der drei Staende',
     tb.parentNode.classList.contains('ma-werte'));
  /* Der Stand wandert ins Profil — sonst stand die Plakette beim
     naechsten Start leer da, bis die Tabelle geladen war. */
  ok('Der Stand ist im Profil gemerkt', ME.teeSum === 13 && ME.teeLvl === teeLevel(5),
     ME.teeSum + '/' + ME.teeLvl);
  TEE_PAARE = {};
  malTeeBadge();
  ok('Ohne geladene Tabelle zeigt sie den gemerkten Stand',
     !tb.hidden && document.getElementById('ma-tee-n').textContent === '13');
  ME.teeSum = 0; ME.teeLvl = 0;
  malTeeBadge();
  ok('Ohne Becher bleibt sie weg', tb.hidden);

  /* ── Persoenliche Daten ── */
  MAIL = 'marco@studiomaru.at';
  dtAuf(true);
  ok('Die Flaeche geht auf', dtOffen());
  ok('Und bringt die heutigen Werte mit',
     document.getElementById('dt-vn').value === ME.vorname
     && readDob('dt').y === (ME.dob || '').slice(0, 4)
     && document.getElementById('dt-mail').textContent === MAIL);
  document.getElementById('dt-vn').value = 'Marko';
  document.getElementById('dt-ok').click();
  ok('Speichern uebernimmt den Namen', ME.vorname === 'Marko', ME.vorname);
  ok('Und schliesst die Flaeche', !dtOffen());
  dtAuf(true);
  document.getElementById('dt-vn').value = '';
  document.getElementById('dt-ok').click();
  ok('Ohne Vornamen wird nicht gespeichert',
     dtOffen() && !document.getElementById('dt-hinweis').hidden);
  dtAuf(false);
  ME.vorname = 'Marco';

  /* ── Der Becher ist ein Wechselspiel ──
     Nach dem eigenen Becher ist die andere Seite dran. Wer nicht
     zurueckschickt, bleibt ausgegraut — und die Zeile sagt, warum. */
  var wer = { user_id:'x', vorname:'Luis', kuerzel:'B', stufe:3 };
  var knopf = function(p){ return teeKnopf(wer, p); };
  ok('Frei, wenn die andere Seite zuletzt geschickt hat',
     knopf({ punkte:4, heuteSchon:false, wartet:false }).indexOf('data-tee=') > 0);
  ok('Gesperrt, solange der Gegenzug aussteht',
     knopf({ punkte:4, heuteSchon:false, wartet:true }).indexOf('Am Zug') > 0);
  ok('Und die Tagesregel gilt weiter',
     knopf({ punkte:4, heuteSchon:true, wartet:true }).indexOf('Heute') > 0);
  ok('Der gesperrte Knopf nennt seinen Grund',
     knopf({ punkte:4, heuteSchon:false, wartet:true }).indexOf('Erst wenn zurückgeschickt') > 0);

  /* ── Der Brief zum Aufstieg ──
     Jede erreichte Stufe kommt als Nachricht ins Postfach, mit der
     Karte darin und dem, was die gesparte Zeit hergibt. VERGLEICHE
     stand seit Langem in der Datei und wurde von niemandem benutzt. */
  ME.post = []; ME.gelesen = [];
  aufMelde(7, 10);
  var brief = ME.post.filter(function(m){ return /^stufe-/.test(m.id); });
  ok('Ein Brief je Aufstieg, fuer die hoechste Stufe',
     brief.length === 1 && brief[0].id === 'stufe-10', brief.length);
  ok('Er nennt Stufe und Namen',
     brief[0].titel === 'LVL 10 — Zeitmeister', brief[0].titel);
  ok('Mehrere Stufen auf einmal stehen drin',
     brief[0].text.indexOf('Gleich 3 Stufen auf einmal') === 0);
  ok('Die Karte steckt als Platzhalter im Text',
     brief[0].text.indexOf('[[karte:10]]') > 0);
  ok('Und die gesparte Zeit als fester Text, nicht als Rechnung',
     brief[0].text.indexOf('erspart') > 0 && brief[0].text.indexOf('Dafür könntest du ') > 0,
     brief[0].text.slice(-220, -120));
  aufMelde(9, 10);
  ok('Zweimal dieselbe Stufe gibt keinen zweiten Brief',
     ME.post.filter(function(m){ return m.id === 'stufe-10'; }).length === 1);
  /* Der Rahmen muss "Dafuer koenntest du ..." sein: bei "um" gehoert ein
     "zu" vor das Verb, und das steht am Ende der Phrase. */
  ok('Der Lohnsatz ist ganzes Deutsch',
     lohnSatz(240) === 'Dafür könntest du ein halbes Buch lesen.', lohnSatz(240));
  ok('Ohne Export ein eigener Satz',
     lohnSatz(0) === 'Der erste Export wartet noch auf dich.', lohnSatz(0));

  malPostfach();
  var pk = document.querySelector('#pf-liste .pfk .kt');
  ok('Im offenen Brief steht eine echte Karte', !!pk);
  ok('Es ist die Karte der erreichten Stufe', pk && +pk.dataset.n === 10, pk && pk.dataset.n);
  ok('Sie traegt ihre Stufenfarben',
     pk && pk.style.getPropertyValue('--rf') === RAENGE[9].a, pk && pk.style.getPropertyValue('--rf'));
  ok('Das Banner traegt dieselbe Stufenfarbe',
     pk && pk.closest('.pfk').style.getPropertyValue('--rft') === rgba(RAENGE[9].a, .16),
     pk && pk.closest('.pfk').style.getPropertyValue('--rft'));
  ok('Und nimmt keine Tipps an',
     pk && !pk.getAttribute('role') && !pk.getAttribute('tabindex')
     && pk.closest('.pfk').getAttribute('aria-hidden') === 'true',
     pk && (pk.getAttribute('role') || '-') + '/' + (pk.getAttribute('tabindex') || '-'));
  ok('Im Stapel bleibt sie ein Knopf',
     document.querySelector('#kt-bahn .kt').getAttribute('role') === 'button');
  /* Wer schon oben steht, hat seine Aufstiege erlebt, bevor es die
     Briefe gab — einer kommt nach, nicht neun. */
  ME.post = [];
  stufenPostNachziehen();
  ok('Nachgezogen wird genau ein Brief',
     ME.post.filter(function(m){ return /^stufe-/.test(m.id); }).length === 1);
  stufenPostNachziehen();
  ok('Und beim naechsten Start keiner mehr',
     ME.post.filter(function(m){ return /^stufe-/.test(m.id); }).length === 1);
  ME.post = []; ME.gelesen = []; delete ME.auf;

  /* ── Auf, zu, auf ──
     Der Rueckflug haelt seinen Endzustand fest, sonst blitzten die
     Karten beim Schliessen wieder auf. Blieb er danach liegen, gewann
     er nach dem naechsten Hinflug wieder — Deckkraft 0, die Karten
     waren beim zweiten Oeffnen weg. jsdom rechnet keine Animationen,
     also wird animate() hier nachgebaut: geprueft wird, dass vor jedem
     Flug abgeraeumt wird und am Ende nichts Fertiges liegen bleibt. */
  (function(){
    var alle = [];
    Element.prototype.animate = function(kf, opt){
      var a = { weg:false, fill:(opt && opt.fill) || 'none',
                cancel:function(){ this.weg = true; } };
      this.__an = (this.__an || []).concat(a);
      alle.push(a);
      return a;
    };
    Element.prototype.getAnimations = function(){
      return (this.__an || []).filter(function(a){ return !a.weg; });
    };
    var kiste = document.querySelector('.mkv-in');
    var b = document.querySelector('#mkv');
    /* Der Timer beim Schliessen raeumt selbst auf — hier wird der
       haertere Fall gespielt: gleich wieder aufgemacht, bevor er
       feuert. Genau so kam es vor. */
    for(var runde = 0; runde < 3; runde++){
      karteAuf(); karteZu(); b.classList.remove('on', 'weg');
    }
    karteAuf();
    var offen = kiste.getAnimations();
    ok('Vier Fluege, jeder raeumt den vorigen ab', alle.length === 7, alle.length);
    ok('Nach dem Oeffnen laeuft genau einer', offen.length === 1, offen.length);
    ok('Und keiner haelt mehr einen alten Endzustand fest',
       offen.every(function(a){ return a.fill !== 'both'; }));
    karteZu();
  })();
  /* Im Fach steht bei jeder etwas anderes — das ist der einzige Teil,
     der wechselt. */
  ok('Im Fach der aktuellen steht die gesparte Zeit',
     document.querySelector('#kt-bahn .kt.jetzt .kt-fach u').textContent === 'Zeit gespart');
  ok('Bei einer verschlossenen steht, was fehlt',
     kt[st].querySelector('.kt-fach u').textContent.indexOf('Noch ') === 0,
     kt[st].querySelector('.kt-fach u').textContent);
  ok('Jede Karte traegt ihre Stufenfarbe',
     kt[0].style.getPropertyValue('--rf') === RAENGE[0].a
     && kt[11].style.getPropertyValue('--rf') === RAENGE[11].a,
     kt[11].style.getPropertyValue('--rf'));
  ok('Und einen dunkleren Grund dazu', /^#[0-9a-f]{6}$/.test(kt[0].style.getPropertyValue('--rtief')),
     kt[0].style.getPropertyValue('--rtief'));
  ok('Zwoelf Punkte, so viele wie Karten',
     document.querySelectorAll('#kt-punkte i').length === RAENGE.length);
  ok('Die erreichten Punkte sind eingefaerbt',
     document.querySelectorAll('#kt-punkte i.frei').length === st);

  /* ── Die Profilbilder ──
     Seit 15.09.2026 sind es 117 statt 12, als WebP in 288 x 384. */
  ok('116 Motive stehen zur Wahl',  AVATARE === 116, AVATARE);
  ok('Zu jedem ein Pastellgrund',   AV_GRUND.length === AVATARE, AV_GRUND.length);
  ok('Und alle sind Farbwerte',
     AV_GRUND.every(function(c){ return /^#[0-9A-F]{6}$/.test(c); }),
     AV_GRUND.filter(function(c){ return !/^#[0-9A-F]{6}$/.test(c); }).join(','));
  /* Kein Muster mit Backslash: diese Pruefungen stehen in einer
     Schablonenzeichenkette, dort wird aus \d ein d. */
  ok('Die Bilder sind WebP',        avDatei(1) === 'av-1.webp?v=' + AV_STAND, avDatei(1));
  malAvGitter();
  ok('Das Gitter zeigt alle',
     document.querySelectorAll('#avgrid .avopt').length === AVATARE,
     document.querySelectorAll('#avgrid .avopt').length);
  ok('Mit dem Zurueck-Knopf davor',
     document.querySelector('#avgrid').firstElementChild.classList.contains('zurueckbtn'));
  /* Ein Nachzuegler bekommt die naechste freie Nummer — eine mittendrin
     einzuschieben wuerde allen darueber das Bild wechseln, in jedem
     Profil steht ja nur die Zahl. Gezeigt wird er trotzdem mittendrin. */
  var reihe = avReihenfolge();
  ok('Die Reihe enthaelt jedes Motiv einmal',
     reihe.length === AVATARE && new Set(reihe).size === AVATARE, reihe.length);
  ok('Der Wackelpudding steht in der Mitte', reihe[56] === 116, reihe.indexOf(116) + 1);
  ok('Und das Gitter zeigt ihn dort',
     +document.querySelectorAll('#avgrid .avopt')[56].dataset.av === 116,
     document.querySelectorAll('#avgrid .avopt')[56].dataset.av);
  ok('Davor und danach laeuft es der Reihe nach',
     reihe[55] === 56 && reihe[57] === 57, reihe.slice(54, 59).join(','));
  /* 117 Bilder auf einmal zu laden waere ein Schwall — sie kommen, wenn
     man zu ihnen scrollt. */
  ok('Sie laden erst beim Scrollen',
     [].every.call(document.querySelectorAll('#avgrid .avopt img'),
                   function(i){ return i.getAttribute('loading') === 'lazy'; }));
  /* Das dritte Motiv ist ersetzt, nicht entfernt: die Nummer bleibt,
     damit sich bei niemandem das Bild verschiebt. */
  ok('Nummer 3 traegt jetzt ein neues', AV_GRUND[2] === '#D2EAFD', AV_GRUND[2]);
  /* normalize() hatte die Obergrenze als Zahl stehen: 12. Als aus zwoelf
     Motiven ueber hundert wurden, warf es jede hoehere Wahl beim Laden
     weg — man suchte sich eines aus und hatte nach dem Neuladen wieder
     das zugeteilte drin. */
  ok('Eine hohe Wahl ueberlebt das Laden',
     normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE }).avatar === AVATARE,
     normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE }).avatar);
  /* Seit 20.09.2026 bleibt das Feld nicht leer: eine unbrauchbare Zahl
     wird durch die zugeteilte ersetzt, nicht bloss entfernt. Sonst
     rechnete sie jedes Zeichnen neu und stuende nirgends — die Datenbank
     schrieb dann in die oeffentliche Zeile eine 1. */
  var ohne = { id:'pAv', vorname:'Test', dob:'1990-01-01' };
  var zu   = normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE + 1 });
  var null0= normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:0 });
  ok('Eine zu hohe wird ersetzt',   zu.avatar === avZufall(ohne), zu.avatar + ' / ' + avZufall(ohne));
  ok('Und eine von null auch',      null0.avatar === avZufall(ohne), null0.avatar);
  ok('Wer keines hat, bekommt eines',
     normalize({ id:'pAv2', vorname:'Test', dob:'1990-01-01' }).avatar === avZufall(ohne));
  ok('Und es steht im Bereich',
     avZufall(ohne) >= 1 && avZufall(ohne) <= AVATARE, avZufall(ohne));
  /* Der Teiler ist fest: sonst wechselt jedem ohne eigene Wahl das Bild,
     sobald Motive dazukommen. */
  ok('Der Teiler haengt nicht an AVATARE', AV_ZUFALL_BIS === 116, AV_ZUFALL_BIS);
  ok('Zweimal dieselbe Person, dasselbe Bild',
     avZufall({ vorname:'Philipp', dob:'1988-03-04' }) === avZufall({ vorname:'Philipp', dob:'1988-03-04' }));
  ok('Andere Person, anderes Bild',
     avZufall({ vorname:'Philipp', dob:'1988-03-04' }) !== avZufall({ vorname:'Judith', dob:'1991-07-19' }));
  /* Eine getroffene Wahl bleibt unangetastet. */
  ok('Eine gueltige Wahl bleibt',
     normalize({ id:'pAv3', vorname:'Test', dob:'1990-01-01', avatar:42 }).avatar === 42);

  /* Die Bubble Teas werden in den Details erklaert, nicht auf der Liste. */
  malFirma();
  ok('Alle zehn Getraenke stehen in den Details',
     document.querySelectorAll('#fi-zeilen .teek').length === 10,
     document.querySelectorAll('#fi-zeilen .teek').length);
  ok('Mit Namen und Schwelle',
     document.querySelector('#fi-zeilen .teek b').textContent === 'Ube Pop'
     && document.querySelectorAll('#fi-zeilen .teek u')[9].textContent === 'ab 91',
     document.querySelectorAll('#fi-zeilen .teek u')[9].textContent);
  ok('Und einer Erklaerung davor',
     document.querySelector('#fi-zeilen .fiz-tee b').textContent
       .indexOf('Zehn Stufen zum Freischalten') === 0);
  /* Auch hier laesst sich jeder Becher andruecken — und funkelt in
     seiner eigenen Farbe. */
  var kunde = document.querySelectorAll('#fi-zeilen .teek');
  ok('Jedes Getraenk ist ein Knopf',
     [].every.call(kunde, function(k){ return k.tagName === 'BUTTON'; }));
  ok('Mit drei Funken darin',
     [].every.call(kunde, function(k){ return k.querySelectorAll('.teekb i').length === 3; }));
  ok('Jedes traegt seine eigene Farbe',
     kunde[0].getAttribute('style').indexOf('--tee:' + TEE[0].f) > -1
     && kunde[9].getAttribute('style').indexOf('--tee:' + TEE[9].f) > -1,
     kunde[9].getAttribute('style'));
  kunde[4].dispatchEvent(new window.MouseEvent('pointerdown', { bubbles:true }));
  ok('Ein Tipp laesst genau den einen glitzern',
     kunde[4].classList.contains('glitzer') && !kunde[3].classList.contains('glitzer'));
  /* Der Hinweis zum Dienstgeber sass als eigener Kasten zwischen den
     Angaben und den Getraenken — dort trennte er, statt zu erklaeren. */
  ok('Kein eigener Kasten mehr',   document.querySelectorAll('#fi-zeilen .fihint').length === 0);
  ok('Der Hinweis steht beim Dienstgeber',
     document.querySelector('#fi-zeilen .fiz b small').textContent
       .indexOf('Fest eingestellt') === 0,
     document.querySelector('#fi-zeilen .fiz b small').textContent.slice(0, 40));
  ok('Fuenf gleich schwere Zeilen',
     [].slice.call(document.querySelectorAll('#fi-zeilen .fiz u'))
       .map(function(u){ return u.textContent; }).join('|')
     === 'Arbeitsort|Dein Dienstplan|Dabei seit|Feiertage|Bubble Tea',
     [].slice.call(document.querySelectorAll('#fi-zeilen .fiz u'))
       .map(function(u){ return u.textContent; }).join('|'));
  /* Kein Zurueck mehr: Meine Firma ist ein Ziel in der Leiste. */
  ok('Kein Zurueck-Knopf, sie ist ein Ziel', !document.getElementById('fi-back'));
  ok('Die alte Augenbraue ist weg', !document.querySelector('#v-firma .eyebrow'));

  /* Die Stufenrechnung muss dieselbe sein wie tee_level() in der Datenbank. */
  var stufen = [[0,0],[1,1],[2,1],[10,1],[11,2],[21,3],[31,4],[41,5],[51,6],
                [61,7],[71,8],[81,9],[90,9],[91,10],[500,10]];
  ok('Die Stufenrechnung stimmt mit der Datenbank ueberein',
     stufen.every(function(x){ return teeLevel(x[0]) === x[1]; }),
     stufen.map(function(x){ return x[0] + '→' + teeLevel(x[0]); }).join(' '));
  ok('Zehn Getraenke, zehn Namen', TEE.length === 10 && TEE[0].n === 'Ube Pop'
     && TEE[9].n === 'Ruby Royale');
  ok('Bei zehn ist Schluss', teeRest(91) === null && teeRest(500) === null);
  ok('Der erste Tee reicht fuer Stufe 1', teeRest(0).braucht === 1 && teeRest(0).bis === 1);
  ok('Danach sind es zehn', teeRest(1).braucht === 10 && teeRest(1).bis === 10,
     JSON.stringify(teeRest(1)));
  ok('Und die Naechste heisst richtig', teeRest(1).name === 'Blue Breeze', teeRest(1).name);

  /* „Zuletzt online" — die Leiter. */
  var vor = function(h){ return new Date(Date.now() - h * 3600e3).toISOString(); };
  /* Seit 15.09.2026: die erste Stunde ist „kuerzlich", danach vier
     Stunden einzeln, dann erst der Tag. */
  ok('Bis eine Stunde: kuerzlich',    zuletztText(vor(0.5)) === 'kürzlich gesehen',
     zuletztText(vor(0.5)));
  ok('Eine Stunde im Singular',       zuletztText(vor(1.2)) === 'vor 1 Stunde',
     zuletztText(vor(1.2)));
  ok('Zwei bis vier im Plural',
     zuletztText(vor(2.3)) === 'vor 2 Stunden' && zuletztText(vor(3.1)) === 'vor 3 Stunden'
     && zuletztText(vor(4.6)) === 'vor 4 Stunden',
     [zuletztText(vor(2.3)), zuletztText(vor(3.1)), zuletztText(vor(4.6))].join(' | '));
  ok('Spaeter am selben Tag: heute',  zuletztText(vor(5.2)).indexOf('heute') === 0
     || zuletztText(vor(5.2)) === 'gestern', zuletztText(vor(5.2)));
  /* Der Punkt haelt mit dem Wort Schritt. */
  ok('Gruen nur, solange kuerzlich dasteht',
     zuletztArt(vor(0.5)) === 'frisch' && zuletztArt(vor(1.2)) !== 'frisch',
     zuletztArt(vor(0.5)) + ' / ' + zuletztArt(vor(1.2)));
  ok('Ein Tag: gestern',              zuletztText(vor(24 * 1 + 12)) === 'gestern'
     || zuletztText(vor(24 * 1 + 12)) === 'vor 2 Tagen', zuletztText(vor(36)));
  /* Ohne regulaeren Ausdruck: der Pruefteil steckt in einer Vorlage,
     dort waere \\d nur ein d. */
  ok('Mehrere Tage werden gezaehlt',  zuletztText(vor(24 * 12)) === 'vor 12 Tagen',
     zuletztText(vor(24 * 12)));
  /* Bis 90 Tage wird gezaehlt — vorher war bei 40 Schluss. */
  ok('Auch nach zwei Monaten noch',   zuletztText(vor(24 * 60)) === 'vor 60 Tagen',
     zuletztText(vor(24 * 60)));
  ok('Bei 89 Tagen noch die Zahl',    zuletztText(vor(24 * 89 + 2)) === 'vor 89 Tagen',
     zuletztText(vor(24 * 89 + 2)));
  ok('Ab 90 Tagen wird es vage',      zuletztText(vor(24 * 90 + 2)) === 'es ist schon ewig her',
     zuletztText(vor(24 * 90 + 2)));
  ok('Ohne Zeitstempel steht nichts', zuletztText(null) === '');

  /* Die Liste selbst. */
  UID = 'u-ich';
  TEAM = [{user_id:'u-ich',vorname:'Marco',kuerzel:'R',avatar:5,filiale:'Linz',stufe:7,zuletzt:vor(0)},
          {user_id:'u-a',vorname:'Anna',kuerzel:'M',avatar:3,filiale:'Linz',stufe:7,zuletzt:vor(1)},
          {user_id:'u-c',vorname:'Clara',kuerzel:'W',avatar:9,filiale:'Linz',stufe:2,zuletzt:vor(74)}];
  TEE_PAARE = {'u-a':{punkte:25,heuteSchon:false},'u-c':{punkte:0,heuteSchon:false}};
  malTeam();
  var karten = document.querySelectorAll('#fi-team .tm');
  ok('Je Mitglied eine Karte',      karten.length === 3, karten.length);
  ok('Ich stehe zuerst',            karten[0].classList.contains('ich'));
  ok('Und ohne Sende-Knopf',        !karten[0].querySelector('[data-tee]'));
  ok('Name mit Anfangsbuchstaben',  karten[1].querySelector('.tm-t b').textContent === 'Anna M.',
     karten[1].querySelector('.tm-t b').textContent);
  /* Der Name stand am 15.09.2026 unsichtbar auf der Karte: die Klasse
     hiess mk, und mk gehoert der Mitarbeiterkarte, die color:var(--f-2)
     setzt — fast Weiss. Hier wird die Farbe wirklich nachgesehen. */
  var namFarbe = getComputedStyle(karten[1].querySelector('.tm-t b')).color;
  /* jsdom loest keine Variablen auf — es gibt "var(--tx)" zurueck. Genau
     das genuegt: faellt die Karte wieder in die Regeln der
     Mitarbeiterkarte, stuende hier var(--f-2). */
  ok('Der Name nimmt die Textfarbe der Seite',
     namFarbe.indexOf('--f-') === -1 && namFarbe.indexOf('255, 255, 255') === -1
     && namFarbe !== '', namFarbe || '(leer)');
  ok('Filiale und MOJI-Stufe',      karten[1].querySelector('.wo').textContent === 'Linz · Stufe 7 Uhrwerk',
     karten[1].querySelector('.wo').textContent);
  /* Seit 15.09.2026 eine Pille mit LVL und Zahl in einer Zeile, oben
     rechts in der Ecke — vorher eine eckige Box mit der Ziffer ueber
     dem Woertchen. */
  ok('Das geteilte Level steht rechts',
     karten[1].querySelector('.tm-lvl').textContent === 'Lvl 3',
     karten[1].querySelector('.tm-lvl').textContent);
  ok('Und zwar in der Ecke des Kopfes',
     karten[1].querySelector('.tm-rechts').parentNode.className === 'tm-kopf'
     && karten[1].querySelector('.tm-rechts').firstChild.classList.contains('tm-lvl'),
     karten[1].querySelector('.tm-rechts').parentNode.className);
  ok('Das Herz sitzt darunter in seinem Platz',
     !!karten[1].querySelector('.tm-rechts > .tm-herzplatz > .tm-herz'));
  ok('Bei null bleibt die Pille grau', karten[2].querySelector('.tm-lvl').textContent === 'Lvl 0'
     && !karten[2].querySelector('.tm-lvl').classList.contains('an'));
  ok('Und der Becher ist blass',     !!karten[2].querySelector('.becher.leer'));
  ok('Der Becher passt zur Stufe',
     karten[1].querySelector('.becher').getAttribute('src') === 'tee-3.webp',
     karten[1].querySelector('.becher').getAttribute('src'));
  /* Wer heute schon geschickt hat, kann nicht noch einmal. */
  TEE_PAARE['u-a'].heuteSchon = true; malTeam();
  var a = document.querySelectorAll('#fi-team .tm')[1];
  ok('Heute schon geschickt heisst gesperrt', !!a.querySelector('.tm-send[disabled]')
     && a.querySelector('.tm-send').textContent.indexOf('Heute') > -1,
     a.querySelector('.tm-send').textContent.trim());
  /* Ein Fehler darf nicht wie eine leere Liste aussehen — genau das hat
     die falsche Leseregel verdeckt. */
  /* ── Reihenfolge, Herz und offener Tee ── */
  ME.besties = ['u-c'];
  TEAM = [{user_id:'u-ich',vorname:'Marco',kuerzel:'R',avatar:5,filiale:'',stufe:10,zuletzt:vor(0)},
          {user_id:'u-a',vorname:'Anna',kuerzel:'M',avatar:3,filiale:'',stufe:7,zuletzt:vor(1)},
          {user_id:'u-b',vorname:'Bernd',kuerzel:'K',avatar:7,filiale:'',stufe:4,zuletzt:vor(9)},
          {user_id:'u-c',vorname:'Clara',kuerzel:'W',avatar:9,filiale:'',stufe:2,zuletzt:vor(74)}];
  TEE_PAARE = {'u-a':{punkte:25,heuteSchon:false},'u-b':{punkte:35,heuteSchon:false},
               'u-c':{punkte:0,heuteSchon:false}};
  TEE_OFFEN = {'u-b':true};
  TEAM.sort(teamReihung); malTeam();
  var reihe = [].slice.call(document.querySelectorAll('#fi-team .tm'))
    .map(function(c){ return c.querySelector('.tm-t b').textContent.replace(' · du',''); });
  ok('Ich, dann der offene Tee, dann das Herz, dann der Rest',
     reihe.join(',') === 'Marco R.,Bernd K.,Clara W.,Anna M.', reihe.join(','));
  var bernd = document.querySelectorAll('#fi-team .tm')[1];
  ok('Der offene Tee faerbt die Karte', bernd.classList.contains('offen'));
  ok('Und sagt es auch',                !!bernd.querySelector('.tm-neu'));
  /* Vorher stand dort nur „Hat dir einen geschickt" — einen was? */
  ok('Und zwar, was geschickt wurde',
     bernd.querySelector('.tm-neu').textContent === 'Hat dir einen Bubble Tea geschickt',
     bernd.querySelector('.tm-neu').textContent);
  /* Der Satz ist zu lang fuer die schmale Spalte neben dem Namen und
     steht darum in einer eigenen Zeile unter dem Kopf. */
  ok('Und steht unter der Zeile, nicht daneben',
     bernd.querySelector('.tm-neu').previousSibling.className === 'tm-oben',
     bernd.querySelector('.tm-neu').previousSibling.className);
  /* Der Becher ist ein Knopf: antippen laesst ihn wackeln und funkeln. */
  var bec = bernd.querySelector('.tm-becher');
  ok('Der Becher laesst sich antippen', !!bec && bec.tagName === 'BUTTON');
  ok('Mit drei Funken darin',           bec && bec.querySelectorAll('i').length === 3);
  ok('Und dem Becher selbst',           !!bec.querySelector('img.becher'));
  bec.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles:true }));
  ok('Ein Tipp laesst ihn glitzern',    bec.classList.contains('glitzer'));
  ok('Das Herz ist bei der Bestie gesetzt',
     document.querySelectorAll('#fi-team .tm')[2]
       .querySelector('.tm-herz').getAttribute('aria-pressed') === 'true');
  ok('Beim Rest nicht',
     document.querySelectorAll('#fi-team .tm')[3]
       .querySelector('.tm-herz').getAttribute('aria-pressed') === 'false');
  ok('Der Bildrahmen traegt die Farbe der Stufe',
     bernd.getAttribute('style').indexOf('--rang:' + RAENGE[3].a) > -1,
     bernd.getAttribute('style'));
  ok('Ich selbst habe kein Herz und kein Level',
     !document.querySelectorAll('#fi-team .tm')[0].querySelector('.tm-rechts'));
  /* Antippen merkt es im Profil — und der andere erfaehrt nichts davon. */
  document.querySelectorAll('#fi-team .tm')[3].querySelector('.tm-herz')
    .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  ok('Ein Tipp markiert',  ME.besties.indexOf('u-a') > -1, ME.besties.join(','));
  document.querySelectorAll('#fi-team .tm')[3].querySelector('.tm-herz')
    .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  ok('Nochmal hebt auf',   ME.besties.indexOf('u-a') === -1, ME.besties.join(','));
  ok('Die Reihe bleibt beim Antippen stehen',
     document.querySelectorAll('#fi-team .tm')[3]
       .querySelector('.tm-t b').textContent === 'Anna M.');

  /* ── Offene Tees aus den Daten der Datenbank ── */
  UID = 'u-ich';
  var offen = teeOffenAus([
    { a:'u-ich', b:'u-b', letzt_a:'2026-09-10', letzt_b:'2026-09-14' },  /* er zuletzt */
    { a:'u-ich', b:'u-a', letzt_a:'2026-09-14', letzt_b:'2026-09-10' },  /* ich zuletzt */
    { a:'u-c',   b:'u-ich', letzt_a:'2026-09-14', letzt_b:null },        /* nur er */
    { a:'u-ich', b:'u-d', letzt_a:'2026-09-14', letzt_b:'2026-09-14' }   /* gleich */
  ]);
  ok('Offen ist nur, wer zuletzt geschickt hat',
     Object.keys(offen).sort().join(',') === 'u-b,u-c', Object.keys(offen).sort().join(','));

  /* ── Die Zaehler ──
     Am Profilbild stehen Nachrichten und Stufenaufstiege; die wartenden
     Bubble Teas stehen am Becher in der Leiste, dort, wo man sie
     beantwortet. Alle in Violett — die Sonderfaelle "violett fuer Tee"
     und "halb und halb" gibt es seit dem 21. September nicht mehr. */
  var z = document.getElementById('av-zaehler');
  _zaehlerFrei = true;
  ME.gelesen = alleNachrichten().map(function(n){ return n.id; });
  TEE_OFFEN = {}; malZaehler();
  ok('Ohne alles kein Punkt', z.hidden);
  TEE_OFFEN = {'u-b':true}; malZaehler();
  ok('Ein wartender Tee zaehlt nicht am Profilbild', z.hidden, z.textContent);
  ok('Sondern am Becher in der Leiste',
     document.getElementById('fi-zaehler').textContent === '1'
     && !document.getElementById('fi-zaehler').hidden);
  /* Er sitzt am Punkt in der Leiste, der dorthin fuehrt. */
  ok('Er sitzt am Symbol in der Leiste',
     document.getElementById('fi-zaehler').closest('.tab[data-go="v-firma"]') !== null);
  ME.gelesen = []; malZaehler();
  var summe = pfNeu().length + aufOffen();
  ok('Nachrichten und Tee zugleich: jeder an seiner Stelle',
     z.textContent === String(summe)
     && document.getElementById('fi-zaehler').textContent === '1',
     z.textContent + ' / ' + document.getElementById('fi-zaehler').textContent);
  ok('Keine Sonderklassen mehr am Zaehler',
     !z.classList.contains('tee') && !z.classList.contains('beides'), z.className);
  TEE_OFFEN = {}; malZaehler();
  ME.besties = []; TEE_OFFEN = {};

  TEAM = []; TEAM_FEHLER = 'keine Rechte';
  malTeam();
  ok('Ein Fehler wird benannt',
     document.getElementById('fi-team').textContent.indexOf('nicht laden') > -1
     && document.getElementById('fi-team').textContent.indexOf('keine Rechte') > -1,
     document.getElementById('fi-team').textContent.trim().slice(0, 70));
  TEAM_FEHLER = ''; malTeam();
  ok('Ohne Fehler steht die leere Liste da',
     document.getElementById('fi-team').textContent.indexOf('Noch niemand') > -1);

  TEAM = null; TEE_PAARE = {}; UID = null;

  window.__FERTIG = true;
};
setTimeout(window.__WEITER, 400);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  const _roh = roh;

  /* ── 7 · Die Regeln, auf denen die Masse beruhen ──
     jsdom rechnet kein Layout. Geprueft wird deshalb, dass die Regeln
     in der Datei stehen; die Masse selbst sind im Browser nachgemessen. */
  const css = [
    ['Karte laesst sich nicht seitlich schieben', /overflow-y:auto;\s*overflow-x:hidden/],
    ['Zeilen fahren nicht mehr von der Seite herein', /@keyframes miInVoll\{\s*from\{\s*opacity:0\s*\}\s*\}/],
    ['Karte skaliert beim Oeffnen nicht mehr', /@keyframes menuBlende\{\s*from\{\s*opacity:0\s*\}\s*\}/],
    ['Untermenues sind fest am Fenster', /\.avgrid, \.konten, \.datenbox, \.uabox, \.rangbox, \.dlbox, #konten, #uabox\{\s*\n\s*position:fixed; inset:0/],
    /* Die Leiste liegt ueber diesen Flaechen. Was darunter geriet, war
       nicht mehr zu treffen: die letzte Bilderreihe, der Speichern-Knopf. */
    ['Und lassen unten Platz fuer die Leiste',
     /padding:calc\(58px \+ env\(safe-area-inset-top\)\) 14px calc\(96px \+ env\(safe-area-inset-bottom\)\)/],
    ['mbody hebt sich ueber die Fusszeile', /\.menu-card\.dlauf \.mbody\{ z-index:6 \}/],
    ['Zurueck-Pfeil sitzt fest', /\.rangbox \.zurueckbtn, \.dlbox \.zurueckbtn\{\s*\n\s*position:fixed/],
    ['Profilbild ohne Fuge zwischen Rahmen und Bild', /\.avbig::after\{content:'';position:absolute;inset:0/],
    ['Regler haengt an aria-pressed', /\.mi\[aria-pressed="true"\] \.mischalter\{ background:var\(--butter\) \}/],
   /* Das Kopfskript muss VOR dem Stilblock stehen, sonst wird erst hell
      gezeichnet und dann umgeschaltet — ein Aufblitzen bei jedem Start. */
   ['Die Fassung steht vor dem ersten Anstrich',
    roh.indexOf("localStorage.getItem('moji.erscheinung')") < roh.indexOf('<style')],
   ['Der Deckel traegt die Farbe der neuen Fassung',
    /\.fassungsdeckel\{[\s\S]{0,120}background:var\(--ink\)/],
   ['Nach dem Wechsel kommt kein Gruss', /afterLogin\(session, !FASSUNG_NEU\)/],
   /* Das alte Formular ist am 14.09.2026 entfallen — mitsamt Schloessern
      und Zeit-Popover. Es darf nicht zurueckkommen. */
   ['Kein altes Dienstplan-Formular mehr', !/function renderSched\(/.test(roh)],
   ['Kein Zeit-Popover mehr',              !/function openTime\(/.test(roh)],
   /* Das meint die zwei Schloesser im alten Formular, nicht das eine,
      das seit 14.09.2026 die ganze Seite sperrt. */
   ['Kein schlossHtml aus dem alten Formular', !/function schlossHtml\(/.test(roh)],
   ['Hinauswischen ist verdrahtet',        /wireWischRaus\('v-hours', hoursRaus\)/],
   ['Die Raeder ziehen nur senkrecht',     /\.rad-roll\{[\s\S]{0,200}touch-action:pan-y/],
   /* Die Seite bringt ihre eigene Kopfzeile mit — dann darf die der App
      dort nicht auch noch stehen. */
   ['Dienstzeiten ohne Kopfleiste',        /id === 'v-hours'/.test(roh)],
   ['Das Gesperrte ist taub',              /\.hr-sperre\.zu > \*\{ pointer-events:none \}/.test(roh)],
   ['Und bleibt lesbar',                   /\.hr-sperre\.zu\{ opacity:\.46 \}/.test(roh)],
   /* Die Plus-Minus-Knoepfe bei Zeitausgleich und Urlaub sind am
      14.09.2026 den Raedern gewichen. */
   ['Keine Stepper mehr bei den Staenden',  !/data-kstep/.test(roh)],
   ['Verschlossen bleibt der Anspruch lesbar',
    /#uabox \.zabtn,#uabox \.uaein\{opacity:\.3;pointer-events:none\}/.test(roh)],
   /* Das Blatt der Anmeldung kommt im Takt der Tastatur, nicht langsamer. */
   ['Das Blatt hat eine eigene Kurve',      /--ease-blatt:cubic-bezier/.test(roh)],
   ['Und faehrt in einer Drittelsekunde',   /animation:blattRein \.34s var\(--ease-blatt\)/.test(roh)],
   ['Der Inhalt kommt einen Hauch spaeter', /@keyframes blattInhalt/.test(roh)],
   /* Das Team steht in eigenen Tabellen — records bleibt privat. */
   ['Das Team kommt nicht aus records',
    /from\('mitglieder'\)/.test(roh) && !/from\('records'\)[\s\S]{0,200}mitglieder/.test(roh)],
   ['Senden laeuft ueber die Datenbank', /sb\.rpc\('tee_senden'/.test(roh)],
   ['Zuletzt online wird gemeldet',      /sb\.rpc\('moji_gesehen'\)/.test(roh)],
   ['Hinauswischen ist verdrahtet',      /wireWischRaus\('v-firma', firmaZu\)/.test(roh)],
   /* Die Leseregel darf sich nicht selbst abfragen. */
   ['Die Leseregel fragt nicht sich selbst',
    !/using \(\s*\n?\s*firma = \(select m\.firma from public\.mitglieder/.test(policy)],
   ['Sich selbst sieht man immer',  /user_id = auth\.uid\(\)\s*--/.test(policy)],
   /* Die Teamkarte hat ein eigenes Praefix, damit sie nicht in die
      Regeln der Mitarbeiterkarte faellt. */
   ['Die Teamkarte heisst tm, nicht mk',
    /'<article class="tm'/.test(roh) && !/class="mk-t"/.test(roh.slice(roh.indexOf('function malTeam'), roh.indexOf('function malFirma')))],
   ['Und die Mitarbeiterkarte behaelt ihr mk', /\.mk\{position:relative;overflow:hidden/.test(roh)],
   ['Die Firma kommt aus einer eigenen Funktion',
    /create or replace function public\.meine_firma\(\)/.test(policy)
    && /security definer/.test(policy)],
   /* Bestehende Konten kommen ueber einen Ausloeser an records ins
      Team — nicht erst, wenn jemand die Ansicht aufmacht. */
   ['Ein Ausloeser zieht das Team nach', /create trigger records_mitglied/.test(policy)],
   ['Und er darf das Sichern nie aufhalten',
    /exception when others then/.test(policy) && /raise warning 'mitglied_nachziehen/.test(policy)],
   ['Die Stufe rechnet die Datenbank wie die App',
    /create or replace function public\.moji_stufe/.test(policy)
    && /\/ 4\s*\n?\s*\) \+ 1/.test(policy)],
   ['Ohne Namen kein Eintrag', /if vn = '' then/.test(policy)],
   ['Der Nachzug prueft sich selbst', /Nachzug unvollstaendig/.test(policy)],
   /* Die Zeile aus dem Menue brachte margin:26px 20px mit und machte die
      Seite breiter als den Schirm. */
   ['Die Firmenansicht laeuft nicht ueber', /#v-firma\{ overflow-x:hidden \}/.test(roh)
    && /#v-firma \.fi-sek\{ margin-top:26px/.test(roh)],
   ['Keine Menuezeile mehr fuer Meine Firma',
    !roh.includes('<button class="mi mi-firma" data-act="firma">')],
   ['Die Getraenkeleiste kann schmaler werden als ihr laengstes Wort',
    /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/.test(roh)],
   ['Der Zaehler haengt an der Symbolkachel',
    /\.mi \.miico > \.zaehler\{position:absolute;top:-7px;right:-7px/.test(roh)],
   /* Ein Bild wird nicht violett — die beiden Punkte ohne Wort
      bekommen einen Ring, wenn sie dran sind. */
   ['Die Punkte ohne Wort zeigen ihren Zustand als Ring',
    roh.includes('.tab-tee.an img{ border-radius:11px;')
    && roh.includes('.tab-pro.an .avatar{ box-shadow:0 0 0 2.5px var(--butter),')],
   /* Eine Animation, die dauernd zappelt, uebersieht man nach zwei
      Minuten; eine, die sich hin und wieder meldet, nicht. */
   ['Der wartende Becher meldet sich alle fuenf Sekunden',
    roh.includes('animation:teeWink 5s var(--ease-out) .8s infinite }')
    && roh.includes('0%, 70%, 100%{ transform:none }')],
   ['Und zwar nur, solange einer wartet',
    roh.includes("tt.classList.toggle('wartet', tee > 0);")],
   ['Er kippt am Fuss, nicht um die Mitte',
    roh.includes('.tab-tee.wartet img{ transform-origin:50% 86%;')],
   ['Der Punkt traegt den Becher, nicht Haus und Wort',
    roh.includes('<button class="tab tab-tee" data-go="v-firma" aria-label="Meine Firma">')
    && roh.includes('.tab-tee img{ width:34px; height:34px;')],
   ['Die wartenden Becher stehen am Punkt in der Leiste',
    roh.includes('<span class="zaehler" id="fi-zaehler" hidden></span></span>')
    && roh.includes('.tabi{position:relative; display:grid; place-items:center;')],
   ['Der Zaehler liegt ueber dem Logo',
    /\.mi \.miico > \.zaehler\{[^}]*z-index:2\}/.test(roh)],
   /* ─── 15.09.2026: Schweben, Wackeln, Funkeln ─────────────────── */
   ['Wer mir einen geschickt hat, dessen Bild schwebt',
    /\.tm\.offen \.tm-bild\{ animation:mkWippe 3\.4s ease-in-out infinite alternate \}/.test(roh)],
   ['Und zwar genauso wie auf der Mitgliedschaftskarte',
    /\.mk-bild\{[\s\S]{0,260}animation:mkWippe 3\.4s ease-in-out infinite alternate/.test(roh)],
   /* Beide Orte teilen sich dieselben Regeln: der eine Becher in der
      Mitgliedskarte und alle zehn in der Getraenkekunde. */
   ['Der Becher wackelt beim Andruecken',
    /\.tm-becher\.glitzer \.becher, \.teek\.glitzer \.teekb img\{\s*\n\s*animation:teeWackel/.test(roh)
    && /@keyframes teeWackel\{/.test(roh)],
   ['Und es funkelt dazu',
    /\.tm-becher\.glitzer i, \.teek\.glitzer \.teekb i\{\s*\n\s*animation:teeFunke/.test(roh)
    && /@keyframes teeFunke\{/.test(roh)],
   ['Die Funken sind Sterne in der Farbe des Getraenks',
    /\.tm-becher i, \.teekb i\{[\s\S]{0,220}background:var\(--tee, var\(--butter\)\);[\s\S]{0,120}clip-path:polygon/.test(roh)],
   ['Der Becher kippt am Fuss, nicht um die Mitte',
    /\.tm-becher \.becher, \.teekb img\{ transform-origin:50% 88% \}/.test(roh)],
   ['Ein Weg fuer beide Orte',
    /\$\('#v-firma'\)\.addEventListener\('pointerdown', becherTipp\);/.test(roh)
    && /e\.target\.closest\('\.tm-becher, \.teek'\)/.test(roh)],
   ['Weniger Bewegung laesst beides weg',
    /prefers-reduced-motion:reduce\)\{[\s\S]{0,300}\.tm\.offen \.tm-bild\{ animation:none \}[\s\S]{0,240}\.teek\.glitzer \.teekb img, \.teek\.glitzer \.teekb i\{ animation:none \}/.test(roh)],
   ['Der Vermerk bricht nicht um',
    /\.tm-neu\{[\s\S]{0,260}white-space:nowrap/.test(roh)],
   /* ─── 15.09.2026: Level als Pille oben rechts ──────────────────── */
   ['Das Level ist eine Pille wie auf der Mitgliedschaftskarte',
    /\.tm-lvl\{[\s\S]{0,240}border-radius:99px;[\s\S]{0,200}text-transform:uppercase/.test(roh)],
   ['Die rechte Spalte haengt am Kopf',
    /\.tm-kopf\{ position:relative; padding-right:74px \}/.test(roh)
    && /\.tm-rechts\{ position:absolute; top:0; right:0; bottom:-11px;/.test(roh)],
   ['Die eigene Karte gibt den Platz nicht her',
    /\.tm\.ich \.tm-kopf\{ padding-right:0 \}/.test(roh)],
   ['Und reicht bis zur Linie, damit das Herz mittig sitzt',
    /\.tm-herzplatz\{ flex:1; display:flex; align-items:center \}/.test(roh)
    && /\.tm-tee\{[\s\S]{0,160}margin-top:11px/.test(roh)],
   ['Die Farben bleiben, wie sie waren',
    /\.tm-lvl\.an\{ color:var\(--tee\); background:color-mix\(in srgb, var\(--tee\) 16%, transparent\)/.test(roh)],
   ['Bis 90 Tage wird gezaehlt', /if\(tage < 90\) return 'vor ' \+ tage \+ ' Tagen';/.test(roh)],
   /* ─── 15.09.2026: 117 Profilbilder ────────────────────────────── */
   ['Das Bildgitter faengt oben an, nicht in der Mitte',
    /\.avgrid\{[\s\S]{0,200}align-content:start/.test(roh)],
   /* Nachgemessen: mit auto quetscht das Gitter alle 30 Reihen in den
      Kasten — 14,7 px hoch, die Kacheln uebereinander. */
   ['Und die Reihen behalten ihre Hoehe',
    /\.avgrid\{[\s\S]{0,600}grid-auto-rows:min-content;/.test(roh)],
   /* ─── 20.09.2026: der Kopf ist die Karte ──────────────────────── */
   ['Der Kopf traegt dieselben Pastelltoene wie die grosse Karte',
    /\.mausweis\{[\s\S]{0,700}background:linear-gradient\(168deg,var\(--pa[\s\S]{0,80}var\(--pb/.test(roh)],
   ['Und eine eigene Tinte, nicht --f-2',
    /--ma-ink:#1A1026;/.test(roh) && !/\.mausweis\{[\s\S]{0,700}color:var\(--f-2\)/.test(roh)],
   /* Unten steht entweder die Navigation oder eine Entscheidung, nie
      beides — waehrend eines Zeitraums weicht die Leiste. */
   /* Schwebend wanderte sie in Safari mit der Adressleiste mit und
      huepfte dabei. Am Rand klebend faellt dasselbe nicht auf. */
   /* filter:invert(1) auf der Wortmarke, mitten im Milchglas der
      Kopfleiste: in der installierten App war der Schriftzug weich,
      die Unterzeile daneben scharf. */
   ['Die Wortmarke wird nicht mehr per Filter umgedreht',
    !/\.bword\{ filter:invert\(1\) \}/.test(roh)],
   ['Sondern hat eine eigene schwarze Datei',
    roh.includes("const LOGO_WORD_TINTE = 'data:image/png;base64,")],
   ['Die richtige wird mit der Fassung gesetzt',
    roh.includes('bw.src = dunkel ? LOGO_WORD : LOGO_WORD_TINTE;')
    && roh.includes("? LOGO_WORD : LOGO_WORD_TINTE;")],
   /* Sie stand zuerst in #app und lag damit in dessen Stapelkontext
      (z-index 2) — ihr eigener z-index zaehlte nur dort drin, und das
      Menue daneben legte sich darueber. */
   ['Die Leiste ist ein Geschwister des Menues, nicht ein Kind von #app',
    roh.indexOf('<nav class="tabbar"') > roh.indexOf('<div class="menu" id="menu">')
    && roh.indexOf('<nav class="tabbar"') > roh.indexOf('<div id="app"')],
   ['Die Leiste klebt am unteren Rand',
    roh.includes('.tabbar{position:fixed; left:0; right:0; bottom:0; z-index:46;')
    && roh.includes('padding:11px 6px calc(15px + env(safe-area-inset-bottom));')],
   ['Vier gleich breite Felder aus Milchglas',
    roh.includes('grid-template-columns:repeat(4,1fr); align-items:end; gap:2px;')
    && roh.includes('backdrop-filter:blur(22px) saturate(1.2);')],
   ['Alle vier Woerter stehen da',
    roh.includes(".tab em{font-style:normal; font-size:10px; font-weight:600;")
    && !roh.includes('.tab.an em{max-width:140px; opacity:1}')],
   /* Ohne Wort darunter sitzt das Bild mittig statt auf der Grundlinie
      der drei anderen — und darf dafuer groesser sein. */
   ['Das Profilbild ist der Anker: 48 px, mittig, mit Ring',
    roh.includes('.tab-pro{ align-self:center; padding:0 }')
    && roh.includes('.tabbar .avatar{ width:48px; height:48px; border-radius:17px;')
    && roh.includes('box-shadow:0 0 0 2.5px rgba(var(--s-hoch),.95),')],
   ['Kein Wort unter dem Bild — es ist sein eigener Name',
    !roh.includes('</span>\n      <em>Profil</em>')],
   ['Der ganze Punkt ist der Knopf, nicht nur das Bild',
    roh.includes("$('#tab-pro').addEventListener('click', () => {")
    && !roh.includes("$('#avatar').addEventListener")],
   ['Bei einer Entscheidung weicht sie',
    roh.includes('body.zrmodus #tabbar, body.sigmodus #tabbar,')
    && roh.includes('opacity:0; transform:translateY(8px); pointer-events:none }')],
   /* Der Vorspann traegt absichtlich keinen eigenen Grund und liess
      die Leiste durchscheinen. */
   ['Und bei allem, was die Seite festhaelt, auch',
    roh.includes('body.locked #tabbar{')],
   ['Und die beiden alten Ansichtsknoepfe sind weg',
    !roh.includes('class="btn btn-p fb-n"') && !roh.includes('fb-n{display:none}')],
   ['Die drei Ziele lassen Platz fuer die Leiste',
    roh.includes('#v-cal, #v-export, #v-firma{padding-bottom:calc(104px + env(safe-area-inset-bottom))}')],
   /* Die unsichtbare Flaeche ueber der ganzen Karte ist weg — sie
      stand jedem Knopf im Weg, den die Karte sonst tragen soll. */
   ['Keine Druckflaeche mehr ueber der Karte',
    !roh.includes('class="ma-flaeche"') && !roh.includes('.ma-flaeche{')],
   ['Ein Knopf fuehrt zu den Karten, oben rechts',
    roh.includes('<button class="ma-karten" id="ma-auf"')
    && roh.includes('.ma-karten{ flex:none; align-self:flex-start;')],
   ['Die Karte selbst nimmt keine Tipps',
    /\.ma-oben\{[\s\S]{0,200}pointer-events:none \}/.test(roh)],
   ['Das Bild bleibt anfassbar',
    /\.ma-oben \.avbig, \.ma-oben \.avplatz\{ pointer-events:auto \}/.test(roh)],
   /* Der ganze Kopf gab nach, solange der Finger auf ihm lag — er war
      ja ein einziger grosser Knopf. Seit die Karte nur noch berichtet,
      waere das ein Versprechen ohne Folge. */
   ['Die Karte gibt selbst nicht mehr nach',
    !roh.includes('.mausweis.druck{') && !roh.includes("k.classList.add('druck')")],
   /* Der Einlauf des Menues belegt transform — eine Animation schlaegt
      jede normale Regel. Jeder Druck muss darum ueber scale gehen. */
   ['Die Knoepfe darin drucken ueber scale',
    roh.includes('.mw:active{ scale:.955 }')
    && roh.includes('.ma-karten:active{ scale:.94 }')],
   /* ─── Der Stapel: Bewegung und Zustaende ───────────────────────── */
   ['Gewischt wird mit Einrasten',
    /\.kt-bahn\{[\s\S]{0,400}scroll-snap-type:x mandatory;/.test(roh)
    && /\.kt\{[\s\S]{0,120}scroll-snap-align:center; scroll-snap-stop:always;/.test(roh)],
   ['Die Tiefe kommt aus --nah und geht ueber scale',
    /scale:calc\(\.9 \+ \.1 \* var\(--nah, 1\)\);/.test(roh)
    && roh.includes("k.el.style.setProperty('--nah'")],
   /* Die Masse aendern sich beim Scrollen nicht. Sie bei jedem Bild
      abzufragen zwang den Browser, zwischen zwoelf Stil-Schreibungen
      zwoelf Mal neu zu rechnen — davon wurde das Blaettern zaeh. */
   ['Die Masse werden einmal gemessen, nicht je Bild',
    roh.includes('function ktMessen(){')
    && roh.includes('const m = _ktMasse || ktMessen();')
    && roh.includes('_ktMasse = null;               /* neue Karten, neue Masse */')],
   ['Waehrend der Fahrt rastet nichts ein',
    roh.includes('.kt-bahn.fliegt{ scroll-snap-type:none }')
    && roh.includes("bahn.classList.add('fliegt', 'wischt');")],
   /* Zwoelf Karten mit eigener Perspektive und preserve-3d bei jedem
      Winkel neu zu rastern ist die eigentliche Last. */
   ['Und die Karten drehen sich dabei nicht',
    roh.includes('.kt-bahn.fliegt .kt-dreh{ transform:none }')
    && roh.includes('.kt-bahn.fliegt .kt-glanz{ animation:none }')],
   ['Und Titel und Punkte nur beim Wechsel',
    roh.includes('if(n === _ktVorne) return;     /* der Rest gilt nur beim Wechsel */')],
   ['Gerechnet wird einmal je Bild, nicht je Scroll-Ereignis',
    /_ktRaf = requestAnimationFrame\(\(\) => \{ _ktRaf = 0; kartenTiefe\(\); \}\);/.test(roh)],
   /* Die Farbe kommt jetzt fuer alle zwoelf aus demselben Schema um
      die Rangfarbe herum — vorher lief der Verlauf nach fast Schwarz
      und alle sahen aus der Entfernung gleich dunkel aus. */
   ['Der Verlauf bleibt bei der Rangfarbe',
    roh.includes('background:linear-gradient(168deg, var(--rhoch,#6E7CA8) 0%, var(--rf2,#5C6A94) 52%,')
    && roh.includes("k.style.setProperty('--rhoch', mischWeiss(rang(n).b, .12));")
    && roh.includes("k.style.setProperty('--rtief', mischSchwarz(rang(n).b, .26));")],
   /* Auf der aktuellen Karte bleibt fuer margin-top:auto am Fuss nichts
      uebrig — das Fach sass auf der Kante des Bandes. */
   ['Das Fach haelt Abstand zum Band',
    roh.includes('.kt-fach{ margin:13px 9px 15px;')],
   /* Die Bahn schnitt den Kartenschatten mit overflow-y:hidden ab —
      eine harte Kante quer ueber die Ansicht. */
   ['Die Bahn laesst dem Schatten Platz',
    roh.includes('padding:10px calc((100% - var(--kb)) / 2) 48px;')],
   ['Die Punktreihe sitzt unten, nicht dicht unter der Karte',
    roh.includes('.mkv-in > .kt-zeile{margin-top:auto}')
    && roh.includes('.mkv-in > .kt-punkte{margin-top:auto}')
    && roh.includes('align-self:stretch;\n  max-height:100%;overflow-y:auto;')],
   /* Die Karte im Brief: dieselbe ktKarte() wie im Stapel, nur ohne
      Nachbarn — und mit min-width:0, weil ein Flex-Kind sonst die
      Breite seines Inhalts erzwingt (das Fach bricht nicht um). */
   /* Die Karte stand gross und mittig im Brief und liess sich
      andruecken — beim Lesen und Rollen landete man im Stapel. */
   /* Die Regel steht auch in der Datenbank — im Fenster allein waere
      sie nur eine Bitte. */
   ['Der Server kennt den Gegenzug',
    /dran\s*:=\s*\(meins is not null and \(seins is null or seins < meins\)\);/.test(sql)],
   ['Und zaehlt dann nichts',
    /if not war and not dran then/.test(sql)],
   ['Er sagt der App auch, dass gewartet wird',
    /returns table \(punkte integer, level integer, schon_heute boolean, wartet boolean\)/.test(sql)],
   ['Die App nennt den Grund weiter',
    roh.includes("toast('Erst wenn du einen zurückbekommst')")],
   /* Umgeschaltet wird aus dem Menue heraus — also soll man danach
      auch wieder dort stehen. */
   ['Der Fassungswechsel merkt sich das offene Menue',
    roh.includes("sessionStorage.setItem('moji.fassung.menu', '1');")
    && roh.includes("mo.classList.contains('on') && !mo.classList.contains('zu')")],
   ['Und macht es danach wieder auf',
    roh.includes("const ja = sessionStorage.getItem('moji.fassung.menu') === '1';")
    && roh.includes('if(FASSUNG_MENU){\n    menuAuf();')],
   ['Ohne Einlaufbewegung — es war ja schon da',
    /if\(FASSUNG_MENU\)\{[\s\S]{0,220}classList\.add\('sofort'\)/.test(roh)],
   /* Die Kachelreihe ersetzt zwei Bedienelemente in der Karte. */
   ['Die Kachelreihe steht zwischen Karte und Gruppen',
    roh.indexOf('<div class="ikonleiste" id="ikonleiste">') > roh.indexOf('id="mausweis"')
    && roh.indexOf('<div class="ikonleiste" id="ikonleiste">') < roh.indexOf('<div class="mbody" id="mbody">')],
   ['Vier gleich breite Felder',
    roh.includes('grid-template-columns:repeat(4,minmax(0,1fr))')],
   /* Unten sass der Stift dort, wo die Reihe mit den Staenden
      beginnt, und schob sich vor das erste Feld. */
   ['Das Bild ist 88 px und traegt oben rechts einen Stift',
    roh.includes('.ma-oben .avbig{ width:88px; height:88px; border-radius:24px }')
    && roh.includes('.avstift{ position:absolute; right:-4px; top:-4px; width:24px; height:24px;')],
   ['Name und Firma kleben nicht am Bild',
    roh.includes('display:flex; align-items:flex-start; gap:16px;')],
   /* Drei Felder statt Pille und Zeile: Becher, Serie und Stufe in
      derselben Form, jedes ein Knopf mit eigener Spielerei. */
   /* Neben dem Bild blieben je 39 px uebrig und die Beschriftungen
      liefen ueber — die Reihe laeuft jetzt ueber die ganze Karte. */
   ['Drei gleich grosse Felder ueber die Kartenbreite',
    roh.includes('.ma-werte{ position:relative; z-index:2; display:grid;')
    && roh.includes('grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px;')],
   ['Das leere Becherfeld verschwindet wirklich',
    roh.includes('.mw[hidden]{ display:none }')],
   ['Der Becher wackelt und funkelt wie in der Firmenansicht',
    roh.includes('.mw.glitzer .mw-bild img, .mw.glitzer .mw-ico{ animation:teeWackel .62s var(--ease-out) }')
    && roh.includes('.mw.glitzer .mw-bild i{ animation:teeFunke .62s var(--ease-out) }')],
   ['Die Krone wirft ihre Funken weiter hinaus',
    roh.includes('@keyframes kroneFunke{')
    && roh.includes('.mw.konfetti .mw-bild i{ animation:kroneFunke .82s var(--ease-out) }')],
   ['Die Flamme lodert von selbst, in zwei Takten',
    roh.includes('.mw-flamme{ animation:flammeLodern 2.6s ease-in-out infinite,')
    && roh.includes('flammeGlut 1.7s ease-in-out infinite alternate }')],
   ['Und alles steht still, wer Bewegung abgestellt hat',
    /@media \(prefers-reduced-motion:reduce\)\{\s*\n\s*\.mw-flamme\{ animation:none \}/.test(roh)],
   ['Ein Tipp trifft das Feld, nicht die Karte',
    roh.includes("const f = e.target.closest('.mw'); if(!f) return;")
    && roh.includes("const art = f.id === 'mw-lvl' ? 'konfetti' : 'glitzer';")],
   /* Tage in Folge: gezaehlt werden Tage, nicht Besuche. */
   ['Die Serie zaehlt einmal am Tag',
    roh.includes('if(s.letzt === h) return;')
    && roh.includes('s.tage = (s.letzt === gestern) ? (s.tage || 0) + 1 : 1;')],
   ['Und faengt neu an, wenn ein Tag fehlt',
    roh.includes('g.setDate(g.getDate() - 1);')],
   ['Sie wird beim Betreten fortgeschrieben',
    roh.includes('  serieZaehlen();\n  stufenPostNachziehen();')],
   ['Der Stand zeigt den echten Becher',
    roh.includes("bild.src = 'tee-' + Math.max(1, Math.min(TEE.length, g.level)) + '.webp';")],
   /* Kein Kasten mehr: der Becher steht frei, unten buendig mit dem
      Profilbild, und die Beschriftung sagt, was die Zahl zaehlt. */
   ['Der Becher steht in einem Feld, nicht mehr frei in der Zeile',
    roh.includes('<u>Bubble Teas<br>versendet</u>')
    && !roh.includes('.teestand{') && !roh.includes('.teebadge{')],
   ['Die Zahlen stehen in der Anzeigeschrift',
    roh.includes('.mw b{ font-family:var(--font-dis); font-weight:400; font-size:19px;')],
   ['Sie stehen unter dem Kopf, nicht darin',
    roh.indexOf('<div class="ma-werte">') > roh.indexOf('id="mr-zaehler"')
    && roh.indexOf('<div class="ma-werte">') < roh.indexOf('<div class="ma-leiter">')],
   ['Die Becher-Plakette nimmt die Farbe der Sorte',
    roh.includes("b.style.setProperty('--tf', sorte.f);")],
   ['Die Gruppierung greift nur nach Menuezeilen',
    roh.includes(".mi[data-act=\"' + a + '\"]")],
   ['Die Karte im Brief ist ein Banner',
    roh.includes('.pfk{ display:flex; align-items:center; gap:14px;')
    && roh.includes('.pfk-k{ zoom:.4; flex:none; display:block }')],
   ['Mit getoentem Grund in der Stufenfarbe',
    roh.includes('background:linear-gradient(104deg, var(--rft2,rgba(140,62,140,.26)),')
    && roh.includes('$$(\'.pfk\', wurzel).forEach(p => faerbe(p, +p.dataset.kt));')],
   ['Verkleinert mit zoom, damit die Hoehe mitgeht',
    roh.includes('zoom:.4')],
   ['Sie nimmt keine Tipps mehr an',
    roh.includes('border-radius:20px; pointer-events:none;')
    && !roh.includes('data-ktauf')
    && !roh.includes('.pfk:active .kt{ scale:.97 }')],
   ['Und ist fuer die Vorlesehilfe ein Bild',
    roh.includes('<div class="pfk" data-kt="\' + n + \'" aria-hidden="true">')],
   ['Im Brief wird nicht gedreht',
    roh.includes('.pfk .kt-rueck{ display:none }')],
   ['Das Banner klappt mit auf',
    roh.includes('animation:pfkAuf .6s .1s var(--ease-out) both }')
    && roh.includes('@keyframes pfkAuf{')],
   /* Waehrend der Feier sagte die Titelzeile des Stapels dasselbe noch
      einmal und schob die Karte um 84 px nach unten. */
   ['Die Feier zeigt die Titelzeile nicht doppelt',
    roh.includes('.mkv.feier .kt-zeile{ display:none }')
    && roh.includes("b.classList.add('feier');")],
   ['Die Plakette traegt die Stufenfarbe, nicht Violett',
    roh.includes('background:var(--rd,#5C6A94);\n  box-shadow:0 0 24px -5px var(--rf,#8FA0C8);')],
   ['Unter der Karte steht, was die Zeit hergibt',
    roh.includes("$('#mk-tipp').innerHTML = lohnHtml(gespartMin());")],
   ['Ein zarter Schatten traegt die weisse Schrift',
    roh.includes('text-shadow:0 1px 2px rgba(10,6,18,.30);')],
   ['Unten saeuft die Farbe nicht mehr ab',
    !roh.includes('mischSchwarz(rang(n).b, .58)')],
   /* Zwei Sonderregeln fuer die Legende sind weggefallen: eine goldene
      und eine graue, die sie fuer die verschlossene Karte wieder
      zurueckgenommen hat. Das Schema macht beides von selbst. */
   ['Keine Sonderregeln mehr fuer die Legende',
    !roh.includes('.kt.gold .kt-vorn') && !roh.includes('.kt.zu.gold .kt-vorn')],
   ['Das geteilte Bild nimmt dieselben drei Halte',
    roh.includes('kg.addColorStop(0, mischWeiss(r.b, .12)); kg.addColorStop(.52, r.b);')
    && roh.includes('kg.addColorStop(1, dunkel(r.b, .26));')],
   /* Umdrehen wie bisher — vorne wer und wie weit, hinten die Angaben. */
   ['Die Karte laesst sich umdrehen',
    /\.kt\.um \.kt-dreh\{ transform:rotateY\(180deg\) \}/.test(roh)
    && /k\.classList\.toggle\('um'\);/.test(roh)],
   ['Nur die vordere dreht sich, die anderen kommen erst in die Mitte',
    /if\(n !== _ktVorne\)\{ ktZeige\(n, true\); return; \}/.test(roh)],
   ['Der Glanz wandert, aber nur auf der vorderen',
    /\.kt\.vorn \.kt-glanz\{ animation:ktGlanz/.test(roh)
    && /@keyframes ktGlanz\{/.test(roh)],
   ['Und kein Uebergang auf der Groesse, der dem Finger nachlaeuft',
    !/\.kt\{[\s\S]{0,420}transition:scale/.test(roh)],
   ['Das Band sitzt unten und nimmt die Fassung auf',
    /\.kt-fuss\{[\s\S]{0,240}margin-top:auto;[\s\S]{0,120}background:var\(--kt-band/.test(roh)
    && /--kt-band:rgba\(255,255,255,\.20\);/.test(roh)
    && /--kt-band:rgba\(148,142,164,\.20\);/.test(roh)],
   ['Die Plakette traegt die Farbe der Stufe, kein Schwarz',
    /\.ma-lvl\{[\s\S]{0,200}background:var\(--rd, #5C6A94\);/.test(roh)],
   ['Weniger Bewegung laesst das Einrasten weg',
    /prefers-reduced-motion:reduce\)\{\s*\n\s*\.kt\{ scale:1; opacity:1 \}[\s\S]{0,200}\.kt-bahn\{ scroll-snap-type:none \}/.test(roh)],
   ['Die alte Drehbuehne ist weg',
    !/id="mk-dreh"/.test(roh) && !/function karteDreh/.test(roh)],
   /* Der Kopf IST die Karte — also wandert der Glanz auch dort. */
   ['Der Glanz wandert auch im Menue',
    /\.menu\.on:not\(\.zu\) \.mausweis \.ma-glanz\{ animation:maGlanz/.test(roh)
    && /@keyframes maGlanz\{/.test(roh)],
   /* Die Grundregel darf sie NICHT tragen — sonst liefe sie auch bei
      geschlossenem Menue weiter. Ein einfaches "kommt nicht vor" reicht
      als Pruefung nicht: die enge Regel endet selbst auf .ma-glanz{. */
   ['Aber nur, solange das Menue offen ist',
    /\.ma-glanz\{ position:absolute;[^}]*transform:translateX\(-85%\) \}/.test(roh)
    && (roh.match(/animation:maGlanz/g) || []).length === 1],
   /* Schwarz sass auf dem hellen Pastell wie ein Riegel und verschwand
      in der dunklen Fassung im Grund der Seite. */
   ['Das Band im Kopf traegt die Farbe der Stufe',
    /\.ma-band\{[\s\S]{0,260}background:var\(--rd, #5C6A94\)/.test(roh)],
   ['Die Vorderseite fuellt die Karte ganz aus',
    /\.kt-vorn\{ position:relative; flex:1; width:100%;/.test(roh)
    && /\.kt-dreh\{ position:relative; flex:1; display:flex;/.test(roh)],
   ['Im Fach bricht nichts um',
    /\.kt-fach b\{[\s\S]{0,160}white-space:nowrap; flex:none \}/.test(roh)],
   /* Die Karten drehen sich beim Wischen leicht mit — das sagt, dass sie
      eine Rueckseite haben. Ohne den Hinweis kam niemand darauf. */
   ['Beim Wischen drehen die Karten mit',
    /transform:rotateY\(calc\(var\(--seite, 0\) \* 16deg\)\);/.test(roh)
    && roh.includes("k.el.style.setProperty('--seite'")],
   ['Waehrend des Wischens ohne Uebergang',
    /\.kt-bahn\.wischt \.kt-dreh\{ transition:none \}/.test(roh)
    && /bahn\.classList\.add\('wischt'\);/.test(roh)],
   /* Das Aufschlagen war ein reines Aufblenden — die Karten standen
      schlagartig in voller Groesse da. Jetzt fahren sie aus der Karte
      im Menue heraus, gemessen aus beiden Rechtecken. */
   ['Der Stapel faehrt aus der Menuekarte heraus',
    roh.includes('function mkvFlug(auf){')
    && roh.includes("const von = _vonMenu ? $('#mausweis') : null;")
    && roh.includes('gr = Math.max(.55, Math.min(.96, q.width / z.width * .96));')],
   ['Aufschlagen mit Expo-Kurve, Schliessen kuerzer',
    roh.includes('const dauer = auf ? 620 : 300;')
    && roh.includes("easing: auf ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.4,0,.72,.2)'")],
   ['Wer Bewegung abgestellt hat, bekommt keine',
    roh.includes("try{ still = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}")],
   ['Beide Wege benutzen denselben Flug',
    roh.includes('  mkvFlug(true);\n  ktBahnHorchen();')
    && roh.includes('const dauer = mkvFlug(false);')
    && roh.includes("}, dauer + 20);")],
   ['Der Stapel blendet nicht mehr nur auf',
    !roh.includes('@keyframes mkvAuf')],
   /* Die Plakette sortierte sich mit z-index in den Kontext der
      Drehbuehne ein und stand dort als eigenes Objekt im Raum. */
   ['Jede Kartenseite hat ihren eigenen Stapelkontext',
    roh.includes('.kt-vorn, .kt-rueck{ border-radius:26px; overflow:hidden; color:#fff; isolation:isolate;')],
   ['Die Plakette sitzt im Fenster, nicht ueber dem Band',
    roh.includes('.kt-stempel{ position:absolute; top:10px; right:10px;')
    && !roh.includes('.kt-stempel{ position:absolute; top:17px; right:17px; z-index:4;')],
   ['Und steht im Markup hinter dem Schloss',
    roh.includes("+   (frei && !ist ? '<span class=\"kt-stempel\">Erreicht</span>' : '')")],
   /* Auf der Rueckseite klebte alles oben, darunter blieb ein Loch. */
   ['Der Datenblock fuellt die Rueckseite',
    roh.includes('.kt-zeilen{ flex:1; display:flex; flex-direction:column; justify-content:stretch;')
    && roh.includes('.kt-zeilen div{ flex:1; min-height:0; display:flex; align-items:center;')],
   ['Die letzte Zeile schwebt nicht mehr',
    roh.includes('.kt-zeilen div:last-child{ border-bottom:0 }')],
   ['Die Karten haben eine Kante',
    roh.includes('box-shadow:inset 0 0 0 1px rgba(255,255,255,.13), 0 26px 56px -24px rgba(var(--s-schatten),.8) }')],
   ['Der Satz unten sitzt an einer Linie',
    roh.includes('.kt-hinweis{ margin-top:0; border-top:1px solid rgba(255,255,255,.16);')],
   /* Wer die Karten aufmacht, faehrt von der ersten bis zu der, die
      gerade gilt — das zeigt in einer Bewegung, dass es ein Stapel
      ist und wo man darin steht. */
   ['Der Stapel faehrt von der ersten bis zur aktuellen',
    roh.includes('function ktFlug(vonNr, bisNr, fertig){')
    && roh.includes('else ktFlug(1, _ktZeig, stups);')],
   ['Gerechnet, damit die Dauer an der Strecke haengt',
    roh.includes('const dauer = Math.min(1000, 240 + weit * 70);')],
   /* Mit 1-(1-t)^3 kroch das letzte Drittel, mit einer S-Kurve war
      der Start traege. Quadratisch auslaufend trifft beides. */
   ['Quadratisch auslaufend: gleich los, weich hin',
    roh.includes('const kurve = t => t * (2 - t);')],
   ['Aus einem Brief heraus steht die Karte sofort da',
    roh.includes('if(nr){ ktZeige(_ktZeig, false); stups(); }')],
   /* Im Hintergrund feuert requestAnimationFrame nicht — dort bliebe
      der Stapel sonst auf der ersten Karte stehen. */
   ['Wer Bewegung abgestellt hat oder wegsieht, kommt gleich an',
    roh.includes('if(!weit || still || !bahn.clientWidth || document.hidden){')],
   ['Und am Ziel wackelt sie gleich, nicht erst nach einer halben Sekunde',
    roh.includes('animation:ktStups 1.5s .18s var(--ease-out) 1 }')],
   ['Die Stufenkachel ist zweizeilig wie die anderen',
    roh.includes('<u>Profil<br>Level</u>')],
   ['Beim Aufschlagen stupst die vordere Karte an',
    /\.kt\.stups \.kt-dreh\{ animation:ktStups/.test(roh) && /@keyframes ktStups\{/.test(roh)],
   ['Die Obergrenze in normalize steht nicht als Zahl da',
    /if\(!\(av >= 1 && av <= AVATARE\)\) delete p\.avatar;/.test(roh)],
   ['Das zugeteilte Bild wird hinterlegt',
    /if\(!p\.avatar && \(p\.vorname \|\| p\.dob\)\) p\.avatar = avZufall\(p\);/.test(roh)],
   ['Und gleich in die Cloud geschoben',
    /if\(push \|\| \(!hatteBild && ME\.avatar\)\) cloudQueue\(\);/.test(roh)],
   ['Der Ausloeser ueberschreibt das Bild nicht mit einer 1',
    /avatar  = coalesce\(av, public\.mitglieder\.avatar\),/.test(sql)
    && /av := nullif\(d->>'avatar', ''\)::smallint;/.test(sql)],
   ['Und gleicht einmalig an, wo records eine Nummer traegt',
    /update public\.mitglieder m[\s\S]{0,400}nullif\(r\.data::jsonb->>'avatar',''\) is not null/.test(sql)],
   ['Nur die ersten laufen gestaffelt ein',
    /\.menu-card\.avauf \.avopt:nth-child\(n\+14\)\{animation:none\}/.test(roh)],
   ['Und die Bilder laden erst beim Scrollen',
    /avDatei\(i\) \+ '" alt="" '\s*\n\s*\+ 'loading="lazy" decoding="async"/.test(roh)],
   ['Die Stunden gehen den Tagen vor',
    /if\(std === 1\) return 'vor 1 Stunde';\s*\n\s*if\(std <= 4\) return 'vor ' \+ std \+ ' Stunden';\s*\n\s*const h = new Date\(\)/.test(roh)],
   /* Rot sagt "etwas ist schiefgegangen"; hier wartet nur etwas. Alle
      Zahlen tragen jetzt die Farbe der App. */
   ['Alle Zahlen sind violett',
    roh.includes('border-radius:999px;background:var(--butter);color:var(--on-primary);')
    && !roh.includes('#FF453A')],
   ['Und es gibt keine Sonderfaelle mehr',
    !roh.includes('.zaehler.tee{') && !roh.includes('.zaehler.beides{')]
  ];
  /* Jedes Motiv braucht seine Datei — ohne diese Pruefung faende man
     eine vergessene erst als leeren Rahmen auf dem Telefon. */
  {
    const ordner = require('path').dirname(DATEI);
    const anz = +(roh.match(/const AVATARE = (\d+);/) || [])[1];
    const fehlen = [];
    for(let i = 1; i <= anz; i++)
      if(!fs.existsSync(require('path').join(ordner, 'av-' + i + '.webp'))) fehlen.push(i);
    E.push({ n: 'Zu jedem Motiv liegt eine Datei',
             ok: anz > 0 && fehlen.length === 0,
             z: fehlen.length ? 'es fehlen ' + fehlen.join(',') : '' });
    const png = fs.readdirSync(ordner).filter(f => /^av-\d+\.png$/.test(f));
    E.push({ n: 'Und kein altes PNG mehr daneben', ok: png.length === 0, z: png.join(',') });
  }
  /* Manche Pruefungen sind ein Muster, manche schon ein Ja/Nein. */
  css.forEach(([n, re]) => {
    const gut = (typeof re === 'boolean') ? re : re.test(roh);
    E.push({ n, ok: gut, z: gut ? '' : 'Regel fehlt' });
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
}, 1400);
