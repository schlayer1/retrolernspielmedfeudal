import { MedievalItemId } from './items';

export interface DilemmaOption {
  id: string;
  title: string;
  argumentText: string;
  rewards: Partial<Record<MedievalItemId, number>>;
  storyFlag: string;
  feedbackText: string;
}

export interface DilemmaDef {
  id: string;
  chapter: number;
  councilTitle: string;
  mentorSpeaker: string;
  mentorAvatar: string;
  conflictTitle: string;
  conflictText: string;
  options: DilemmaOption[];
}

export const MEDIEVAL_DILEMMAS: DilemmaDef[] = [
  {
    id: 'dilemma_ch4_fehde',
    chapter: 4,
    councilTitle: 'Lehnsgericht auf Burg Steinfels',
    mentorSpeaker: 'Graf Eberhard von Steinfels',
    mentorAvatar: '/assets/characters/keep_noble.png',
    conflictTitle: 'Fehde-Drohung: Verweigerter Heerbann wegen Weidestreit',
    conflictText: 'Ritter Kunibert von Falkenhorst verweigert dem Grafen den Heeresdienst (Heerbann) gegen Grenzräuber. Er behauptet, die Burgknechte des Grafen hätten widerrechtlich seinen Wald gerodet und 30 Schweine beschlagnahmt. Kunibert droht mit offener Fehde, falls ihm kein Recht geschieht. Wie urteilt das Lehnsgericht?',
    options: [
      {
        id: 'opt_vergleich_silber',
        title: 'Gütliche Sühne: Entschädigung in Silber & Waldgrenzstein',
        argumentText: 'Graf Eberhard entschädigt Kunibert mit 10 Silberpfennigen für das geschlagene Holz und setzt gemeinsam einen neuen Grenzstein. Im Gegenzug rückt Kunibert sofort mit 3 Knappen zur Heerfolge aus.',
        rewards: { silber_pfennig: 5, holz_balken: 3 },
        storyFlag: 'dilemma_ch4_frieden_gestiftet',
        feedbackText: 'Ein kluger Rechtsfrieden! Blutvergießen unter Vasallen wurde verhindert und die gräfliche Streitmacht zieht geeint ins Feld.',
      },
      {
        id: 'opt_harte_hand',
        title: 'Lehnsentzug wegen Treuebruchs (Felonie)',
        argumentText: 'Wer den Heerbann verweigert, bricht seinen geheiligten Lehnseid! Das Gut Falkenhorst wird eingezogen und einem treuen Knappen als Dienstlehen übertragen.',
        rewards: { eisen_barren: 3, ritter_hufeisen: 2 },
        storyFlag: 'dilemma_ch4_harte_strenge',
        feedbackText: 'Ein unerbittliches Urteil nach dem Sachsenspiegel. Deine Autorität als Lehnsherr ist gefestigt, doch im Umland schwelen Bitterkeit und Furcht.',
      },
    ],
  },
  {
    id: 'dilemma_ch8_stadtflucht',
    chapter: 8,
    councilTitle: 'Der Schiedsrat vor der Gerichtsbank',
    mentorSpeaker: 'Chronist Notker & Vogt Friedrich',
    mentorAvatar: '/assets/characters/keep_elder.png',
    conflictTitle: 'Flucht in die Reichsstadt: "Stadtluft macht frei nach Jahr und Tag"',
    conflictText: 'Hermann, ein begabter Hufschmied und Leibeigener des Hofmeiers, ist heimlich in die nahe freie Reichsstadt geflohen. Dort hat er in der Schmiedezunft Arbeit gefunden. Es fehlen nur noch drei Tage bis zum Ablauf von "Jahr und Tag" – dann wäre er für immer ein freier Bürger! Meier Heinrich verlangt seine sofortige Auslieferung an die Kette, der Stadtrat verweigert dies.',
    options: [
      {
        id: 'opt_stadtbuerger_freikauf',
        title: 'Kompromiss: Freikauf durch die Zunft gegen Loskaufgeld',
        argumentText: 'Hermann darf in der Stadt bleiben und freier Bürger werden. Im Gegenzug zahlt die städtische Zunft dem Grundherrn 15 Silberpfennige Ablösesumme und liefert jährlich 20 Hufeisen für den Fronhof.',
        rewards: { silber_pfennig: 8, ritter_hufeisen: 4 },
        storyFlag: 'dilemma_ch8_loskauf_erfolgreich',
        feedbackText: 'Ein historischer Meilenstein! Der Übergang von feudaler Schollenbindung zur städtischen Wirtschaftsfreiheit gelingt friedlich und zum Nutzen beider Seiten.',
      },
      {
        id: 'opt_altes_recht',
        title: 'Strikte Schollenbindung: Rückführung auf den Fronhof',
        argumentText: 'Das althergebrachte Recht des Grundherrn wiegt schwerer als Stadtprivilegien. Hermann muss zurückkehren und seine Frondienste an der Dorfschmiede ableisten.',
        rewards: { eisen_barren: 4, mehl_sack: 3 },
        storyFlag: 'dilemma_ch8_scholle_beharrt',
        feedbackText: 'Du verteidigst die traditionelle Grundherrschaft. Der Fronhof behält seinen besten Schmied, doch der Ruf der Städte als Orte der Freiheit lässt sich nicht mehr ersticken.',
      },
    ],
  },
];
