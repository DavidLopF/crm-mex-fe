/**
 * Municipios de Colombia con códigos DANE
 *
 * Formato: cityCode = DD + MMM (2 dígitos dpto + 3 dígitos municipio)
 * Fuente: DANE – Divipola 2023
 */

export interface DaneCity {
  cityCode: string;       // código 5 dígitos (ej: "11001")
  cityName: string;       // nombre del municipio
  departmentCode: string; // código dpto 2 dígitos (ej: "11")
  departmentName: string; // nombre del departamento
}

export const DANE_CITIES: DaneCity[] = [
  // ── Bogotá D.C. (11) ─────────────────────────────────────────────
  { cityCode: '11001', cityName: 'Bogotá D.C.', departmentCode: '11', departmentName: 'Bogotá D.C.' },

  // ── Antioquia (05) ───────────────────────────────────────────────
  { cityCode: '05001', cityName: 'Medellín', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05045', cityName: 'Apartadó', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05088', cityName: 'Bello', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05120', cityName: 'Caldas', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05154', cityName: 'Copacabana', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05172', cityName: 'Chigorodó', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05266', cityName: 'Envigado', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05310', cityName: 'Girardota', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05318', cityName: 'Guarne', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05360', cityName: 'Itagüí', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05376', cityName: 'La Estrella', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05440', cityName: 'Marinilla', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05591', cityName: 'Rionegro', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05615', cityName: 'Sabaneta', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05642', cityName: 'Santa Rosa de Osos', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05697', cityName: 'Turbo', departmentCode: '05', departmentName: 'Antioquia' },
  { cityCode: '05790', cityName: 'Yarumal', departmentCode: '05', departmentName: 'Antioquia' },

  // ── Atlántico (08) ───────────────────────────────────────────────
  { cityCode: '08001', cityName: 'Barranquilla', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08078', cityName: 'Baranoa', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08433', cityName: 'Malambo', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08520', cityName: 'Palmar de Varela', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08573', cityName: 'Puerto Colombia', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08634', cityName: 'Sabanagrande', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08638', cityName: 'Sabanalarga', departmentCode: '08', departmentName: 'Atlántico' },
  { cityCode: '08758', cityName: 'Soledad', departmentCode: '08', departmentName: 'Atlántico' },

  // ── Bolívar (13) ─────────────────────────────────────────────────
  { cityCode: '13001', cityName: 'Cartagena', departmentCode: '13', departmentName: 'Bolívar' },
  { cityCode: '13430', cityName: 'Magangué', departmentCode: '13', departmentName: 'Bolívar' },
  { cityCode: '13244', cityName: 'El Carmen de Bolívar', departmentCode: '13', departmentName: 'Bolívar' },
  { cityCode: '13458', cityName: 'Mompós', departmentCode: '13', departmentName: 'Bolívar' },
  { cityCode: '13836', cityName: 'Turbaco', departmentCode: '13', departmentName: 'Bolívar' },
  { cityCode: '13052', cityName: 'Arjona', departmentCode: '13', departmentName: 'Bolívar' },

  // ── Boyacá (15) ──────────────────────────────────────────────────
  { cityCode: '15001', cityName: 'Tunja', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15047', cityName: 'Aquitania', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15090', cityName: 'Berbeo', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15176', cityName: 'Chiquinquirá', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15238', cityName: 'Duitama', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15272', cityName: 'Garagoa', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15380', cityName: 'Monguí', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15464', cityName: 'Nobsa', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15491', cityName: 'Paipa', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15572', cityName: 'Ramiriquí', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15693', cityName: 'Santa Rosa de Viterbo', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15759', cityName: 'Sogamoso', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15832', cityName: 'Tuta', departmentCode: '15', departmentName: 'Boyacá' },
  { cityCode: '15897', cityName: 'Záchira', departmentCode: '15', departmentName: 'Boyacá' },

  // ── Caldas (17) ──────────────────────────────────────────────────
  { cityCode: '17001', cityName: 'Manizales', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17174', cityName: 'Chinchiná', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17380', cityName: 'La Dorada', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17614', cityName: 'Riosucio', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17653', cityName: 'Salamina', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17777', cityName: 'Supía', departmentCode: '17', departmentName: 'Caldas' },
  { cityCode: '17873', cityName: 'Villamaría', departmentCode: '17', departmentName: 'Caldas' },

  // ── Cauca (19) ───────────────────────────────────────────────────
  { cityCode: '19001', cityName: 'Popayán', departmentCode: '19', departmentName: 'Cauca' },
  { cityCode: '19698', cityName: 'Santander de Quilichao', departmentCode: '19', departmentName: 'Cauca' },
  { cityCode: '19573', cityName: 'Puerto Tejada', departmentCode: '19', departmentName: 'Cauca' },
  { cityCode: '19212', cityName: 'Corinto', departmentCode: '19', departmentName: 'Cauca' },
  { cityCode: '19548', cityName: 'Piendamó', departmentCode: '19', departmentName: 'Cauca' },

  // ── Cesar (20) ───────────────────────────────────────────────────
  { cityCode: '20001', cityName: 'Valledupar', departmentCode: '20', departmentName: 'Cesar' },
  { cityCode: '20011', cityName: 'Aguachica', departmentCode: '20', departmentName: 'Cesar' },
  { cityCode: '20013', cityName: 'Agustín Codazzi', departmentCode: '20', departmentName: 'Cesar' },
  { cityCode: '20060', cityName: 'Bosconia', departmentCode: '20', departmentName: 'Cesar' },
  { cityCode: '20175', cityName: 'Chimichagua', departmentCode: '20', departmentName: 'Cesar' },

  // ── Chocó (27) ───────────────────────────────────────────────────
  { cityCode: '27001', cityName: 'Quibdó', departmentCode: '27', departmentName: 'Chocó' },
  { cityCode: '27075', cityName: 'Bahía Solano', departmentCode: '27', departmentName: 'Chocó' },
  { cityCode: '27361', cityName: 'Istmina', departmentCode: '27', departmentName: 'Chocó' },

  // ── Córdoba (23) ─────────────────────────────────────────────────
  { cityCode: '23001', cityName: 'Montería', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23162', cityName: 'Cereté', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23417', cityName: 'Lorica', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23466', cityName: 'Montelíbano', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23555', cityName: 'Planeta Rica', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23660', cityName: 'Sahagún', departmentCode: '23', departmentName: 'Córdoba' },
  { cityCode: '23807', cityName: 'Tierralta', departmentCode: '23', departmentName: 'Córdoba' },

  // ── Cundinamarca (25) ────────────────────────────────────────────
  { cityCode: '25175', cityName: 'Chía', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25214', cityName: 'Cota', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25269', cityName: 'Facatativá', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25286', cityName: 'Funza', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25290', cityName: 'Fusagasugá', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25307', cityName: 'Girardot', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25377', cityName: 'La Calera', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25386', cityName: 'La Mesa', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25430', cityName: 'Madrid', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25473', cityName: 'Mosquera', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25486', cityName: 'Nemocón', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25513', cityName: 'Pacho', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25754', cityName: 'Soacha', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25758', cityName: 'Sopó', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25772', cityName: 'Suesca', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25785', cityName: 'Tabio', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25817', cityName: 'Tocancipá', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25873', cityName: 'Villapinzón', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25875', cityName: 'Villeta', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25899', cityName: 'Zipaquirá', departmentCode: '25', departmentName: 'Cundinamarca' },
  { cityCode: '25295', cityName: 'Gachancipá', departmentCode: '25', departmentName: 'Cundinamarca' },

  // ── Huila (41) ───────────────────────────────────────────────────
  { cityCode: '41001', cityName: 'Neiva', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41132', cityName: 'Campoalegre', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41298', cityName: 'Garzón', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41306', cityName: 'Gigante', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41396', cityName: 'La Plata', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41551', cityName: 'Pitalito', departmentCode: '41', departmentName: 'Huila' },
  { cityCode: '41668', cityName: 'San Agustín', departmentCode: '41', departmentName: 'Huila' },

  // ── La Guajira (44) ──────────────────────────────────────────────
  { cityCode: '44001', cityName: 'Riohacha', departmentCode: '44', departmentName: 'La Guajira' },
  { cityCode: '44430', cityName: 'Maicao', departmentCode: '44', departmentName: 'La Guajira' },
  { cityCode: '44560', cityName: 'Manaure', departmentCode: '44', departmentName: 'La Guajira' },
  { cityCode: '44847', cityName: 'Uribia', departmentCode: '44', departmentName: 'La Guajira' },

  // ── Magdalena (47) ───────────────────────────────────────────────
  { cityCode: '47001', cityName: 'Santa Marta', departmentCode: '47', departmentName: 'Magdalena' },
  { cityCode: '47053', cityName: 'Aracataca', departmentCode: '47', departmentName: 'Magdalena' },
  { cityCode: '47189', cityName: 'Ciénaga', departmentCode: '47', departmentName: 'Magdalena' },
  { cityCode: '47245', cityName: 'El Banco', departmentCode: '47', departmentName: 'Magdalena' },
  { cityCode: '47288', cityName: 'Fundación', departmentCode: '47', departmentName: 'Magdalena' },
  { cityCode: '47555', cityName: 'Plato', departmentCode: '47', departmentName: 'Magdalena' },

  // ── Meta (50) ────────────────────────────────────────────────────
  { cityCode: '50001', cityName: 'Villavicencio', departmentCode: '50', departmentName: 'Meta' },
  { cityCode: '50006', cityName: 'Acacías', departmentCode: '50', departmentName: 'Meta' },
  { cityCode: '50313', cityName: 'Granada', departmentCode: '50', departmentName: 'Meta' },
  { cityCode: '50318', cityName: 'Guamal', departmentCode: '50', departmentName: 'Meta' },
  { cityCode: '50577', cityName: 'Puerto López', departmentCode: '50', departmentName: 'Meta' },
  { cityCode: '50689', cityName: 'San Martín', departmentCode: '50', departmentName: 'Meta' },

  // ── Nariño (52) ──────────────────────────────────────────────────
  { cityCode: '52001', cityName: 'Pasto', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52356', cityName: 'Ipiales', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52835', cityName: 'Tumaco', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52678', cityName: 'Samaniego', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52683', cityName: 'Sandoná', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52399', cityName: 'La Unión', departmentCode: '52', departmentName: 'Nariño' },
  { cityCode: '52227', cityName: 'Cumbal', departmentCode: '52', departmentName: 'Nariño' },

  // ── Norte de Santander (54) ──────────────────────────────────────
  { cityCode: '54001', cityName: 'Cúcuta', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54172', cityName: 'Chinácota', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54405', cityName: 'Los Patios', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54498', cityName: 'Ocaña', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54518', cityName: 'Pamplona', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54874', cityName: 'Villa del Rosario', departmentCode: '54', departmentName: 'Norte de Santander' },
  { cityCode: '54810', cityName: 'Tibú', departmentCode: '54', departmentName: 'Norte de Santander' },

  // ── Quindío (63) ─────────────────────────────────────────────────
  { cityCode: '63001', cityName: 'Armenia', departmentCode: '63', departmentName: 'Quindío' },
  { cityCode: '63130', cityName: 'Calarcá', departmentCode: '63', departmentName: 'Quindío' },
  { cityCode: '63190', cityName: 'Circasia', departmentCode: '63', departmentName: 'Quindío' },
  { cityCode: '63401', cityName: 'La Tebaida', departmentCode: '63', departmentName: 'Quindío' },
  { cityCode: '63470', cityName: 'Montenegro', departmentCode: '63', departmentName: 'Quindío' },
  { cityCode: '63594', cityName: 'Quimbaya', departmentCode: '63', departmentName: 'Quindío' },

  // ── Risaralda (66) ───────────────────────────────────────────────
  { cityCode: '66001', cityName: 'Pereira', departmentCode: '66', departmentName: 'Risaralda' },
  { cityCode: '66170', cityName: 'Dosquebradas', departmentCode: '66', departmentName: 'Risaralda' },
  { cityCode: '66400', cityName: 'La Virginia', departmentCode: '66', departmentName: 'Risaralda' },
  { cityCode: '66440', cityName: 'Marsella', departmentCode: '66', departmentName: 'Risaralda' },
  { cityCode: '66682', cityName: 'Santa Rosa de Cabal', departmentCode: '66', departmentName: 'Risaralda' },

  // ── San Andrés y Providencia (88) ────────────────────────────────
  { cityCode: '88001', cityName: 'San Andrés', departmentCode: '88', departmentName: 'San Andrés y Providencia' },
  { cityCode: '88564', cityName: 'Providencia', departmentCode: '88', departmentName: 'San Andrés y Providencia' },

  // ── Santander (68) ───────────────────────────────────────────────
  { cityCode: '68001', cityName: 'Bucaramanga', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68081', cityName: 'Barrancabermeja', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68276', cityName: 'Floridablanca', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68307', cityName: 'Girón', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68432', cityName: 'Málaga', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68547', cityName: 'Piedecuesta', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68679', cityName: 'San Gil', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68755', cityName: 'Socorro', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68861', cityName: 'Vélez', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68615', cityName: 'Rionegro', departmentCode: '68', departmentName: 'Santander' },
  { cityCode: '68655', cityName: 'Sabana de Torres', departmentCode: '68', departmentName: 'Santander' },

  // ── Sucre (70) ───────────────────────────────────────────────────
  { cityCode: '70001', cityName: 'Sincelejo', departmentCode: '70', departmentName: 'Sucre' },
  { cityCode: '70215', cityName: 'Corozal', departmentCode: '70', departmentName: 'Sucre' },
  { cityCode: '70670', cityName: 'Sampués', departmentCode: '70', departmentName: 'Sucre' },
  { cityCode: '70708', cityName: 'San Marcos', departmentCode: '70', departmentName: 'Sucre' },
  { cityCode: '70771', cityName: 'Santiago de Tolú', departmentCode: '70', departmentName: 'Sucre' },

  // ── Tolima (73) ──────────────────────────────────────────────────
  { cityCode: '73001', cityName: 'Ibagué', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73268', cityName: 'Espinal', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73275', cityName: 'Flandes', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73349', cityName: 'Honda', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73443', cityName: 'Mariquita', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73449', cityName: 'Melgar', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73585', cityName: 'Purificación', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73411', cityName: 'Líbano', departmentCode: '73', departmentName: 'Tolima' },
  { cityCode: '73168', cityName: 'Chaparral', departmentCode: '73', departmentName: 'Tolima' },

  // ── Valle del Cauca (76) ─────────────────────────────────────────
  { cityCode: '76001', cityName: 'Cali', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76109', cityName: 'Buenaventura', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76111', cityName: 'Buga', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76147', cityName: 'Cartago', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76364', cityName: 'Jamundí', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76520', cityName: 'Palmira', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76563', cityName: 'Pradera', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76834', cityName: 'Tuluá', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76892', cityName: 'Yumbo', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76895', cityName: 'Zarzal', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76233', cityName: 'Dagua', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76275', cityName: 'Florida', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76736', cityName: 'Sevilla', departmentCode: '76', departmentName: 'Valle del Cauca' },
  { cityCode: '76622', cityName: 'Roldanillo', departmentCode: '76', departmentName: 'Valle del Cauca' },
];

// ── Función de búsqueda ───────────────────────────────────────────────────────

/**
 * Busca municipios por nombre o código.
 * Normaliza tildes para una búsqueda más tolerante.
 */
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function searchDaneCities(query: string, limit = 12): DaneCity[] {
  if (!query.trim()) return DANE_CITIES.slice(0, limit);
  const q = normalize(query.trim());
  return DANE_CITIES.filter(
    (c) =>
      normalize(c.cityName).includes(q) ||
      c.cityCode.startsWith(q) ||
      normalize(c.departmentName).includes(q),
  ).slice(0, limit);
}

/** Busca por código exacto (para pre-llenar desde cliente guardado) */
export function getDaneCityByCode(cityCode: string): DaneCity | undefined {
  return DANE_CITIES.find((c) => c.cityCode === cityCode);
}
