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
      "Medical Laboratory Science",
      "Pharmacy",
    ],
  },
  {
    id: "F002",
    name: "Social Science",
    dean: "Mr. Eze",
    departments: ["Law", "Political Science"],
  },
  {
    id: "F003",
    name: "Humanities",
    dean: "Mr. Daniel",
    departments: ["Mass Communication", "International Relations"],
  },
  {
    id: "F004",
    name: "Business Administration",
    dean: "Mr. James",
    departments: ["Human Resource Management"],
  },
  {
    id: "F005",
    name: "French Language",
    dean: "Mr. Odonou",
    departments: [],
  },
];

export const INSTITUTION_LECTURERS: InstitutionLecturer[] = [
  {
    id: "LEC001",
    name: "Mr. Azino",
    department: "Computer Science",
    staffId: "LEC/001",
    username: "azino",
    email: "azino@univ.edu",
  },
  {
    id: "LEC002",
    name: "Mr. Ola",
    department: "Computer Science",
    staffId: "LEC/002",
    username: "ola",
    email: "ola@univ.edu",
  },
  {
    id: "LEC003",
    name: "Mr. Odun",
    department: "Computer Science",
    staffId: "LEC/003",
    username: "odun",
    email: "odun@univ.edu",
  },
  {
    id: "LEC004",
    name: "Mr. Victor",
    department: "Bioscience",
    staffId: "LEC/004",
    username: "victor",
    email: "victor@univ.edu",
  },
  {
    id: "LEC005",
    name: "Mr. Simdi",
    department: "Medical Laboratory Science",
    staffId: "LEC/005",
    username: "simdi",
    email: "simdi@univ.edu",
  },
  {
    id: "LEC006",
    name: "Dr. Mojover",
    department: "Pharmacy",
    staffId: "LEC/006",
    username: "mojover",
    email: "mojover@univ.edu",
  },
  {
    id: "LEC007",
    name: "Mrs. Katayama",
    department: "Medical Laboratory Science",
    staffId: "LEC/007",
    username: "katayama",
    email: "katayama@univ.edu",
  },
  {
    id: "LEC008",
    name: "Mrs. Mary",
    department: "Pharmacy",
    staffId: "LEC/008",
    username: "mary",
    email: "mary@univ.edu",
  },
  {
    id: "LEC009",
    name: "Mr. Odunegbu",
    department: "Law",
    staffId: "LEC/009",
    username: "odunegbu",
    email: "odunegbu@univ.edu",
  },
  {
    id: "LEC010",
    name: "Mr. Austin",
    department: "Political Science",
    staffId: "LEC/010",
    username: "austin",
    email: "austin@univ.edu",
  },
  {
    id: "LEC011",
    name: "Mrs. Ada",
    department: "Mass Communication",
    staffId: "LEC/011",
    username: "ada",
    email: "ada@univ.edu",
  },
];

// Some of the supplied course department ids conflict with the course titles.
// These department assignments follow the academic field implied by the course
// titles so student-facing course allocation remains coherent.
export const INSTITUTION_COURSES: InstitutionCourse[] = [
  { id: "C001", department: "Computer Science", lecturerId: "LEC001", code: "COMP101", title: "Introduction to Computer Science", level: "100", semester: 2, creditUnit: 3 },
  { id: "C002", department: "Computer Science", lecturerId: "LEC001", code: "COMP115", title: "Computer Programming", level: "100", semester: 2, creditUnit: 4 },
  { id: "C003", department: "Computer Science", lecturerId: "LEC001", code: "CMP111", title: "Digital Logic Design", level: "200", semester: 1, creditUnit: 3 },
  { id: "C004", department: "Computer Science", lecturerId: "LEC001", code: "STA112", title: "Statistical Calculus", level: "200", semester: 1, creditUnit: 3 },
  { id: "C005", department: "Computer Science", lecturerId: "LEC002", code: "CMP211", title: "Data Structures and Algorithms", level: "200", semester: 2, creditUnit: 3 },
  { id: "C006", department: "Computer Science", lecturerId: "LEC002", code: "CMS313", title: "Software Engineering", level: "300", semester: 1, creditUnit: 5 },
  { id: "C007", department: "Computer Science", lecturerId: "LEC002", code: "CMS512", title: "Artificial Intelligence", level: "300", semester: 1, creditUnit: 5 },
  { id: "C008", department: "Computer Science", lecturerId: "LEC003", code: "CMP513", title: "Network and Network Configuration", level: "300", semester: 2, creditUnit: 4 },
  { id: "C009", department: "Computer Science", lecturerId: "LEC003", code: "CMP300", title: "Computer Graphics", level: "300", semester: 2, creditUnit: 5 },
  { id: "C010", department: "Bioscience", lecturerId: "LEC004", code: "BIO116", title: "Genetics", level: "200", semester: 1, creditUnit: 4 },
  { id: "C011", department: "Bioscience", lecturerId: "LEC004", code: "CHM101", title: "Organic Chemistry", level: "200", semester: 1, creditUnit: 3 },
  { id: "C012", department: "Bioscience", lecturerId: "LEC004", code: "BCH112", title: "Genetics II", level: "300", semester: 2, creditUnit: 4 },
  { id: "C013", department: "Bioscience", lecturerId: "LEC004", code: "ACB104", title: "Applied Biology", level: "300", semester: 1, creditUnit: 5 },
  { id: "C014", department: "Bioscience", lecturerId: "LEC004", code: "ACT101", title: "Accidents", level: "400", semester: 2, creditUnit: 5 },
  { id: "C015", department: "Medical Laboratory Science", lecturerId: "LEC005", code: "HAT234", title: "Human Anatomy", level: "200", semester: 1, creditUnit: 4 },
  { id: "C016", department: "Medical Laboratory Science", lecturerId: "LEC005", code: "CMP151", title: "Human Embryology", level: "200", semester: 1, creditUnit: 5 },
  { id: "C017", department: "Medical Laboratory Science", lecturerId: "LEC005", code: "HPO112", title: "Human Physiology", level: "300", semester: 1, creditUnit: 0 },
  { id: "C018", department: "Medical Laboratory Science", lecturerId: "LEC005", code: "BTO324", title: "Blood Transfusion", level: "400", semester: 2, creditUnit: 5 },
  { id: "C019", department: "Pharmacy", lecturerId: "LEC006", code: "PCM", title: "Pharmacology", level: "200", semester: 2, creditUnit: 4 },
  { id: "C020", department: "Pharmacy", lecturerId: "LEC006", code: "BPC114", title: "Biopharmaceutics", level: "300", semester: 1, creditUnit: 3 },
  { id: "C021", department: "Pharmacy", lecturerId: "LEC006", code: "PLE236", title: "Pharmacy Law and Ethics", level: "400", semester: 2, creditUnit: 3 },
  { id: "C022", department: "Pharmacy", lecturerId: "LEC006", code: "PHB367", title: "Public Health Pharmacy", level: "400", semester: 2, creditUnit: 5 },
  { id: "C023", department: "Mass Communication", lecturerId: "LEC007", code: "COM101", title: "Introduction to Mass Communication", level: "200", semester: 1, creditUnit: 3 },
  { id: "C024", department: "Mass Communication", lecturerId: "LEC007", code: "MFC102", title: "Media Communication", level: "200", semester: 2, creditUnit: 3 },
  { id: "C025", department: "Mass Communication", lecturerId: "LEC007", code: "MAC103", title: "Writing for the Mass Media", level: "300", semester: 2, creditUnit: 5 },
  { id: "C026", department: "International Relations", lecturerId: "LEC008", code: "IRS101", title: "Introduction to International Relations", level: "200", semester: 1, creditUnit: 4 },
  { id: "C027", department: "International Relations", lecturerId: "LEC008", code: "HIS102", title: "History", level: "200", semester: 2, creditUnit: 3 },
  { id: "C028", department: "International Relations", lecturerId: "LEC008", code: "IRS202", title: "Comparative Politics", level: "300", semester: 1, creditUnit: 4 },
  { id: "C029", department: "International Relations", lecturerId: "LEC008", code: "LLB322", title: "International Law", level: "300", semester: 2, creditUnit: 5 },
  { id: "C030", department: "Human Resource Management", lecturerId: "LEC009", code: "OBL112", title: "Organizational Behaviour", level: "200", semester: 2, creditUnit: 4 },
  { id: "C031", department: "Human Resource Management", lecturerId: "LEC009", code: "LLT230", title: "Labour Law", level: "300", semester: 1, creditUnit: 5 },
  { id: "C032", department: "Human Resource Management", lecturerId: "LEC009", code: "ERK312", title: "Employment Relations", level: "300", semester: 2, creditUnit: 5 },
  { id: "C033", department: "Human Resource Management", lecturerId: "LEC009", code: "SHM346", title: "Strategic Human Resource Management", level: "300", semester: 2, creditUnit: 4 },
];

export const REGISTRATION_WORKFLOW_SUMMARY =
  "The registrar enrolls lecturers and admits students after the necessary requirements are met. Faculty deans then organize departments under their faculties and ensure students are assigned to the right departmental courses based on their field of study.";
