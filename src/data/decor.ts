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
  // Waffenkammer-Zubehör
  { id: 'burg_rack_shields', x: 14 * 16, y: 22 * 16, spriteKey: 'rack_shields', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'burg_rack_swords', x: 14 * 16, y: 26 * 16, spriteKey: 'rack_swords', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
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
  // Kräutergarten-Einfassung
  { id: 'kloster_garden_plot', x: 70 * 16, y: 24 * 16, spriteKey: 'flowerbed_gold', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'kloster_bench', x: 82 * 16, y: 25 * 16, spriteKey: 'bench', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },

  // =========================================================================
  // DISTRIKT 3: DAS BAUERNDORF & DER FRONHOF (Südwest)
  // =========================================================================
  // Fronhof des Meiers (Salland-Zentrale)
  { id: 'fronhof_meierhaus', x: 18 * 16, y: 52 * 16, spriteKey: 'cottage_stone', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Dorfschmiede mit Amboss
  { id: 'dorf_schmiede', x: 32 * 16, y: 52 * 16, spriteKey: 'smithy', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  { id: 'dorf_amboss', x: 36 * 16, y: 54 * 16, spriteKey: 'anvil', scale: 1.0, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Dorfamboss (Werkstatt öffnen)', kind: 'resource' },
  // Dorfgasthof / Taverne
  { id: 'dorf_gasthof', x: 22 * 16, y: 68 * 16, spriteKey: 'inn', scale: 0.8, originX: 0.5, originY: 0.9, kind: 'building' },
  // Reetdachkate der Bauern
  { id: 'dorf_kate_1', x: 32 * 16, y: 68 * 16, spriteKey: 'cottage_thatch', scale: 0.85, originX: 0.5, originY: 0.9, kind: 'building' },
  // Wassermühle am Mühlenbach
  { id: 'dorf_wassermuehle', x: 44 * 16, y: 64 * 16, spriteKey: 'watermill', scale: 0.95, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Wassermühle (Getreide mahlen)', kind: 'building' },
  // Dorfbrunnen
  { id: 'dorf_brunnen', x: 26 * 16, y: 58 * 16, spriteKey: 'well', scale: 1.0, originX: 0.5, originY: 0.9, interactive: true, label: '[E] Dorfbrunnen (Trinkwasser)', kind: 'resource' },
  // Fuhrwerk & Heuhaufen
  { id: 'dorf_heu_cart', x: 18 * 16, y: 60 * 16, spriteKey: 'cart_hay', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  { id: 'dorf_hay_pile', x: 28 * 16, y: 64 * 16, spriteKey: 'hay_pile', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },

  // =========================================================================
  // DISTRIKT 4: DREIFELDERWIRTSCHAFT & WEIDEN (Südost)
  // =========================================================================
  // Zehntscheune
  { id: 'acker_zehntscheune', x: 66 * 16, y: 50 * 16, spriteKey: 'barn', scale: 0.9, originX: 0.5, originY: 0.9, kind: 'building' },
  // Warenkarren vor der Scheune
  { id: 'acker_warenkarren', x: 62 * 16, y: 54 * 16, spriteKey: 'cart_goods', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
  // Heuschober & Kisten
  { id: 'acker_heuhaufen', x: 74 * 16, y: 52 * 16, spriteKey: 'hay_bale', scale: 1.0, originX: 0.5, originY: 0.9, kind: 'prop' },
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
  // Holzernte am Waldsaum (Norden)
  { id: 'node_wood_1', name: 'Bauholz-Eiche', x: 58 * 16, y: 16 * 16, item: 'holz_balken', amount: 3, respawnTime: 20000, spriteKey: 'tree_oak_1', scale: 1.0 },
  { id: 'node_wood_2', name: 'Alte Weide', x: 52 * 16, y: 24 * 16, item: 'holz_balken', amount: 2, respawnTime: 20000, spriteKey: 'tree_willow', scale: 1.0 },
  // Ackerernte (Roggen & Hafer)
  { id: 'node_crop_winter', name: 'Winterfrucht (Roggen)', x: 72 * 16, y: 62 * 16, item: 'roggen_saat', amount: 3, respawnTime: 15000, spriteKey: 'crop_wheat_4', scale: 1.0 },
  { id: 'node_crop_sommer', name: 'Sommerfrucht (Hafer)', x: 82 * 16, y: 62 * 16, item: 'hafer_saat', amount: 3, respawnTime: 15000, spriteKey: 'crop_wheat_4', scale: 1.0 },
  // Apfelbaum am Dorfrand
  { id: 'node_fruit_tree', name: 'Streuobst-Apfelbaum', x: 42 * 16, y: 44 * 16, item: 'brot_fladen', amount: 2, respawnTime: 25000, spriteKey: 'tree_apple', scale: 1.0 },
  // Schafwolle auf der Allmendeweide
  { id: 'node_sheep_wool', name: 'Schafschur an der Weide', x: 80 * 16, y: 72 * 16, item: 'wollballen', amount: 2, respawnTime: 20000, spriteKey: 'hay_bale', scale: 0.9 },
];
