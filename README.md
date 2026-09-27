# MOJI

**Mehr Zeit fürs Wesentliche.** · Eine App von Studio MARU 丸

Arbeitszeitaufzeichnung für **Miller Optik GmbH**. Eine einzige HTML-Datei auf GitHub Pages,
Supabase in Frankfurt als Datenspeicher, gebaut fürs Handy.

**Live:** https://moji-app.at

---

## Inhalt

**Die App**

1. [Überblick](#1--überblick)
2. [Anmelden](#2--anmelden)
3. [Rechnen](#3--rechnen)
4. [PDF-Export](#4--pdf-export)
5. [Mitgliedschaft und Stufen](#5--mitgliedschaft-und-stufen)
6. [Bedienung in Kurzform](#6--bedienung-in-kurzform)

**Technik und Betrieb**

7. [Wo die Daten liegen](#7--wo-die-daten-liegen)
8. [Veröffentlichen und Versionen](#8--veröffentlichen-und-versionen)
9. [Domain und DNS](#9--domain-und-dns)
10. [Datenschutz](#10--datenschutz)

**Einrichtung** *(einmalig, größtenteils erledigt)*

11. [Supabase-Projekt und Datenbank](#11--supabase-projekt-und-datenbank)
12. [Mailversand über Resend](#12--mailversand-über-resend-erledigt)
13. [Mailvorlagen und Code](#13--mailvorlagen-und-code-erledigt)
14. [Passkeys](#14--passkeys-erledigt)
15. [Monats-Erinnerung automatisch verschicken](#15--monats-erinnerung-automatisch-verschicken) *(läuft)*
16. [Mitarbeiter aufnehmen und Konten verwalten](#16--mitarbeiter-aufnehmen-und-konten-verwalten)

**Anhang**

17. [Dateien im Projekt](#17--dateien-im-projekt)
18. [Offene Punkte](#18--offene-punkte)
19. [Übergabe an einen anderen Rechner oder Account](#19--übergabe-an-einen-anderen-rechner-oder-account)

---

# Die App

## 1 · Überblick

MOJI ist eine reine Frontend-App: `index.html` enthält Aufbau, Gestaltung und Logik in einer
Datei, ohne Bauschritt. Wer die Datei hochlädt, hat veröffentlicht.

Die App läuft auch ohne Internet weiter — die Daten liegen zusätzlich im Browser. Ohne
Zugangsdaten im Block `CLOUD` arbeitet MOJI rein lokal, ganz ohne Konto.

Bewusst nur für Hochformat am Handy gebaut. Am Rechner erscheint ein Hinweis; `?desktop=1`
umgeht ihn für Tests.

---

## 2 · Anmelden

Seit 14. September 2026 ist der ganze Weg von der ersten Sekunde bis zum Kalender neu.
Vorher standen vor der Anmeldung fünf Musterbilder mit drei Absätzen Erklärung, danach ein
Funnel aus fünf Seiten und am Ende eine Schlussseite mit A4-Vorschau und Kartenkarussell.
Angemeldet hat das niemanden, geblättert schon.

### Der Einstieg

Nach dem Vorspann steht ein Bildschirm mit **einer Zeile und zwei Knöpfen**:

| Wo | Was |
|---|---|
| oben rechts | **Sonne oder Mond** — die Fassung, die gerade läuft. Ein Tipp legt sie um |
| Mitte | der Schriftzug, der sich selbst schreibt (siehe unten) |
| unten, in einer Schale | **Mit Face ID anmelden** (nur wenn das Gerät Passkeys kann) und **Anmelden oder registrieren** |

#### Der Schriftzug, der sich selbst schreibt

In der Mitte steht zuerst **nur das Männchen** — dasselbe freigestellte Bild, das beim Osterei
am Schriftzug vorbeischaut (`LOGO_MOJI`, → *Das Osterei*). Dann schieben sich die Buchstaben
einer nach dem anderen darunter hervor und das Männchen nach rechts; es wackelt, schiebt sich
wieder darüber, kurze Pause — und beim nächsten Durchgang steht dort dasselbe Wort auf
Japanisch: **文字**, gelesen *moji*, heißt Schriftzeichen. Die Schleife endet nie.

Technisch wachsen die Buchstaben aus `width:0` heraus; weil die Zeile zentriert ist, rückt das
Männchen dabei mit. Eine Überblendung von `width:0` auf `width:auto` kennt CSS nicht, also misst
`msBau()` jede Breite einmal in JS — und zwar erst nach `document.fonts.ready`, sonst stünden
dort die Maße der Ersatzschrift.

**Ein Klopfer je Buchstabe**, wie in großen Apps. Zwei Einschränkungen, beide unvermeidlich:

- **Am iPhone bleibt es still.** Safari kennt `navigator.vibrate` nicht, in keiner Version. Die
  ChatGPT-App kann das, weil sie eine native App ist — eine Webseite auf iOS kann es nicht.
  Am Android-Telefon klopft es
- **Chrome verwirft den Aufruf**, solange die Seite nicht wenigstens einmal berührt wurde.
  Beim allerersten Bildschirm ist es also still, danach nicht mehr

Geklopft wird nur in den **ersten beiden Durchgängen** (`MS_KLOPF_RUNDEN`). Die Bewegung läuft
weiter, das Klopfen nicht: ein Telefon, das auf einem offenen Bildschirm endlos weiterbrummt,
wäre keine Spielerei mehr. Im Hintergrund (`visibilitychange`) ruht die Schleife ganz, und wer
*prefers-reduced-motion* gesetzt hat, bekommt den Schriftzug einmal fertig hingestellt.

Der Fassungsschalter sitzt dort, wo in gängigen Anmeldefenstern das Schließkreuz sitzt. Er
läuft über dieselbe Routine wie der Schalter im Profilmenü und **lädt die Seite neu**
(→ [Hell und Dunkel umschalten](#hell-und-dunkel-umschalten)). Wer hier umlegt, ist noch
niemand — die Wahl liegt deshalb vorerst nur im Gerät. Sie wandert ins Profil, sobald eines da
ist: `erscheinungUmschalten()` legt sie ohne angemeldetes Profil in `sessionStorage` unter
`moji.fassung.wahl`, `erscheinungAusProfil()` holt sie beim ersten Profil heraus und verbraucht
den Vermerk. So gilt, was man gerade getroffen hat, und nicht der Stand aus einer früheren
Sitzung.

**Face ID** führt direkt in `signInWithPasskey()` — die Abfrage kommt vom Gerät, MOJI sieht
davon nur das Ergebnis. Geht es schief, steht der Grund über den Knöpfen.

### Die zwei Blätter

**Anmelden oder registrieren** legt ein Blatt über den Einstieg: das Männchen, Überschrift,
E-Mail-Feld, *Weiter*. Oben liegt ein Griff — **beide Blätter lassen sich nach unten
wegschieben**, mit derselben Mechanik wie alle Blätter der App (`wireSheetDrag()`, das dafür
jetzt auch andere Klassennamen als `.sheet-card` annimmt). Das Schließkreuz bleibt daneben.

**Wie es sich bewegt** (überarbeitet am 14. September 2026):

| | |
|---|---|
| aufziehen | die Karte kommt **ganz von unten** herauf (`translateY(100%)`, 0,46 s), nicht mehr mit einem Sprung um 52 px |
| dahinter | der Einstieg **tritt zurück**: `body.blattoffen` schrumpft ihn auf 93 % und nimmt Deckkraft — dieselbe Tiefe wie bei einer Karte über einer anderen |
| Adresse → Code | die Karte **bleibt stehen**, nur der Inhalt blättert weiter (`.weiter`). Beide Karten sind gleich gebaut, man sieht also nur den Wechsel darin — kein zweites Aufziehen |
| zurück bei einem Fehler | dasselbe in die andere Richtung (`.rueck`) |
| zugehen | **geht auch wieder** (`.raus`, 0,32 s). Vorher verschwand das Blatt einfach |

Wurde die Karte mit dem Finger hinuntergeschoben, hat sie ihren Weg schon hinter sich — dann
läuft die Schließbewegung nicht noch einmal (`blattZu(id, sofort)`). Keine zweite Option, keine Trennlinie mit „oder" — beide Wege schickten
ohnehin dieselbe Mail, und Supabase legt beim ersten Mal selbst ein Konto an.

Ein Tipp auf *Weiter* schaltet **sofort** auf das zweite Blatt, noch bevor die Mail raus ist.
Das ist Absicht: am iPhone fährt die Tastatur nur dann mit hoch, wenn der Fokus **in derselben
Geste** gesetzt wird. Wartet man erst auf die Antwort des Servers, ist die Geste verbraucht und
die Tastatur fällt zu. Geht das Senden schief, kommt man zurück aufs erste Blatt und liest dort,
warum.

Auf dem zweiten Blatt steht der Code aus der Mail. **Erneut senden ist danach 60 Sekunden
gesperrt** und zählt die Sekunden herunter; jeder Versand — auch der erste — setzt die Sperre
neu. Supabase wehrt sich gegen zu viele Anfragen von selbst, mit einem Fehler; schöner ist es,
wenn der Knopf gar nicht erst mitspielt.

**Und darunter steht der Spam-Hinweis** (seit 15. September 2026): *Nichts angekommen? Schau
bitte auch im Spam-Ordner nach.* Mails von einem neuen Absender landen dort oft beim ersten Mal,
und wer das nicht weiß, hält die Anmeldung für kaputt. Er steht **zwischen Eingabe und „erneut
senden"** — davor wäre er Beiwerk, das man überliest, danach fände ihn niemand mehr. Leiser
gesetzt als die Unterzeile, weil er eine Fußnote für den Fehlerfall ist und kein Teil der
Anweisung.

In der Mail stehen weiterhin ein Link **und** ein Code. Der Code ist der wichtigere: wer MOJI
vom iPhone-Startbildschirm öffnet, kann den Link nicht nutzen, weil er in Safari landet und eine
Startbildschirm-App auf iOS einen eigenen Speicher hat.

### Danach: bekannt oder neu

Nach dem Code entscheidet der Datensatz in der Cloud, nicht die App:

- **Datensatz da** → der Gruß *Hallo …* und der Kalender
- **kein Datensatz** → der Funnel

### Der Funnel — vier Schritte

Oben steht *Schritt n von 4* und ein Balken in der Markenfarbe.

| # | Frage | Weiter geht es |
|---|---|---|
| 1 | Vor- und Nachname | Pfeil im Feld, Enter, oder von selbst beim Einsetzen |
| 2 | Geburtsdatum | von selbst, sobald es vollständig ist |
| 3 | Zwei Schalter: **Monatserinnerung per Mail** und **Face ID aktivieren** | von selbst, wenn beide stehen — sonst über den Knopf |
| 4 | **Dienstplan gleich anlegen?** *Ja, jetzt* / *Später* — mit der Angabe **circa 2 Minuten** | *Ja* übergibt an den Zeit-Assistenten (siehe unten), *Später* ist fertig |

Zwischen den Schritten **geht der alte mit, statt zu verschwinden**: er legt sich für 0,3 s aus
dem Fluss (`position:absolute`) und zieht zur Seite ab, während der neue hereinkommt. Vorher war
er von einem Bild aufs andere weg. Dasselbe innerhalb von Schritt 4, zwischen Frage und
Dienstzeiten.

Der Schalter für Face ID öffnet die Abfrage des Geräts (`registerPasskey()`), der für die
Erinnerung schreibt `mailOk` und `mailGefragt` sofort ins Profil. Was das Gerät oder das Konto
nicht hergibt, wird nicht gezeigt: ohne Cloud keine Erinnerung, ohne Passkey-Unterstützung kein
Face ID — und wenn beides fehlt, fällt Schritt 3 ganz weg.

*Später* beim Dienstplan heißt: es gilt die Vorgabe (Montag bis Freitag 08:00–12:00 und
13:00–17:00, Samstag 08:00–12:00). Die Zeiten lassen sich jederzeit im Profilmenü eintragen.

### Der Zeit-Assistent

Bis 14. September 2026 öffnete *Ja, jetzt* das ganze Formular: Wochenintervall, vier
Wochenreiter, sechs Tageszeilen mit je vier Uhrzeiten — **vierundzwanzig Felder**, bevor der
erste Wert gesetzt war. Wer das zum ersten Mal sieht, legt das Handy weg.

Jetzt führt **MOJI** durch. Eine Frage je Bild, die Antwort immer zum Antippen oder am Rad, der
Text kommt Zeichen für Zeichen wie in einem Spiel. **Gerechnet wird nichts anders** — am Ende
steht dieselbe `sched`-Struktur wie vorher.

| Bild | Was passiert |
|---|---|
| Gruß | MOJI in der Mitte des Schirms: *Hi Anna! Ich bin MOJI.* → *Lass uns kurz deine Arbeitszeiten festlegen…* Zwei Wege: **Ja, starten wir!** / **Hab's mir anders überlegt**. Hier gibt es weder Zählung noch Balken — es ist ja noch nichts geschehen |
| Abbruch | *…* — dann *Ok, schade. Du kannst deine Zeiten jederzeit im Profilmenü nachtragen.* Erst ein weiterer Tipp führt in die App |
| Wochen | MOJI rückt nach oben und bleibt dort. *Arbeitest du jede Woche gleich?* → darunter die Aufforderung *Wähle aus, in welchem Wochen-Intervall du arbeitest:* und vier Knöpfe: 1 bis 4 Wochen. Darunter **Ich brauche Hilfe bei dieser Frage** — ein Tipp klappt vier Beispiele auf, eines je Zahl |
**Die Hilfe zur Wochenfrage** steht hinter einem Knopf, nicht davor: wer weiß, wie sein
Dienstplan läuft, soll nicht an einer Erklärung vorbeilesen müssen. Aufgeklappt kommt je Zahl
eine Karte (`ZA_RHYTHMEN`) mit **Bedeutung**, **Beispiel** und **Wiederholung** — in einem
Dienstplan in Worten, nicht in einer Definition. Jede Karte trägt die Farbe, die diese Woche
später in den Reitern und im Kalender hat (`WOCHENFARBE`). Die Karten sind **nicht antippbar**:
gewählt wird oben, sonst verstellte ein Blick in die Erklärung den Plan.

| Tage | *Heute ist Montag in der KW 38. An welchen Tagen arbeitest du diese Woche?* → sechs Knöpfe, angetippt bekommen sie einen **grünen Rand** im Grün aus der Kugel des Männchens (`--moji-gruen`, aus dem Bild gemessen) |
| Tag für Tag | Vormittag und Nachmittag je mit Schalter, den Stunden bündig rechts an der Kachel und **zwei Rädern**. Darunter *8,00 h Arbeitszeit · 1,00 h Pause*. Ein abgeschalteter Abschnitt behält seine Zeiten und richtet seine Räder neu, sobald er wieder eingeschaltet wird |
| Schluss | MOJI wieder mittig: *Super, Anna! …* → **Abschließen** → Willkommensgruß → Kalender |

**Die Räder statt einer Tastatur.** Eine Uhrzeit tippt niemand gern, und die Tastatur schiebt am
Handy das halbe Bild weg. Die Räder rasten ein wie beim Wecker — das Einrasten macht der Browser
selbst (`scroll-snap`), gelesen wird nur, welche Zeile in der Mitte steht. Ein eigenes
Trägheitsmodell fühlt sich am Handy immer falsch an. Werte im Viertelstundentakt von 04:00 bis
23:45; eine krumme Zeit rastet auf den nächsten Wert ein.

Zwei Dinge daran waren am echten Gerät kaputt und sind es nicht mehr:

- **`touch-action:pan-y`** sagt dem Browser, dass hier nur senkrecht gezogen wird. Ohne das
  rutschte der Finger seitlich weg und der Zug ging verloren — es fühlte sich an, als hänge das
  Rad. Dazu `overflow-x:hidden`: sobald eine Achse nicht `visible` ist, macht CSS aus der anderen
  `auto`, und damit war das Rad auch seitlich schiebbar.
- **Das Rad hört erst zu, wenn es steht.** Das Einstellen der Anfangsposition ist unsere eigene
  Bewegung, keine Eingabe. Misslang sie — am iPhone kann `scroll-snap` nach dem Einfügen noch
  einmal auf den ersten Eintrag schnappen —, schrieb der Scroll-Horcher **04:00** in den Plan.
  Am Rechner fiel das nie auf, am Gerät stand danach überall 04:00. Jetzt wird zweimal gesetzt,
  nach 140 ms nachgeprüft, und erst dann zählt eine Bewegung als Drehen.

**Womit ein Tag anfängt.** Der erste Tag einer Woche steht auf der Vorgabe — **08:00–12:00 und
13:00–17:00**, samstags nur vormittags (`ZA_STD`, dieselben Zeiten wie `defaultWeek()`, damit
*Später* und *Ja, jetzt* nicht auseinanderlaufen). Jeder weitere Tag übernimmt, was beim **Tag
davor** steht: wer Montag sechs bis vier arbeitet, arbeitet Dienstag meistens auch so. Eine neue
Woche fängt wieder bei der Vorgabe an — dort sind die Zeiten ja gerade anders. Wer zurückgeht,
findet seine eigenen Zeiten vor, nicht wieder den Vorschlag (`ZA.gesetzt`).

> **Die Pause zählt nicht zur Arbeitszeit.** Unter den Kacheln steht *8,00 h Arbeitszeit ·
> 1,00 h Pause*, nicht „8 h, davon 1 h Pause" — `segH()` summiert nur die beiden Abschnitte, die
> Lücke dazwischen liegt daneben. Wer von 08:00 bis 17:00 im Haus ist, hat 8 h Arbeitszeit und
> 1 h Pause, zusammen 9 h Anwesenheit.

**Mehrere Wochen.** Jedes Intervall trägt seine eigene Farbe (`WOCHENFARBE`, dieselben vier wie
im alten Formular), als Band über der Frage und im Fortschrittsbalken. Vor jedem neuen Intervall
fragt MOJI erneut nach den Tagen, und bei jedem Tag steht oben **Wie Woche 1** (bzw. 2, 3) zum
Übernehmen — dort, wo es in einer früheren Woche überhaupt Zeiten gibt.

**MOJI redet in Häppchen.** Ein Satz je Blase; kommt mehr, steht **unter** der Blase ein kleines
*Weiter* — in der Blase saß es dem Satz im Weg und las sich, als gehöre es zum Text. Es trägt
`.einb.zweit` wie die übrigen Knöpfe der App, nur nicht über die ganze Breite; als Pille in
Markenfarbe sah es nach Etikett aus statt nach Knopf. Wer
schneller liest, tippt die Blase an: der Satz steht sofort, ein zweiter Tipp holt den nächsten.

Ein Satz, der weitergeht, **endet auf Punkte** — und der nächste fängt damit an. So sieht man,
dass noch etwas kommt, ohne es lesen zu müssen. Ein Teil, der ohnehin nur aus Punkten besteht —
das *…* beim Abbruch —, bleibt wie er ist. Geschrieben wird mit **einem Zeichen alle 22 ms**,
also rund 45 in der Sekunde: vorher waren es zwei je Schritt, das las sich wie ein Ausdruck statt
wie jemand, der spricht.

**Oben steht nur, wo es zurückgeht.** *Woche 1 von 2*, *Deine Woche* und *Fertig* standen dort
einmal und stifteten mehr Verwirrung, als sie halfen — in welcher Woche man steckt, sagt das Band
über der Frage ohnehin. Am Anfang (Gruß, Abbruch) und am Ende steht oben **gar nichts**: weder
Zeile noch Balken.

**Aussteigen geht jederzeit** über das Kreuz oben rechts. Gefragt wird trotzdem — *Wirklich
abbrechen? Der Fortschritt geht verloren. Den Dienstplan kannst du später im Profilmenü
anlegen.* — in derselben Leiste, die auch beim Passkey fragt. Wer bestätigt, landet auf demselben
Weg wie bei *Später*: Profil gespeichert, Willkommensgruß, Kalender.

### Dienstzeiten später bearbeiten

Im Profilmenü unter **Dienstzeiten** — und seit 14. September 2026 mit denselben Bausteinen wie
der Assistent. Vorher stand dort das alte Formular: sechs Tageszeilen mit je vier Uhrzeitfeldern
gleichzeitig offen, dazu zwei Schlösser, die man erst antippen musste, um überhaupt etwas ändern
zu dürfen.

Jetzt eine **Liste**: je Tag eine Zeile mit den Zeiten und den Stunden, angetippt klappt sie auf
und zeigt Vormittag und Nachmittag mit den **Rädern aus dem Funnel**. Nur eine Zeile ist offen;
beim Ändern zieht die Zeile darüber mit, ohne dass die Liste neu gebaut wird — sonst spränge das
Rad unter dem Finger weg. Auf schmalen Geräten (< 380 px) stehen die Tage als *Mo, Di, …*, damit
die Zeiten nicht abgeschnitten werden.

Die Seite trägt seit 14. September 2026 dieselbe Kopfzeile wie der Assistent — **Zurück** links
oben, darunter die Überschrift *Dienstzeiten*, keine Kopfleiste der App darüber. Augenbraue,
Displayüberschrift und Fließtext sind entfallen.

**Und sie fängt verschlossen an.** Ganz oben steht ein Schalter *Bearbeiten* mit einem Schloss —
dieselbe Zeile wie die Schalter im Funnel, denn es ist ja auch ein Schalter. Solange er zu ist,
liegt alles darunter auf 46 % Deckkraft und nimmt keine Tipps an (`.hr-sperre.zu`); die Leiste
mit *Speichern* und *Verwerfen* ist gar nicht da. Lesen geht, ändern nicht. Ein Tipp ins
Gesperrte läuft nicht ins Leere — das Schloss wackelt kurz und zeigt so, wo es weitergeht.

Die zwei **alten** Schlösser (`schlossHtml()`, je eines für Wochenintervall und laufende Woche)
sind damit nicht zurück: sie saßen an einzelnen Feldern und verwechselten eine Sperre mit einer
Feinjustierung. Das neue ist eines für die ganze Seite.

**Hinauswischen** geht wie im Profilmenü: nach rechts ziehen führt zurück (`wireWischRaus()`).
Wer dabei etwas geändert hat, wird gefragt — *Änderungen verwerfen?* mit *Behalten* und
*Verwerfen* —, denn ein Wisch darf keine Arbeit wegwerfen. Die Räder sind von der Geste
ausgenommen, die ziehen selbst.

Was der gemeinsame Baustein ist: `zeitBlock(cfg, aendert)` baut einen ganzen Tag (zwei
Abschnitte plus Summe) und hängt an nichts außer dem übergebenen `cfg`. Funnel und Profilmenü
benutzen ihn beide; `renderSched()`, `openTime()` und das Zeit-Popover sind ersatzlos entfallen.

> **Sonntag kommt nicht vor.** Die Tage sind sechs, nicht sieben: `WORKDAYS` ist `[1…6]`, und
> Sonntag gilt in der ganzen App als frei — in `dayPlan()`, in `qTouched()` und auf der A4-Seite.
> Sonntagsarbeit wäre ein eigener Umbau quer durch die Rechnung, nicht eine Taste mehr.

Zum Schluss kommt das **Profilbild**, das MOJI gerade zugeteilt hat: ein Reif zieht sich darum,
der Haken springt an die Ecke, Konfetti steigt. Das Bild bleibt dabei das **weiche Viereck**,
das es überall in der App ist — bis 15. September 2026 wurde es hier rund (`border-radius:50%`)
und war damit das einzige runde Profilbild der App. Der Reif ist jetzt ein `<rect>` mit
derselben Ecke (`rx="31"`) statt eines Kreises; er läuft über die gemessenen 331 Einheiten
Umfang (`getTotalLength()` sagt 330,5 — `pathLength` wäre eleganter, wird auf `<rect>` aber
nicht überall gerechnet). Darüber steht *Hi Anna!* und darunter
*Willkommen bei MOJI.* Dahinter baut sich der Kalender auf und fährt herein, sobald der Gruß
sich auflöst.

> Eine erste Fassung deckte das Bild mit einem gezeichneten Haken zu — dann sah man das
> zugeteilte Motiv gar nicht, obwohl genau das der Moment dafür ist. Das Bild leitet sich aus
> Name und Geburtsdatum ab (`avZufall()`), ist also auf jedem Gerät dasselbe und lässt sich im
> Profilmenü tauschen.

**Was ersatzlos entfallen ist:** die Seite *Arbeitsort* (er steht fest und war eine Seite zum
Wegklicken), die Schlussseite mit A4-Vorschau und Kartenkarussell, und damit auch die Karte
*Aufs Handy legen*. Wer MOJI auf den Home-Bildschirm legen will, findet den Weg noch auf der
Desktop-Sperrseite; in der App am Handy steht er derzeit nirgends.

Die einmaligen Nachfragen `#v-pkask` und `#v-erinask` gibt es weiterhin — sie gelten
**bestehenden** Profilen, die den Funnel nie gesehen haben (→ Abschnitt 15.7). Neue Profile
beantworten beides mit den Schaltern in Schritt 3.

`#v-pkask` trägt seit 14. September 2026 dieselbe Bauform wie der Einstieg: die ganze Fläche
ohne Kopfleiste, in der Mitte Zeichen, Überschrift **Face ID jetzt einrichten** und eine Zeile,
unten der Kasten mit *Einrichten* und *Später*. Vorher standen dort Augenbraue, Fließtext, zwei
Merkzeilen in einer Karte und ein Textlink — und das Wort *Passkey*, das am Gerät niemand liest:
dort heißt es Face ID. **`#v-erinask` trägt die alte Bauform noch.**

**Passkey.** Im Profilmenü steht dafür **eine** Zeile: das Schlüsselsymbol in Normalgröße,
darunter der Zustand in Farbe.

| Farbe | Text | Ein Tipp fragt |
|---|---|---|
| grün | Anmelden ohne Code aktiv | *Passkey deaktivieren?* → Deaktivieren / Behalten |
| orange | Anmelden ohne Code – noch nicht aktiviert | *Passkey aktivieren?* → Aktivieren / Später |
| rot | Anmelden ohne Code – Problem | *Passkey neu einrichten?* → Neu versuchen / Abbrechen |

Gefragt wird in einem kleinen Balken am unteren Rand; ein Tipp daneben oder Escape schließt
ihn. Rot heißt: veraltet (Umzug), nicht abrufbar oder der letzte Versuch ist schiefgegangen —
der Grund steht im Balken. Ein Aussetzer beim Abruf lässt einen bekannten Passkey grün.
Ein Passkey gilt immer nur für **ein Gerät** und **eine Adresse**.

---

## 3 · Rechnen

- Zeiten in **15-Minuten-Schritten**, Stunden auf **0,25 h** gerundet
- **Pause** = Lücke zwischen Ende Vormittag und Beginn Nachmittag, automatisch erkannt
- **Dienstzeiten** Montag bis Samstag, Vormittag und Nachmittag einzeln abschaltbar
- **1 bis 4 Wochenintervalle.** Jede Woche hat eine eigene Farbe und einen eigenen Abschnitt,
  damit niemand versehentlich viermal Woche 1 ausfüllt. Wochenintervall und die Frage
  *welche Woche läuft gerade* sind je mit einem Schloss gesichert — zugesperrt sind die
  Knöpfe grau, offen leuchtet das Schloss gelb
- **Feiertage Österreich** werden inklusive Ostertermin selbst berechnet und überschreiben
  einen Urlaubseintrag am selben Tag
- **Getrennte Summen**: Arbeitszeit, Urlaub, Krankenstand, Feiertag, Sonstige, Gesamt
- Bei *Eigener Text* lässt sich festlegen, ob die Stunden als Arbeitszeit zählen (Schulung)
  oder nicht

### Farben, Schrift und Erscheinungsbild

MOJI trägt seit 13. September 2026 **Violett** statt Nachtblau und Gold. Die Marke ist
`#C643FE` — gemessen aus dem App-Symbol, nicht geschätzt.

**Hell ist die Vorgabe.** Für jeden, immer — nicht die Systemeinstellung. Wer im Profilmenü
unter *Erscheinungsbild* umschaltet, bekommt seine Wahl als `erscheinung` ins Profil
geschrieben und damit auf alle Geräte. Zusätzlich liegt sie unter `moji.erscheinung` im
Gerätespeicher, damit die Fassung schon beim ersten Anstrich steht — das Profil kommt erst
aus der Cloud, der Gerätespeicher ist sofort da.

**Jede Kategoriefarbe hat drei Werte**, weil sie drei Aufgaben erfüllt:

| Rolle | Token | Beispiel Urlaub hell |
|---|---|---|
| Fläche — luftig | `--c-urlaub-rgb-f` | `#F6D9AE` |
| Tinte — leuchtend | `--c-urlaub-rgb` | `#E1A01D` |
| Text — tief | `--c-urlaub-tx` | `#B07400` |

Ein dunkles Bernstein bei 13 % Deckkraft auf Weiß ergibt Schlamm, ein leuchtendes bei 34 px
Schrift nur 2,0:1 Kontrast. Deshalb drei Werte statt einem.

| Kategorie | Farbton | Dunkel | Hell |
|---|---|---|---|
| Arbeitszeit | 285° | `#A3A4AD` | `#7F7F8C` |
| Urlaub | 78° | `#F7C980` | `#E1A01D` |
| Krankenstand | 22° | `#F4A19E` | `#E54B52` |
| Feiertag | 215° | `#7ADFF7` | `#00A7CB` |
| Eigener Text | 148° | `#81C08A` | `#4EB864` |
| Zeitausgleich | 268° | `#9AB5FB` | `#4163E4` |
| **Heute** | 313° | `#C861FA` | `#9912CB` |

Gerechnet in **OKLCH**, nicht HSL: Dort heißt gleiche Helligkeit auch fürs Auge gleiche
Helligkeit. Geprüft ist dreierlei — Kontrast gegen den Untergrund, Abstand der Kategorien
untereinander (kleinster Wert 11) und Abstand zur Marke (alle ≥ 21).

Der **aktuelle Tag** trägt die Marke als atmenden Ring, 3 px bis 5 px über 6,5 Sekunden.
Er ist keine Kategorie, sondern ein Ort — *du bist hier*.

**Schriften:** `Bricolage Grotesque` für Überschriften, `Plus Jakarta Sans` für die Bedienung,
`Caveat` für die Unterschriftsleisten. Alle drei liegen als **`.woff2` im Repo**, nicht beim
Google-CDN — MOJI soll offline laufen, und es geht keine IP der Mitarbeiter an Google. Alle
sind OFL-lizenziert, Selbsthosten ist erlaubt.

Je Familie gibt es `latin` und `latin-ext`, gesteuert über `unicode-range`: Der Browser lädt
nur, was der Text wirklich braucht. Beim Aufruf der Anmeldeseite sind das drei Dateien,
nicht acht. Zusammen 313 KB, einmalig.

| Datei | Wofür |
|---|---|
| `moji-bricolage.woff2`, `-ext` | Überschriften, 300–800 variabel |
| `moji-jakarta.woff2`, `-ext`, `-italic`, `-italic-ext` | Bedienung |
| `moji-caveat.woff2`, `-ext` | Unterschriftsleisten |

Drei weitere Paare stehen als Regeln bereit — Schibsted Grotesk, Gabarito, Funnel — erreichbar
über `data-font="b"` bis `"d"` am `<html>`. **Ihre Dateien liegen nicht im Repo:** Wer
umschaltet, bekommt die Systemschrift, bis die betreffende `.woff2` dazukommt.

**Vorspann, Gruß, Geburtstagskarte und das Schweinchen** teilen sich eine Fläche: `.aurahg`
malt dieselben fünf Farbwolken wie der App-Hintergrund, aber als **ein** Element statt fünf —
fünf radiale Verläufe, die über `background-position` wandern. Die Töne kommen aus `--aura-1`
bis `-5` und wechseln damit von selbst mit Hell und Dunkel.

Im Vorspann läuft die Bewegung mit 5 Sekunden statt 26 — das Fenster ist nur wenige
Sekunden lang, langsamer nimmt man die Farbwanderung gar nicht wahr. Das Wolkenvideo
`wolken.mp4` ist dafür entfallen; die Kachel im Vorspann zeigt jetzt das App-Symbol selbst,
die Wortmarke steht darunter.

### Der Vorspann

Auf dem Schirm stehen **das freigestellte Männchen und ein sehr leiser Balken.** Wortmarke und
Slogan sind am 14. September 2026 gegangen — beim Starten liest das niemand, und zusammen
machten sie aus einem Zeichen eine kleine Seite.

**Der Ablauf, in vier Bildern:**

1. **Nur der Hintergrund.** 0,24 s lang steht da nichts als die Farbwolken.
2. **Der Balken kommt** und läuft bis zur Hälfte (`BALKEN_AB` → `LOGO_AB`).
3. **Bei der Hälfte erscheint das Männchen**, und der Glanz wandert **einmal** darüber.
4. Der Balken läuft weiter auf 86 %, die letzten Prozent erst, wenn eine Ansicht wirklich steht.
   Dann der Übergang in die App.

Zusammen dauert das **2,45 s** (angemeldet) oder **2,95 s** (ohne Anmeldung). Bis zum
14. September 2026 waren es 4,4 und 5,4 — das las sich nicht als Vorspann, sondern als Hänger.
Das Ausblenden von 1,1 s bleibt, wie es ist: dort ist die App schon sichtbar, gewartet wird da
nicht mehr.

**Das Männchen erscheint erst, wenn es wirklich dekodiert ist.** Es liegt als Datenzeile im
Quelltext, *geladen* wird also nichts — *dekodiert* aber schon, und beim ersten Besuch dauert
das einen Moment. Vorher blendete die Hülle nach fester Uhr auf und war dabei kurz leer. Jetzt
zählt, was später kommt: die halbe Strecke **oder** das fertige Bild (`img.decode()`). Die Hülle
behält dabei ihren Platz, damit beim Erscheinen nichts rückt.

**Und der Vorspann hat keinen eigenen Hintergrund mehr.** Er ist durchsichtig und lässt die
Farbwolken der App durch — also genau die Fläche, auf der gleich die Anmeldeseite steht. Vorher
lagen dort ein dunkler Schleier, eine eigene Farbfläche (`.aurahg`), schwebende Lichtpunkte auf
einem Canvas (`startParticles()`, rund 70 Zeilen) und ein weißer Blitz (`.bloom`). Zusammen war
das ein anderer Ort als der, auf den es gleich weitergeht — und der Übergang dorthin ein
Wechsel statt einer Fortsetzung. Alles vier ist ersatzlos entfallen.

Er läuft **der Reihe nach**, nicht übereinander: erst das Zeichen, dann erst der Gruß mit dem
Profilbild. Vorher lagen beide übereinander und endeten gemeinsam — vom Zeichen blieb dabei oft
nur das Profilbild darüber zu sehen.

Gezeigt wird `LOGO_MOJI`, dasselbe freigestellte Bild wie beim Osterei am Schriftzug: Körper,
Gesicht, grüner Punkt, weißer Umriss — weder Kachel noch Hintergrund. Das App-Symbol mit Kachel
(`LOGO_ICON`) steht weiterhin in der Datei, aber nur noch fürs PDF. Beide sind base64 im
Quelltext: als Datei geladen kämen sie regelmäßig zu spät, `icon-512.png` allein wiegt 250 KB.

**In voller Auflösung seit 14. September 2026: 385 × 315 statt 120 × 98.** Das alte Bild war für
26 px im Menüband gemacht; im Vorspann auf 240 px gezogen war es matschig. Dieselbe Rechnung
noch einmal auf `icon-512.png`: den Verlauf der Kachel aus vier randnahen Streifen als
quadratische Fläche schätzen, abziehen, und was weit genug abweicht, ist das Männchen. Der
Schlagschatten fällt heraus, weil er **dunkler und nicht gesättigter** ist; Augen und Mund sehen
genauso aus, liegen aber mitten im Körper und kommen beim Löcherfüllen zurück. An der weichen
Kante wird die Kachelfarbe herausgerechnet, sonst hätte der weiße Umriss einen lavendelfarbenen
Saum.

Als **WebP** statt PNG: 10,5 KB gegen 118 KB — bei dreifacher Kantenlänge also *kleiner* als das
alte Bild. Safari kann WebP seit Version 14. Das Bild wird an vier Stellen gebraucht (Vorspann,
beide Blätter der Anmeldung, Schriftzug-Schleife, Osterei), es gibt es deshalb nur einmal.

**Über das Männchen wandert ein Glanz wie über eine Metallkarte**, von links oben nach rechts
unten. Gebaut ist er als senkrechter Streifen, um 45 Grad gedreht; `translateX` läuft danach in
der **gedrehten** Achse, also nach rechts unten. Schmaler Kern, weiche Flanken — eine breite
Aufhellung der halben Fläche liest sich nicht als Streiflicht.

Solange das Bild in einer Kachel saß, schnitt die das Band ab. Freigestellt muss das Bild selbst
schneiden: die Hülle `.mark-glanz` trägt das Männchen als **Maske**, das Band liegt darin. Die
Maske kommt als `--moji-maske` aus `playIntro()`, weil das Bild als Datenzeile im Skript steht
und nicht als Datei. Kennt ein Browser keine Masken, bleibt das Band ganz weg (`@supports`) —
als Rechteck über dem leeren Platz daneben wäre es schlimmer als gar keins.

**Der Balken kündigt nichts an und will nicht auffallen.** Er ist da, damit niemand meint, die
App hänge. Darum 2 px hoch, höchstens 132 px breit — und **ohne eigene Farbe**: Spur und Füllung
kommen aus `--tx-rgb`, also im Hellen ein Grau und im Dunkeln ein leises Weiß.

Er zeigt weiterhin den **echten Start, keine Uhr**. `balkenZug(stufe, ms, auf)` kennt vier Stufen,
und **keine nimmt eine spätere zurück**. Das ist nötig, weil der echte Start jederzeit
dazwischenfunken darf: meldet sich eine Ansicht schon nach einer halben Sekunde, läuft der letzte
Zug sofort — der Zug auf 86 %, der per Uhr noch aussteht, dürfte ihn danach nicht wieder
zurückholen. Ein unterbrochener CSS-Übergang läuft von der gerade erreichten Breite weiter, man
sieht also keinen Sprung.

`introSchliessen()` entscheidet wie gehabt, wann Schluss ist, und merkt sich den Endzeitpunkt in
`window.__introEnde`. Die Standzeiten sind unverändert.

> **Zwischenstand vom selben Tag:** Der Balken war zwischendurch ganz entfernt — ein Zeichen
> allein auf dem Schirm war ruhiger. Ohne ihn stand es aber 4,4 bis 5,4 Sekunden still da, und
> genau das liest sich wie ein Hänger. Er ist deshalb zurück, nur leiser als vorher: dünner,
> schmaler und ohne Markenfarbe.

Wie lange der Vorspann steht, hängt daran, wer da ist:Wie lange der Vorspann steht, hängt daran, wer da ist:

| | Standzeit | warum |
|---|---|---|
| angemeldet | `INTRO_MIN` 4,4 s | danach kommt der Gruß, es geht weiter |
| nicht angemeldet | `INTRO_LANG` 5,4 s | es folgt nichts mehr, also keine Eile |
| Start hängt | `INTRO_MAX` 9,0 s | Notbremse, damit es nicht ewig steht |

`nachIntro(fn)` stellt etwas in eine Schlange. `zeigeGruss()` geht diesen Weg — deshalb kommt
das Profilbild nie über das Symbol.

**Der Gruß ist ein Vorhang, keine Zierde.** Er deckt den Wechsel, statt ihm hinterherzulaufen.
Bis 13. September 2026 stand beim Anmelden `enterApp(); if(frisch) zeigeHallo();` — also:
Kalender aufbauen und ihn dann zudecken. Zwei Folgen hatte das. Man sah den Kalender kurz
aufblitzen, bevor der Gruß sich darüberlegte. Und der Anlauf der Kopfleiste, der in `enterApp()`
startet, sah einen **freien** Schirm — der Gruß kam ja erst danach —, lief also hinter dem
Profilbild ab und war weg, bevor man ihn sehen konnte.

`zeigeGruss(art, wennOben)` nimmt jetzt entgegen, was unter ihm passieren soll; `wennOben` läuft
nach `GRUSS_REIN` (620 ms, passend zu `.hallo.on{animation:halloRein .62s}`). `appBetreten()`
nutzt das: beim Anmelden erst aufblenden, dann darunter die Ansicht tauschen. **Ausnahme:**
läuft noch der Vorspann, bleibt die alte Reihenfolge — der deckt ohnehin alles, und `go()` muss
ihm melden, dass der Start durch ist, sonst stünde er bis zur Notbremse.

Beim **Abmelden** dasselbe Problem von der anderen Seite: der Kommentar sagte, das Abmelden
dauere länger als das Aufblenden. Bei schneller Verbindung — oder ohne Cloud — war die
Anmeldeseite nach Millisekunden da und schien durch den halbdurchsichtigen Gruß. Jetzt läuft
`wait(GRUSS_REIN)` nebenher, und der sichtbare Teil wartet darauf.

**`wennFrei(fn)` ist die zweite Schlange:** sie wartet, bis *weder* Vorspann *noch* Gruß den
Schirm verdecken. Beide melden ihr Abtreten über `schirmPruefen()`. Daran hängt der Anlauf der
Kopfleiste — das Tier rutscht im Rahmen nach unten und die rote Zahl poppt auf, 0,62 s, die
man gesehen haben muss. Vorher stand dort stur *4,5 s nach dem Betreten*: gerechnet auf den
alten Vorspann, der nach 3,9 s endete und den Gruß gleich mitnahm. Seit der Vorspann länger
steht und der Gruß erst danach kommt, lief die Bewegung genau hinter dem Profilbild ab. Nach
dem freien Schirm folgt noch `ZAEHLER_ATEM` (700 ms), damit sie als etwas Neues auffällt und
nicht schon dagewesen wirkt.

**`endIntro()` endet auf zwei Arten.** Wartet nichts in der Schlange, blendet der Vorspann aus
und gibt die App frei. Wartet ein Gruß, wird **übergeben**: der Vorspann bleibt stehen und der
Gruß blendet darüber auf. Beide tragen dieselbe Farbfläche, es wechselt also nichts am
Hintergrund. Erst wenn der Gruß deckt (`UEBERGABE`, 700 ms), wird der Vorspann still
abgeräumt.

Das Symbol sitzt fast genau dort, wo gleich das Profilbild steht — nachgemessen 195 px an
y 254 gegen 212 px an y 255. Deshalb blendet `.mark-wrap` über dieselben 0,62 s ab, über die
der Gruß aufblendet: was das eine verliert, gewinnt das andere. Wortmarke, Unterzeile und
Balken räumen schneller (0,3 s), sonst lägen sie über *Hallo <Name>* — nur 13 px daneben.

Vorher blendete der Vorspann erst ganz aus, gab dabei den Kalender frei, und der Gruß legte
sich danach wieder darüber: drei Bewegungen für einen Übergang.

**Die App kommt erst hoch, wenn der Gruß deckt** *(26. September 2026)*. Der Vorspann ist
durchsichtig, er zeigt die Farbwolken der App. `endIntro()` setzte aber sofort `#app.on` und
nahm `body.locked` weg — während der Gruß noch 0,62 s aufblendete. In dieser Zeit schienen
Kalender und Leiste durch das halb sichtbare Profilbild. Bei der Übergabe passiert beides jetzt
erst nach `UEBERGABE`; die Prüfung *Die App wartet, bis der Gruß deckt* hält das fest.

### Jahresrückblick *(27. September 2026)*

Wie Spotify Wrapped, in MOJIs Handschrift. Vom **1. Dezember bis 31. Jänner** steht auf der
Exportseite über „Export als PDF" ein Banner in der Farbe der eigenen Stufe (`malJrBanner()`,
gemalt aus `go('v-export')`); im Jänner gilt er dem Vorjahr (`jrJahr()`). Ein Tipp öffnet die
Story (`jrAuf()`). Zum Ansehen vor Dezember: **moji-app.at/?rueckblick** in Safari — gilt für den
laufenden Tab.

**Kapitel** (nur die mit Inhalt): Eröffnung („Dein Jahr 2026") · Stunden mit rollender Zahl,
Vergleich und zwölf Säulen · Stufe: erst alle erreichten Stufen mit grünem Haken (zwei Spalten),
dann die aktuelle als Holo-Karte, darunter ein Spruch je Stufe (`JR_STUFE_SPRUCH`) ·
Bubble-Tea-Buddy mit kollegialem Spruch nach Anzahl (`jrTeeSpruch()`) · Abzeichen · Abschluss:
die **Teilkarte im Format 4:5** — Stufe, Stunden, sechs Kacheln (`jrKacheln()`), bester
Tee-Freund oder das stärkste Abzeichen. `jrBild()` zeichnet genau diese Karte in 1080 × 1350
als JPEG (als PNG waren es durch das Korn 3,3 MB).

Zwei Fallen, die dabei aufgefallen sind: Das Profilbild (3:4) streckte in der Flex-Spalte seinen
Rahmen mit `aspect-ratio` auf die Bildhöhe und wurde zur runden Pille — daher feste Höhe. Und die
Holo-Folie mit `color-dodge` wusch die Teilkarte aus; dort mischt sie jetzt mit `soft-light`. Bedienung wie Stories: rechts weiter, links zurück, halten
pausiert, das letzte Kapitel läuft nicht von selbst weiter.

**Gestaltung:** jedes Kapitel ein lebender Verlauf in **festen Farben aus der MOJI-Palette**
(`JR_STIMMUNG`): Violett für Eröffnung, Stunden, Stufe und Abschluss, Limette/Mint für Buddy und
Abzeichen. Bis 27.09. hing der Hintergrund an der Stufenfarbe — Marco wollte das MOJI-Violett.
Nur die Stufenkarten tragen weiter ihre Stufenfarbe, die Teilkarte ist fest violett mit der
Stufe als farbigem Punkt. Das Stufen-Kapitel ist eine **Fahrt**: alle Karten bis zur aktuellen
wischen langsam vorbei (`jrStufenFahrt()`, Stellung je Bild, nur `scale` mit Übergang), jede
erreichte bekommt im Vorbeifahren ihren Haken, die aktuelle wird zur Holo-Karte. Die
**Abzeichen** sind Münzen: eine große dreht sich herein, die kleinen fliegen aus ihr heraus
(`jrMuenzenFlug()` misst den Weg). Feines Korn darüber, Kapitel öffnen sich als Kreis vom
Finger (`jrBlende()`), Zahlen rollen Ziffer für Ziffer mit Metallglanz, jede Ziffernspalte so
breit wie ihre Zielziffer. Alle Klassen tragen `jr-`.

**Gerechnet** (`jrDaten(y, heute)`): Stunden bis heute aus `monthRows`/`monthSums`, stärkster
Monat, Urlaubstage, längster Urlaub am Stück (freie Tage dazwischen zählen mit), Brückentage
(Urlaub neben einem Feiertag), abgegeben und pünktlich (bis zum 5. des Folgemonats), frühester
Dienstbeginn, Samstage, gesammelter Zeitausgleich, Aufstiege im Jahr aus den `ME.exp`-Zeitstempeln,
Monate mit MOJI, längste Tagesserie (`ME.serie.best[jahr]`, seit 27.09. gemerkt).
**Krankentage kommen bewusst nicht vor.**

**Bubble Teas:** neue Tabelle `tee_log` (Migration `20260927090000_tee_protokoll.sql`) — jeder
gezählte Becher mit Tag, geschrieben nur in `tee_senden()`, lesbar nur für Beteiligte. Für Jahre
vor `TEE_LOG_AB` (2026-09-27) zählt die Summe je Paar; Bubble Tea gibt es erst seit 15.09.2026.
Geladen wird erst beim Öffnen (`jrTeeLaden()`); sind die Daten da, kommen Buddy und Abzeichen
dazu. Prüfungen: `tests/test-jahr.js`.

### Das Blatt, das sich schreibt — beim Export *(27. September 2026)*

Nach dem Signieren entsteht das PDF vor den Augen: `exOverlay(seiten)` legt eine Bühne über
den ganzen Schirm (die Farbfläche der App, `.exd-grund.aurahg`), und in der Mitte entsteht ein
Blatt. Vorher lag eine Fläche über der Exportkachel, ein Ring schloss sich um das Männchen.

- Das **Blatt** kommt aus der Unschärfe wie das Profilbild im Gruß (`halloBild`). Bei mehreren
  Monaten liegen ein oder zwei Blätter dahinter, leicht gedreht.
- Oben das **lebende Männchen als Briefkopf** (`moji-leben.webp`, sonst das Standbild).
- Die **Tabelle** sieht aus wie auf dem echten Blatt: zehn Zeilen mit Datum, Zeiten und Stunden
  in ruhigem Grau. Zwischen 4 und 80 % taucht eine nach der anderen aus der Unschärfe auf, ihre
  drei Teile knapp nacheinander (`.exz.da`). Bis zum 27.09. füllten sich hier violette Balken
  mit einem Funken an der Spitze — „ein bisschen zu viel".
- Zwischen 80 und 97 % wird die **eigene Unterschrift** (`SIG_BILD`) von links nach rechts
  freigelegt (`clip-path` über `--s`), mit einem Lichtpunkt an der Feder, der über die echte
  Breite des Bilds läuft (`--sb`).
- Darunter die **Lichtspur** aus dem Vorspann und die Prozentzahl.
- **Fertig**: ein Siegel mit Haken stempelt sich auf die Ecke (`exStempel`), eine Lichtwelle in
  der Form des Blatts läuft ein Stück hinaus (`exWelle`, bis 1,28 — mit 1,8 stand sie als
  Rahmen um den halben Schirm), ein Glanz läuft darüber, dann Dateiname, PDF, und die Bühne
  blendet weich aus (`ov.weg()`).
- `MOJI_MASKE` und der Ladekreis sind raus.

### Das PDF kommt über das Teilen-Blatt *(27. September 2026)*

Nach dem Export stand in Safari **„WebKitBlobResource-Fehler 1"**. Ursache: `doc.save()` öffnet
das PDF als `blob:`-Adresse im selben Tab. Die lebt nur, solange die Seite lebt, die sie gemacht
hat, und jsPDF gibt sie nach 40 s selbst frei. Lädt Safari die PDF-Seite neu (nach einem Wechsel
in eine andere App, beim Vor- und Zurückblättern), ist die Datei weg.

Jetzt verlässt das PDF die App nicht mehr, wo das Gerät Dateien teilen kann (iPhone, Android):
`pdfDatei()` baut aus `doc.output('blob')` eine `File`, und am Ende der Bühne stehen zwei Knöpfe,
**PDF teilen** und **Fertig**. Das Teilen-Blatt zeigt eine Vorschau und bietet Sichern in
Dateien, Mail, Nachrichten und Drucken. Ein Knopf statt eines Automatismus, weil iOS
`navigator.share()` nur direkt nach einem Tipp erlaubt — nach fünf Sekunden Animation wäre das
vorbei. **Das Blatt selbst ist dann auch ein Knopf** (`.tippbar`): es wächst auf die größere
Darstellung, trägt oben rechts ein Zeichen zum Öffnen, darunter steht *Zum Ansehen antippen*,
es hebt sich einmal kurz und gibt beim Drücken nach, solange der Finger liegt (`scale` über
`:active` — Safari setzt `:active` nur mit einem `touchstart`-Horcher).

**Ein Tipp aufs Blatt öffnet das PDF in einem neuen Tab** (`pdfImTab()`), mit dem PDF-Viewer
des Browsers. Der MOJI-Tab bleibt dahinter stehen, nichts lädt neu. Die blob-Adresse dafür
(`pdfAdresse()`) wird erst beim nächsten Export freigegeben, nicht nach 40 s wie bei jsPDF.
`window.open` steht dabei direkt im Tipp, ohne `await` davor — sonst hält Safari den Tab für
ein Popup. Geht kein Tab auf (Popup geblockt), oder läuft MOJI als **App vom Homebildschirm**
(`alsHomeApp()`: dort gibt es keine Tabs, und ein neues Fenster läuft außerhalb der App und
erreicht die Datei nicht), übernimmt das Teilen-Blatt mit seiner Vorschau. Teilen oder „Fertig" schließt die Bühne; bricht man das Teilen-Blatt ab, bleibt sie stehen.
Kann das Gerät keine Dateien teilen, bleibt es beim Öffnen mit `doc.save()` samt dem Vermerk
darunter.

### Zurück vom PDF ohne Vorspann *(27. September 2026)*

Auf dem iPhone öffnet sich das PDF in derselben Ansicht. Wer es ansah und zurückging, bekam die
App frisch geladen — mit Vorspann und Gruß. Jetzt ruft `buildPdf()` direkt vor `doc.save()`
`pdfVermerken()` auf: ein Zeitstempel unter `moji.pdf.zurueck` in `localStorage` (nicht
`sessionStorage` — iOS setzt beim Zurückgehen nicht sicher dieselbe Sitzung fort).

Beim Start liest `ZURUECK_VOM_PDF` den Vermerk einmal und löscht ihn. Ist er jünger als zehn
Minuten (`PDF_GILT`), läuft derselbe Weg wie nach einem Fassungswechsel: `vorspannUeberspringen()`,
kein Gruß (`afterLogin(session, false)`), und `enterApp()` geht beim ersten Mal auf `v-export`
statt auf den Kalender. Lädt die Seite gar nicht neu (das PDF lag nur darüber), räumt ein
`visibilitychange` den Vermerk beim Wiedersehen weg, spätestens nach zehn Minuten ein Zeitgeber —
so bekommt ein späterer echter Start wieder seinen Vorspann. `test-export.js` startet dafür zwei
zusätzliche Instanzen, eine mit frischem und eine mit altem Vermerk.

### Die Fahrt durch den Kartenstapel *(27. September 2026, zweite Fassung)*

Tippt man im Profilmenü auf **Karten**, läuft dieselbe Fahrt wie im Stufen-Kapitel des
Jahresrückblicks (`ktFahrt()`): die Karten stehen überlappend im Raum, schräg, kleiner und blasser
je weiter von der Mitte, und wischen langsam vorbei — `kurve(.42, 0, .18, 1)`, Dauer
`min(6000, 1300 + weit · 430)` ms (`ktFahrtDauer()`). Die erreichten tragen **von Anfang an**
einen grünen Haken an der Ecke.

Der echte Stapel kann das nicht, seine Karten rasten nebeneinander ein. Gefahren wird deshalb eine
Schicht mit **Abbildern** der echten Karten (`.kt-fahrt .kt-abbild`). Der echte Stapel steht
dabei schon am Ziel und ist verdeckt (`.kt-bahn.verdeckt`); die letzte Karte landet genau auf
seiner (nachgemessen: 0,3 px), dann übernimmt er unsichtbar. Gemessen wird mit `offsetWidth` /
`offsetTop`, nicht mit `getBoundingClientRect` — die Kiste fährt gerade aus der Menükarte heraus.
Der Abstand ist `0,44 ×` Kartenbreite statt `0,76` wie im Rückblick, weil die Karten hier fast
so breit wie der Schirm sind. Vorher lief `ktFlug()`: der echte Stapel per `scrollLeft` in
höchstens 1,35 s durchgezogen — zu schnell und flach. Der Titel verschwimmt weiter während der
Fahrt, angekommen geht der Schein auf und die Karte stupst an.

### Mehrere Tage eintragen *(27. September 2026, früher „Zeitraum eintragen")*

Über dem Kalender stand eine graue Pille **„Zeitraum eintragen"**. Viele erkannten nicht, was
dahinter steckt: das Wort sagt nicht, dass hier Urlaub und Krankenstand hineingehören, und die
Pille sah aus wie ein Suchfeld. Neu gebaut:

- **Die Kachel sagt, was sie tut.** Links die drei Arten als Zeichen (Sonne, Kreuz, Stift,
  leicht übereinander, `.zrk-arten`, gefüllt aus `ICONS` über `data-zi`), daneben
  *Urlaub, Krankenstand & mehr* / *Einen oder mehrere Tage eintragen*. Ein Glanz wandert alle
  neun Sekunden darüber, die Zeichen nicken ab und zu. Höhe bleibt 52 px wie der Kopf im Export.
- **Die Wahl erklärt jede Art.** Ein Tipp klappt darunter ein Blatt auf (`.zrk-wahl`), das sich
  über den Kalender legt statt ihn zu schieben und aus der Kachel herauswächst: *Urlaub* (mit den
  offenen Tagen), *Krankenstand* (ohne Abzug vom Urlaub), *Eigener Vermerk* (z. B. Schulung).
  Darunter die drei Schritte. Der Kalender tritt so lange zurück; ein Tipp daneben oder Escape
  schließt.
- **Der Kalender zeigt, dass er jetzt die Auswahl ist.** Beim Einstieg läuft eine Welle schräg
  über die wählbaren Tage (`zrWelle()`). Im Kopf, wo sonst *Kalender von …* steht, steht der
  nächste Schritt mit atmendem Punkt: *Ersten Tag antippen* → *Letzten Tag antippen* →
  *11 Arbeitstage gewählt* (`zrSchritt()`).
- **Von und Bis wie in einem Buchungskalender** (`.zrp-spann`): das gefragte Feld leuchtet in
  der Farbe der Art. Ein Tipp auf ein ausgefülltes Feld nimmt den Tag wieder heraus — Von fängt
  neu an, Bis fragt nur das Ende. Darunter die Zahl der Arbeitstage und wie viele davon schon
  belegt sind und ersetzt werden.
- **Ein Band statt einzelner Kästen.** Die gewählten Tage liegen auf einem durchgehenden Band je
  Kalenderwoche (`zrBand()`, an den Zellen gemessen, bei jeder Größenänderung neu). Wird das Ende
  gesetzt, wischt es vom ersten zum letzten Tag (`clip-path`), Woche für Woche.
- **Der Knopf nennt die Zahl:** *1 Tag eintragen*, *11 Tage eintragen*. Er bleibt aus, bis ein Tag
  gewählt ist. Daneben heißt es jetzt *Abbrechen* statt *Eintrag verwerfen*.
- **Umfang als Umschalter** mit Schieber in der Farbe der Art: *Ganzer Tag | Vormittag |
  Nachmittag* — vorher brach *Nur Nachmittag* am Handy auf zwei Zeilen um.
- Schrift in der Farbe der Art ist im Hellen dunkler gemischt (`--zrf-tx`), sonst wäre das Gelb
  des Urlaubs kaum lesbar.

Das Rechnen ist unverändert: Sonntage, Feiertage und dienstfreie Tage werden übersprungen, alle
Tage bekommen eine gemeinsame Serien-Kennung. Geprüft in `tests/test-zeitraum.js`.

### Das Tagesblatt *(27. September 2026)*

Das Blatt, das ein Tipp auf einen Tag öffnet, spricht jetzt dieselbe Sprache wie *Mehrere Tage
eintragen*:

- **Kopf:** ein Kalenderblatt mit Wochentag und Tag (`.shblatt`), daneben ausgeschrieben
  *Mittwoch, 16. September* (Jahr nur, wenn nicht das laufende) und der Dienstplan mit Uhr.
  Ist eine Art gewählt, nimmt das Kalenderblatt ihre Farbe an und federt kurz nach.
- **Die vier Arten als Kacheln zwei und zwei** (`.sho`): Zeichen, Name, ein Satz, was sie
  bewirkt (*Vom Urlaub abgezogen*, *Ohne Abzug vom Urlaub* …). Die gewählte leuchtet mit Haken,
  die anderen treten zurück, bleiben aber antippbar — umentscheiden ist ein Tipp. Vorher
  klappten die übrigen weg und man musste die gewählte erst wieder abwählen.
- **Farbe am Blatt:** `shFarbe()` legt `--zrf…` aus den Farbmarken der Fassung auf `#sheet`;
  Umschalter (dieselben Regeln wie `#q-scope`) und Knopf lesen sie von dort.
- **Knöpfe:** *Art wählen* (aus) → *Eintragen*, bei bestehendem Eintrag *Speichern*. Daneben
  *Abbrechen* an einem leeren Tag, *Zurücksetzen* nur, wenn es etwas zurückzusetzen gibt.
- **Bewegung:** beim Öffnen steigen Kopf, Kacheln und Knöpfe gestaffelt herauf (`#sheet.frisch`),
  Schließen gleitet nach unten weg (`#sheet.zu`, 250 ms; nach einem Wurf mit dem Finger sofort),
  und der eingetragene Tag blitzt im Kalender auf (`tagBlitz()`). Die Meldung nennt die Art.

Geprüft in `tests/test-tag.js`.

### Die Monatsübersicht in der Karte *(27. September 2026)*

Unter dem Kalender stand eine Zeile *Monatsdetails* mit einem dünnen grauen Balken; die Zahlen
lagen in einem Blatt, das man erst antippen musste. Jetzt steht alles offen in der Karte
(`malBalken()`), das Blatt `#msheet` ist entfallen:

- Oben *Monatsübersicht*, rechts die Tage groß in der Marke und die Stunden.
- Der Balken in abgesetzten, ganz gerundeten Stücken, eines je Art, so breit wie ihr Anteil an
  den Tagen. **Arbeit trägt jetzt die Marke** statt Grau (`MX_FARBE.arbeit`).
- Darunter je Art eine Kachel mit Farbpunkt und Stunden — **nur für die Arten, die in diesem
  Monat vorkommen** (`MB_ARTEN`): Arbeit, Urlaub, Krankheit, Feiertag, Sonstiges, Ausgleich.
- **Immer dieselbe Reihe:** jede Kachel ist ein Viertel der Reihe breit und gleich hoch, Name oben,
  Stunden darunter (Schrift 11 px). Gibt es mehr als vier Arten, reihen sich die weiteren rechts
  daneben an und werden mit einem Wisch nach links sichtbar (`overflow-x`, einrastend); solange
  rechts noch etwas liegt, blendet der Rand aus (`.mleg.weiter`, `mlegRand()`). Ein Wisch auf
  der Reihe blättert nicht den Monat um. Auf schmalen Karten unter 330 px (375er-Schirme)
  sitzt der Farbpunkt vor den Stunden statt vor dem Namen — sonst wurden „Krankheit" und
  „Sonstiges" abgeschnitten. So seit Marcos zweiter Rückmeldung am 27.09.2026; davor wechselte
  die Anordnung mit der Zahl der Arten.

### Der Vorspann in der Handschrift des Grußes *(27. September 2026)*

Der Vorspann spricht jetzt dieselbe Sprache wie Gruß, Abschied und Registrierung:

- **Das Männchen kommt aus der Unschärfe** (`markRein`) — von leicht unten, etwas kleiner,
  ohne Überschwingen, dieselbe Bewegung wie das Profilbild im Gruß. Vorher wuchs es nur und
  blendete auf.
- **Dahinter derselbe leise Schimmer** (`.mark-licht`, `--licht-a`, `lichtAuf`/`lichtAtmen`),
  und steht es, schwebt es fünf Pixel (`markSchweben`, über `translate`).
- **Der Glanz** wandert weiter einmal über die Silhouette, jetzt erst, wenn sie scharf ist (0,7 s).
- **Der Ladebalken ist eine Lichtspur** wie der Lichtstreif um das Profilbild: ein Schweif in
  der Markenfarbe, der nach hinten ausläuft, ein weißer Funke mit violettem Hof als Kopf
  (`.sp-lade i::after`, pulsiert leise), und ein Glanz, der durch die Spur wandert
  (`spurGlanz`). Kommt er bei 100 % an, leuchtet der Funke einmal auf — `balkenZug()` setzt
  dafür `.voll`, nach `transitionend` oder spätestens nach der Zugdauer. Die Schiene darunter
  bleibt in der Textfarbe der Fassung. Was er anzeigt, ist unverändert der echte Start.

### Der Auftritt des Grußes *(26. September 2026)*

Vorher federte das Profilbild mit einer Drehung herein, der Text blendete auf, und nach 2,35 s
blendete alles gemeinsam aus. Jetzt läuft es in dieser Reihenfolge ab:

| ab | was geschieht |
|---|---|
| 0 s | Das Männchen des Vorspanns verschwimmt und wird kleiner (`uebergabeMark`), darüber blendet der Gruß auf |
| 0,1 s | Hinter dem Bild geht ein leiser Schimmer in der Markenfarbe auf (`.hallo-licht`) und atmet danach mit |
| 0,12 s | Das Profilbild kommt aus der Unschärfe, von leicht unten und etwas kleiner, **ohne Überschwingen** |
| 0,5 s | Der Name setzt sich Zeichen für Zeichen zusammen, jedes 34 ms nach dem vorigen, aus der Unschärfe |
| 0,75 s | Ein Lichtstreif läuft einmal um das Bild (`.hallo-komet`) |
| 1,05 s | Ein Glanz wandert über das Bild, der Satz darunter zieht sich zusammen wie ein Blick, der scharf stellt |
| 1,4 s | Das Bild schwebt fünf Pixel auf und ab, bis es weitergeht |
| 2,75 s | **Der Flug**: das Bild holt kurz Luft, hebt leicht ab und zieht in einem Bogen hinunter auf das Profilbild in der Leiste |

**Der Flug** (`halloFlug()`) ist das, was den Gruß mit der App verbindet: man sieht, wo das Bild
hingehört. Die Bahn ist eine quadratische Kurve mit dem Kontrollpunkt etwas rechts über dem
Start, die Zeit läuft über `kurve(.5, 0, .14, 1)` — ruhiger Abflug, zügige Mitte, lange weiche
Landung. Web Animations bekommt 49 fertig gerechnete Bilder und läuft linear; so bleibt die
Bahn eine Kurve, statt zwischen wenigen Stützpunkten zu knicken. Nebenbei nimmt das Bild die
Ecken des kleinen an (30 % → 17 von 48 px) und neigt sich in der Mitte um fünf Grad.

Währenddessen blenden Farbfläche, Text und Licht aus. **Der Kalender darunter bewegt sich
nicht.** Eine erste Fassung ließ ihn über `body.halloflug #v-cal` aus der Unschärfe auftauchen.
Das ersetzte `viewIn` auf `section.view.on`, und als die Klasse bei der Landung ging, lief
`viewIn` von vorn: der Kalender sprang 14 px hinunter und glitt wieder hoch. Dasselbe tat
seit Längerem `body.kalrein` am Ende des Funnels. Darum gilt: **keine Klasse gibt `#v-cal`
eine Animation** — `kalenderRein()` läuft über Web Animations, und nur, wenn nicht geflogen wird.

**Der Grund ist die Fläche der Hauptseite, sonst nichts.** Zwei Zwischenstände flogen wieder
raus: ein Lichtstaub aus kleinen violetten Punkten (passte nicht zur Fläche) und drei große
violette Lichtkegel darüber (zu kräftig, *„schaut etwas billig aus"*). Der Schimmer hinter dem
Bild steht auf `--licht-a` .22 dunkel und .13 hell, vorher .5 und .34. Das Profilbild in der Leiste und seine violette
Zahl sind so lange leer (`body.halloflug`); gelandet, kommt das echte Bild unter dem fliegenden
hervor, federt einmal nach, und die Zahl springt auf.

Damit das Bild bleiben kann, während alles andere geht, trägt der Gruß seine Farbfläche als
**eigene Lage** (`.hallo-grund.aurahg`), nicht mehr als Hintergrund der Bühne. Beim Abflug
steht das Farbwandern mit in der Animationsliste — ohne es sprang der Verlauf mitten im
Ausblenden auf Anfang.

**Abschied und Registrierung** *(26. September 2026)* tragen dieselbe Handschrift:

- **Abmelden** ist die Anmeldung rückwärts. `halloAnflug()` lässt das Bild aus der Leiste in
  einem Bogen in die Mitte fliegen, über dieselbe Bahn wie `halloFlug()`, nur rückwärts
  durchlaufen. Die Bühne blendet dafür nicht als Ganzes auf (`.hallo.kommt`), nur ihr Grund,
  in denselben 0,62 s — sonst käme das Bild halb durchsichtig an, und das Abmelden wartet
  weiter auf `GRUSS_REIN`. Name und Satz setzen später ein (`--hz-start`, `--zeile-start`).
  Zum Schluss **schläft das Bild ein** (`halloEinschlafen`: unscharf, etwas kleiner, sinkt),
  und erst danach geht die Fläche (`halloAbWeg`, 1 s, darum `GRUSS_WEG` = 1000).
- **Dabei behoben:** Der Zuhörer für `SIGNED_OUT` rief `loginScreen()`, sobald `signOut()`
  durch war — nachgemessen nach 8 ms, noch während der Abschied aufblendete. Die Anmeldeseite
  schien durch. Solange `doLogout()` läuft (`_meldetAb`), räumt jetzt nur es selbst ab: 667 ms.
- **Registrierung:** Der Lichtstreif zeichnet den Reif. Beide liegen auf derselben Form
  (`inset:-6%`), laufen über dieselbe Zeit und Kurve, und das Ende des Reifs sitzt am Ende
  des Schweifs. Ist der Reif zu, gehen zwei Lichtwellen in seiner Form vom Bild aus
  (`.hallo-welle`), das Bild atmet einmal auf (`halloPuls`) und das Licht dahinter blitzt
  (`lichtBlitz`). Konfetti und Haken sind raus. Das erste Bild der Wellen ist unsichtbar:
  mit `both` stand es sonst schon während der Wartezeit als dicker Rahmen da.

**Nach Ab- und Wiederanmelden fehlte das Profilbild** *(behoben 27. September 2026)*.
`doLogout()` versteckt `#avwrap`; zurück holte es `go()` mit `ME ? 'grid' : 'none'`. Diese
Zeile ging am 21. September beim Umzug in die Leiste verloren. Wer sich ohne Neuladen wieder
anmeldete, hatte kein Profilbild — und der Gruß kein Ziel, er blendete also wie früher aus.
Die Prüfung *Wieder angemeldet ist es zurück* in `test-kalender.js` spielt den Weg nach und
schlägt ohne die Zeile an (gegengeprüft).

**Kein Flug**, wenn die Leiste nicht zu sehen ist (`halloZiel()` gibt dann `null`): beim
Abmelden, unter einem Blatt, oder bei *weniger Bewegung*. Dann blendet alles gemeinsam aus
wie bisher. Ein Tippen auf den Gruß startet den Flug sofort (`grussEnde()` → `halloAbtreten()`).

### Überblendungen und die Kurve dafür

`--ease-out` ist `cubic-bezier(.16,1,.3,1)`, also Expo: nach einem Sechstel der Zeit ist fast
alles passiert. Für **Bewegung** ist das richtig — etwas kommt an und legt sich hin. Für
**Deckkraft** ist es falsch: das Bild ist sofort halb weg und zieht dann lange nach, was als
Zucken gelesen wird. Überblendungen nehmen deshalb `--ease-blend`, `cubic-bezier(.4,0,.6,1)` —
symmetrisch, in der Mitte am schnellsten.

**Und eine Falle, die beim Umbranden zugeschnappt ist.** Vier Flächen blenden auf und ab:
Vorspann, Gruß, Geburtstagskarte und das Schweinchen. Ihre `.on`/`.weg`-Regeln stehen weiter
oben in der Datei als `.aurahg`. `animation` ist ein **Kurzschreiben** — wer dort nur das
Wandern der Farben hineinschreibt, löscht damit das Auf- und Abblenden. Dazu schlägt
`#hallo.aurahg` (eine ID) die Regel `.hallo.on` (zwei Klassen). Nachgemessen war das Ergebnis:

| Fläche | war | ist |
|---|---|---|
| Vorspann aus | `splashOut` über **5 s** — die Dauer kam aus `#splash.aurahg`, gleich stark und weiter unten; abgeräumt wurde nach 1,15 s, also mitten im Bild | `splashOut` 1,1 s |
| Gruß ein/aus | gar keine Überblendung, er sprang | `halloRein` 0,62 s / `halloWeg` 0,9 s |
| Geburtstagskarte | gar keine, sie sprang | `qdoneIn` 0,3 s |
| Schweinchen | gar keine, es sprang | `bleibRein` 0,3 s / `bleibRaus` 0,5 s |

Die Flächen tragen jetzt **beide** Animationen nebeneinander:
`animation:var(--aura-anim), halloRein …`. `--aura-anim` hält das Wandern an einer Stelle,
damit es nicht viermal dasteht.

**Das Profilmenü ist Vollbild** und nach Themen gegliedert — Konto, Arbeitszeit, Einstellungen,
Sitzung. Das Menü blieb dabei dasselbe DOM: Alle Klick-Handler hängen delegiert an `#menu`, und
die Untermenüs liegen als Flächen darin. Kopiert man die Knöpfe woandershin, ist nichts mehr
verdrahtet.

**Nach rechts wischen heißt zurück** — aus einem Untermenü ins Menü, aus dem Menü in den
Kalender. Nur nach rechts: das ist die Richtung, in die der Pfeil oben links zeigt, und
dieselbe, die das Betriebssystem für *zurück* benutzt. Die Fläche hängt am Finger, ein Viertel
der Breite oder ein schneller Stups lösen aus, alles darunter federt zurück. Senkrecht bleibt
dem Rollen überlassen. Dasselbe Muster wie beim Monatsblättern im Kalender.

Ausgenommen ist der **Löschen-Griff** (`.dlz`) — der wird selbst nach rechts gezogen. Startet
der Wisch dort, passiert nichts; startet er daneben, geht das Löschen-Fenster zu. Das ist die
sichere Richtung: ein danebengegriffener Zug bricht die Löschung ab, statt sie auszulösen.

Drei Zeilen tragen einen **Schieberegler** statt eines Pfeils: Erscheinungsbild,
Monats-Erinnerung und Passkey. Der Stand steht in `aria-pressed` an der Zeile — das treibt das
Aussehen und ist zugleich die Auskunft für Vorleseprogramme. `aria-busy` hält ihn still,
solange gerechnet oder gefragt wird. **Kein Pfeil neben einem Regler:** der Regler ist die
Handlung, ein Pfeil daneben verspricht eine zweite Ebene, die es nicht gibt.

### Was beim Umbau auf Vollbild liegen blieb

Fünf Sachen stammten aus der Zeit, als das Menü ein kleines Fenster war, das rechts oben
aufklappte. Sie standen alle noch drin und sind am 13. September 2026 nachgezogen worden:

| war | warum das im Vollbild schiefging |
|---|---|
| `.menu-card{animation:pop}`, `transform-origin:100% 0` | Die ganze Seite fuhr aus der rechten oberen Ecke auf 94 % herein. Schlimmer: solange ein `transform` an der Karte liegt, richten sich alle `position:fixed`-Kinder nach *ihr* statt nach dem Fenster |
| `miIn{translateX(9px)}` an jeder Zeile | 9 px Überstand nach rechts beim Öffnen. `overflow-y:auto` rechnet `overflow-x:visible` zu `auto` um — die Seite war also seitlich scrollbar, und einmal geschoben blieb sie geschoben |
| Untermenüs `position:absolute` in `.mbody`, teils `inset:-4px -6px` | Sie begannen 201 px weit unten, waren so hoch wie der ganze Menüinhalt (806 px bei 812 px Schirm) und standen seitlich 6 px über |
| `.zurueckbtn` mit `left:7px;top:6px` | Sass im Nichts und scrollte weg |
| `zurueckInsMenu()` mit 170 ms Halteschicht | Die Pause sollte den unscharfen Hintergrund halten, bis das kleine Fenster wieder aufgeht. Bei einer deckenden Seite sah man in diesen 170 ms schlicht den Kalender — der kleine Sprung beim Zurückgehen |

Dazu zwei Fallen, die nichts mit dem Umbranden zu tun haben:

- **Der Schließen-Knopf ging oft nicht.** Der Handler prüfte `e.target.dataset.close`. Der Knopf
  trägt aber ein SVG, das ihn fast ganz ausfüllt — getroffen wurde also meist das `<path>` darin,
  und dessen `dataset.close` ist leer. Jetzt `e.target.closest('[data-close="menu"]')`.
- **Ein `z-index` wirkt nur im eigenen Stapel.** Die Untermenüs liegen in `.mbody`, und `.mbody`
  bekommt durch seine Einblendung (eine Animation auf `opacity`) einen eigenen Stapel. Ihr
  `z-index:6` zählte nur dort drin — die Fußzeile *Eine App von Studio MARU* steht im Quelltext
  nach `.mbody` und lag damit obenauf: sie schien mitten durch das Löschen-Fenster. Solange eine
  Fläche offen ist, hebt sich deshalb `.mbody` als Ganzes.

Und einer im Profilbild: der Rahmen lag als `border` am Kasten. Ein `border` schiebt den
Inhaltsbereich um seine Breite nach innen — das Bild füllte also nur 82 von 84 px, und
dazwischen blitzte der weiße Grund als 1-px-Ring durch. Im Dunkeln ging der im hellen Rand
unter, im Hellen stand eine weiße Linie im dunklen Rand. Der Rahmen liegt jetzt als `::after`
über dem Bild.

**Beim Umfärben zu beachten:** Farben, die doppelt gedeutet wurden, fallen auseinander. Das alte
Gold war Marke *und* Urlaubsfarbe, ein Fast-Weiß war Schriftfarbe *und* Fläche, ein Blau war
Arbeitszeit *und* Zeitausgleich. Alle drei sind jetzt getrennt benannt. Und: `!important` schlägt
jede Animation — eine so übersteuerte Eigenschaft friert ein.

### Nochmal auf den Kalender tippen

Steht man schon auf dem Kalender und tippt den Tab unten erneut, kommt der **laufende Monat**
zurück und lädt sich sichtbar neu — dieselbe Geste wie in jeder Tab-Leiste. Der Heute-Knopf
oben rechts ruft dieselbe Funktion, `kalenderFrisch()`; zwei Wege, ein Verhalten.

Drei Dinge, die dabei zählen:

- **Nur wenn man schon darauf steht.** Wer vom Export kommt, will die Ansicht wechseln und den
  Monat wiederfinden, in dem er war. Gemerkt wird das *vor* `go()`.
- **Nicht im Zeitraum-Modus und nicht mitten im Blättern.** Dort ist der Kalender die
  Auswahlfläche; ein Monatssprung wäre ein Verlust.
- **Das Datum wird frisch geholt**, nicht aus `NOW`. `NOW` steht seit dem Laden fest; wer MOJI
  als Symbol am Bildschirm hat, lässt die App über Wochen offen und landete sonst im falschen
  Monat. `renderCal()` rechnet den heutigen Tag ohnehin frisch aus.

Die Bewegung nimmt `--ease-blend`, nicht `--ease-out` — siehe *Überblendungen und die Kurve
dafür*. Mit Expo war das Gitter nach 150 von 500 ms schon bei 90 % Deckkraft und das Neuladen
las sich als Blinzeln. Jetzt: 0,15 / 0,27 / 0,57 / 0,88 / 1,00 über 550 ms.

### Hell und Dunkel umschalten

**Den Schalter gibt es an zwei Stellen:** im Profilmenü und — als Sonne beziehungsweise Mond —
oben rechts am Einstiegsbildschirm. Beide laufen über dieselbe Routine.

**Der Schalter lädt die Seite neu.** Zwei Gründe:

1. Die **Statusleiste des Betriebssystems** übernimmt `theme-color` nur beim Laden. Ändert man
   das Meta später, bleibt sie am Startbildschirm in der alten Farbe stehen.
2. Der Wechsel wird dadurch ein Schnitt statt eines Umspringens von hundert Einzelteilen.

Damit das nicht wie ein Absturz aussieht, läuft es in dieser Reihenfolge: Fassung anlegen (der
Schalter bewegt sich, die App färbt um) → Wahl sichern → ein Deckel in der **neuen** Farbe
blendet auf → neu laden. Ein Vermerk in `sessionStorage` (`moji.fassung`) sorgt dafür, dass
danach **weder Vorspann noch Gruß** kommen — acht Sekunden für eine Schalterumlegung wären
absurd. `FASSUNG_NEU` liest ihn beim Start einmal und löscht ihn sofort.

Vor dem Neuladen wird noch **hochgeladen**, falls etwas offen ist: die Sammelroutine sendet
verzögert, sonst fände ein zweites Gerät die alte Fassung vor. Hängt die Verbindung, geht es
nach 1,4 s trotzdem weiter — die Wahl liegt ja schon im Gerätespeicher und im Profil.

**Nach dem Neuladen deckt ein Deckel die Lücke.** Bis `go()` die erste Ansicht setzt, vergeht
Zeit — dazwischen liegt das Laden der Cloud-Bibliothek, also das Netz. In dieser Lücke stand die
**Kopfleiste über einer leeren Seite**: die Anmeldeseite braucht sie nicht, sie war nur da, weil
`go()` noch nicht gelaufen war. Am Handy las sich das, als blitze kurz der Kalender auf — und
zwar *oft, aber nicht immer*, je nach Verbindung. `vorspannUeberspringen()` legt deshalb den
Deckel des Wechsels gleich wieder an, in der **neuen** Farbe; `go()` nimmt ihn weg, sobald etwas
dasteht. Eine Notbremse nach vier Sekunden sorgt dafür, dass er nie liegen bleibt.

**Milchglas braucht eine gleichmäßige Tönung.** Die Kopfleiste hatte einen Verlauf im Grund —
am Handy von 66 auf 26 Prozent hinunter — bei überall gleich starkem Weichzeichner. Unten sah
man dadurch durch eine fast ungetönte, aber kräftig verwaschene Schicht, und direkt darunter war
der Inhalt wieder gestochen scharf. Das las sich als **Schliere quer über den Kopf**, und was
dort sitzt — ein Zurück-Knopf etwa — stand zur Hälfte darin. Seit 20. September 2026 ist die
Tönung flach (`.78`, am Handy `.72`), der Weichzeichner bleibt. Eine Scheibe, kein Schmierer.

Die beiden Leisten, die **absichtlich auslaufen** — die Fußzeile mit *Kalender/Export* und die
klebende Knopfzeile im Funnel —, tragen dafür **gar keinen Weichzeichner mehr**. Ihr Verlauf
beginnt bei null; ein gleich starker Weichzeichner darüber erzeugte oben dieselbe Schliere. Der
Verlauf allein reicht, er endet ohnehin bei 94 Prozent.

**Wer vor der Anmeldung umlegt, dessen Wahl wandert mit.** Am Einstieg ist noch kein Profil da,
die Wahl liegt also nur im Gerät. `erscheinungUmschalten()` legt sie in diesem Fall zusätzlich
unter `moji.fassung.wahl` in den `sessionStorage`; `erscheinungAusProfil()` holt sie beim ersten
Profil heraus, schreibt sie hinein und löscht den Vermerk. Umgekehrt gilt weiterhin das Profil:
ohne Vermerk zieht die App den Stand aus `ME.erscheinung`.

**Die Fassung steht jetzt vor dem ersten Anstrich.** Ein kleines Skript im `<head>`, noch vor
dem Stilblock, liest `moji.erscheinung` und setzt `data-theme` *und* `theme-color`. Bisher tat
das ein Skript ganz am Ende der Seite — bis dahin war schon hell gezeichnet, und wer dunkel
eingestellt hat, sah bei **jedem** Start ein weißes Aufblitzen. Beim Umschalten, das die Seite
absichtlich neu lädt, wäre das der auffälligste Moment überhaupt gewesen.

> **Offen:** `apple-mobile-web-app-status-bar-style` steht fest auf `black-translucent`. Das
> heißt: am Startbildschirm läuft der Inhalt unter die Statusleiste und deren Schrift ist
> weiß — in der hellen Fassung also weiß auf hell. Ein Umstellen auf `default` würde das lösen,
> ändert aber das Layout (`env(safe-area-inset-top)` fällt auf 0) und ließ sich hier nicht am
> echten Gerät prüfen.

### Das Osterei

Ein Tipp auf den **MOJI-Schriftzug** oben: der macht Platz nach rechts, das Maskottchen kommt
von links heraus, wackelt kurz und verschwindet wieder. Kein Hinweis darauf, keine Beschriftung
— es soll gefunden werden, nicht angeboten. 2,5 Sekunden, danach steht alles wie vorher.

**Es kommt auch von selbst vorbei.** Seit 14. September 2026: das erste Mal nach **1 bis 2½
Minuten**, danach irgendwann zwischen **4 und 9 Minuten**, jedes Mal neu gewürfelt. Ein fester
Takt wäre ein Uhrwerk, und ein Uhrwerk überrascht niemanden. Die meisten Besuche sind kurz —
darum kommt das erste früh, damit es überhaupt jemand zu sehen bekommt.

Von selbst aber nur, wenn der Schriftzug wirklich dasteht (`eiFrei()`): nicht während des
Vorspanns oder des Grußes, nicht auf den Seiten ohne Kopfleiste (Einstieg, Funnel, Assistent,
Dienstzeiten), nicht hinter einem offenen Blatt oder Menü, nicht im Zeitraum-Modus, nicht bei
ruhender Seite und nicht, wenn jemand weniger Bewegung eingestellt hat. Eine Überraschung
hinter einem Blatt ist keine — sie ist nur verbraucht.

Drei Dinge, die dabei zählen:

- **Der Untertitel blendet weg.** Nachgerechnet: auf einem 375er-Schirm bleiben neben
  Schriftzug, Untertitel und Profilbild nur rund 24 px Luft. Schöbe man beide um 34 px nach
  rechts, läge *Mehr Zeit fürs Wesentliche* unter dem Profilbild.
- **Zwei Ebenen, zwei Animationen.** Die Hülle (`.bmoji`) kommt und geht, das Bild darin
  wackelt. Beides in eine Animation zu legen hieße, Verschieben und Drehen in jedem
  Zwischenschritt von Hand zu mischen.
- **Das Bild kommt erst beim ersten Mal** und die Bewegung wartet auf `img.decode()`. Sonst
  schleppt jeder Start 16 KB mit, die niemand sieht — und die Hülle startet mit 0 px Höhe, das
  Männchen erschiene mittendrin. `aspect-ratio:120/98` hält die Höhe zusätzlich stabil.

`LOGO_MOJI` ist **nur das Männchen**: Körper, Gesicht, grüner Punkt und der weiße Umriss
drumherum, weder Kachel noch Hintergrund. Freigestellt wurde es, indem der Verlauf der Kachel
**gemessen und abgezogen** wurde: aus einem Ring am Kachelrand — garantiert reine Kachel — je
Kanal eine Ebene angepasst und über das Feld fortgeschrieben. Was heller ist als diese Ebene
(der weiße Umriss) oder kräftig gesättigt (Körper, Punkt), ist das Männchen. Der Schlagschatten
fällt heraus, weil er *dunkler* und entsättigt ist — auf hellem Grund wäre er ein grauer Hof.
Augen und Mund holt ein Löcherfüllen zurück, sie liegen mitten im Körper.

Ein einfaches Fluten vom Rand her scheiterte zweimal: erst lief es durch die weichgezeichnete
Kante (99,8 % der Kachel weg, das Männchen mit), dann blockierte der helle Ring der Kachel es
(nur die Ecken weg). Weiß und die blasse Kachel sind beide entsättigt — über Farbe allein
lassen sie sich nicht trennen.

**Seit 26. September 2026 ist das ein neues Bild**, und das Herausrechnen ist Geschichte. Es war
nie ganz sauber: der weiße Rand franste aus, auf dunklem Grund blieb ein grauer Saum, und die
Farben waren blass, weil ein Teil der Kachel mit in den Körper gerechnet war. Das neue kommt
freigestellt aus der Vorlage — satte Farben, feine Körnung, ein dünner grauer Umriss um den
weißen Rand. Das alte schnitt außerdem den Rand unten links ab; das neue zeigt den ganzen
Sticker.

Es ist **in dasselbe Verhältnis 385:315 eingepasst**, mittig mit transparentem Rand. Dieses
Verhältnis steht an fünf Stellen fest im CSS (`aspect-ratio`), und so gilt es überall weiter, ohne
dass eine Regel angefasst werden musste — im Vorspann, am Osterei, im Postfach, in den
Blattmarken. **578 × 473 Pixel**, weil der Vorspann das Bild bei 141 bis 173 px zeigt; auf einem
dreifachen Schirm sind das bis zu 519 Pixel. Die Körnung komprimiert schlecht: 32 KB bei
WebP-Qualität 78 statt 10 KB — aber 78 ist von 90 im direkten Vergleich nicht zu unterscheiden,
und 90 hätte 56 KB gekostet.

### Serien — ein Zeitraum ist mehr als seine Tage

Ein Zeitraum schrieb bisher jeden Tag einzeln in `ME.events`; dass sie zusammengehören, stand
nirgends. Wer einen davon zurücksetzte, bekam ein Loch mitten im Urlaub und musste die übrigen
von Hand nachziehen.

Seit 13. September 2026 trägt jeder Tag aus einem Zeitraum eine Kennung: `ser` = erster Tag
`>` letzter Tag, also `2026-09-14>2026-09-25` — lesbar, auch in der Datenbank. Wird ein Tag
mit Serie zurückgesetzt, fragt MOJI: **nur diesen Tag** oder **alle N Tage**.

**Zwei Wege, eine Serie zu finden** (`serieVon(y, m, d)`):

1. **Mit Kennung** — alle Tage mit derselben `ser`.
2. **Ohne** — vom angetippten Tag nach beiden Seiten laufen, solange der Nachbar denselben
   Eintrag trägt (gleicher Typ, gleicher Umfang, gleicher Text). Das ist nötig, weil alles,
   was vor dem 13. September eingetragen wurde, keine Kennung hat.

Der zweite Weg hat eine Regel, auf die es ankommt: **Tage ohne Dienst werden übersprungen, ein
freier Arbeitstag beendet die Serie.** Ein Urlaub über zwei Wochen hat am Sonntag keinen
Eintrag — er ist trotzdem eine Serie. Ein Arbeitstag ohne Eintrag mittendrin ist dagegen eine
echte Lücke: dort wäre ein Eintrag zu erwarten gewesen. Was als Dienst gilt, entscheidet
`qTouched()` aus dem Dienstplan — beim Vorgabeplan von Miller Optik also auch der Samstag.

**Beim Löschen fliegen die Tage weg.** `tageLoeschen(keys, wort)` zeichnet die Kacheln erst mit
`.weg` (45 ms Versatz je Tag, bei elf gedeckelt), lässt sie schrumpfen und ausblenden — und
löscht **erst danach**. Umgekehrt schrumpften leere Kacheln: das Zeichen muss noch da sein,
während es geht. Solange das läuft, sperrt `_wegBusy` das Öffnen eines Tagesblatts — die
Einträge stehen ja noch, das Blatt zeigte etwas, das es gleich nicht mehr gibt.

### Dienstzeiten mit Datum

Wer seine Arbeitszeiten ändert, bekommt alte Monate **nicht** mit dem neuen Plan gerechnet.
Ein im März abgegebenes Blatt zeigt im Dezember noch dieselben Stunden.

Gespeichert wird sparsam: `sched` bleibt der Plan, der **jetzt** gilt. Daneben liegen in
`schedAlt` die abgelösten Fassungen, jede mit dem Tag, an dem sie endete — aufsteigend und
lückenlos:

```
schedAlt: [ { bis:'2026-09-30', sched:{…} },      ← gilt bis einschließlich 30.09.2026
            { bis:'2026-12-31', sched:{…} } ]     ← gilt 01.10. bis 31.12.2026
sched:    {…}                                     ← gilt ab 01.01.2027
```

`schedFuer(profil, datum)` liefert den Plan dieses Tages; `evalDay()` fragt dort, und damit
auch Kalender, Summen und PDF-Export. Profile ohne `schedAlt` verhalten sich exakt wie vorher.

**Beim Speichern fragt MOJI**, weil sich die Absicht nicht erraten lässt:

| Antwort | Wirkung |
|---|---|
| *Nur korrigieren* | überschreibt den aktuellen Plan rückwirkend — für Tippfehler |
| *Ab einem Datum* | legt eine neue Fassung an, Vorschlag ist der nächste Monatserste |

Wer nur den Reiter umgestellt hat, sieht keine Frage: `schedGleich()` vergleicht nur Zeiten und
Rhythmus, keine Bedienspuren. Ein Wechseldatum **vor** einer bestehenden Grenze wird abgelehnt —
sonst wäre nicht mehr klar, welcher Plan dazwischen galt.

Unter *Dienstzeiten* steht der **Verlauf**: jede Fassung mit Zeitraum und Wochenstunden, die
aktuelle hervorgehoben. Eine Fassung lässt sich entfernen; ihre Zeit fällt dann an die
nächstjüngere, damit keine Lücke entsteht. Ohne diese Liste stünde ein versehentlich falsch
gesetztes Datum für immer fest.

Nicht betroffen ist `tagStunden()` — die Umrechnung von Urlaubsstunden in Tage nimmt bewusst
den **heutigen** Plan, denn der Anspruch gilt jetzt.

### Wochenrhythmus

Bei mehr als einer Woche muss MOJI für jeden Tag wissen, welche Woche des Rhythmus gilt.
Gerechnet wird das in **`wochenNr()`**: Wochen werden fortlaufend durchgezählt seit Montag,
1. Jänner 2024, in UTC und auf den Montag abgerundet, damit Sommerzeit nichts verschiebt.
Die eine Stelle, die daraus die Rhythmuswoche macht, ist `rhythmusWoche(sched, datum)` —
Kalender, Profilmenü und PDF-Export fragen alle dort.

**Nicht die Kalenderwoche.** Genau daran ist es bis September 2026 gescheitert: Jahre wie
2026 haben **53** Kalenderwochen, und auf KW 53 folgt KW 1. Bei zwei Wochen Rhythmus ergibt
`(53−1) % 2` dasselbe wie `(1−1) % 2` — dieselbe Woche zweimal hintereinander, und ab da läuft
alles um eine Woche verschoben. Aufgefallen an Samstag, 9. Jänner 2027, der frei anzeigte,
obwohl er Arbeitstag wäre. Der Versatz hätte bis 2033 gehalten, im Kalender wie im Export.
`isoWeek()` gibt es weiterhin, aber nur noch zum **Anzeigen** („gerade läuft KW 37").

**Der Versatz** steht als `sched.offset` im Profil und zählt gegen `wochenNr()`.
`sched.basis = 'lauf'` merkt sich, dass die Umrechnung schon gelaufen ist; Profile von vorher
werden in `normalize()` **einmalig** umgerechnet, so dass am Tag der Umstellung dieselbe Woche
läuft wie vorher. Bereits exportierte Monate werden nicht rückwirkend verändert — ein
abgegebenes Blatt nachträglich umzurechnen hilft niemandem.

### Der Kopf ist die Karte

Seit 20. September 2026 beginnt das Profilmenü mit der **Mitgliedschaftskarte**. Davor standen
dort zwei Kästen — einer mit Name und Bild, einer mit der Stufe — und die Karte lag hinter einem
eigenen Menüpunkt: dreimal dieselbe Person, drei Kanten, drei Rundungen.

Jetzt ist es ein Stück: Bild, Name, Firma, Adresse, Postfach und Sicherungsstand, rechts die
Plakette, darunter die Leiter und unten das **dunkle Band** mit der Wortmarke und dem Stand der
Sammlung (*10 von 12 Karten*). Ein Druck darauf öffnet die Karte.

**Die Farbe kommt aus der Stufe** (`--pa`/`--pb`, dieselben Pastelltöne wie die große Karte).
Wer aufsteigt, sieht es beim Öffnen des Menüs und nicht erst in einem Kasten weiter unten.

**Die Tinte ist eine eigene** (`--ma-ink`), nicht `--f-2`. Das ist ein Kartentoken und in der
hellen Fassung fast Weiß — der Name wäre unsichtbar gewesen. Der Grund ist in beiden Fassungen
hell, weil `--pa` 84 % Weiß unter die Stufenfarbe mischt; ein fester dunkler Wert passt also.

**Gedrückt wird die ganze Fläche**, und die liegt als eigener Knopf *unter* dem Inhalt
(`.ma-flaeche`, `z-index:0`). Profilbild und Postfach behalten ihre eigenen Knöpfe und holen sich
`pointer-events:auto` zurück — Knöpfe ineinander gibt es in HTML nicht.

**Die Plakette trägt die Farbe ihrer Stufe.** Sie saß mit 82 % Tinte wie ein schwarzer Fleck in
der Ecke; jetzt `--rd`, die dunkle Farbe des Rangs — sie gehört ja zu ihm. **Dasselbe für das
Band unten:** Schwarz saß auf dem hellen Pastell wie ein Riegel und verschwand in der dunklen
Fassung im Grund der Seite.

**Und der Glanz wandert auch hier.** Dasselbe schmale Lichtband wie auf der großen Karte zieht
quer über den Kopf — er *ist* ja die Karte, also soll er sich auch so verhalten. Es lag zuerst
als fester Verlauf darauf und stand still. Die Bewegung hängt an `.menu.on:not(.zu)`: bei
geschlossenem Menü liefe sie unsichtbar weiter und kostete bei jedem Bild Arbeit.

**Der Druck geht über `scale`, nicht über `transform`.** Der Einlauf des Menüs
(`miInVoll`) läuft als Animation über `transform` — und eine Animation schlägt jede normale
Regel. Ein `transform:scale()` beim Andrücken kam deshalb nie an. Die eigenständige Eigenschaft
`scale` kommt ihr nicht in die Quere. Und gedrückt bleibt er, **solange der Finger liegt**: ein
Stups nach fester Uhr (220 ms) war beim Tippen vorbei, bevor man ihn sah.

Mitgegangen ist die **Liste aller Stufen**: Sie hing an der Stufenleiste, die es nicht mehr gibt.
Sie war kurz ein dritter Knopf in der Kartenleiste — ein Blatt, das aus einem Blatt aufgeht, und
in einer Zeile für zwei Knöpfe. Jetzt ist sie eine **gewöhnliche Menüzeile** (*Alle Stufen*) und
zieht dieselbe Fläche auf wie *Zeitausgleich*: im Menü, nicht darüber.

### Der Stapel

Hinter dem Kopf liegt seit 20. September 2026 kein einzelnes Blatt mehr, sondern **zwölf
Karten — eine je Stufe**. Die erreichten in ihrer Farbe, die kommenden hinter einem Schloss.
Gewischt wird seitlich, eingerastet auf jeder Karte.

**Drei Zustände, immer derselbe Aufbau** — Band, Fenster, Name, ein Fach —, damit beim Wischen
nichts springt. Nur was im Fach steht, wechselt:

| | Fach | dazu |
|---|---|---|
| **erreicht** | *Geschafft mit 36 Monaten* | ein Stempel oben rechts |
| **aktuell** | die gesparte Zeit | — |
| **verschlossen** | *noch 1 Monat · ab 40* | ein Schloss über dem Tier, grau statt farbig |

**Eine Leiter gibt es nicht mehr.** Sie stand nur auf der aktuellen Karte und machte sie 50 px
höher als alle anderen — beim Wischen sprang die Reihe. Die Auskunft war ohnehin doppelt: die
nächste Karte sagt, wie viel noch fehlt. Nachgemessen sind jetzt **alle zwölf 499 px** hoch.

**Die Farben soffen nach unten ab.** Der Verlauf lief von der Rangfarbe nach fast Schwarz — 58 %
Schwarz beigemischt. Weil Name, Fach und Fuß alle unten liegen, war genau dort von der Farbe
nichts mehr übrig, und aus der Entfernung sahen alle zwölf gleich dunkel aus. Jetzt sind es drei
Halte **um die Rangfarbe herum**: oben 12 % aufgehellt, in der Mitte die Farbe selbst, unten 26 %
tiefer. Die Karte bleibt überall bunt.

Weiter hinauf geht es nicht. Die Schrift ist weiß, und die helle Rangfarbe (`--rf`) trägt sie
nicht mehr — nachgerechnet 2,6:1 bei Blau und 1,7:1 bei Gelb. Die satte (`--rf2`) trägt sie mit
2,4 bis 5:1, und ein zarter Schatten unter der Schrift macht den Unterschied dort, wo es knapp
ist. Er kostet nichts an Farbe.

**Zwei Sonderregeln für die Legende sind weggefallen** — eine goldene mit festen Werten und eine
graue, die sie für die verschlossene Karte wieder zurücknahm, weil `faerbe()` die Goldklasse an
beide hängt. Das Schema macht die Legende von selbst golden, und `.kt.zu` bleibt grau, weil
nichts mehr danach kommt. **Das geteilte Bild nimmt dieselben drei Halte**, sonst teilt man ein
Bild, das dunkler ist als das, was man vor sich hat.

**Das Fußband nimmt die Fassung auf** (`--kt-band`): im Hellen hell durchscheinend, im Dunkeln
grau. Vorher lag dort Schwarz mit 34 % — auf einer farbigen Karte ein harter Riegel, der lauter
war als alles darüber.

**Das Tier ist groß.** Von allem, was MOJI hat, erkennt man die Tiere am schnellsten wieder —
116 Stück, jedes ein eigenes. Eine Karte, auf der das Tier klein in der Ecke sitzt, verschenkt
das.

**Das Wischen macht der Browser** (`scroll-snap-type: x mandatory`). Das ist auf dem Telefon
flüssiger, als es eine gerechnete Bewegung je wäre: es klebt am Finger und läuft mit dem Schwung
weiter. Dazu kommt nur die **Tiefe** — die Karte in der Mitte steht voll da, die Nachbarn treten
zurück. `kartenTiefe()` setzt dafür `--nah` (0 bis 1) je Karte, und zwar **einmal je Bild**
(`requestAnimationFrame`), weil ein Scroll-Ereignis öfter feuert als der Schirm zeichnet.
Angewendet wird es über `scale`, nicht `transform` — sonst fahren Einlauf-Animationen dazwischen.

**Zwei Fallen, beide nachgemessen:**

- `faerbe()` hängt die Goldklasse an **jede** Karte der zwölften Stufe, auch an die verschlossene.
  Eine verschlossene Legende, die golden leuchtet, wäre ein Versprechen, das die Karte nicht
  halten kann — `.kt.zu.gold` setzt sie wieder auf Grau.
- Die Karten stehen nebeneinander und werden alle so hoch wie die höchste, denn nur die aktuelle
  trägt die Leiter. Ohne `margin-top:auto` klebte das dunkle Band bei den anderen mitten in der
  Karte.

**Dreimal dieselbe Liste ist weggefallen.** Die Stufen gab es als Fläche im Menü (`rangbox`), als
eigenes Blatt (`rsheet`) und kurz als Knopf in der Karte. Der Stapel ist alle drei: er zeigt jede
Stufe, ihren Namen, ihren Satz und was sie kostet.

**Beim Wischen drehen sich die Karten leicht mit** (`--seite`, der vorzeichenbehaftete Abstand
zur Mitte, mal 16 Grad). Das sieht nicht nur besser aus — es sagt auch, dass die Karte eine
Rückseite hat. Ohne diesen Hinweis kam niemand auf die Idee, sie umzudrehen. Beim Aufschlagen
stupst die vordere Karte zusätzlich einmal an. Während gewischt wird, läuft die Drehung **ohne
Übergang** (`.kt-bahn.wischt`) — sonst liefe sie dem Finger hinterher, genau wie vorher die
Größe.

**Die Vorderseite füllt die Karte** (`flex:1`). Die Karten werden alle so hoch wie die höchste;
ohne das blieb unter dem Band ein Streifen blanke Karte stehen, und weil das Band durchscheinend
ist, sah es aus, als lege es sich über das Fach darüber. Dass eine Karte überhaupt höher wurde,
lag am Fach: bei *Geschafft mit 20 Monaten* rutschte der Wert in eine zweite Zeile. Jetzt bricht
dort nichts mehr um.

**Umdrehen gibt es weiterhin.** Ein Tipp dreht die Karte, die vorne liegt — hinten das Zeichen
als Prägung, darunter *Mitglied seit*, *Abgegeben*, *Zuletzt* und *Dafür nötig*, und ganz unten
der Satz der Stufe. Ein Tipp auf eine halb sichtbare Karte daneben **holt sie erst in die
Mitte**: sonst dreht man Karten um, die man gar nicht anschaut.

**Der Glanz wandert nur auf der vorderen Karte** (`.kt.vorn`). Zwölf laufende Lichtbänder wären
Arbeit für nichts — elf davon sieht niemand.

**Und das Ruckeln kam vom Übergang.** Auf `.kt` lag ein `transition:scale .18s`. Während des
Wischens wird `--nah` bei *jedem Bild* neu gesetzt; der Übergang fing bei jedem dieser Werte von
vorne an und lief dem Finger hinterher. Ohne ihn folgt die Größe dem Scrollen unmittelbar.

**Das Aufschlagen kommt aus der Karte im Menü.** Vorher blendete der Stapel nur auf und stand
schlagartig da. Jetzt misst `mkvFlug()` beide Rechtecke — die Karte im Menükopf und den Stapel an
seinem Platz — und fährt die Strecke dazwischen ab: nachgemessen 299 px nach oben, Start auf 96 %,
620 ms auf einer Expo-Kurve. Nach 90 ms ist der Weg schon zu zwei Dritteln gemacht, den Rest legt
sich die Bewegung nur noch hin. Es ist dieselbe Karte, also ist es dieselbe Bewegung. Zurück geht
es in 300 ms und wieder auf das Menü zu. Kommt der Aufruf nicht aus dem Menü, sondern von der
Aufstiegsfeier, gibt es keine Fläche, aus der etwas kommen könnte — dann nur ein kurzes
Aufsteigen. Wer Bewegung abgestellt hat, bekommt keine.

**Und beim zweiten Öffnen waren die Karten weg.** Der Rückflug hält seinen Endzustand fest
(`fill:both`), sonst blitzten die Karten beim Schließen noch einmal auf — aber er blieb danach als
fertige Animation am Element hängen. Der Hinflug hält nichts fest, also gewann nach seinem Ende
wieder der alte Endzustand: Deckkraft 0. Nachgemessen trat es ab der zweiten Runde auf, jedes Mal.
`mkvRuhe()` bricht deshalb vor jedem Flug ab, was noch am Element liegt, und der Timer beim
Schließen räumt ebenfalls auf. Der erste Riegel ist der wichtige: wer gleich wieder aufmacht,
kommt dem Timer zuvor. Fünf Runden im Browser nachgeprüft, eine davon hastig mitten in der
Schließbewegung — jedes Mal volle Deckkraft.

**Die Plakette schlug durch die Karte.** *Erreicht* stand beim Umdrehen spiegelverkehrt auf der
Rückseite. `.kt-vorn` erzeugte keinen Stapelkontext — `position:relative` allein reicht dafür
nicht —, also sortierte sich jedes Kind mit `z-index` in den Kontext der Drehbühne ein, und die
trägt `preserve-3d`. Dort stand die Plakette als eigenes Objekt im Raum, mit eigener Rückseite.
`isolation:isolate` auf beiden Seiten hält die Kinder in der Ebene ihrer Seite.

**Und sie lag auf dem Zähler.** Oben rechts steht im Band die Nummer der Karte; die Plakette saß
17 px daneben. Jetzt sitzt sie **im Fenster**, wo oben Platz ist, weil das Tier tief im Bild
steht — als Glasplakette statt als weißer Fleck.

**Die Rückseite war nach oben gedrückt.** Prägung, Titel und die vier Zeilen standen dicht
gedrängt unter dem Rand, darunter blieb ein Loch, und ganz unten hing der Satz. Die Rückseite ist
so hoch wie die Vorderseite — der Platz war da, nur nicht verteilt. Jetzt nimmt der Datenblock
(`flex:1`) den Rest ein und teilt ihn gleichmäßig auf: nachgemessen **61, 61, 61, 60 px**. Das ist
die Ordnung, die ein Ausweis hat, ein Feld pro Zeile. Die Werte stehen in der Display-Schrift mit
gleich breiten Ziffern, die letzte Linie schwebt nicht mehr frei, und der Satz unten sitzt an
einer eigenen Kante. Dazu hat jede Karte jetzt **eine Haarlinie innen** — gedruckte Karten haben
eine Kante, Flächen auf dem Schirm nicht.

**Das Fach saß auf der Kante.** Auf der aktuellen Karte — der höchsten der Reihe — bleibt für das
`margin-top:auto` am Fußband nichts übrig, also stand *Zeit gespart* genau auf dem Band. Die 15 px
stehen jetzt fest am Fach.

**Quer über die Ansicht lief eine harte Kante.** Über der Kartenunterkante war der Grund getönt,
darunter abrupt hell — und das über die ganze Breite, auch neben den Karten. Es war der
abgeschnittene Schatten: er reicht 58 px unter die Karte (`0 26px 56px -24px`), die Bahn ließ ihm
aber nur 4 px und schnitt ihn mit `overflow-y: hidden` glatt ab. Jetzt sind es **48 px**, der
Schatten läuft weich aus, und zwischen Karte und hellem Bereich steht Luft. Die Karten bleiben
gleich groß.

**Und der Block unter der Karte hing an ihr.** Punktreihe und Hinweis klebten 12 px unter der
Karte, darunter blieb ein Loch bis zu den Knöpfen. Jetzt nimmt die Kiste die ganze Höhe und zwei
`auto`-Abstände teilen den freien Raum: einer über der Titelzeile, einer zwischen Karte und
Punktreihe. Nachgemessen auf dem Telefon: **63 px** Luft unter der Karte, **29 px** über der
Leiste.

### Die Wortmarke in der Kopfleiste

**In der vom Homebildschirm gestarteten App war der Schriftzug weich**, unten fast verschwommen —
in Safari nicht. Die Unterzeile *Mehr Zeit fürs Wesentliche* daneben stand dabei gestochen scharf.
Das war der Hinweis: Beide sitzen in derselben Kopfleiste, aber nur der Schriftzug trug einen
Filter. Die Wortmarke liegt als weißes Bild vor und wurde auf Hell per `filter:invert(1)`
umgedreht — mitten in einer Leiste aus Milchglas (`backdrop-filter`). Einen Filter in einer
Filter-Ebene rastert WebKit gern in niedriger Auflösung, und in der installierten App offenbar
anders als im Browser.

Seit 26. September 2026 gibt es **eine zweite, fertig schwarze Datei** (`LOGO_WORD_TINTE`, 3 KB),
und `anwenden()` setzt mit der Fassung die passende. Kein Filter mehr. Der alte Kommentar an der
Regel hatte es schon gesagt: *sauberer wäre eine zweite Datei … aber fürs Ansehen genügt das.*

Im Browser ließ sich der Fehler nicht nachstellen — Chromium rastert das anders als WebKit auf dem
iPhone. Nachgeprüft ist, dass kein Filter mehr am Schriftzug liegt und beide Fassungen die
richtige Datei bekommen, auch beim Wechsel ohne Neuladen; eine Nachstellung mit 59 px
Statusleiste zeigte, dass keine Schicht über dem Schriftzug liegt.

**Das reichte nicht, und die zweite Vermutung war auch falsch.** Unter iOS 27 blieb der Kopf
unscharf. Als Nächstes war das Milchglas dran: eine deckende Kopfleiste nur für die installierte
App. Auch das änderte nichts — und das nächste Bildschirmfoto zeigte warum: **Die Überschrift
„Meine Firma" war genauso weich**, und die steht weder in der Kopfleiste noch trägt sie einen
Filter. Am Bild nachgemessen: die Oberkanten der Buchstaben weich (Kantenstärke 92 von 255), die
Unterkanten scharf (255). Ein Weichzeichner, der von der Statusleiste nach unten ausläuft.

**iOS 27 zeichnet in vom Homebildschirm gestarteten Web-Apps alles weich, was unter der
Statusleiste liegt.** Und die Seite sagte iOS ausdrücklich, dass sie dort liegen will:
`apple-mobile-web-app-status-bar-style` stand auf `black-translucent`, zusammen mit
`viewport-fit=cover`. Seit 26. September steht es auf **`default`** — die Statusleiste bekommt
ihre eigene Fläche, und darunter liegt kein Inhalt mehr, der verschwimmen könnte. Das Kopfskript
setzt es vor dem ersten Anstrich passend zur Fassung (`black` auf Dunkel, als sichere Wahl, falls
ein Gerät die `theme-color` nicht liest). `env(safe-area-inset-top)` ist damit in der App 0, und
alle Polster, die damit rechnen, fallen von selbst weg.

Die deckende Kopfleiste ist wieder herausgenommen — das Milchglas war nie die Ursache. Die zweite
Datei für die Wortmarke bleibt: sie ist ohnehin sauberer als ein Filter. Und das Manifest trug
noch die dunkelblauen Farben aus der Zeit vor dem Umbranden (`#0A1129`, `#080D22`); iOS kann sie
für die Statusleiste heranziehen, sie stehen jetzt auf der hellen Fassung (`#F4F1FA`).

**Einen Haken hat es:** iOS liest die Statusleisten-Einstellung womöglich nur, wenn das Lesezeichen
angelegt wird. Hilft das Neustarten der App nicht, muss es einmal vom Homebildschirm entfernt und
neu hinzugefügt werden.

### Die Leiste unten

Seit 21. September 2026 steht unten eine **Leiste mit vier Zielen**: Kalender, Export, Meine Firma
und das Profil mit dem eigenen Bild. Sie klebt am unteren Rand, geht über die volle Breite und ist
86 px hoch, aus Milchglas mit einer gleichmäßigen Tuchfarbe — ein Verlauf unter einem
Weichzeichner ergibt Schlieren, das war bei der Kopfleiste schon einmal zu sehen.

**Der erste Anlauf schwebte** — 12 px vom Rand, mit Schatten. Das sah gut aus und **hüpfte**: In
Safari fährt die Adressleiste beim Scrollen ein und aus, und eine festgesetzte Leiste wandert dabei
mit. Am Rand klebend fällt dasselbe Mitwandern nicht auf, weil sie dort ohnehin anliegt. Den
Sicherheitsabstand des Telefons trägt sie in ihrem eigenen Polster.

**Und die Größen hatten kein Verhältnis zueinander:** 23 px Symbole in einer 57 px hohen Leiste,
daneben ein 38 px großes Bild, das unverändert aus der alten Kopfleiste übernommen war. Jetzt sind
die Symbole 26 px, die Wörter 10 px, und **das Profilbild ist der Anker**: 42 px, mit hellem Ring
und Schatten, 8 px nach oben herausragend. Es ist das Einzige in der Leiste, das ein Bild ist — das
darf man sehen.

**Alle vier Wörter stehen da.** Das kostet nichts, und *Meine Firma* ist als Symbol allein nicht
erratbar. Im ersten Anlauf trug nur der aktive Punkt sein Wort; das war hübscher und sagte weniger.

**Meine Firma zeigt einen Becher** statt Haus und Wort — das ist, was man dort tut. Welche Sorte,
sagt der eigene Stand: die am weitesten freigeschaltete. Wer noch keinen verschickt hat, sieht
**Ube Pop**, den ersten; ein leerer Platz wäre kein Ziel. Die Zahl der wartenden Becher sitzt an
seiner Ecke.

**Wartet ein Becher auf Antwort, meldet er sich selbst:** alle fünf Sekunden ein kurzes Wackeln,
dann wieder Ruhe. Die Bewegung steckt in den letzten 30 % der Keyframes — davor steht er still. Eine
Animation, die dauernd zappelt, übersieht man nach zwei Minuten; eine, die sich hin und wieder
meldet, nicht. Der Drehpunkt sitzt am Fuß wie bei den Bechern in der Firmenansicht: um die Mitte
gedreht sähe es aus wie ein Propeller.

**Unter dem Profilbild steht kein Wort.** Die drei anderen Punkte brauchen eines — ein Symbol
allein muss man raten —, das Bild ist sein eigener Name. Dafür sitzt es mittig in der Leiste statt
auf der Grundlinie der anderen und ist 48 statt 42 px groß.

**Die beiden Punkte ohne Wort zeigen ihren Zustand als Ring** — ein Bild wird nicht violett. Wer
dran ist, bekommt einen violetten Ring statt des hellen.

**Alle Zahlen sind violett.** Rot sagt *etwas ist schiefgegangen*; hier wartet nur etwas — eine
Nachricht, ein Aufstieg, ein Bubble Tea. Damit fielen zwei Sonderfälle weg: die violette Variante
für Becher und der halb-halb-Verlauf, wenn beides zusammenkam.

**Und die Becher zählen nicht mehr am Profilbild mit.** Dort stehen Nachrichten und Stufenaufstiege
— Sachen, die im Menü warten. Die wartenden Bubble Teas stehen an *Meine Firma*, wo man sie
beantwortet. Eine Zahl gehört an die Stelle, an die sie schickt.

**Das Profilbild ist von oben rechts heruntergewandert** und sitzt als vierter Punkt rechts außen,
mit seinem roten Zähler. Ein Eingang ins Menü genügt; oben wird dafür Platz frei. Verschoben wurde
das Element selbst, nicht nachgebaut — so gelten `malAvatar()`, der Zähler und sein Anlauf
unverändert weiter. Der Klick hing dabei am Bild; jetzt ist der ganze Punkt der Knopf, Bild und
Wort gehören zusammen. Dafür ist das Bild vom `<button>` zum `<span>` geworden — ein Knopf im Knopf
geht in HTML nicht.

**Sie steht auf jeder Seite** — auch in den Unteransichten und **im Profilmenü**. Nur der Einstieg
kennt sie nicht: dort gibt es noch kein Profil, zu dem sie führen könnte, und der Zeit-Assistent
hat seine eigene Führung unten. Steht das Menü offen, ist **Profil** der Punkt, auf dem man steht —
es liegt ja über der Seite.

**Das Kreuz oben rechts im Menü ist damit weggefallen.** Jeder Weg hinaus führt über die Leiste:
Kalender, Export, Meine Firma — oder noch einmal auf das Profilbild. Ein Kreuz daneben wäre ein
zweiter Ausgang für dasselbe. Wer von dort ein Ziel wählt, schließt das Menü **ohne Nachlauf**:
die Seite wechselt gleichzeitig, und eine ausblendende Fläche darüber ließe den Wechsel
durchscheinen.

**Zwei Dinge mussten dafür weichen.** Die Leiste lag im Quelltext in `#app`, und `#app` trägt
`z-index: 2` mit `position: relative` — ein eigener Stapelkontext. Ihr `z-index: 46` zählte damit
nur *innerhalb* von `#app`, und das Menü daneben (45) legte sich darüber. Als Geschwister des
Menüs gilt er wieder. Und sie muss **vor** dem großen Skript stehen: hinter `</body>` verschoben
war sie beim Verdrahten noch nicht da, und `addEventListener` lief auf `null`.

**Das Hüpfen hatte noch eine zweite Quelle:** den Gummiband-Effekt beim Überscrollen, der eine
festgesetzte Leiste mitzieht. `overscroll-behavior-y: none` auf `html, body` nimmt ihn weg.

**Bei Ladebildern ist sie weg.** Der Vorspann trägt absichtlich keinen eigenen Grund — er lässt
die Farbwolken der App durch —, und damit ließ er auch die Leiste durchscheinen. Ein Ladebild mit
einer Navigation darin ist kein Ladebild mehr. Sie weicht jetzt bei allem, was die Seite festhält
(`body.locked`): Vorspann, Gruß, Blätter, Kartenstapel.

**Zwei Sonderfälle gingen mit dem Umbau verloren und kamen erst am 26. September zurück.** Am
alten Kalender-Knopf hing: Steht man schon auf dem Kalender, ist ein zweiter Tipp keine
Navigation, sondern die Bitte um den laufenden Monat. Am alten Export-Knopf hing, dass der Export
sein Jahr bekommt, bevor er gezeichnet wird. Der neue Horcher an der Leiste rief nur `go()` —
beides lief fünf Tage lang ins Leere.

**Die Tests hätten es gemeldet, und ich habe es nicht gesehen.** Die Kalender-Reihe griff noch nach
den alten Knöpfen in `#fabbar`, bekam `null` und brach im Laufzeitteil ab — *bevor* sie ihre
Prüfungen melden konnte. Dasselbe in der Menü-Reihe, dort an zwei Stellen, die nach Elementen
fragten, die bewusst entfernt worden waren. 166 Prüfungen liefen fünf Tage lang gar nicht. Die
Reihen zeigten ein ✗, der Rückgabewert war 1 — aber die Summenzeile sagte *0 gescheitert*, und die
habe ich gelesen. Jetzt nennt sie abgebrochene Reihen ausdrücklich: *1 Reihe NICHT
DURCHGELAUFEN*. Gegengeprüft mit dem alten Stand.

**Unten steht entweder die Navigation oder eine Entscheidung, nie beides.** Sobald ein Zeitraum
markiert ist, stehen dort *Eintragen* und *Eintrag verwerfen*, beim Unterschreiben *Signieren* —
dann weicht die Leiste, als Kreuzblende, nicht als Sprung. Solange etwas zu entscheiden ist, ist
die Navigation ohnehin nicht gemeint. Die beiden alten Knöpfe *Kalender* und *Export*, die dort
bisher standen, sind damit weggefallen.

**Meine Firma hat kein Zurück mehr** — es ist ein Ziel wie der Kalender, und Ziele haben kein
Zurück. Und die **Menüzeile dazu ist weggefallen**: Sie stand mit Firmenzeichen und der Zahl der
wartenden Bubble Teas unter *Konto* und wäre neben dem Punkt in der Leiste ein zweiter Eingang für
dasselbe. **Die Zahl steht jetzt am Punkt**, der dorthin führt. Die Gruppe *Konto* blieb damit leer
und blendet sich selbst aus.

### Die Karte berichtet, die Kacheln führen

Seit 21. September 2026 steht in der Karte nur noch, was sie **zeigt**: Bild, Name, Firma, Stufe,
Becher, Leiste. Was irgendwohin **führt**, steht darunter.

**Das Bild ist 88 px statt 64** und trägt **oben rechts** einen violetten Stift mit 24 px. Unten
saß er genau dort, wo die Reihe mit den drei Ständen beginnt, und schob sich vor das erste Feld;
oben hat er Luft, und klein genug ist er auch — dass ein Bild mit einem Stift daran antippbar ist,
versteht man bei 24 px so gut wie bei 28. Zwischen Bild und Namen stehen jetzt 16 statt 12 px. Der
Name wurde dadurch eine Spur zu groß (122 px Platz, 128 gebraucht) und ist auf 18 px gesetzt. Es ist der Grund,
warum man die Karte anschaut, und das Einzige, was man daran ändern kann — beides spricht dafür,
es groß zu zeigen und zu sagen, dass es antippbar ist.

**Drei Stände stehen in einer Reihe** über die ganze Kartenbreite: Bubble Teas, Tage in Folge,
Level. Gleiche Form, gleiche Größe, jeweils Bild, Zahl und Beschriftung — vorher war die Stufe eine
Pille in der Ecke und der Becher eine Zeile darunter, zwei Sprachen für dieselbe Art Auskunft.
Neben dem Profilbild blieben je 39 px übrig und die Beschriftungen liefen über; über die volle
Breite sind es nachgemessen **103 px** je Feld.

- **Bubble Teas** zählt alles, was zwischen einem selbst und den anderen gelaufen ist. Das Bild ist
  der echte Becher der Sorte, die man am weitesten freigeschaltet hat — der höchste Stand zählt,
  nicht der Schnitt. Ohne einen einzigen Becher fehlt das Feld.
- **Tage in Folge** zählt, an wie vielen Tagen hintereinander die App offen war. Einmal am Tag,
  beim Betreten: war gestern der letzte, geht es eins hinauf; liegt mehr dazwischen, fängt die
  Reihe neu an. Wer mehrmals am Tag kommt, bekommt nichts extra — es sind Tage, keine Besuche.
- **Profil Level** ist die Stufe, die vorher als Pille in der Ecke stand — zweizeilig
  beschriftet wie die beiden anderen, damit die Reihe eine Reihe bleibt.

**Jedes Feld ist ein Knopf**, weil jedes auf einen Tipp antwortet: der Becher wackelt und funkelt
wie in der Firmenansicht (dieselben Keyframes), die Krone wirft ihre Funken weiter hinaus, und die
Flamme lodert ohnehin von selbst — zwei Bewegungen unterschiedlicher Länge überlagern sich, damit
sie nie im Gleichtakt mit sich selbst zappelt. Das ist Spielerei und soll es sein; die Zahlen
ändern sich dadurch nicht.

**Über der ganzen Karte lag eine unsichtbare Fläche**, die jeden Druck abfing und den Stapel
aufmachte. Sie stand jedem Knopf im Weg, den die Karte sonst tragen soll. Jetzt führt **genau ein
Knopf** dorthin — oben rechts, wo vorher die Stufenpille saß. Der Kopf gibt dafür auch nicht mehr
nach: etwas, das nachgibt und dann nichts tut, ist ein Versprechen ohne Folge.

**Vier eckige Kacheln** stehen zwischen Karte und den Menügruppen: Postfach mit roter Zahl,
Sicherungsstand mit farbigem Punkt an der Wolke, Persönliche Daten, Hell/Dunkel. Vier und nicht
fünf, damit die Reihe in der Breite aufgeht — nachgemessen 81 px je Feld auf einem 375er Schirm.
Jede trägt ihre Beschriftung: ein Symbol allein muss man raten. `minmax(0,1fr)`, weil ein
Gitterfeld sonst mindestens so breit wird wie sein Inhalt und die Reihe über den Rand liefe.

Zwei Dinge sind dafür weggefallen. **Postfach und Sicherungsstand** standen als kleine Felder *in*
der Karte, zwischen Name und Stufe — zwei Bedienelemente in einem Ausweis, der sonst nur
berichtet. Und die Menüzeile **Erscheinungsbild** mit ihrem Schalter: die Kachel macht dasselbe,
zwei Einstiege wären einer zu viel.

**Die Leiste lag über den Flächen im Menü.** Sie liegt über allem, was eine Seite ist — also auch
über der Bildauswahl, den Ständen und den persönlichen Daten. Was dort unten stand, war nicht mehr
zu treffen: in der Bildauswahl die letzte Reihe, bei den Daten der **Speichern-Knopf**
(nachgemessen bei 725, die Leiste ab 733 — man sah ihn zur Hälfte). Alle diese Flächen tragen jetzt
96 px Polster unten statt 24.

**Und das Formular beginnt oben.** Die anderen Flächen im Menü zeigen Stände und füllen von unten;
dieses Blatt will ausgefüllt werden, und wenn die Tastatur aufgeht, soll das erste Feld dort
bleiben, wo es war.

**Persönliche Daten** ist neu. Name und Geburtsdatum ließen sich nach dem Anlegen nirgends mehr
ändern, und die Mail stand nur klein in der Karte. Jetzt liegen sie auf derselben Fläche, die im
Menü auch die Bilder und die Stände tragen. Die Mail wird gezeigt, nicht geändert: sie ist die
Anmeldung, und ein Wechsel läuft über eine neue Anmeldung.

Eine Falle steckte in der Gruppierung: sie sammelt Menüpunkte über `[data-act]` ein — und griff
damit auch nach den Kacheln, die dieselben Namen tragen. Der Selektor heißt jetzt `.mi[data-act]`.

**Nach dem Umschalten steht man wieder im Menü.** Der Fassungswechsel lädt die Seite neu (die
Statusleiste des Systems übernimmt `theme-color` nur beim Laden), und danach landete man im
Kalender — obwohl man im Menü umgeschaltet hatte und sich zurückklicken musste. Ein zweiter
Vermerk in `sessionStorage` merkt sich, dass das Menü offen stand; beim Start geht es wieder auf,
ohne Einlaufbewegung. Es war ja schon da, und der Schnitt ist der Wechsel, nicht das Menü.

**Und eine Null stand da, wo nichts stehen sollte.** Die Becher-Plakette setzt `hidden`, wenn noch
kein Becher gelaufen ist — aber `display:inline-flex` schlägt das eingebaute
`[hidden]{display:none}`. Sie braucht ihre eigene Regel.

### Der Becher wird ein Wechselspiel

Bisher galt nur: einer pro Tag und Person. Wer wollte, konnte damit jeden Tag in dieselbe Richtung
schicken, ohne je eine Antwort zu bekommen — aus dem Zuruf wurde eine Einbahn. **Nach dem eigenen
Becher ist die andere Seite dran.** Erst wenn sie geschickt hat, geht wieder einer hinaus; die
Tagesregel bleibt daneben bestehen.

Erkennbar ist das an den beiden Datumsspalten, die es schon gab: steht mein Datum und das der
anderen Seite fehlt oder ist älter, dann warte ich. Gleicher Tag heißt, wir haben beide
geschickt — dann greift die Tagesregel.

**Der graue Knopf nennt seinen Grund.** *Am Zug* statt *Heute*, und in der Zeile steht
*Luis ist am Zug — dann geht wieder einer* anstelle des Fortschritts. Ein graues Feld ohne Grund
liest sich wie ein Fehler.

Die Regel steht auch **in der Datenbank** (`20260921060000_tee_wechselspiel.sql`) — im Fenster
allein wäre sie nur eine Bitte. `tee_senden()` gibt dafür ein Feld `wartet` zurück, damit die App
den Grund nennen kann; weil sich der Rückgabetyp ändert, musste die alte Fassung erst weg.

**Beim Aufschlagen fährt der Stapel durch.** Wer die Karten aufmacht, sieht zuerst die erste und
fliegt dann an allen vorbei bis zu der, die gerade gilt; dort angekommen wackelt sie einmal, damit
man merkt, dass sie eine Rückseite hat. Das zeigt in einer Bewegung, was sonst niemand sieht: dass
es ein Stapel ist, dass er wächst, und wo man darin steht.

Gerechnet statt `scrollTo({behavior:'smooth'})` — der Browser nimmt sich dafür dieselbe kurze Zeit,
egal ob eine Karte oder elf dazwischenliegen, und über elf Karten wäre das ein Zucken. Hier dauert
es je Karte ein Stück länger, höchstens 1 s.

**Die Fahrt ruckelte, und die Ursache lag nicht dort, wo man sie vermutet.** Drei Dinge zusammen:

- **`scroll-snap-type` kämpfte gegen die Bewegung.** Bei jedem gesetzten `scrollLeft` zieht der
  Browser zur nächsten Rastung. Während der Fahrt ist das Einrasten deshalb aus (`.fliegt`).
- **Zwölf Karten mit eigener Perspektive und `preserve-3d`** müssen bei jedem Winkel neu gerastert
  werden — das ist die eigentliche Last. Während der Fahrt steht die Drehung still, ebenso der
  wandernde Glanz, den in dem Moment ohnehin niemand ansieht. Übrig bleiben Größe und Deckkraft,
  und die kosten nichts.
- **`kartenTiefe()` las und schrieb abwechselnd Layout**, zwölfmal je Bild: `offsetLeft` abfragen
  zwingt den Browser zu rechnen, und dazwischen wurden Stile gesetzt. Die Maße ändern sich beim
  Scrollen nicht — sie werden jetzt einmal gemessen und gemerkt. Nachgemessen 0,047 ms → 0,018 ms
  je Aufruf. Titel, Zähler und Punktreihe ziehen nur noch beim Kartenwechsel nach.

**Auch die Kurve hat zwei Anläufe gebraucht.** `1-(1-t)³` kroch am Ende: in den letzten 400 ms
bewegten sich noch 60 von 2650 px, und das liest sich als Stocken, nicht als Ankommen. Eine
S-Kurve legte dafür einen trägen Start hin — 45 px in den ersten 200 ms, während man schon auf die
Karten schaut. Jetzt läuft sie quadratisch aus (`t·(2−t)`): nachgemessen von Stufe 1 auf 10 nach
0,1 s bei 217 px, nach 0,3 s bei 1224, nach 0,95 s am Ziel.

Drei Fälle fahren nicht: wer Bewegung abgestellt hat, wer aus einem Brief kommt (dort gilt die
Karte, von der der Brief handelt), und **eine Seite im Hintergrund** — dort feuert
`requestAnimationFrame` nicht, und der Stapel bliebe auf der ersten Karte stehen.

### Der Brief zum Aufstieg

Eine Stufe zu erreichen war bis jetzt ein Moment: die Feier ging auf, man tippte sie weg, und
danach war sie weg. Seit 21. September 2026 **bleibt sie liegen** — als Nachricht im Postfach, mit
der Karte darin.

Die Karte im Brief ist keine Abbildung, sondern dieselbe `ktKarte()` wie im Stapel — aber sie
steht dort **als Banner**: klein an der Seite, daneben die Stufe, auf einer getönten Fläche in der
Stufenfarbe. Nachgemessen 299 × 211 px, die Karte darin 102 × 185.

Zuerst stand sie groß und mittig im Brief und ließ sich andrücken. Das war beim Lesen im Weg: die
Karte war fast so hoch wie die Ansicht, und beim Rollen kam man ständig an sie und landete im
Stapel. Jetzt ist sie ein Bild im Text — `pointer-events:none`, `aria-hidden`, und die Knopfrolle,
die `ktKarte()` jeder Karte mitgibt, wird im Brief wieder entfernt: ein fokussierbarer Knopf in
einem versteckten Bereich wäre ein Widerspruch.

**Verkleinert wird mit `zoom`, nicht mit `transform: scale`.** `zoom` nimmt die Höhe mit; bei
`scale` bliebe der Platz der großen Karte stehen und darunter ein Loch.

**Im Brief steht auch, was dabei herausgekommen ist**: wie viel Zeit MOJI erspart hat, und wofür
die reichen würde — *Dafür könntest du ein halbes Buch lesen.* Die Leiter dieser Vergleiche
(`VERGLEICHE`, zwanzig Stufen von einer Kugel Eis bis zu zwei Wochen Urlaub) stand seit Langem in
der Datei und **wurde von niemandem aufgerufen**. Jetzt steht sie im Brief und unter der Karte bei
der Aufstiegsfeier.

Der Rahmen dafür ist *„Dafür könntest du …"*, nicht *„Das reicht, um …"*: die Einträge sind bloße
Infinitive, und bei *um* gehört ein *zu* vor das Verb — das steht am Ende der Phrase, nicht am
Anfang. *„Das reicht, um ein halbes Buch lesen."* war falsches Deutsch.

**Ein Brief je Ereignis**, für die höchste erreichte Stufe. Bei drei Stufen auf einmal wären drei
Briefe drei Mal dieselbe Nachricht — die Karten liegen ohnehin alle im Stapel. Wer schon weiter
oben steht, hat seine Aufstiege erlebt, als es die Briefe noch nicht gab: **einer kommt nach**,
nicht neun.

**Die Feier selbst trägt jetzt die Stufenfarbe.** Die BOOST-Plakette lag im violetten
Markenverlauf — bei einem Aufstieg auf *Zeitmeister* stand also Violett über einer violetten
Karte. Und die Titelzeile des Stapels sagte dasselbe wie die Überschrift darüber noch einmal; sie
schob die Karte um 84 px nach unten und ist während der Feier ausgeblendet.

### Das Bild zum Weitergeben

`karteBild()` zeichnet die Sammelkarte auf eine Leinwand in **1080 × 1350** und reicht sie an das
Teilen-Blatt weiter.

**Auf eine Leinwand gehören echte Farben.** Bis 20. September 2026 stand dort durchgehend
`var(--f-2)` und `rgba(var(--s-hoch),.5)` — CSS-Variablen, die eine Leinwand nicht versteht.
`addColorStop` wirft damit einen Fehler, und `fillStyle` nimmt den Wert *stillschweigend nicht
an* und malt in der vorigen Farbe weiter. Das Bild entstand also **nie**; das Teilen fiel jedes
Mal stumm auf den Textweg zurück, ohne dass etwas darauf hindeutete. Jetzt werden die Werte
einmal am Anfang aus dem lebenden Element nachgeschlagen.

**Das Fenster ist quadratisch — daran hängt die ganze Rechnung.** 720 breit minus zweimal 36 Rand
ergibt 648, und das ist dann auch die Höhe. Dazu Band (120), Name (130), Fach (166), Fußband (96)
und etwas Luft: 1180. Beim ersten Versuch war die Karte 888 breit; das Fenster wurde damit 816
hoch und alles darunter lief aus der Karte.

**Die Wortmarke wird auf einer eigenen kleinen Leinwand eingefärbt.** Sie ist dunkel gezeichnet,
das Fußband ist schwarz. `source-atop` direkt auf der großen Leinwand trifft alles, was schon
darauf steht, und hinterlässt ein weißes Rechteck.

### Die Profilbilder

**116 Motive**, seit 15. September 2026. Vorher waren es zwölf. 104 kommen aus sechs Bögen mit
je 16 oder 25 Aufklebern (19 der 123 sind aussortiert, meist weil dasselbe Tier auf zwei Bögen
fast gleich vorkam), eines — der Wackelpudding — kam einzeln nach.

**Geschnitten an den echten Fugen**, nicht am gleichmäßigen Raster: die Bögen sind leicht
ungleichmäßig (die unterste Reihe bis zu 30 px höher), und beim gleichmäßigen Teilen bekam jede
Kachel einen Streifen der Nachbarin mit. Ein Bogen hat gar keine weißen Fugen — dort fallen die
Schnitte über die ruhigsten Bildzeilen.

**288 × 384 statt 192 × 256** und **WebP statt PNG**: 9 KB je Bild statt 88, alle 117 zusammen
1,2 MB. Mehr Auflösung steckt in den Vorlagen nicht, sie messen selbst nur 220 bis 300 Punkte.

**Das Format trägt die Rutsch-Animation.** Kommt eine Nachricht, schiebt sich das Tier im Rahmen
um 14 % nach unten (`#avwrap.meldung .avatar img`). Damit dabei keine weiße Lücke entsteht,
braucht es zweierlei: über dem Tier muss im Bild selbst sein eigener Pastellton stehen, und
derselbe Ton muss als `AV_GRUND` im Rahmen liegen. Beides kommt aus **der Oberkante der
Vorlage** — dort, wo die Verlängerung ansetzt. Nachgemessen über alle: die größte Abweichung
zwischen Bildoberkante und `AV_GRUND` beträgt **4 von 765** Farbstufen.

Wo das Quadrat im Hochformat sitzt, ist ausgerechnet, nicht geschätzt. Der Rahmen ist quadratisch,
das Bild 3∶4, `object-fit:cover` mit `object-position:center 86%` — das Ruhefenster liegt damit
bei 28,7 % bis 128,7 % der Bildbreite. Genau dort beginnt das Quadrat: **Zeile 83 von 384**.

**Das dritte Motiv ist ersetzt, nicht entfernt.** Die Nummer steht in jedem Profil; würde sie
wegfallen, rutschten alle Nummern darüber um eins und wechselten bei den Leuten das Bild. Die
Nummer bleibt also und trägt jetzt ein neues Motiv.

**Und `normalize()` darf die Obergrenze nicht als Zahl kennen.** Dort stand `av <= 12`, seit es
zwölf Motive gab. Als daraus 117 wurden, warf `normalize()` beim Laden **jede Wahl über 12
wieder weg** — man suchte sich eines der neuen aus, lud neu, und hatte wieder das zugeteilte
drin, ohne dass irgendetwas auf den Grund hindeutete. Jetzt steht dort `AVATARE`, und drei
Prüfungen halten fest, dass eine hohe Wahl das Laden übersteht.

**Wer sich keines aussucht, bekommt eines zugeteilt — und behält es.** Die Zahl kommt aus
Vorname und Geburtsdatum (`avZufall()`), wird aber seit 20. September 2026 **einmal im Profil
hinterlegt** statt bei jedem Zeichnen neu gerechnet. Der Grund steht in der Firmenansicht: dort
trug bei acht Leuten die öffentliche Zeile ein anderes Motiv als ihre eigene App. Nachgesehen in
den Daten — bei genau diesen acht stand in `records` überhaupt keine Nummer. Die Datenbank kann
sie nicht nachrechnen, ihr Auslöser schrieb also den Vorgabewert **1** und überschrieb damit bei
jedem Sichern auch das, was die App selbst schon eingetragen hatte.

Zwei Hälften, eine Ursache: `normalize()` hinterlegt die zugeteilte Zahl jetzt, und
`mitglied_nachziehen()` überschreibt das Bild nur noch, wenn in `records` wirklich eine steht —
`coalesce(av, mitglieder.avatar)` statt `coalesce(av, 1)`. **Eine fehlende Angabe ist keine
Angabe und darf keine werden.** Wird beim Laden eine Nummer zugeteilt, geht sie sofort hoch;
sonst stünde sie nur auf einem Gerät.

Und der **Teiler ist fest** (`AV_ZUFALL_BIS = 116`), nicht `AVATARE`: sonst wechselt jedem ohne
eigene Wahl das Bild, sobald Motive dazukommen — am 15. September dreimal an einem Nachmittag.

**Nachzügler bekommen die nächste freie Nummer, keine mittendrin.** In jedem Profil steht nur
die Zahl — eine Nummer einzuschieben würde allen darüber das Bild wechseln. Wo ein Motiv im
Gitter *steht*, ist deshalb von seiner Nummer getrennt: `AV_NACHZUG` ordnet einzelnen Nummern
einen Platz zu (`{ 116: 57 }` — der Wackelpudding trägt die 116 und steht an 57. Stelle), und
`avReihenfolge()` baut daraus die Reihe, die `malAvGitter()` durchläuft. Ohne Eintrag ist die
Nummer der Platz.

**Zwei Dinge am Auswahlgitter mussten nachgezogen werden**, weil aus 3 Reihen 30 wurden:

- `grid-auto-rows:min-content` statt `auto`. Der Kasten hat eine feste Höhe, und mit `auto`
  quetschte das Gitter alle 30 Reihen hinein — nachgemessen 14,7 px statt 79,25, die Kacheln
  lagen übereinander. Bei zwölf Motiven passte alles hinein und es fiel nie auf.
- `align-content:start` statt `center` und `loading="lazy"` an den Bildern. Zentrierter Überlauf
  lässt sich nach oben nicht mehr scrollen, und 117 Bilder auf einmal zu laden wäre ein Schwall.
  Gestaffelt einlaufen tun nur die ersten zwölf; der Rest liegt ohnehin unter dem Rand.

### Zeitausgleich & Urlaubstage im Profilmenü

Der Menüpunkt unter *Dienstzeiten bearbeiten* färbt das Menü — dieselbe Fläche wie bei den
Profilbildern — und zeigt zwei Stände, die beim Öffnen hochzählen:

- **Zeitausgleich**: alle `zeit`-Einträge zusammen (jahresübergreifend) plus `konten.zaStart`.
  Grün bei plus, rot bei minus, in **Viertelstunden** zu stellen.
- **Urlaubstage**: der **Topf** minus alle genommenen Tage seit `konten.startJahr`
  (halbe Tage zählen 0,5), in **halben Tagen** zu stellen. Der Anspruch selbst wird im
  eigenen Menüpunkt gepflegt.

Gestellt wird seit 14. September 2026 **am Rad**, mit denselben Walzen wie im Zeit-Assistenten
— nur in den Stufen, die hierher gehören. Davor standen dort zwei kleine **+/−**-Knöpfe; von
+0,00 auf +12,00 h waren das 48 Tipps.

Und das Rad stellt den **Stand** ein, nicht den unsichtbaren Grundwert: was daraus für
`konten.zaStart` bzw. `konten.topf` folgt, rechnet die App zurück — der Teil aus den Einträgen
(`zaRoh`, `genommen`) ändert sich dabei ja nicht. Das Rad wird erst beim **Aufsperren** gebaut
und beim Zusperren wieder abgeräumt: 801 Zeilen Zeitausgleich und 561 Zeilen Urlaub legt man
niemandem hin, der nur nachsieht (gemessen: 118 ms für beide).

Darüber sitzt dasselbe **Schloss** wie auf der Dienstzeiten-Seite — dieselbe Zeile, dieselbe
Beschriftung, derselbe Wink, wenn man ins Gesperrte tippt. Der alte gestrichelte Riegel
(`.kschloss`) ist entfallen.

### Urlaubsanspruch

Eigener Punkt im Profilmenü, mit demselben Schloss. **Kein Rad**: das ist eine Zahl im Jahr,
keine Uhrzeit, und sie ändert sich vielleicht einmal im Arbeitsleben — zwei Knöpfe für die
Einheit, dann die Zahl zwischen Minus und Plus. Verschlossen bleibt die Zahl lesbar und nur
das Verstellen ist fort.

Der Jahresanspruch lässt sich in **Tagen oder Stunden** eintragen; Stunden werden über die
durchschnittlichen Stunden eines Diensttages aus dem Dienstplan in Tage umgerechnet
(`tagStunden()`).

Jeden **1. Jänner** wird der Anspruch dem Topf gutgeschrieben (`urlaubGutschreiben()`,
läuft beim Start und bei jedem `save()`, trägt verpasste Jahre nach und schreibt nie doppelt
gut). Reste verfallen also nicht, der Topf wächst weiter. Gespeichert:
`konten = { anspruch, anspruchEinheit, topf, gutJahr, startJahr, zaStart }`.

Gespeichert werden nur die beiden **Grundwerte** in `konten`. Der gerechnete Stand steht in
`stand = { za, zaRoh, urlaub, genommen, anspruch, jahr, ts }` und wird bei **jedem** `save()`
nachgezogen — er liegt damit auch in der Cloud-Zeile und ändert sich automatisch, sobald im
Kalender Urlaub oder Zeitausgleich eingetragen wird. Rechenzeit rund 2 ms.

### Meine Firma und das Team

Seit 15. September 2026 eine **Vorschaukachel zum Aufklappen** und darunter das Team. Vorher
stand hier eine Seite mit Augenbraue, Fließtext und fünf gleich schweren Zeilen — die Firma
steht fest, die liest man einmal und nie wieder; das Team ist der Grund, herzukommen.

**Die Daten liegen in zwei eigenen Tabellen, nicht in `records`.** Dort stehen Dienstzeiten,
Urlaub und Krankenstände, und die gehen Kolleginnen nichts an. `mitglieder` trägt nur, was man
voneinander sehen darf: Vorname, Anfangsbuchstabe, Bild, Filiale, MOJI-Stufe, zuletzt online.
Lesen darf, wer in derselben Firma ist (→ `supabase/migrations/`).

> **Eine Leseregel darf sich nicht selbst abfragen.** Die erste Fassung lautete
> `using (firma = (select firma from mitglieder where user_id = auth.uid()))` — die Unterabfrage
> liest wieder aus `mitglieder` und wird dabei von genau dieser Regel geprüft. Postgres dreht
> sich im Kreis, und es kam gar nichts zurück, nicht einmal die eigene Zeile. Jetzt holt eine
> Funktion mit `security definer` die eigene Firma an der Regel vorbei, und die eigene Zeile
> darf man ohnehin immer sehen. Aufgefallen ist es erst am echten Konto — und viel zu spät,
> weil die App den Fehler als *„Noch niemand sonst da"* ausgegeben hat. Ein Fehler darf nie
> wie ein leeres Ergebnis aussehen; die Ansicht sagt jetzt, was schiefging.

> **Klassennamen sind ein gemeinsamer Raum.** Die Teamkarte hieß zuerst `.mk` — und `.mk` gehört
> seit jeher der Mitarbeiterkarte im Menü, die `color:var(--f-2)` setzt, also fast Weiß. Weil
> ihre Regeln später im Blatt stehen, gewannen sie: die Namen standen **unsichtbar** auf der
> Karte, während die graue Zeile darunter zu lesen war. Dasselbe traf `.mk-t`, `.mk-lvl` und
> `.mk-bild`. Jetzt heißt alles `tm-`. Eine Prüfung achtet darauf, dass es dabei bleibt — und
> eine zweite sieht die berechnete Textfarbe nach, statt nur die Regel zu suchen.

**Die Marke des Dienstgebers** steht in der Kachel und im Profilmenü — dort statt des
gezeichneten Hauses. Für die Kachel ist die Wortmarke aus der Vorlage **herausgeschnitten**
(`firma-miller-wort.webp`): die 512er-Datei trägt den Schriftzug mittig in viel Marineblau, und
in ein 52-px-Quadrat gequetscht war er 24 px breit und nicht mehr zu lesen. Jetzt eine breite
Platte in dem Blau, das die Marke selbst mitbringt. Im Menü bleibt die quadratische Fassung:
bei 36 px ist ohnehin kein Schriftzug lesbar, dort zählt der Wiedererkennungswert der Fläche.

Dass der Dienstgeber feststeht, steht **in der Zeile Arbeitsort**, nicht in einem eigenen
Kasten: dort saß der Satz zwischen den Angaben und den Getränken, trennte beides und las sich,
als gehöre er zu den Getränken. Die fünf Zeilen wiegen jetzt gleich schwer.

**Was ein Bubble Tea ist**, steht in den aufgeklappten Details — mit allen zehn Getränken,
ihren Namen und ab wie vielen Punkten sie kommen. Nicht auf der Liste: wer sie kennt, soll
nicht jedes Mal daran vorbeilesen.

**Wie die Liste voll wird.** Ein Auslöser an `records` zieht die öffentliche Zeile bei jedem
Sichern nach — Name, Anfangsbuchstabe, Bild, Stufe, zuletzt aktiv. Vorher legte nur die App
selbst eine Zeile an, und auch das erst, wenn jemand *Meine Firma* aufmachte: wer MOJI seit
Monaten benutzt und dort nie hineingesehen hat, fehlte im Team. Einmalig sind alle bestehenden
Profile nachgezogen worden (`20260915120000_team_nachzug.sql`), und die Migration prüft sich
selbst: kommen weniger Zeilen an, als es Profile mit Namen gibt, schlägt sie fehl.

> **Der Auslöser darf das Sichern nie verhindern.** Er hängt an jedem Schreibvorgang auf
> `records`; würde er werfen, könnte jemand seine Arbeitszeit nicht mehr speichern, weil eine
> Namensliste klemmt. Das wäre die falsche Reihenfolge — die Aufzeichnung ist der Zweck der App,
> das Team ist Beiwerk. Darum fängt die Funktion alles ab und meldet es als Warnung.

Wer keinen Vornamen hat, kommt nicht in die Liste: dann wurde der Funnel nie beendet, und eine
Namensliste ohne Namen hilft niemandem.

**Die Mitgliedskarte** hat zwei Zeilen: oben wer — Bild, *Anna M.*, klein und grau Filiale und
MOJI-Stufe, darunter *kürzlich gesehen* mit farbigem Punkt, rechts die eckige Box mit dem
geteilten Level. Unten das gemeinsame Getränk, der Weg zur nächsten Stufe und **Senden**.
Die eigene Karte steht zuerst und hat keine untere Zeile — sich selbst schickt man nichts.

**Die Reihenfolge der Liste** ist keine reine Alphabetik: zuerst man selbst, dann wer einem
einen Bubble Tea geschickt hat und auf Antwort wartet, dann die mit einem **Herz** markierten
Lieblingsleute, dann alle übrigen alphabetisch. Sobald zurückgeschickt ist, fällt die zweite
Gruppe weg und die Zeile sortiert sich wieder ein, wo sie hingehört — aber **erst beim nächsten
Öffnen**, sonst spränge sie unter dem Finger weg. Die Markierung steht in `ME.besties`, ist
also die eigene: der andere erfährt davon nichts.

**Der Bildrahmen trägt die Farbe der MOJI-Stufe** (`RAENGE[n].a`) — man erkennt am Bild, wie
lange jemand schon dabei ist.

**Wer einem einen geschickt hat**, bekommt denselben violetten Ton wie die eigene Karte und die
Zeile *Hat dir einen Bubble Tea geschickt* — bis 15. September 2026 stand dort nur *Hat dir
einen geschickt*, einen was? Der ganze Satz ist zu lang für die schmale Spalte neben dem Namen
(206 von 174 verfügbaren px) und steht darum in einer **eigenen Zeile unter dem Kopf**.

**Und sein Bild schwebt.** `.tm.offen .tm-bild` läuft dieselbe `mkWippe` wie das Bild auf der
Mitgliedschaftskarte: 3,4 s, `alternate`, fünf Pixel hoch und knapp drei Grad hin und her. Wer
oben in der Liste auftaucht, weil er einem etwas geschickt hat, soll dort auch nicht stillstehen.

**Der Becher lässt sich andrücken.** Er sitzt in einer eigenen Hülle (`.tm-becher`, ein Knopf)
mit drei Funken darin — denselben vierzackigen Sternen wie auf der goldenen Mitgliedschaftskarte,
aber in der Farbe des Getränks, das ihr gerade habt. Ein `pointerdown` lässt ihn wackeln
(`teeWackel`, 0,62 s, Drehpunkt bei 88 % Höhe, damit er auf dem Boden kippt statt um die Mitte zu
rotieren) und die Funken nacheinander aufblitzen (`teeFunke`, versetzt um 60 und 120 ms).
**Geschickt wird damit nichts** — das bleibt beim Knopf daneben; ein Becher, der bei jeder
Berührung einen Tee abschickt, wäre eine Falle. Die Funken liegen absolut in der Hülle und dürfen
über ihren Rand hinausblitzen, ohne den Becher zu vergrößern.

**Dasselbe gilt für die Getränkekunde** in den Details der Firmenkachel: auch dort ist jeder der
zehn Becher ein Knopf, und **jeder funkelt in seiner eigenen Farbe** — die steckt ohnehin schon
als `--tee` in der Kachel, die Funken greifen sie nur ab. Beide Orte teilen sich dieselben
Regeln und **einen einzigen Horcher**, der an `#v-firma` hängt statt an einer der beiden Listen:
`becherTipp()` sucht mit `closest('.tm-becher, .teek')`. Nachgemessen: Matcha Melt funkelt grün
(`rgb(111,199,127)`), Ruby Royale rot (`rgb(232,53,61)`), und es glitzert immer nur der, den man
gerade drückt.

**Rechts oben das Level, darunter das Herz.** Das geteilte Level sitzt seit 15. September 2026
in der oberen rechten Ecke, als **Pille in derselben Form wie auf der Mitgliedschaftskarte** —
`LVL` und Zahl in einer Zeile, versal, gesperrt. Vorher war es eine eckige Box mit der Ziffer
über dem Wörtchen: zwei Zeilen für zwei Zeichen. Die **Farben sind geblieben**: grau bei null,
sonst die Farbe des Getränks, das ihr gerade habt.

Das Herz hängt darunter, rechtsbündig mit der Pille und **mittig zwischen ihr und der Linie**
über dem Getränk. Damit das ohne Rechnen stimmt, trägt `.tm-kopf` die rechte Spalte **absolut**
und lässt sie 11 px über seine Unterkante hinausreichen — genau so weit liegt die Linie
(`margin-top` von `.tm-tee`) darunter. Das Herz steckt in einem `flex:1`-Platz und ist damit von
selbst zentriert, egal ob der Vermerk *Hat dir einen Bubble Tea geschickt* dazwischenliegt oder
nicht. Nachgemessen: 24 px Luft oben wie unten mit Vermerk, 8 px oben wie unten ohne. Den Platz
für die Spalte (74 px) reserviert `padding-right` — auf der **eigenen** Karte steht rechts
nichts, dort ist es null.

**Das geteilte Level.** Jeder Bubble Tea ist ein Punkt im gemeinsamen Topf, beide zahlen ein,
also höchstens zwei am Tag. Der erste bringt Stufe 1 (*Ube Pop*), danach je zehn eine weitere
bis Stufe 10 (*Ruby Royale*) bei 91. `teeLevel()` rechnet im Browser genau wie `tee_level()` in
der Datenbank — beide Fassungen sind gegen dieselbe Tabelle geprüft.

**Die Regel „einmal am Tag" hält der Server.** `tee_senden(an)` sperrt die Zeile, prüft dieselbe
Firma, schaut nach dem letzten Tag je Richtung (Wiener Zeit, sonst wechselte der Tag um zwei
Uhr früh) und zählt nur dann. Im Browser wäre das in zehn Sekunden ausgehebelt.

**Der Punkt am Profilbild** zählt alles zusammen, wie am Telefon: Nachrichten, Stufenaufstiege
und wartende Bubble Teas in einer Zahl. Welche Art dahintersteckt, sagt die **Farbe** — Rot für
Nachrichten, Violett für einen Tee, und kommt beides zusammen, wird der Kreis halb und halb
(`.zaehler.beides`). Zwei Punkte nebeneinander wären an einem 20-px-Kreis nicht mehr zu
unterscheiden. Im Menü steht die Zahl der wartenden Tees zusätzlich in der Zeile *Meine Firma* — an der Ecke
der Symbolkachel, wie der rote Punkt am Briefsymbol im Profilkopf. Frei in der Zeile war er ein
fremder Punkt zwischen Bild und Text. Die Kachel entsteht erst beim Aufbau des Menüs, der
Zähler wandert deshalb in `malZaehler()` hinein.

**Zuletzt online** ist eine Leiter, keine Uhrzeit — und sie wird nach hinten immer gröber:
*kürzlich gesehen* (bis 1 h), *vor 1 Stunde* bis *vor 4 Stunden*, dann *heute zuletzt online*,
*gestern*, *vor n Tagen* bis 89, ab 90 Tagen *es ist schon ewig her*. Niemand rechnet aus, wie
lange 14:32 her ist.

**Die Stunden gehen den Tagen vor.** Wer um ein Uhr früh nachsieht und jemanden um zehn Uhr
abends zuletzt gesehen hat, liest lieber *vor 3 Stunden* als *gestern*. Und der **grüne Punkt
hält mit dem Wort Schritt**: er steht, solange *kürzlich gesehen* dasteht — also bis zur ersten
Stunde, nicht mehr bis zur vierten.

Zwei Grenzen sind am 15. September 2026 gewandert: *kürzlich gesehen* galt vorher **vier
Stunden** lang, und das waren keine Momente mehr; und bei den Tagen war schon nach **40** Schluss
— ein Vierteljahr ist die ehrlichere Grenze für „schon ewig".

### Das Postfach

Ankündigungen, erreichbar über die Kachel im Profilmenü. Gelesen wird **pro Nachricht** in
`ME.gelesen` gemerkt und wandert mit dem Profil in die Cloud.

Seit 14. September 2026 ist es eine **Liste**: je Nachricht eine Zeile mit Zeichen, Titel, Datum
und Absender — angetippt klappt der Text auf, und damit gilt sie als gelesen. Vorher stand jede
Nachricht sofort in voller Länge da; drei lange Texte untereinander liest niemand.

**Der Zustand ist unübersehbar:** ungelesen trägt eine Pille **NEU** in der Markenfarbe, eine
getönte Karte und einen fetteren Titel; gelesen einen grünen Haken. Vorher war der Unterschied
ein blasser Rahmenton.

Beim Öffnen steht die **neueste ungelesene** Nachricht schon offen — sie ist ja der Grund,
warum die Zahl am Profilbild stand — und ist damit sofort vermerkt. Das Vermerken passiert
*vor* dem Zählen, sonst stünde oben noch die alte Zahl.

**Verschickt wird durch Veröffentlichen.** Die Ankündigungen stehen in `NACHRICHTEN` im
Quelltext und sortieren sich nach Datum, neueste oben; wer die App das nächste Mal öffnet, hat
sie. Einen Versand an einzelne Konten gibt es daneben (`ME.post`), für Persönliches.

**Eine Nachricht kann mehr als Text.** `postText()` macht aus Absätzen `<p>`, aus Zeilen mit `•`
eine Liste und aus `*Wort*` Fettes. Seit 15. September 2026 gibt es dazu die Marke
`[[teekunde]]`: ein Absatz, der nur daraus besteht, wird zum **Becher-Gitter** — denselben zehn
Bechern wie in den Details der Firmenkachel, und auch hier lassen sie sich andrücken. Dafür ist
`teeGitterHtml()` aus `teeKundeHtml()` herausgelöst, und `becherTipp()` hängt zusätzlich an
`#pf-liste`. So steht das Gitter **mitten im Text** statt angeklebt am Ende.

**Die Ränder** sind dieselben wie überall: 20 px an den Seiten, und oben rechnet die Karte die
Geräteaussparung mit (`env(safe-area-inset-top)`) — sonst säße der Griff unter der Uhr des
Telefons. Der Schließen-Knopf ist dasselbe Kästchen wie im Profilmenü (`.mzurueck`); ein rundes
Kreuz daneben las sich wie ein anderer Knopf.

`postText()` macht aus dem Klartext Absätze; Zeilen, die mit `•` beginnen, werden zur Liste,
und `*so markiertes*` wird fett. Eine Nachricht mit `bild: true` zeigt oben `LOGO_MOJI` —
so stellt sich MOJI in `moji-stellt-sich-vor-2026-09` selbst vor.

### Zeitausgleich

Am Kalendertag antippen → **Zeitausgleich**. Sobald eine Art gewählt ist, treten die anderen
drei weg (Höhe animiert); ein Tipp auf die gewählte Art holt sie zurück — der kleine Pfeil im
Knopf zeigt das an. Dasselbe gilt für Urlaub, Krankenstand und Eigener Text.

- **Einlösen** (rot, Minus) oder **Sammeln** (grün, Plus) — zwei Knöpfe, Sammeln ist vorgewählt
- Die Menge nur über **−** und **+** in **0,25-h-Schritten**, Start bei **1,00 h**,
  Kleinstwert 0,25 h. Die Zahl selbst ist kein Eingabefeld, es gibt also keine Tastatur.
- **Halber Tag / Ganzer Tag** übernehmen die Stunden aus dem Dienstplan dieses Tages;
  ein zweiter Tipp auf den gewählten Knopf stellt wieder 1,00 h ein. An dienstfreien Tagen
  sind beide Knöpfe aus, und Einlösen wird abgelehnt.
- **Sammeln** legt die Stunden auf die Arbeitszeit dieses Tages, **Einlösen** nimmt sie weg,
  höchstens bis auf null
- Gespeichert wird `{ t:'zeit', za: <Zahl mit Vorzeichen> }`. Ein durchlaufendes Gesamtkonto
  führt MOJI nicht — jeder Monat steht für sich.

---

## 4 · PDF-Export

Ein Monat = eine A4-Seite: Name, Geburtsdatum, Dienstgeber, Zeitraum, alle Tage mit Vormittag,
Nachmittag, Pause, Arbeitsstunden und Vermerk, die getrennten Summen, dazu die Unterschrift.

### Wie die Seite gebaut ist

Sie muss **zwei Dinge zugleich** sein: eine Aufzeichnung nach § 26 AZG, die beim Dienstgeber
und notfalls beim Arbeitsinspektorat besteht — und etwas, das man gern in der Hand hält.
Deshalb bleibt jede Pflichtangabe, wo sie war, und die Gestaltung passiert daneben.

| | |
|---|---|
| **Kopfband** (0–37 mm) | Leichter Verlauf von Hellblau nach fast Weiß. Links das App-Symbol, der Titel und *Aufzeichnung gemäß § 26 AZG*. Rechts die Einladung in MOJIs Schrift und der QR-Code auf einer weißen Karte |
| **Vier Karten** (42–57) | Dienstnehmer/in, Geburtsdatum, Dienstgeber, Zeitraum — je mit einem Streifen in einem der fünf Wolkentöne |
| **Tabelle** (ab 61,6) | Kein Kasten um alles. Eine Kopfpille in Lavendel, darunter Zeilen mit haarfeinen Trennern. Zeilen mit Eintrag im Pastellton ihrer Kategorie, die volle Farbe trägt ein Streifen an der Kante |
| **Summen** | Karten mit farbigem Streifen oben; *Gesamt* in Violett |
| **Unterschrift** (273) | Die auf dem Telefon **gezeichnete** Unterschrift, bis 58 mm breit und so hoch, wie das Blatt es hergibt (9–15 mm). Die Leiste darunter richtet sich nach ihr (46–68 mm). Darunter der Vermerk *Elektronisch unterschrieben in der MOJI App* |

**Farbflächen nur in schmalen Bändern, nie ganzseitig.** Das Blatt wird gedruckt, und Toner
kostet. Den Verlauf im Kopfband zeichnet `verlauf()` aus achtzig schmalen Streifen mit einer
Zehntelmillimeter Überlappung — jsPDF kennt keine Verläufe, und auf Papier sind die Streifen
nicht als Stufen zu erkennen. Davor lagen dort weiche Farbkreise; die waren als Feld gedacht,
sahen aber als Kreise aus, und auf einer Arbeitsaufzeichnung wirkt das schnell wie ein Fleck.

**Keine Legende mehr.** Vier Pastellchips erklärten unter der Tabelle, was Feiertag, Urlaub,
Krankenstand und Eigener Text bedeuten. Jede Zeile mit Eintrag schreibt ihre Art aber ohnehin
in die Vermerkspalte, direkt neben dasselbe Zeichen — die Chips erklärten etwas, das drei
Zentimeter weiter oben schon dastand. Die gewonnenen sieben Millimeter gehen an die Tabelle.

**Das App-Symbol ist freigestellt.** Die Vorlage `MOJI-APP-ICON.png` zeigt die Kachel auf einem
violetten Seitenhintergrund. Ein Zuschnitt allein hilft nicht: die Kachel ist ein abgerundetes
Quadrat, also bleibt in den vier Ecken Violett stehen — genau das war im PDF zu sehen.
`LOGO_ICON` ist jetzt ein PNG mit Alpha. Getrennt wurde nicht über Helligkeit, sondern über
**R minus G**, das Maß für „wie violett": der Grund liegt oben bei 55 und unten bei 32, die
Kachel bei −2 bis 12. Über den Grünkanal allein ließ sich die Unterkante nicht finden, dort
liegen Grund und Kachel zu nah beieinander.

**Die Farben sind dieselben wie in der App.** `TYPES[x].pdf` ist die kräftige Farbe,
`TYPES[x].pdfF` der Pastellton — beide aus `--c-urlaub` und `--c-urlaub-rgb-f` und so fort.
Vorher stammten sie aus der Zeit vor dem Umbranden (Gold, Orange, Blauviolett), und wer die App
neben den Ausdruck legte, sah zwei verschiedene Urlaubsfarben.

### Unterschreiben

Seit 14. September 2026 wird **vor jedem Export unterschrieben**. *PDF erstellen* legt ein
weißes Blatt über die ganze Kachel — eine hellgraue Linie, sonst nichts —, die Überschrift
darüber wird zu *Bestätige jetzt mit deiner Unterschrift.*, darunter steht **Unterschrift** in
der Markenfarbe, und unten, wo sonst **Kalender** und **Export** stehen, steht ein einziger
breiter Knopf: **Signieren**. Er bleibt stumpf, bis ein Strich auf dem Blatt liegt.

Im Hellen ist das Blatt weiß. Im Dunkeln ein **ruhiger Papierton** (`#ded9e6`) statt reinem
Weiß — eine grelle Fläche mitten in einer dunklen Seite blendet, und geschrieben wird darauf
ohnehin mit dunkler Tinte.

**Eine Unterschrift, alle Monate.** Wer drei Monate auf einmal abgibt, unterschreibt einmal;
derselbe Strich steht auf allen drei Seiten. Danach ist er wieder fort (`SIG_BILD = null`) —
gespeichert wird nichts, auch nicht im Profil. Beim nächsten Export wird neu gefragt. So bleibt
es eine Unterschrift und wird kein Stempel.

**Kein Glätten.** Ein Zug mit dem Finger liefert genug Punkte; jede Kurvenglättung macht aus
einer Unterschrift die Zeichnung einer Unterschrift.

### Das Warten danach

Nach *Signieren* legt sich `exOverlay()` über die Kachel: das freigestellte Männchen, ein
Lichtband, das darüber wandert, und ein **Ring, der sich um es schließt**. Darunter *Deine
Arbeitszeit wird geschrieben …* und die Zahl.

Der Ring ist ein SVG-Kreis (r 54) mit `stroke-dasharray` über den Umfang; der Stand läuft dem
Ziel weich hinterher, statt zu springen. Der Farbverlauf steckt in einem `linearGradient` —
`stop-color` muss dabei **über CSS** kommen, ein Attribut mit `var(--butter)` löst sich nicht
auf. Das Lichtband benutzt dieselbe Machart wie der Vorspann: das Bild ist die Maske, das Band
liegt darin (`--moji-maske`), hier aber in Schleife — es ist ein Warten, kein Moment.

Der Ring läuft nach der Uhr bis 96 % (3,6 s) und wartet dort, falls das Setzen länger braucht.
Auf 100 % geht er erst, wenn das Dokument fertig ist; **gespeichert wird 1,25 s danach**, wenn
der Ring wirklich geschlossen ist und das Männchen einmal gehüpft hat.

Davor füllte sich hier ein Glas mit goldener Flüssigkeit, mit Wellen, Blasen und einem *Prost!*
zum Schluss — hübsch gebaut, und mit Arbeitszeit hatte es nichts zu tun.

**Und seit 15. September 2026 atmet das Männchen im Ring.** Es ist kein Standbild mehr, sondern
**dreizehn Einzelbilder als bewegtes WebP** (`moji-leben.webp`, 84 KB), 1,35 s im Kreis: der
Körper wird größer und wieder kleiner wie beim Atmen, dazwischen blinzelt und zwinkert er, und
ab und zu fliegen Schwungstriche mit.

Die Vorlage war ein Bogen mit 24 gezeichneten Fassungen, 8 × 3. Ausgeschnitten sind sie über die
Alphakanten, ausgerichtet über **Körpermitte und Grundlinie** — der grüne Punkt hat als
Passmarke gedient, sein Durchmesser schwankt über alle 24 nur zwischen 50,3 und 51,8 px, die
Vorlagen stehen also im selben Maßstab. Ausgewählt und sortiert sind die dreizehn **nach
Körperhöhe**: 157 → 166 → 170 → 172 → 174 → 176 → 179 und wieder hinunter über 176 → 172 → 170 →
167 → 165 → 150. Bodenbündig gestellt liest sich das als Atemzug mit einem kleinen Nachfedern am
Ende. Die Blinzler liegen auf dem Weg nach unten, nicht verstreut — sonst flackern sie. Wie gut
zwei aufeinanderfolgende Bilder zusammenpassen, ist nachgemessen (Überdeckung der Silhouetten):
im Schnitt 0,91, im schlechtesten Übergang 0,84 — das ist der Atemzug selbst, kein Versatz.

**Es steht hier und sonst nirgends.** Im Vorspann war es einen Nachmittag lang drin und ist
wieder heraus: dort dauert das Warten 2,45 s, und 84 KB für anderthalb Sekunden Bewegung, die
*jeder* Start mitlädt, ist kein guter Tausch. Beim Export dauert das Warten länger, und es ist
die einzige Stelle, an der man wirklich zusieht.

**Geholt wird die Datei beim Aufmachen der Exportseite** (`lebenVorladen()` in `go()`). Bis
jemand die Monate gewählt und unterschrieben hat, ist sie da; wer nie exportiert, lädt sie nie.
**Getauscht wird nicht mitten im Warten:** entweder sie liegt vor, wenn der Kreis aufgeht, oder
es bleibt beim eingebetteten Standbild. Der Grund ist das Maß — die Einzelbilder brauchen oben
und unten Luft für die Schwungstriche und haben mit 237 × 227 einen flacheren Rahmen als das
Standbild mit 385 × 315.

**Gleich groß steht es trotzdem im Ring.** `.exmoji.lebt` wächst im selben Verhältnis mit:
78 · (237 · 381/218) / 385 = **84 px**. Nachgemessen im Browser ist der Körper in beiden
Fassungen **78 bzw. 79 px** breit. Dazu ein `translateY(2.6 %)`, weil der Körper in den
Einzelbildern auf einer Grundlinie bei 84,6 % der Rahmenhöhe steht und ohne den Versatz zu hoch
im Ring hinge; gerechnet ist er auf die **mittlere** Körperhöhe, der Rest des Ausschlags ist das
Atmen selbst (±2 px um die Ringmitte).

**Das Atmen per CSS ist dafür aus.** `exAtmen` skalierte das Standbild alle 3,4 s — zweimal
atmen wäre einmal zu viel. Der Hüpfer am Schluss (`exHuepf`) bleibt, der ist ein Moment. Und der
Glanz trägt jetzt die **Schnittmenge aller dreizehn** Silhouetten als Maske (`MOJI_MASKE`, eine
Datenzeile von 1,9 kB), damit das Lichtband nie über den Rand hinaus ins Leere leuchtet.

Wer **Bewegung abbestellt** hat (`prefers-reduced-motion`), bekommt das Standbild — ein bewegtes
Bild lässt sich mit CSS nicht anhalten, also wird es gar nicht erst geholt.

**Zugeschnitten wird auf den beschriebenen Teil.** `sigBild()` liest die Alphawerte der
Leinwand, sucht die Randpunkte und schneidet mit 8 px Rand aus — sonst hinge die Unterschrift
im PDF irgendwo in einem großen leeren Rechteck. Das Seitenverhältnis wandert als `SIG_VERH`
mit und bestimmt, wie sie ins Feld gesetzt wird: erst auf die Breite (58 mm), und wird sie dabei
zu hoch, auf die Höhe. **Gestaucht wird nie**.

**Die Höhe rechnet das Blatt selbst aus**, statt fest zu sein: von der Unterkante der
Unterschrift herauf bis anderthalb Millimeter über die letzte Erklärzeile, begrenzt auf 9 bis
15 mm. Bei einem Monat mit 31 Zeilen sind das gut 12 mm, bei einem kurzen Februar 15 — kürzere
Tabelle, mehr Platz.

**Warum das zählt:** die Breite einer Unterschrift hängt an ihrer Höhe, sobald das
Seitenverhältnis klein ist. Bei fest 8 mm wurde eine hohe, schmale Unterschrift nur 10 mm breit
und kam auf einer 62-mm-Linie winzig heraus. **Und die Leiste richtet sich jetzt nach der
Unterschrift**, nicht umgekehrt: `bre + 10`, begrenzt auf 46 bis 68 mm. Ohne gezeichnete
Unterschrift bleibt sie bei 62.

Damit das hineinpasst, ist der Fuß zwei Millimeter tiefer gerückt (Linie 284 statt 281) und die
Erklärung darüber einen halben herauf — Grundlinie 261,0, Unterkante der Unterschrift 275.
Alles gemessen, nicht geschätzt.

Und der Vermerk steht **unter** der Leiste statt rechtsbündig am Blattrand: dort drüben gehörte
er zu nichts und ging verloren.

### Die Handschrift

`HAND_TTF` ist **Architects Daughter**, auf Latin-1 und Latin Extended-A zusammengestrichen —
309 Glyphen, 24 KB, als base64 in `index.html`. Eine echte Blockhandschrift: gedruckte
Buchstaben mit leicht unruhiger Grundlinie. `handAn(doc)` meldet sie einmal je Dokument an;
schlägt das fehl, fällt der Name auf Kursiv zurück. Sie trägt seit 14. September 2026 nur noch
den **Rückfall**: liegt keine gezeichnete Unterschrift vor, steht dort der Name — ohne
irgendeine Unterschrift ist die Aufzeichnung nichts wert.

Vorher wurde die Unterschrift auf eine Leinwand gemalt, in *Dancing Script* mit `cursive` als
Ausweichschrift. Die Schrift liegt aber nirgends im Projekt — am iPhone kam Snell Roundhand
heraus, am Mac etwas anderes, unter Windows wieder etwas anderes.

### Die Anzeigeschrift

`BRICO_TTF` ist **Bricolage Grotesque** in Gewicht 500 — MOJIs Anzeigeschrift, auf Basis-Latin
und die deutschen Sonderzeichen zusammengestrichen (126 Glyphen, 27 KB). Sie trägt im PDF genau
eine Zeile: die Einladung neben dem QR-Code. Die spricht für die Marke und soll deshalb auch
wie die Marke klingen; der Rest des Blattes bleibt bei Helvetica, weil eine Aufzeichnung nach
§ 26 AZG sachlich aussehen darf.

Das ist teuer für eine Zeile — rund 36 KB base64. Wer die Schrift auch für die Überschrift
*ARBEITSZEITAUFZEICHNUNG* haben will, bekommt sie zum selben Preis: `doc.setFont('MojiBrico')`
vor dem `doc.text(...)` im Kopfband.

### Der QR-Code

`QR_PNG` führt auf `moji-app.at`. Fest eingebaut statt zur Laufzeit gerechnet: die Adresse
ändert sich nicht, und so braucht es keine zweite Bibliothek. Version 2, Fehlerkorrektur Q,
487 Bytes.

Er sitzt auf einer **weißen Karte**, und das ist kein Zierrat: ein QR braucht rundum eine helle
Ruhezone, sonst findet ihn die Kamera nicht — und das Kopfband ist lavendel. Im Bild stecken
zwei Module Ruhezone, empfohlen sind vier; die Karte legt den Rest dazu.

**Ein Knopf, eine Datei:** alle gewählten Monate zusammen, ein Monat pro Seite. Daneben stand
bis 13. September 2026 *Lieber pro Monat eine eigene Datei* — der hat mehr Fragen aufgeworfen
(welchen nehme ich? was ist der Unterschied?) als beantwortet und ist samt seinem Zweig in
`buildPdf()` entfernt. Wer ihn zurückholen will, findet ihn in der Historie.

### Was schon abgegeben ist

Zwei Dinge, die leicht verwechselt werden und **beide zugleich** an der Monatskachel stehen:

| | woher | wie es aussieht |
|---|---|---|
| **gewählt** | `EX.set`, gespiegelt in `ME.months` | violett gefüllt |
| **abgegeben** | `ME.exp` — Monat → Zeitstempel | grüner Haken in der Ecke |

Das Exportbuch `ME.exp` gab es schon, geschrieben von `merkeExporte()` nach jedem fertigen PDF
und über `data: ME` mit in die Cloud. Nur **sehen** konnte man es nicht: die Kachel zeigte
allein die Auswahl, und ein Jahrgang erledigter Monate sah aus wie ein leerer. Deshalb der
Eindruck, es werde nichts mitgeführt. Seit 13. September 2026 trägt die Kachel den Haken, und
die Zeile darunter nennt, wie viele der gewählten Monate schon draußen sind.

Ein abgegebener Monat darf erneut raus — das kommt vor, wenn nachträglich etwas korrigiert
wurde. Gezählt wird er kein zweites Mal: `ME.exp` hält je Monat einen Eintrag.

**Der Verlauf** (Uhrsymbol oben rechts) listet alles mit Zeitstempel. Er zeigte früher zwei
Daten nebeneinander ohne ein Wort dazwischen — *Dezember* links, *27.11.2025* rechts —, was
sich las wie ein Widerspruch. Links steht aber der aufgezeichnete Monat und rechts der Tag der
Abgabe, und die liegen fast immer auseinander. Jetzt steht es untereinander und
ausgeschrieben: **Dezember** / *abgegeben am 27. Nov 2025 um 20:31*.

**Datum in Ortszeit, nicht UTC.** Sowohl der Verlauf als auch die Fußzeile *Erstellt am* im PDF
rechneten über `new Date().toISOString().slice(0,10)`. Das ist UTC — in Wien zeigte jeder
Export zwischen Mitternacht und ein bis zwei Uhr den Vortag. Auf einer Arbeitsaufzeichnung, die
zum Dienstgeber geht, ist das kein Schönheitsfehler. Beide nehmen jetzt `heuteIso()`
beziehungsweise `fmtStempel()` mit Ortszeit-Gettern.

**Künftige Monate sind gesperrt.** Wählbar ist alles bis einschließlich des laufenden Monats;
spätere Monate stehen blass und gestrichelt da. Am Monatsersten wird der abgeschlossene Monat
frei — und wer zugestimmt hat, bekommt dazu eine Mail
(→ [Abschnitt 15](#15--monats-erinnerung-automatisch-verschicken)).

Der Export lädt die PDF-Bibliothek von einem CDN, braucht also kurz Internet.

---

## 5 · Mitgliedschaft und Stufen

Jeder abgegebene Monat zählt. Vier Monate ergeben eine Stufe, zwölf Stufen von
*Frisch dabei* bis *MOJI-Legende*, jede mit eigenen Farben und Effekten. Im Profilmenü zeigt
eine Leiste den Stand; ein Tipp öffnet die Rangliste.

Die **Mitgliedschaftskarte** im Menü nennt Name, Stufe, Dienstgeber, Mitglied seit, Anzahl der
Exporte und die gesparte Zeit — letztere in Vergleichen, die mit der Menge wachsen
(„vier Kugeln Eis“ … „zwei Wochen Urlaub“). Die Karte lässt sich in 3D drehen; auf der
Rückseite steht die MOJI-Marke als Prägung. *Karte teilen* erzeugt ein Bild fürs Weitergeben.

Ein Stufenaufstieg meldet sich mit einem roten Punkt am Profilbild.

---

## 6 · Bedienung in Kurzform

| Aufgabe | Weg |
|---|---|
| Einzelnen Tag markieren | Im Kalender auf den Tag tippen |
| Längeren Urlaub eintragen | Oben *Urlaub, Krankenstand & mehr* → Art → ersten und letzten Tag antippen → *… Tage eintragen* |
| Halben Tag | Im Tagesdialog, oder beim Eintragen mehrerer Tage *Vormittag* / *Nachmittag* |
| Eintrag entfernen | Tag antippen → *Zurücksetzen*, oder Zeitraum → *Einträge entfernen* |
| Dienstzeiten ändern | Avatar oben rechts → *Dienstzeiten bearbeiten* |
| Erinnerungsmail ein/aus | Avatar → *Monats-Erinnerung* |
| Profilbild wechseln | Avatar → auf das große Bild tippen |
| Abmelden | Avatar → *Abmelden* |

Sonntage bleiben frei. Beim Zeitraum-Eintrag werden Sonntage, Feiertage und dienstfreie Tage
automatisch übersprungen.

---

# Technik und Betrieb

## 7 · Wo die Daten liegen

In einer Postgres-Datenbank bei **Supabase in Frankfurt**, eine Zeile pro Person in der Tabelle
`records`: `user_id`, `data` (das ganze Profil als JSON), `updated_at`. Row-Level-Security setzt
**in der Datenbank** durch, dass jede Person ausschließlich ihre eigene Zeile sieht — auch wer
den Quelltext liest und den öffentlichen Schlüssel kennt, kommt nicht an fremde Daten.

Im Browser liegt zusätzlich ein Zwischenspeicher, damit die App offline weiterläuft. Oben rechts
zeigt eine Anzeige den Stand: **Gesichert**, **Sichere …**, **Offline · wird nachgeholt** oder
**Nicht gesichert**. Änderungen werden nach kurzer Ruhe gesammelt hochgeschrieben und beim
Zurückkommen auf die Seite nachgeholt.

Warum überhaupt eine Datenbank: Safari löscht den Browserspeicher einer Website nach sieben
Tagen ohne Besuch. Bei monatlichem Eintragen wären die Aufzeichnungen regelmäßig verschwunden.

---

## 8 · Veröffentlichen und Versionen

Repository `marcoreimair1/simply`, Branch `main`, GitHub Pages aus dem Wurzelverzeichnis.
Hochladen über **Add file → Upload files** genügt; nach etwa 40 Sekunden ist die neue Fassung
draußen.

Ganz oben in `index.html` steht `const APP_STAND = 'JJJJ-MM-TT-hhmm'`. Die App holt sich die
eigene Datei im Hintergrund ohne Zwischenspeicher, vergleicht den Wert und zeigt bei Abweichung
die Kachel **Es gibt eine neue Version**. **Bei jeder Änderung diesen Wert hochsetzen** — sonst
merkt niemand, dass es etwas Neues gibt.

GitHub Pages liefert die Seite mit zehn Minuten Haltbarkeit aus. Kurz nach einer Änderung kann
der Browser noch die alte Fassung zeigen — dann hart neu laden oder `?x=1` anhängen.

---

## 9 · Domain und DNS

`moji-app.at` liegt bei GoDaddy, zeigt aber auf GitHub Pages:

| Typ | Name | Wert |
|---|---|---|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| CNAME | www | `marcoreimair1.github.io` |

Im Repository steht die Datei `CNAME` mit dem Inhalt `moji-app.at`; in den Pages-Einstellungen
ist **Enforce HTTPS** aktiv. Bei Supabase müssen **Site URL** (`https://moji-app.at`),
**Redirect URLs** sowie **WEBAUTHN_RP_ID** und **RP_ORIGINS** dazu passen.

---

## 10 · Datenschutz

Arbeitszeiten und besonders Krankenstände sind personenbezogene, teils Gesundheitsdaten. Sie
liegen in der EU, jede Person kommt ausschließlich an ihre eigenen. Erinnerungsmails gehen nur
an Leute, die im Funnel oder im Profilmenü ausdrücklich zugestimmt haben, und lassen sich
jederzeit abschalten — die Einwilligung steht als `mailOk` im Profil, Voreinstellung **aus**.

*Profil löschen* im Menü ruft die Funktion `konto_loeschen()` auf und entfernt Datenzeile und
Anmeldekonto in einem Schritt.

Das ist keine Rechtsberatung: für Miller Optik als Dienstgeber gehört das voraussichtlich ins
Verzeichnis der Verarbeitungstätigkeiten, und ein Auftragsverarbeitungsvertrag mit Supabase wäre
zu prüfen. Kurz mit der Datenschutzberatung abklopfen.

---

# Einrichtung

Alles gratis. Konten anlegen und Passwörter eintragen bleibt bei dir — Zugangsdaten gebe ich
grundsätzlich nirgends ein.

> **Stand:** Abschnitte 11 bis 15 sind erledigt und geprüft — Datenbank, Zugriffsregeln,
> Resend als Absender `no-reply@moji-app.at`, Mailvorlagen, Passkeys und die automatische
> Monats-Erinnerung. Der Zeitplan `moji-monatsmail` ist aktiv, der Testlauf lief mit Status 200.

## 11 · Supabase-Projekt und Datenbank

### 11.1 Projekt *(erledigt)*

Projekt `simply`, Region **Central EU (Frankfurt)**, Plan **Free**. Das Datenbank-Passwort liegt
im Passwortmanager — es ist nicht wiederherstellbar.

### 11.2 Tabelle und Zugriffsschutz *(erledigt)*

**SQL Editor** → **New query** → ausführen:

```sql
-- Eine Zeile pro Person, alles darin.
create table public.records (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Zugriffsschutz einschalten. Ohne das könnte jeder alles lesen.
alter table public.records enable row level security;

-- Jede Person sieht und ändert ausschließlich die eigene Zeile.
create policy "eigene Zeile lesen"    on public.records
  for select using (auth.uid() = user_id);
create policy "eigene Zeile anlegen"  on public.records
  for insert with check (auth.uid() = user_id);
create policy "eigene Zeile ändern"   on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "eigene Zeile loeschen" on public.records
  for delete using (auth.uid() = user_id);

-- Profil löschen: Datenzeile und Anmeldekonto in einem Schritt.
-- security definer, weil auth.users sonst für niemanden erreichbar ist.
create or replace function public.konto_loeschen()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare wer uuid := auth.uid();
begin
  if wer is null then
    raise exception 'nicht angemeldet';
  end if;
  delete from public.records where user_id = wer;
  delete from auth.users where id = wer;
end;
$$;

revoke all on function public.konto_loeschen() from public, anon;
grant execute on function public.konto_loeschen() to authenticated;
```

Diese Regeln sind der eigentliche Datenschutz. Sie greifen in der Datenbank, nicht in der App.

### 11.3 Die zwei Werte in `index.html` *(erledigt)*

**Project Settings** → **API**: **Project URL** und der **anon public**-Schlüssel stehen oben in
`index.html` im Block `CLOUD`. Beide sind zur Veröffentlichung gedacht.

> ⚠️ Der **service_role**-Schlüssel darf **nie** in `index.html` oder in ein anderes Frontend.
> Er umgeht den Zugriffsschutz vollständig und gehört ausschließlich in die Secrets der
> Edge Functions. Ein Schlüssel, der einmal irgendwo im Chat oder in einer Datei gelandet ist,
> gilt als verbrannt und wird in Supabase neu erzeugt.

---

## 12 · Mailversand über Resend *(erledigt)*

Supabase verschickt selbst nur zwei Mails pro Stunde und nur an Adressen aus dem eigenen
Projektteam. Für echte Mitarbeiter braucht es einen eigenen Versand — MOJI nutzt **Resend**,
sowohl für die Anmeldecodes als auch für die Monats-Erinnerung.

**Absender: `MOJI <no-reply@moji-app.at>`.** Dahinter liegt kein Postfach — Senden und
Empfangen sind getrennt, für den Versand genügen die DNS-Einträge. Antworten laufen über
Reply-To auf eine echte Adresse.

### 12.1 Domain bei Resend

`moji-app.at` ist als Sending-Domain verifiziert, Region **Ireland (eu-west-1)**. Drei
DNS-Einträge bei GoDaddy, die Website bleibt davon unberührt:

| Typ | Name | Wert | Priorität |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqG…QwIDAQAB` (DKIM, 216 Zeichen) | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Dazu kommt der von GoDaddy vorgegebene `_dmarc`-Eintrag (`p=quarantine`, relaxed) — der passt
zu DKIM auf derselben Domain.

> **Der Gratis-Plan erlaubt nur eine Domain.** Deshalb wurde `studiomaru.at` bei Resend
> entfernt, als `moji-app.at` dazukam. Von `studiomaru.at` kann über Resend nichts mehr
> gesendet werden. Grenzen im Gratis-Plan: 3.000 Mails pro Monat, 100 pro Tag.

### 12.2 API-Schlüssel

**Schlüssel sind in Resend auf eine Domain beschränkt.** Ein Schlüssel für `studiomaru.at`
funktioniert nach dem Umzug nicht mehr — deshalb gibt es den Schlüssel **„MOJI moji-app.at"**
(Sending access, Domain `moji-app.at`). Er steckt an zwei Stellen:

- Supabase → Authentication → Emails → SMTP Settings → **Password**
- Supabase → Project Settings → Edge Functions → Secrets → **`RESEND_API_KEY`**

Resend zeigt einen Schlüssel nur einmal an. Wer ihn verliert, legt einen neuen an und tauscht
ihn an beiden Stellen.

### 12.3 SMTP in Supabase

**Authentication** → **Emails** → **SMTP Settings** → *Enable custom SMTP*:

| Feld | Wert |
|---|---|
| Sender email address | `no-reply@moji-app.at` |
| Sender name | `MOJI` |
| Host | `smtp.resend.com` |
| Port number | `587` |
| Minimum interval per user | `60` Sekunden |
| Username | `resend` |
| Password | der API-Schlüssel aus 12.2 |

Projekt-Ref: `kzduwbmiytusvlbotrrr`.

---

## 13 · Mailvorlagen und Code *(erledigt)*

Vorlagen lassen sich **erst nach dem Speichern des SMTP-Zugangs** bearbeiten.

**Authentication** → **Emails** → **Templates** → **Magic link or OTP**:

- Betreff: `{{ .Token }} ist dein MOJI-Code`

Der `{{ .Token }}` ist entscheidend: wer MOJI vom iPhone-Startbildschirm öffnet, kann den Link
nicht nutzen — der landet in Safari, und eine Startbildschirm-App hat auf iOS einen eigenen
Speicher. Mit dem Code funktioniert die Anmeldung auch dort.

**Seit 27. September 2026 liegen die Vorlagen im Projekt**, unter `mail/`, in einer Hülle mit der
Monats-Erinnerung: hell, eine weiße Karte, App-Symbol und Wortmarke oben, Markenviolett nur im
Code-Feld, im Knopf und im Link, dazu eine dunkle Fassung für Apple Mail und Outlook am Mac.

| Supabase-Vorlage | Datei | Betreff |
|---|---|---|
| **Magic link or OTP** | `mail/anmeldung.html` | `{{ .Token }} ist dein MOJI-Code` |
| **Confirm signup** | `mail/registrierung.html` | `{{ .Token }} ist dein MOJI-Code` |

**Eingetragen am 27.09.2026** über die Verwaltungsschnittstelle
(`PATCH /v1/projects/kzduwbmiytusvlbotrrr/config/auth`, Felder `mailer_subjects_magic_link`,
`mailer_templates_magic_link_content`, `mailer_subjects_confirmation`,
`mailer_templates_confirmation_content`) und danach nachgelesen: gleich dem Projekt. Die
Fassungen davor liegen in `mail/alt/`. Von dort übernommen: die Anrede mit Vornamen
(`{{ if .Data.vorname }}Hi {{ .Data.vorname }}, {{ else }}Hi, {{ end }}`), „Gilt eine Stunde und
nur einmal" und dass Fragen an info@studiomaru.at gehen — die Absenderadresse ist unbesetzt.

Von Hand geht es auch: Dashboard → **Authentication** → **Emails** → **Templates** → Vorlage
wählen → **Source** → den ganzen Inhalt der Datei einfügen → **Save**. Die Hülle muss in allen drei gleich
bleiben; `tests/test-mail.js` vergleicht sie. Die Bilder (`icon-180.png`,
`moji-mail-wort-tinte.png`, `moji-mail-wort-hell.png`) kommen von `https://moji-app.at/`.

---

## 14 · Passkeys *(erledigt)*

Passkeys laufen bei Supabase noch als Beta und liegen in `auth.webauthn_credentials`. Nötig:

| Einstellung | Wert |
|---|---|
| `WEBAUTHN_RP_ID` | `moji-app.at` |
| `WEBAUTHN_RP_ORIGINS` | `https://moji-app.at` |
| Anzeigename | `MOJI` |

Die RP ID muss ein registrierbares Suffix der Adresse sein, sonst lehnt der Browser stumm ab.
Beim Domainumzug wurden alle bestehenden Passkeys ungültig; die App merkt sich pro Konto im
Gerätespeicher, für welche Adresse ihr Passkey gilt.

**Ein Anlegen nimmt nichts weg.** Bis 14. September 2026 fing `pkAdd()` ein
`InvalidStateError` oder `credential_exists` ab, rief `pkAlleLoeschen()` — das räumt **alle**
Passkeys des Kontos am Server ab — und versuchte es neu. Brach der zweite Versuch ab oder
tippte jemand in dem Moment auf *Abbrechen*, stand das Konto **ohne jeden Passkey** da. Gedacht
war das für den Domainumzug; dafür gibt es aber `pkErneuern()`, den Weg über den Balken im
Profilmenü, den man bewusst wählt. Die stille Variante ist entfallen — `pkAlleLoeschen()` wird
nur noch von dort aufgerufen, und zwar genau einmal im ganzen Code.

**Und gefragt wird nur bei sicherem Stand.** `askPasskey()` prüfte `Array.isArray(PK_LISTE) &&
PK_LISTE.length` und zeigte die Einrichten-Seite sonst. `PK_LISTE === null` heißt aber nicht
„keiner da", sondern „nicht abrufbar" — ein Netzaussetzer beim `passkey.list()` sah für diese
Abfrage aus wie ein leeres Konto und führte geradewegs in den Absatz darüber. Jetzt wird bei
unbekanntem Stand **nicht** gefragt; die Zeile im Profilmenü steht ohnehin immer da.

Im Code hängt alles an `pkStand()` — `aktiv`, `aus`, `problem`, `laden`. Die Menüzeile nimmt
davon Farbe und Text (`pk-ok` / `pk-warn` / `pk-bad`), der Balken `#pkbar` seine Beschriftung
und die Aktion: `pkReset()`, `pkAdd()` oder `pkErneuern()`. Eine eigene Zeile
*Passkey zurücksetzen* gibt es nicht mehr — das erledigt der Balken.

---

## 15 · Monats-Erinnerung automatisch verschicken

**Ziel:** am Ersten jedes Monats bekommt jeder, der zugestimmt hat, eine kurze Mail —
*„wir erinnern dich, dass Juli jetzt zum Schreiben wäre“*. Wer den Monat schon abgegeben hat,
bekommt nichts. Nur per Mail, weil eine Nachricht im App-Postfach niemanden zurückholt.

Fertig im Projekt liegen:

- `monatsmail.ts` — die Edge Function samt Mailvorlage im MOJI-Design
- `monatsmail.sql` — Tabelle `mail_log` gegen Doppelmails und der Zeitplan

### 15.1 Absender *(erledigt)*

Domain, DNS-Einträge und Schlüssel stehen schon — siehe [Abschnitt 12](#12--mailversand-über-resend-erledigt).
Es fehlen nur noch die Secrets, die Function und der Zeitplan.

### 15.2 Schlüssel in Supabase hinterlegen *(erledigt)*

**Project Settings** → **Edge Functions** → **Secrets**:

| Name | Wert |
|---|---|
| `RESEND_API_KEY` | der Schlüssel „MOJI moji-app.at" aus 12.2 |
| `MAIL_VON` | `MOJI <no-reply@moji-app.at>` |
| `MAIL_ANTWORT` | eine Adresse, die du liest — Standard `maru.arbeitszeiten@gmail.com` |

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind automatisch vorhanden. `MAIL_VON` und
`MAIL_ANTWORT` sind nur nötig, wenn du von den Standardwerten abweichen willst.

### 15.2b Was in der Erinnerung steht *(27. September 2026)*

Dieselbe Hülle wie die Anmeldemails (Abschnitt 13): „September ist bereit.", ein Satz, der Knopf
*September abgeben*. **Darunter, wenn es welche gibt, eine zweite Karte: die Bubble Teas, die
auf Antwort warten** — wer einem einen geschickt hat, auf den man noch nicht zurückgeschickt hat.
Das ist dieselbe Regel wie in `tee_senden()`: in `tee` ist das Datum der anderen Seite jünger als
das eigene, oder man hat nie geschickt (`wartendFuer()`). Je Person eine Zeile mit Profilbild
(`mail-av/`), Name mit Kürzel und dem Tag; höchstens fünf, der Rest als „und 2 weitere". Der Knopf
*Bubble Tea zurückschicken* führt auf `moji-app.at/?tee` — die App öffnet dann nach dem Einstieg
gleich die Bubble-Tea-Seite (`TEE_ZIEL`, einmalig, übersteht die Anmeldung, `?tee` verschwindet
danach aus der Adresse). Scheitert die Abfrage von `tee` oder `mitglieder`, kommt die
Erinnerung trotzdem, nur ohne Liste. Geprüft in `tests/test-mail.js`.

### 15.2c Alle an, und jede kommt an *(27. September 2026)*

**Am 01.09.2026 gingen nur 4 von 10 Erinnerungen hinaus**, alle innerhalb einer Sekunde
(`mail_log`, Lauf `2026-08`). Keiner der zehn hatte den August da schon abgegeben. Ursache:
Resend nimmt im freien Zugang **2 Anfragen pro Sekunde** an; die Funktion schickte ohne Pause,
der Rest bekam eine Absage und wurde nie wiederholt. Dazu wartete der Zeitplan (`pg_net`) ohne
Angabe nur 5 Sekunden auf die Funktion. Seither:

- **Pause und Geduld** (`monatsmail.ts`): zwischen zwei Mails mindestens 650 ms; bei 429 oder
  5xx bis zu fünf Versuche, so lange gewartet, wie Resend im Kopf `retry-after` verlangt (höchstens
  20 s), sonst 1, 2, 4, 8 s. Nach 100 s Laufzeit bleibt der Rest liegen (`vertagt` im Bericht).
  Im Bericht stehen keine Mailadressen mehr, nur Kennungen.
- **Drei Läufe am Ersten** (`10 5,6,8 1 * *`, UTC) mit `timeout_milliseconds := 120000`.
  `mail_log` verhindert doppelte Mails — die späteren Läufe holen nur nach, was fehlte.
- **Zustimmung für alle** auf Marcos Wunsch: vorher 10 ja, 8 ausdrücklich nein, 3 nie gefragt.
  Die alten Antworten liegen in `mail_zustimmung_vorher` (für niemanden lesbar außer dem Dienst).
  Abschalten geht weiter im Profilmenü. Neue sehen den Schalter bei der Registrierung von Anfang an auf
  *an* (`OB.mailOk = true`) und können ihn dort mit einem Tipp abschalten.
- **Alte App-Fassungen** schreiben die Zustimmung nicht zurück: die App schreibt bei jeder
  eigenen Wahl `mailStand` (`MAIL_STAND = 2`) mit; kommt ein Profil ohne `mailStand` an, hält der
  Auslöser `records_zustimmung_halten` Zustimmung und Stand von vorher. `normalize()` darf
  `mailStand` nie selbst setzen — sonst gälte ein alter Stand als eigene Wahl.

Migration: `20260927120000_monatsmail_alle.sql`, prüft sich selbst (auch den Auslöser, in
einem zurückgerollten Teilschritt).

**Nebenwirkung, am selben Tag behoben:** Diese Migration änderte jede Zeile in `records`, und
der Auslöser `records_mitglied` setzte dabei bei allen `mitglieder.zuletzt = now()` — in der
Firmenansicht waren plötzlich alle „gerade online". `20260927130000_zuletzt_zurueck.sql` setzt
die 20 betroffenen Zeilen auf den jüngsten echten Hinweis von vorher zurück (letztes Speichern,
letzte Sitzungsaktivität, letzte Anmeldung) und ändert den Auslöser: `zuletzt` rückt nur noch
vor, wenn die Person selbst speichert (`auth.uid() = new.user_id`). **Merke:** Wer `records` in
der Masse ändert, löst `records_mitglied` für jede Zeile aus.

### 15.3 Funktion veröffentlichen *(erledigt)*

Läuft als `monatsmail` unter
`https://kzduwbmiytusvlbotrrr.supabase.co/functions/v1/monatsmail`, *Verify JWT with legacy
secret* eingeschaltet. Zusätzlich prüft die Funktion selbst, ob der Aufruf den
`service_role`-Schlüssel mitbringt — der öffentliche anon-Schlüssel genügt nicht.

Neu veröffentlichen im **Dashboard**: **Edge Functions** → `monatsmail` → **Code** → Inhalt von
`monatsmail.ts` einfügen → **Deploy updates**.

Oder auf dem Rechner mit der CLI:

```bash
mkdir -p supabase/functions/monatsmail
cp monatsmail.ts supabase/functions/monatsmail/index.ts
npx supabase login
npx supabase link --project-ref PROJEKT_REF
npx supabase functions deploy monatsmail
```

### 15.4 Tabelle und Zeitplan *(erledigt)*

Tabelle `mail_log`, `pg_cron`, `pg_net` und der Zeitplan `moji-monatsmail` sind angelegt und
aktiv. Der Plan steht auf `10 5 1 * *` — am Ersten um 05:10 UTC, im Sommer 07:10 Wiener Zeit.
Im Winter wird es 06:10; falls das stören sollte, zweimal im Jahr die Stunde anpassen.

Neu aufsetzen ginge über `monatsmail.sql`; darin ist nur `SERVICE_ROLE_KEY` zu ersetzen.

> **Der Schlüssel im Zeitplan ist der *legacy* `service_role`-JWT**
> (Settings → API Keys → *Legacy anon, service_role API keys*), nicht `sb_secret_…`.
> Er steht im Klartext in `cron.job.command` — dort kommt nur die `postgres`-Rolle hin.

**Diese zwei Einstellungen müssen bleiben, sonst steht die Automatik:**

- Function `monatsmail` → Settings → **Verify JWT with legacy secret** bleibt **an**.
  Sie prüft die Signatur; die Funktion prüft danach nur noch die Rolle.
- Settings → API Keys → **„Disable JWT-based API keys" nicht drücken.**

**Stolperstein, den wir hatten:** in der Umgebung der Edge Function liefert
`SUPABASE_SERVICE_ROLE_KEY` inzwischen den **neuen** `sb_secret`-Schlüssel (41 Zeichen), der
Zeitplan schickt aber den **Legacy-JWT** (219 Zeichen). Ein direkter Vergleich schlug deshalb
mit `401 nein` fehl. `darfRein()` in `monatsmail.ts` akzeptiert jetzt beide Formen.

### 15.5 Vorher einmal trocken prüfen

Im SQL Editor auslesen, wer eine Mail bekäme:

```sql
select r.user_id, u.email, r.data->>'vorname' as vorname
from public.records r join auth.users u on u.id = r.user_id
where r.data->>'mailOk' = 'true'
  and not (r.data->'exp' ? '2026-6');   -- 2026-6 = Juli 2026, Monat ab 0 gezählt
```

Danach die Funktion einmal von Hand anstoßen (**Edge Functions** → `monatsmail` → **Test**,
Header `Authorization: Bearer <service_role>`). Sie antwortet mit
`{ monat, lauf, gesendet, uebersprungen, fehler }`. Ein zweiter Aufruf im selben Monat schickt
nichts mehr — dafür ist `mail_log` da.

**Antworten der Funktion beim Prüfen:**

| Antwort | Bedeutung |
|---|---|
| `401 nein` | Aufruf ohne `service_role`-Rolle — Sperre greift, Code läuft |
| `500 SUPABASE_SERVICE_ROLE_KEY nicht verfuegbar` | Dienstschlüssel fehlt in der Umgebung |
| `500 RESEND_API_KEY fehlt` | Secret nicht gesetzt |
| `200` mit Bericht | alles in Ordnung |

### 15.6 Prüfstand vom 5. August 2026

Testlauf über denselben Befehl, den der Zeitplan ausführt:

```
{ "monat": "Juli", "lauf": "2026-07", "gesendet": 0, "uebersprungen": 6, "fehler": [] }
```

Status 200, keine Mail verschickt — richtig, denn **bei allen bestehenden Konten fehlt `mailOk`
im Profil**. Die Profile wurden gespeichert, bevor es die Einwilligung gab; die Funktion
überspringt alles, was nicht ausdrücklich `true` ist.

**Daraus folgt:** die fünf bestehenden Nutzer bekommen nichts, bis sie im Profilmenü
*Monats-Erinnerung* selbst einschalten. Das Häkchen im Funnel sehen nur neue Konten.

### 15.7 Die einmalige Frage für bestehende Konten *(erledigt, September 2026)*

Genau dafür gibt es jetzt die Ansicht `v-erinask`. Sie erscheint **einmal** nach dem Anmelden
und fragt geradeheraus, ob MOJI am Monatsersten erinnern soll — zwei gleichwertige Knöpfe,
*Ja, erinnere mich* und *Nein danke*. Kein kleiner Textlink für das Nein: bei einer
Einwilligung wäre das schief.

Möglich wird das durch ein zweites Feld im Profil, **`mailGefragt`**. Ohne es wäre
`mailOk = false` doppeldeutig — „nein gesagt" und „nie gefragt" sähen gleich aus. Gesetzt wird
es an vier Stellen: im Funnel, bei den beiden Knöpfen der neuen Ansicht und beim Umschalter im
Profilmenü. Wer den Punkt also selbst gefunden hat, wird nicht mehr gefragt.

Die Frage erscheint nur, wenn **alle vier** Bedingungen zutreffen — nachzulesen in
`erinFrageNoetig()`:

| Bedingung | Warum |
|---|---|
| `CLOUD_ON` und `UID` | ohne Konto gibt es niemanden zu erinnern |
| `MAIL` bekannt | ohne Adresse ginge die Mail nirgendwohin |
| `mailGefragt` nicht `true` | jeder wird genau einmal gefragt |
| `mailOk` nicht `true` | wer schon zugestimmt hat, wird nicht behelligt |

Die Antwort steht im Profil, nicht im Gerätespeicher — anders als beim Passkey, wo die
Ablehnung unter `maru.pkask.<UID>` lokal liegt. Grund: Safari räumt den Gerätespeicher nach
sieben Tagen ohne Besuch ab, die Frage käme sonst wieder. So gilt sie auf allen Geräten
derselben Person.

Eingehängt ist sie hinter `askPasskey()` an zwei der drei Stellen im Anmeldefluss. Der dritte
Aufruf führt in den Funnel — der fragt selbst. **Offline wird nicht gefragt**, weil die Antwort
nicht hochkäme und der Zeitplan nur die Cloud liest.

Dazu liegt im Postfach die Nachricht `erinnerung-2026-09` zum Nachschlagen.

### 15.8 Wie die Erinnerung abgeschaltet wird

Profilmenü → **Monats-Erinnerung**. Der Punkt zeigt *ein · per E-Mail an …* oder *aus* und
schreibt `mailOk` ins Profil; die Funktion überspringt beim nächsten Lauf alle mit `false`.
Voreinstellung für neue Konten ist **aus** — es gilt nur, was ausdrücklich angehakt wurde.

---

## 16 · Mitarbeiter aufnehmen und Konten verwalten

Es braucht keine Einladung. Jede Person tippt ihre Adresse in die App, bekommt Link und Code,
und beim ersten Mal läuft danach der Funnel. Wer sich angemeldet hat, erscheint unter
**Authentication** → **Users**.

**Wenn du zusperren willst:** sag Bescheid, dann kommt eine Liste erlaubter Adressen hinein —
dann nur `@miller.at` oder ausdrücklich freigegebene Personen. Ohne Schranke könnte theoretisch
jeder mit der Adresse der Seite ein Konto anlegen; er sähe nur seine eigenen leeren Daten,
aber sauberer ist eine Schranke.

**Konten löschen:** **Authentication** → **Users** → Zeile → *Delete user*. Alle Fremdschlüssel
auf `auth.users` stehen auf `cascade`, Profil und Passkeys gehen also mit. Vorher prüfen:

```sql
select u.email, r.user_id is not null as hat_profil
from auth.users u left join public.records r on r.user_id = u.id
order by u.created_at;
```

---

# Anhang

## 17 · Dateien im Projekt

Stand 14. September 2026, gegen `git ls-files` geprüft.

**Die App**

| Datei | Wofür |
|---|---|
| `index.html` | die ganze App: Aufbau, Gestaltung, Logik |
| `manifest.webmanifest` | Name und Symbol am Startbildschirm |
| `icon-180.png`, `icon-512.png` | ebendieses Symbol, zwei Größen |
| `av-1.webp` … `av-116.webp` | die 116 Profilbilder |
| `firma-miller.png` | Logo Miller Optik, in der Ansicht *Meine Firma* im Profilmenü |
| `schwein-troete.png` | Schwein mit Tröte. Erscheint im Block `#bleib`, wenn jemand das Löschen des Profils abbricht — „Schön, dass du dich nochmal umentschieden hast" |
| `moji-bricolage*.woff2`, `moji-jakarta*.woff2`, `moji-caveat*.woff2` | die drei Schriften, selbst gehostet |

**Veröffentlichen**

| Datei | Wofür |
|---|---|
| `CNAME` | `moji-app.at` für GitHub Pages |
| `.nojekyll` | leer, schaltet die Jekyll-Verarbeitung bei Pages ab |
| `.gitignore` | hält `.DS_Store` und Arbeitsdateien aus dem Repo |

**Monats-Erinnerung**

| Datei | Wofür |
|---|---|
| `monatsmail.ts` | Code der Edge Function |
| `monatsmail.sql` | Tabelle `mail_log` und Zeitplan dazu |
| `monatsmail-deploy.sh` | veröffentlicht die Function vom Rechner aus |
| `supabase/config.toml` | bindet den Ordner an das Supabase-Projekt |
| `moji-mail-wortmarke.png` | Alte Wortmarke (weiß auf Nachtblau) der Mailvorlagen bis 27.09.2026. Keine aktuelle Vorlage nutzt sie mehr — liegen lassen, sonst fehlt das Bild in alten Mails, die noch in den Postfächern liegen |
| `mail/alt/` | Die beiden Supabase-Vorlagen, wie sie bis 27.09.2026 eingetragen waren |
| `moji-mail-wort-tinte.png`, `moji-mail-wort-hell.png` | Wortmarke der Mails, dunkel für hell und hell für die dunkle Fassung. Aus `LOGO_WORD_TINTE` / `LOGO_WORD` in `index.html` |
| `mail/anmeldung.html`, `mail/registrierung.html` | Die beiden Supabase-Mailvorlagen (Abschnitt 13) |
| `mail-av/av-1.jpg` … `av-116.jpg` | Die Profilbilder quadratisch als JPEG (120 px, Ausschnitt wie in der App) für die Bubble-Tea-Liste der Monats-Erinnerung — Outlook zeigt kein WebP. Kommen neue Bilder dazu: hier nachziehen und `AV_MAX` in `monatsmail.ts` hochsetzen |
| `mail-tee.png` | Der Becher in der Bubble-Tea-Karte der Erinnerung, aus `tee-1.webp` |

**Testreihen**

| Datei | Wofür |
|---|---|
| `tests/alle.js` | startet alle acht Reihen und fasst zusammen. `node tests/alle.js` prüft `index.html`, mit einem Pfad als Argument eine andere Fassung |
| `tests/test-rhythmus.js` | Wochenrhythmus über Jahre mit 53 Kalenderwochen |
| `tests/test-dienstzeiten.js` | Dienstzeiten mit Datum, `schedAlt` und `schedFuer()` |
| `tests/test-erinnerung.js` | die einmalige Frage nach der Monats-Erinnerung |
| `tests/test-einstieg.js` | Einstieg, die zwei Blätter, die 60-Sekunden-Sperre und der Funnel |
| `tests/test-serie.js` | Serien erkennen, fragen, wegfliegen lassen |
| `tests/test-export.js` | Exportseite — und die PDF-Seite selbst, mit echtem jsPDF |
| `tests/test-vorspann.js` | Vorspann, Übergabe an den Gruß, Anlauf der Kopfleiste |
| `tests/test-menue.js` | Profilmenü, Wischgeste, Fassungswechsel |
| `tests/test-kalender.js` | Kalender neu laden und das Osterei |
| `package.json`, `package-lock.json` | **nur für die Testreihen.** Die App braucht davon nichts. `jsdom` und `jspdf` sind auf feste Fassungen genagelt, damit ein `npm install` überall dasselbe holt |

**Dokumentation**

| Datei | Wofür |
|---|---|
| `README.md` | diese Datei, das Gedächtnis des Projekts |

Profilbilder haben ihre eigene Fassung: `AV_STAND` in `index.html` hochsetzen, sonst zeigen
Geräte die alten Bilder aus dem Zwischenspeicher.

> **Was hier früher stand und nicht stimmte:** `moji-favicon.svg`, `moji-wortmarke-*.svg` und
> `moji-icon-marke.svg` liegen nicht im Repo und werden auch nirgends aufgerufen — die Marke
> steckt als SVG direkt in `index.html`. Ebenso fehlen `mail-anmeldung.html` und
> `mail-registrierung.html`: die Mailvorlagen sind in Supabase eingetragen, hier liegt keine
> Kopie davon. Wer sie im Repo haben will, muss sie aus dem Dashboard herausholen
> (→ [Abschnitt 13](#13--mailvorlagen-und-code-erledigt)).

---

## 18 · Offene Punkte

Durchgesehen am 14. September 2026. Was nachprüfbar war, wurde nachgeprüft — bei jedem Punkt
steht, woran man das erkennt.

### Zu tun, mit Priorität

**1 · Nachschauen, ob die Frage angekommen ist.**
Die einmalige Frage nach der Monats-Erinnerung ist gebaut und seit 13. September live
(→ Abschnitt 15.7). Sie greift aber erst, wenn die fünf bestehenden Nutzer die App das nächste
Mal öffnen. Mit der Abfrage aus 15.5 lässt sich zählen, wer inzwischen zugestimmt hat — erst
danach ist der Punkt wirklich erledigt.

**2 · Schlüssel erneuern.** Alle früher einmal offen gezeigten Schlüssel gehören getauscht,
insbesondere der Supabase-`service_role` und das Gmail-App-Passwort, das inzwischen nicht mehr
gebraucht wird. Beim `service_role` daran denken: er steht auch im Zeitplan `moji-monatsmail`
im Klartext (→ Abschnitt 15.4), muss dort also mitgetauscht werden — sonst steht die Automatik.

**3 · Aufräumen in Resend.** Die zwei alten Schlüssel **„MARU SMTP"** und
**„MARU Anmeldemails"** löschen — sie hängen an `studiomaru.at` und funktionieren nicht mehr.
Der Schlüssel **„simply"** (Full access) wird ebenfalls nicht gebraucht.

**4 · Der Weg auf den Home-Bildschirm fehlt am Handy.** Er stand in der Karte *Aufs Handy
legen* auf der Schlussseite des Funnels, und die ist mit dem Umbau vom 14. September entfallen
(→ Abschnitt 2). Auf der Desktop-Sperrseite steht die Anleitung weiterhin, in der App am Handy
nirgends. Eine Zeile im Profilmenü wäre der naheliegende Platz — `beforeinstallprompt` und
`istStandalone()` sind mit entfernt worden und müssten dafür zurückkommen.

**5 · Die alte GitHub-Rückkehradresse** in Supabase entfernen. Der Umzug ist über einen Monat
her; wer noch einen alten Anmeldelink im Postfach liegen hat, wird ihn nicht mehr brauchen.

### Erledigt seit der letzten Durchsicht

- ~~**Einmaliger Hinweis in der App** für die Monats-Erinnerung~~ — gebaut und live,
  → Abschnitt 15.7. Es bleibt nur das Nachzählen, siehe Punkt 1
- ~~**Alter MX-Eintrag** auf der Wurzel von `moji-app.at`~~ — ist weg.
  `dig +short MX moji-app.at` antwortet leer, während `dig +short MX send.moji-app.at`
  weiterhin `feedback-smtp.eu-west-1.amazonses.com` liefert. Der Versand über Resend
  ist also unberührt
- ~~**Dateiliste in Abschnitt 17**~~ — gegen `git ls-files` richtiggestellt
- ~~**`EINRICHTUNG.md`**~~ — gelöscht, ihr Inhalt steht seit längerem in Abschnitt 11 bis 16
- ~~**Dienstzeiten mit Datum versehen**~~ — gebaut und live. `schedAlt` im Profil,
  `schedFuer()` beim Rechnen, Frage beim Speichern und ein Verlauf zum Nachsehen.
  Einzelheiten in [Abschnitt 3](#3--rechnen), Unterabschnitt *Dienstzeiten mit Datum*
- ~~**Schriften ins Repo holen**~~ — erledigt. Bricolage, Plus Jakarta und Caveat liegen als
  `.woff2` neben `index.html`, der Google-Link ist raus. Nachgemessen: **null** Anfragen an
  fonts.googleapis.com beim Laden der Seite
- ~~**Einstieg und Funnel**~~ — neu gebaut am 14. September 2026, siehe
  [Abschnitt 2](#2--anmelden) und 19.4
- ~~**Passkey-Hinweis nannte die alte Adresse**~~ — `pkText()` sagte bei einem
  `InvalidStateError`, man solle den Schlüsselbund-Eintrag für `marcoreimair1.github.io`
  löschen. Die RP ID ist aber `moji-app.at`, und genau dafür meldet das Gerät „habe ich schon" —
  der Hinweis schickte Leute zum falschen Eintrag. Steht jetzt auf `location.hostname` statt
  auf einer festen Adresse, kann beim nächsten Umzug also nicht wieder veralten

### Kein Handlungsbedarf, nur zum Wissen

- **Antworten empfangen** ist nicht eingerichtet und derzeit auch nicht nötig — Reply-To zeigt
  auf eine echte Adresse. Falls doch: GoDaddy kann Mail an `moji-app.at` auf ein bestehendes
  Postfach weiterleiten
- **`studiomaru.at`** kann über Resend nicht mehr senden, weil der Gratis-Plan nur eine Domain
  erlaubt. Wird das gebraucht, braucht es den Pro-Plan ($20/Monat) oder ein zweites Resend-Konto
- **Noch nicht gebaut:** die Versionierung mit Vorschau-Datei aus Abschnitt 19.4. Seit der
  Arbeitsordner am Rechner hängt, ließe sich das leichter bauen als früher — ein Branch neben
  `main` täte im Zweifel dasselbe, ganz ohne zweite Datei

---

## 19 · Übergabe an einen anderen Rechner oder Account

Alles, was zählt, liegt im Repo und in den beiden Diensten — nichts hängt an einem bestimmten
Rechner oder Claude-Konto. Ein Gesprächsverlauf zieht dagegen nicht mit um: Diese Datei ist das
Gedächtnis des Projekts, zusammen mit den Kommentaren im Code.

### 19.1 Was wo liegt

| Was | Wo | Hängt am Konto? |
|---|---|---|
| App, Dokumentation, Bilder, Mailvorlagen, Edge Function | GitHub `marcoreimair1/simply` | GitHub-Login |
| Live-Seite | GitHub Pages → `moji-app.at` | — |
| Profile, Anmeldung, Passkeys, Monatsmail-Zeitplan | Supabase-Projekt `kzduwbmiytusvlbotrrr` (Frankfurt) | Supabase-Login |
| Domain und DNS | GoDaddy | GoDaddy-Login |
| Mailversand | Resend, Absender `no-reply@moji-app.at` | Resend-Login |

### 19.2 In fünf Schritten umziehen

1. Repo auf den Rechner holen:
   `git clone https://github.com/marcoreimair1/simply.git ~/Dokumente/MOJI`
2. Diesen Ordner im neuen Account als Arbeitsordner verbinden
3. Im Browserprofil einmal bei GitHub und Supabase anmelden
4. **Empfohlen:** `git` lokal mit SSH-Schlüssel oder Zugriffstoken einrichten. Dann geht
   Veröffentlichen über `git commit` und `git push` statt über die Weboberfläche — das ist
   schneller und übersteht auch die Tage, an denen GitHub beim Hochladen zickt
5. Diese Datei von vorne lesen; Abschnitt 8 erklärt das Veröffentlichen, 17 die Dateien

### 19.3 Wie gearbeitet wird

- **Eine Datei.** `index.html` enthält Aufbau, Gestaltung und Logik. Kein Build, kein Paketmanager
- **`APP_STAND`** ganz oben im Skriptblock wird bei jeder Veröffentlichung hochgezählt
  (Format `JJJJ-MM-TT-hhmm`). Die Kachel im Kalender vergleicht ihn mit der Datei auf dem Server
- **Vor jeder Veröffentlichung:** den Skriptblock aus der Datei ziehen und mit `node --check`
  prüfen, dann `npm test`. Beim ersten Mal auf einem Rechner vorher einmal `npm install` —
  das holt `jsdom` und `jspdf`, die die Reihen brauchen
- **Nach jeder Veröffentlichung** dieselben Reihen gegen die Datei laufen lassen, die
  `moji-app.at` wirklich ausliefert:

  ```
  curl -s -H 'Cache-Control: no-cache' "https://moji-app.at/?v=$(date +%s)" -o /tmp/live.html
  diff -q index.html /tmp/live.html && node tests/alle.js /tmp/live.html
  ```

  Das ist nicht übervorsichtig. Genau daran ist im September 2026 eine Korrektur verloren
  gegangen, die hier als erledigt stand und im Code nie ankam — siehe 19.4, *Wochenrhythmus*
- **Die acht Reihen liegen seit 14. September 2026 im Repo**, unter `tests/`. Davor wurden sie
  je Sitzung neu geschrieben und waren danach weg. Jede lädt `index.html` in jsdom, führt die
  echte App aus, spielt Bedienschritte durch und prüft Zustände — 323 Prüfungen, rund 25
  Sekunden. Was jsdom nicht kann (Layout rechnen, Animationen abspielen), prüfen sie am
  Quelltext; die Maße dazu stehen im jeweiligen Commit nachgemessen
- **Sichtprüfung nur abgemeldet.** Nie App-Code in einer angemeldeten Sitzung ausführen:
  `save()` schreibt sonst in das echte Profil. Erst prüfen, dass `UID === null` ist

### 19.4 Woran gerade gearbeitet wurde

- **Der Hinweis zum Dienstgeber wandert zum Dienstgeber** (15. September 2026): Als eigener
  Kasten saß er zwischen den Angaben und den Getränken und trennte beides. Jetzt ist er die
  Unterzeile von *Arbeitsort*; die fünf Zeilen wiegen gleich schwer. 766 Prüfungen

- **Die Marke des Dienstgebers, und was ein Bubble Tea ist** (15. September 2026): Die
  Wortmarke ist aus der Vorlage geschnitten und sitzt als breite Platte in der Kachel; im
  Profilmenü steht sie statt des gezeichneten Hauses. In den Details der Kachel stehen jetzt
  alle zehn Getränke mit Namen und Schwelle. 763 Prüfungen

- **Herzen, Rangfarben und ein halb roter Punkt** (15. September 2026): Der Bildrahmen trägt
  die Farbe der MOJI-Stufe, das geteilte Level ist schmaler und hat ein Herz daneben, mit dem
  man Lieblingsleute nach oben holt. Wer einen Bubble Tea geschickt hat, steht noch weiter
  oben und trägt den violetten Ton — bis zurückgeschickt ist. Der Punkt am Profilbild zählt
  Nachrichten und Tees zusammen und wird halb rot, halb violett, wenn beides da ist. Dazu
  lief die Firmenansicht 6 px über den Schirm hinaus: `.msek` brachte aus dem Menü
  `margin:26px 20px` mit und gewann als spätere Regel. 754 Prüfungen

- **Alle bestehenden Konten sind im Team** (15. September 2026): Ein Auslöser an `records`
  zieht die öffentliche Zeile bei jedem Sichern nach, und ein einmaliger Nachzug hat alles
  geholt, was schon da war. Der Auslöser fängt jeden Fehler ab — er darf das Sichern der
  Arbeitszeit nie verhindern. 736 Prüfungen

- **Die Namen standen unsichtbar auf der Teamkarte** (15. September 2026): Sie hieß `.mk` wie
  die Mitarbeiterkarte im Menü, und deren spätere Regel setzt fast weiße Schrift. Umbenannt
  auf `tm-`, mit zwei Prüfungen dagegen. 731 Prüfungen

- **Die Leseregel fragte sich selbst ab** (15. September 2026): `mitglieder` blieb leer, auch
  die eigene Zeile — die Policy las in ihrer eigenen Bedingung aus derselben Tabelle. Jetzt
  über `meine_firma()` mit `security definer`, und sich selbst sieht man immer. Dazu: die
  Ansicht zeigt Ladefehler als Fehler an, statt sie als leere Liste auszugeben — genau das
  hatte den Fehler verdeckt. 728 Prüfungen

- **Meine Firma wird zum Team** (15. September 2026): Vorschaukachel zum Aufklappen, darunter
  alle Mitglieder alphabetisch mit Bild, Filiale, MOJI-Stufe und dem geteilten Bubble-Tea-Level.
  Zwei neue Tabellen (`mitglieder`, `tee`) und drei Funktionen in Supabase, die Tagesregel hält
  der Server. Die zehn Becher sind aus der Vorlage freigestellt. 723 Prüfungen — **die Runde
  zur Datenbank ist dabei nicht geprüft**, dafür bräuchte es ein angemeldetes Konto.

- **Das Profilbild im Willkommensgruß bleibt eckig** (15. September 2026): Am Funnelende wurde
  es rund und war damit das einzige runde Profilbild der App — im Gruß, am Geburtstag und im
  Menü steht es als weiches Viereck. Der Reif darum ist jetzt ein `<rect>` mit derselben Ecke
  statt eines Kreises. 694 Prüfungen

- **Hilfe zur Wochenfrage** (15. September 2026): Unter den vier Knöpfen steht jetzt
  *Ich brauche Hilfe bei dieser Frage*; ein Tipp klappt vier Karten auf — je Zahl Bedeutung,
  Beispiel und Wiederholung, in der Farbe, die diese Woche später im Kalender trägt.
  690 Prüfungen

- **Ein Anlegen darf nichts wegnehmen** (14. September 2026): `pkAdd()` löschte bei
  „gibt es schon" alle Passkeys des Kontos und legte neu an — brach der zweite Versuch ab,
  blieb keiner übrig. Die stille Variante ist entfallen, aufgeräumt wird nur noch über
  `pkErneuern()` im Profilmenü. Dazu fragt `askPasskey()` nicht mehr, wenn der Stand gar nicht
  abrufbar war: `null` heißt „unbekannt", nicht „keiner da". Sechs neue Prüfungen, darunter
  drei am laufenden Ablauf — dafür hat `test-einstieg.js` jetzt einen asynchronen Abschnitt.
  679 Prüfungen

- **Das Osterei kommt auch von selbst** (14. September 2026): Das erste Mal nach 1 bis 2½
  Minuten, danach zwischen 4 und 9, jedes Mal neu gewürfelt — und nur, wenn der Schriftzug
  wirklich zu sehen ist (`eiFrei()`). 673 Prüfungen

- **Postfach als Liste, und MOJI stellt sich vor** (14. September 2026): Jede Nachricht stand
  bisher sofort in voller Länge da, und ob eine gelesen war, sah man kaum. Jetzt eine Zeile je
  Nachricht, angetippt klappt sie auf und gilt damit als gelesen; ungelesen trägt eine
  **NEU**-Pille, gelesen einen Haken. Dazu die neue Nachricht *Hallo, ich bin MOJI* mit Bild,
  die in einfacher Sprache durch das Umbranden und die neuen Funktionen führt. 659 Prüfungen

- **Ein Tag Datumsdrift korrigiert** (14. September 2026): In dieser Sitzung sind die
  Änderungsvermerke über Mitternacht auf den 15. gerutscht, obwohl es der 14. war. In README,
  Code-Kommentaren und Tests zurückgesetzt.

- **Neues Warten nach dem Signieren** (14. September 2026): Statt des Glases, das sich mit Bier
  füllte, steht jetzt das freigestellte Männchen in einem Ring, der sich um es schließt, mit
  einem Lichtband darüber und dem Satz *Deine Arbeitszeit wird geschrieben …*. Gleiche Dauer
  wie vorher; gespeichert wird erst, wenn der Ring geschlossen ist. Glas, Wellen, Blasen und
  das *Prost!* sind ersatzlos entfallen. 641 Prüfungen

- **Hohe Unterschriften kamen winzig heraus** (14. September 2026): Bei kleinem Seitenverhältnis
  hängt die Breite an der Höhe — mit einer festen Höhe von 8 mm wurde eine schmale, hohe
  Unterschrift nur 10 mm breit. Die Höhe rechnet das Blatt jetzt selbst aus (9–15 mm, je
  nachdem wie lang die Tabelle des Monats ist), und die Leiste richtet sich nach der
  Unterschrift statt umgekehrt (46–68 mm). Mit drei Seitenverhältnissen nachgestellt und die
  PDFs angesehen. 627 Prüfungen

- **Die Unterschrift war zu klein geraten** (14. September 2026): Die Leiste zu kürzen war
  richtig, die Unterschrift mitzukürzen nicht — 8 mm über einer 62-mm-Linie sah verloren aus.
  Jetzt nutzt sie die volle Höhe zwischen Erklärzeile und Leiste (11,5 mm, bis 56 mm breit).
  Dafür ist der Fuß zwei Millimeter tiefer gerückt und die Erklärung einen halben herauf.
  626 Prüfungen

- **Drei Korrekturen am Unterschreiben** (14. September 2026): Die Leiste im PDF war 86 mm lang
  und die Unterschrift bis 15 mm hoch — jetzt 62 und 8, das liest sich als Unterschrift und
  nicht als Formularfeld. Der Vermerk *Elektronisch unterschrieben in der MOJI App* stand
  rechtsbündig am Blattrand und gehörte dort zu nichts; er steht jetzt unter der Leiste. Über
  der Kachel steht **Unterschrift** in der Markenfarbe, und im Dunkeln ist das Blatt ein
  ruhiger Papierton statt grellem Weiß. 626 Prüfungen

- **Unterschreiben vor dem Export** (14. September 2026): *PDF erstellen* macht die ganze Kachel
  zum weißen Blatt mit einer hellgrauen Linie; unten wird aus *Kalender* und *Export* ein
  breiter Knopf **Signieren**. Der Strich wandert als zugeschnittenes PNG ins PDF — auf alle
  Seiten eines Exports, seitenverhältnisgetreu, mit dem Vermerk *Elektronisch unterschrieben in
  der MOJI App* daneben. Gespeichert wird er nicht: beim nächsten Export wird neu gefragt.
  617 Prüfungen

- **Räder für die Stände, neue Oberfläche für den Anspruch** (14. September 2026):
  Zeitausgleich und Urlaubstage werden am Rad gestellt statt mit +/− — Viertelstunden und
  halbe Tage, dieselbe Walze wie im Assistenten. Dafür ist `radBau()` in `radKern()` (beliebige
  Beschriftungen) und die zwei Sonderfälle `radBau()` für Uhrzeiten und `radZahl()` für Zahlen
  zerlegt. Beide Flächen und der Urlaubsanspruch tragen jetzt das Schloss von der
  Dienstzeiten-Seite. Und das Blatt der Anmeldung fährt in 0,34 s statt 0,46 s herauf, mit der
  Kurve einer Karte statt des Expo — der Fokus muss in der Geste sitzen, sonst bleibt die
  Tastatur am iPhone unten, und die braucht rund eine Drittelsekunde. 599 Prüfungen

- **Dienstzeiten: Zurück-Knopf und ein Schloss** (14. September 2026): Die Seite hatte keinen
  sichtbaren Weg zurück — nur die Wischgeste — und ließ sich sofort verstellen. Jetzt dieselbe
  Kopfzeile wie im Assistenten und ein Schalter *Bearbeiten*, der die Seite verschlossen hält:
  lesbar, aber taub, und ohne Leiste zum Speichern. Ein Tipp ins Gesperrte wackelt am Schloss,
  statt nichts zu tun. Augenbraue, Displayüberschrift und Fließtext sind entfallen, die zwei
  Knöpfe unten tragen `.einb prim` / `.einb zweit` wie die neuen Bildschirme. 578 Prüfungen

- **Face ID jetzt einrichten** (14. September 2026): Die Nachfrage nach dem Code-Login
  (`#v-pkask`) stand noch im alten Seitengerüst und sprach von *Passkey*. Jetzt dieselbe
  Bauform wie der Einstieg — ganze Fläche, keine Kopfleiste, unten derselbe Kasten mit
  `.einb prim` und `.einb zweit`. Sieben neue Prüfungen, darunter eine, dass das Wort
  *Passkey* dort nicht zurückkommt. 563 Prüfungen

- **Vorspann kürzer, Assistent langsamer** (14. September 2026): Zwei Tempi in
  entgegengesetzte Richtungen. Der Vorspann stand 4,4 s (angemeldet) bzw. 5,4 s und las sich als
  Hänger — jetzt 2,45 s und 2,95 s, das Zeichen kommt nach 0,82 s statt 1,45 s, der Glanz
  wandert in 1,4 s statt 1,9 s. Das Ausblenden bleibt bei 1,1 s: dort ist die App schon
  sichtbar, gewartet wird da nicht. Im Assistenten umgekehrt alles ruhiger: ein Zeichen alle
  32 ms statt 22, die Sprechblase wächst in 0,55 s statt 0,34, die Kacheln kommen in 0,78 s mit
  75 ms Versatz statt 0,5 s mit 45, MOJIs Auftritt dauert 0,95 s statt 0,62, sein Wippen 1,6 s
  statt 1,15. 556 Prüfungen

- **Der Assistent laeuft ruhiger** (14. September 2026): Vier Stellen, an denen es geruckelt hat.
  Geschrieben wird jetzt im Bildtakt statt mit einem Zeitgeber je Zeichen — 22 ms gehen in 16,7 ms
  nicht auf, also kamen mal eines, mal zwei Zeichen je Bild. Die Sprechblase misst ihre Endhöhe,
  bevor das erste Zeichen steht, und wächst einmal weich, statt beim Zeilenumbruch mitten im Wort
  zu springen. Kachelreihen kommen nacheinander herein (`zaKachel`, 45 ms Versatz) statt als Block.
  Und die Räder werden gestellt, während die Einblendung noch läuft — `raederRichten()` erledigt
  das jetzt im selben Zug wie das Einhängen, im Funnel wie im Profilmenü. Dazu ein Auftritt für
  MOJI beim Öffnen. 553 Prüfungen

- **04:00 im wieder eingeschalteten Abschnitt** (14. September 2026): Wer den Nachmittag an einem
  Tag abschaltete, fand ihn am nächsten Tag beim Einschalten auf *04:00* — dem ersten Radeintrag.
  Ein ausgeblendeter Abschnitt hat keinen Kasten, und was keinen Kasten hat, lässt sich nicht
  scrollen: `scrollTop` blieb 0. Das Rad kennt jetzt `_neu()` und richtet sich beim Einblenden
  neu — einmal sofort, dann noch einmal über `requestAnimationFrame`, denn im Hintergrund kommt
  das gar nicht. Wer einen Abschnitt einschaltet, der nie Zeiten hatte, bekommt die Vorgabe;
  bloßes Ansehen schreibt weiterhin nichts. 544 Prüfungen

- **MOJI bewegt sich beim Reden** (14. September 2026): Während getippt wird, wippt er leise mit
  (`.spricht`), und jeder dritte Satz bekommt einen größeren Akzent — abwechselnd ein Nicken und
  ein Hüpfer. Gezählt statt gewürfelt, sonst käme beides zweimal hintereinander oder minutenlang
  gar nicht. Die Bewegung sitzt auf der Hülle `.za-bild`, damit sie dem Wackeln aus `eiWackel`
  nicht in die Quere kommt

- **Eine Zeile über den Wochenknöpfen** (14. September 2026): Die Frage *Arbeitest du jede Woche
  gleich?* sagte nicht, dass die vier Knöpfe darunter eine Antwort sind. Jetzt steht dazwischen
  *Wähle aus, in welchem Wochen-Intervall du arbeitest:* (`.za-vor`). 534 Prüfungen

- **Dienstzeiten bearbeiten, neu** (14. September 2026): Das Profilmenü zeigt jetzt eine
  kompakte Tagesliste statt des alten Formulars; angetippt klappt ein Tag auf und trägt dieselben
  Abschnitte und Räder wie der Assistent. Die zwei Schlösser sind weg, hinauswischen geht wie im
  Menü und fragt bei Änderungen nach. `renderSched()`, `openTime()`, `schlossHtml()` und das
  Zeit-Popover sind ersatzlos entfallen — rund 300 Zeilen. 80 Prüfungen in der Menü-Reihe, alle
  neun zusammen 532

- **Zeit-Assistent: Punkte, Tempo, leere Kopfzeile** (14. September 2026): Ein Satz, der
  weitergeht, endet auf Punkte und der nächste fängt damit an; geschrieben wird ein Zeichen alle
  22 ms statt zwei; und oben steht nur noch *Zurück* — am Anfang und am Ende gar nichts

- **Zeit-Assistent: sechs Korrekturen vom Gerät** (14. September 2026): Die Tagesfrage nennt jetzt
  die Kalenderwoche und meint damit eine Woche; gewählte Tage bekommen einen grünen Rand im Grün
  der Kugel statt einer Füllung; die Räder lassen sich nur noch senkrecht ziehen und schreiben
  keine falsche Zeit mehr in den Plan (04:00 am iPhone, siehe Abschnitt 2); Vorgabe 08:00–12:00
  und 13:00–17:00, jeder weitere Tag übernimmt vom Tag davor; die Stunden stehen bündig rechts an
  jeder Kachel; die Summe darunter kommt ohne Emoji aus. 158 Prüfungen in der Einstiegs-Reihe,
  alle neun zusammen 503

- **Zeit-Assistent nachgezogen** (14. September 2026): Das *weiter* sitzt jetzt unter der Blase
  statt darin, die Begrüßung steht mittig auf dem Schirm und kommt ohne Zählung und Balken aus,
  und oben rechts führt ein Kreuz mit Rückfrage jederzeit hinaus
- **Der Zeit-Assistent** (14. September 2026): Die Dienstzeiten das erste Mal eintragen läuft
  nicht mehr über ein Formular mit vierundzwanzig Feldern, sondern über MOJI: eine Frage je Bild,
  Antworten zum Antippen, Uhrzeiten an Rädern wie beim Wecker, Text Zeichen für Zeichen. Mehrere
  Wochenintervalle bekommen eigene Farben und eine Übernahme aus früheren Wochen. Gerechnet wird
  nichts anders — am Ende steht dieselbe `sched`-Struktur. Einzelheiten in
  [Abschnitt 2](#2--anmelden), Unterabschnitt *Der Zeit-Assistent*. Geprüft mit 144 Prüfungen in
  der Einstiegs-Reihe (alle neun zusammen 489), darunter ein kompletter Durchlauf mit zwei
  Wochen, und im Browser hell und dunkel durchgespielt. **Noch offen:** dasselbe für das
  Bearbeiten im Profilmenü — dort steht weiterhin `renderSched()`
- **Vorspann: leiser Balken, und das Zeichen wartet aufs Bild** (14. September 2026): Der Balken
  ist zurück, aber sehr zurückgenommen — 2 px, höchstens 132 px breit, ohne eigene Farbe (im
  Hellen Grau, im Dunkeln ein leises Weiß, beides aus `--tx-rgb`). Der Ablauf ist jetzt erzählt:
  erst nur der Hintergrund, dann der Balken bis zur Hälfte, dort erscheint das Männchen und der
  Glanz wandert **einmal** darüber, dann der Rest. Das Männchen erscheint dabei erst, wenn
  `img.decode()` durch ist — beim ersten Besuch war die Hülle sonst kurz leer. `balkenZug()`
  nimmt keinen späteren Zug zurück. 74 Prüfungen in der Vorspann-Reihe, alle neun zusammen 463
- **Vorspann: kein Glitzer mehr, scharfes Bild** (14. September 2026): Schleier, Lichtpunkte und
  der weiße Blitz sind raus, der Vorspann ist durchsichtig und zeigt dieselben Farbwolken wie die
  Anmeldeseite dahinter. Das Männchen war auf 256 px gezogen sichtbar unscharf — die Vorlage hatte
  nur 120 px. Neu aus `icon-512.png` freigestellt (385 × 315) und als WebP eingebettet: schärfer,
  kleiner als vorher, und auf 184 px zurückgenommen. `startParticles()` samt Canvas ist entfallen
- **Der Blitzer beim Fassungswechsel und rundere Übergänge** (14. September 2026): Beim
  Umschalten auf der Anmeldeseite blitzte oft kurz die Kopfleiste über einer leeren Seite auf —
  die Lücke zwischen `vorspannUeberspringen()` und dem ersten `go()`, deren Länge am Netz hängt.
  Nachgestellt und bestätigt, dann mit einem fortgesetzten Deckel geschlossen. Dazu weichere
  Übergänge: das Blatt kommt ganz von unten, der Einstieg tritt dahinter zurück, Adresse → Code
  blättert in der stehenden Karte weiter, Zugehen ist jetzt auch eine Bewegung, und im Funnel
  zieht der alte Schritt ab, statt zu verschwinden. 118 Prüfungen in der Einstiegs-Reihe, alle
  neun zusammen 451
- **Vorspann: nur noch das freigestellte Männchen** (14. September 2026, zweiter Durchgang):
  Der Ladebalken ist ganz entfallen, und statt des App-Symbols mit Kachel steht dort jetzt das
  freigestellte Männchen. Der Glanz bleibt — er wird über eine CSS-Maske auf die Silhouette
  beschnitten, weil ohne Kachel nichts mehr abschneidet. Die Zeiten sind unberührt;
  `introSchliessen()` merkt sich den Endzeitpunkt nun in `window.__introEnde`, worüber auch die
  Testreihe prüft, die vorher über die Dauer des letzten Balkenzugs ging. 62 Prüfungen in der
  Vorspann-Reihe, alle neun zusammen 446
- **Vorspann: nur noch Symbol und Balken** (14. September 2026): Wortmarke und Slogan sind
  raus, über das Symbol wandert ein Glanz wie über eine Metallkarte (von links oben nach rechts
  unten, als gedrehter Streifen in `.mark-tile::after`). Der Ladebalken ist überarbeitet —
  voller Markenverlauf, Licht an der Spitze, Glanz im selben Takt wie oben —, **die Zeiten
  bleiben unverändert**: `INTRO_MIN` 4,4 s, die zwei Züge 86 % / Rest, alle Kurven wie gehabt.
  Die Prüfungen der Vorspann-Reihe liefen unverändert durch, genau dafür sind sie da; acht neue kamen für Glanz und Balken dazu (60 statt 52, alle neun Reihen 444)
- **Willkommen zeigt das Profilbild** (14. September 2026): Der Schluss des Funnels deckte das
  frisch zugeteilte Profilbild mit einem gezeichneten Haken zu — man sah es nie. Jetzt bleibt
  das Bild stehen, wird rund, der Reif zieht sich darum und der Haken springt an die Ecke.
  Text freundlicher: *Hi Anna!* / *Willkommen bei MOJI.* Nebenbei stand der Rand des Hakens
  fest auf Dunkelblau und war im Hellen ein dunkler Fleck auf Pastell; er trägt jetzt die Farbe
  der Fläche darunter. Geprüft mit 113 jsdom-Testfällen (alle neun Reihen 436) und im Browser
  in beiden Fassungen angesehen
- **Der Schriftzug schreibt sich selbst** (14. September 2026): Aus *Los geht's* wurde eine
  Schleife — erst nur das Männchen aus dem Osterei, dann schieben sich MOJI und beim nächsten
  Durchgang 文字 darunter hervor, das Männchen wackelt und schiebt sich wieder darüber. Je
  Buchstabe ein Klopfer, aber nur zwei Runden lang und nur, wo der Browser eine Vibration kennt
  — am iPhone also gar nicht. Dasselbe Männchen steht nun auch über beiden Blättern der
  Anmeldung, und die lassen sich nach unten wegschieben. Dabei kam eine Lücke in der Testreihe
  heraus: ein Lauf, der unterwegs abbricht, sah in der Übersicht wie ein Haken aus — jetzt
  verlangt auch `test-einstieg.js` den Vermerk `__FERTIG`, so wie die acht anderen Reihen.
  Geprüft mit 108 jsdom-Testfällen (alle neun Reihen 431) und im Browser in beiden Fassungen
- **Einstieg und Funnel neu** (14. September 2026): Der Weg von der ersten Sekunde bis zum
  Kalender ist ersetzt. Statt der Werbeseite mit fünf Musterbildern ein Anmeldefenster mit
  einer Zeile und zwei Knöpfen, Fassungsschalter oben rechts; Adresse und Code liegen in zwei
  Blättern, der Übergang passiert noch in der Geste, damit am iPhone die Tastatur mit
  hochfährt; *Erneut senden* ist 60 Sekunden gesperrt. Der Funnel hat vier statt fünf Schritte,
  Erinnerung und Passkey sind zwei Schalter darin, der Dienstplan eine Frage mit zwei
  Antworten. Zum Schluss ein gezeichneter Haken und der Kalender, der hereinfährt.
  Entfallen: Arbeitsort-Seite, A4-Vorschau, Kartenkarussell — und damit auch die Karte
  *Aufs Handy legen*, die es in der App am Handy derzeit nirgends mehr gibt. Rund 17 KB toter
  Stil sind mitgegangen. Einzelheiten in [Abschnitt 2](#2--anmelden). Geprüft mit 91 neuen
  jsdom-Testfällen (`tests/test-einstieg.js`, alle 9 Reihen zusammen 414) und im Browser hell
  und dunkel einmal ganz durchgespielt
- **Fassungswechsel lädt neu** (13. September 2026): Hell/Dunkel-Umschalten lädt die Seite neu,
  gedeckt und ohne Vorspann und Gruß, damit die Statusleiste die neue Farbe übernimmt. Dabei
  kam ein alter Fehler heraus: die Fassung wurde erst am Seitenende gesetzt, dunkle Nutzer
  sahen bei jedem Start ein weißes Aufblitzen. Einzelheiten in [Abschnitt 3](#3--rechnen),
  Unterabschnitt *Hell und Dunkel umschalten*. Geprüft mit 56 jsdom-Testfällen und einem echten
  Umlauf im Browser
- **Osterei im Schriftzug** (13. September 2026): Ein Tipp auf den MOJI-Schriftzug lässt das
  Maskottchen von links vorbeischauen. Dafür wurde das Männchen aus der Icon-Vorlage
  freigestellt — ohne Kachel, ohne Hintergrund. Einzelheiten in [Abschnitt 3](#3--rechnen),
  Unterabschnitt *Das Osterei*. Geprüft mit 35 jsdom-Testfällen und im Browser in beiden
  Fassungen angesehen
- **PDF nachgezogen** (13. September 2026): Farbkreise raus, Kopfband als leichter hellblauer
  Verlauf; App-Symbol freigestellt (die violetten Ecken kamen vom Seitenhintergrund der
  Vorlage); die Einladung in MOJIs Anzeigeschrift statt in Handschrift; Legende entfernt.
  Einzelheiten in [Abschnitt 4](#4--pdf-export)
- **PDF neu gestaltet** (13. September 2026): Kopfband in Pastell mit App-Symbol, Einladung in
  Handschrift und QR-Code; Tabelle ohne Kasten, Kategorien in den Farben der App; Unterschrift
  in eingebetteter Blockhandschrift (Architects Daughter, 24 KB). `sigImage()` und
  `logoBlack()` sind entfallen. Einzelheiten in [Abschnitt 4](#4--pdf-export). Geprüft mit 43
  jsdom-Testfällen und zwei gerenderten Seiten (30 und 31 Tage)
- **Kalender neu laden** (13. September 2026): Nochmal auf den Kalender-Tab tippen holt den
  laufenden Monat zurück, mit kurzer Bewegung. Der Heute-Knopf teilt sich die Funktion.
  Einzelheiten in [Abschnitt 3](#3--rechnen). Geprüft mit 19 jsdom-Testfällen und im Browser
  nachgemessen
- **Gruß deckt den Wechsel** (13. September 2026): Beim An- und Abmelden lag der Gruß bisher
  *nach* dem Ansichtswechsel — man sah den Kalender aufblitzen, und die Bewegung in der
  Kopfleiste lief dahinter ab. Jetzt blendet er zuerst auf, und erst wenn er deckt, wechselt
  darunter die Ansicht. Einzelheiten in [Abschnitt 3](#3--rechnen), Unterabschnitt
  *Der Vorspann*. Geprüft mit 11 neuen jsdom-Testfällen
- **Exportseite** (13. September 2026): Abgegebene Monate tragen jetzt einen grünen Haken auf
  der Kachel — bisher war das nur im Verlauf hinter einem kleinen Knopf zu sehen, daher der
  Eindruck, es werde nichts mitgeführt. Der Verlauf schreibt aus, welches Datum was ist. Der
  Knopf *Lieber pro Monat eine eigene Datei* ist entfernt. Dabei fiel ein UTC-Fehler auf: das
  *Erstellt am* im PDF zeigte nachts den Vortag. Einzelheiten in
  [Abschnitt 4](#4--pdf-export). Geprüft mit 29 jsdom-Testfällen, Sichtprüfung hell und dunkel
- **Serien** (13. September 2026): Ein Zeitraum hält jetzt zusammen. Zurücksetzen eines Tages
  fragt nach — nur dieser Tag oder die ganze Serie —, und die Tage fliegen nacheinander weg.
  Auch für die Einträge, die es schon gibt: die haben keine Kennung und werden über gleiche
  Nachbarn erkannt. Einzelheiten in [Abschnitt 3](#3--rechnen), Unterabschnitt *Serien*.
  Geprüft mit 33 jsdom-Testfällen und im Browser nachgemessen
- **Kopfleiste und Wischen** (13. September 2026): Der Anlauf der Kopfleiste hängt jetzt am
  freien Schirm statt an einer festen Uhr — er lief seit dem längeren Vorspann hinter dem
  Gruß ab. Dazu Wischen nach rechts im Menü und seinen fünf Untermenüs. Einzelheiten in
  [Abschnitt 3](#3--rechnen). Geprüft mit 8 neuen jsdom-Testfällen und im Browser mit echten
  Zeigerereignissen nachgespielt
- **Menü durchgesehen** (13. September 2026): Seitenmaße, Untermenüs als eigene Bildschirme,
  Schließen-Knopf, Rücksprung ohne Blitzer, Schieberegler für Monats-Erinnerung und Passkey,
  Profilbildrahmen ohne weiße Fuge. Sieben Ursachen, aufgelistet in
  [Abschnitt 3](#3--rechnen), Unterabschnitt *Was beim Umbau auf Vollbild liegen blieb*.
  Geprüft mit 30 jsdom-Testfällen und im Browser nachgemessen: alle fünf Flächen exakt
  375 × 812 an 0,0, Zurück-Pfeil überall an 14/12, seitlicher Überstand 0 statt 15 px
- **Vorspann neu getaktet** (13. September 2026): Ladebalken, der auf den echten Start wartet;
  der Gruß mit dem Profilbild wird jetzt vom Vorspann *übernommen* statt darüber gelegt; das
  App-Symbol liegt als base64 in der Datei, weil es als Datei zu spät kam. Dabei kamen zwei
  Fehler vom Umbranden heraus: `.aurahg` hatte allen vier Vollbildflächen ihre Überblendung
  gelöscht (`animation` ist ein Kurzschreiben), und der Vorspann blendete deshalb über 5 s statt
  1,1 s aus — sichtbar war davon nichts, er wurde nach 1,15 s abgeräumt. Einzelheiten in
  [Abschnitt 3](#3--rechnen), Unterabschnitte *Der Vorspann* und *Überblendungen*. Geprüft mit
  33 jsdom-Testfällen und einer Sichtprüfung in beiden Fassungen, abgemeldet
- **Umbranden auf Violett** (13. September 2026): neue Marke `#C643FE` aus dem App-Symbol,
  Hell als Vorgabe mit Umschalter im Profilmenü, Kategoriefarben in OKLCH gerechnet, Profilmenü
  als Vollbild, neues App-Symbol. Einzelheiten in Abschnitt 3. Gebaut wurde es über ein
  Umfärbeskript, das aus der alten Datei die neue erzeugt hat — rund 300 feste Farbwerte im
  CSS und 90 im JavaScript mussten dafür erst zu Token werden
- **Dienstzeiten mit Datum** (13. September 2026): `schedAlt` im Profil, `schedFuer()` beim
  Rechnen, Frage beim Speichern (*Nur korrigieren* / *Ab einem Datum*) und ein Verlauf zum
  Nachsehen und Entfernen. Einzelheiten in Abschnitt 3. Geprüft mit 42 jsdom-Testfällen und
  einem vollständigen Durchlauf im Browser, abgemeldet
- **Arbeitsordner angebunden** (13. September 2026): Das Repo liegt jetzt lokal unter
  `~/MOJI-APP`, Veröffentlichen geht über `git push` statt über die Weboberfläche. GitHub
  hängt an einem SSH-Schlüssel, die Supabase-CLI ist angemeldet; `supabase/config.toml` und
  `monatsmail-deploy.sh` erledigen den Deploy der Edge Function vom Rechner aus
- **Einmalige Frage nach der Monats-Erinnerung gebaut** (13. September 2026): neue Ansicht
  `v-erinask` und das Profilfeld `mailGefragt` — Einzelheiten in Abschnitt 15.7. Geprüft mit
  40 jsdom-Testfällen und einer Sichtprüfung am Handyformat, abgemeldet
- **Dokumentation durchgesehen** (13. September 2026): `EINRICHTUNG.md` gelöscht, Abschnitt 17
  gegen `git ls-files` geprüft, Abschnitt 18 nach Priorität sortiert und mit Nachweisen
  versehen, zwei kaputte Anker im Inhaltsverzeichnis behoben. Dabei fiel der veraltete
  Passkey-Hinweis auf — siehe Abschnitt 18, Erledigtes
- **Wochenrhythmus korrigiert** (13. September 2026): Der Zyklus hing an der Kalenderwoche und
  stolperte in Jahren mit 53 Wochen — auf KW 53 folgte KW 1, also zweimal dieselbe Woche.
  Jetzt zählt `wochenNr()` die Wochen fortlaufend ab Montag, 1. Jänner 2024. Bestehende Profile
  bekommen in `normalize()` einmalig einen umgerechneten Versatz (`sched.basis = 'lauf'`),
  damit die laufende Woche dieselbe bleibt. Einzelheiten in
  [Abschnitt 3](#3--rechnen), Unterabschnitt *Wochenrhythmus*

  > **Zur Warnung, wie das passieren konnte:** Genau dieser Eintrag stand hier schon einmal —
  > als *erledigt*, datiert September 2026. Im Code stand davon nichts: `wochenNr` und
  > `sched.basis` kamen null Mal vor, und `git log -S "wochenNr"` fand über die ganze Historie
  > keinen einzigen Treffer. Die Korrektur war beschrieben, aber nie hochgeladen — vermutlich
  > beim Hochladen über die Weboberfläche verloren. Aufgefallen ist es erst, als jemand meldete,
  > dass Samstag, 9. Jänner 2027 frei anzeigt, obwohl er Arbeitstag wäre. **Lehre:** was hier
  > als erledigt steht, gehört gegen den Code geprüft, nicht gegen die Erinnerung. Seit der
  > Arbeitsordner am Rechner hängt, geht das mit einem `grep`
- **Noch nicht gebaut:** Versionierung mit einer Vorschau-Datei. Gedacht war: `vorschau.html`
  neben `index.html`, dort wird entwickelt und am Handy getestet; auf Zuruf wird sie nach
  `index.html` kopiert, Versionsnummer hoch, Änderungen in eine `VERSIONEN.md`. Dazu eine
  Schema-Nummer im Profil, damit eine zu alte App zum Neuladen auffordert statt falsch zu rechnen
