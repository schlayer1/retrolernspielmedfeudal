/**
 * 5 Didaktische Mitmach-Stationen für Das Europäische Mittelalter (stations.ts)
 * Interaktive Mini-Simulationen zu Dreifelderwirtschaft, Klostermedizin, Rüstkammer/Heraldik,
 * Zunftwaage und Dombau/Gewölbekonstruktion.
 */

export interface InteractiveStation {
  id: string;
  chapterId: number;
  title: string;
  subtitle: string;
  type: 'crop_rotation' | 'mortar_crafting' | 'symbol_decoder' | 'arch_construction' | 'scale_weighing';
  x: number;
  y: number;
  lexiconUnlockId: string;
  description: string;
  instruction: string;
  successMessage: string;
  config: Record<string, any>;
}

export const MEDIEVAL_STATIONS: InteractiveStation[] = [
  {
    id: 'station_dreifelderwirtschaft',
    chapterId: 2,
    title: 'Dreifelderwirtschaft & Wendepflug',
    subtitle: 'Agrarsimulation: Fruchtwechsel & Bodenerholung',
    type: 'crop_rotation',
    x: 64 * 16,
    y: 58 * 16,
    lexiconUnlockId: 'dreifelderwirtschaft',
    description:
      'Im Hochmittelalter revolutionierte die Dreifelderwirtschaft zusammen mit dem eisernen Wendepflug und dem Kummet die europäische Landwirtschaft. Durch den jährlichen Wechsel von Wintergetreide, Sommerfrucht und Brache erholte sich der Boden und Hungersnöte wurden drastisch reduziert.',
    instruction:
      'Teile den drei Gewannen der Dorfflur die historisch korrekte Feldfrucht zu!',
    successMessage:
      'Exzellent gewirtschaftet! Die Dreifelderwirtschaft ermöglichte das enorme Bevölkerungswachstum des Hochmittelalters.',
    config: {
      fields: [
        { id: 'feld_1', name: '1. Winterfeld (Aussaat im Herbst)', correctCrop: 'Winterroggen & Spelzweizen für das tägliche Brot' },
        { id: 'feld_2', name: '2. Sommerfeld (Aussaat im Frühjahr)', correctCrop: 'Hafer für die Zugpferde & proteinreiche Ackerbohnen' },
        { id: 'feld_3', name: '3. Brachefeld (Bodenerholung)', correctCrop: 'Pflanzenruhe & Beweidung durch Schafe zur Dung-Anreicherung' },
      ],
      options: [
        'Winterroggen & Spelzweizen für das tägliche Brot',
        'Hafer für die Zugpferde & proteinreiche Ackerbohnen',
        'Pflanzenruhe & Beweidung durch Schafe zur Dung-Anreicherung',
      ],
    },
  },
  {
    id: 'station_kraeuter',
    chapterId: 3,
    title: 'Der Arznei-Mörser im Klostergarten',
    subtitle: 'Klostermedizin & Kräuterkunde nach Hildegard von Bingen',
    type: 'mortar_crafting',
    x: 82 * 16,
    y: 28 * 16,
    lexiconUnlockId: 'klerus_ora_et_labora',
    description:
      'Die Klöster waren die Zentren des medizinischen Wissens. In den Klostergärten (Hortus medicus) zogen die Mönche Heilkräuter und bereiteten im Mörser Salben und Tinkturen zu, um Arme und Kranke nach der Benediktinerregel zu versorgen.',
    instruction:
      'Wähle die 3 heilsamen Zutaten und zerstoße sie im Steinmörser zur Wundsalbe!',
    successMessage:
      'Klostersalbe erfolgreich gemörsert! Klöster retteten das antike Heilwissen durch das gesamte Mittelalter.',
    config: {
      ingredients: [
        { label: 'Echter Thymian (Desinfizierend gegen Wundfieber)', targetParts: 3 },
        { label: 'Goldene Ringelblume (Fördert Fleischwundheilung)', targetParts: 2 },
        { label: 'Reines Bienenwachs (Salbengrundlage & Schutzfilm)', targetParts: 1 },
      ],
    },
  },
  {
    id: 'station_ruestkammer',
    chapterId: 6,
    title: 'Die Rüstkammer: Kleidung des Ritters',
    subtitle: 'Ritterrüstung von innen nach außen',
    type: 'arch_construction',
    x: 18 * 16,
    y: 24 * 16,
    lexiconUnlockId: 'turnier_heraldik',
    description:
      'Ein Ritter trug seine Rüstung in mehreren exakt aufeinander abgestimmten Schutzschichten. Ohne das dicke Gambeson hätten Schläge Knochen gebrochen, das Kettenhemd wehrte Schnitte ab und der Topfhelm schützte vor Lanzenstößen.',
    instruction:
      'Bringe die Schutzschichten des Ritters in die historisch richtige Reihenfolge (von innen nach außen)!',
    successMessage:
      'Der Ritter ist streitbar gerüstet! Wappen und Helmzier machten ihn trotz geschlossenen Visiers auf dem Schlachtfeld erkennbar.',
    config: {
      steps: [
        '1. Gambeson: Dick gestepptes Wams aus Leinen und Rosshaar dämpft Aufprallwucht ab',
        '2. Kettenhemd & Kettenhaube: Über 20.000 vernietete Eisenringe wehren Schwertklingen ab',
        '3. Rädchensporen & Schwertgurt: Riemen mit goldenen Sporen als Standeszeichen des Ritters',
        '4. Topfhelm & Heroldsschild: Geschlossener Kübelhelm mit Sehschlitzen und bemalter Dreiecksschild',
      ],
    },
  },
  {
    id: 'station_zunft_waage',
    chapterId: 7,
    title: 'Die Zunft- & Tuchwaage am Marktplatz',
    subtitle: 'Münzgewicht & Qualitätsprüfung der Gilden',
    type: 'scale_weighing',
    x: 34 * 16,
    y: 46 * 16,
    lexiconUnlockId: 'zunft_markt',
    description:
      'In den aufstrebenden Städten des Hochmittelalters ("Stadtluft macht frei") überwachten die Zünfte strikt Maße, Gewichte und Preise. Um Betrug beim Fernhandel zu verhindern, wog der Marktvogt Silberdenare auf feinen Balkenwaagen ab.',
    instruction:
      'Justiere die Zunftwaage mit den Eichgewichten auf das exakte Pfund Silber (240 Denare)!',
    successMessage:
      'Zunftgewicht exakt austariert! Festgelegte Maße und Marktordnungen schufen das Vertrauen für den europäischen Fernhandel.',
    config: {
      targetWeight: 240,
      unit: 'Silber-Denare (1 Pfund)',
      availableWeights: [120, 60, 40, 20],
    },
  },
  {
    id: 'station_kathedral_gewoelbe',
    chapterId: 5,
    title: 'Die Bauhütte: Das Gotische Kreuzrippengewölbe',
    subtitle: 'Meisterleistung mittelalterlicher Steinmetzkunst',
    type: 'symbol_decoder',
    x: 24 * 16,
    y: 18 * 16,
    lexiconUnlockId: 'hohenburg',
    description:
      'Die Baumeister des Hochmittelalters überwanden die düstere Romanik: Durch Spitzbogen, Kreuzrippen und Strebepfeiler wurden die Steinwände entlastet und konnten mit riesigen bunten Glasfenstern durchbrochen werden.',
    instruction:
      'Ordne den Bauelementen der Dombauhütte ihre statische Funktion zu!',
    successMessage:
      'Gewölbe geschlossen! Der Schlussstein verkeilt die Rippenbögen stabil im Scheitelpunkt des Gewölbes.',
    config: {
      symbols: [
        { symbol: 'Spitzbogen', meaning: 'Leitet den Gewölbedruck steiler nach unten ab als der Rundbogen' },
        { symbol: 'Kreuzrippe', meaning: 'Trägt als steinernes Skelett die dünneren Gewölbekappen' },
        { symbol: 'Strebepfeiler', meaning: 'Fängt den Seitenschub außen vor den Mauern sicher ab' },
        { symbol: 'Schlussstein', meaning: 'Zentraler Keilstein im Kreuzungspunkt fixiert das gesamte Bauwerk' },
      ],
    },
  },
];

export const STATIONS = MEDIEVAL_STATIONS;
