export interface InstitutionFaculty {
  id: string;
  name: string;
  dean: string;
  departments: string[];
}

export interface InstitutionLecturer {
  id: string;
  name: string;
  department: string;
  staffId: string;
  username: string;
  email: string;
}

export interface InstitutionCourse {
  id: string;
  department: string;
  lecturerId: string;
  code: string;
  title: string;
  level: string;
  semester: number;
  creditUnit: number;
}

export const REGISTRAR_PROFILE = {
  id: "REG001",
  name: "Mrs Johnson",
  username: "registrar",
  email: "registrar@univ.edu",
  password: "registrar2024",
};

export const INSTITUTION_FACULTIES: InstitutionFaculty[] = [
  {
    id: "F001",
    name: "Science & Technology",
    dean: "Mr. Mauton",
    departments: [
      "Computer Science",
      "Bioscience",
      "Nursing Science",
      "Medical Laboratory Science",
      "Public Health",
      "Pharmacy",
    ],
  },
  {
    id: "F002",
    name: "Humanities, Management & Social Sciences",
    dean: "Mr. Daniel",
    departments: [
      "Accounting & Finance",
      "Business Administration",
      "Mass Communication",
      "Human Resource Management",
      "Economics",
      "International Relations & Diplomacy",
    ],
  },
];

export const INSTITUTION_LECTURERS: InstitutionLecturer[] = [
  // Science & Technology — Computer Science
  { id: "LEC001", name: "Mr. Azino", department: "Computer Science", staffId: "LEC/001", username: "azino", email: "azino@univ.edu" },
  { id: "LEC002", name: "Mr. Ola", department: "Computer Science", staffId: "LEC/002", username: "ola", email: "ola@univ.edu" },
  { id: "LEC003", name: "Mr. Odun", department: "Computer Science", staffId: "LEC/003", username: "odun", email: "odun@univ.edu" },
  { id: "LEC004", name: "Mr. Olaniyan", department: "Computer Science", staffId: "LEC/004", username: "olaniyan", email: "olaniyan@univ.edu" },
  // Science & Technology — Bioscience/Nursing
  { id: "LEC005", name: "Mr. Victor", department: "Bioscience", staffId: "LEC/005", username: "victor", email: "victor@univ.edu" },
  // Science & Technology — Medical Laboratory Science
  { id: "LEC006", name: "Mr. Simdi", department: "Medical Laboratory Science", staffId: "LEC/006", username: "simdi", email: "simdi@univ.edu" },
  { id: "LEC007", name: "Mrs. Katayama", department: "Medical Laboratory Science", staffId: "LEC/007", username: "katayama", email: "katayama@univ.edu" },
  // Science & Technology — Pharmacy
  { id: "LEC008", name: "Dr. Mojover", department: "Pharmacy", staffId: "LEC/008", username: "mojover", email: "mojover@univ.edu" },
  { id: "LEC009", name: "Mrs. Mary", department: "Pharmacy", staffId: "LEC/009", username: "mary", email: "mary@univ.edu" },
  { id: "LEC010", name: "Pharm. Yemi", department: "Pharmacy", staffId: "LEC/010", username: "yemi", email: "yemi@univ.edu" },
  { id: "LEC011", name: "Mr. Kayode", department: "Pharmacy", staffId: "LEC/011", username: "kayode", email: "kayode@univ.edu" },
  // Science & Technology — Public Health / EVM
  { id: "LEC012", name: "Mrs. Hope", department: "Public Health", staffId: "LEC/012", username: "hope", email: "hope@univ.edu" },
  { id: "LEC013", name: "Mr. Mauton", department: "Public Health", staffId: "LEC/013", username: "mauton", email: "mauton@univ.edu" },
  { id: "LEC014", name: "Mr. Chidiadi", department: "Public Health", staffId: "LEC/014", username: "chidiadi", email: "chidiadi@univ.edu" },
  { id: "LEC015", name: "Mrs. Ezeh", department: "Public Health", staffId: "LEC/015", username: "ezeh", email: "ezeh@univ.edu" },
  // Humanities, Management & Social Sciences — Int'l Relations
  { id: "LEC016", name: "Mr. Akinselure D.", department: "International Relations & Diplomacy", staffId: "LEC/016", username: "akinselure", email: "akinselure@univ.edu" },
  { id: "LEC017", name: "Mr. Tosin A.", department: "International Relations & Diplomacy", staffId: "LEC/017", username: "tosin", email: "tosin@univ.edu" },
  { id: "LEC018", name: "Mr. Yonmo E.", department: "International Relations & Diplomacy", staffId: "LEC/018", username: "yonmo", email: "yonmo@univ.edu" },
  { id: "LEC019", name: "Mr. Kenneth Okoh", department: "International Relations & Diplomacy", staffId: "LEC/019", username: "kenneth", email: "kenneth@univ.edu" },
  { id: "LEC020", name: "Mr. Ken Azuzu", department: "International Relations & Diplomacy", staffId: "LEC/020", username: "azuzu", email: "azuzu@univ.edu" },
  // Humanities, Management & Social Sciences — Mass Comm
  { id: "LEC021", name: "Rev. Emmanuel", department: "Mass Communication", staffId: "LEC/021", username: "emmanuel", email: "emmanuel@univ.edu" },
  { id: "LEC022", name: "Mr. Nwolisa B.", department: "Mass Communication", staffId: "LEC/022", username: "nwolisa", email: "nwolisa@univ.edu" },
  { id: "LEC023", name: "Mrs. Faith", department: "Mass Communication", staffId: "LEC/023", username: "faith", email: "faith@univ.edu" },
  { id: "LEC024", name: "Mrs. Olaleye Folakemi", department: "Mass Communication", staffId: "LEC/024", username: "folakemi", email: "folakemi@univ.edu" },
  { id: "LEC025", name: "Mr. Kalu", department: "Mass Communication", staffId: "LEC/025", username: "kalu", email: "kalu@univ.edu" },
  // Humanities, Management & Social Sciences — Bus Admin
  { id: "LEC026", name: "Mrs. James", department: "Business Administration", staffId: "LEC/026", username: "james", email: "james@univ.edu" },
  { id: "LEC027", name: "Mr. Hunga", department: "Business Administration", staffId: "LEC/027", username: "hunga", email: "hunga@univ.edu" },
  // Humanities, Management & Social Sciences — Economics
  { id: "LEC028", name: "Mrs. Odin E.", department: "Economics", staffId: "LEC/028", username: "odin", email: "odin@univ.edu" },
  { id: "LEC029", name: "Miss Aminat", department: "Economics", staffId: "LEC/029", username: "aminat", email: "aminat@univ.edu" },
  // Humanities, Management & Social Sciences — Accounting
  { id: "LEC030", name: "Mr. Ajayi", department: "Accounting & Finance", staffId: "LEC/030", username: "ajayi", email: "ajayi@univ.edu" },
  { id: "LEC031", name: "Mr. Wusu Anthony", department: "Accounting & Finance", staffId: "LEC/031", username: "wusu", email: "wusu@univ.edu" },
  // Humanities, Management & Social Sciences — HRM
  { id: "LEC032", name: "Mr. Kazeem", department: "Human Resource Management", staffId: "LEC/032", username: "kazeem", email: "kazeem@univ.edu" },
  { id: "LEC033", name: "Mrs. Elizabeth", department: "Human Resource Management", staffId: "LEC/033", username: "elizabeth", email: "elizabeth@univ.edu" },
  { id: "LEC034", name: "Mrs. Larry Omolola", department: "Human Resource Management", staffId: "LEC/034", username: "omolola", email: "omolola@univ.edu" },
  // General / French
  { id: "LEC035", name: "Mr. Kwentua", department: "French", staffId: "LEC/035", username: "kwentua", email: "kwentua@univ.edu" },
  { id: "LEC036", name: "Mr. Atoyebi", department: "International Relations & Diplomacy", staffId: "LEC/036", username: "atoyebi", email: "atoyebi@univ.edu" },
  { id: "LEC037", name: "Mr. David Orji", department: "Mass Communication", staffId: "LEC/037", username: "orji", email: "orji@univ.edu" },
];

export const INSTITUTION_COURSES: InstitutionCourse[] = [
  // ===== FIRST SEMESTER 2023/2024 =====

  // --- 100 Level General (Science & Tech - Faculty) ---
  { id: "C001", department: "Bioscience", lecturerId: "", code: "BIO 111", title: "General Biology", level: "100", semester: 1, creditUnit: 3 },
  { id: "C002", department: "Computer Science", lecturerId: "", code: "CMP 111", title: "Introduction to Computer", level: "100", semester: 1, creditUnit: 3 },
  { id: "C003", department: "Bioscience", lecturerId: "", code: "CHM 111", title: "Introductory Chemistry", level: "100", semester: 1, creditUnit: 3 },
  { id: "C004", department: "Bioscience", lecturerId: "", code: "PHY 113", title: "Physics for Biological Science", level: "100", semester: 1, creditUnit: 3 },
  { id: "C005", department: "Bioscience", lecturerId: "", code: "MTH 111", title: "Mathematics for Bio Science", level: "100", semester: 1, creditUnit: 2 },
  { id: "C006", department: "Bioscience", lecturerId: "", code: "STA 111", title: "Elementary Statistics", level: "100", semester: 1, creditUnit: 2 },
  { id: "C007", department: "Bioscience", lecturerId: "", code: "GST 111", title: "Use of English 1", level: "100", semester: 1, creditUnit: 2 },
  { id: "C008", department: "Bioscience", lecturerId: "", code: "GST 115", title: "Logic and Philosophy of Science", level: "100", semester: 1, creditUnit: 2 },
  { id: "C009", department: "Bioscience", lecturerId: "", code: "GST 113", title: "Library Study and Info. Comm Tech", level: "100", semester: 1, creditUnit: 2 },
  { id: "C010", department: "Bioscience", lecturerId: "", code: "GNS 111", title: "Nigerian/Benin Republic People and Culture", level: "100", semester: 1, creditUnit: 2 },
  { id: "C011", department: "Bioscience", lecturerId: "", code: "APZ 111", title: "Animal Diversity", level: "100", semester: 1, creditUnit: 3 },
  { id: "C012", department: "Bioscience", lecturerId: "", code: "PLS 111", title: "Plant Diversity", level: "100", semester: 1, creditUnit: 3 },
  { id: "C013", department: "Bioscience", lecturerId: "", code: "ENT 111", title: "Entrepreneurial Skill & Development", level: "100", semester: 1, creditUnit: 2 },
  { id: "C014", department: "Bioscience", lecturerId: "", code: "FRE 001", title: "French Appreciation", level: "100", semester: 1, creditUnit: 2 },

  // --- 200 Level NS (Nursing Science) ---
  { id: "C015", department: "Nursing Science", lecturerId: "", code: "BIO 211/212", title: "Foundation for Profession Nursing", level: "200", semester: 1, creditUnit: 3 },
  { id: "C016", department: "Nursing Science", lecturerId: "", code: "EVM 217", title: "Intro to Bio Statistics/Vital & Health Stat", level: "200", semester: 1, creditUnit: 3 },
  { id: "C017", department: "Nursing Science", lecturerId: "", code: "CLI 271", title: "Medical Microbiology & Parasitology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C018", department: "Nursing Science", lecturerId: "", code: "CLI 213", title: "Human Anatomy 1 & Gross Anatomy", level: "200", semester: 1, creditUnit: 4 },
  { id: "C019", department: "Nursing Science", lecturerId: "", code: "PSG 211", title: "General Principle of Physiology I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C020", department: "Nursing Science", lecturerId: "", code: "CLI 233", title: "Human Physiology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C021", department: "Nursing Science", lecturerId: "", code: "BCH 211", title: "General Biochemistry", level: "200", semester: 1, creditUnit: 3 },
  { id: "C022", department: "Nursing Science", lecturerId: "", code: "EVM 215", title: "Fundamentals to Public Health", level: "200", semester: 1, creditUnit: 2 },
  { id: "C023", department: "Nursing Science", lecturerId: "", code: "BIO 200", title: "Human Genetics in Health and Disease", level: "200", semester: 1, creditUnit: 3 },
  { id: "C024", department: "Nursing Science", lecturerId: "", code: "BIO 241", title: "Psychology Applied to Nursing", level: "200", semester: 1, creditUnit: 2 },
  { id: "C025", department: "Nursing Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "200", semester: 1, creditUnit: 2 },

  // --- 300 Level NS ---
  { id: "C026", department: "Nursing Science", lecturerId: "", code: "BIO 315", title: "Epidemiology/Human Disease Prevention", level: "300", semester: 1, creditUnit: 3 },
  { id: "C027", department: "Nursing Science", lecturerId: "", code: "BIO 319", title: "Environmental Health", level: "300", semester: 1, creditUnit: 3 },
  { id: "C028", department: "Nursing Science", lecturerId: "", code: "PCL 311", title: "Clinical Pharmacology and Chemotherapy", level: "300", semester: 1, creditUnit: 3 },
  { id: "C029", department: "Nursing Science", lecturerId: "", code: "BIO 303", title: "Medical Surgical Nursing", level: "300", semester: 1, creditUnit: 4 },
  { id: "C030", department: "Nursing Science", lecturerId: "", code: "SOC 301", title: "Fundamental Human Behaviour", level: "300", semester: 1, creditUnit: 2 },
  { id: "C031", department: "Nursing Science", lecturerId: "", code: "BIO 311", title: "Community Health", level: "300", semester: 1, creditUnit: 3 },
  { id: "C032", department: "Nursing Science", lecturerId: "", code: "EVM 313", title: "Introduction to General Pathology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C033", department: "Nursing Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "300", semester: 1, creditUnit: 2 },

  // --- 400 Level NS ---
  { id: "C034", department: "Nursing Science", lecturerId: "", code: "BIO 411", title: "Mental Health & Psychiatry", level: "400", semester: 1, creditUnit: 3 },
  { id: "C035", department: "Nursing Science", lecturerId: "", code: "BIO 421", title: "Maternal and Child Health", level: "400", semester: 1, creditUnit: 3 },
  { id: "C036", department: "Nursing Science", lecturerId: "", code: "BIO 435", title: "Primary Healthcare I", level: "400", semester: 1, creditUnit: 3 },
  { id: "C037", department: "Nursing Science", lecturerId: "", code: "BIO 431", title: "Advanced Med-Surg", level: "400", semester: 1, creditUnit: 4 },
  { id: "C038", department: "Nursing Science", lecturerId: "", code: "BIO 531", title: "Paediatrics Nursing II", level: "400", semester: 1, creditUnit: 3 },
  { id: "C039", department: "Nursing Science", lecturerId: "", code: "BIO 401", title: "Geriatrics and Gerontology", level: "400", semester: 1, creditUnit: 2 },
  { id: "C040", department: "Nursing Science", lecturerId: "", code: "BIO 512", title: "Advance Community & Public Health", level: "400", semester: 1, creditUnit: 3 },
  { id: "C041", department: "Nursing Science", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 1, creditUnit: 6 },

  // --- 200 Level MLS ---
  { id: "C042", department: "Medical Laboratory Science", lecturerId: "", code: "ANA 219", title: "Human Anatomy 1 & Gross Anatomy", level: "200", semester: 1, creditUnit: 4 },
  { id: "C043", department: "Medical Laboratory Science", lecturerId: "", code: "BCH 213", title: "Bioenergetics and Metabolism", level: "200", semester: 1, creditUnit: 3 },
  { id: "C044", department: "Medical Laboratory Science", lecturerId: "", code: "PSG 211", title: "General Principle of Physiology I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C045", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 211", title: "Intro to Medical Lab. Science I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C046", department: "Medical Laboratory Science", lecturerId: "", code: "MCB 211", title: "General Microbiology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C047", department: "Medical Laboratory Science", lecturerId: "", code: "EVM 215", title: "Fundamentals to Public Health", level: "200", semester: 1, creditUnit: 2 },
  { id: "C048", department: "Medical Laboratory Science", lecturerId: "", code: "BCH 211", title: "General Biochemistry", level: "200", semester: 1, creditUnit: 3 },
  { id: "C049", department: "Medical Laboratory Science", lecturerId: "", code: "CHM 217", title: "Physical and Inorganic Chemistry", level: "200", semester: 1, creditUnit: 3 },
  { id: "C050", department: "Medical Laboratory Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "200", semester: 1, creditUnit: 2 },

  // --- 300 Level MLS ---
  { id: "C051", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 311", title: "Medical Laboratory Science Ethics/Counselling Ethics", level: "300", semester: 1, creditUnit: 2 },
  { id: "C052", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 313", title: "Introduction to Medical Laboratory Science III", level: "300", semester: 1, creditUnit: 3 },
  { id: "C053", department: "Medical Laboratory Science", lecturerId: "", code: "BCH 423", title: "Nucleic Acid Biochem. and Basic Concept of Molecular Bio", level: "300", semester: 1, creditUnit: 3 },
  { id: "C054", department: "Medical Laboratory Science", lecturerId: "", code: "EVM 313", title: "Introduction to General Pathology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C055", department: "Medical Laboratory Science", lecturerId: "", code: "CPY 312", title: "Basic Immunology/Immunochemistry", level: "300", semester: 1, creditUnit: 3 },
  { id: "C056", department: "Medical Laboratory Science", lecturerId: "", code: "CPY 311", title: "Basic Clinical Chemistry/Chemical Pathology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C057", department: "Medical Laboratory Science", lecturerId: "", code: "ABM 331", title: "Pharmacology I & II", level: "300", semester: 1, creditUnit: 3 },
  { id: "C058", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 415", title: "Haematology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C059", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 417", title: "Blood Group Serology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C060", department: "Medical Laboratory Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill Development", level: "300", semester: 1, creditUnit: 2 },

  // --- 400 Level MLS ---
  { id: "C061", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 411", title: "Medical Parasitology & Entomology", level: "400", semester: 1, creditUnit: 3 },
  { id: "C062", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 419", title: "Chemical Pathology I & II", level: "400", semester: 1, creditUnit: 3 },
  { id: "C063", department: "Medical Laboratory Science", lecturerId: "", code: "BSC 515", title: "Clinical Enzymology", level: "400", semester: 1, creditUnit: 3 },
  { id: "C064", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 418", title: "Histopathology I & II", level: "400", semester: 1, creditUnit: 3 },
  { id: "C065", department: "Medical Laboratory Science", lecturerId: "", code: "BSP 515", title: "Exfoliate Cytology", level: "400", semester: 1, creditUnit: 2 },
  { id: "C066", department: "Medical Laboratory Science", lecturerId: "", code: "BSM 511", title: "Medical Microbiology II", level: "400", semester: 1, creditUnit: 3 },
  { id: "C067", department: "Medical Laboratory Science", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 1, creditUnit: 6 },
  { id: "C068", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 523", title: "Seminar", level: "400", semester: 1, creditUnit: 2 },

  // --- 200 Level EVM/Public Health ---
  { id: "C069", department: "Public Health", lecturerId: "", code: "BIO 200", title: "Human Genetics in Health and Disease", level: "200", semester: 1, creditUnit: 3 },
  { id: "C070", department: "Public Health", lecturerId: "", code: "MCB 211", title: "General Microbiology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C071", department: "Public Health", lecturerId: "", code: "EVM 215", title: "Fundamental to Public Health", level: "200", semester: 1, creditUnit: 2 },
  { id: "C072", department: "Public Health", lecturerId: "", code: "SOC 311", title: "Intro to Sociology/Social Influences on Behaviour", level: "200", semester: 1, creditUnit: 3 },
  { id: "C073", department: "Public Health", lecturerId: "", code: "EVM 317", title: "Environmental Health", level: "200", semester: 1, creditUnit: 3 },
  { id: "C074", department: "Public Health", lecturerId: "", code: "ANA 219", title: "Human Anatomy 1 & Gross Anatomy", level: "200", semester: 1, creditUnit: 4 },
  { id: "C075", department: "Public Health", lecturerId: "", code: "EVM 223", title: "Behavioural & Cultural Issues in Healthcare", level: "200", semester: 1, creditUnit: 2 },
  { id: "C076", department: "Public Health", lecturerId: "", code: "EVM 217", title: "Introduction to Bio Statistics/Vital & Health Statistics", level: "200", semester: 1, creditUnit: 3 },
  { id: "C077", department: "Public Health", lecturerId: "", code: "CLI 233", title: "Human Physiology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C078", department: "Public Health", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "200", semester: 1, creditUnit: 2 },
  { id: "C079", department: "Public Health", lecturerId: "", code: "FRE 003", title: "French Communication", level: "200", semester: 1, creditUnit: 2 },

  // --- 300/400 Level EVM/Public Health ---
  { id: "C080", department: "Public Health", lecturerId: "", code: "EVM 327", title: "Ethical and Legal Issues in Healthcare", level: "300", semester: 1, creditUnit: 2 },
  { id: "C081", department: "Public Health", lecturerId: "", code: "BIO 315", title: "Epidemiology/Human Disease Prevention", level: "300", semester: 1, creditUnit: 3 },
  { id: "C082", department: "Public Health", lecturerId: "", code: "EVM 311", title: "Health Economics and Financing", level: "300", semester: 1, creditUnit: 3 },
  { id: "C083", department: "Public Health", lecturerId: "", code: "BSS 411", title: "Medical Parasitology & Entomology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C084", department: "Public Health", lecturerId: "", code: "EVM 411", title: "Emergency Healthcare and Safety", level: "300", semester: 1, creditUnit: 3 },
  { id: "C085", department: "Public Health", lecturerId: "", code: "EVM 417", title: "Environmental Toxicology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C086", department: "Public Health", lecturerId: "", code: "BIO 421", title: "Maternal and Child Health", level: "300", semester: 1, creditUnit: 3 },
  { id: "C087", department: "Public Health", lecturerId: "", code: "EVM 425", title: "Health Information Management System", level: "300", semester: 1, creditUnit: 2 },
  { id: "C088", department: "Public Health", lecturerId: "", code: "EVM 419", title: "Occupational Health and Industrial Hygiene", level: "300", semester: 1, creditUnit: 3 },
  { id: "C089", department: "Public Health", lecturerId: "", code: "BIO 319", title: "Environmental Health", level: "300", semester: 1, creditUnit: 3 },
  { id: "C090", department: "Public Health", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "300", semester: 1, creditUnit: 2 },
  { id: "C091", department: "Public Health", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 1, creditUnit: 6 },

  // --- 200 Level Pharmacy ---
  { id: "C092", department: "Pharmacy", lecturerId: "", code: "BCH 213", title: "Bioenergetics & Metabolism", level: "200", semester: 1, creditUnit: 3 },
  { id: "C093", department: "Pharmacy", lecturerId: "", code: "PSG 211", title: "General Principle of Physiology I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C094", department: "Pharmacy", lecturerId: "", code: "EVM 215", title: "Fundamental to Public Health", level: "200", semester: 1, creditUnit: 2 },
  { id: "C095", department: "Pharmacy", lecturerId: "", code: "CHM 217", title: "Physical and Inorganic Chemistry", level: "200", semester: 1, creditUnit: 3 },
  { id: "C096", department: "Pharmacy", lecturerId: "", code: "ABM 215", title: "Introduction to Pharmacognosy I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C097", department: "Pharmacy", lecturerId: "", code: "CHM 211", title: "Analytical & Pharmaceutical Chemistry I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C098", department: "Pharmacy", lecturerId: "", code: "PCO 313", title: "Autonomic/Neuro-Pharmacology", level: "200", semester: 1, creditUnit: 3 },
  { id: "C099", department: "Pharmacy", lecturerId: "", code: "ABM 307", title: "Pharmaceutical Technology I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C100", department: "Pharmacy", lecturerId: "", code: "PPR 312", title: "Pharmacy Management/Entrepreneurship I", level: "200", semester: 1, creditUnit: 2 },
  { id: "C101", department: "Pharmacy", lecturerId: "", code: "PCH 322", title: "Pharmaceutical Analysis I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C102", department: "Pharmacy", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "200", semester: 1, creditUnit: 2 },

  // --- 300 Level Pharmacy ---
  { id: "C103", department: "Pharmacy", lecturerId: "", code: "ABM 204", title: "Pharmaceutical Organic Chem. I&II", level: "300", semester: 1, creditUnit: 3 },
  { id: "C104", department: "Pharmacy", lecturerId: "", code: "PCL 311", title: "Clinical Pharmacology and Chemotherapy", level: "300", semester: 1, creditUnit: 3 },
  { id: "C105", department: "Pharmacy", lecturerId: "", code: "ABM 417", title: "Systemic Pharmacology & Biochem.", level: "300", semester: 1, creditUnit: 3 },
  { id: "C106", department: "Pharmacy", lecturerId: "", code: "PCG 322", title: "Medicinal & Poisonous Plants", level: "300", semester: 1, creditUnit: 2 },
  { id: "C107", department: "Pharmacy", lecturerId: "", code: "PPR 322", title: "Pharmacoeconomics", level: "300", semester: 1, creditUnit: 2 },
  { id: "C108", department: "Pharmacy", lecturerId: "", code: "ABM 331", title: "Pharmacology I & II", level: "300", semester: 1, creditUnit: 3 },
  { id: "C109", department: "Pharmacy", lecturerId: "", code: "PCT 411", title: "Power & Tablet Tech.", level: "300", semester: 1, creditUnit: 3 },
  { id: "C110", department: "Pharmacy", lecturerId: "", code: "PPR 412", title: "Forensic Pharmacy & Pharmacy Ethics", level: "300", semester: 1, creditUnit: 2 },
  { id: "C111", department: "Pharmacy", lecturerId: "", code: "PCN 414", title: "Biopharmaceutics & Pharmacokinetics", level: "300", semester: 1, creditUnit: 3 },
  { id: "C112", department: "Pharmacy", lecturerId: "", code: "CHM 301", title: "Analytical Chemistry II, Pharmaceutical Chemistry & Basic Methods of Analysis", level: "300", semester: 1, creditUnit: 3 },
  { id: "C113", department: "Pharmacy", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "300", semester: 1, creditUnit: 2 },

  // --- 400 Level Pharmacy ---
  { id: "C114", department: "Pharmacy", lecturerId: "", code: "CLI 503", title: "Public Health Pharmacy", level: "400", semester: 1, creditUnit: 3 },
  { id: "C115", department: "Pharmacy", lecturerId: "", code: "CLI 505", title: "Clinical Pharmacy Clerkship I", level: "400", semester: 1, creditUnit: 3 },
  { id: "C116", department: "Pharmacy", lecturerId: "", code: "PCG 501", title: "Evaluation of Phyto-Pharmaceuticals", level: "400", semester: 1, creditUnit: 3 },
  { id: "C117", department: "Pharmacy", lecturerId: "", code: "PCG 502", title: "Clinical Pharmacognosy: Traditional Medicine Practice", level: "400", semester: 1, creditUnit: 3 },
  { id: "C118", department: "Pharmacy", lecturerId: "", code: "PCT 501", title: "Formulation Processes and Process Validation", level: "400", semester: 1, creditUnit: 3 },
  { id: "C119", department: "Pharmacy", lecturerId: "", code: "PCH 501", title: "Pharmaceutical Analysis II and Drug Quality Assurance", level: "400", semester: 1, creditUnit: 3 },
  { id: "C120", department: "Pharmacy", lecturerId: "", code: "PHM 443", title: "Seminar in Pharmacy II", level: "400", semester: 1, creditUnit: 2 },
  { id: "C121", department: "Pharmacy", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 1, creditUnit: 6 },

  // --- 200 Level Computer Science ---
  { id: "C122", department: "Computer Science", lecturerId: "LEC001", code: "MTH 211/212", title: "Mathematical Methods I&II", level: "200", semester: 1, creditUnit: 3 },
  { id: "C123", department: "Computer Science", lecturerId: "", code: "CMP 211", title: "Scientific Programming", level: "200", semester: 1, creditUnit: 3 },
  { id: "C124", department: "Computer Science", lecturerId: "", code: "CMP 217", title: "Elementary Data Processing", level: "200", semester: 1, creditUnit: 3 },
  { id: "C125", department: "Computer Science", lecturerId: "", code: "MTH 215", title: "Introduction to Abstract Algebra", level: "200", semester: 1, creditUnit: 3 },
  { id: "C126", department: "Computer Science", lecturerId: "", code: "CMP 213", title: "Introduction to Operating Systems", level: "200", semester: 1, creditUnit: 3 },
  { id: "C127", department: "Computer Science", lecturerId: "", code: "CMP 317", title: "System Analysis", level: "200", semester: 1, creditUnit: 3 },
  { id: "C128", department: "Computer Science", lecturerId: "", code: "CMP 315", title: "Software Engineering I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C129", department: "Computer Science", lecturerId: "", code: "CMP 311", title: "Digital Computer Logic Design", level: "200", semester: 1, creditUnit: 3 },
  { id: "C130", department: "Computer Science", lecturerId: "", code: "CMP 313", title: "Systems Programming", level: "200", semester: 1, creditUnit: 3 },
  { id: "C131", department: "Computer Science", lecturerId: "", code: "CMP 319", title: "Formal Language and Automata", level: "200", semester: 1, creditUnit: 3 },
  { id: "C132", department: "Computer Science", lecturerId: "", code: "CMP 316", title: "Data Structure", level: "200", semester: 1, creditUnit: 3 },
  { id: "C133", department: "Computer Science", lecturerId: "", code: "STA 211", title: "Probability Theorem I", level: "200", semester: 1, creditUnit: 3 },
  { id: "C134", department: "Computer Science", lecturerId: "", code: "CMP 216", title: "Web Development II/ Java Script", level: "200", semester: 1, creditUnit: 3 },
  { id: "C135", department: "Computer Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "200", semester: 1, creditUnit: 2 },

  // --- 300 Level Computer Science ---
  { id: "C136", department: "Computer Science", lecturerId: "", code: "CMP 413", title: "Computer Simulations", level: "300", semester: 1, creditUnit: 3 },
  { id: "C137", department: "Computer Science", lecturerId: "", code: "CMP 419/423", title: "Data Base Systems/Distributed Sys", level: "300", semester: 1, creditUnit: 3 },
  { id: "C138", department: "Computer Science", lecturerId: "", code: "CMP 415", title: "Computer Architecture & Organisation", level: "300", semester: 1, creditUnit: 3 },
  { id: "C139", department: "Computer Science", lecturerId: "", code: "CMP 421", title: "Software Management", level: "300", semester: 1, creditUnit: 3 },
  { id: "C140", department: "Computer Science", lecturerId: "", code: "CMP 411", title: "Software Engineering II", level: "300", semester: 1, creditUnit: 3 },
  { id: "C141", department: "Computer Science", lecturerId: "", code: "CMP 417", title: "Artificial Intelligence", level: "300", semester: 1, creditUnit: 3 },
  { id: "C142", department: "Computer Science", lecturerId: "", code: "CMP 493", title: "Cyber Security", level: "300", semester: 1, creditUnit: 3 },
  { id: "C143", department: "Computer Science", lecturerId: "", code: "ENT 311", title: "Entrepreneurial Skill & Development", level: "300", semester: 1, creditUnit: 2 },
  { id: "C144", department: "Computer Science", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "300", semester: 1, creditUnit: 6 },
  { id: "C145", department: "Computer Science", lecturerId: "", code: "FRE 411", title: "French", level: "300", semester: 1, creditUnit: 2 },

  // ===== SECOND SEMESTER =====

  // --- 100 Level General Second Semester ---
  { id: "C146", department: "Bioscience", lecturerId: "", code: "BIO 112", title: "Introductory Ecology", level: "100", semester: 2, creditUnit: 3 },
  { id: "C147", department: "Bioscience", lecturerId: "", code: "MTH 112", title: "Elementary Maths II", level: "100", semester: 2, creditUnit: 2 },
  { id: "C148", department: "Bioscience", lecturerId: "", code: "PLS 112", title: "Plant Diversity", level: "100", semester: 2, creditUnit: 3 },
  { id: "C149", department: "Bioscience", lecturerId: "", code: "PHY 112", title: "Physics for Bioscience", level: "100", semester: 2, creditUnit: 3 },
  { id: "C150", department: "Bioscience", lecturerId: "", code: "CHM 112/114", title: "Introductory Chemistry & Chemistry Practical II", level: "100", semester: 2, creditUnit: 3 },
  { id: "C151", department: "Bioscience", lecturerId: "", code: "STA 112", title: "Probability", level: "100", semester: 2, creditUnit: 2 },
  { id: "C152", department: "Computer Science", lecturerId: "", code: "CMP 112", title: "Introduction to Computer II", level: "100", semester: 2, creditUnit: 2 },
  { id: "C153", department: "Bioscience", lecturerId: "", code: "GST 112", title: "Use of English II", level: "100", semester: 2, creditUnit: 2 },
  { id: "C154", department: "Bioscience", lecturerId: "", code: "GST 116", title: "Philosophy and Logic II", level: "100", semester: 2, creditUnit: 2 },
  { id: "C155", department: "Nursing Science", lecturerId: "", code: "BIO 121", title: "Foundation of Nursing I", level: "100", semester: 2, creditUnit: 3 },
  { id: "C156", department: "Bioscience", lecturerId: "", code: "FRE 002", title: "French Appreciation", level: "100", semester: 2, creditUnit: 2 },

  // --- 200 Level NS Second Semester ---
  { id: "C157", department: "Nursing Science", lecturerId: "", code: "BIO 222", title: "Foundation of Professional Nursing III", level: "200", semester: 2, creditUnit: 3 },
  { id: "C158", department: "Nursing Science", lecturerId: "", code: "CLI 222", title: "Renal and Body Fluids Physiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C159", department: "Nursing Science", lecturerId: "", code: "CLI 252", title: "General and Cellular Pathology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C160", department: "Nursing Science", lecturerId: "", code: "CLI 214", title: "Human Anatomy II & Gross Anatomy II", level: "200", semester: 2, creditUnit: 4 },
  { id: "C161", department: "Nursing Science", lecturerId: "", code: "CLI 234", title: "Human Physiology II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C162", department: "Nursing Science", lecturerId: "", code: "BCH 212/216", title: "Medical Biochem / Practical Biochem", level: "200", semester: 2, creditUnit: 3 },
  { id: "C163", department: "Nursing Science", lecturerId: "", code: "PSG 216", title: "Endocrinology and Reproductive Physiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C164", department: "Nursing Science", lecturerId: "", code: "MCB 212", title: "Medical Microbiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C165", department: "Nursing Science", lecturerId: "", code: "GNS 228", title: "Seminar Presentation/Writing of Term Paper", level: "200", semester: 2, creditUnit: 2 },
  { id: "C166", department: "Nursing Science", lecturerId: "", code: "FRE 004", title: "French Appreciation", level: "200", semester: 2, creditUnit: 2 },

  // --- 300 Level NS Second Semester ---
  { id: "C167", department: "Nursing Science", lecturerId: "", code: "BIO 312", title: "Community/Public Health Nursing II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C168", department: "Nursing Science", lecturerId: "", code: "BIO 322", title: "Medical Surgical Nursing II", level: "300", semester: 2, creditUnit: 4 },
  { id: "C169", department: "Nursing Science", lecturerId: "", code: "BIO 340", title: "Nutrition in Health and Disease", level: "300", semester: 2, creditUnit: 3 },
  { id: "C170", department: "Nursing Science", lecturerId: "", code: "EVM 321", title: "Primary Health Care: Principles, Methods and Services", level: "300", semester: 2, creditUnit: 3 },
  { id: "C171", department: "Nursing Science", lecturerId: "", code: "BIO 321", title: "Paediatrics I", level: "300", semester: 2, creditUnit: 3 },
  { id: "C172", department: "Nursing Science", lecturerId: "", code: "BIO 324", title: "Mental Health Nursing II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C173", department: "Nursing Science", lecturerId: "", code: "BIO 309", title: "Nursing Ethics and Jurisprudence", level: "300", semester: 2, creditUnit: 2 },
  { id: "C174", department: "Nursing Science", lecturerId: "", code: "EVM 316", title: "Biostatistics and Stat. for Health Professions", level: "300", semester: 2, creditUnit: 3 },

  // --- 400 Level NS Second Semester ---
  { id: "C175", department: "Nursing Science", lecturerId: "", code: "BIO 531", title: "Paediatrics Nursing III", level: "400", semester: 2, creditUnit: 3 },
  { id: "C176", department: "Nursing Science", lecturerId: "", code: "BIO 436", title: "Primary Healthcare II", level: "400", semester: 2, creditUnit: 3 },
  { id: "C177", department: "Nursing Science", lecturerId: "", code: "BIO 521", title: "Advance Maternal and Child Health II", level: "400", semester: 2, creditUnit: 3 },
  { id: "C178", department: "Nursing Science", lecturerId: "", code: "BIO 404", title: "Obstetrics and Gynecology", level: "400", semester: 2, creditUnit: 3 },

  // --- 200 Level MLS Second Semester ---
  { id: "C179", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 312", title: "Med Lab Instrumentation and Tech", level: "200", semester: 2, creditUnit: 3 },
  { id: "C180", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 314", title: "Lab Mgt and Organization", level: "200", semester: 2, creditUnit: 3 },
  { id: "C181", department: "Medical Laboratory Science", lecturerId: "", code: "PCN 322", title: "Gastrointestinal Physiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C182", department: "Medical Laboratory Science", lecturerId: "", code: "PHM 312", title: "Basic Pharmacology and Toxicology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C183", department: "Medical Laboratory Science", lecturerId: "", code: "BCH 212/216", title: "Medical Biochem / Practical Biochem", level: "200", semester: 2, creditUnit: 3 },
  { id: "C184", department: "Medical Laboratory Science", lecturerId: "", code: "PSG 314", title: "General Principles of Physiology III", level: "200", semester: 2, creditUnit: 3 },

  // --- 300 Level MLS Second Semester ---
  { id: "C185", department: "Medical Laboratory Science", lecturerId: "", code: "MLS 403", title: "Medical Laboratory Microbiology I", level: "300", semester: 2, creditUnit: 3 },
  { id: "C186", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 427", title: "Medical Laboratory Histopathology I", level: "300", semester: 2, creditUnit: 3 },
  { id: "C187", department: "Medical Laboratory Science", lecturerId: "", code: "CPY 321", title: "Basic Clinical Chemistry/Chemical Pathology II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C188", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 522", title: "Genetics Monitoring & Molecular Biology", level: "300", semester: 2, creditUnit: 3 },
  { id: "C189", department: "Medical Laboratory Science", lecturerId: "", code: "EVM 316", title: "Biostatistics and Stat. for Health Professions", level: "300", semester: 2, creditUnit: 3 },

  // --- 400 Level MLS Second Semester ---
  { id: "C190", department: "Medical Laboratory Science", lecturerId: "", code: "BSC 512", title: "Drug Monitoring & Toxicology", level: "400", semester: 2, creditUnit: 3 },
  { id: "C191", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 422/512", title: "Medical Virology I & II", level: "400", semester: 2, creditUnit: 3 },
  { id: "C192", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 514", title: "Techniques in Clinical Chemistry", level: "400", semester: 2, creditUnit: 3 },
  { id: "C193", department: "Medical Laboratory Science", lecturerId: "", code: "BCH 403", title: "Chemistry and Metabolism of Amino Acids", level: "400", semester: 2, creditUnit: 3 },
  { id: "C194", department: "Medical Laboratory Science", lecturerId: "", code: "BSM 522", title: "Laboratory Techniques in Microbiology & Analytical and Quality Control", level: "400", semester: 2, creditUnit: 3 },
  { id: "C195", department: "Medical Laboratory Science", lecturerId: "", code: "BSS 518", title: "Laboratory Posting III", level: "400", semester: 2, creditUnit: 3 },
  { id: "C196", department: "Medical Laboratory Science", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 2, creditUnit: 6 },

  // --- 200 Level Pharmacy Second Semester ---
  { id: "C197", department: "Pharmacy", lecturerId: "", code: "CLI 252", title: "General & Cellular Pathology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C198", department: "Pharmacy", lecturerId: "", code: "CLI 214", title: "Human Anatomy II & Gross Anatomy II", level: "200", semester: 2, creditUnit: 4 },
  { id: "C199", department: "Pharmacy", lecturerId: "", code: "BCH 212/216", title: "Medical Biochem / Practical Biochem", level: "200", semester: 2, creditUnit: 3 },
  { id: "C200", department: "Pharmacy", lecturerId: "", code: "PIO 202", title: "Neurophysiology and Special Senses", level: "200", semester: 2, creditUnit: 3 },
  { id: "C201", department: "Pharmacy", lecturerId: "", code: "BSS 202", title: "Introductory and Blood Physiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C202", department: "Pharmacy", lecturerId: "", code: "PCG 202", title: "Organised and Unorganized Vegetable Drugs", level: "200", semester: 2, creditUnit: 3 },
  { id: "C203", department: "Pharmacy", lecturerId: "", code: "CHM 221", title: "Water Treatment Technology", level: "200", semester: 2, creditUnit: 2 },

  // --- 300 Level Pharmacy Second Semester ---
  { id: "C204", department: "Pharmacy", lecturerId: "", code: "ABM 409/411", title: "Industrial Pharmacy/Pharmacy Calculations", level: "300", semester: 2, creditUnit: 3 },
  { id: "C205", department: "Pharmacy", lecturerId: "", code: "PMB 411", title: "Pharmaceutical Microbiology", level: "300", semester: 2, creditUnit: 3 },
  { id: "C206", department: "Pharmacy", lecturerId: "", code: "PMB 413", title: "Sterile Products Formulation & Immunology", level: "300", semester: 2, creditUnit: 3 },
  { id: "C207", department: "Pharmacy", lecturerId: "", code: "PCH 512", title: "Medicinal Chemistry /Phytochemistry and Biosynthesis of Natural Products", level: "300", semester: 2, creditUnit: 3 },
  { id: "C208", department: "Pharmacy", lecturerId: "", code: "PHM 535", title: "Drug Delivery/Drug Delivery System", level: "300", semester: 2, creditUnit: 3 },
  { id: "C209", department: "Pharmacy", lecturerId: "", code: "PCN 512", title: "Pharmacotherapeutics & Clinical Pharmacotherapy", level: "300", semester: 2, creditUnit: 3 },
  { id: "C210", department: "Pharmacy", lecturerId: "", code: "EVM 316", title: "Biostatistics and Stat. for Health Professions", level: "300", semester: 2, creditUnit: 3 },

  // --- 400 Level Pharmacy Second Semester ---
  { id: "C211", department: "Pharmacy", lecturerId: "", code: "PHM/PTX 522", title: "Toxicology/Drug Interactions", level: "400", semester: 2, creditUnit: 3 },
  { id: "C212", department: "Pharmacy", lecturerId: "", code: "PCT 412", title: "Dosage Evaluation, Drug Stability & Drug Dispensing", level: "400", semester: 2, creditUnit: 3 },
  { id: "C213", department: "Pharmacy", lecturerId: "", code: "PCN 522", title: "Clinical Pharmacotherapeutics II", level: "400", semester: 2, creditUnit: 3 },
  { id: "C214", department: "Pharmacy", lecturerId: "", code: "PMB 522", title: "Preservation & Fermentation Biotechnology", level: "400", semester: 2, creditUnit: 3 },
  { id: "C215", department: "Pharmacy", lecturerId: "", code: "PHM 533", title: "Pharmaceutical Analysis II and Drug Quality Control and Assurance", level: "400", semester: 2, creditUnit: 3 },

  // --- 200 Level EVM/Public Health Second Semester ---
  { id: "C216", department: "Public Health", lecturerId: "", code: "EVM 224/319", title: "Public Health Services and Organization and Delivery of Health Care Service", level: "200", semester: 2, creditUnit: 3 },
  { id: "C217", department: "Public Health", lecturerId: "", code: "MCB 212", title: "Medical Microbiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C218", department: "Public Health", lecturerId: "", code: "EVM 220/412", title: "Fundamental of Epidemiology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C219", department: "Public Health", lecturerId: "", code: "EVM 222/213", title: "Health Planning/Intro to Health Care Mgt.", level: "200", semester: 2, creditUnit: 3 },
  { id: "C220", department: "Public Health", lecturerId: "", code: "EVM 317/316", title: "Environmental Toxicology/Health Environmental Risk Assessment", level: "200", semester: 2, creditUnit: 3 },
  { id: "C221", department: "Public Health", lecturerId: "", code: "EVM 241", title: "Health Information Management System", level: "200", semester: 2, creditUnit: 2 },
  { id: "C222", department: "Public Health", lecturerId: "", code: "EVM 311", title: "Emergency Health Care and Safety", level: "200", semester: 2, creditUnit: 3 },

  // --- 300/400 Level EVM/Public Health Second Semester ---
  { id: "C223", department: "Public Health", lecturerId: "", code: "EVM 424", title: "Public Health Policy and Administration", level: "400", semester: 2, creditUnit: 3 },
  { id: "C224", department: "Public Health", lecturerId: "", code: "EVM 414", title: "Health Education and Communication", level: "400", semester: 2, creditUnit: 3 },
  { id: "C225", department: "Public Health", lecturerId: "", code: "EVM 418", title: "Evaluation of Health Promotion Programs", level: "400", semester: 2, creditUnit: 3 },
  { id: "C226", department: "Public Health", lecturerId: "", code: "EVM 321", title: "Primary Health Care: Principle, Method and Ser.", level: "400", semester: 2, creditUnit: 3 },
  { id: "C227", department: "Public Health", lecturerId: "", code: "EVM 318", title: "Population Health and Development", level: "300", semester: 2, creditUnit: 3 },
  { id: "C228", department: "Public Health", lecturerId: "", code: "EVM 320", title: "Non-Communicable Diseases", level: "300", semester: 2, creditUnit: 3 },
  { id: "C229", department: "Public Health", lecturerId: "", code: "RMT 499", title: "Research Methodology/Project", level: "400", semester: 2, creditUnit: 6 },

  // ===== HUMANITIES FACULTY — FIRST SEMESTER COURSES =====

  // --- Accounting & Finance ---
  { id: "C230", department: "Accounting & Finance", lecturerId: "", code: "ACC 111", title: "Principles of Accounting 1", level: "100", semester: 1, creditUnit: 3 },
  { id: "C231", department: "Accounting & Finance", lecturerId: "", code: "ACC 211", title: "Intro to Financial Accounting", level: "200", semester: 1, creditUnit: 3 },
  { id: "C232", department: "Accounting & Finance", lecturerId: "", code: "ACC 213", title: "Intro to Fin. Accounting Workshop", level: "200", semester: 1, creditUnit: 3 },
  { id: "C233", department: "Accounting & Finance", lecturerId: "", code: "ACC 311", title: "Advanced Financial Accounting", level: "300", semester: 1, creditUnit: 3 },
  { id: "C234", department: "Accounting & Finance", lecturerId: "", code: "ACC 313", title: "Management Accounting 1", level: "300", semester: 1, creditUnit: 3 },
  { id: "C235", department: "Accounting & Finance", lecturerId: "", code: "ACC 315", title: "Strategic Financial Mgt. 1", level: "300", semester: 1, creditUnit: 3 },
  { id: "C236", department: "Accounting & Finance", lecturerId: "", code: "ACC 317", title: "Int'l Business & Accounting", level: "300", semester: 1, creditUnit: 3 },
  { id: "C237", department: "Accounting & Finance", lecturerId: "", code: "ACC 319", title: "Taxation & Tax Management", level: "300", semester: 1, creditUnit: 3 },
  { id: "C238", department: "Accounting & Finance", lecturerId: "", code: "ACC 391", title: "Research Methodology/Auditing", level: "300", semester: 1, creditUnit: 3 },

  // --- Business Administration ---
  { id: "C239", department: "Business Administration", lecturerId: "", code: "BUS 111", title: "Intro to Business Management", level: "100", semester: 1, creditUnit: 3 },
  { id: "C240", department: "Business Administration", lecturerId: "", code: "BUS 211", title: "Management of Small Scale Business", level: "200", semester: 1, creditUnit: 3 },
  { id: "C241", department: "Business Administration", lecturerId: "", code: "BUS 213", title: "Intro to Industrial Relations 1", level: "200", semester: 1, creditUnit: 3 },
  { id: "C242", department: "Business Administration", lecturerId: "", code: "BUS 215", title: "Business Law", level: "200", semester: 1, creditUnit: 3 },
  { id: "C243", department: "Business Administration", lecturerId: "", code: "BUS 217", title: "Consumer Behavior", level: "200", semester: 1, creditUnit: 3 },
  { id: "C244", department: "Business Administration", lecturerId: "", code: "BUS 219", title: "Industrial Psychology", level: "200", semester: 1, creditUnit: 2 },
  { id: "C245", department: "Business Administration", lecturerId: "", code: "BUS 311", title: "Business Policy 1", level: "300", semester: 1, creditUnit: 3 },
  { id: "C246", department: "Business Administration", lecturerId: "", code: "BUS 313", title: "Analysis for Business Decision 1", level: "300", semester: 1, creditUnit: 3 },
  { id: "C247", department: "Business Administration", lecturerId: "", code: "BUS 315", title: "Company Law", level: "300", semester: 1, creditUnit: 3 },
  { id: "C248", department: "Business Administration", lecturerId: "", code: "BUS 317", title: "Research Methodology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C249", department: "Business Administration", lecturerId: "", code: "BUS 319", title: "Organizational Behavior", level: "300", semester: 1, creditUnit: 3 },
  { id: "C250", department: "Business Administration", lecturerId: "", code: "BUS 321", title: "Mgt. Info System & Data Processing", level: "300", semester: 1, creditUnit: 3 },
  { id: "C251", department: "Business Administration", lecturerId: "", code: "BUS 317/ECO 321", title: "Project Analysis / Evaluation", level: "300", semester: 1, creditUnit: 3 },

  // --- Mass Communication ---
  { id: "C252", department: "Mass Communication", lecturerId: "", code: "MAS 111", title: "Intro to Mass Communication", level: "100", semester: 1, creditUnit: 3 },
  { id: "C253", department: "Mass Communication", lecturerId: "", code: "MAS 113", title: "Writing for the Mass Media", level: "100", semester: 1, creditUnit: 3 },
  { id: "C254", department: "Mass Communication", lecturerId: "", code: "MAS 114", title: "Introduction to Photography/Photo-Journalism", level: "100", semester: 1, creditUnit: 3 },
  { id: "C255", department: "Mass Communication", lecturerId: "", code: "MAS 115", title: "History of the Mass Media in W/A", level: "100", semester: 1, creditUnit: 3 },
  { id: "C256", department: "Mass Communication", lecturerId: "", code: "MAS 210", title: "Investigative Response/Journalism", level: "200", semester: 1, creditUnit: 2 },
  { id: "C257", department: "Mass Communication", lecturerId: "", code: "MAS 211", title: "Editing & Graphics of Communication", level: "200", semester: 1, creditUnit: 3 },
  { id: "C258", department: "Mass Communication", lecturerId: "", code: "MAS 213", title: "Theories of Mass Communication", level: "200", semester: 1, creditUnit: 3 },
  { id: "C259", department: "Mass Communication", lecturerId: "", code: "MAS 215", title: "General Media Management", level: "200", semester: 1, creditUnit: 3 },
  { id: "C260", department: "Mass Communication", lecturerId: "", code: "MAS 217", title: "Production Techniques in Advertising", level: "200", semester: 1, creditUnit: 3 },
  { id: "C261", department: "Mass Communication", lecturerId: "", code: "MAS 219", title: "Foundation of Broadcasting", level: "200", semester: 1, creditUnit: 3 },
  { id: "C262", department: "Mass Communication", lecturerId: "", code: "MAS 311", title: "Editorial Writing", level: "300", semester: 1, creditUnit: 3 },
  { id: "C263", department: "Mass Communication", lecturerId: "", code: "MAS 313", title: "Radio/TV Script & Critical Writing", level: "300", semester: 1, creditUnit: 3 },
  { id: "C264", department: "Mass Communication", lecturerId: "", code: "MAS 315", title: "Integrated Marketing Communication", level: "300", semester: 1, creditUnit: 3 },
  { id: "C265", department: "Mass Communication", lecturerId: "", code: "MAS 317", title: "Drama & Documentary Production", level: "300", semester: 1, creditUnit: 3 },
  { id: "C266", department: "Mass Communication", lecturerId: "", code: "MAS 319", title: "Marketing Management & Strategies", level: "300", semester: 1, creditUnit: 3 },
  { id: "C267", department: "Mass Communication", lecturerId: "", code: "MAS 320", title: "News Gathering", level: "300", semester: 1, creditUnit: 3 },
  { id: "C268", department: "Mass Communication", lecturerId: "", code: "MAS 321", title: "Advertising in Practice", level: "300", semester: 1, creditUnit: 3 },
  { id: "C269", department: "Mass Communication", lecturerId: "", code: "MAS 322", title: "PR Media, and Methods", level: "300", semester: 1, creditUnit: 3 },
  { id: "C270", department: "Mass Communication", lecturerId: "", code: "MAS 325", title: "Newspaper & Magazine Production", level: "300", semester: 1, creditUnit: 3 },
  { id: "C271", department: "Mass Communication", lecturerId: "", code: "MAS 327", title: "Advertising Copy & Layout", level: "300", semester: 1, creditUnit: 3 },

  // --- Human Resource Management ---
  { id: "C272", department: "Human Resource Management", lecturerId: "", code: "HRM 111", title: "Introduction to Human Resources", level: "100", semester: 1, creditUnit: 3 },
  { id: "C273", department: "Human Resource Management", lecturerId: "", code: "HRM 311", title: "Human Resource Management", level: "200", semester: 1, creditUnit: 3 },
  { id: "C274", department: "Human Resource Management", lecturerId: "", code: "HRM 313", title: "Collective Bargaining", level: "300", semester: 1, creditUnit: 3 },
  { id: "C275", department: "Human Resource Management", lecturerId: "", code: "HRM 314", title: "Employment Law", level: "300", semester: 1, creditUnit: 3 },
  { id: "C276", department: "Human Resource Management", lecturerId: "", code: "HRM 315", title: "Staffing Organization", level: "300", semester: 1, creditUnit: 3 },
  { id: "C277", department: "Human Resource Management", lecturerId: "", code: "HRM 317", title: "Compensation and Benefits", level: "300", semester: 1, creditUnit: 3 },
  { id: "C278", department: "Human Resource Management", lecturerId: "", code: "HRM 319", title: "Research Methodology", level: "300", semester: 1, creditUnit: 3 },
  { id: "C279", department: "Human Resource Management", lecturerId: "", code: "HRM 321", title: "Mgt. Ethics & Corporate Mgt.", level: "300", semester: 1, creditUnit: 3 },
  { id: "C280", department: "Human Resource Management", lecturerId: "", code: "HRM 417", title: "Conflict & Conflict Resolution in W/Place", level: "300", semester: 1, creditUnit: 3 },
  { id: "C281", department: "Human Resource Management", lecturerId: "", code: "HRM 419", title: "Human Resource Selection & Placement", level: "300", semester: 1, creditUnit: 3 },

  // --- Economics ---
  { id: "C282", department: "Economics", lecturerId: "", code: "ECO 111", title: "Intro to Economics", level: "100", semester: 1, creditUnit: 3 },
  { id: "C283", department: "Economics", lecturerId: "", code: "ECO 113", title: "Management Mathematics 1", level: "100", semester: 1, creditUnit: 3 },
  { id: "C284", department: "Economics", lecturerId: "", code: "ECO 211", title: "Principles of Micro Economics", level: "200", semester: 1, creditUnit: 3 },
  { id: "C285", department: "Economics", lecturerId: "", code: "ECO 213", title: "Intro to Social Science Statistics", level: "200", semester: 1, creditUnit: 3 },
  { id: "C286", department: "Economics", lecturerId: "", code: "ECO 215", title: "Mathematics for Economics", level: "200", semester: 1, creditUnit: 3 },
  { id: "C287", department: "Economics", lecturerId: "", code: "ECO 217", title: "Applied Economics", level: "200", semester: 1, creditUnit: 3 },
  { id: "C288", department: "Economics", lecturerId: "", code: "ECO 313", title: "Intro to Econometrics", level: "300", semester: 1, creditUnit: 3 },
  { id: "C289", department: "Economics", lecturerId: "", code: "ECO 315", title: "Monetary & Financial Institutions", level: "300", semester: 1, creditUnit: 3 },
  { id: "C290", department: "Economics", lecturerId: "", code: "ECO 321", title: "Mathematical Economics", level: "300", semester: 1, creditUnit: 3 },
  { id: "C291", department: "Economics", lecturerId: "", code: "ECO 411", title: "Advanced Microeconomics Theory", level: "300", semester: 1, creditUnit: 3 },
  { id: "C292", department: "Economics", lecturerId: "", code: "ECO 413", title: "Economic Planning", level: "300", semester: 1, creditUnit: 3 },
  { id: "C293", department: "Economics", lecturerId: "", code: "ECO 419", title: "Applied Statistics", level: "300", semester: 1, creditUnit: 3 },
  { id: "C294", department: "Economics", lecturerId: "", code: "ECO 421", title: "Project Analysis & Evaluation", level: "300", semester: 1, creditUnit: 3 },

  // --- International Relations & Diplomacy ---
  { id: "C295", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 111", title: "Intro to Political Science", level: "100", semester: 1, creditUnit: 3 },
  { id: "C296", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 113", title: "The Citizen & the State", level: "100", semester: 1, creditUnit: 3 },
  { id: "C297", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 115", title: "Intro to African Political Thought", level: "100", semester: 1, creditUnit: 3 },
  { id: "C298", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 111", title: "Principles of Int'l Relations", level: "100", semester: 1, creditUnit: 3 },
  { id: "C299", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 113", title: "History of Int'l Relations & Diplomacy", level: "100", semester: 1, creditUnit: 3 },
  { id: "C300", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 211", title: "Nigeria from 1900 – Present", level: "200", semester: 1, creditUnit: 3 },
  { id: "C301", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 213", title: "European History & Diplomacy", level: "200", semester: 1, creditUnit: 3 },
  { id: "C302", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 215", title: "Diversity & Conflict Management", level: "200", semester: 1, creditUnit: 3 },
  { id: "C303", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 217", title: "USA History & Diplomacy", level: "200", semester: 1, creditUnit: 3 },
  { id: "C304", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 219", title: "USSR from 1905 – 1950", level: "200", semester: 1, creditUnit: 3 },
  { id: "C305", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 221", title: "Intro to Public Administration", level: "200", semester: 1, creditUnit: 3 },
  { id: "C306", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 223", title: "Political Economy", level: "200", semester: 1, creditUnit: 3 },
  { id: "C307", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 311", title: "Theory & Practice of Diplomacy", level: "300", semester: 1, creditUnit: 3 },
  { id: "C308", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 313", title: "Int'l Relations Research Methods", level: "300", semester: 1, creditUnit: 3 },
  { id: "C309", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 315", title: "European Union & Dev. Countries", level: "300", semester: 1, creditUnit: 3 },
  { id: "C310", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 317", title: "War & Peace in the 20th Century", level: "300", semester: 1, creditUnit: 3 },
  { id: "C311", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 319", title: "Special Paper (Local History)", level: "300", semester: 1, creditUnit: 2 },
  { id: "C312", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 321", title: "History of Commonwealth", level: "300", semester: 1, creditUnit: 3 },
  { id: "C313", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 323", title: "Comparative Industrial Growth of USA, Japan, China & Britain", level: "300", semester: 1, creditUnit: 3 },
  { id: "C314", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 325", title: "Int'l Organizations & Non-State Actors in Int'l Relations", level: "300", semester: 1, creditUnit: 3 },
  { id: "C315", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 327", title: "Principles & Practice of Int'l Trade", level: "300", semester: 1, creditUnit: 3 },

  // ===== HUMANITIES FACULTY — SECOND SEMESTER COURSES =====

  // --- Economics 100 Level Second Sem ---
  { id: "C316", department: "Economics", lecturerId: "", code: "ECO 102", title: "Management Mathematics", level: "100", semester: 2, creditUnit: 2 },
  { id: "C317", department: "Economics", lecturerId: "", code: "ECO 112", title: "Principles of Economics II", level: "100", semester: 2, creditUnit: 2 },
  { id: "C318", department: "Economics", lecturerId: "", code: "ECO 104", title: "Principles of Project Management", level: "100", semester: 2, creditUnit: 3 },
  { id: "C319", department: "Economics", lecturerId: "", code: "SOC 112", title: "Structure of the Nigerian Economy", level: "100", semester: 2, creditUnit: 3 },
  { id: "C320", department: "Economics", lecturerId: "", code: "ACC 113", title: "Cost Accounting", level: "100", semester: 2, creditUnit: 3 },
  { id: "C321", department: "Economics", lecturerId: "", code: "ECO 212", title: "Principles of Macro Economics", level: "200", semester: 2, creditUnit: 2 },
  { id: "C322", department: "Economics", lecturerId: "", code: "ECO 214", title: "Social Science Statistics II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C323", department: "Economics", lecturerId: "", code: "ECO 216", title: "Mathematics for Economics II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C324", department: "Economics", lecturerId: "", code: "ECO 218", title: "History of Economic Thought", level: "200", semester: 2, creditUnit: 3 },
  { id: "C325", department: "Economics", lecturerId: "", code: "ACC 212", title: "Introduction to Financial Accounting II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C326", department: "Economics", lecturerId: "", code: "ACC 218", title: "Introduction to Cost Accounting", level: "200", semester: 2, creditUnit: 2 },
  { id: "C327", department: "Economics", lecturerId: "", code: "ECO 314", title: "Economic Development Theory", level: "300", semester: 2, creditUnit: 3 },
  { id: "C328", department: "Economics", lecturerId: "", code: "ECO 322", title: "Research Methods in Economics", level: "300", semester: 2, creditUnit: 3 },
  { id: "C329", department: "Economics", lecturerId: "", code: "ECO 412", title: "Intermediate/Advance Micro Economics II", level: "300", semester: 2, creditUnit: 2 },
  { id: "C330", department: "Economics", lecturerId: "", code: "ECO 414", title: "Fiscal Policy & Management", level: "300", semester: 2, creditUnit: 2 },
  { id: "C331", department: "Economics", lecturerId: "", code: "ECO 422", title: "Econometrics", level: "300", semester: 2, creditUnit: 3 },

  // --- Business Administration Second Sem ---
  { id: "C332", department: "Business Administration", lecturerId: "", code: "BUS 101", title: "Introduction to Business", level: "100", semester: 2, creditUnit: 2 },
  { id: "C333", department: "Business Administration", lecturerId: "", code: "BUS 112", title: "Principles of Management", level: "100", semester: 2, creditUnit: 3 },
  { id: "C334", department: "Business Administration", lecturerId: "", code: "BUS 114", title: "Business Environment", level: "100", semester: 2, creditUnit: 3 },
  { id: "C335", department: "Business Administration", lecturerId: "", code: "BUS 116", title: "Project Management", level: "100", semester: 2, creditUnit: 3 },
  { id: "C336", department: "Business Administration", lecturerId: "", code: "BUS 212", title: "Production Management", level: "200", semester: 2, creditUnit: 3 },
  { id: "C337", department: "Business Administration", lecturerId: "", code: "BUS 214", title: "Intro to Industrial Relations II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C338", department: "Business Administration", lecturerId: "", code: "BUS 216", title: "Business Law II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C339", department: "Business Administration", lecturerId: "", code: "BUS 218", title: "Business Communication", level: "200", semester: 2, creditUnit: 3 },
  { id: "C340", department: "Business Administration", lecturerId: "", code: "BUS 312", title: "Human Resource Management II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C341", department: "Business Administration", lecturerId: "", code: "BUS 316", title: "Operations Research", level: "300", semester: 2, creditUnit: 3 },
  { id: "C342", department: "Business Administration", lecturerId: "", code: "BUS 318", title: "Manpower Planning", level: "300", semester: 2, creditUnit: 3 },
  { id: "C343", department: "Business Administration", lecturerId: "", code: "BUS 412", title: "Business Policy II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C344", department: "Business Administration", lecturerId: "", code: "BUS 414", title: "Analysis for Business Decision II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C345", department: "Business Administration", lecturerId: "", code: "BUS 416", title: "Comparative Management", level: "300", semester: 2, creditUnit: 3 },
  { id: "C346", department: "Business Administration", lecturerId: "", code: "BUS 418", title: "Business Finance", level: "300", semester: 2, creditUnit: 3 },
  { id: "C347", department: "Business Administration", lecturerId: "", code: "BUS 420", title: "Business Ethics and Corporate Governance", level: "300", semester: 2, creditUnit: 3 },

  // --- Mass Communication Second Sem ---
  { id: "C348", department: "Mass Communication", lecturerId: "", code: "MAS 116", title: "Introduction to Advert and Public Relation", level: "100", semester: 2, creditUnit: 3 },
  { id: "C349", department: "Mass Communication", lecturerId: "", code: "MAS 113", title: "Communication System in Africa", level: "100", semester: 2, creditUnit: 2 },
  { id: "C350", department: "Mass Communication", lecturerId: "", code: "MAS 114", title: "Introduction to News Writing & Reporting", level: "100", semester: 2, creditUnit: 3 },
  { id: "C351", department: "Mass Communication", lecturerId: "", code: "MAS 118", title: "Introduction to Advertising", level: "100", semester: 2, creditUnit: 3 },
  { id: "C352", department: "Mass Communication", lecturerId: "", code: "MAS 212", title: "News Writing & Reporting II", level: "200", semester: 2, creditUnit: 3 },
  { id: "C353", department: "Mass Communication", lecturerId: "", code: "MAS 214", title: "Critical and Review Writing", level: "200", semester: 2, creditUnit: 3 },
  { id: "C354", department: "Mass Communication", lecturerId: "", code: "MAS 218", title: "Introduction to Communication Research", level: "200", semester: 2, creditUnit: 3 },
  { id: "C355", department: "Mass Communication", lecturerId: "", code: "MAS 224", title: "Mass Media Technology", level: "200", semester: 2, creditUnit: 3 },
  { id: "C356", department: "Mass Communication", lecturerId: "", code: "MAS 222", title: "English in Mass Media", level: "200", semester: 2, creditUnit: 3 },
  { id: "C357", department: "Mass Communication", lecturerId: "", code: "MAS 317", title: "Media Law & Ethics", level: "200", semester: 2, creditUnit: 2 },
  { id: "C358", department: "Mass Communication", lecturerId: "", code: "MAS 324", title: "Advertising Campaign Planning", level: "200", semester: 2, creditUnit: 3 },
  { id: "C359", department: "Mass Communication", lecturerId: "", code: "MAS 318", title: "Communication Research Methods", level: "300", semester: 2, creditUnit: 3 },
  { id: "C360", department: "Mass Communication", lecturerId: "", code: "MAS 330", title: "Production Techniques in Advertising", level: "300", semester: 2, creditUnit: 3 },
  { id: "C361", department: "Mass Communication", lecturerId: "", code: "MAS 416", title: "PR/Advertising & High Information Technology", level: "300", semester: 2, creditUnit: 3 },
  { id: "C362", department: "Mass Communication", lecturerId: "", code: "MAS 418", title: "Public Relation Strategy Policies & Planning", level: "300", semester: 2, creditUnit: 3 },
  { id: "C363", department: "Mass Communication", lecturerId: "", code: "MAS 424", title: "Feature Writing", level: "300", semester: 2, creditUnit: 3 },
  { id: "C364", department: "Mass Communication", lecturerId: "", code: "MAS 430", title: "Ad. Organisation Management/Mgt of Ad Program", level: "300", semester: 2, creditUnit: 3 },

  // --- HRM Second Sem ---
  { id: "C365", department: "Human Resource Management", lecturerId: "", code: "HRM 102", title: "Introduction to Employment Relations", level: "100", semester: 2, creditUnit: 3 },
  { id: "C366", department: "Human Resource Management", lecturerId: "", code: "HRM 104", title: "Principles of Project Management", level: "100", semester: 2, creditUnit: 3 },
  { id: "C367", department: "Human Resource Management", lecturerId: "", code: "HRM 202", title: "Recruitment, Selection and Placement", level: "200", semester: 2, creditUnit: 2 },
  { id: "C368", department: "Human Resource Management", lecturerId: "", code: "HRM 212", title: "Business/Organisational Communication", level: "200", semester: 2, creditUnit: 3 },
  { id: "C369", department: "Human Resource Management", lecturerId: "", code: "HRM 312", title: "Human Resource Management II", level: "300", semester: 2, creditUnit: 3 },
  { id: "C370", department: "Human Resource Management", lecturerId: "", code: "HRM 314", title: "Leadership Training and Development", level: "300", semester: 2, creditUnit: 3 },
  { id: "C371", department: "Human Resource Management", lecturerId: "", code: "HRM 316", title: "Human Relations and Development", level: "300", semester: 2, creditUnit: 3 },
  { id: "C372", department: "Human Resource Management", lecturerId: "", code: "HRM 412", title: "Organisational Behaviour and Work", level: "300", semester: 2, creditUnit: 3 },
  { id: "C373", department: "Human Resource Management", lecturerId: "", code: "HRM 418", title: "Corporate Governance/Business Ethics", level: "300", semester: 2, creditUnit: 3 },

  // --- Int'l Relations & Diplomacy Second Sem ---
  { id: "C374", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 110", title: "Evolution of the Contemporary Int'l System", level: "100", semester: 2, creditUnit: 2 },
  { id: "C375", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 112", title: "The Environment and Sustainable Development", level: "100", semester: 2, creditUnit: 3 },
  { id: "C376", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 114", title: "Principles of Int'l Economic Relations", level: "100", semester: 2, creditUnit: 2 },
  { id: "C377", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 116", title: "Policy and Strategic Studies", level: "100", semester: 2, creditUnit: 3 },
  { id: "C378", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 118", title: "Intergovernmental Relations", level: "100", semester: 2, creditUnit: 3 },
  { id: "C379", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 112", title: "Political Analysis", level: "100", semester: 2, creditUnit: 3 },
  { id: "C380", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 114", title: "Nigerian Constitutional Development", level: "100", semester: 2, creditUnit: 3 },
  { id: "C381", department: "International Relations & Diplomacy", lecturerId: "", code: "POL 116", title: "Politics & Integration in Africa", level: "100", semester: 2, creditUnit: 3 },
  { id: "C382", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 218", title: "Nigeria Foreign Policy", level: "200", semester: 2, creditUnit: 3 },
  { id: "C383", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 220", title: "Contemporary Issues in World Politics", level: "200", semester: 2, creditUnit: 3 },
  { id: "C384", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 222", title: "Principles of International Law", level: "200", semester: 2, creditUnit: 3 },
  { id: "C385", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 224", title: "International Public Relations", level: "200", semester: 2, creditUnit: 3 },
  { id: "C386", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 226", title: "Structure of the International Society", level: "200", semester: 2, creditUnit: 3 },
  { id: "C387", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 240", title: "Foreign Policies of World Powers", level: "200", semester: 2, creditUnit: 2 },
  { id: "C388", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 244", title: "Third World and Dependency", level: "200", semester: 2, creditUnit: 3 },
  { id: "C389", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 312", title: "Multilateral Institutions in World Politics", level: "300", semester: 2, creditUnit: 3 },
  { id: "C390", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 316", title: "Economic History of Nigeria", level: "300", semester: 2, creditUnit: 3 },
  { id: "C391", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 320", title: "Contemporary History of the Middle East", level: "300", semester: 2, creditUnit: 2 },
  { id: "C392", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 324", title: "Contemporary Parliamentary Studies", level: "300", semester: 2, creditUnit: 3 },
  { id: "C393", department: "International Relations & Diplomacy", lecturerId: "", code: "IRL 328", title: "The United Nations and World Affairs", level: "300", semester: 2, creditUnit: 3 },
];

export const REGISTRATION_WORKFLOW_SUMMARY =
  "The registrar enrolls lecturers and admits students after the necessary requirements are met. Faculty deans then organize departments under their faculties and ensure students are assigned to the right departmental courses based on their field of study.";
