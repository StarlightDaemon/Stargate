/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * Archivio Dinamico & Relational Velocity Registry
 * 24+ Interconnected in-universe dossiers with rich bidirectional relational links.
 */

const ARCHIVE_DATABASE = [
  // =========================================================================
  // CATEGORY 1: VELOCITY RECORDS (RECORD DI VELOCITÀ E COLLAUDI)
  // =========================================================================
  {
    id: 'VR-1913-A',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Corsa Hyperbolica Milano-Torino (Collaudo Primario)',
    date: '14 Ottobre 1913',
    classification: 'DOCUMENTO STORICO UFFICIALE',
    statorVector: [1, 2, 4, 3, 6, 8, 5],
    metrics: {
      'Velocità di Punta': '14,200 RPM',
      'Accelerazione Radiale': '38.4 g',
      'Flusso Forza': '18.6 MJ',
      'Tempo Transito': '0.0034 sec'
    },
    summary: `Primo esperimento riuscito di traslazione cinematica guidata tra la stazione centrale di Milano e l'Officina Sperimentale di Torino. La sincronizzazione cronofotografica a 7 otturatori ha consentito di superare la soglia di inerzia terrestre senza deformazioni torsionali.`,
    relatedIds: ['SEC-01', 'APP-01', 'ENG-01', 'INC-01']
  },
  {
    id: 'VR-1914-X',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Esperimento Centauri-Vortice (Corsa a Frequenza Massima)',
    date: '02 Maggio 1914',
    classification: 'ACCESSO SPECIALE IDPT',
    statorVector: [3, 6, 8, 1, 9, 4, 10],
    metrics: {
      'Velocità di Punta': '24,890 RPM',
      'Accelerazione Radiale': '112.5 g',
      'Flusso Forza': '64.2 MJ',
      'Torsione Volano': '32.1 kNm'
    },
    summary: `Prova limite per il generatore a doppio rotore centrifugo. Raggiunta la massima velocità angolare mai registrata nei banchi dell'Istituto. La radiazione delle linee-forza ha generato un'apertura di traslazione stabile per 48 secondi prima dell'innesto del freno di emergenza.`,
    relatedIds: ['SEC-04', 'APP-03', 'ENG-02', 'INC-02']
  },
  {
    id: 'VR-1915-K',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Transito Sub-Stratosferico Alpha-01',
    date: '19 Novembre 1915',
    classification: 'COLLAUDO CERTIFICATO',
    statorVector: [5, 7, 2, 8, 3, 10, 1],
    metrics: {
      'Velocità di Punta': '19,450 RPM',
      'Accelerazione Radiale': '62.0 g',
      'Flusso Forza': '34.8 MJ',
      'Quota Calcolata': '28,000 m'
    },
    summary: `Traslazione verticale ad alta quota senza supporto aerodinamico convenzionale. Il vettore vettoriale 5-7-2 ha stabilizzato il corridoio di vuoto pneumatico attraverso gli strati densi dell'atmosfera.`,
    relatedIds: ['SEC-03', 'APP-02', 'ENG-03', 'VR-1913-A']
  },
  {
    id: 'VR-1916-M',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Vettore Tirrenico Napoli-Capri (Prova di Stabilità Marina)',
    date: '08 Luglio 1916',
    classification: 'PROTOCOLLO OPERATIVO',
    statorVector: [2, 5, 7, 1, 8, 4, 9],
    metrics: {
      'Velocità di Punta': '16,800 RPM',
      'Accelerazione Radiale': '45.1 g',
      'Flusso Forza': '24.1 MJ',
      'Umidità Statori': '88% (Isolata)'
    },
    summary: `Validazione del sistema di isolamento magnetico contro l'aria salmastra e le correnti convettive del Golfo di Napoli. Trasmissione istantanea di 400 quintali di lega d'acciaio rapido.`,
    relatedIds: ['SEC-02', 'APP-04', 'ENG-04', 'VR-1914-X']
  },
  {
    id: 'VR-1917-Z',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Corsa Stellare Balla-09 (Frequenza Cromatica Estrema)',
    date: '21 Settembre 1917',
    classification: 'SPERIMENTAZIONE AVANZATA',
    statorVector: [8, 1, 6, 10, 2, 5, 7],
    metrics: {
      'Velocità di Punta': '26,100 RPM',
      'Accelerazione Radiale': '134.8 g',
      'Flusso Forza': '78.5 MJ',
      'Frequenza Prisma': '4.8 THz'
    },
    summary: `Superamento del limite ottico standard mediante sincronizzazione dei prismi di rifrazione al quarzo. Il tunnel di propagazione ha assunto la colorazione giallo-violetto caratteristica del prisma elettrico.`,
    relatedIds: ['SEC-05', 'APP-05', 'ENG-01', 'INC-03']
  },
  {
    id: 'VR-1918-B',
    category: 'velocity',
    categoryName: 'Record di Velocità',
    title: 'Vettore Etereo Severini (Transito Asimmetrico Multiplo)',
    date: '04 Febbraio 1918',
    classification: 'REGISTRO RISERVATO',
    statorVector: [10, 4, 7, 2, 9, 3, 6],
    metrics: {
      'Velocità di Punta': '22,700 RPM',
      'Accelerazione Radiale': '98.3 g',
      'Flusso Forza': '52.0 MJ',
      'Dispersione Angolare': '0.0002 rad'
    },
    summary: `Collaudo definitivo delle geometrie asimmetriche a torsione differenziale. La geometria a 10 settori ha dimostrato stabilità assoluta contro le perturbazioni inerziali esterne.`,
    relatedIds: ['SEC-06', 'APP-02', 'ENG-03', 'ENG-02']
  },

  // =========================================================================
  // CATEGORY 2: SECTOR COORDINATES (COORDINATE DEI SETTORI DI TRASLAZIONE)
  // =========================================================================
  {
    id: 'SEC-01',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 01: Corridoio Industriale Milano-Torino',
    date: 'Omologato 1913',
    classification: 'LINEA COMMERCIALE AD ALTA VELOCITÀ',
    statorVector: [1, 2, 4, 3, 6, 8, 5],
    metrics: {
      'Distanza Geodesica': '128 km',
      'Frequenza Portante': '440 Hz',
      'Pressione Tunnel': '0.02 bar',
      'Portata Oraria': '1,200 t/h'
    },
    summary: `Il primo e più trafficato asse di transito dinamico d'Italia. Collega i complessi metallurgici lombardi ai laboratori di propulsione piemontesi in una frazione infinitesimale di secondo.`,
    relatedIds: ['VR-1913-A', 'ENG-01', 'APP-01']
  },
  {
    id: 'SEC-02',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 02: Rotta Marittima Tirreno Meridionale (Napoli-Capri)',
    date: 'Omologato 1916',
    classification: 'LINEA TRAS-MARINA',
    statorVector: [2, 5, 7, 1, 8, 4, 9],
    metrics: {
      'Distanza Geodesica': '34 km',
      'Frequenza Portante': '520 Hz',
      'Potenza Assorbita': '14.2 MW',
      'Profondità Vettore': '-15 m'
    },
    summary: `Rotta navale ad alta dinamica per il rifornimento rapido delle officine idrodinamiche costiere. Integra stabilizzatori giroscopici ad azione rapida.`,
    relatedIds: ['VR-1916-M', 'ENG-04', 'APP-04']
  },
  {
    id: 'SEC-03',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 03: Piattaforma Sub-Stratosferica Alpha',
    date: 'Omologato 1915',
    classification: 'ASCENSIONE DINAMICA',
    statorVector: [5, 7, 2, 8, 3, 10, 1],
    metrics: {
      'Quota Obiettivo': '28,000 m',
      'Frequenza Portante': '880 Hz',
      'Gradiente Termico': '-55 °C',
      'Finestra Transito': '1.2 sec'
    },
    summary: `Vettore verticale puro per l'elevazione di sonde meteorologiche veloci e capsule d'osservazione ad alta quota nell'atmosfera superiore.`,
    relatedIds: ['VR-1915-K', 'APP-02', 'ENG-03']
  },
  {
    id: 'SEC-04',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 04: Corridoio Centauri-Vortice (Profondità Cosmica)',
    date: 'Omologato 1914',
    classification: 'SPERIMENTAZIONE EXTRA-TERRESTRE',
    statorVector: [3, 6, 8, 1, 9, 4, 10],
    metrics: {
      'Coordinate Celesti': 'RA 14h 39m / Dec -60°',
      'Frequenza Portante': '1,420 MHz',
      'Flusso di Radiazione': 'Elevato',
      'Stabilità Apertura': '48 sec'
    },
    summary: `Direttrice di puntamento ad altissima precisione angolare per la ricezione e trasmissione di pacchetti cinematici su scale interplanetarie.`,
    relatedIds: ['VR-1914-X', 'APP-03', 'ENG-02', 'INC-02']
  },
  {
    id: 'SEC-05',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 05: Stella Dinamica Balla-09',
    date: 'Omologato 1917',
    classification: 'RORETTA DI SPINTA FOTONICA',
    statorVector: [8, 1, 6, 10, 2, 5, 7],
    metrics: {
      'Spettro Ottico': 'Giallo/Violetto',
      'Frequenza Portante': '4.8 THz',
      'Efficienza Spinta': '99.4%',
      'Risonanza': 'Massima'
    },
    summary: `Canale guidato a risonanza cromatica che utilizza il principio dei colori simultanei in movimento per azzerare l'attrito dell'etere.`,
    relatedIds: ['VR-1917-Z', 'APP-05', 'ENG-01']
  },
  {
    id: 'SEC-06',
    category: 'sector',
    categoryName: 'Coordinate di Settore',
    title: 'Settore 06: Vettore Etereo Severini',
    date: 'Omologato 1918',
    classification: 'CORRIDOIO ASIMMETRICO',
    statorVector: [10, 4, 7, 2, 9, 3, 6],
    metrics: {
      'Torsione Metrica': '3.2 rad/m',
      'Frequenza Portante': '1,100 Hz',
      'Inclinazione Vettore': '-18.5°',
      'Damping Cinetico': '0.005'
    },
    summary: `Corridoio con traiettoria a spirale conica studiato per assorbire le oscillazioni di taglio senza perdita di momento angolare.`,
    relatedIds: ['VR-1918-B', 'ENG-03', 'APP-02']
  },

  // =========================================================================
  // CATEGORY 3: APPARATUS SCHEMATICS (SCHEDE DEGLI APPARATI MECCANICI)
  // =========================================================================
  {
    id: 'APP-01',
    category: 'apparatus',
    categoryName: 'Apparati Meccanici',
    title: 'Apparato M-01: Volano Centrifugo in Acciaio al Nichel-Cromo',
    date: 'Revisione Tecnica 1913',
    classification: 'SPECIFICA STRUTTURALE',
    statorVector: [1, 2, 3, 4, 5, 6, 7],
    metrics: {
      'Diametro Primario': '3.80 m',
      'Massa Volano': '4,650 kg',
      'Limite di Snervamento': '1,450 MPa',
      'Bilanciamento Dinamico': 'Classe ISO G0.4'
    },
    summary: `Il cuore rotante della turbina cinematica. Forgiato in un unico blocco monolitico con 120 dentature perimetrali a profilo evolvente per la trasmissione istantanea del moto ai sincronizzatori.`,
    relatedIds: ['VR-1913-A', 'SEC-01', 'ENG-01', 'INC-01']
  },
  {
    id: 'APP-02',
    category: 'apparatus',
    categoryName: 'Apparati Meccanici',
    title: 'Apparato M-04: Tamburo Otturatore Cronofotografico a Fessura',
    date: 'Revisione Tecnica 1914',
    classification: 'SISTEMA OTTICO DI FASE',
    statorVector: [2, 4, 6, 8, 10, 1, 3],
    metrics: {
      'Numero Otturatori': '10 settori',
      'Velocità Esposizione': '1/25,000 sec',
      'Trasparenza Quarzo': '99.8%',
      'Sfasamento Focale': '0.001 mm'
    },
    summary: `Apparato ottico-meccanico derivato dagli studi di cronofotografia di Marey. Consente di catturare e fissare le posizioni successive del vettore di spinta in una singola scarica di luce simultanea.`,
    relatedIds: ['VR-1915-K', 'VR-1918-B', 'ENG-03', 'SEC-03']
  },
  {
    id: 'APP-03',
    category: 'apparatus',
    categoryName: 'Apparati Meccanici',
    title: 'Apparato M-07: Matrice di Bobine Elettromagnetiche Statoriche',
    date: 'Revisione Tecnica 1914',
    classification: 'PROPULSIONE ELETTRO-DINAMICA',
    statorVector: [3, 6, 9, 1, 4, 7, 10],
    metrics: {
      'Avvolgimenti Rame': '18,000 spire',
      'Densità di Flusso': '4.2 Tesla',
      'Raffreddamento': 'Olio Minerale Circolante',
      'Induttanza': '145 mH'
    },
    summary: `10 poli statorici posizionati a intervalli angolari di 36° sul perimetro del telaio principale. Generano il campo rotante a gradiente ultra-veloce necessario per la trazione del volano.`,
    relatedIds: ['VR-1914-X', 'SEC-04', 'ENG-02', 'INC-02']
  },
  {
    id: 'APP-04',
    category: 'apparatus',
    categoryName: 'Apparati Meccanici',
    title: 'Apparato M-11: Freno di Inerzia e Disinnesto Pneumatico',
    date: 'Revisione Tecnica 1915',
    classification: 'SISTEMA DI SICUREZZA',
    statorVector: [1, 5, 10, 2, 6, 3, 7],
    metrics: {
      'Pressione Aria': '45 atm',
      'Tempo di Arresto': '0.45 sec',
      'Coppia Frenante': '85 kNm',
      'Materiale Pattini': 'Ferodo / Bronzo sinterizzato'
    },
    summary: `Meccanismo di emergenza ad azionamento manuale o automatico. Garantisce l'azzeramento istantaneo dell'energia cinetica e lo sblocco dei vettori di ancoraggio in caso di deriva di fase.`,
    relatedIds: ['VR-1916-M', 'SEC-02', 'ENG-04', 'INC-03']
  },
  {
    id: 'APP-05',
    category: 'apparatus',
    categoryName: 'Apparati Meccanici',
    title: 'Apparato M-15: Tachimetro Ottico a Dispersione Cromatica',
    date: 'Revisione Tecnica 1917',
    classification: 'STRUMENTAZIONE DI MISURA',
    statorVector: [8, 1, 6, 10, 2, 5, 7],
    metrics: {
      'Risoluzione Lettura': '1 RPM',
      'Frequenza Campione': '10 kHz',
      'Sensore': 'Cella Foto-Elettrica al Selenio',
      'Scala Max': '40,000 RPM'
    },
    summary: `Dispositivo di telemetria istantanea che converte la rotazione delle linee di forza in un segnale luminoso graduato, visibile direttamente dalla console dell'operatore.`,
    relatedIds: ['VR-1917-Z', 'SEC-05', 'ENG-01']
  },

  // =========================================================================
  // CATEGORY 4: INCIDENT LOGS (RAPPORTI DI ANOMALIA E DISINNESTO)
  // =========================================================================
  {
    id: 'INC-01',
    category: 'incident',
    categoryName: 'Rapporti di Anomalia',
    title: 'Anomalia TR-1912: Frattura da Risonanza Armonica del Volano Primario',
    date: '11 Novembre 1912',
    classification: 'INDAGINE TECNICA INTERNA',
    statorVector: [1, 3, 5, 7, 9, 2, 4],
    metrics: {
      'Velocità Critica': '11,480 RPM',
      'Ampiezza Oscillazione': '380 um',
      'Danno': 'Cricca Superficiale Settore 4',
      'Provvedimento': 'Smorzatori a Torsione Installati'
    },
    summary: `Durante le prove a vuoto, il raggiungimento della terza frequenza naturale di vibrazione ha innescato un'oscillazione torsionale violenta. L'incidente ha condotto alla riprogettazione dei cuscinetti magnetici e all'introduzione del freno di inerzia.`,
    relatedIds: ['VR-1913-A', 'APP-01', 'ENG-01', 'ENG-02']
  },
  {
    id: 'INC-02',
    category: 'incident',
    categoryName: 'Rapporti di Anomalia',
    title: 'Anomalia TR-1914: Sovravelocità e Dispersione delle Linee-Forza',
    date: '03 Maggio 1914',
    classification: 'INTERVENTO DI EMERGENZA',
    statorVector: [3, 6, 8, 1, 9, 4, 10],
    metrics: {
      'Velocità Raggiunta': '25,400 RPM (Over-limit)',
      'Apertura Spontanea': '12.4 sec',
      'Sovratemperatura': '+48 °C',
      'Intervento Freno': 'Manuale (Leva di Emergenza)'
    },
    summary: `Un incremento imprevisto del flusso energetico nello statore 8 ha accelerato la turbina oltre la soglia massima prevista. Il rapido intervento dell'operatore sulla leva di disimpegno ha impedito il collasso strutturale dell'apertura.`,
    relatedIds: ['VR-1914-X', 'SEC-04', 'APP-03', 'ENG-02']
  },
  {
    id: 'INC-03',
    category: 'incident',
    categoryName: 'Rapporti di Anomalia',
    title: 'Anomalia TR-1916: Slittamento Angolare dei Prismi di Scatto',
    date: '28 Agosto 1916',
    classification: 'MANUTENZIONE STRAORDINARIA',
    statorVector: [8, 2, 4, 6, 10, 1, 5],
    metrics: {
      'Errore di Fase': '0.84°',
      'Decelerazione Automatica': 'Attivata',
      'Perdita Portata': '100% per 3 ore',
      'Componente Sostituito': 'Ghiera di Fermo Cinetica'
    },
    summary: `L'usura delle camme di sincronizzazione del tamburo cronofotografico ha provocato uno sfasamento nella sequenza di blocco dei settori. Nessun danno al personale; introdotto il protocollo di verifica prima di ogni innesco.`,
    relatedIds: ['VR-1917-Z', 'APP-04', 'ENG-04']
  },

  // =========================================================================
  // CATEGORY 5: ENGINEERING DOSSIERS (PROFILI DEGLI INGEGNERI CINEMATICI)
  // =========================================================================
  {
    id: 'ENG-01',
    category: 'engineer',
    categoryName: 'Ingegneri Cinematici',
    title: 'Capo Ingegnere Aurelio Balla-9',
    date: 'Servizio: 1910 - Attivo',
    classification: 'DIRETTORE GENERALE DELLE FORZE RADIALI',
    statorVector: [1, 2, 4, 3, 6, 8, 5],
    metrics: {
      'Brevetti Registrati': '42 Apparati',
      'Ore di Banco Prova': '3,400 h',
      'Specialità': 'Cromatismo Dinamico e Prismi',
      'Sede Operativa': 'Milano / Roma'
    },
    summary: `Pioniere della teoria della luce in movimento applicata alla propulsione a vortice. Ha progettato la sequenza di sblocco a 7 posizioni e supervisionato il collaudo della tratta Milano-Torino.`,
    relatedIds: ['VR-1913-A', 'VR-1917-Z', 'SEC-01', 'APP-01']
  },
  {
    id: 'ENG-02',
    category: 'engineer',
    categoryName: 'Ingegneri Cinematici',
    title: 'Specialista della Dinamica Umberto Boccioni-01',
    date: 'Servizio: 1911 - Attivo',
    classification: 'CAPO PROGETTISTA STRUTTURE E LINEE-FORZA',
    statorVector: [3, 6, 8, 1, 9, 4, 10],
    metrics: {
      'Progetti Eseguiti': 'Turbina a 10 Statori',
      'Massima Velocità Omologata': '24,890 RPM',
      'Specialità': 'Continuità dello Spazio nel Moto',
      'Sede Operativa': 'Officine Dinamiche Torino'
    },
    summary: `Ideatore del concetto di "linee-forza plastiche" che guidano l'espansione del tunnel di traslazione. Ha risolto i problemi di risonanza critica introducendo i profili asimmetrici del telaio.`,
    relatedIds: ['VR-1914-X', 'SEC-04', 'APP-03', 'INC-01']
  },
  {
    id: 'ENG-03',
    category: 'engineer',
    categoryName: 'Ingegneri Cinematici',
    title: 'Fisico Crono-Ottico Gino Severini-3',
    date: 'Servizio: 1912 - Attivo',
    classification: 'RESPONSABILE OTTURATORI E FASE',
    statorVector: [5, 7, 2, 8, 3, 10, 1],
    metrics: {
      'Articoli Tecnici': '18 Pubblicazioni',
      'Precisione Otturatori': '1/25,000 sec',
      'Specialità': 'Scomposizione Centrifuga del Movimento',
      'Sede Operativa': 'Laboratorio Sperimentale Parigi-Milano'
    },
    summary: `Ha sviluppato il tamburo otturatore cronofotografico M-04, applicando le formule di frazionamento istantaneo della luce alla stabilizzazione del fascio di traslazione.`,
    relatedIds: ['VR-1915-K', 'VR-1918-B', 'APP-02', 'SEC-03']
  },
  {
    id: 'ENG-04',
    category: 'engineer',
    categoryName: 'Ingegneri Cinematici',
    title: 'Ingegnere Meccanico Carlo Carrà-7',
    date: 'Servizio: 1912 - Attivo',
    classification: 'ISPETTORE DEGLI APPARATI DI ARRESTO',
    statorVector: [2, 5, 7, 1, 8, 4, 9],
    metrics: {
      'Collaudi di Frenata': '1,250 Test',
      'Tempo Minimo Decelerazione': '0.38 sec',
      'Specialità': 'Attrito e Dinamica delle Masse Solide',
      'Sede Operativa': 'Napoli Marittima'
    },
    summary: `Creatore del freno pneumatico di emergenza M-11 e supervisore dei collaudi sulle tratte marittime del Tirreno.`,
    relatedIds: ['VR-1916-M', 'SEC-02', 'APP-04', 'INC-03']
  }
];

window.ARCHIVE_DATABASE = ARCHIVE_DATABASE;
