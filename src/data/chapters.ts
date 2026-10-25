export interface ChapterQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ChapterMentor {
  id: string;
  name: string;
  role: string;
  avatar: string;
  x: number;
  y: number;
}

export interface ChapterData {
  id: number;
  number: number;
  roman: string;
  title: string;
  sub: string;
  summary: string;
  mentor: ChapterMentor;
  targetCoords: { x: number; y: number; name: string };
  objective: string;
  introDialog: string[];
  tasks: string[];
  outroDialog: string[];
  quiz: ChapterQuiz;
  eraName: string;
  rewards: { items?: Record<string, number>; epochenpunkte?: number };
}

export const MEDIEVAL_CHAPTERS: ChapterData[] = [
  // =========================================================================
  // KAPITEL 1: Der Fronhof & die Scholle – Die Grundherrschaft
  // =========================================================================
  {
    id: 1,
    number: 1,
    roman: 'I',
    title: 'Der Fronhof & die Scholle',
    sub: 'Die Grundherrschaft im Dorf',
    summary: 'Lerne den Alltag der unfreien Bauern (Hörige/Leibeigene) kennen und erfahre, wie Grundherr und Hofmeier das Leben auf dem Land bestimmten.',
    mentor: {
      id: 'meier_heinrich',
      name: 'Meier Heinrich',
      role: 'Hofverwalter (Villicus)',
      avatar: '/assets/characters/keep_peasant_m.png',
      x: 22 * 16,
      y: 56 * 16,
    },
    targetCoords: { x: 22 * 16, y: 56 * 16, name: 'Meierhof (Dorfzentrum)' },
    objective: 'Sprich mit Meier Heinrich am Fronhof und bringe Ordnung in die Abgaben.',
    introDialog: [
      'Gott zum Gruße, junger Wanderer! Du stehst hier auf dem Fronhof von Burg Steinfels.',
      'Alles Land, das deine Augen erblicken – Äcker, Wälder und Gewässer –, gehört unserem gnädigen Grundherrn, Graf Eberhard.',
      'Die Bauern dieses Dorfes sind seine Hörigen. Sie bewirtschaften ihre kleinen Hufen, doch als Gegenleistung schulden sie Frondienste auf dem herrschaftlichen Salland und den zehnten Teil ihrer Ernte!',
      'Nimm dir zuerst den treuen Hofhund Falko an deine Seite. Er bewacht die Stallungen und wird dir bei deinen Wegen ein treuer Gefährte sein!',
    ],
    tasks: [
      'Sprich mit Meier Heinrich am Meierhof.',
      'Streichle Hofhund Falko mit [E], um ihn als Begleiter zu gewinnen.',
      'Backe ein frisches Dorfbrot in der Werkstatt (Taste C).',
      'Errichte das Viehgatter am Fronhof (Taste B).',
    ],
    outroDialog: [
      'Gar trefflich gearbeitet! Das Vieh ist gesichert und der Duft von frischem Brot zieht über den Hof.',
      'Du hast begriffen, worauf das Fundament des Reiches ruht: auf den schwieligen Händen der arbeitenden Bauern!',
    ],
    quiz: {
      question: 'Welche Gegenleistung schuldete der Grundherr seinen hörigen Bauern im System der Grundherrschaft?',
      options: [
        'Er zahlte ihnen jeden Monat einen festen Lohn in Silbermünzen.',
        'Er garantierte ihnen militärischen Schutz vor Feinden und Rechtssicherheit.',
        'Er schenkte ihnen nach zehn Jahren Fronarbeit das gesamte Ackerland.',
        'Er befreite sie von allen Steuern und kirchlichen Pflichten.',
      ],
      answerIndex: 1,
      explanation: 'Die Grundherrschaft beruhte auf Gegenseitigkeit: Der Herr gewährte Schutz und Schirm (militärische Verteidigung & Gericht), während die Bauern Frondienste und Abgaben leisteten.',
    },
    eraName: 'Das Frühmittelalterliche Erbe',
    rewards: { items: { roggen_saat: 5, holz_balken: 3 }, epochenpunkte: 100 },
  },

  // =========================================================================
  // KAPITEL 2: Drei Felder für das Brot – Die Dreifelderwirtschaft
  // =========================================================================
  {
    id: 2,
    number: 2,
    roman: 'II',
    title: 'Drei Felder für das Brot',
    sub: 'Die Agrarrevolution des Hochmittelalters',
    summary: 'Erkunde die Dreifelderwirtschaft und lerne, wie der schwere Wendepflug und das Kummet die Ernährung Europas sicherten.',
    mentor: {
      id: 'bauer_walther',
      name: 'Bauer Walther',
      role: 'Dorfältester (Rusticus)',
      avatar: '/assets/characters/keep_farmer.png',
      x: 38 * 16,
      y: 56 * 16,
    },
    targetCoords: { x: 38 * 16, y: 56 * 16, name: 'Dorfschmiede / Ackerrain' },
    objective: 'Erkunde mit Bauer Walther die drei Gewanne und besorge ein eiserne Pflugmesser.',
    introDialog: [
      'Sieh hinaus auf unsere Fluren, mein Kind! Früher ließen unsere Ahnen jedes zweite Jahr das Feld brach liegen – die Ernten waren mager und der Hunger saß oft mit am Tisch.',
      'Doch nun teilen wir die Scholle in drei Gewanne: Winterfrucht, Sommerfrucht und Brache!',
      'Mit dem neuen schweren Wendepflug und dem Kummet vor den Pferden bezwingen wir selbst den zähesten Lehmboden.',
      'Hilf mir, das eiserne Pflugsech in der Furche zu bergen und in der Schmiede instand zu setzen!',
    ],
    tasks: [
      'Triff Bauer Walther am Ackerrain.',
      'Birg das eiserne Pflugmesser (Relikt) im Südfeld.',
      'Schmiede ein Pflugmesser in der Werkstatt (Taste C).',
      'Errichte den Pflugunterstand am Feldrand (Taste B).',
    ],
    outroDialog: [
      'Ein herrlicher Schnitt durch die Scholle! Nun kann der Roggen tief wurzeln.',
      'Dank der Dreifelderwirtschaft ernten wir genug, um auch die Burgbesatzung und die Mönche im Kloster zu ernähren.',
    ],
    quiz: {
      question: 'Welchen entscheidenden Vorteil bot die Dreifelderwirtschaft gegenüber der früheren Zweifelderwirtschaft?',
      options: [
        'Zwei Drittel statt nur die Hälfte des Bodens wurden jährlich beerntet, was Erträge steigerte und Hungersnöte minderte.',
        'Man brauchte überhaupt keine Zugtiere mehr, da sich der Boden von selbst umgrub.',
        'Die Bauern mussten überhaupt keine Abgaben mehr an den Grundherrn leisten.',
        'Es konnte nur noch Weizen für den königlichen Hof angebaut werden.',
      ],
      answerIndex: 0,
      explanation: 'Bei der Dreifelderwirtschaft lag nur noch ein Drittel des Landes brach (statt 50 %). Der Wechsel von Winterfrucht, Sommerfrucht und Brache schonte den Boden und steigerte die Gesamterträge enorm.',
    },
    eraName: 'Die Agrarrevolution',
    rewards: { items: { hafer_saat: 6, brot_fladen: 2 }, epochenpunkte: 120 },
  },

  // =========================================================================
  // KAPITEL 3: Beten, Heilen, Schreiben – Die Welt des Klosters
  // =========================================================================
  {
    id: 3,
    number: 3,
    roman: 'III',
    title: 'Beten, Heilen, Schreiben',
    sub: 'Die Welt des Klosters (1. Stand: oratores)',
    summary: 'Tauche ein in das Leben der Benediktinermönche nach der Regel "Ora et labora", mische Arzneien im Klostergarten und studiere illuminierte Handschriften.',
    mentor: {
      id: 'bruder_anselm',
      name: 'Bruder Anselm',
      role: 'Benediktinermönch & Infirmar',
      avatar: '/assets/characters/keep_monk.png',
      x: 84 * 16,
      y: 18 * 16,
    },
    targetCoords: { x: 84 * 16, y: 18 * 16, name: 'Klosterkirche St. Benedikt' },
    objective: 'Betrete den Klosterbezirk und hilf Bruder Anselm bei der Krankenpflege und Handschriften.',
    introDialog: [
      'Pax vobiscum! Friede sei mit dir, junger Sucher nach Weisheit.',
      'Unser Leben hinter diesen Klostermauern folgt der heiligen Regel des heiligen Benedikt: "Ora et labora" – bete und arbeite.',
      'Wir bilden den ersten Stand der Christenheit: Die Betenden (oratores). Wir beten für das Seelenheil aller Menschen, heilen die Kranken in der Infirmerie und bewahren das antike Wissen in unseren Büchern.',
      'In unserem Kräutergarten fehlen frische Salben gegen das Wundfieber. Tritt an den Mörser und hilf mir!',
    ],
    tasks: [
      'Sprich mit Bruder Anselm vor dem romanischen Kirchenportal.',
      'Löse das Arznei-Rätsel an der Kräutermörser-Station.',
      'Finde den illuminierten Klosterkodex (Relikt) im Skriptorium.',
      'Pflanze das Kloster-Heilbeet mit Umzäunung (Taste B).',
    ],
    outroDialog: [
      'Deo gratias! Die Wundsalbe duftet heilsam und der Codex erstrahlt in neuem Blattgoldglanz.',
      'Denke stets daran: Wissen ist eine Waffe, mächtiger oft als das schärfste Ritterschwert!',
    ],
    quiz: {
      question: 'Welches Lebensprinzip bestimmte den Tagesablauf der Mönche nach der Benediktinerregel?',
      options: [
        '"Carpe diem" – Genieße den Tag und feiere prunkvolle Feste.',
        '"Ora et labora" – Bete und arbeite in streng geregeltem Wechsel.',
        '"Veni, vidi, vici" – Ziehe als Kriegermönch in ferne Länder.',
        '"Brot und Spiele" – Unterhalte das einfache Volk auf Marktplätzen.',
      ],
      answerIndex: 1,
      explanation: '"Ora et labora" strukturierte den Tag der Benediktinermönche präzise in Chorgebete, Bibelstudium (Lectio divina) und körperliche Arbeit (Ackerbau, Klostermedizin, Skriptorium).',
    },
    eraName: 'Das Klosterzeitalter',
    rewards: { items: { heilsalbe_kraeuter: 3, pergament_bogen: 2 }, epochenpunkte: 150 },
  },

  // =========================================================================
  // KAPITEL 4: Das Band der Treue – Das Lehnswesen & die Pyramide
  // =========================================================================
  {
    id: 4,
    number: 4,
    roman: 'IV',
    title: 'Das Band der Treue',
    sub: 'Die feudale Lehnspyramide',
    summary: 'Tritt vor Graf Eberhard von Steinfels, verstehe das Netz aus Lehnseid, Treue und Heeresfolge und fälle ein gerechtes Urteil im Lehnsgericht.',
    mentor: {
      id: 'graf_eberhard',
      name: 'Graf Eberhard',
      role: 'Kronvasall & Lehnsherr',
      avatar: '/assets/characters/keep_noble.png',
      x: 22 * 16,
      y: 30 * 16,
    },
    targetCoords: { x: 22 * 16, y: 30 * 16, name: 'Burgtor Steinfels' },
    objective: 'Steige zur Burg auf und nimm an der Lehnsgerichts-Versammlung teil.',
    introDialog: [
      'Sei gegrüßt auf Burg Steinfels! Ich bin Graf Eberhard, Kronvasall unseres erhabenen Königs.',
      'Der König lieh mir dieses Land, die Burg und die hohe Gerichtsbarkeit als Lehen. Im Gegenzug leistete ich ihm den Handgang und schwor den heiligen Lehnseid.',
      'Ich wiederum habe Teile meines Lehens an ritterliche Untervasallen weitergegeben. Doch heute tagt das Lehnsgericht!',
      'Ritter Kunibert droht mit Fehde und verweigert den Heerbann. Wir müssen klug und nach Recht richten!',
    ],
    tasks: [
      'Triff Graf Eberhard am Burgtor.',
      'Inspektiere die kaiserliche Lehnsurkunde mit Wachssiegel (Relikt).',
      'Schlichte den Streit im Historischen Dilemma 1 (Lehnsgericht).',
      'Finde den Kölner Silberpfennig (Relikt) auf dem Marktplatz.',
    ],
    outroDialog: [
      'Ein wahrhaft weiser Schiedsspruch! Der Rechtsfriede unter meinen Vasallen ist gewahrt.',
      'Das Band der Treue hält unser Reich zusammen – ohne Ehre und Eid würde das Reich in Anarchie versinken.',
    ],
    quiz: {
      question: 'Was bedeutete der deutsche Rechtsgrundsatz "Der Mann meines Mannes ist nicht mein Mann"?',
      options: [
        'Dass Frauen im Mittelalter keine Eide leisten durften.',
        'Dass der König den Untervasallen keine direkten Befehle erteilen konnte, sondern nur über den Kronvasallen.',
        'Dass ein Ritter immer nur einem einzigen Dienstherrn gehorchen musste.',
        'Dass Leibeigene Bauern jeden beliebigen Grundherrn frei wählen durften.',
      ],
      answerIndex: 1,
      explanation: 'Im deutschen Feudalsystem schuldete der Untervasall nur seinem direkten Lehnsherrn Treue. Der König konnte die Untervasallen nicht direkt aufbieten, was die Macht der Landesfürsten stärkte.',
    },
    eraName: 'Das Feudalsystem',
    rewards: { items: { silber_pfennig: 5, lehnssiegel_wachs: 2 }, epochenpunkte: 180 },
  },

  // =========================================================================
  // KAPITEL 5: Trutzige Mauern – Anatomie einer Höhenburg
  // =========================================================================
  {
    id: 5,
    number: 5,
    roman: 'V',
    title: 'Trutzige Mauern',
    sub: 'Die Architektur der Höhenburg',
    summary: 'Erkunde die Wehranlagen von Burg Steinfels, verstehe die Funktion von Bergfried, Zisterne und Palas und baue eine wehrhafte Hurde.',
    mentor: {
      id: 'baumeister_kunz',
      name: 'Baumeister Kunz',
      role: 'Werkmeister & Steinmetz',
      avatar: '/assets/characters/keep_blacksmith.png',
      x: 26 * 16,
      y: 22 * 16,
    },
    targetCoords: { x: 26 * 16, y: 22 * 16, name: 'Burghof vor dem Palas' },
    objective: 'Untersuche mit Baumeister Kunz die Wehranlagen und sichere das Burgtor.',
    introDialog: [
      'Willkommen im Herzen unserer Festung! Ich habe jeden Quaderstein dieses Palas mit Meißel und Richtscheit behauen.',
      'Eine Höhenburg wie Steinfels ist ein Meisterwerk der Verteidigungskunst: Die Klippen schützen die Flanken, der Burggraben hindert Belagerungstürme und das Torhaus besitzt ein stählernes Fallgatter.',
      'Der Bergfried dort drüben ist unsere letzte Zuflucht – seine Mauern sind vier Meter dick!',
      'Doch das Wichtigste bei einer monatelangen Belagerung ist nicht die Mauer, sondern das Wasser. Lass uns die Zisterne prüfen und das Tor mit einer Hurde bewehren!',
    ],
    tasks: [
      'Sprich mit Baumeister Kunz im Burghof.',
      'Schöpfe frisches Wasser an der Burgzisterne.',
      'Baue den hölzernen Wehrerker (Hurde) über dem Burgtor (Taste B).',
      'Platziere den Waffenständer im Burghof (Taste B).',
    ],
    outroDialog: [
      'Prachtvoll! Die Hurde sitzt fest auf den Kragsteinen. Von oben können wir Angreifer nun im toten Winkel abwehren.',
      'Burg Steinfels wird jedem Sturm trotzen – solange der Brunnen Wasser spendet!',
    ],
    quiz: {
      question: 'Warum war der Burgbrunnen (bzw. die Zisterne) für eine Höhenburg überlebenswichtig?',
      options: [
        'Weil man darin die Schätze der Grafen vor Räubern versenkte.',
        'Weil eine belagerte Burg ohne Wasser binnen weniger Tage kapitulieren musste, egal wie dick die Mauern waren.',
        'Weil das Wasser benötigt wurde, um im Winter das Burgtor mit Eis zu versiegeln.',
        'Weil die Pferde der Ritter täglich im Burggraben schwimmen mussten.',
      ],
      answerIndex: 1,
      explanation: 'Höhenburgen lagen weit über dem Grundwasserspiegel. Das Schlagen eines Brunnens durch massiven Fels dauerte oft Jahrzehnte. Versiegte das Wasser bei einer Belagerung, war die Burg verloren.',
    },
    eraName: 'Das Burgenzeitalter',
    rewards: { items: { holz_balken: 4, eisen_barren: 3 }, epochenpunkte: 200 },
  },

  // =========================================================================
  // KAPITEL 6: Vom Pagen zum Ritter – Erziehung & der Ritterschlag
  // =========================================================================
  {
    id: 6,
    number: 6,
    roman: 'VI',
    title: 'Vom Pagen zum Ritter',
    sub: 'Die Standeserziehung (2. Stand: bellatores)',
    summary: 'Erfahre, wie aus adeligen Knaben über 14 Jahre harter Ausbildung Ritter wurden, lege Rüstungsteile an und verinnerliche die ritterlichen Tugenden.',
    mentor: {
      id: 'ritter_wolfram',
      name: 'Ritter Wolfram',
      role: 'Turnierritter & Lehnsmann',
      avatar: '/assets/characters/keep_knight.png',
      x: 18 * 16,
      y: 22 * 16,
    },
    targetCoords: { x: 18 * 16, y: 22 * 16, name: 'Rüstkammer der Burg' },
    objective: 'Mache dich mit den Tugenden und der schweren Rüstung des Ritters vertraut.',
    introDialog: [
      'Gott zum Gruße, Knappe! Man wird nicht als Ritter geboren – man muss sich diesen Stand in 14 Jahren harter Zucht erdienen.',
      'Mit sieben Jahren begann ich als Page: Höfische Sitte, Reiten, Gesang und Gehorsam gegenüber den Damen.',
      'Mit vierzehn wurde ich Schildknappe: Waffenpflege, Lanzenstoßen, Rösser striegeln und meinem Ritter im Schlachtgetümmel beistehen.',
      'Nun bist du an der Reihe: Tritt an die Rüstkammer und lege die Schutzkleidung in der rechten Reihenfolge an!',
    ],
    tasks: [
      'Sprich mit Ritter Wolfram in der Rüstkammer.',
      'Meistere die Rüstkammer-Station (Minispiel).',
      'Birg den Herolds-Wappenschild (Relikt) aus dem Waffenlager.',
      'Schmiede ein Hufeisen für Wolframs Streitross (Taste C).',
    ],
    outroDialog: [
      'Der Gambeson sitzt stramm, das Kettenhemd dämpft jeden Hieb und der Schild glänzt im Sonnenlicht.',
      'Vergiss nie: Das Schwert verleiht dir Stärke, doch erst die Tugenden – Mäßigung, Treue und Schutz der Schwachen – machen dich zu einem wahren Ritter!',
    ],
    quiz: {
      question: 'Welche Tugend (mâze) galt im Hochmittelalter als das wichtigste ritterliche Ideal?',
      options: [
        'Skrupellose Grausamkeit gegenüber allen Feinden.',
        'Mäßigung und Selbstbeherrschung in allen Lebenslagen.',
        'Möglichst viel Gold von den Bauern zu erpressen.',
        'Niemals ein Wort mit Menschen aus dem dritten Stand zu sprechen.',
      ],
      answerIndex: 1,
      explanation: 'Die Tugend der "mâze" (Mäßigung) verlangte vom Ritter Zurückhaltung, Beherrschung von Zorn und Übermut sowie ein harmonisches, zivilisiertes Verhalten am Hof.',
    },
    eraName: 'Das Rittertum',
    rewards: { items: { wappenschild_rohling: 1, ritter_hufeisen: 2 }, epochenpunkte: 220 },
  },

  // =========================================================================
  // KAPITEL 7: Festsaal & Minnesang – Hofkultur, Markt & Turniere
  // =========================================================================
  {
    id: 7,
    number: 7,
    roman: 'VII',
    title: 'Festsaal & Minnesang',
    sub: 'Hofkultur und ritterliche Turniere',
    summary: 'Erlebe das festliche Leben im beheizten Palas, lerne den Minnesang kennen und richte den ritterlichen Turnierplatz vor den Toren der Burg her.',
    mentor: {
      id: 'dame_mechthild',
      name: 'Dame Mechthild',
      role: 'Herrin des Palas',
      avatar: '/assets/characters/keep_queen.png',
      x: 22 * 16,
      y: 20 * 16,
    },
    targetCoords: { x: 22 * 16, y: 20 * 16, name: 'Palas-Saal Steinfels' },
    objective: 'Empfange Dame Mechthilds Aufträge zur Vorbereitung des herbstlichen Festes und Turniers.',
    introDialog: [
      'Sei herzlich willkommen in unserem Palas! Heute schweigen die Schwerter.',
      'Sänger und Minnesänger aus fernen Landen sind eingetroffen, um Verse über die Liebe und ritterliche Heldenmut vorzutragen.',
      'Draußen vor dem Burgtor schlagen Kaufleute ihre Zelte auf, um flandrische Tuche, Seide und orientalischen Pfeffer feilzubieten.',
      'Auf dem Turnierplatz soll morgen das Lanzenstechen (die Tjost) stattfinden. Hilf uns, die Schranken aufzubauen und den Tuchstand zu errichten!',
    ],
    tasks: [
      'Empfange Dame Mechthilds Festauftrag im Palas.',
      'Baue die Turnierschranke auf der Vorburg auf (Taste B).',
      'Errichte den Tuch-Marktstand vor dem Burgtor (Taste B).',
      'Tausche Wolle gegen Silberpfennige bei den Kaufleuten ein.',
    ],
    outroDialog: [
      'Welch ein Farbenmeer! Die Banner wehen stolz und die Minnelieder klingen bis ins Tal hinab.',
      'Turniere und Feste waren das Friedensventil des Adels – hier maßen sich Krieger im edlen Wettstreit, ohne Zerstörung über das Land zu bringen.',
    ],
    quiz: {
      question: 'Welche Funktion erfüllten ritterliche Turniere im Hochmittelalter neben der Unterhaltung?',
      options: [
        'Sie dienten als Übung für den Ernstfall und boten Rittern Gelegenheit zu Ruhm, Ansehen und Lösegeld.',
        'Sie waren geheime Gerichtsverhandlungen zur Hinrichtung von Gefangenen.',
        'Sie wurden nur veranstaltet, um neues Ackerland unter den Bauern zu verlosen.',
        'Sie ersetzten den Gottesdienst in den Klöstern.',
      ],
      answerIndex: 0,
      explanation: 'Turniere waren Wehrübungen, bei denen Ritter ihre Reit- und Waffenfähigkeiten demonstrierten. Sieger konnten Pferde und Rüstungen unterlegener Gegner als Beute beanspruchen oder Lösegeld fordern.',
    },
    eraName: 'Die Hofkultur',
    rewards: { items: { wollballen: 3, silber_pfennig: 6 }, epochenpunkte: 250 },
  },

  // =========================================================================
  // KAPITEL 8: Die Ständeordnung & das Erbe – Spiegel des Feudalismus
  // =========================================================================
  {
    id: 8,
    number: 8,
    roman: 'VIII',
    title: 'Die Ständeordnung & das Erbe',
    sub: 'Die mittelalterliche Dreiständelehre & der Wandel',
    summary: 'Fasse die Dreiständelehre zusammen, entscheide über die Flucht eines Bauern in die Stadt und erhalte dein Chronisten-Diplom.',
    mentor: {
      id: 'chronist_notker',
      name: 'Chronist Notker',
      role: 'Kaiserlicher Notar & Geschichtsschreiber',
      avatar: '/assets/characters/keep_elder.png',
      x: 36 * 16,
      y: 42 * 16,
    },
    targetCoords: { x: 36 * 16, y: 42 * 16, name: 'Gerichtsplatz unter der Linde' },
    objective: 'Triff Chronist Notker unter der Dorflinde und bringe dein Geschichtswerk zum Abschluss.',
    introDialog: [
      'Gott sei gelobt! Du hast die drei Säulen des Mittelalters mit eigenen Augen gesehen:',
      'Die Geistlichen, die beten (oratores). Die Ritter und Fürsten, die kämpfen (bellatores). Und die Bauern und Handwerker, die mit harter Arbeit alle ernähren (laboratores).',
      'Doch die Zeiten wandeln sich! An den Flüssen und Kreuzungen wachsen neue Städte heran, wo Zünfte blühen und Freibürger ihr Schicksal selbst bestimmen.',
      'Ein letzter Rechtsstreit fordert dein Urteil: Ein Bauer ist in die Stadt geflohen. Schlichte den Streit und besiegle dein Chronisten-Diplom!',
    ],
    tasks: [
      'Triff Chronist Notker unter der Gerichtslinde.',
      'Schlichte das Stadtflucht-Dilemma (Dilemma 2).',
      'Errichte die steinerne Gerichtsbank des Meiers (Taste B).',
      'Öffne die Urkunde (Taste U) und drucke dein A4-Schulheftblatt (Taste P).',
    ],
    outroDialog: [
      'Es ist vollbracht! Dein Chronisten-Diplom ist besiegelt und dein Wissen im Geschichtsheft verewigt.',
      'Du verstehst nun das Mittelalter in all seiner Härte, aber auch in seiner erstaunlichen Ordnung und Schaffenskraft.',
    ],
    quiz: {
      question: 'Was besagte der geflügelte Rechtsspruch "Stadtluft macht frei nach Jahr und Tag"?',
      options: [
        'Dass Kranke in der Stadt nach einem Jahr automatisch gesund wurden.',
        'Dass ein leibeigener Bauer die Freiheit erlangte, wenn sein Herr ihn ein Jahr und einen Tag lang nicht in der Stadt zurückforderte.',
        'Dass jeder Stadtbürger nach einem Jahr zum Ritter geschlagen werden musste.',
        'Dass die Stadtluft im Mittelalter sauberer war als die Waldluft auf dem Land.',
      ],
      answerIndex: 1,
      explanation: 'Stadtrechte durchbrachen die feudale Grundherrschaft: Wer ein Jahr und einen Tag unangefochten in der Stadt lebte, galt als freier Bürger und war vor den Ansprüchen des Grundherrn sicher.',
    },
    eraName: 'Das Erbe des Mittelalters',
    rewards: { items: { silber_pfennig: 10, pergament_bogen: 5 }, epochenpunkte: 300 },
  },
];
