export type Subject = 'Mathematics' | 'Science' | 'Social Science' | 'English & Language' | 'All Subjects';
export type Month = 'October' | 'November' | 'December';
export type Status = 'not-started' | 'in-progress' | 'complete';
export type Rating = 'Base' | 'Mid' | 'Peak';

export type PlanDay = {
  day: number;
  date: string;
  month: Month;
  subject: Subject;
  chapter: string;
  target: string;
};

const d = (day: number, date: string, month: Month, subject: Subject, chapter: string, target: string): PlanDay => ({ day, date, month, subject, chapter, target });

export const blueprint: PlanDay[] = [
  d(1, 'Oct 1', 'October', 'Mathematics', 'Ch 1: Orienting Yourself – The Use of Coordinates (Ganita Manjara)', 'Complete NCERT exercises & concept notes'),
  d(2, 'Oct 2', 'October', 'Mathematics', 'Ch 1: Orienting Yourself (Practice)', 'Solve Level 1-3 competency questions & TYIQ practice'),
  d(3, 'Oct 3', 'October', 'Science', 'Ch 0: Exploration & Intro to Science', 'Overview of scientific inquiry & basics'),
  d(4, 'Oct 4', 'October', 'Science', 'Ch 1: The Cell – Fundamental Unit of Life', 'Cell organelle functions & diagram practice'),
  d(5, 'Oct 5', 'October', 'Social Science', 'Ch 1: Fundamental Concepts of Social Science', 'Read NCERT chapter & highlight core terms'),
  d(6, 'Oct 6', 'October', 'Social Science', 'Ch 1: Fundamental Concepts (Questions)', 'Answer key questions & rapid revision video'),
  d(7, 'Oct 7', 'October', 'Mathematics', 'Ch 2: Introduction to Linear Polynomials', 'Understand algebraic expressions & polynomial degree'),
  d(8, 'Oct 8', 'October', 'Mathematics', 'Ch 2: Linear Polynomials (Practice)', 'Solve polynomial factorization & competency problems'),
  d(9, 'Oct 9', 'October', 'Science', 'Ch 2: Tissues – Plant Tissues', 'Meristematic & permanent tissues study + diagrams'),
  d(10, 'Oct 10', 'October', 'Science', 'Ch 2: Tissues – Animal Tissues', 'Epithelial, connective, muscular & nervous tissue'),
  d(11, 'Oct 11', 'October', 'Social Science', "Ch 2: Shaping of Earth's Surface (Part 1)", 'Internal forces, plate tectonics & landforms'),
  d(12, 'Oct 12', 'October', 'Social Science', "Ch 2: Shaping of Earth's Surface (Part 2)", 'Weathering, erosion & rapid animated revision'),
  d(13, 'Oct 13', 'October', 'Mathematics', 'Ch 3: World of Numbers (Number System)', 'Real numbers, rationalization & laws of exponents'),
  d(14, 'Oct 14', 'October', 'Mathematics', 'Ch 3: World of Numbers (Practice)', 'Solve Level 2-3 competency questions'),
  d(15, 'Oct 15', 'October', 'Science', 'Ch 3: Exploring Mixtures & Pure Substances', 'Types of mixtures, solutions, suspensions & colloids'),
  d(16, 'Oct 16', 'October', 'Science', 'Ch 3: Separation Methods & Chemical Changes', 'Evaporation, chromatography, distillation practice'),
  d(17, 'Oct 17', 'October', 'Social Science', 'Ch 3: Human Society & Cultural Evolution', 'Core concepts & historical transitions'),
  d(18, 'Oct 18', 'October', 'Social Science', 'Ch 3: Human Society (Questions & Mapwork)', 'NCERT back-exercises & key map locations'),
  d(19, 'Oct 19', 'October', 'Mathematics', 'Ch 4: Lines and Angles (Ganita Manjara Part 1)', 'Parallel lines, transversal theorems & proofs'),
  d(20, 'Oct 20', 'October', 'Mathematics', 'Ch 4: Lines and Angles (Problem Solving)', 'Solve NCERT exemplar & competency questions'),
  d(21, 'Oct 21', 'October', 'Science', 'Ch 4: Motion – Speed, Velocity & Acceleration', 'Distance-time & velocity-time graphs practice'),
  d(22, 'Oct 22', 'October', 'Science', 'Ch 4: Equations of Motion', 'Derivations & numerical problem solving'),
  d(23, 'Oct 23', 'October', 'Social Science', 'Ch 4: Climate & Weather Systems', 'Factors influencing climate, monsoons & seasons'),
  d(24, 'Oct 24', 'October', 'Social Science', 'Ch 4: Climate & Weather (Questions)', 'Map work on monsoon winds & regional rainfall'),
  d(25, 'Oct 25', 'October', 'Mathematics', 'Ch 5: Triangles – Congruence Criteria', 'SAS, ASA, AAS, SSS, RHS theorems & proofs'),
  d(26, 'Oct 26', 'October', 'Mathematics', 'Ch 5: Triangles (Proofs & Numerical Practice)', 'Solve complex proof problems & competency questions'),
  d(27, 'Oct 27', 'October', 'Science', 'Ch 5: Force and Laws of Motion', "Newton's 1st, 2nd, 3rd laws & momentum numericals"),
  d(28, 'Oct 28', 'October', 'Science', 'Ch 5: Force and Laws of Motion (Practice)', 'Solve numericals on momentum conservation'),
  d(29, 'Oct 29', 'October', 'Social Science', 'Ch 5: Natural Vegetation & Wildlife', 'Forest types, biodiversity conservation & national parks'),
  d(30, 'Oct 30', 'October', 'Social Science', 'Ch 5: Natural Vegetation (Mapwork & Notes)', 'Identify wildlife sanctuaries on maps'),
  d(31, 'Oct 31', 'October', 'All Subjects', 'Monthly Comprehensive Review & Backlog Clear', 'Review all BASE-rated topics & update cheat sheets'),
  d(32, 'Nov 1', 'November', 'Social Science', 'Ch 1 (Part 2): What is Democracy? Why Democracy?', 'Core democratic principles, features & case studies'),
  d(33, 'Nov 2', 'November', 'Social Science', 'Ch 1 (Part 2): Democracy (Questions & Revision)', '10-minute rapid revision & NCERT questions'),
  d(34, 'Nov 3', 'November', 'Mathematics', 'Ch 6: Linear Equations in Two Variables', 'Standard form ax + by + c = 0 & graph plotting'),
  d(35, 'Nov 4', 'November', 'Mathematics', 'Ch 6: Linear Equations (Practice)', 'Word problems & competency Level 2-3 questions'),
  d(36, 'Nov 5', 'November', 'Science', 'Ch 6: Gravitation – Universal Law & Free Fall', "Kepler's laws, mass vs weight, g calculation"),
  d(37, 'Nov 6', 'November', 'Science', 'Ch 6: Gravitation (Thrust, Pressure & Buoyancy)', "Archimedes' principle & numerical problem solving"),
  d(38, 'Nov 7', 'November', 'Social Science', 'Ch 2 (Part 2): Constitutional Design', 'South African transition & Indian Constitution making'),
  d(39, 'Nov 8', 'November', 'Social Science', 'Ch 2 (Part 2): Constitutional Design (Preamble)', 'Preamble key terms & guiding philosophy'),
  d(40, 'Nov 9', 'November', 'Mathematics', 'Ch 7: Coordinate Geometry Advanced Applications', 'Plotting points, quadrants & geometric shapes'),
  d(41, 'Nov 10', 'November', 'Mathematics', 'Ch 7: Coordinate Geometry (Competency)', 'Solve graph-based competency meter problems'),
  d(42, 'Nov 11', 'November', 'Science', 'Ch 7: Work and Energy – Work Done & Kinetic Energy', 'Formula W = Fs, kinetic & potential energy derivations'),
  d(43, 'Nov 12', 'November', 'Science', 'Ch 7: Conservation of Energy & Power', 'Law of conservation of energy & commercial units'),
  d(44, 'Nov 13', 'November', 'Social Science', 'Ch 3 (Part 2): Electoral Politics', "Why elections, voters' list & election procedure"),
  d(45, 'Nov 14', 'November', 'Social Science', 'Ch 3 (Part 2): Electoral Politics (Code of Conduct)', 'Model code of conduct & democratic election criteria'),
  d(46, 'Nov 15', 'November', 'Mathematics', "Ch 8: Heron's Formula", 'Area of triangle using s(s-a)(s-b)(s-c)'),
  d(47, 'Nov 16', 'November', 'Mathematics', "Ch 8: Heron's Formula (Quadrilaterals & Applications)", "Area of parks/polygons using Heron's formula"),
  d(48, 'Nov 17', 'November', 'Science', 'Ch 8: Sound – Production & Propagation', 'Longitudinal vs transverse waves, wave velocity v=fλ'),
  d(49, 'Nov 18', 'November', 'Science', 'Ch 8: Sound – Reflection & Human Ear Structure', 'Echo, SONAR, reverberation & ear diagram'),
  d(50, 'Nov 19', 'November', 'Social Science', 'Ch 4 (Part 2): Working of Institutions', 'Parliament, Prime Minister, Cabinet & Judiciary'),
  d(51, 'Nov 20', 'November', 'Social Science', 'Ch 4 (Part 2): Institutions (Judiciary & Rights)', 'Supreme Court powers & judicial review'),
  d(52, 'Nov 21', 'November', 'Mathematics', 'Ch 9: Circles – Basic Terms & Chord Properties', 'Equal chords subtend equal angles at center'),
  d(53, 'Nov 22', 'November', 'Mathematics', 'Ch 9: Circles – Cyclic Quadrilaterals & Theorems', 'Perpendicular from center & cyclic properties'),
  d(54, 'Nov 23', 'November', 'Science', 'Ch 9: Improvement in Food Resources (Crop Yield)', 'Crop variety improvement & nutrient management'),
  d(55, 'Nov 24', 'November', 'Science', 'Ch 9: Food Resources (Animal Husbandry)', 'Cattle farming, poultry, apiculture & fisheries'),
  d(56, 'Nov 25', 'November', 'Social Science', 'Ch 5 (Part 2): Democratic Rights', 'Rights in democracy, Fundamental Rights in India'),
  d(57, 'Nov 26', 'November', 'Social Science', 'Ch 5 (Part 2): Democratic Rights (Case Studies)', 'Guantanamo Bay, Kosovo & PIL mechanism'),
  d(58, 'Nov 27', 'November', 'Mathematics', 'Ch 10: Statistics – Grouped Frequency & Bar Graphs', 'Constructing bar graphs, histograms & frequency polygons'),
  d(59, 'Nov 28', 'November', 'Mathematics', 'Ch 10: Statistics (Practice)', 'Interpretation of data & competency questions'),
  d(60, 'Nov 29', 'November', 'All Subjects', '75% Syllabus Milestone Check & Backlog Clear', 'Verify completion of 3/4th syllabus across subjects'),
  d(61, 'Dec 1', 'December', 'Social Science', 'Ch 2 (Part 2 NCERT): Life on Earth', 'Biosphere components, ecosystems & ecological balance'),
  d(62, 'Dec 2', 'December', 'Social Science', 'Ch 2 (Part 2): Life on Earth (Questions)', 'NCERT exercises & 1-page micro-scribe cheat sheet'),
  d(63, 'Dec 3', 'December', 'Science', 'Ch 9: Atoms and Molecules (Part 1)', "Laws of chemical combination & Dalton's atomic theory"),
  d(64, 'Dec 4', 'December', 'Science', 'Ch 9: Atoms and Molecules (Part 2)', 'Atomic mass, molecular mass & writing chemical formulas'),
  d(65, 'Dec 5', 'December', 'Mathematics', 'Ch 12: Quadrilaterals (Ganita Manjara Part 2)', 'Angle sum property & properties of parallelograms'),
  d(66, 'Dec 6', 'December', 'Mathematics', 'Ch 12: Quadrilaterals (Mid-point Theorem)', 'Mid-point theorem proof & complex numericals'),
  d(67, 'Dec 7', 'December', 'Social Science', 'Ch 3 (Part 2 NCERT): Economic Systems & Resources', 'People as Resource, human capital & economic activities'),
  d(68, 'Dec 8', 'December', 'Social Science', 'Ch 3 (Part 2): Economic Systems (Unemployment)', 'Types of unemployment & government schemes'),
  d(69, 'Dec 9', 'December', 'Mathematics', 'Ch 13: Surface Areas and Volumes – Cones & Spheres', 'Surface area & volume formulas for cone, sphere, hemisphere'),
  d(70, 'Dec 10', 'December', 'Mathematics', 'Ch 13: Surface Areas and Volumes (Practice)', 'Solve real-life word problems & competency questions'),
  d(71, 'Dec 11', 'December', 'Science', 'Ch 10: Structure of the Atom (Thomson & Rutherford)', "Subatomic particles, Thomson's & Rutherford's model"),
  d(72, 'Dec 12', 'December', 'Science', 'Ch 10: Structure of the Atom (Bohr Model & Valency)', "Bohr's model, electronic configuration, valency & isotopes"),
  d(73, 'Dec 13', 'December', 'Social Science', 'Ch 4 (Part 2 NCERT): Poverty as a Challenge', 'Poverty line, vulnerability, anti-poverty measures'),
  d(74, 'Dec 14', 'December', 'Social Science', 'Ch 4 (Part 2): Poverty (Global Scenarios)', 'Inter-state disparities & global poverty trends'),
  d(75, 'Dec 15', 'December', 'Mathematics', 'Ch 14: One Line & Two Variables (Ganita Manjara Part 2)', 'Linear equations, geometric representations & solutions'),
  d(76, 'Dec 16', 'December', 'Mathematics', 'Ch 14: Linear Equations (Competency Practice)', 'Solve Level 3 competency questions'),
  d(77, 'Dec 17', 'December', 'Science', 'Ch 11: Energy Transformations & Advanced Numericals', 'Mechanical energy conservation & power calculations'),
  d(78, 'Dec 18', 'December', 'Science', 'Ch 11: Science Comprehensive Formula Review', 'Formula cheat sheet creation for all Science chapters'),
  d(79, 'Dec 19', 'December', 'Social Science', 'Ch 5 (Part 2 NCERT): Food Security in India', 'PDS system, buffer stock & role of cooperatives'),
  d(80, 'Dec 20', 'December', 'Social Science', 'Ch 5 (Part 2): Earth as a System (Part 1)', 'Lithosphere, hydrosphere, atmosphere interactions'),
  d(81, 'Dec 21', 'December', 'Social Science', 'Ch 5 (Part 2): Earth as a System (Part 2)', 'System dynamics & environmental sustainability'),
  d(82, 'Dec 22', 'December', 'Mathematics', 'Ganita Manjara Part 2 Comprehensive Math Practice', 'Mixed sample paper solving & formula sheet review'),
  d(83, 'Dec 23', 'December', 'Mathematics', 'Math Competency Level 1, 2, 3 Full Test', 'Timed test on competency meter questions'),
  d(84, 'Dec 24', 'December', 'Science', 'Science Full Length Competency & Diagram Test', 'Diagram labeling & competency question paper solving'),
  d(85, 'Dec 25', 'December', 'Social Science', 'Social Science Full Length Mapwork & Question Test', 'Complete mapwork & long answer practice'),
  d(86, 'Dec 26', 'December', 'English & Language', 'English Reading, Writing & Grammar Practice', 'Unseen passages, formal letters & grammar rules'),
  d(87, 'Dec 27', 'December', 'English & Language', 'English Literature Short & Long Answer Practice', 'Extract-based questions & character sketches'),
  d(88, 'Dec 28', 'December', 'All Subjects', 'Grand Revision: Weak Area Re-Revision (Base Topics)', 'Re-visit all BASE-rated chapters across 3 subjects'),
  d(89, 'Dec 29', 'December', 'All Subjects', 'Full Mock Examination – Paper 1 (Math & Science)', 'Simulated exam conditions practice'),
  d(90, 'Dec 30', 'December', 'All Subjects', '100% SYLLABUS COMPLETED! Final Blueprint Victory', 'Final score sheet audit – 100% Exam Ready!'),
];

export const ratingDefinitions: Record<Rating, string> = {
  Base: 'Weak understanding, requires urgent re-revision',
  Mid: 'Moderate clarity, requires problem solving',
  Peak: 'Full mastery & exam readiness',
};

export const milestones = [
  { day: 31, title: 'Monthly Comprehensive Review & Backlog Clear', copy: 'Review all BASE-rated topics & update cheat sheets' },
  { day: 60, title: '75% Syllabus Milestone Check & Backlog Clear', copy: 'Verify completion of 3/4th syllabus across subjects' },
  { day: 90, title: '100% SYLLABUS COMPLETED! Final Blueprint Victory', copy: 'Final score sheet audit – 100% Exam Ready!' },
];

export const checklistItems = [
  '100% Syllabus Completed: All NCERT chapters across Math, Science, and Social Science completed.',
  'Competency Questions Practiced: CBSE Level 1, 2, and 3 competency questions solved for each topic.',
  '1-Page Micro-Scribe Cheat Sheets Ready: Summary cheat sheets created for quick last-minute revision.',
  "Base Topics Conquered: Every chapter initially rated 'Base' re-revised to 'Mid' or 'Peak'.",
];

export const months: Month[] = ['October', 'November', 'December'];