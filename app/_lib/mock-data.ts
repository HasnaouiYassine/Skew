/* ─── Types ─────────────────────────────────────────────── */
export interface SourceItem {
  name: string;
  bias: "Left" | "Center" | "Right";
}

export interface Article {
  id: number;
  category: string;
  region: string;
  title: string;
  imageUrl: string;
  left: number;
  center: number;
  right: number;
  sources: number;
  author: string;
  date: string;
  readTime: string;
  imageCaption: string;
  body: string[];
  quote: string;
  aiSummary: string[];
  sourceList: SourceItem[];
}

/* ─── Categories ─────────────────────────────────────────── */
export const CATEGORIES = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
  "Technology",
  "Climate",
  "Economy",
];

/* ─── Mock data ──────────────────────────────────────────── */
export const MOCK_ARTICLES: Article[] = [
  {
    id: 1,
    category: "Politics",
    region: "United States",
    title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    imageUrl: "https://picsum.photos/seed/iran1/900/506",
    left: 20,
    center: 31,
    right: 49,
    sources: 12,
    author: "David Morgan",
    date: "May 31, 2026",
    readTime: "12 min read",
    imageCaption:
      "President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026. Photo: Andrew Harnik/Getty Images",
    body: [
      "The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.",
      "The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to all Iranian nuclear facilities, including military sites.",
      "Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran's right to peaceful nuclear energy and include the lifting of all U.S. sanctions.",
      "The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. The Trump administration has warned that if diplomacy fails, it is prepared to take other action to prevent Iran from obtaining a nuclear weapon.",
      "European allies have urged both sides to continue negotiations. \"We believe diplomacy is still the best path forward,\" said a spokesperson for the EU's foreign policy chief.",
      "Israel, which has long opposed the 2015 nuclear deal with Iran, praised the Trump administration's tougher stance. \"This is the kind of leadership that was missing in the past,\" said Israeli Prime Minister Benjamin Netanyahu in a statement.",
      "The fate of the proposal now rests with Iran, as global attention remains focused on whether a new nuclear agreement can be reached — or if tensions will escalate further.",
    ],
    quote:
      '"This is a take-it-or-leave-it proposal," a senior administration official told the Wall Street Journal. "The President wants a deal, but he will not accept a weak agreement that puts America or our allies at risk."',
    aiSummary: [
      "The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles.",
      "The proposal also demands unrestricted inspector access to all nuclear sites, including military facilities.",
      "Iran has not responded officially but says any deal must respect its right to peaceful nuclear energy and include sanctions relief.",
      "The U.S. warns it is prepared to take other action if diplomacy fails, while European allies urge continued negotiations.",
      "Israel supports the tougher stance, praising the administration's determination to prevent Iran from acquiring nuclear weapons.",
    ],
    sourceList: [
      { name: "Fox News", bias: "Right" },
      { name: "The Wall Street Journal", bias: "Center" },
      { name: "Reuters", bias: "Center" },
      { name: "BBC", bias: "Center" },
      { name: "CNN", bias: "Left" },
      { name: "The New York Times", bias: "Center" },
      { name: "The Washington Post", bias: "Center" },
      { name: "Newsmax", bias: "Right" },
    ],
  },
  {
    id: 2,
    category: "Health",
    region: "United States",
    title:
      "Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence",
    imageUrl: "https://picsum.photos/seed/grapes2/900/506",
    left: 18,
    center: 42,
    right: 40,
    sources: 7,
    author: "Jane Smith",
    date: "May 30, 2026",
    readTime: "8 min read",
    imageCaption: "A vineyard in Napa Valley, California. Photo: Getty Images",
    body: [
      "A comprehensive review of nutritional studies has found strong evidence that grapes offer a wide range of health benefits, leading researchers to argue that they deserve 'superfood' status alongside blueberries and avocados.",
      "The review, published in the journal Advances in Nutrition, analyzed over 100 studies examining grapes' effects on cardiovascular health, cognitive function, and inflammation.",
      "Researchers found that compounds in grapes — including resveratrol and flavonoids — are associated with lower rates of heart disease, reduced inflammation markers, and improved memory in older adults.",
      "\"The evidence is now strong enough that we can say with confidence that regular grape consumption has meaningful health benefits,\" said Dr. Emily Chen, lead author of the review.",
      "Critics note that many of the studies relied on industry funding, and called for more independent research before grapes earn superfood status.",
    ],
    quote:
      '"Grapes are one of the most studied fruits in nutrition science, and the cumulative evidence is genuinely impressive," said Dr. Chen at the press conference.',
    aiSummary: [
      "A major review of 100+ studies supports classifying grapes as a superfood due to their cardiovascular and cognitive benefits.",
      "Key compounds — resveratrol and flavonoids — are linked to reduced inflammation and heart disease risk.",
      "Some researchers caution about industry-funded study bias in the findings.",
    ],
    sourceList: [
      { name: "Reuters", bias: "Center" },
      { name: "BBC", bias: "Center" },
      { name: "Fox News", bias: "Right" },
      { name: "The Guardian", bias: "Left" },
      { name: "NPR", bias: "Center" },
    ],
  },
  {
    id: 3,
    category: "Science",
    region: "Switzerland",
    title:
      "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    imageUrl: "https://picsum.photos/seed/cern3/900/506",
    left: 16,
    center: 62,
    right: 22,
    sources: 8,
    author: "Michael Faraday",
    date: "May 29, 2026",
    readTime: "10 min read",
    imageCaption:
      "Inside the Large Hadron Collider tunnel at CERN, Geneva. Photo: CERN/AFP",
    body: [
      "Scientists at CERN have announced a new measurement of unusual particle behavior that, if confirmed, could signal the existence of physics beyond the Standard Model — the theory that has governed particle physics for half a century.",
      "The result, from the LHCb experiment at the Large Hadron Collider, shows a statistically significant deviation in how B mesons decay compared to what the Standard Model predicts.",
      "While physicists say the result needs further confirmation, a deviation at this level of statistical significance — above 4 sigma — is considered a strong hint of new phenomena.",
      "\"We are very excited. This is exactly the kind of anomaly that could point to entirely new particles or forces,\" said Prof. Sheldon Cooper, who leads the LHCb analysis team.",
    ],
    quote:
      '"If this holds up under scrutiny, it would be the most important discovery in particle physics since the Higgs boson," said an independent physicist at MIT.',
    aiSummary: [
      "CERN's LHCb experiment has detected a significant deviation from Standard Model predictions in B meson decay.",
      "The result exceeds 4 sigma statistical significance, considered a strong hint of new physics.",
      "Further data collection and peer review are needed before a formal discovery can be claimed.",
    ],
    sourceList: [
      { name: "BBC", bias: "Center" },
      { name: "The Guardian", bias: "Left" },
      { name: "Reuters", bias: "Center" },
      { name: "Science Magazine", bias: "Center" },
    ],
  },
  {
    id: 4,
    category: "World",
    region: "Nicaragua",
    title:
      "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    imageUrl: "https://picsum.photos/seed/nicar4/900/506",
    left: 54,
    center: 28,
    right: 18,
    sources: 63,
    author: "Ana Gomez",
    date: "May 28, 2026",
    readTime: "9 min read",
    imageCaption:
      "Protesters outside the Nicaraguan embassy in Washington D.C. Photo: AP",
    body: [
      "Brooklyn Rivera, a prominent indigenous rights leader and longstanding political opponent of the Ortega government, has died in Nicaraguan custody after nearly three years of detention, human rights organizations confirmed Saturday.",
      "Rivera, who led the YATAMA indigenous political organization, was arrested in 2023 on charges that international observers widely condemned as politically motivated.",
      "The Inter-American Commission on Human Rights called for an immediate investigation into the circumstances of his death.",
      "Nicaragua's government has not issued a formal statement on the cause of death.",
    ],
    quote:
      '"Brooklyn Rivera gave his life for the rights of indigenous peoples in Nicaragua. His death demands accountability," said Amnesty International in a statement.',
    aiSummary: [
      "Indigenous leader Brooklyn Rivera has died after nearly three years in Nicaraguan government detention.",
      "Human rights groups demand an investigation and call the charges against him politically motivated.",
      "International bodies have condemned the Ortega government's treatment of political prisoners.",
    ],
    sourceList: [
      { name: "The Guardian", bias: "Left" },
      { name: "BBC", bias: "Center" },
      { name: "Reuters", bias: "Center" },
      { name: "CNN", bias: "Left" },
      { name: "Fox News", bias: "Right" },
    ],
  },
  {
    id: 5,
    category: "World",
    region: "Middle East",
    title:
      "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    imageUrl: "https://picsum.photos/seed/un5/900/506",
    left: 26,
    center: 35,
    right: 45,
    sources: 15,
    author: "Sarah Al-Rashid",
    date: "May 27, 2026",
    readTime: "7 min read",
    imageCaption:
      "Israeli military vehicles near the Lebanese border. Photo: Reuters",
    body: [
      "The United Nations Security Council has called an emergency meeting following reports of Israeli forces advancing further into southern Lebanon, escalating a conflict that has already displaced hundreds of thousands of civilians.",
      "Senior diplomats from the US, France, and the UK are expected to present a draft ceasefire resolution at the emergency session.",
      "The Israeli government says the operation is necessary to prevent Hezbollah from rearming along the border.",
    ],
    quote:
      '"We are deeply alarmed by the scale of civilian displacement and call for an immediate halt to hostilities," said the UN Secretary-General.',
    aiSummary: [
      "The UN Security Council convened an emergency session in response to escalating Israeli military operations in southern Lebanon.",
      "Western powers are pushing for a ceasefire resolution while Israel insists the operation targets Hezbollah infrastructure.",
    ],
    sourceList: [
      { name: "Reuters", bias: "Center" },
      { name: "Al Jazeera", bias: "Left" },
      { name: "Fox News", bias: "Right" },
      { name: "BBC", bias: "Center" },
      { name: "The New York Times", bias: "Center" },
    ],
  },
  {
    id: 6,
    category: "Business",
    region: "Global",
    title:
      "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    imageUrl: "https://picsum.photos/seed/oil6/900/506",
    left: 25,
    center: 50,
    right: 29,
    sources: 11,
    author: "Tom Bradley",
    date: "May 26, 2026",
    readTime: "6 min read",
    imageCaption: "Oil refinery at sunset, Texas Gulf Coast. Photo: Getty Images",
    body: [
      "Global oil prices fell by more than 2% on Friday as reports emerged that OPEC+ is weighing an increase in production quotas at its upcoming meeting, reflecting concerns about weak global demand.",
      "Brent crude dropped to $74.50 per barrel, its lowest level in six weeks, while West Texas Intermediate fell to $70.30.",
      "Analysts say the cartel is under pressure from member states facing budget shortfalls, who want to pump more oil despite the risk of further price declines.",
    ],
    quote:
      '"OPEC+ is caught between fiscal needs and price stability. It\'s a very difficult balancing act," said an energy analyst at Goldman Sachs.',
    aiSummary: [
      "Oil prices fell over 2% on reports that OPEC+ may increase production output quotas.",
      "Weak global demand and member state fiscal pressures are driving the potential policy shift.",
    ],
    sourceList: [
      { name: "Reuters", bias: "Center" },
      { name: "The Wall Street Journal", bias: "Center" },
      { name: "Bloomberg", bias: "Center" },
      { name: "Fox Business", bias: "Right" },
    ],
  },
  {
    id: 7,
    category: "Technology",
    region: "United States",
    title:
      "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    imageUrl: "https://picsum.photos/seed/spacex7/900/506",
    left: 12,
    center: 45,
    right: 43,
    sources: 9,
    author: "Chris Chang",
    date: "May 25, 2026",
    readTime: "8 min read",
    imageCaption: "SpaceX Starship lifts off from Boca Chica, Texas. Photo: SpaceX",
    body: [
      "SpaceX successfully launched its Starship rocket on a full orbital test flight Thursday, marking the most ambitious milestone yet in Elon Musk's plan to send humans to Mars within the decade.",
      "The fully integrated Starship stack — the most powerful rocket ever flown — lifted off from the company's Starbase facility in Texas and completed a full orbital insertion before splashing down in the Indian Ocean.",
      "NASA, which is using Starship as the lunar lander for its Artemis program, called the test a \"giant leap forward.\"",
    ],
    quote:
      '"Today shows that getting to Mars is not science fiction — it\'s an engineering challenge we are solving in real time," said Elon Musk after the launch.',
    aiSummary: [
      "SpaceX's Starship completed its first successful full orbital test flight, a key step toward Mars missions.",
      "The rocket is also the planned lunar lander for NASA's Artemis program.",
    ],
    sourceList: [
      { name: "The New York Times", bias: "Center" },
      { name: "Fox News", bias: "Right" },
      { name: "Reuters", bias: "Center" },
      { name: "Ars Technica", bias: "Center" },
    ],
  },
  {
    id: 8,
    category: "Business",
    region: "United States",
    title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    imageUrl: "https://picsum.photos/seed/apple8/900/506",
    left: 15,
    center: 40,
    right: 45,
    sources: 10,
    author: "Lisa Park",
    date: "May 24, 2026",
    readTime: "6 min read",
    imageCaption:
      "Apple CEO Tim Cook presenting at WWDC 2026. Photo: Apple/AFP",
    body: [
      "Apple announced a sweeping expansion of its AI capabilities at its annual Worldwide Developers Conference, unveiling features that will be baked into the next versions of iOS, iPadOS, and macOS.",
      "The new features include an AI-powered writing assistant, a smarter Siri that can take actions across apps, and an on-device image generation tool that works without an internet connection.",
      "Apple emphasized that all AI processing is done on-device or through its Private Cloud Compute system, which it says ensures user data is never seen by Apple or third parties.",
    ],
    quote:
      '"This is the most significant update to our software platforms in a decade," said CEO Tim Cook. "AI is now at the heart of everything we do."',
    aiSummary: [
      "Apple has announced major AI features for iPhone, iPad, and Mac at WWDC 2026.",
      "Key additions include an AI writing assistant, a smarter Siri, and on-device image generation.",
      "Apple stresses its privacy-first approach with on-device processing and Private Cloud Compute.",
    ],
    sourceList: [
      { name: "The Verge", bias: "Center" },
      { name: "Bloomberg", bias: "Center" },
      { name: "Fox Business", bias: "Right" },
      { name: "The New York Times", bias: "Center" },
    ],
  },
  {
    id: 9,
    category: "Climate",
    region: "Global",
    title:
      "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    imageUrl: "https://picsum.photos/seed/climate9/900/506",
    left: 33,
    center: 34,
    right: 33,
    sources: 14,
    author: "Emma Watson",
    date: "May 23, 2026",
    readTime: "7 min read",
    imageCaption:
      "Heat haze over cracked earth in the Sahel region. Photo: Reuters",
    body: [
      "Global temperatures in 2025 were among the three highest on record, and 2026 is showing similar trends, the EU's Copernicus Climate Change Service reported Friday.",
      "The data shows that the first four months of 2026 were, on average, 1.68°C above pre-industrial levels — dangerously close to the 1.5°C threshold set in the Paris Agreement.",
      "Scientists say the consecutive record-breaking years are a clear signal that human-caused climate change is accelerating.",
    ],
    quote:
      '"The data is unambiguous. We are in a climate emergency and the window to act is narrowing rapidly," said the director of Copernicus Climate Change Service.',
    aiSummary: [
      "2025 ranks among the three hottest years in recorded history, with 2026 trending similarly.",
      "Global average temperatures are dangerously close to the Paris Agreement's 1.5°C threshold.",
    ],
    sourceList: [
      { name: "BBC", bias: "Center" },
      { name: "The Guardian", bias: "Left" },
      { name: "Fox News", bias: "Right" },
      { name: "Reuters", bias: "Center" },
    ],
  },
  {
    id: 10,
    category: "Economy",
    region: "United States",
    title:
      "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    imageUrl: "https://picsum.photos/seed/fed10/900/506",
    left: 30,
    center: 45,
    right: 25,
    sources: 13,
    author: "Robert Chen",
    date: "May 22, 2026",
    readTime: "7 min read",
    imageCaption:
      "Federal Reserve Board Chairman Jerome Powell at a press conference. Photo: AP",
    body: [
      "The Federal Reserve held interest rates steady at its May meeting, as officials cited persistent inflation pressures and slowing economic growth as reasons for caution before making any further adjustments.",
      "Fed Chair Jerome Powell told reporters that while inflation has moderated significantly from its 2022 peak, it remains above the central bank's 2% target.",
      "Markets had widely anticipated the hold, but investors were focused on any signals about the timing of future rate cuts.",
    ],
    quote:
      '"We do not think it would be appropriate to reduce rates until we have greater confidence that inflation is moving sustainably toward 2%," Powell said.',
    aiSummary: [
      "The Federal Reserve held interest rates steady amid ongoing inflation concerns and uncertain growth prospects.",
      "Fed Chair Powell signaled no rate cuts until inflation falls closer to the 2% target.",
    ],
    sourceList: [
      { name: "The Wall Street Journal", bias: "Center" },
      { name: "Bloomberg", bias: "Center" },
      { name: "Fox Business", bias: "Right" },
      { name: "The New York Times", bias: "Center" },
    ],
  },
  {
    id: 11,
    category: "Soccer",
    region: "Europe",
    title:
      "Real Madrid Win Champions League After Comeback Victories in Final",
    imageUrl: "https://picsum.photos/seed/madrid11/900/506",
    left: 10,
    center: 20,
    right: 70,
    sources: 26,
    author: "Carlos Santos",
    date: "May 21, 2026",
    readTime: "5 min read",
    imageCaption:
      "Real Madrid players celebrate with the Champions League trophy in Munich. Photo: UEFA/Getty",
    body: [
      "Real Madrid have claimed a record 16th UEFA Champions League title after defeating Bayern Munich 3–2 in a dramatic final in Munich, securing the comeback with a 90th-minute winner from Kylian Mbappé.",
      "Bayern led 2–0 at half time before Madrid mounted a remarkable second-half comeback — a comeback that has now become synonymous with the Spanish club's European DNA.",
      "Manager Carlo Ancelotti dedicated the victory to the fans, calling it \"the greatest night of my career.\"",
    ],
    quote:
      '"Real Madrid never gives up. That is what we showed tonight, and that is why we are the greatest club in the world," said captain Luka Modrić.',
    aiSummary: [
      "Real Madrid won their 16th Champions League title with a dramatic 3–2 comeback against Bayern Munich.",
      "Kylian Mbappé scored the 90th-minute winner to complete the turnaround.",
    ],
    sourceList: [
      { name: "BBC Sport", bias: "Center" },
      { name: "Sky Sports", bias: "Center" },
      { name: "The Guardian", bias: "Left" },
      { name: "Marca", bias: "Right" },
    ],
  },
  {
    id: 12,
    category: "Environment",
    region: "Canada",
    title: "Wildfires Force Thousands to Evacuate Across Western Canada",
    imageUrl: "https://picsum.photos/seed/fire12/900/506",
    left: 27,
    center: 33,
    right: 40,
    sources: 17,
    author: "Rachel MacDonald",
    date: "May 20, 2026",
    readTime: "8 min read",
    imageCaption:
      "Smoke rises over evacuation routes in British Columbia. Photo: CP/Reuters",
    body: [
      "Rapidly spreading wildfires in British Columbia and Alberta have forced more than 40,000 people to flee their homes, with provincial authorities declaring states of emergency across multiple regions.",
      "Firefighters from across Canada and the United States have been deployed, but high temperatures and strong winds have hampered containment efforts.",
      "Officials say the fires are burning earlier and more intensely than in previous years, consistent with long-term trends driven by climate change.",
    ],
    quote:
      '"We have never seen fire behavior like this so early in the season. It is deeply alarming," said British Columbia\'s Emergency Management Minister.',
    aiSummary: [
      "Over 40,000 people have been evacuated due to wildfires in western Canada.",
      "Extreme heat and wind have made containment difficult, prompting emergency declarations.",
    ],
    sourceList: [
      { name: "CBC", bias: "Center" },
      { name: "Reuters", bias: "Center" },
      { name: "The Globe and Mail", bias: "Center" },
      { name: "Fox News", bias: "Right" },
    ],
  },
];
