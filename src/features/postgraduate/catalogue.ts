import type { LayoutUser } from "@/components/layout/types";
import type { PostgraduateProgramme } from "@/types/database.types";

type PostgraduateProgrammeRow = PostgraduateProgramme;

export type PostgraduateProgrammeOption = {
  slug: string;
  label: string;
};

export type PublicPostgraduateListItem = {
  slug: string;
  title: string;
  code: string;
  mode: string;
  duration: string;
  fee: string;
  deadline: string;
  status: "Open" | "Closing Soon";
};

export type PublicPostgraduateDetail = {
  slug: string;
  code: string;
  title: string;
  status: "Open" | "Closing Soon";
  deadline: string;
  startDate: string;
  mode: string;
  duration: string;
  fee: string;
  overview: string;
  outcomes: string[];
  eligibility: string;
  documents: string[];
  institution: string | null;
  awardingBody: string | null;
  qualifications: string[];
  pgdDuration: string | null;
  mscDuration: string | null;
  programmeObjectives: string[];
  coreModules: string[];
  pgdAdmissionRequirements: string | null;
  mscAdmissionRequirements: string | null;
  registrationInfo: string | null;
  careerOutcomes: string[];
  keywords: string[];
};

export type AdminPostgraduateListItem = {
  id: string;
  title: string;
  slug: string;
  code: string;
  status: PostgraduateProgrammeRow["status"];
  mode: string;
  deadline: string;
  fees: number;
  canDelete: boolean;
};

export type AdminPostgraduateDetail = {
  programme: PostgraduateProgrammeRow;
  canDelete: boolean;
};

const FALLBACK_PROGRAMMES: PostgraduateProgrammeRow[] = [
  {
    id: "fallback-pg-1",
    title: "Climate Change & Sustainable Food Security",
    slug: "climate-change-sustainable-food-security",
    code: "CCFS 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus with field-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "This programme provides rigorous, interdisciplinary training at the intersection of climate science and food systems. Students examine how shifting climatic patterns, extreme weather events, and environmental degradation threaten agricultural productivity and rural livelihoods across Sub-Saharan Africa and beyond.",
    outcomes: ["Understand the mechanisms and projected impacts of climate change on agricultural systems and food supply chains.", "Develop and evaluate climate adaptation and mitigation strategies tailored to smallholder and commercial farming contexts.", "Apply quantitative and qualitative research methods to assess food security vulnerabilities at community, national, and regional scales.", "Design and implement resilient food system interventions informed by international frameworks such as the Paris Agreement and the Sustainable Development Goals.", "Engage constructively with policy processes, development agencies, and rural stakeholders on climate-food nexus issues."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Understand the mechanisms and projected impacts of climate change on agricultural systems and food supply chains.", "Develop and evaluate climate adaptation and mitigation strategies tailored to smallholder and commercial farming contexts.", "Apply quantitative and qualitative research methods to assess food security vulnerabilities at community, national, and regional scales.", "Design and implement resilient food system interventions informed by international frameworks such as the Paris Agreement and the Sustainable Development Goals.", "Engage constructively with policy processes, development agencies, and rural stakeholders on climate-food nexus issues."],
    core_modules: ["Foundations of Climate Science and Agricultural Systems", "Food Security Frameworks: Concepts, Measurement, and Policy", "Climate-Smart Agriculture and Agroecology", "Remote Sensing and GIS for Food Security Analysis", "Climate Finance and Green Economy", "Research Methods in Agricultural and Environmental Sciences", "Dissertation / Applied Research Project (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Agriculture, Environmental Science, Geography, Economics, or a related discipline; or relevant professional experience.",
    msc_admission_requirements: "A PGD in a related area or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal. Prospective students are advised to visit the University of Jos official website for application deadlines, portal access, and required documentation.",
    career_outcomes: ["Climate and food security analyst in government ministries and international organisations", "Programme officer in NGOs, UN agencies (FAO, WFP, UNDP), and development banks", "Agricultural policy researcher and consultant", "Academic/researcher in universities and think tanks", "Environmental impact assessment specialist"],
    keywords: ["climate change", "food security", "sustainable agriculture", "adaptation", "policy"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-2",
    title: "Disaster Risk Management in Agriculture & Food Security",
    slug: "disaster-risk-management-agriculture-food-security",
    code: "DRM 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus with field-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Disasters, both natural and human-induced, represent one of the gravest threats to agricultural output and household food security in Africa. This programme equips students with the theoretical foundations and practical competencies to assess, reduce, and manage disaster risks within agricultural and food system contexts.",
    outcomes: ["Analyse the causes, dynamics, and consequences of agricultural and food-related disasters including droughts, floods, pest outbreaks, and conflict-induced crises.", "Apply the Sendai Framework for Disaster Risk Reduction and related international protocols to agricultural and food security planning.", "Develop community-based disaster risk reduction strategies with particular attention to vulnerable and marginalised populations.", "Use geospatial tools, early warning systems, and data analytics for disaster monitoring and risk forecasting.", "Design post-disaster recovery and livelihood restoration programmes for farming communities."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Analyse the causes, dynamics, and consequences of agricultural and food-related disasters including droughts, floods, pest outbreaks, and conflict-induced crises.", "Apply the Sendai Framework for Disaster Risk Reduction and related international protocols to agricultural and food security planning.", "Develop community-based disaster risk reduction strategies with particular attention to vulnerable and marginalised populations.", "Use geospatial tools, early warning systems, and data analytics for disaster monitoring and risk forecasting.", "Design post-disaster recovery and livelihood restoration programmes for farming communities."],
    core_modules: ["Introduction to Disaster Risk Reduction (DRR) and Management", "Hazard, Vulnerability, and Capacity Assessment in Agriculture", "Early Warning Systems and Agricultural Intelligence", "Humanitarian Logistics and Emergency Food Response", "Climate Extremes and Agricultural Disaster Linkages", "Policy and Governance for Agricultural DRM", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Agriculture, Geography, Environmental Management, Social Sciences, or a related discipline.",
    msc_admission_requirements: "A PGD in a related area or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Disaster risk reduction officer in government emergency management agencies", "Humanitarian aid coordinator with WFP, ICRC, and related organisations", "Resilience programme manager in NGOs and development institutions", "Agricultural risk analyst for insurance companies and development banks", "Researcher in disaster studies, climate adaptation, and food systems"],
    keywords: ["disaster risk", "food security", "DRR", "humanitarian", "Sendai Framework"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-3",
    title: "Gender, Agriculture & Rural Development",
    slug: "gender-agriculture-rural-development",
    code: "GAR 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus with field-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Women constitute the majority of smallholder farmers across Sub-Saharan Africa yet continue to face profound inequalities in access to land, credit, inputs, extension services, and decision-making power. This programme critically examines the gendered dimensions of agricultural systems and rural development.",
    outcomes: ["Critically analyse gender dynamics within agricultural value chains, rural institutions, and food systems.", "Apply gender analysis frameworks and tools to programme design, monitoring, and evaluation in agricultural and rural development contexts.", "Examine policy and legal frameworks governing women's land rights, access to finance, and market participation in Nigeria and across Africa.", "Engage with rural communities using participatory approaches to co-design gender-transformative interventions.", "Contribute to evidence-based gender mainstreaming in agricultural development practice."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD-GAR)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Critically analyse gender dynamics within agricultural value chains, rural institutions, and food systems.", "Apply gender analysis frameworks and tools to programme design, monitoring, and evaluation in agricultural and rural development contexts.", "Examine policy and legal frameworks governing women's land rights, access to finance, and market participation in Nigeria and across Africa.", "Engage with rural communities using participatory approaches to co-design gender-transformative interventions.", "Contribute to evidence-based gender mainstreaming in agricultural development practice."],
    core_modules: ["Gender Theory and Development Practice", "Women in Agriculture: Roles, Constraints, and Opportunities", "Rural Sociology and Community Development", "Gender-Responsive Policy Analysis", "Participatory Research Methods", "Agricultural Finance and Women's Economic Empowerment", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Social Sciences, Agriculture, Development Studies, or a related discipline.",
    msc_admission_requirements: "A PGD-GAR or a relevant Bachelor's degree with research experience; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Gender specialist in development organisations, NGOs, and UN agencies", "Agricultural extension officer with a gender mandate", "Policy analyst and researcher in women, land, and food security", "Programme coordinator for rural development and livelihood projects", "Academic and researcher in gender studies and development economics"],
    keywords: ["gender", "rural development", "women empowerment", "agriculture", "participatory research"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-4",
    title: "Agricultural Economics and Food Systems Innovation",
    slug: "agricultural-economics-food-systems-innovation",
    code: "AEF 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time",
    duration: "18 months to two years (full-time); up to three years (part-time)",
    fees: 25000,
    overview: "This advanced postgraduate programme bridges economic theory and practical food systems analysis to address the complex challenges of agricultural development in Africa.",
    outcomes: ["Apply microeconomic and macroeconomic theories to the analysis of agricultural markets, firms, and households.", "Use advanced econometric methods and data analytics tools to evaluate agricultural policies, programmes, and market interventions.", "Analyse food value chains from production through processing and retail to identify efficiency gaps and innovation opportunities.", "Examine trade policy, food price dynamics, and the political economy of food systems governance.", "Conduct original empirical research contributing to the evidence base for agricultural transformation in Nigeria and Africa."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Master of Science (M.Sc)"],
    pgd_duration: null,
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Apply microeconomic and macroeconomic theories to the analysis of agricultural markets, firms, and households.", "Use advanced econometric methods and data analytics tools to evaluate agricultural policies, programmes, and market interventions.", "Analyse food value chains from production through processing and retail to identify efficiency gaps and innovation opportunities.", "Examine trade policy, food price dynamics, and the political economy of food systems governance.", "Conduct original empirical research contributing to the evidence base for agricultural transformation in Nigeria and Africa."],
    core_modules: ["Agricultural Production Economics and Farm Management", "Food Systems Analysis and Value Chain Development", "Advanced Agricultural Policy and Trade", "Quantitative Methods and Econometrics for Agricultural Research", "Agricultural Finance and Rural Credit Markets", "Innovation Economics and Agri-Tech Adoption", "Research Methods and Dissertation"],
    pgd_admission_requirements: null,
    msc_admission_requirements: "A Bachelor's degree (minimum Second Class Lower) in Economics, Agricultural Economics, Statistics, or a related quantitative discipline. Applicants with relevant professional experience in agricultural or food system roles may also be considered.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Agricultural economist in government, international organisations, and development banks", "Food systems analyst and policy consultant", "Research fellow in agricultural economics institutions", "Market analyst and value chain development specialist in the agri-food private sector", "Academic researcher and lecturer in economics and agricultural sciences"],
    keywords: ["agricultural economics", "food systems", "econometrics", "policy", "value chains"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-5",
    title: "Master of Business Administration (MBA) in Agribusiness",
    slug: "mba-agribusiness",
    code: "MBA 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time",
    duration: "Typically 18 months to two years (full-time); part-time option available",
    fees: 25000,
    overview: "The MBA in Agribusiness prepares future leaders for the business of agriculture and food. Combining a rigorous foundation in management disciplines with specialised modules in agricultural value chains, agri-finance, and food enterprise development.",
    outcomes: ["Develop advanced managerial and leadership competencies applicable to agribusiness enterprises and food industry organisations.", "Analyse agribusiness value chains and identify commercial opportunities for productivity enhancement, market access, and profitability.", "Apply financial management, investment analysis, and risk assessment tools to agribusiness contexts.", "Design, evaluate, and implement strategies for agri-enterprise growth, including digital transformation and market expansion.", "Demonstrate ethical, inclusive, and sustainable business leadership within the food and agricultural sector."],
    eligibility: "Minimum BSc (Second Class Lower) in any discipline.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports", "Minimum two years of relevant work experience"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Master of Business Administration (MBA)"],
    pgd_duration: null,
    msc_duration: "Typically 18 months to two years (full-time); part-time option available",
    programme_objectives: ["Develop advanced managerial and leadership competencies applicable to agribusiness enterprises and food industry organisations.", "Analyse agribusiness value chains and identify commercial opportunities for productivity enhancement, market access, and profitability.", "Apply financial management, investment analysis, and risk assessment tools to agribusiness contexts.", "Design, evaluate, and implement strategies for agri-enterprise growth, including digital transformation and market expansion.", "Demonstrate ethical, inclusive, and sustainable business leadership within the food and agricultural sector."],
    core_modules: ["Foundations of Agribusiness Management", "Financial Management for Agricultural Enterprises", "Agricultural Marketing and Supply Chain Management", "Agri-Tech and Digital Transformation in Food Systems", "Entrepreneurship and New Venture Creation in Agriculture", "Strategic Management and Business Planning", "Agribusiness Project (Applied Capstone)"],
    pgd_admission_requirements: null,
    msc_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in any discipline. A minimum of two years of relevant work experience is strongly preferred. GMAT or equivalent aptitude assessment may be required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Agribusiness entrepreneur and food enterprise owner", "Senior manager in food processing, agro-industry, and agricultural supply chains", "Agricultural investment analyst in commercial banks and development finance institutions", "Business development officer in agri-cooperatives and farmer organisations", "Agri-sector consultant and strategic advisor"],
    keywords: ["MBA", "agribusiness", "food enterprise", "management", "entrepreneurship"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-6",
    title: "Agricultural Communication Innovations",
    slug: "agricultural-communication-innovations",
    code: "ACI 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Effective communication is a linchpin of agricultural transformation. This programme explores the theory and practice of agricultural communication, extension services, and knowledge management.",
    outcomes: ["Analyse communication theories and their application in agricultural knowledge transfer and behaviour change.", "Design and implement evidence-based agricultural extension programmes using traditional and digital media.", "Evaluate the effectiveness of communication campaigns in promoting adoption of improved agricultural technologies.", "Use digital tools, mobile platforms, and social media strategically for agricultural outreach and rural community engagement.", "Develop science communication skills to translate complex research findings for diverse audiences."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (M.Sc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Analyse communication theories and their application in agricultural knowledge transfer and behaviour change.", "Design and implement evidence-based agricultural extension programmes using traditional and digital media.", "Evaluate the effectiveness of communication campaigns in promoting adoption of improved agricultural technologies.", "Use digital tools, mobile platforms, and social media strategically for agricultural outreach and rural community engagement.", "Develop science communication skills to translate complex research findings for diverse audiences."],
    core_modules: ["Communication Theory and Agricultural Knowledge Systems", "Agricultural Extension and Rural Advisory Services", "Digital Communication and Social Media for Agriculture", "Radio and Community Broadcasting for Smallholder Farmers", "Science Communication and Science Journalism", "Behaviour Change Communication in Food Security", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Mass Communication, Agriculture, Extension, or a related field.",
    msc_admission_requirements: "A PGD in a related area or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Agricultural communication and extension specialist", "Knowledge management officer in research institutes and development organisations", "Digital media producer for agricultural campaigns and outreach", "Science communicator and agricultural journalist", "Programme officer in organisations implementing farmer advisory and outreach services"],
    keywords: ["agricultural communication", "extension", "digital media", "knowledge transfer", "outreach"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-7",
    title: "Livestock Science and Climate Resilience",
    slug: "livestock-science-climate-resilience",
    code: "LSC 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus with field-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Livestock production systems across Africa are under mounting pressure from climate variability, land degradation, disease outbreaks, and market uncertainties. This programme equips students with advanced knowledge of livestock physiology, rangeland ecology, and climate adaptation strategies.",
    outcomes: ["Understand the physiological, nutritional, and genetic determinants of livestock productivity under variable climatic conditions.", "Assess the vulnerability of livestock systems to climate change impacts including heat stress, drought, and shifting disease burdens.", "Apply rangeland management, silvopastoral, and agro-pastoral strategies to enhance climate resilience in livestock systems.", "Analyse livestock-climate policy frameworks and their implications for food security and rural livelihoods.", "Conduct applied research on climate adaptation strategies for cattle, goats, sheep, and poultry production systems."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Understand the physiological, nutritional, and genetic determinants of livestock productivity under variable climatic conditions.", "Assess the vulnerability of livestock systems to climate change impacts including heat stress, drought, and shifting disease burdens.", "Apply rangeland management, silvopastoral, and agro-pastoral strategies to enhance climate resilience in livestock systems.", "Analyse livestock-climate policy frameworks and their implications for food security and rural livelihoods.", "Conduct applied research on climate adaptation strategies for cattle, goats, sheep, and poultry production systems."],
    core_modules: ["Livestock Physiology and Nutrition", "Climate Change Impacts on Livestock Systems", "Rangeland and Pasture Management", "Climate-Smart Livestock Production Technologies", "Livestock Disease Epidemiology and Climate Linkages", "Livestock Policy, Markets, and Value Chains", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Animal Science, Veterinary Medicine, Agriculture, or a related discipline.",
    msc_admission_requirements: "A PGD in a related area or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Livestock production and climate adaptation specialist", "Range and pasture management officer", "Animal health and productivity researcher", "Agri-policy analyst specialising in livestock systems", "Programme specialist in FAO, ILRI, and international livestock development organisations"],
    keywords: ["livestock", "climate resilience", "animal science", "rangeland", "food security"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-8",
    title: "Livestock Production and Animal Health",
    slug: "livestock-production-animal-health",
    code: "LPA 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus and laboratory-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "This programme provides comprehensive training in the science of livestock production and animal health management, with an emphasis on improving productivity, reducing disease burden, and ensuring food safety across the livestock value chain.",
    outcomes: ["Apply advanced knowledge of animal nutrition, genetics, and reproduction to improve the productivity of livestock enterprises.", "Diagnose, prevent, and control major livestock diseases affecting cattle, small ruminants, and poultry in Nigeria and the West African region.", "Implement biosecurity protocols and food safety standards across livestock production and processing systems.", "Use the One Health framework to address zoonotic diseases and antimicrobial resistance at the animal-human-environment interface.", "Manage livestock enterprises efficiently, integrating animal welfare, market demands, and sustainability considerations."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Apply advanced knowledge of animal nutrition, genetics, and reproduction to improve the productivity of livestock enterprises.", "Diagnose, prevent, and control major livestock diseases affecting cattle, small ruminants, and poultry in Nigeria and the West African region.", "Implement biosecurity protocols and food safety standards across livestock production and processing systems.", "Use the One Health framework to address zoonotic diseases and antimicrobial resistance at the animal-human-environment interface.", "Manage livestock enterprises efficiently, integrating animal welfare, market demands, and sustainability considerations."],
    core_modules: ["Animal Nutrition and Feed Management", "Livestock Breeding, Genetics, and Reproductive Management", "Veterinary Epidemiology and Disease Control", "Poultry, Ruminant, and Swine Production Systems", "One Health: Zoonoses, Antimicrobial Resistance, and Food Safety", "Livestock Enterprise Management and Marketing", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Animal Science, Veterinary Medicine, Agriculture, or a related discipline.",
    msc_admission_requirements: "A PGD in a related area or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Livestock production manager on commercial and smallholder farms", "Animal health officer in government veterinary agencies", "Agri-business specialist in feed manufacturing and veterinary pharmaceuticals", "Food safety inspector and quality assurance officer", "Researcher in animal science and veterinary public health"],
    keywords: ["livestock production", "animal health", "veterinary", "One Health", "food safety"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-9",
    title: "Crop Protection",
    slug: "crop-protection",
    code: "CP 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; on-campus and laboratory-based components",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Crop losses due to pests, diseases, and weeds remain a major constraint to food security across Nigeria and the broader African continent. This programme equips students with advanced knowledge of entomology, plant pathology, weed science, and integrated pest management.",
    outcomes: ["Identify and characterise major crop pests, diseases, and weeds affecting key food crops in Nigeria and West Africa.", "Design and implement integrated pest management (IPM) programmes appropriate for smallholder and large-scale farming systems.", "Evaluate the efficacy, safety, and environmental impact of biological, chemical, and cultural pest control strategies.", "Apply pesticide regulations, resistance management protocols, and safe use guidelines in field and advisory contexts.", "Conduct research on emerging pest and disease threats, including climate-driven range shifts of crop pathogens and vectors."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Postgraduate Diploma (PGD)", "Master of Science (MSc)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time)",
    programme_objectives: ["Identify and characterise major crop pests, diseases, and weeds affecting key food crops in Nigeria and West Africa.", "Design and implement integrated pest management (IPM) programmes appropriate for smallholder and large-scale farming systems.", "Evaluate the efficacy, safety, and environmental impact of biological, chemical, and cultural pest control strategies.", "Apply pesticide regulations, resistance management protocols, and safe use guidelines in field and advisory contexts.", "Conduct research on emerging pest and disease threats, including climate-driven range shifts of crop pathogens and vectors."],
    core_modules: ["Principles of Entomology and Pest Management", "Plant Pathology: Diseases of Field and Horticultural Crops", "Weed Science and Herbicide Management", "Integrated Pest Management (IPM) Systems", "Biopesticides and Biological Control Methods", "Pesticide Science: Chemistry, Regulation, and Resistance", "Applied Research / Dissertation (MSc only)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Agriculture, Botany, Zoology, Biochemistry, or a related field.",
    msc_admission_requirements: "A PGD in crop protection or a closely related area, or a relevant Bachelor's degree (minimum Second Class Lower); a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Crop protection officer in government agricultural agencies and extension services", "Agrochemical industry specialist in pesticide development, registration, and sales", "IPM consultant and agricultural advisory services provider", "Plant quarantine and biosecurity officer", "Research scientist in agricultural entomology, plant pathology, or weed science"],
    keywords: ["crop protection", "IPM", "plant pathology", "entomology", "food security"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-pg-10",
    title: "Seed Science and Technology",
    slug: "seed-science-technology",
    code: "SST 501",
    status: "published",
    deadline: "30 September 2025",
    start_date: "October 2025",
    mode: "Full-time and part-time; laboratory-intensive",
    duration: "One academic year (full-time); two years (part-time)",
    fees: 25000,
    overview: "Seeds are the fundamental unit of agricultural productivity. Improved seed systems, seed quality assurance, and seed technology innovation are essential drivers of food security and agricultural transformation.",
    outcomes: ["Understand the biology of seed development, germination, dormancy, and vigour in major food and horticultural crops.", "Design and manage seed production, conditioning, processing, and storage systems under varying agro-ecological conditions.", "Apply national and international seed testing and certification protocols including ISTA and NASC standards.", "Evaluate genetic and physiological seed quality parameters and implement quality assurance systems across the seed value chain.", "Analyse seed policy, intellectual property rights, and access and benefit-sharing frameworks governing plant genetic resources."],
    eligibility: "Minimum BSc (Second Class Lower) in a relevant field.",
    required_documents: ["Degree certificate", "Official transcript", "NYSC discharge/exemption", "Statement of purpose", "Two referee reports"],
    institution: "University of Jos, Nigeria",
    awarding_body: "University of Jos (through TCoEFS)",
    qualifications: ["Master of Agriculture (M.Agric)", "Postgraduate Diploma (PGD)"],
    pgd_duration: "One academic year (full-time); two years (part-time)",
    msc_duration: "18 months to two years (full-time); up to three years (part-time) – conferred as M.Agric",
    programme_objectives: ["Understand the biology of seed development, germination, dormancy, and vigour in major food and horticultural crops.", "Design and manage seed production, conditioning, processing, and storage systems under varying agro-ecological conditions.", "Apply national and international seed testing and certification protocols including ISTA and NASC standards.", "Evaluate genetic and physiological seed quality parameters and implement quality assurance systems across the seed value chain.", "Analyse seed policy, intellectual property rights, and access and benefit-sharing frameworks governing plant genetic resources."],
    core_modules: ["Seed Biology: Development, Dormancy, and Germination", "Seed Production and Crop Improvement", "Seed Processing, Conditioning, and Storage Technology", "Seed Quality Testing and Certification", "Seed Systems and Seed Policy in Africa", "Plant Genetic Resources and Intellectual Property", "Applied Research / Dissertation / Project (M.Agric)"],
    pgd_admission_requirements: "A recognised Bachelor's degree (minimum Second Class Lower) in Agriculture, Agronomy, Botany, Plant Biology, or a related discipline.",
    msc_admission_requirements: "A PGD in seed science or a closely related area, or a Bachelor's degree (minimum Second Class Lower) in a relevant field; a statement of research interest is required.",
    registration_info: "Applications and registration are currently processed through the University of Jos central admissions portal.",
    career_outcomes: ["Seed production manager on commercial and government seed farms", "Seed quality control and certification officer with NASC and state seed councils", "Plant breeder and variety development specialist", "Seed industry analyst and agribusiness development officer", "Researcher in seed science, genetics, and plant biotechnology"],
    keywords: ["seed science", "seed technology", "plant breeding", "seed systems", "food security"],
    creator_id: "fallback",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function slugifyProgrammeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseTextareaList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePostgraduateStatus(
  status: PostgraduateProgrammeRow["status"]
): "Open" | "Closing Soon" {
  return status === "closing_soon" ? "Closing Soon" : "Open";
}

async function loadCatalogueRows(options: { includeDrafts?: boolean } = {}) {
  const { adminClient } = await import("@/lib/supabase/admin");
  const statuses = options.includeDrafts
    ? ["draft", "published", "closing_soon", "closed"]
    : ["published", "closing_soon"];
  const resp = await adminClient
    .from("postgraduate_programmes")
    .select("*")
    .in("status", statuses)
    .order("created_at", { ascending: false });

  if (resp.error) {
    if (resp.error.message.includes("postgraduate_programmes")) {
      return FALLBACK_PROGRAMMES.filter((row) =>
        options.includeDrafts ? true : row.status === "published" || row.status === "closing_soon"
      );
    }
    throw new Error(resp.error.message);
  }

  const rows = (resp.data || []) as PostgraduateProgrammeRow[];
  if (rows.length === 0) {
    return options.includeDrafts
      ? FALLBACK_PROGRAMMES
      : FALLBACK_PROGRAMMES.filter((row) => row.status === "published" || row.status === "closing_soon");
  }
  return rows;
}

async function getCurrentContext() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const profileResp = await (supabase.from("profiles") as any)
    .select("role,first_name,last_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileResp.error) throw new Error(profileResp.error.message);
  return { user, profile: profileResp.data as { role?: string } | null };
}

async function getPostgraduateAdminContext() {
  const context = await getCurrentContext();
  const role = context.profile?.role;
  if (role !== "admissions_officer" && role !== "admin" && role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return context;
}

async function getPostgraduateSuperAdminContext() {
  const context = await getCurrentContext();
  if (context.profile?.role !== "super_admin" && context.profile?.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return context;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function getPostgraduateAdminLayoutUser(): Promise<LayoutUser> {
  const { user, profile } = await getPostgraduateAdminContext();
  const role = profile?.role === "super_admin" ? "super_admin" : profile?.role === "admin" ? "admin" : "admissions_officer";
  const name = [profile && "first_name" in profile ? (profile as any).first_name : null, profile && "last_name" in profile ? (profile as any).last_name : null]
    .filter(Boolean)
    .join(" ")
    .trim() || user.email || "Admin";
  return {
    name,
    initials: initialsFromName(name),
    role,
    roleLabel: role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Admissions Officer",
  };
}

function normalizeProgrammeInput(input: {
  title?: string;
  slug?: string;
  code?: string;
  status?: PostgraduateProgrammeRow["status"];
  deadline?: string;
  start_date?: string;
  mode?: string;
  duration?: string;
  fees?: number;
  overview?: string;
  outcomes?: string[];
  eligibility?: string;
  required_documents?: string[];
  institution?: string;
  awarding_body?: string;
  qualifications?: string[];
  pgd_duration?: string;
  msc_duration?: string;
  programme_objectives?: string[];
  core_modules?: string[];
  pgd_admission_requirements?: string;
  msc_admission_requirements?: string;
  registration_info?: string;
  career_outcomes?: string[];
  keywords?: string[];
}) {
  const title = input.title?.trim() || "";
  const slug = slugifyProgrammeValue(input.slug || input.title || "");
  const code = input.code?.trim() || "";
  const status = input.status || "draft";
  const deadline = input.deadline?.trim() || "";
  const start_date = input.start_date?.trim() || "";
  const mode = input.mode?.trim() || "";
  const duration = input.duration?.trim() || "";
  const fees = Number.isFinite(input.fees) ? Number(input.fees) : 0;
  const overview = input.overview?.trim() || "";
  const outcomes = (input.outcomes || []).map((item) => item.trim()).filter(Boolean);
  const eligibility = input.eligibility?.trim() || "";
  const required_documents = (input.required_documents || []).map((item) => item.trim()).filter(Boolean);
  const institution = input.institution?.trim() || "";
  const awarding_body = input.awarding_body?.trim() || "";
  const qualifications = (input.qualifications || []).map((item) => item.trim()).filter(Boolean);
  const pgd_duration = input.pgd_duration?.trim() || "";
  const msc_duration = input.msc_duration?.trim() || "";
  const programme_objectives = (input.programme_objectives || []).map((item) => item.trim()).filter(Boolean);
  const core_modules = (input.core_modules || []).map((item) => item.trim()).filter(Boolean);
  const pgd_admission_requirements = input.pgd_admission_requirements?.trim() || "";
  const msc_admission_requirements = input.msc_admission_requirements?.trim() || "";
  const registration_info = input.registration_info?.trim() || "";
  const career_outcomes = (input.career_outcomes || []).map((item) => item.trim()).filter(Boolean);
  const keywords = (input.keywords || []).map((item) => item.trim()).filter(Boolean);

  if (!title) throw new Error("Programme title is required.");
  if (!slug) throw new Error("Programme slug is required.");
  if (!code) throw new Error("Programme code is required.");
  if (!deadline) throw new Error("Application deadline is required.");
  if (!start_date) throw new Error("Start date is required.");
  if (!mode) throw new Error("Programme mode is required.");
  if (!duration) throw new Error("Programme duration is required.");
  if (!overview) throw new Error("Programme overview is required.");
  if (!eligibility) throw new Error("Eligibility requirements are required.");
  if (fees < 0) throw new Error("Programme fee cannot be negative.");

  return {
    title,
    slug,
    code,
    status,
    deadline,
    start_date,
    mode,
    duration,
    fees,
    overview,
    outcomes,
    eligibility,
    required_documents,
    institution: institution || null,
    awarding_body: awarding_body || null,
    qualifications,
    pgd_duration: pgd_duration || null,
    msc_duration: msc_duration || null,
    programme_objectives,
    core_modules,
    pgd_admission_requirements: pgd_admission_requirements || null,
    msc_admission_requirements: msc_admission_requirements || null,
    registration_info: registration_info || null,
    career_outcomes,
    keywords,
  };
}

export async function getPostgraduateProgrammeOptions(): Promise<PostgraduateProgrammeOption[]> {
  const rows = await loadCatalogueRows();
  return rows.map((row) => ({ slug: row.slug, label: row.title }));
}

export async function getPublicPostgraduateCatalogue(): Promise<PublicPostgraduateListItem[]> {
  const rows = await loadCatalogueRows();
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    code: row.code,
    mode: row.mode,
    duration: row.duration,
    fee: formatCurrency(Number(row.fees || 0)),
    deadline: row.deadline,
    status: normalizePostgraduateStatus(row.status),
  }));
}

export async function getPublicPostgraduateProgrammeBySlug(
  slug: string
): Promise<PublicPostgraduateDetail | null> {
  const rows = await loadCatalogueRows();
  const row = rows.find((item) => item.slug === slug) || null;
  if (!row) return null;
  return {
    slug: row.slug,
    code: row.code,
    title: row.title,
    status: normalizePostgraduateStatus(row.status),
    deadline: row.deadline,
    startDate: row.start_date,
    mode: row.mode,
    duration: row.duration,
    fee: formatCurrency(Number(row.fees || 0)),
    overview: row.overview,
    outcomes: row.outcomes,
    eligibility: row.eligibility,
    documents: row.required_documents,
    institution: row.institution,
    awardingBody: row.awarding_body,
    qualifications: row.qualifications,
    pgdDuration: row.pgd_duration,
    mscDuration: row.msc_duration,
    programmeObjectives: row.programme_objectives,
    coreModules: row.core_modules,
    pgdAdmissionRequirements: row.pgd_admission_requirements,
    mscAdmissionRequirements: row.msc_admission_requirements,
    registrationInfo: row.registration_info,
    careerOutcomes: row.career_outcomes,
    keywords: row.keywords,
  };
}

export async function getAdminPostgraduateProgrammes(): Promise<AdminPostgraduateListItem[]> {
  await getPostgraduateAdminContext();
  const rows = await loadCatalogueRows({ includeDrafts: true });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    code: row.code,
    status: row.status,
    mode: row.mode,
    deadline: row.deadline,
    fees: Number(row.fees || 0),
    canDelete: row.id.startsWith("fallback-") ? false : true,
  }));
}

export async function getAdminPostgraduateProgramme(id: string): Promise<AdminPostgraduateDetail> {
  await getPostgraduateAdminContext();
  const rows = await loadCatalogueRows({ includeDrafts: true });
  const programme = rows.find((row) => row.id === id) || null;
  if (!programme) throw new Error("NOT_FOUND");
  return { programme, canDelete: !programme.id.startsWith("fallback-") };
}

export async function createAdminPostgraduateProgramme(input: {
  title: string;
  slug?: string;
  code: string;
  status?: PostgraduateProgrammeRow["status"];
  deadline: string;
  start_date: string;
  mode: string;
  duration: string;
  fees: number;
  overview: string;
  outcomes: string[];
  eligibility: string;
  required_documents: string[];
}) {
  const { user } = await getPostgraduateAdminContext();
  const { adminClient } = await import("@/lib/supabase/admin");
  const normalized = normalizeProgrammeInput(input);
  const existing = await adminClient.from("postgraduate_programmes").select("id").eq("slug", normalized.slug).maybeSingle();
  if (existing.error && !existing.error.message.includes("postgraduate_programmes")) throw new Error(existing.error.message);
  if (existing.data) throw new Error("A postgraduate programme with this slug already exists.");
  const { data, error } = await (adminClient.from("postgraduate_programmes") as any)
    .insert({ ...normalized, creator_id: user.id })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not create postgraduate programme.");
  return { success: true as const, id: data.id as string };
}

export async function updateAdminPostgraduateProgramme(
  id: string,
  input: Partial<{
    title: string;
    slug: string;
    code: string;
    status: PostgraduateProgrammeRow["status"];
    deadline: string;
    start_date: string;
    mode: string;
    duration: string;
    fees: number;
    overview: string;
    outcomes: string[];
    eligibility: string;
    required_documents: string[];
  }>
) {
  await getPostgraduateAdminContext();
  const { adminClient } = await import("@/lib/supabase/admin");
  const currentResp = await adminClient.from("postgraduate_programmes").select("*").eq("id", id).maybeSingle();
  if (currentResp.error) throw new Error(currentResp.error.message);
  if (!currentResp.data) throw new Error("NOT_FOUND");
  const current = currentResp.data as PostgraduateProgrammeRow;
  const normalized = normalizeProgrammeInput({
    title: input.title ?? current.title,
    slug: input.slug ?? current.slug,
    code: input.code ?? current.code,
    status: input.status ?? current.status,
    deadline: input.deadline ?? current.deadline,
    start_date: input.start_date ?? current.start_date,
    mode: input.mode ?? current.mode,
    duration: input.duration ?? current.duration,
    fees: input.fees ?? Number(current.fees || 0),
    overview: input.overview ?? current.overview,
    outcomes: input.outcomes ?? current.outcomes,
    eligibility: input.eligibility ?? current.eligibility,
    required_documents: input.required_documents ?? current.required_documents,
  });
  const existing = await adminClient.from("postgraduate_programmes").select("id").eq("slug", normalized.slug).neq("id", id).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw new Error("A postgraduate programme with this slug already exists.");
  const { error } = await (adminClient.from("postgraduate_programmes") as any)
    .update(normalized)
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function deleteAdminPostgraduateProgramme(id: string) {
  await getPostgraduateSuperAdminContext();
  const { adminClient } = await import("@/lib/supabase/admin");
  const { error } = await adminClient.from("postgraduate_programmes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true as const };
}
