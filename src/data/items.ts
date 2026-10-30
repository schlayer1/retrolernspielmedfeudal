export type MedievalItemId =
  | 'roggen_saat'
  | 'hafer_saat'
  | 'brot_fladen'
  | 'heuballen'
  | 'holz_balken'
  | 'feldstein'
  | 'eisenerz'
  | 'eisen_barren'
  | 'silber_pfennig'
  | 'pergament_bogen'
  | 'heilsalbe_kraeuter'
  | 'wollballen'
  | 'ritter_hufeisen'
  | 'wappenschild_rohling'
  | 'lehnssiegel_wachs'
  | 'pflugmesser_eisen'
  | 'mehl_sack'
  | 'wasser_eimer';

export interface MedievalItem {
  id: MedievalItemId;
  name: string;
  category: 'rohstoff' | 'handwerk' | 'wissen' | 'nahrung' | 'handel';
  icon: string;
  description: string;
  epochenwert: number;
}

export const MEDIEVAL_ITEMS: Record<MedievalItemId, MedievalItem> = {
  roggen_saat: {
    id: 'roggen_saat',
    name: 'Roggen (Winterfrucht)',
    category: 'rohstoff',
    icon: '/assets/icons/ackerbau_spelt.png',
    description: 'Widerstandsfähiges Wintergetreide, das im Herbst gesät wird und den Winter übersteht.',
    epochenwert: 2,
  },
  hafer_saat: {
    id: 'hafer_saat',
    name: 'Hafer (Sommerfrucht)',
    category: 'rohstoff',
    icon: '/assets/icons/samen.png',
    description: 'Sommergetreide als Kraftfutter für Zugpferde und Kriegsrösser.',
    epochenwert: 2,
  },
  brot_fladen: {
    id: 'brot_fladen',
    name: 'Dorfbrot aus dem Steinofen',
    category: 'nahrung',
    icon: '/assets/icons/panis_brot.png',
    description: 'Nahrhaftes Roggenbrot, das Grundnahrungsmittel für Bauern und Burgbesatzung.',
    epochenwert: 4,
  },
  heuballen: {
    id: 'heuballen',
    name: 'Getrocknetes Wiesenheu',
    category: 'rohstoff',
    icon: '/assets/icons/allmende.png',
    description: 'Sommermahd der Allmendewiesen zur Fütterung des Hofviehs im kalten Winter.',
    epochenwert: 2,
  },
  holz_balken: {
    id: 'holz_balken',
    name: 'Eichen-Bauholz',
    category: 'rohstoff',
    icon: '/assets/icons/holz.png',
    description: 'Behauenes Eichenholz aus dem grundherrlichen Wald für Fachwerk und Wehranlagen.',
    epochenwert: 3,
  },
  feldstein: {
    id: 'feldstein',
    name: 'Behauener Bruchstein',
    category: 'rohstoff',
    icon: '/assets/icons/tuffstein.png',
    description: 'Am Steinbruch und an den Burgfelsen gebrochener Kalk- und Feldstein für Grundmauern, Brunnen und Backöfen.',
    epochenwert: 3,
  },
  eisenerz: {
    id: 'eisenerz',
    name: 'Rohes Eisenerz',
    category: 'rohstoff',
    icon: '/assets/icons/raseneisenerz.png',
    description: 'Aus der Eisenmine am Burgberg und an Raseneisen-Gruben gebrochenes Roherz. Wird in der Dorfschmiede zu Geschmiedetem Eisen verhüttet.',
    epochenwert: 3,
  },
  eisen_barren: {
    id: 'eisen_barren',
    name: 'Geschmiedetes Eisen',
    category: 'handwerk',
    icon: '/assets/icons/eisenerz.png',
    description: 'In der Dorfschmiede (oder im Handwerksmenü C) aus Rohem Eisenerz und Bauholz ausgeschmiedeter Eisenbarren.',
    epochenwert: 4,
  },
  silber_pfennig: {
    id: 'silber_pfennig',
    name: 'Silberner Pfennig (Denar)',
    category: 'handel',
    icon: '/assets/icons/relic_silberdenar.png',
    description: 'Geprägte Silbermünze für Fernhandel, Zölle und die Ablösung grundherrlicher Abgaben.',
    epochenwert: 5,
  },
  pergament_bogen: {
    id: 'pergament_bogen',
    name: 'Glattes Kalbspergament',
    category: 'wissen',
    icon: '/assets/icons/pergament_codex.png',
    description: 'Sorgfältig geschabte Tierhaut für Lehnsurkunden und klösterliche Codices.',
    epochenwert: 5,
  },
  heilsalbe_kraeuter: {
    id: 'heilsalbe_kraeuter',
    name: 'Klostersalbe (Thymian & Ringelblume)',
    category: 'handwerk',
    icon: '/assets/icons/seherin_voelva.png',
    description: 'Wundheilende Salbe aus dem klösterlichen Arzneigarten nach der Regel des hl. Benedikt.',
    epochenwert: 5,
  },
  wollballen: {
    id: 'wollballen',
    name: 'Gekämmte Schafwolle',
    category: 'rohstoff',
    icon: '/assets/icons/wolle.png',
    description: 'Dichte Schurwolle der Hofschafe, gesponnen für Lodenmäntel und Decken.',
    epochenwert: 3,
  },
  ritter_hufeisen: {
    id: 'ritter_hufeisen',
    name: 'Eisernes Pferdehufeisen',
    category: 'handwerk',
    icon: '/assets/icons/schmiede_hammer.png',
    description: 'Schützt die Hufe schwerer Streit- und Zugpferde auf steinigen Burgpfaden.',
    epochenwert: 4,
  },
  wappenschild_rohling: {
    id: 'wappenschild_rohling',
    name: 'Ritterlicher Dreiecksschild',
    category: 'handwerk',
    icon: '/assets/icons/relic_ritterschild.png',
    description: 'Aus Lindenholz geleimter und mit Rohhaut bespannter Schutzschild für Ritter und Knappen.',
    epochenwert: 6,
  },
  lehnssiegel_wachs: {
    id: 'lehnssiegel_wachs',
    name: 'Rotes Siegelsiegel mit Wachs',
    category: 'wissen',
    icon: '/assets/icons/relic_lehnsurkunde.png',
    description: 'Reines Bienenwachs mit Zinnoberrot zur Beglaubigung kaiserlicher und gräflicher Privilegien.',
    epochenwert: 5,
  },
  pflugmesser_eisen: {
    id: 'pflugmesser_eisen',
    name: 'Eisernes Pflugmesser (Sech)',
    category: 'handwerk',
    icon: '/assets/icons/relic_pflugmesser.png',
    description: 'Schneidet die dichte Grassode vor der Pflugschar senkrecht auf.',
    epochenwert: 6,
  },
  mehl_sack: {
    id: 'mehl_sack',
    name: 'Feines Roggenmehl',
    category: 'rohstoff',
    icon: '/assets/icons/puls_brei.png',
    description: 'In der Wassermühle frisch gemahlenes Mehl aus dem abgelieferten Zehntgetreide.',
    epochenwert: 3,
  },
  wasser_eimer: {
    id: 'wasser_eimer',
    name: 'Klares Brunnenwasser',
    category: 'rohstoff',
    icon: '/assets/icons/wasser.png',
    description: 'Aus der 30 Meter tiefen Burgzisterne geschöpftes Trinkwasser.',
    epochenwert: 1,
  },
};

export interface MedievalRecipe {
  id: string;
  name: string;
  result: MedievalItemId;
  resultAmount: number;
  cost: Partial<Record<MedievalItemId, number>>;
  description: string;
  minChapter: number;
}

export const MEDIEVAL_RECIPES: MedievalRecipe[] = [
  {
    id: 'mehl_mahlen',
    name: 'Roggen zu Mehl mahlen',
    result: 'mehl_sack',
    resultAmount: 2,
    cost: { roggen_saat: 1 },
    description: 'Mahle geernteten Roggen (an der Wassermühle oder mit dem Handmahlstein) zu feinem Roggenmehl.',
    minChapter: 1,
  },
  {
    id: 'brot_backen',
    name: 'Dorfbrot im Ofen backen',
    result: 'brot_fladen',
    resultAmount: 2,
    cost: { mehl_sack: 1, wasser_eimer: 1 },
    description: 'Knete Teig aus Roggenmehl und Brunnenwasser und backe knuspriges Brot für die Gesindetafel.',
    minChapter: 1,
  },
  {
    id: 'eisen_schmieden',
    name: 'Geschmiedetes Eisen herstellen (Schmiede & Rennofen)',
    result: 'eisen_barren',
    resultAmount: 2,
    cost: { eisenerz: 1, holz_balken: 1 },
    description: 'Verhütte Rohes Eisenerz aus der Eisenmine mit Eichen-Bauholz in der Dorfschmiede zu schmiedbarem Eisen!',
    minChapter: 1,
  },
  {
    id: 'pflugmesser_schmieden',
    name: 'Pflugmesser (Sech) schmieden',
    result: 'pflugmesser_eisen',
    resultAmount: 1,
    cost: { eisen_barren: 2, holz_balken: 1 },
    description: 'Schmiede in der Dorfesse ein stabiles Messer aus Geschmiedetem Eisen für den schweren Wendepflug.',
    minChapter: 1,
  },
  {
    id: 'klostersalbe_ruehren',
    name: 'Klostersalbe im Mörser anrühren',
    result: 'heilsalbe_kraeuter',
    resultAmount: 2,
    cost: { lehnssiegel_wachs: 1, wasser_eimer: 1 },
    description: 'Zerreibe Heilkräuter im Steinmörser und vermenge sie mit warmem Bienenwachs.',
    minChapter: 1,
  },
  {
    id: 'pergament_herstellen',
    name: 'Kalbspergament schaben & glätten',
    result: 'pergament_bogen',
    resultAmount: 2,
    cost: { wollballen: 1, wasser_eimer: 1 },
    description: 'Weiche Tierhaut in Kalkwasser ein, schabe sie glatt und trockne sie auf dem Spannrahmen fürs Skriptorium.',
    minChapter: 1,
  },
  {
    id: 'hufeisen_schmieden',
    name: 'Hufeisen an der Esse schlagen',
    result: 'ritter_hufeisen',
    resultAmount: 2,
    cost: { eisen_barren: 1 },
    description: 'Schmiede aus Geschmiedetem Eisen passgenaue Hufeisen für das Streitross von Ritter Wolfram.',
    minChapter: 1,
  },
  {
    id: 'wappenschild_fertigen',
    name: 'Wappenschild fassen & bemalen',
    result: 'wappenschild_rohling',
    resultAmount: 1,
    cost: { holz_balken: 2, eisen_barren: 1 },
    description: 'Verleime Lindenholzbretter und ziehe Eisenbeschläge auf für den Schildknappen.',
    minChapter: 1,
  },
];

export interface MedievalBuilding {
  id: string;
  name: string;
  title: string;
  chapter: number;
  cost: Partial<Record<MedievalItemId, number>>;
  x: number;
  y: number;
  spriteKey: string;
  scale: number;
  description: string;
}

export const MEDIEVAL_BUILDINGS: MedievalBuilding[] = [
  {
    id: 'dorfgatter',
    name: 'Viehgatter zur Koppel',
    title: 'Hof-Viehgatter',
    chapter: 1,
    cost: { holz_balken: 3 },
    x: 28 * 16,
    y: 54 * 16,
    spriteKey: 'fence_gate',
    scale: 1.0,
    description: 'Sichert die Ochsenweide vor dem Ausbrechen und hält Wölfe vom Vieh fern.',
  },
  {
    id: 'pflugunterstand',
    name: 'Unterstand für den Wendepflug',
    title: 'Pflugschuppen',
    chapter: 2,
    cost: { holz_balken: 3, pflugmesser_eisen: 1 },
    x: 42 * 16,
    y: 58 * 16,
    spriteKey: 'farm_plow_shelter',
    scale: 1.25,
    description: 'Trockener Schuppen zum Schutz der kostbaren eisernen Pflugräder und Ketten.',
  },
  {
    id: 'kraeuterbeet',
    name: 'Kloster-Arzneibeet mit Umzäunung',
    title: 'Benediktiner-Heilbeet',
    chapter: 3,
    cost: { holz_balken: 2, wasser_eimer: 2 },
    x: 74 * 16,
    y: 28 * 16,
    spriteKey: 'flowerbed_gold',
    scale: 1.15,
    description: 'Reich bepflanztes Beet mit Salbei, Thymian und Ringelblumen hinter Klostermauern.',
  },
  {
    id: 'waffenstaender',
    name: 'Rüstungs- und Waffenständer',
    title: 'Waffenständer der Knappen',
    chapter: 5,
    cost: { eisen_barren: 2, holz_balken: 2 },
    x: 24 * 16,
    y: 22 * 16,
    spriteKey: 'rack_shields',
    scale: 1.1,
    description: 'Geordnete Aufbewahrung von Übungsschwertern, Lanzen und Schilden im Schlosshof.',
  },
  {
    id: 'hurde_burgtor',
    name: 'Wehrerker (Hurde) über der Zugbrücke',
    title: 'Wehrerker am Burgtor',
    chapter: 5,
    cost: { holz_balken: 3, feldstein: 2, eisen_barren: 1 },
    x: 26 * 16,
    y: 28 * 16,
    spriteKey: 'gatehouse',
    scale: 0.7,
    description: 'Wehrhafter Vorbau aus Eichenbalken, Bruchstein und Eisenklammern zur Sicherung des Burgzugangs.',
  },
  {
    id: 'turnier_schranke',
    name: 'Turnierplatz-Schranke (Tilt)',
    title: 'Turnier-Laufbahn',
    chapter: 7,
    cost: { holz_balken: 3, ritter_hufeisen: 1 },
    x: 48 * 16,
    y: 36 * 16,
    spriteKey: 'bench',
    scale: 1.2,
    description: 'Holztrennung für die Lanzenläufe (Tjost) der Ritter auf dem Vorburggelände.',
  },
  {
    id: 'marktstand_tuch',
    name: 'Marktstand der Tuchhändler',
    title: 'Woll- und Tuchstand',
    chapter: 7,
    cost: { holz_balken: 2, wollballen: 2 },
    x: 34 * 16,
    y: 46 * 16,
    spriteKey: 'stall_blue',
    scale: 1.0,
    description: 'Bunter Tuchstand auf dem Burgvorplatz zum Tausch von Stoffen, Salz und Silber.',
  },
  {
    id: 'gerichtseiche_bank',
    name: 'Schöffenbank am Lehnsgericht',
    title: 'Gerichtsbank des Meiers',
    chapter: 8,
    cost: { feldstein: 2, holz_balken: 2 },
    x: 36 * 16,
    y: 40 * 16,
    spriteKey: 'bench_stone',
    scale: 1.15,
    description: 'Steinerne Schöffenbank unter der Dorflinde für Urteilssprüche und die Klärung von Hofrechten.',
  },
];
