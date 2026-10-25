export interface MedievalRelic {
  id: string;
  name: string;
  titleDe: string;
  era: string;
  location: string;
  discoveredText: string;
  descriptionFront: string;
  descriptionBack: string;
  didacticFact: string;
  icon: string;
  unlockedChapter: number;
  x: number;
  y: number;
}

export const MEDIEVAL_RELICS: MedievalRelic[] = [
  {
    id: 'relic_pflugmesser',
    name: 'Eisernes Pflugmesser (Sech)',
    titleDe: 'Eisernes Pflugsech aus dem 12. Jahrhundert',
    era: 'Hochmittelalter (ca. 1150 n. Chr.)',
    location: 'Südfeld / Dreifelder-Gewann',
    discoveredText: 'Im Lehmboden der Ackerfurche ragt ein geschmiedetes Eisenmesser hervor!',
    descriptionFront: 'Vorderseite: Eine massiv geschmiedete, einseitig geschliffene Eisenklinge mit angeschmiedeter Tülle zur Befestigung am hölzernen Pflugbaum.',
    descriptionBack: 'Rückseite: Spuren von Schmiedehämmern und starke Schleifriefen durch jahrelangen Schnitt dichter Graswurzelböden.',
    didacticFact: '📌 Merksatz fürs Geschichtsheft: Das eiserne Pflugmesser schnitt dichte Wurzelböden senkrecht auf und ermöglichte zusammen mit der Dreifelderwirtschaft eine Verdopplung der Ernteerträge.',
    icon: '/assets/relics/relic_pflugmesser.png',
    unlockedChapter: 2,
    x: 62 * 16,
    y: 60 * 16,
  },
  {
    id: 'relic_silberdenar',
    name: 'Kölner Silberpfennig (Denar)',
    titleDe: 'Silberner Denar mit Bischofsstab & Kirchenportal',
    era: 'Hochmittelalter (ca. 1180 n. Chr.)',
    location: 'Marktplatz am Mühlenbach',
    discoveredText: 'Im Pflaster des Marktwegs schimmert eine feine Silbermünze hervor!',
    descriptionFront: 'Avers (Bildseite): Prägung des Erzbischofs von Köln mit Krummstab und segnender Hand, umrahmt von einer lateinischen Umschrift.',
    descriptionBack: 'Revers (Rückseite): Stilisierte romanische Kirchenfassade mit Kreuzgiebel als Zeichen königlicher und kirchlicher Münzhoheit.',
    didacticFact: '📌 Merksatz fürs Geschichtsheft: Silberne Pfennige (Denare) verdrängten im Hochmittelalter den reinen Tauschhandel und dienten Grundherren zur Ablösung mühsamer Frondienste in Geldzahlungen.',
    icon: '/assets/relics/relic_silberdenar.png',
    unlockedChapter: 4,
    x: 32 * 16,
    y: 44 * 16,
  },
  {
    id: 'relic_lehnsurkunde',
    name: 'Lehnsurkunde mit Wachssiegel',
    titleDe: 'Kaiserliche Belehnungsurkunde mit rotem Reitersiegel',
    era: 'Hochmittelalter (ca. 1215 n. Chr.)',
    location: 'Burgarchiv im Palas',
    discoveredText: 'In einer ledernen Reiseröhre liegt eine sorgsam versiegelte Urkunde!',
    descriptionFront: 'Vorderseite: Fein geschriebenes Latein auf Kalbspergament, das Graf Eberhard das Burglehen und die Hofgerichtsbarkeit verbrieft.',
    descriptionBack: 'Rückseite: An seidenen Schnüren herabhängendes, rotes Siegel aus Bienenwachs mit dem geprägten Bildnis des Kaisers zu Pferde mit Reichsschwert.',
    didacticFact: '📌 Merksatz fürs Geschichtsheft: Die Lehnsurkunde besiegelte das gegenseitige Treueverhältnis zwischen Lehnsherr (Schutz und Land) und Vasall (Treue und Heeresfolge im Krieg).',
    icon: '/assets/relics/relic_lehnsurkunde.png',
    unlockedChapter: 4,
    x: 32 * 16,
    y: 20 * 16,
  },
  {
    id: 'relic_ritterschild',
    name: 'Herolds-Wappenschild',
    titleDe: 'Dreiecksschild mit aufsteigendem Löwen und Lilien',
    era: 'Hochmittelalter (ca. 1230 n. Chr.)',
    location: 'Rüstkammer der Burg',
    discoveredText: 'Auf einem Waffenständer funkelt ein handbemalter Ritter-Dreiecksschild!',
    descriptionFront: 'Vorderseite: Leuchtend blaue Fassung mit goldenem Löwen und zwei Lilien, lackiert mit Eiweißlasur auf mehrfach geleimtem Lindenholz.',
    descriptionBack: 'Rückseite: Dick gepolsterte lederne Armschlaufen (Fessel) und Trageriemen (Guige) zum Tragen auf dem Rücken beim Reiten.',
    didacticFact: '📌 Merksatz fürs Geschichtsheft: Durch die Einführung geschlossener Topfhelme wurden Wappen und Heroldsfarben unverzichtbar, um Freund und Feind auf Turnier und Schlachtfeld zu erkennen.',
    icon: '/assets/relics/relic_ritterschild.png',
    unlockedChapter: 6,
    x: 16 * 16,
    y: 24 * 16,
  },
  {
    id: 'relic_codex',
    name: 'Illuminierte Klosterhandschrift (Codex)',
    titleDe: 'Evangelistar mit Buchmalerei aus dem Skriptorium',
    era: 'Hochmittelalter (ca. 1160 n. Chr.)',
    location: 'Klosterbibliothek & Skriptorium',
    discoveredText: 'Auf dem Lesepult im Skriptorium ruht ein prachtvoll gebundener Codex!',
    descriptionFront: 'Vorderseite: Dunkelroter Ledereinband mit gravierten Messingbeschlägen und Schließen zum Schutz des quellenden Pergaments vor Feuchtigkeit.',
    descriptionBack: 'Innenseite: Kunstvolle Blattgold-Initialen, mit der Gänsekiel-Feder gezogene Zeilen und am Rand Darstellungen mönchischer Feldarbeit.',
    didacticFact: '📌 Merksatz fürs Geschichtsheft: Mönche in den Skriptorien retteten das Wissen der Antike über die Jahrhunderte, schrieben jedes Buch per Hand ab und bildeten den ersten Stand (oratores) des Mittelalters.',
    icon: '/assets/relics/relic_codex.png',
    unlockedChapter: 3,
    x: 84 * 16,
    y: 26 * 16,
  },
];
