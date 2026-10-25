import { MedievalItemId } from './items';

export type StationType = 'mortar' | 'armory';

export interface StationDef {
  id: string;
  type: StationType;
  title: string;
  mentorSpeaker: string;
  instructionText: string;
  historicalContext: string;
  chapter: number;
  config: any;
  rewardItem: MedievalItemId;
  rewardQty: number;
}

export const MEDIEVAL_STATIONS: StationDef[] = [
  {
    id: 'station_kraeuter',
    type: 'mortar',
    title: 'Der Arznei-Mörser im Klostergarten',
    mentorSpeaker: 'Bruder Anselm (Infirmar)',
    instructionText: 'Wähle die 3 richtigen Heilmittel für eine wundheilende Klostersalbe und zerstoße sie im Steinmörser!',
    historicalContext: 'Mittelalterliche Mönche waren die Apotheker ihrer Zeit. Nach Hildegard von Bingen und der Regel des hl. Benedikt zogen sie in Klostergärten Arzneipflanzen zur Linderung von Leiden.',
    chapter: 3,
    config: {
      requiredIngredients: ['thymian', 'ringelblume', 'bienenwachs'],
      allIngredients: [
        { id: 'thymian', name: 'Echter Thymian', role: 'Wirkt desinfizierend gegen Wundfieber', correct: true },
        { id: 'ringelblume', name: 'Goldene Ringelblume', role: 'Schließt Fleischwunden und lindert Narben', correct: true },
        { id: 'bienenwachs', name: 'Reines Bienenwachs', role: 'Bindet Kräuteröle zur geschmeidigen Salbe', correct: true },
        { id: 'bilsenkraut', name: 'Schwarzes Bilsenkraut', role: 'Giftige Nachtschattengewächs-Wurzel', correct: false },
        { id: 'fliegenpilz', name: 'Roter Fliegenpilz', role: 'Giftiger Waldpilz – gefährlich!', correct: false },
      ],
    },
    rewardItem: 'heilsalbe_kraeuter',
    rewardQty: 2,
  },
  {
    id: 'station_ruestkammer',
    type: 'armory',
    title: 'Die Rüstkammer: Kleidung des Ritters',
    mentorSpeaker: 'Ritter Wolfram von Steinfels',
    instructionText: 'Lege die 4 Schutzschichten des Ritters in der historisch richtigen Reihenfolge (von innen nach außen) an!',
    historicalContext: 'Ein Ritter konnte niemals die schwere Rüstung auf nackter Haut tragen. Das gepolsterte Gambeson dämpfte Wucht-Schläge ab, das Kettenhemd wehrte Schnitte ab und der Topfhelm schützte den Schädel.',
    chapter: 6,
    config: {
      steps: [
        {
          step: 1,
          id: 'gambeson',
          name: '1. Gambeson (Gepolstertes Leinenwams)',
          desc: 'Aus Rosshaar und Leinen dick gesteppt, um Knochenbrüche durch Hiebe zu verhindern.',
        },
        {
          step: 2,
          id: 'kettenhemd',
          name: '2. Kettenhemd & Kettenhaube (Haubert)',
          desc: 'Über 20.000 miteinander vernietete Eisenringe halten Schwertschläge zuverlässig ab.',
        },
        {
          step: 3,
          id: 'sporen',
          name: '3. Goldene Rittersporen & Lederfesseln',
          desc: 'Am Stiefel befestigte Rädchensporen als ritterliches Standesabzeichen.',
        },
        {
          step: 4,
          id: 'topfhelm_schild',
          name: '4. Topfhelm & Heroldsschild',
          desc: 'Geschlossener Kübelhelm mit Sehschlitzen und der bemalte Wappenschild.',
        },
      ],
    },
    rewardItem: 'wappenschild_rohling',
    rewardQty: 1,
  },
];
