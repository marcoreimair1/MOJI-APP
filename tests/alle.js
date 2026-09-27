/* Alle Testreihen nacheinander.

   Aufruf:
     node tests/alle.js                    prüft index.html im Projekt
     node tests/alle.js pfad/zur/datei     prüft eine andere Fassung

   Das zweite ist der wichtigere Fall: nach jedem Push die Datei von
   moji-app.at herunterladen und DIE prüfen. Was lokal läuft, muss
   nichts heißen — genau daran ist im September 2026 eine Korrektur
   verloren gegangen, die im README als erledigt stand und im Code nie
   ankam. Siehe Abschnitt 19.4.

   Jede Reihe läuft als eigener Prozess. Sie bauen ein ganzes Dokument
   in jsdom auf, und ein abgestürzter Lauf soll die übrigen nicht
   mitnehmen.                                                          */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/* Reihenfolge: erst das Rechnen, dann die Oberfläche. Wer eine kaputte
   Stundenrechnung hat, will das zuerst lesen. */
const REIHEN = [
  ['test-rhythmus',     'Wochenrhythmus über Jahre mit 53 Kalenderwochen'],
  ['test-dienstzeiten', 'Dienstzeiten mit Datum, schedAlt und schedFuer'],
  ['test-erinnerung',   'Die einmalige Frage nach der Monats-Erinnerung'],
  ['test-einstieg',     'Einstieg, die zwei Blaetter und der Funnel'],
  ['test-serie',        'Serien erkennen, fragen, wegfliegen lassen'],
  ['test-export',       'Exportseite und die PDF-Seite selbst'],
  ['test-vorspann',     'Vorspann, Übergabe an den Gruß, Kopfleiste'],
  ['test-menue',        'Profilmenü, Wischgeste, Fassungswechsel'],
  ['test-kalender',     'Kalender neu laden und das Osterei'],
  ['test-jahr',         'Jahresrückblick: Rechnen, Banner, Kapitel, Bühne'],
  ['test-zeitraum',     'Mehrere Tage eintragen: Kachel, Wahl, Von–Bis, Band'],
  ['test-tag',          'Einen Tag eintragen: Kalenderblatt, Kacheln, Knöpfe']
];

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(DATEI)) {
  console.error('Keine Datei zum Prüfen: ' + DATEI);
  process.exit(2);
}

const stand = (fs.readFileSync(DATEI, 'utf8').match(/APP_STAND = '([^']+)'/) || [])[1] || '—';
console.log('');
console.log('  MOJI · Testlauf');
console.log('  ' + DATEI);
console.log('  Stand ' + stand + '  ·  ' + (fs.statSync(DATEI).size / 1024).toFixed(0) + ' KB');
console.log('');

let ganz = 0, schlecht = 0, reihenSchlecht = 0, abgebrochen = 0;
const t0 = Date.now();

REIHEN.forEach(([name, was]) => {
  const r = spawnSync(process.execPath, [path.join(__dirname, name + '.js'), DATEI],
                      { encoding: 'utf8' });
  const aus = (r.stdout || '') + (r.stderr || '');
  const m = aus.match(/(\d+) Prüfungen, (\d+) bestanden, (\d+) gescheitert/);
  const n = m ? +m[1] : 0, fehl = m ? +m[3] : 0;
  ganz += n; schlecht += fehl;
  const gut = r.status === 0 && m && fehl === 0;
  if (!gut) reihenSchlecht++;

  console.log('  ' + (gut ? '✓' : '✗') + '  ' + name.replace('test-', '').padEnd(14)
            + String(n).padStart(3) + ' Prüfungen   ' + was);

  /* Nur bei Ärger die Einzelheiten — sonst scrollt niemand mehr. */
  if (!gut) {
    aus.split('\n').filter(z => /FEHL|Error|not defined/.test(z))
       .slice(0, 8).forEach(z => console.log('       ' + z.trim()));
    if (!m) console.log('       (die Reihe ist gar nicht durchgelaufen)');
    /* Null Pruefungen heisst: das Skript ist beim Einlesen gescheitert —
       etwa, weil ein Name doppelt vergeben ist. Ohne diesen Hinweis sieht
       die Zeile fast aus wie eine bestandene. */
    else if (n === 0) console.log('       (kein einziger Testfall gelaufen — Skriptfehler?)');
    /* Ausgezaehlt, nichts gescheitert, und trotzdem nicht sauber beendet:
       dann hat der Laufzeitteil abgebrochen, BEVOR er seine Pruefungen
       melden konnte. Genau so lief es vom 21. bis 26. September 2026 —
       zwei Reihen brachen still ab, 166 Pruefungen liefen nie, darunter
       die, die ein verlorenes Verhalten gemeldet haetten. Die Summe
       sagte "0 gescheitert". */
    else if (fehl === 0) {
      abgebrochen++;
      console.log('       (nicht zu Ende gelaufen — die Pruefungen danach fehlen)');
    }
  }
});

const dauer = ((Date.now() - t0) / 1000).toFixed(1);
console.log('');
console.log('  ' + ganz + ' Prüfungen in ' + REIHEN.length + ' Reihen · '
          + (ganz - schlecht) + ' bestanden · ' + schlecht + ' gescheitert'
          + (abgebrochen ? ' · ' + abgebrochen + (abgebrochen === 1 ? ' Reihe' : ' Reihen')
                           + ' NICHT DURCHGELAUFEN' : '')
          + ' · ' + dauer + ' s');
console.log('');
process.exit(reihenSchlecht ? 1 : 0);
