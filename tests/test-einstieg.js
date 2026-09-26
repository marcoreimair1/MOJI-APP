/* Testlauf: Einstieg und Funnel.

   Geprueft wird der Weg von der ersten Sekunde bis zum Kalender:
   Startbildschirm, die zwei Blaetter fuer Adresse und Code, die
   Sperre von 60 Sekunden beim erneuten Senden und die vier Schritte
   des Funnels samt Schaltern und Dienstplanfrage.

   Ohne ?desktop=1 — dann ist AM_HANDY false, boot() kehrt sofort
   zurueck und es wird nichts aus der Cloud geladen.                  */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const HTML = fs.readFileSync(DATEI, 'utf8');

const vc = new VirtualConsole();          /* Rauschen aus: canvas, video, CDN */
vc.on('jsdomError', () => {});
vc.on('error', () => {});
vc.on('warn', () => {});

const dom = new JSDOM(HTML, {
  url: 'https://moji-app.at/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(name, bedingung, zusatz){
  window.__E.push({ name: name, ok: !!bedingung, zusatz: zusatz === undefined ? '' : String(zusatz) });
}
const el = id => document.getElementById(id);

/* ── 0 · Sicherheit ── */
ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* ── 1 · Der Startbildschirm steht im Markup ── */
ok('Einstieg vorhanden',            !!el('lg-start'));
ok('Fassungsschalter vorhanden',    !!el('lg-fassung'));
ok('Sonne und Mond liegen darin',   !!document.querySelector('#lg-fassung .fa-sonne')
                                 && !!document.querySelector('#lg-fassung .fa-mond'));
ok('Face-ID-Knopf vorhanden',       !!el('ein-pk'));
ok('Anmelden oder registrieren',    !!el('ein-mail'));
ok('Blatt fuer die Adresse',        !!el('lg-mailstep'));
ok('Blatt fuer den Code',           !!el('lg-codestep'));

/* Was weg ist, muss weg bleiben — sonst kommt die alte Werbeseite zurueck. */
ok('Keine Musterbilder mehr',       document.querySelectorAll('.wfeat').length === 0);
ok('Kein Weichenbalken mehr',       !el('lg-bar'));
ok('Kein Kartenkarussell mehr',     !el('feat-track'));
ok('Keine A4-Vorschau mehr',        !el('pdfprev'));
ok('Kein Haekchen-Kaestchen mehr',  !el('mailok'));
ok('Keine Arbeitsort-Seite mehr',   !el('go-ort'));

/* ── 2 · loginScreen mit Cloud zeigt den Einstieg ── */
CLOUD_ON = true; PASSKEY = true;
loginScreen();
ok('Einstieg ist an',        el('lg-start').classList.contains('on'));
ok('Oertlicher Weg ist aus', el('lg-local').style.display === 'none', el('lg-local').style.display);
ok('Face ID wird gezeigt',   el('ein-pk').style.display === 'flex', el('ein-pk').style.display);
ok('Ohne Kopfleiste',        document.body.classList.contains('nobar'));

/* Ohne Passkey-Unterstuetzung bleibt der Knopf weg */
PASSKEY = false; loginScreen();
ok('Ohne Passkey kein Face ID', el('ein-pk').style.display === 'none', el('ein-pk').style.display);
PASSKEY = true;

/* ── 3 · Ohne Cloud der oertliche Weg, mit Kopfleiste ── */
CLOUD_ON = false; loginScreen();
ok('Ohne Cloud: Einstieg aus',   !el('lg-start').classList.contains('on'));
ok('Ohne Cloud: oertlich an',    el('lg-local').style.display === 'block');
ok('Ohne Cloud: Kopfleiste da',  !document.body.classList.contains('nobar'));
CLOUD_ON = true; loginScreen();

/* ── 4 · Die Blaetter gehen auf und zu ── */
blattAuf('lg-mailstep');
ok('Blatt Adresse offen',   el('lg-mailstep').classList.contains('on'));
ok('Seite ist gesperrt',    document.body.classList.contains('locked'));
ok('Der Einstieg tritt zurueck', document.body.classList.contains('blattoffen'));
/* Zugehen laeuft ueber eine Bewegung — direkt danach steht es noch da
   und traegt den Vermerk dafuer. */
blattZu('lg-mailstep');
ok('Es geht nicht ruckartig zu', el('lg-mailstep').classList.contains('raus')
   && el('lg-mailstep').classList.contains('on'));
blattZu('lg-mailstep', true);
ok('Blatt Adresse zu',      !el('lg-mailstep').classList.contains('on'));
ok('Sperre wieder weg',     !document.body.classList.contains('locked'));
ok('Und der Einstieg steht wieder', !document.body.classList.contains('blattoffen'));

/* ── 5 · Adresse pruefen, bevor irgendetwas rausgeht ── */
let gesendet = 0, letzteAdresse = '';
sb = { auth: { signInWithOtp: async o => { gesendet++; letzteAdresse = o.email; return { data:{}, error:null }; } } };
blattAuf('lg-mailstep');
el('lg-mail').value = 'keine-adresse';
el('lg-mail').dispatchEvent(new Event('input'));
ok('Weiter bleibt gesperrt', el('lg-send').disabled === true);
weiterZumCode();
ok('Nichts verschickt',      gesendet === 0, gesendet);
ok('Fehler steht da',        el('lg-err2').classList.contains('da'));
ok('Blatt Code bleibt zu',   !el('lg-codestep').classList.contains('on'));

el('lg-mail').value = 'anna@example.org';
el('lg-mail').dispatchEvent(new Event('input'));
ok('Weiter wird frei',       el('lg-send').disabled === false);

/* ── 6 · Der Uebergang steht sofort, die Mail geht daneben raus ── */
weiterZumCode();
ok('Blatt Code offen',       el('lg-codestep').classList.contains('on'));
ok('Blatt Adresse zu',       !el('lg-mailstep').classList.contains('on'));
/* Die Karte wird nicht neu aufgezogen — nur der Inhalt blaettert weiter. */
ok('Es blaettert, statt neu aufzuziehen', el('lg-codestep').classList.contains('weiter'));
ok('Und zwar nach vorn',     !el('lg-codestep').classList.contains('rueck'));
ok('Adresse steht im Text',  el('lg-sent-t').textContent === 'anna@example.org', el('lg-sent-t').textContent);
/* Seit 15.09.2026: der Hinweis auf den Spam-Ordner. Mails von einem
   neuen Absender landen dort oft beim ersten Mal, und wer das nicht
   weiss, haelt die Anmeldung fuer kaputt. */
ok('Der Spam-Ordner wird erwaehnt',
   !!el('lg-spam') && el('lg-spam').textContent.indexOf('Spam-Ordner') > -1,
   el('lg-spam') && el('lg-spam').textContent.trim().slice(0, 40));
/* Zwischen Eingabe und „erneut senden": davor waere er Beiwerk, danach
   fande ihn niemand mehr. */
ok('Und zwar vor dem erneuten Senden',
   el('lg-spam').nextElementSibling === el('lg-again')
   && el('lg-spam').previousElementSibling === el('lg-otp-go'),
   el('lg-spam').nextElementSibling && el('lg-spam').nextElementSibling.id);
ok('Code-Feld hat den Fokus', document.activeElement === el('lg-otp'),
   document.activeElement && document.activeElement.id);

/* ── 7 · Sechzig Sekunden Ruhe ── */
ok('Erneut senden gesperrt',  el('lg-again').disabled === true);
ok('Sekunden stehen im Knopf', /Erneut senden in \\d+ s/.test(el('lg-again').textContent),
   el('lg-again').textContent);
ok('Sperre liegt bei rund 60 s', /in (59|60) s/.test(el('lg-again').textContent),
   el('lg-again').textContent);
el('lg-again').click();
ok('Gesperrter Knopf schickt nichts', gesendet === 1, gesendet);
cooldownStopp();
ok('Nach Ablauf wieder frei',  el('lg-again').disabled === false);
ok('Und traegt wieder den Text', el('lg-again').textContent === 'E-Mail erneut senden',
   el('lg-again').textContent);
el('lg-again').click();
ok('Dann geht die zweite Mail', gesendet === 2, gesendet);
ok('An dieselbe Adresse',       letzteAdresse === 'anna@example.org', letzteAdresse);
blattAllesZu();

/* ── 8 · Der Funnel hat vier Schritte ── */
ok('STEPS ist 4', STEPS === 4, STEPS);
UID = 'uTest'; MAIL = 'anna@example.org';
obInit();
ok('Startet bei 1',        el('ob-step').textContent === 'Schritt 1 von 4', el('ob-step').textContent);
ok('Balken auf 25 %',      el('ob-bar').style.width === '25%', el('ob-bar').style.width);
ok('Zurueck ist versteckt', el('ob-back').classList.contains('hide'));
ok('Kein Weiter-Knopf beim Namen', el('ob-nav').classList.contains('hide'));

el('in-vn').value = 'Anna'; el('in-vn').dispatchEvent(new Event('input'));
el('in-nn').value = 'Muster'; el('in-nn').dispatchEvent(new Event('input'));
ok('Name ist vollstaendig', stepValid(0) === true);
el('go-name').click();
ok('Jetzt Schritt 2',      el('ob-step').textContent === 'Schritt 2 von 4', el('ob-step').textContent);
ok('Balken auf 50 %',      el('ob-bar').style.width === '50%', el('ob-bar').style.width);
ok('Zurueck ist sichtbar', !el('ob-back').classList.contains('hide'));

const d = document.querySelectorAll('[data-dob="ob"] input');
d[0].value = '14'; d[1].value = '03'; d[2].value = '1994';
ok('Geburtsdatum gilt', stepValid(1) === true);

/* ── 9 · Die zwei Schalter ── */
obGo(2);
ok('Schritt 3 steht',        el('ob-step').textContent === 'Schritt 3 von 4', el('ob-step').textContent);
ok('Beide Schalter moeglich', obSchalterAnzahl() === 2, obSchalterAnzahl());
ok('Ueberschrift passt',     el('ob-sw-h').textContent === 'Zwei Schalter', el('ob-sw-h').textContent);
ok('Erinnerung steht auf aus', el('sw-mail').getAttribute('aria-pressed') === 'false');
ok('Weiter-Knopf ist da',    !el('ob-nav').classList.contains('hide'));
el('sw-mail').click();
ok('Erinnerung an',          OB.mailOk === true);
ok('Regler zeigt an',        el('sw-mail').getAttribute('aria-pressed') === 'true');
ok('Adresse steht darunter', el('sw-mail-s').textContent.indexOf('anna@example.org') > -1,
   el('sw-mail-s').textContent);
ok('Einer allein reicht nicht', obSchalterFertig() === false);
PK_LISTE = [{ id:'k1' }]; OB.pkOk = true; obSchalterMalen();
ok('Face ID zeigt an',       el('sw-pk').getAttribute('aria-pressed') === 'true');
ok('Jetzt sind beide gesetzt', obSchalterFertig() === true);

/* Ohne Konto und ohne Passkey faellt der Schritt weg */
const merkCloud = CLOUD_ON, merkPk = PASSKEY, merkUid = UID, merkMail = MAIL;
CLOUD_ON = false; PASSKEY = false; UID = null; MAIL = '';
obGo(1); obGo(2);
ok('Leerer Schalterschritt wird uebersprungen',
   el('ob-step').textContent === 'Schritt 4 von 4', el('ob-step').textContent);
CLOUD_ON = merkCloud; PASSKEY = merkPk; UID = merkUid; MAIL = merkMail;

/* ── 10 · Die Dienstplanfrage ── */
obGo(3);
ok('Schritt 4 steht',         el('ob-step').textContent === 'Schritt 4 von 4', el('ob-step').textContent);
ok('Balken ist voll',         el('ob-bar').style.width === '100%', el('ob-bar').style.width);
ok('Frage ist sichtbar',      el('ob-plan-frage').style.display !== 'none');
ok('Kein Weiter bei der Frage', el('ob-nav').classList.contains('hide'));
ok('Dauer steht an der Frage', /circa 2 Minuten/.test(el('ob-plan-frage').textContent),
   el('ob-plan-frage').textContent.replace(/\s+/g,' ').trim());

/* ── 11 · Spaeter heisst: mit der Vorgabe weiter ── */
ok('Vorgabe traegt Stunden', weekTotal(OB.sched, 0) > 0, weekTotal(OB.sched, 0));
ok('Der Schritt gilt immer',  stepValid(3) === true);

/* ── 11b · Der Zeit-Assistent ──
   Getippt wird nicht: jede Blase wird mit zaDurchtippen() sofort
   fertiggestellt, so wie ein Tipp darauf es auch tut. */
const durch = () => { for(let i = 0; i < 12; i++) zaDurchtippen(); };
zaStart();
ok('Der Assistent steht',     el('v-zeitassi').classList.contains('on'));
ok('MOJI steht in der Mitte', el('za-moji').classList.contains('mitte'));
ok('Er traegt das Maennchen', (el('za-bild').getAttribute('src')||'').indexOf('data:image/webp') === 0);
ok('Alle Tage fangen frei an',
   WORKDAYS.every(d => !ZA.sched.weeks[0][d].vmOn && !ZA.sched.weeks[0][d].nmOn));
/* Beim Gruss ist noch nichts geschehen — also weder Zaehlung noch Balken. */
ok('Kopf und Balken ruhen noch', el('v-zeitassi').classList.contains('ohnekopf'));
ok('Und die Gruppe steht mittig', el('v-zeitassi').classList.contains('mitte'));
ok('Das weiter steht nicht in der Blase', !el('za-blase').contains(el('za-mehr')));
ok('Ein Kreuz fuehrt jederzeit hinaus', !!el('za-zu'));
/* Solange getippt wird, wippt MOJI mit — und der erste Satz bekommt
   gleich einen Akzent dazu. */
const huelle = () => document.querySelector('#v-zeitassi .za-bild');
ok('MOJI wippt, waehrend er redet', huelle().classList.contains('spricht'),
   huelle().className);
ok('Der erste Satz bekommt einen Akzent', huelle().classList.contains('nickt'),
   huelle().className);
zaDurchtippen();                       /* nur der erste Satz */
ok('Ist der Satz fertig, hoert das Wippen auf', !huelle().classList.contains('spricht'),
   huelle().className);
ok('Der Name steht im Gruss', el('za-text').textContent.indexOf('Anna') > -1, el('za-text').textContent);
ok('Und es kommt noch mehr',  !el('za-mehr').hidden);
/* Punkte am Ende zeigen, dass der Satz weitergeht. */
ok('Der Satz endet auf Punkte', /…$/.test(el('za-text').textContent.trim()),
   el('za-text').textContent);
zaDurchtippen();
ok('Und der naechste faengt damit an', /^…/.test(el('za-text').textContent.trim()),
   el('za-text').textContent);
/* Der Akzent kommt nicht bei jedem Satz — sonst waere er eine Marotte. */
ok('Der zweite Satz bleibt ruhig',
   !huelle().classList.contains('nickt') && !huelle().classList.contains('huepft'),
   huelle().className);
ok('Gewippt wird aber wieder', huelle().classList.contains('spricht'), huelle().className);
durch();
ok('Zwei Wege stehen bereit', !!document.querySelector('[data-za="los"]')
                           && !!document.querySelector('[data-za="spaeter"]'));

/* Abbruch: MOJI wird traurig, und es braucht noch einen Tipp zur App. */
document.querySelector('[data-za="spaeter"]').click();
durch();
ok('Abbruch fuehrt nicht sofort weiter', ZA.schritt === 'abbruch');
ok('Und nennt das Profilmenue', el('za-text').textContent.indexOf('Profilmen') > -1,
   el('za-text').textContent);
ok('Ein Knopf fuehrt in die App', !!document.querySelector('[data-za="fertigab"]'));

/* Der andere Weg: Wochen, Tage, dann Tag fuer Tag. */
zaStart(); durch();
document.querySelector('[data-za="los"]').click(); durch();
ok('Jetzt die Wochenfrage',   ZA.schritt === 'wochen');
ok('Jetzt zaehlt der Kopf mit', !el('v-zeitassi').classList.contains('ohnekopf'));
ok('Oben steht nur Zurueck',   el('za-back').textContent.trim() === 'Zurück',
   el('za-back').textContent.trim());
ok('Und sonst nichts',         !document.getElementById('za-schritt'));
ok('MOJI rueckt nach oben',   el('za-moji').classList.contains('oben'));
ok('Vier Intervalle zur Wahl', document.querySelectorAll('[data-wc]').length === 4);
ok('Eine Zeile sagt, was zu tun ist',
   (el('za-inhalt').querySelector('.za-vor') || {}).textContent === 'W\u00e4hle aus, in welchem Wochen-Intervall du arbeitest:',
   (el('za-inhalt').querySelector('.za-vor') || {}).textContent);
ok('Die Zeile steht vor den Kn\u00f6pfen',
   el('za-inhalt').firstElementChild && el('za-inhalt').firstElementChild.classList.contains('za-vor'),
   el('za-inhalt').firstElementChild && el('za-inhalt').firstElementChild.className);
/* Wer mit „Wochenintervall" nichts anfangen kann, bekommt Beispiele —
   aber erst auf Nachfrage. */
const hk = el('za-hilfe');
ok('Ein Knopf bietet Hilfe an', !!hk && hk.querySelector('span').textContent
   === 'Ich brauche Hilfe bei dieser Frage',
   hk && hk.querySelector('span').textContent);
ok('Er steht unter den Kacheln',
   el('za-inhalt').children[2] === hk, el('za-inhalt').children[2].className);
ok('Die Beispiele liegen erst weg', el('za-hilfebox').hidden);
hk.click();
ok('Ein Tipp klappt sie auf',   !el('za-hilfebox').hidden
   && hk.getAttribute('aria-expanded') === 'true');
ok('Vier Beispiele, eines je Zahl',
   document.querySelectorAll('#za-hilfebox .zah').length === 4,
   document.querySelectorAll('#za-hilfebox .zah').length);
ok('Jedes nennt seinen Rhythmus',
   document.querySelector('#za-hilfebox .zah b').textContent.indexOf('1-Wochen-Rhythmus') === 0,
   document.querySelector('#za-hilfebox .zah b').textContent);
ok('Und die Wiederholung dazu',
   document.querySelectorAll('#za-hilfebox .zah-wdh').length === 4);
ok('Der Monatszyklus zeigt vier Wochen',
   document.querySelectorAll('#za-hilfebox .zah')[3].querySelectorAll('li').length === 4,
   document.querySelectorAll('#za-hilfebox .zah')[3].querySelectorAll('li').length);
ok('Der Knopf bietet jetzt das Gegenteil an',
   hk.querySelector('span').textContent === 'Beispiele wieder ausblenden',
   hk.querySelector('span').textContent);
hk.click();
ok('Und klappt wieder zu',      el('za-hilfebox').hidden
   && hk.getAttribute('aria-expanded') === 'false');
ok('Hilfe waehlt nichts aus',   ZA.wc === 1, ZA.wc);

document.querySelector('[data-wc="2"]').click();
ok('Zwei Wochen gemerkt',     ZA.wc === 2, ZA.wc);

/* ── 11c · Die Raeder ── */
ok('Das Rad kennt den Viertelstundentakt', ZA_ZEITEN.length === 80
   && ZA_ZEITEN[0] === '04:00' && ZA_ZEITEN[79] === '23:45',
   ZA_ZEITEN.length + ' ' + ZA_ZEITEN[0] + '…' + ZA_ZEITEN[79]);
ok('Krumme Zeiten rasten ein', ZA_ZEITEN[zaNaechste('08:07')] === '08:00',
   ZA_ZEITEN[zaNaechste('08:07')]);

/* ── 11c1 · Ein ausgeschalteter Abschnitt und seine Zeiten ──
   Das Rad in einem ausgeblendeten Abschnitt hat keinen Kasten und steht
   damit auf Null — und Null ist 04:00. Wer den Nachmittag am naechsten
   Tag wieder einschaltete, sah genau das. */
const probe = { vmOn:true, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
const kasten = zeitBlock(probe, () => {});
document.body.appendChild(kasten);
ok('Das Rad laesst sich neu richten', typeof kasten.querySelector('.rad')._neu === 'function');
kasten.querySelector('.za-seg[data-seg="nm"] .za-seg-kopf').click();
ok('Einschalten holt die alte Zeit zurueck',
   probe.nmFrom === '13:00' && probe.nmTo === '17:00', probe.nmFrom + '–' + probe.nmTo);
ok('Und nicht den ersten Radeintrag', probe.nmFrom !== ZA_ZEITEN[0], probe.nmFrom);
kasten.remove();

const leer = { vmOn:true, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'', nmTo:'' };
const kasten2 = zeitBlock(leer, () => {});
document.body.appendChild(kasten2);
/* Blosses Ansehen darf nichts schreiben — sonst gaelte im Profilmenue
   schon das Aufklappen als Aenderung. */
ok('Ansehen allein schreibt nichts', leer.nmFrom === '', leer.nmFrom);
kasten2.querySelector('.za-seg[data-seg="nm"] .za-seg-kopf').click();
ok('Erst das Einschalten setzt die Vorgabe',
   leer.nmFrom === '13:00' && leer.nmTo === '17:00', leer.nmFrom + '–' + leer.nmTo);
kasten2.remove();

/* ── 11c2 · Das Kreuz fragt nach, statt sofort zu gehen ── */
el('za-zu').click();
ok('Die Rueckfrage kommt',    el('zabar').classList.contains('on'));
ok('Und nennt den Verlust',   /Fortschritt geht verloren/.test(el('zabar').textContent));
document.querySelector('#zabar [data-zazu]').click();
ok('Weitermachen laesst alles stehen', ZA.schritt === 'wochen');

/* ── 11d · Einmal ganz durch, mit zwei Wochen ──
   Der Sprung nach der Wochenwahl laeuft ueber eine kurze Pause, damit
   man die Auswahl noch sieht — hier wird direkt weitergeschaltet. */
ZA.wc = 2; zaTageFrage(); durch();
[1,2,3].forEach(d => document.querySelector('[data-tag="' + d + '"]').click());
ok('Drei Tage gemerkt',       ZA.tage[0].join(',') === '1,2,3', ZA.tage[0].join(','));
document.querySelector('[data-za="tageok"]').click(); durch();
ok('Es beginnt bei Montag',   ZA.tage[0][ZA.idx] === 1);
ok('Vier Raeder stehen da',   document.querySelectorAll('#za-inhalt .rad').length === 4,
   document.querySelectorAll('#za-inhalt .rad').length);
ok('Mit einem Vorschlag drin', ZA.sched.weeks[0][1].vmOn === true);
ok('Und zwar mit der Vorgabe',  ZA.sched.weeks[0][1].vmFrom === '08:00'
   && ZA.sched.weeks[0][1].nmTo === '17:00',
   ZA.sched.weeks[0][1].vmFrom + '–' + ZA.sched.weeks[0][1].nmTo);
ok('Die Stunden stehen an der Kachel',
   document.querySelector('[data-std="vm"]').textContent === '4,00 h',
   document.querySelector('[data-std="vm"]').textContent);
ok('Die Summe kommt ohne Emoji aus',
   /^8,00 h Arbeitszeit/.test(el('za-summe').textContent)
   && el('za-summe').textContent.indexOf('Pause') > -1,
   el('za-summe').textContent);
/* Der naechste Tag uebernimmt, was beim Tag davor steht. */
ZA.sched.weeks[0][1].vmFrom = '06:00';
document.querySelector('[data-za="tagok"]').click(); durch();
ok('Der naechste Tag uebernimmt', ZA.sched.weeks[0][2].vmFrom === '06:00',
   ZA.sched.weeks[0][2].vmFrom);
for(let i = 0; i < 2; i++){ document.querySelector('[data-za="tagok"]').click(); durch(); }
ok('Danach Woche 2',          ZA.wi === 1 && ZA.schritt === 'tage', ZA.schritt + ' w' + ZA.wi);
document.querySelector('[data-tag="1"]').click();
document.querySelector('[data-za="tageok"]').click(); durch();
/* Eine neue Woche faengt wieder bei der Vorgabe an, nicht bei den
   Zeiten aus Woche 1 — die sind dort ja gerade anders. */
ok('Woche 2 faengt bei der Vorgabe an', ZA.sched.weeks[1][1].vmFrom === '08:00',
   ZA.sched.weeks[1][1].vmFrom);
ok('Woche 2 darf uebernehmen', document.querySelectorAll('[data-kopie]').length === 1);
ZA.sched.weeks[0][1].vmFrom = '07:30';
document.querySelector('[data-kopie="0"]').click();
ok('Und uebernimmt wirklich', ZA.sched.weeks[1][1].vmFrom === '07:30',
   ZA.sched.weeks[1][1].vmFrom);
document.querySelector('[data-za="tagok"]').click(); durch();
ok('Am Schluss steht MOJI mittig', ZA.schritt === 'fertig'
   && el('za-moji').classList.contains('mitte'), ZA.schritt);
ok('Der Balken ist voll',     el('za-bar').style.width === '100%', el('za-bar').style.width);
ok('Kein Zurueck mehr',       el('za-back').classList.contains('hide'));
ok('Und am Ende steht oben nichts', el('v-zeitassi').classList.contains('ohnekopf'));

/* ── 11e · Was am Ende im Plan steht ── */
ok('Das Intervall steht',     OB.sched.weekCount === 2, OB.sched.weekCount);
ok('Woche 1 traegt drei Tage', [1,2,3].every(d => OB.sched.weeks[0][d].vmOn)
   && !OB.sched.weeks[0][4].vmOn && !OB.sched.weeks[0][4].nmOn);
ok('Woche 2 traegt einen',    OB.sched.weeks[1][1].vmOn && !OB.sched.weeks[1][2].vmOn);
ok('Und Sonntag kommt nicht vor', OB.sched.weeks[0][0] === undefined);
/* Montag steht auf 07:30–12:00 und 13:00–17:00 (8,5 h), Dienstag und
   Mittwoch haben 06:00 uebernommen (je 10 h) — zusammen 28,5. */
ok('Die Stunden rechnen sich', weekTotal(OB.sched, 0) === 28.5, weekTotal(OB.sched, 0));
ok('Die Vorgabe endet um 17 Uhr', defaultWeek()[1].nmTo === '17:00', defaultWeek()[1].nmTo);


/* ── 12 · Der Schluss hat eine eigene Fassung des Grusses ── */
ok('GRUSS kennt fertig',      !!GRUSS.fertig);
/* Seit 26.09.2026 feiert das Ende mit Licht statt Konfetti. */
ok('Fertig feiert ohne Konfetti', !GRUSS.fertig.konfetti);
ok('Und mit zwei Lichtwellen',
   document.querySelectorAll('#hallo .hallo-rahmen > .hallo-welle').length === 2);
ok('Der Abschied laesst sich Zeit zum Lesen', GRUSS.ab.dauer >= 2400, GRUSS.ab.dauer);
ok('Reif liegt um das Profilbild',
   !!document.querySelector('#hallo .hallo-rahmen .hallo-ring .rg'));
/* Das Profilbild bleibt ein weiches Viereck wie ueberall sonst; der Reif
   nimmt seine Form an, statt es rund zu machen. */
ok('Der Reif ist ein weiches Viereck',
   document.querySelector('#hallo .hallo-ring .rg').tagName.toLowerCase() === 'rect',
   document.querySelector('#hallo .hallo-ring .rg').tagName);
ok('Mit derselben Ecke wie das Bild',
   document.querySelector('#hallo .hallo-ring .rg').getAttribute('rx') === '31');
ok('Der Haken steht daneben',  !!document.querySelector('#hallo .hallo-haken svg'));
/* Der Gruss braucht jemanden zum Gruessen — sonst kehrt er sofort um. */
ME = normalize({ id:'pGruss', vorname:'Anna', nachname:'Muster', dob:'1994-03-14' });
zeigeGruss('fertig');
ok('Buehne traegt fertig',    el('hallo').classList.contains('fertig'));
ok('Name steht im Gruss',     el('hallo-t').textContent.indexOf('Anna') > -1, el('hallo-t').textContent);
ok('Und zwar freundlich',     el('hallo-t').textContent.indexOf('Hi ') === 0, el('hallo-t').textContent);
ok('Darunter das Willkommen', el('hallo-s').textContent === 'Willkommen bei MOJI.', el('hallo-s').textContent);
/* Das zugeteilte Profilbild ist der Grund fuer diese Buehne — es muss zu sehen sein. */
ok('Profilbild ist gesetzt',  (el('hallo-img').getAttribute('src') || '').indexOf('av-') === 0,
   el('hallo-img').getAttribute('src'));
ok('Und wird nicht versteckt', document.querySelector('#hallo .hallo-rahmen') !== null
   && el('hallo').classList.contains('fertig'));
/* Seit 26.09.2026 setzt sich der Name Zeichen fuer Zeichen zusammen. */
var hz = el('hallo-t').querySelectorAll('.hz');
ok('Der Name steht Zeichen fuer Zeichen', hz.length === 'HiAnna!'.length, hz.length);
ok('Jedes Zeichen kennt seinen Platz',
   hz.length > 0 && hz[hz.length - 1].style.getPropertyValue('--i') === String(hz.length - 1),
   hz.length ? hz[hz.length - 1].style.getPropertyValue('--i') : '-');
ok('Die Leerzeichen bleiben stehen', el('hallo-t').textContent === 'Hi Anna!', el('hallo-t').textContent);
ok('Der Name bleibt in einer Huelle beisammen',
   !!el('hallo-t').querySelector('i .hw') && el('hallo-t').querySelector('i .hw').textContent === 'Anna');
ok('Die Farbflaeche ist eine eigene Lage', !!document.querySelector('#hallo > .hallo-grund.aurahg'));
ok('Die Buehne selbst traegt sie nicht mehr', !el('hallo').classList.contains('aurahg'));
ok('Das Licht liegt hinter dem Bild', !!document.querySelector('#hallo .hallo-rahmen > .hallo-licht'));
ok('Der Lichtstreif hat Kopf und Schweif',
   document.querySelectorAll('#hallo .hallo-komet rect').length === 4);
/* Der Lichtstaub ist am 26.09.2026 wieder rausgeflogen — die violetten
   Punkte passten nicht zur Flaeche. Dafuer ziehen grosse Lichter im Grund. */
ok('Kein Lichtstaub mehr', !el('hstaub') && typeof window.halloStaub === 'undefined');
/* Ohne Leiste darunter kein Flug — dann blendet alles gemeinsam aus. */
ok('Ohne sichtbare Leiste gibt es kein Ziel', halloZiel() === null);
grussEnde();
ok('Dann tritt der Gruss wie bisher ab', el('hallo').classList.contains('weg'));
ok('Und fliegt nicht', !el('hallo').classList.contains('fliegt'));

/* ── 13 · Das Profil kommt aus dem Funnel ── */
ME = null; _funnelId = null; OB.mailOk = true;
const p = sichereProfil();
ok('Profil angelegt',      !!p && p.vorname === 'Anna' && p.nachname === 'Muster');
ok('Geburtsdatum steht',   !!p && p.dob === '1994-03-14', p && p.dob);
ok('Arbeitsort gesetzt',   !!p && p.ort === EMPLOYER, p && p.ort);
ok('Erinnerung uebernommen', !!p && p.mailOk === true, p && p.mailOk);
ok('Gefragt wurde',        !!p && p.mailGefragt === true, p && p.mailGefragt);

/* ── 14 · Die Fassung wird beim ersten Profil uebernommen ── */
sessionStorage.setItem('moji.fassung.wahl', 'dark');
ME.erscheinung = 'light';
erscheinungAusProfil();
ok('Wahl vom Einstieg gilt', ME.erscheinung === 'dark', ME.erscheinung);
ok('Vermerk ist verbraucht', sessionStorage.getItem('moji.fassung.wahl') === null);
ok('Seite ist dunkel',       document.documentElement.dataset.theme === 'dark',
   document.documentElement.dataset.theme);
erscheinungAusProfil();
ok('Ohne Vermerk bleibt das Profil massgeblich', ME.erscheinung === 'dark');

/* ── 15 · Der Schriftzug, der sich selbst schreibt ── */
ok('Logo liegt in der Zeile',   !!document.querySelector('#ein-h #ms-logo img'));
/* In der Zeile steht nur noch, was die Schleife hineinschreibt. */
/* Nicht gegen document.body pruefen: dort steht dieses Skript selbst mit drin. */
ok('Kein fester Text mehr', el('v-login').innerHTML.indexOf('Los ' + 'geht') < 0);
ok('Die Zeile traegt einen Namen fuer Vorleseprogramme',
   document.getElementById('ein-h').getAttribute('aria-label') === 'MOJI');
ok('Zwei Woerter in der Schleife', MS_WOERTER.length === 2 && MS_WOERTER[0] === 'MOJI'
   && MS_WOERTER[1] === '文字', MS_WOERTER.join(' '));
const kinder = msBau('MOJI');
ok('Vier Buchstaben gebaut',    kinder.length === 4, kinder.length);
ok('Sie fangen geschlossen an', kinder.every(i => i.style.width === '0px'));
ok('Und tragen ihre Breite',    kinder.every(i => i.dataset.w !== undefined));
const jp = msBau('文字');
ok('Japanisch bekommt die Ersatzschrift', jp.every(i => i.className.indexOf('cjk') > -1),
   jp.map(i => i.className).join('|'));
ok('Klopfen bricht nichts',     (msKlopf(), true));
ok('Geklopft wird nur am Anfang', MS_KLOPF_RUNDEN === 2, MS_KLOPF_RUNDEN);
ok('Das Maennchen wackelt',     (msWackeln(), document.getElementById('ms-logo').classList.contains('wackelt')));
ok('Ohne Einstieg keine Schleife', (msStop(), _msAus === true));

/* ── 16 · Hinunterschieben zum Schliessen ── */
ok('Griff im Adressblatt', !!document.querySelector('#lg-mailstep .sheet-grab .grip'));
ok('Griff im Codeblatt',   !!document.querySelector('#lg-codestep .sheet-grab .grip'));
ok('Zug am Adressblatt verdrahtet', typeof window.__mailReset === 'function');
ok('Zug am Codeblatt verdrahtet',   typeof window.__codeReset === 'function');

/* ── 17 · Das Maennchen steht auch ueber den Blaettern ── */
CLOUD_ON = true; loginScreen();
const marken = Array.from(document.querySelectorAll('.blatt-mark img'));
ok('Beide Blaetter tragen das Bild', marken.length === 2
   && marken.every(i => (i.getAttribute('src') || '').indexOf('data:image/webp') === 0),
   marken.length);

/* ── 18 · Face ID nachtraeglich einrichten ──
   Die Frage nach dem Code-Login. Sie trug bis 14.09.2026 noch das alte
   Seitengeruest und das Wort "Passkey". */
const fid = el('v-pkask');
ok('Die Frage steht im neuen Geruest', !!fid.querySelector('.fid') && !!fid.querySelector('.einbox'),
   fid.firstElementChild && fid.firstElementChild.className);
ok('Und heisst Face ID', fid.querySelector('.fid-h').textContent === 'Face ID jetzt einrichten',
   fid.querySelector('.fid-h').textContent);
ok('Das Wort Passkey kommt nicht mehr vor', fid.textContent.indexOf('Passkey') === -1,
   fid.textContent.trim().slice(0, 60));
ok('Zwei Knoepfe im Kasten',
   fid.querySelector('.einbox #pk-ask-go.einb.prim') && fid.querySelector('.einbox #pk-ask-skip.einb.zweit'));
ok('Kein Textlink mehr', !fid.querySelector('.linkbtn'));
ok('Und keine Merkzeilen mehr', !fid.querySelector('.pkrow'));
/* Sie gehoert der ganzen Flaeche, wie Einstieg und Funnel — sonst
   stuende der Kasten unten halb ausserhalb des Schirms. */
go('v-pkask');
ok('Ohne Kopfleiste', document.body.classList.contains('nobar'), document.body.className);

/* ── 17b · Die Frage nach Face ID kommt nur bei sicherem Stand ──
   Ein gescheiterter Abruf sah fuer diese Abfrage bis 14.09.2026 aus wie
   ein leeres Konto. Wer dann einrichtete, obwohl laengst ein Passkey da
   war, verlor ihn — pkAdd() raeumte damals erst alles ab. Asynchron,
   weil askPasskey() bei unbekanntem Stand erst nachsieht. */
(async function(){
  PASSKEY = true; UID = 'u-test';
  try{ localStorage.removeItem('maru.pkask.' + UID); }catch(e){}

  let weiter = 0;
  PK_LISTE = null; go('v-cal');
  await askPasskey(() => { weiter++; });
  ok('Unbekannter Stand fragt nicht', weiter === 1
     && !el('v-pkask').classList.contains('on'),
     'weiter=' + weiter + ' liste=' + PK_LISTE);

  weiter = 0; PK_LISTE = [];
  await askPasskey(() => { weiter++; });
  ok('Leeres Konto wird gefragt', weiter === 0
     && el('v-pkask').classList.contains('on'), 'weiter=' + weiter);

  weiter = 0; PK_LISTE = [{ id:'p1' }]; go('v-cal');
  await askPasskey(() => { weiter++; });
  ok('Mit Passkey wird nicht gefragt', weiter === 1
     && !el('v-pkask').classList.contains('on'), 'weiter=' + weiter);

  PK_LISTE = null; PASSKEY = false; UID = null;
  window.__FERTIG = true;
})();
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

/* Der letzte Abschnitt laeuft asynchron — erst abwarten, dann auswerten.
   Ohne das stuenden die letzten Pruefungen gar nicht in der Liste. */
(async function(){
  const bis = Date.now() + 8000;
  while (!dom.window.__FERTIG && Date.now() < bis) {
    await new Promise(r => setTimeout(r, 40));
  }

/* ── 18 · Was sich in jsdom nicht messen laesst ──
   Ohne Layout ist jede Hoehe 0 und requestAnimationFrame zeichnet
   nichts. Diese Punkte werden darum am Quelltext geprueft. */
const E = dom.window.__E || [];
const roh = (name, bedingung, zusatz) =>
  E.push({ name: name, ok: !!bedingung, zusatz: zusatz === undefined ? '' : String(zusatz) });
roh('Die Blase bekommt eine weiche Hoehe', /\.za-blase\{[^}]*transition:height/.test(HTML));
roh('Die Hoehe wird vor dem Tippen gesetzt',
    HTML.indexOf("blase.style.height = ziel + 'px'") > -1);
roh('Getippt wird im Bildtakt', /_zaTippT = requestAnimationFrame\(schritt\)/.test(HTML));
roh('Und nicht mehr mit einem Zeitgeber je Zeichen',
    HTML.indexOf('setTimeout(tick, 22)') === -1);
roh('Das erste Zeichen steht sofort', HTML.indexOf('zeichne(1);') > -1);
roh('Getippt wird im Lesetempo', /const ZA_TAKT = 32;/.test(HTML));
roh('Die Kacheln kommen nacheinander', /@keyframes zaKachel/.test(HTML)
    && /#za-inhalt > \.za-tage > button:nth-child\(6\)\{ animation-delay/.test(HTML));
roh('MOJI hat einen Auftritt', /@keyframes zaAuftritt/.test(HTML)
    && /#v-zeitassi\.on \.za-moji\{ animation:zaAuftritt/.test(HTML));
roh('Die Raeder stehen vor der Einblendung', /function raederRichten/.test(HTML)
    && (HTML.match(/raederRichten\(/g) || []).length >= 3);
/* Ein Anlegen darf nichts wegnehmen. */
roh('Anlegen raeumt nicht mehr von selbst auf',
    /async function pkAdd\(knopf\)\{/.test(HTML) && !/pkAdd\(knopf, true\)/.test(HTML));
/* Genau ein Aufruf, und der steht in pkErneuern() — dem Weg, den man im
   Menue bewusst waehlt. */
roh('Aufgeraeumt wird nur auf dem bewussten Weg',
    (HTML.match(/await pkAlleLoeschen\(\)/g) || []).length === 1,
    (HTML.match(/await pkAlleLoeschen\(\)/g) || []).length + ' Aufrufe');
roh('Und gefragt nur bei sicherem Stand',
    /if\(!Array\.isArray\(PK_LISTE\) \|\| PK_LISTE\.length\)\{ weiter\(\); return; \}/.test(HTML));
/* Das Profilbild war am Funnelende das einzige runde der App. */
roh('Der Gruss macht das Bild nicht mehr rund',
    !/\.hallo\.fertig \.hallo-bild\{ ?border-radius:50%/.test(HTML));
roh('Der Reif laeuft ueber den gemessenen Umfang',
    /stroke-dasharray:331; stroke-dashoffset:331/.test(HTML));
/* ─── 26.09.2026: der neue Auftritt ─── */
roh('Das Bild wird scharf, statt zu federn',
    /@keyframes halloBild\{\s*0%\{opacity:0;transform:translateY\(22px\) scale\(\.82\);filter:blur\(18px\)\}/.test(HTML));
roh('Die Zeichen steigen einzeln aus der Unschaerfe',
    /\.hallo-in b \.hz\{[\s\S]{0,120}animation:halloZeichen [\d.]+s calc\(var\(--hz-start\) \+ var\(--i\) \* 34ms\)/.test(HTML)
    && /\.hallo\{--hz-start:\.5s;/.test(HTML));
roh('Der Schweif endet dort, wo der Kopf ist',
    /\.kg\{--l:22;--k:40;[\s\S]{0,200}\.k3\{--l:62;--k:0;[\s\S]{0,200}\.k2\{--l:34;--k:28;[\s\S]{0,200}\.kl\{--l:5;--k:57;/.test(HTML));
/* Am 27.09.2026 wieder raus: die Lichtkegel waren zu kraeftig. Der Grund
   traegt nur die Farbwolken der Hauptseite. */
roh('Der Grund traegt nur die Farbwolken der Hauptseite',
    !/\.hallo-grund::after/.test(HTML) && !/--kegel-a:/.test(HTML) && !/kegelZiehen/.test(HTML));
roh('Das Licht hinter dem Bild bleibt leise',
    /--licht-a:\.22;/.test(HTML) && (HTML.match(/--licht-a:\.13;/g) || []).length === 2);
roh('Das Licht kennt beide Fassungen',
    (HTML.match(/--licht-a:/g) || []).length === 3, (HTML.match(/--licht-a:/g) || []).length);
roh('Beim Abflug blitzt kein Haken auf, wo keiner stand',
    !/\.hallo\.fliegt \.hallo-haken\{/.test(HTML)
    && /\.hallo\.neu\.fliegt \.hallo-haken\{opacity:1/.test(HTML)
    && !/\.hallo\.fertig[^{]*\.hallo-haken\{/.test(HTML));
/* ─── Registrierung und Abschied im neuen Kleid ─── */
roh('Der Lichtstreif zeichnet den Reif: gleiche Zeit, gleiche Kurve',
    /\.hallo-komet rect\{[\s\S]{0,160}kometLauf 1\.6s \.75s cubic-bezier\(\.45,\.05,\.35,1\)/.test(HTML)
    && /\.hallo-ring \.rg\{[\s\S]{0,200}ringZieh 1\.6s cubic-bezier\(\.45,\.05,\.35,1\) \.75s/.test(HTML));
roh('Und liegen auf derselben Form',
    /\.hallo-komet\{position:absolute;inset:-6%/.test(HTML) && /\.hallo-ring\{ display:none; position:absolute; inset:-6%/.test(HTML));
roh('Beim Anlegen laeuft der Lichtstreif mit', !/\.hallo\.fertig \.hallo-komet/.test(HTML));
roh('Die Wellen kommen, wenn der Reif zu ist',
    /\.hallo\.fertig \.hallo-welle\{display:block;animation:halloWelle [\d.]+s 2\.3s/.test(HTML));
roh('Die Wellen stehen nicht schon vor ihrem Einsatz da',
    /@keyframes halloWelle\{0%\{opacity:0;/.test(HTML));
roh('Der Abschied kommt aus der Leiste', /function halloAnflug\(von\)\{/.test(HTML)
    && /const von = art === 'ab' \? halloZiel\(\) : null;/.test(HTML));
roh('Dabei blendet nur der Grund auf, nicht das Bild',
    /\.hallo\.kommt\{animation:none;/.test(HTML) && /\.hallo\.kommt \.hallo-grund\{animation:var\(--aura-anim\), halloRein \.62s/.test(HTML));
roh('Der Grund deckt so schnell wie bisher — das Abmelden wartet darauf',
    /\.hallo\.kommt \.hallo-grund\{[^}]*halloRein \.62s/.test(HTML));
roh('Zum Schluss schlaeft das Bild ein',
    /@keyframes halloEinschlafen\{to\{opacity:0;transform:translateY\(10px\) scale\(\.9\);filter:blur\(14px\)\}\}/.test(HTML));
roh('Das Schweben bleibt dabei in der Liste',
    /\.hallo\.ab\.weg \.hallo-rahmen\{animation:halloSchweben [^}]*halloEinschlafen/.test(HTML));
roh('Beim Abmelden greift der Cloud-Zuhoerer nicht vor',
    /evt === 'SIGNED_OUT' && ME && !_meldetAb/.test(HTML)
    && /async function doLogout\(\)\{\s*_meldetAb = true;\s*try\{ await abmeldenMitAbschied\(\); \}\s*finally\{ _meldetAb = false; \}/.test(HTML));
roh('Das Abraeumen wartet, bis der Abschied fertig ist',
    /const GRUSS_WEG = 1000;/.test(HTML) && /@keyframes halloAbWeg/.test(HTML) && /\.hallo\.ab\.weg\{animation:halloAbWeg 1s/.test(HTML));
roh('Das Bild fliegt in die Leiste', /function halloFlug\(ziel\)\{/.test(HTML));
roh('Die Bahn laeuft ueber eine eigene Zeitkurve', /const zeit = kurve\(\.5, 0, \.14, 1\);/.test(HTML));
roh('Solange es fliegt, ist sein Platz leer',
    /body\.halloflug \.tabbar \.avatar, body\.halloflug #av-zaehler\{opacity:0;transition:none\}/.test(HTML));
roh('Die Farbflaeche wandert beim Abflug weiter',
    /\.hallo\.fliegt \.hallo-grund\{ animation:var\(--aura-anim\), halloGrundWeg/.test(HTML));
/* Eine Klasse, die #v-cal eine Animation gibt, ersetzt viewIn — und wenn
   sie geht, laeuft viewIn von vorn: der Kalender sprang nach der Landung
   14 px hinunter und glitt wieder hoch. */
roh('Beim Flug bewegt sich der Kalender nicht',
    !/body\.halloflug #v-cal\{/.test(HTML) && !/body\.halloflug #app\{/.test(HTML));
roh('Und keine Klasse ersetzt mehr viewIn auf dem Kalender',
    !/body\.[a-z]+ #v-cal\{ ?animation:/.test(HTML));
roh('Das Hereinfahren am Funnelende laeuft ueber Web Animations',
    /function kalenderRein\(\)\{[\s\S]{0,200}v\.animate\(/.test(HTML));
roh('Und wartet nicht auf den Flug', /if\(!\$\('#hallo'\)\.classList\.contains\('fliegt'\)\) kalenderRein\(\);/.test(HTML));
roh('Weniger Bewegung: kein Flug', /function halloZiel\(\)\{[\s\S]{0,400}prefers-reduced-motion: reduce/.test(HTML));
roh('Das Maennchen verschwimmt bei der Uebergabe',
    /@keyframes uebergabeMark\{ to\{ opacity:0; transform:scale\(\.9\); filter:blur\(14px\) \} \}/.test(HTML));
roh('Ruhige Geraete bekommen nichts davon',
    /#za-inhalt > \.za-wahl > button, #za-inhalt > \.za-tage > button,\s*\n\s*#v-zeitassi\.on \.za-moji\{ animation:none \}/.test(HTML));

let schlecht = 0;
console.log('');
E.forEach(e => {
  if (!e.ok) schlecht++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.name + (e.ok || !e.zusatz ? '' : '  → ' + e.zusatz));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
/* Ohne diesen Vermerk ist der Lauf unterwegs abgebrochen — dann sagen die
   bestandenen Prüfungen nichts aus. Genau das ist hier einmal passiert und
   sah in der Übersicht wie ein Haken aus. */
if (!dom.window.__FERTIG) console.log('  FEHL  Der Testlauf ist vorzeitig abgebrochen.');
process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
})();
