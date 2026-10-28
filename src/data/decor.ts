export interface DecorObject {
  id: string;
  x: number;
  y: number;
  spriteKey: string;
  scale?: number;
  originX?: number;
  originY?: number;
  interactive?: boolean;
  label?: string;
  kind?: 'prop' | 'building' | 'resource' | 'relic' | 'mentor';
}

export const MEDIEVAL_DECOR: DecorObject[] = [
  // =========================================================================
  // DISTRIKT 1: DIE HÖHENBURG (Nordwest, Hochebene)
  // =========================================================================
  // Bergfried & Palas
  { id: 'burg_keep_main', x: 20 * 16, y: 16 * 16, spriteKey: 'keep', scale: 0.95, originX: 0.5, originY: 0.9, kind: 'building' },
  // Burgtor & Zugbrücke
  { id: 'burg_gatehouse', x: 28 * 16, y: 30 * 16, spriteKey: 'gatehouse', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Marstall & Pferdestall
  { id: 'burg_stable', x: 37 * 16, y: 18 * 16, spriteKey: 'stable', scale: 0.75, originX: 0.5, originY: 0.9, kind: 'building' },
  // Burgbrunnen (Zisterne)
  { id: 'burg_zisterne', x: 28 * 16, y: 20 * 16, spriteKey: 'well', scale: 1.0, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Burgzisterne (Wasser schöpfen)', kind: 'resource' },
  // Waffenkammer & Rittersaal-Zubehör
  { id: 'burg_rack_shields', x: 14 * 16, y: 22 * 16, spriteKey: 'rack_shields', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'burg_rack_swords', x: 14 * 16, y: 26 * 16, spriteKey: 'rack_swords', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'burg_weapon_rack_new', x: 12 * 16, y: 18 * 16, spriteKey: 'weapon_rack_new', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Waffenständer untersuchen' },
  { id: 'burg_armor_suit', x: 26 * 16, y: 16 * 16, spriteKey: 'knight_armor_suit', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Ritterharnisch begutachten' },
  { id: 'burg_chest_wood', x: 17 * 16, y: 20 * 16, spriteKey: 'castle_chest_wood', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Eichentruhe öffnen' },
  { id: 'burg_target', x: 36 * 16, y: 24 * 16, spriteKey: 'archery_target', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'burg_dummy', x: 38 * 16, y: 26 * 16, spriteKey: 'training_dummy', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'burg_bench', x: 22 * 16, y: 25 * 16, spriteKey: 'bench_stone', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },

  // =========================================================================
  // DISTRIKT 2: DAS BENEDIKTINERKLOSTER (Nordost)
  // =========================================================================
  // Romanische Klosterkirche / Basilika
  { id: 'kloster_chapel', x: 78 * 16, y: 16 * 16, spriteKey: 'chapel', scale: 0.95, originX: 0.5, originY: 0.9, kind: 'building' },
  // Skriptorium & Infirmarium (Klosterspital)
  { id: 'kloster_skriptorium', x: 88 * 16, y: 20 * 16, spriteKey: 'cottage_stone', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Kräutergarten-Einfassung & Skriptorium
  { id: 'kloster_garden_plot', x: 70 * 16, y: 24 * 16, spriteKey: 'flowerbed_gold', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'kloster_bench', x: 82 * 16, y: 25 * 16, spriteKey: 'bench', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'kloster_scriptorium_desk', x: 84 * 16, y: 22 * 16, spriteKey: 'monastery_scriptorium_desk', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Schreibpult im Skriptorium' },
  { id: 'kloster_altar_shrine', x: 74 * 16, y: 14 * 16, spriteKey: 'monastery_altar_shrine', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Kirchenaltar mit Reliquienschrein' },
  { id: 'kloster_herbal_planter', x: 72 * 16, y: 28 * 16, spriteKey: 'monastery_herbal_planter', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Heilkräuterbeet (Salbei & Thymian)' },

  // =========================================================================
  // DISTRIKT 3: DAS BAUERNDORF & DER FRONHOF (Südwest)
  // =========================================================================
  // Fronhof des Meiers (Salland-Zentrale)
  { id: 'fronhof_meierhaus', x: 18 * 16, y: 52 * 16, spriteKey: 'cottage_stone', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Dorfschmiede mit Amboss
  { id: 'dorf_schmiede', x: 32 * 16, y: 52 * 16, spriteKey: 'smithy', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  { id: 'dorf_amboss', x: 36 * 16, y: 54 * 16, spriteKey: 'anvil', scale: 1.0, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Dorfamboss (Werkstatt öffnen)', kind: 'resource' },
  // Dorfgasthof / Taverne & Schenke
  { id: 'dorf_gasthof', x: 22 * 16, y: 68 * 16, spriteKey: 'inn', scale: 0.8, originX: 0.5, originY: 0.9, kind: 'building', interactive: true, label: '[E] Dorfgasthof betreten' },
  { id: 'dorf_tavern_casks', x: 28 * 16, y: 70 * 16, spriteKey: 'tavern_beer_casks', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Dünnbierfässer an der Schenke' },
  // Reetdachkate der Bauern
  { id: 'dorf_kate_1', x: 32 * 16, y: 68 * 16, spriteKey: 'cottage_thatch', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Wassermühle am Mühlenbach
  { id: 'dorf_wassermuehle', x: 44 * 16, y: 64 * 16, spriteKey: 'watermill', scale: 0.95, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Wassermühle (Getreide mahlen)', kind: 'building' },
  // Dorfbrunnen
  { id: 'dorf_brunnen', x: 26 * 16, y: 58 * 16, spriteKey: 'well', scale: 1.0, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Dorfbrunnen (Trinkwasser)', kind: 'resource' },
  // Backofen & Fuhrwerk
  { id: 'dorf_bread_bakeoven', x: 26 * 16, y: 52 * 16, spriteKey: 'village_bread_bakeoven', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Dorfbackofen (Brot backen)' },
  { id: 'dorf_heu_cart', x: 18 * 16, y: 60 * 16, spriteKey: 'cart_hay', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Heukarren beladen' },
  { id: 'dorf_hay_pile', x: 28 * 16, y: 64 * 16, spriteKey: 'hay_pile', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },

  // =========================================================================
  // DISTRIKT 4: DREIFELDERWIRTSCHAFT & WEIDEN (Südost)
  // =========================================================================
  // Zehntscheune & Windmühle
  { id: 'acker_zehntscheune', x: 66 * 16, y: 50 * 16, spriteKey: 'barn', scale: 0.9, originX: 0.5, originY: 0.9, kind: 'building' },
  { id: 'acker_windmill_tower', x: 88 * 16, y: 48 * 16, spriteKey: 'farm_windmill_tower', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'building', interactive: true, label: '[E] Bockwindmühle auf dem Hügel' },
  // Warenkarren vor der Scheune
  { id: 'acker_warenkarren', x: 62 * 16, y: 54 * 16, spriteKey: 'cart_goods', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  // Heuschober & Kisten
  { id: 'acker_heuhaufen', x: 74 * 16, y: 52 * 16, spriteKey: 'hay_bale', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'acker_hay_rick', x: 70 * 16, y: 56 * 16, spriteKey: 'farm_hay_rick_pile', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Großer Heuschober' },
  { id: 'acker_animal_enclosure', x: 78 * 16, y: 68 * 16, spriteKey: 'farm_animal_enclosure', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop', interactive: true, label: '[E] Schafpferch & Viehgatter' },
  // Marktstände auf dem Handelsplatz (Mitte)
  { id: 'markt_stand_gruen', x: 46 * 16, y: 44 * 16, spriteKey: 'stall_green', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'markt_stand_rot', x: 54 * 16, y: 44 * 16, spriteKey: 'stall_red', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
];

export interface ResourceNode {
  id: string;
  name: string;
  x: number;
  y: number;
  item: string;
  amount: number;
  respawnTime: number;
  spriteKey: string;
  scale?: number;
}

export const RESOURCE_NODES: ResourceNode[] = [
  // 1. Holz schlagen (Bauholz)
  { id: 'node_wood_village_1', name: 'Eiche am Fronhof (Holz schlagen)', x: 12 * 16, y: 54 * 16, item: 'holz_balken', amount: 2, respawnTime: 18000, spriteKey: 'tree_oak_1', scale: 0.95 },
  { id: 'node_wood_village_chop', name: 'Hackblock am Hof (Feuer- & Bauholz)', x: 14 * 16, y: 58 * 16, item: 'holz_balken', amount: 2, respawnTime: 15000, spriteKey: 'stump_axe', scale: 1.0 },
  { id: 'node_wood_1', name: 'Bauholz-Eiche (Nordwald)', x: 60 * 16, y: 16 * 16, item: 'holz_balken', amount: 3, respawnTime: 20000, spriteKey: 'tree_oak_1', scale: 1.0 },
  { id: 'node_wood_2', name: 'Alte Waldeiche', x: 42 * 16, y: 28 * 16, item: 'holz_balken', amount: 2, respawnTime: 20000, spriteKey: 'tree_oak_2', scale: 0.95 },
  { id: 'node_wood_south', name: 'Auwald-Weide (Holz schlagen)', x: 38 * 16, y: 72 * 16, item: 'holz_balken', amount: 2, respawnTime: 18000, spriteKey: 'tree_willow', scale: 0.95 },

  // 2. Steine abbauen (Bruchstein)
  { id: 'node_stone_village', name: 'Feldstein-Fels (Steine abbauen)', x: 12 * 16, y: 64 * 16, item: 'feldstein', amount: 2, respawnTime: 18000, spriteKey: 'rock_big_a', scale: 1.0 },
  { id: 'node_stone_cliff_1', name: 'Kalksteinbruch am Burgberg', x: 14 * 16, y: 36 * 16, item: 'feldstein', amount: 3, respawnTime: 20000, spriteKey: 'rock_cluster', scale: 1.0 },
  { id: 'node_stone_river', name: 'Uferfelsen am Mühlenbach', x: 46 * 16, y: 52 * 16, item: 'feldstein', amount: 2, respawnTime: 18000, spriteKey: 'rock_moss_d', scale: 1.0 },
  { id: 'node_stone_east', name: 'Findling an der Flurgrenze', x: 62 * 16, y: 36 * 16, item: 'feldstein', amount: 2, respawnTime: 18000, spriteKey: 'rock_big_b', scale: 1.0 },

  // 3. Eisenerz schürfen (Eisen)
  { id: 'node_iron_1', name: 'Raseneisenerz-Fels (Eisen abbauen)', x: 40 * 16, y: 52 * 16, item: 'eisen_barren', amount: 2, respawnTime: 22000, spriteKey: 'rock_big_c', scale: 0.75 },
  { id: 'node_iron_2', name: 'Erzader am Burgfelsen', x: 8 * 16, y: 26 * 16, item: 'eisen_barren', amount: 2, respawnTime: 22000, spriteKey: 'rock_big_a', scale: 0.75 },

  // 4. Ackerernte, Heu, Obst & Schafwolle
  { id: 'node_crop_winter', name: 'Winterfrucht (Roggen ernten)', x: 72 * 16, y: 62 * 16, item: 'roggen_saat', amount: 3, respawnTime: 15000, spriteKey: 'crop_wheat_4', scale: 1.0 },
  { id: 'node_crop_sommer', name: 'Sommerfrucht (Hafer ernten)', x: 82 * 16, y: 62 * 16, item: 'hafer_saat', amount: 3, respawnTime: 15000, spriteKey: 'crop_wheat_4', scale: 1.0 },
  { id: 'node_hay_meadow', name: 'Allmendewiese (Heu gabeln)', x: 64 * 16, y: 66 * 16, item: 'heuballen', amount: 2, respawnTime: 16000, spriteKey: 'hay_bale', scale: 1.0 },
  { id: 'node_fruit_tree', name: 'Streuobst-Apfelbaum (Proviant)', x: 42 * 16, y: 44 * 16, item: 'brot_fladen', amount: 2, respawnTime: 25000, spriteKey: 'tree_apple', scale: 1.0 },
  { id: 'node_sheep_wool', name: 'Schafschur an der Weide', x: 80 * 16, y: 72 * 16, item: 'wollballen', amount: 2, respawnTime: 20000, spriteKey: 'hay_bale', scale: 0.9 },
  { id: 'node_kloster_wax', name: 'Kloster-Imkerei (Siegelwachs)', x: 66 * 16, y: 22 * 16, item: 'lehnssiegel_wachs', amount: 2, respawnTime: 22000, spriteKey: 'barrel_water', scale: 1.0 },
];
