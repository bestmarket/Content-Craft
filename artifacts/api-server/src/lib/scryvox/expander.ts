export interface TopicExpansion {
  domain: string;
  coreKeyword: string;
  subtopics: string[];
  commonMistakes: string[];
  contrarianAngles: string[];
  surprisingTruths: string[];
  emotionalNeeds: string[];
  powerQuestions: string[];
  actionInsights: string[];
  relatedAmplifiers: string[];
  underlyingDesire: string;
  biggestFear: string;
  contrarianHook: string;
}

interface DomainCluster {
  keywords: string[];
  subtopics: string[];
  commonMistakes: string[];
  contrarianAngles: string[];
  surprisingTruths: string[];
  emotionalNeeds: string[];
  powerQuestions: string[];
  actionInsights: string[];
  amplifiers: string[];
  underlyingDesire: string;
  biggestFear: string;
}

const DOMAIN_CLUSTERS: Record<string, DomainCluster> = {
  income: {
    keywords: ["make money", "earn money", "per month", "per week", "side hustle", "passive income", "extra income", "online income", "make $", "earn $", "income stream", "gig", "freelance for income", "monetize"],
    subtopics: ["freelancing and consulting", "digital products and ebooks", "content monetization (YouTube/newsletter)", "e-commerce and print-on-demand", "affiliate marketing", "tutoring and coaching", "gig platform work (Fiverr, Upwork)"],
    commonMistakes: ["trying to build all income streams at once instead of mastering one first", "underpricing services out of fear instead of pricing for value", "waiting until everything is perfect before launching", "giving up after 30 days when most income streams take 60–90 days to produce results", "choosing the 'trendy' method instead of the method that fits your current skills"],
    contrarianAngles: ["your first income stream should be boring, not exciting — boring scales", "speed beats polish: a $47 PDF launched in a week beats a $497 course launched never", "most passive income isn't passive — it's front-loaded active work that eventually reduces", "the best income stream is the one closest to a skill you already have"],
    surprisingTruths: ["freelancers who specialize in one niche earn 2–3x more than generalists doing the same work", "a $47 digital product sold to 50 people a month generates $28,200/year — without ads", "the majority of people who earn $2K/month online did it with one income method, not five", "the hardest part isn't the income strategy — it's the first $100, which proves the model works", "people who document their income journey on social media while building often grow faster due to accountability"],
    emotionalNeeds: ["financial security without sacrificing all free time", "proof that it's actually possible for them — not just for 'lucky' people", "a clear, step-by-step path that removes the guesswork", "a sense of progress: visible milestones that confirm they're moving"],
    powerQuestions: ["What skill do you already have that someone would pay $50–$500 for?", "What's stopping you from launching the smallest version of your income idea this week?", "If you had to earn $500 in 14 days, what would you do first?", "What income method have you researched for months but never started — and why?"],
    actionInsights: ["pick the income method closest to your existing skills — proximity to expertise is the fastest path to your first sale", "validate before you build: get one person to pay you for the idea before you spend 40 hours creating it", "set a 30-day deadline for your first income stream — urgency prevents the perfectionism trap", "track income weekly, not monthly — seeing small wins builds momentum that keeps you going"],
    amplifiers: ["your first paid client", "your first digital product sale", "your monthly income total", "the number of income streams you have running", "how many hours per week you're working on income vs trading time for it", "your income-per-hour ratio"],
    underlyingDesire: "to stop trading all their time for money and start building income that works while they sleep",
    biggestFear: "spending months building something nobody buys — and ending up exactly where they started",
  },
  mindset: {
    keywords: ["mindset", "belief", "confidence", "motivation", "mental", "thinking", "psychology", "habit", "attitude", "growth", "fear", "anxiety", "self", "discipline", "willpower", "focus"],
    subtopics: ["identity-level change", "cognitive reframing", "limiting beliefs", "self-sabotage patterns", "internal narratives", "the gap between knowing and doing", "sustainable motivation"],
    commonMistakes: ["relying on motivation instead of systems", "trying to change behavior without changing identity", "positive thinking without honest self-assessment", "avoiding discomfort instead of processing it", "treating mindset as a one-time fix"],
    contrarianAngles: ["confidence is built through action, not preparation", "your comfort zone is lying to you about what's safe", "discipline is not about willpower — it's about environment design", "the advice to 'think positive' is actively harming you"],
    surprisingTruths: ["the brain physically cannot distinguish imagination from experience at the neurological level", "most limiting beliefs were formed before age seven", "your identity protects itself — even the parts of it you hate", "the harder you try to feel motivated, the less motivated you feel", "self-compassion consistently outperforms self-criticism for long-term change"],
    emotionalNeeds: ["feeling capable and worthy", "escaping the gap between who you are and who you want to be", "being free from the inner critic that never stops", "feeling in control of your own trajectory"],
    powerQuestions: ["What would you attempt if you knew your self-doubt was just a pattern, not a truth?", "What belief do you hold that feels like a fact but is actually a story?", "What version of yourself are you protecting yourself from becoming?", "If your current identity ran your future, where would you end up in five years?"],
    actionInsights: ["change your environment before you try to change your behavior", "attach your new habit to an identity statement, not a goal", "instead of fighting fear, get curious about what it's protecting", "the fastest way to build confidence is to do the hard thing in public"],
    amplifiers: ["your internal narrative", "your default emotional state", "your belief ceiling", "the identity you're protecting", "your subconscious operating system", "your emotional default settings"],
    underlyingDesire: "to feel free, capable, and fully expressed",
    biggestFear: "that this is as good as it gets — that real change isn't actually possible for them",
  },
  productivity: {
    keywords: ["productivity", "time", "efficiency", "focus", "procrastination", "organize", "schedule", "task", "output", "performance", "work", "management", "system", "priority", "deep work"],
    subtopics: ["energy management over time management", "deep work architecture", "decision fatigue", "the myth of multitasking", "strategic procrastination", "elimination before optimization", "the 80/20 principle applied to daily tasks"],
    commonMistakes: ["optimizing tasks that should be eliminated", "confusing busyness with productivity", "using willpower instead of systems", "ignoring energy cycles and peak hours", "over-planning and under-executing"],
    contrarianAngles: ["working fewer hours often produces more output", "the most productive people say no to almost everything", "your to-do list is a lie you tell yourself", "perfect scheduling is a form of procrastination", "rest is not the opposite of productivity — it's part of the system"],
    surprisingTruths: ["the average knowledge worker is productively focused for less than 3 hours per day", "decision fatigue is real and accumulates by mid-morning for most people", "multitasking reduces IQ temporarily more than cannabis", "the brain can't focus for more than 90 minutes without a performance drop", "most urgent tasks are not important, and most important tasks are never urgent"],
    emotionalNeeds: ["feeling in control of their time and energy", "the satisfaction of actual meaningful progress", "escaping the guilt of perpetual busyness with no results", "freedom from the feeling that the day controls them"],
    powerQuestions: ["What would you stop doing if you were only allowed 4 hours of work per day?", "Which item on your to-do list is secretly just a way to avoid the one thing that matters?", "What are you optimizing that you should be eliminating?", "When is your peak performance window, and are you protecting it?"],
    actionInsights: ["identify your three non-negotiables for the day before anything else", "protect your first 2 hours from reactive work", "energy management is the foundation — time management is the structure built on top", "the one task you most want to avoid is usually the most important one"],
    amplifiers: ["your focused hours", "your decision-making quality", "your energy architecture", "your deep work capacity", "your output-to-effort ratio", "the work that actually moves the needle"],
    underlyingDesire: "to feel like they're making real progress on what actually matters",
    biggestFear: "reaching the end of the day — or the year — with a full calendar and nothing meaningful accomplished",
  },
  finance: {
    keywords: ["money", "finance", "wealth", "invest", "income", "budget", "financial", "rich", "debt", "savings", "business", "revenue", "profit", "asset", "passive"],
    subtopics: ["the psychology of money", "compound interest as a philosophy", "asset vs liability thinking", "income diversification", "financial identity transformation", "the wealth gap that nobody talks about", "money as a tool vs money as a goal"],
    commonMistakes: ["saving instead of investing early", "timing the market instead of time in the market", "ignoring the emotional relationship with money", "lifestyle inflation at every income jump", "building income without building assets"],
    contrarianAngles: ["budgeting is a poverty mindset — the wealthy track, not restrict", "your biggest financial asset isn't money, it's your earning potential", "most financial advice is designed to benefit the advisor", "frugality alone will never make you wealthy", "the best investment most people ignore is their own skills"],
    surprisingTruths: ["most self-made millionaires have multiple income streams and few have more than one at the start", "the average lottery winner returns to their previous financial state within five years — because wealth is a mindset, not a number", "inflation quietly charges you a tax whether you invest or not", "most people underestimate what they earn and overestimate what they save", "the difference between rich and wealthy is time horizon"],
    emotionalNeeds: ["security and freedom from financial anxiety", "independence from trading time for money", "the ability to create options in their life", "being in control of their financial future"],
    powerQuestions: ["What is your money actually working toward?", "How many hours of your life is every purchase worth?", "If your income disappeared tomorrow, how long could you sustain your life without panic?", "What financial belief did you absorb before age 12 that still runs your decisions?"],
    actionInsights: ["automate savings and investments before you see the money", "build one income stream to reliability before adding another", "every dollar should have a job assigned to it", "the first financial goal is always a runway — at least six months of expenses"],
    amplifiers: ["your wealth-building timeline", "your relationship with money", "your financial identity", "your income ceiling", "your investment behavior patterns", "how you think about risk"],
    underlyingDesire: "to feel genuinely free — from obligation, from scarcity, from trading time for survival",
    biggestFear: "being stuck in financial stress forever, working forever for someone else's dream",
  },
  health: {
    keywords: ["health", "fitness", "exercise", "nutrition", "diet", "wellness", "body", "weight", "sleep", "energy", "mental health", "stress", "recovery", "strength", "longevity"],
    subtopics: ["sleep as the master performance variable", "the gut-brain connection most people ignore", "stress as information not enemy", "the difference between exercise and movement", "nutrition as information for your cells", "recovery as the actual work", "chronobiology and your natural rhythms"],
    commonMistakes: ["exercising to compensate for poor nutrition", "ignoring sleep while optimizing everything else", "treating symptoms without addressing root causes", "following generic advice instead of listening to your own body", "overtraining without adequate recovery"],
    contrarianAngles: ["exercise is the least efficient way to lose weight", "willpower-based health changes fail because willpower is a finite resource", "most supplements are expensive placebos", "the healthiest people aren't the most disciplined — they've designed their environment correctly", "rest is a performance variable, not a reward"],
    surprisingTruths: ["your gut produces approximately 90% of your body's serotonin", "chronic sleep deprivation mimics the cognitive impairment of legal intoxication", "inflammation is the common root of most chronic disease", "your body adapts to stress — but only with adequate recovery", "the microbiome has more influence over mood and cognition than most people realize"],
    emotionalNeeds: ["sustained energy to be present for what matters", "confidence in and comfort with their own body", "longevity — to be healthy for the people they love", "mental clarity that allows them to be their best self"],
    powerQuestions: ["If you had unlimited energy every single day, what would change in your life?", "What health habit, if you were consistent with it, would change everything else?", "What signal is your body giving you that you've been choosing to ignore?", "What are you sacrificing your health for — and is it worth the true cost?"],
    actionInsights: ["optimize sleep before optimizing exercise or nutrition — it amplifies both", "the best diet is the one with the least friction that you'll actually maintain", "movement throughout the day outperforms one intense hour of exercise for metabolic health", "stress without recovery is the root of most health decline"],
    amplifiers: ["your daily energy baseline", "your recovery capacity", "your body's signals", "your circadian rhythm", "your mental clarity window", "what your body is actually asking for"],
    underlyingDesire: "to feel genuinely alive — energetic, clear, capable, and present",
    biggestFear: "losing vitality, becoming dependent, and leaving too early",
  },
  relationships: {
    keywords: ["relationship", "love", "partner", "dating", "marriage", "family", "friend", "communication", "trust", "connection", "attachment", "boundary", "emotion", "intimacy", "social"],
    subtopics: ["attachment theory in everyday relationships", "the four communication styles and their costs", "how unprocessed childhood shapes adult connection", "the difference between proximity and intimacy", "conflict as a bridge or a wall", "emotional availability as a skill", "the role of self-knowledge in relationship quality"],
    commonMistakes: ["expecting a partner to complete you instead of complement you", "confusing intensity with depth in early relationships", "avoiding conflict instead of developing conflict competence", "neglecting the friendship layer of romantic relationships", "trying to change a partner instead of choosing differently"],
    contrarianAngles: ["love alone is not enough — compatibility is a system, not a feeling", "most relationship problems are actually self-knowledge problems", "chemistry is the least reliable predictor of long-term happiness", "healthy boundaries are an act of love, not selfishness", "being truly known by someone is scarier than being liked by everyone"],
    surprisingTruths: ["research consistently shows that how you fight matters more than how often you fight", "the number one predictor of divorce is contempt, not conflict", "loneliness has the same mortality risk as smoking 15 cigarettes per day", "secure attachment can be developed in adulthood even without a secure childhood", "most people are more afraid of deep intimacy than of rejection"],
    emotionalNeeds: ["to feel truly seen, known, and accepted", "to love and be loved without losing yourself", "safety within vulnerability", "to feel chosen — repeatedly, not just once"],
    powerQuestions: ["Are you bringing your full self to this relationship, or a curated version?", "What are you tolerating that you've convinced yourself is normal?", "What would it mean to be truly known — and does that excite or terrify you?", "What did you learn about love before you had the words to question it?"],
    actionInsights: ["repair is more important than avoiding rupture — relationship resilience is built in repair", "curiosity about your partner consistently outperforms certainty about them", "the relationship you have with yourself sets the template for every other relationship", "vulnerability is not weakness — it's the specific ingredient that creates depth"],
    amplifiers: ["your attachment patterns", "your communication defaults", "your conflict style", "your emotional availability", "the boundaries you've set and the ones you haven't", "what you need versus what you've settled for"],
    underlyingDesire: "to be fully known and fully loved — without having to shrink, perform, or pretend",
    biggestFear: "ending up alone or in a connection that looks right from the outside but feels hollow on the inside",
  },
  career: {
    keywords: ["career", "job", "work", "professional", "success", "leadership", "promotion", "salary", "skill", "business", "entrepreneur", "brand", "network", "opportunity", "industry"],
    subtopics: ["the skills gap nobody talks about honestly", "personal brand as career infrastructure", "the difference between a job and a career identity", "strategic relationship building vs networking theater", "the compounding return of deliberate skill development", "positioning before promotion", "how the top 5% think about career growth differently"],
    commonMistakes: ["waiting for recognition instead of creating visibility", "building skills in isolation without building reputation", "confusing loyalty with leverage", "staying in situations past their expiry date out of fear", "prioritizing salary over learning opportunity in the early years"],
    contrarianAngles: ["working harder rarely gets you promoted — working smarter in public does", "your biggest career risk isn't taking a risk, it's staying safe too long", "the best career advice is often the opposite of what HR says", "specialization is often more valuable than being well-rounded", "your network is your net worth — but most people network transactionally"],
    surprisingTruths: ["most hiring decisions are made in the first 30 seconds and then justified afterward", "research shows that women who negotiate salaries earn $1 million more over a career than those who don't", "the average person has more transferable skills than they realize", "career momentum is easier to maintain than to rebuild once lost", "the people who advance fastest are not the most skilled — they are the most visible"],
    emotionalNeeds: ["to feel that their work matters and reflects who they really are", "to be respected and valued for their unique contribution", "financial growth that keeps pace with their potential", "freedom and autonomy over how their skills are applied"],
    powerQuestions: ["Are you building a career or collecting a paycheck?", "What would you regret not attempting at the end of your professional life?", "Who sees your best work — and should more people?", "What skill, if mastered, would make you significantly more valuable in the next three years?"],
    actionInsights: ["build your reputation before you need it", "learn in public — it compounds faster than private study", "position yourself as a problem solver, not a task completer", "every career plateau is a positioning problem, not a skill problem"],
    amplifiers: ["your professional reputation", "your visibility to decision-makers", "your positioning in the market", "your unique value proposition", "your leadership presence", "how you're perceived when you leave the room"],
    underlyingDesire: "to build something meaningful with their time, feel genuinely valued, and create financial freedom",
    biggestFear: "reaching the middle or end of a career and realizing they played it too safe or worked for someone else's dream",
  },
  creativity: {
    keywords: ["creative", "art", "write", "design", "idea", "innovation", "create", "content", "storytelling", "music", "imagination", "inspiration", "originality", "craft", "expression"],
    subtopics: ["the myth of the creative genius", "creative blocks as information", "constraint as a creative accelerator", "developing a distinctive voice", "the relationship between consuming and creating", "quantity as the path to quality", "creative identity vs creative output"],
    commonMistakes: ["waiting for inspiration before creating", "consuming too much and creating too little", "comparing your work to finished, polished output instead of process", "treating creativity as a talent rather than a practice", "avoiding your own voice in favor of what you think people want"],
    contrarianAngles: ["the most original work often comes from constraints, not freedom", "creativity is a muscle — the more you use it, the more reliable it becomes", "your taste will always exceed your ability early on — this is not a flaw, it's the design", "most creative breakthroughs happen not during work, but during rest", "the most powerful creative tool is not inspiration — it's showing up"],
    surprisingTruths: ["Picasso created over 20,000 works — most were unremarkable; the ratio created the masterpieces", "creative people are not born different — they've simply done more iterations", "the inner critic and the inner creator cannot both be active at the same time", "research shows that walking increases creative output by 81%", "most original ideas are old ideas combined in new ways"],
    emotionalNeeds: ["to express what feels inexpressible", "to create something that outlasts them", "to connect with others through their unique perspective", "to feel fully alive in the act of making something"],
    powerQuestions: ["What would you create if you knew no one would judge it?", "What creative project are you deferring until you feel 'ready'?", "What would your art look like if it were completely honest?", "What are you most afraid to make — and why is that the thing you should make?"],
    actionInsights: ["ship imperfect work consistently rather than waiting for perfect work indefinitely", "steal structure from what works; inject your own perspective ruthlessly", "create for the person you were two years ago — they're exactly who needs your work", "volume precedes mastery — protect your creative consistency above all else"],
    amplifiers: ["your original voice", "your creative instincts", "your visual/aesthetic sensibility", "your creative velocity", "your expression vs your output", "the work only you could make"],
    underlyingDesire: "to make something real that reflects who they actually are — and to be seen through it",
    biggestFear: "dying with the thing they were meant to create still inside them",
  },
  business: {
    keywords: ["business", "startup", "entrepreneur", "marketing", "sales", "customer", "brand", "strategy", "market", "scale", "revenue", "growth", "product", "company", "launch"],
    subtopics: ["product-market fit as a discovery process", "customer psychology over product features", "positioning in a crowded market", "revenue architecture and pricing psychology", "building systems before scaling people", "brand as the story the market tells about you", "the real cost of premature scaling"],
    commonMistakes: ["building before validating", "optimizing before finding product-market fit", "hiring to solve a process problem", "confusing revenue with profit", "scaling a broken unit economics model faster"],
    contrarianAngles: ["most startups don't die from competition — they die from founder confusion", "the best marketing is a product people talk about", "more features usually reduce conversion rates", "the most sustainable growth is organic, not paid", "your pricing tells people who you are"],
    surprisingTruths: ["80% of customers will pay more for better experience than for a lower price", "the number one reason businesses fail is not lack of funding but lack of customers who care enough", "word of mouth is 5x more powerful than paid advertising at generating trust", "most successful companies were built on their second or third pivot", "customer retention is worth 5-25x more than customer acquisition"],
    emotionalNeeds: ["to build something that creates real value and lasts", "to achieve financial independence through their own creation", "to lead a team and a vision toward something meaningful", "to prove that their idea is real and worthy"],
    powerQuestions: ["Who specifically is this for — and would they feel that when they encountered it?", "What do your best customers tell people about you without being asked?", "Where is the friction in your customer experience that you've normalized?", "What would you do if you couldn't spend money to grow?"],
    actionInsights: ["talk to 50 customers before building anything", "nail one channel before diversifying", "the positioning statement is the most underrated business document", "build recurring revenue before chasing new customer acquisition"],
    amplifiers: ["your market positioning", "your customer psychology", "your brand equity", "your revenue architecture", "your competitive moat", "what your business is actually built on"],
    underlyingDesire: "to create something that generates real value, financial freedom, and lasting impact",
    biggestFear: "wasting years building something nobody actually wants",
  },
  technology: {
    keywords: ["technology", "ai", "digital", "software", "app", "automation", "data", "code", "tech", "internet", "future", "innovation", "tools", "algorithm", "machine learning"],
    subtopics: ["AI as a cognitive amplifier not a replacement", "automation leverage at the individual level", "digital literacy as a 21st century survival skill", "the attention economy and how it works against you", "building with technology vs being consumed by it", "data literacy for non-technical people", "the ethical dimension of technological adoption"],
    commonMistakes: ["automating processes that should be eliminated", "using more tools than necessary", "adopting technology for its novelty rather than its value", "ignoring security and privacy as afterthoughts", "replacing judgment with algorithms"],
    contrarianAngles: ["the best tech is the tech that disappears from your awareness", "AI will amplify both the best and worst qualities in every person who uses it", "the most valuable digital skill is knowing when not to use technology", "speed of adoption is not competitive advantage — depth of application is"],
    surprisingTruths: ["the average person spends 7+ hours daily on screens but less than 30 minutes on deliberate skill building", "most productivity tools create the illusion of productivity while reducing actual output", "the organizations adapting to AI fastest are not the biggest — they're the most curious", "the human skills AI cannot replicate are precisely the ones most undervalued by the current education system"],
    emotionalNeeds: ["to feel empowered by technology rather than threatened by it", "to stay relevant in a rapidly shifting landscape", "to leverage tools intelligently without becoming dependent on them", "clarity about what to learn and what to ignore"],
    powerQuestions: ["Is technology working for you, or are you working for technology?", "What would your workflow look like if you removed every tool you haven't mastered?", "What human skill are you neglecting because a tool is doing it for you?", "Which AI capability could 10x your value this year if you spent 30 days mastering it?"],
    actionInsights: ["master one tool deeply before adopting the next", "use AI for amplification, not replacement of your judgment", "your data hygiene is your competitive moat", "the question to ask of any new tool: does this help me think better or think less?"],
    amplifiers: ["your digital workflow", "your automation leverage", "your AI literacy", "your tool mastery depth", "your data decision-making", "how technology is working for or against you"],
    underlyingDesire: "to be equipped, not overwhelmed — to use technology as a superpower, not carry it as a burden",
    biggestFear: "being left behind in a world accelerating faster than they can adapt",
  },
  education: {
    keywords: ["learn", "education", "study", "knowledge", "skill", "school", "teach", "training", "course", "understand", "intelligence", "memory", "reading", "mastery", "expertise"],
    subtopics: ["learning how to learn", "the forgetting curve and how to defeat it", "deliberate practice vs naive practice", "building mental models", "the optimal difficulty principle", "knowledge vs wisdom", "the compounding return of reading consistently"],
    commonMistakes: ["passive consumption mistaken for learning", "re-reading instead of active recall", "breadth over depth in skill acquisition", "ignoring sleep's role in memory consolidation", "learning without application"],
    contrarianAngles: ["the smartest people are usually the most confused — and this is a feature not a bug", "trying hard to remember something weakens recall — strategic forgetting strengthens it", "most formal education optimizes for compliance not curiosity", "the best learners don't study harder — they study smarter with spaced repetition"],
    surprisingTruths: ["testing yourself on material beats re-reading it by a factor of five for retention", "the optimal study session is shorter than most people think — 25-50 minutes with a genuine break", "teaching what you learn immediately consolidates it at a neurological level", "reading one book per month puts you in the top 5% of learners in most industries"],
    emotionalNeeds: ["to grow and evolve continuously", "to feel intellectually alive and curious", "to develop mastery that creates real value", "to never feel stagnant or left behind"],
    powerQuestions: ["What would you learn if you knew you could become genuinely excellent at it?", "Are you acquiring knowledge or wisdom — and do you know the difference?", "What's the one skill that would make everything else easier?", "How much of what you learned last year have you actually applied?"],
    actionInsights: ["teach immediately what you want to retain permanently", "connect new knowledge to what you already know — orphan knowledge fades", "use spaced repetition for anything you need long-term", "read with a pen — annotation is thinking made visible"],
    amplifiers: ["your learning velocity", "your knowledge retention rate", "your mental model library", "your skill acquisition system", "how you process and apply new information", "the quality of questions you ask"],
    underlyingDesire: "to grow into a version of themselves that's visibly more capable, more wise, and more free",
    biggestFear: "intellectual stagnation — being the same person in ten years that they are today",
  },
  lifestyle: {
    keywords: ["lifestyle", "life", "balance", "happiness", "purpose", "meaning", "travel", "experience", "freedom", "fulfillment", "joy", "passion", "identity", "values", "choice"],
    subtopics: ["the architecture of a life you don't need to escape", "designing for meaning, not just achievement", "the difference between pleasure and fulfillment", "saying no as a lifestyle strategy", "the role of boredom in a meaningful life", "consumption vs creation as identity", "what 'having it all' actually costs"],
    commonMistakes: ["optimizing for a life others admire instead of one they actually want", "deferring living until they've achieved some future milestone", "filling every moment instead of creating space", "confusing activity with meaning", "making financial decisions based on lifestyle inflation rather than lifestyle design"],
    contrarianAngles: ["the best life isn't the busiest one", "social media has made us excellent at performing happiness rather than experiencing it", "more options don't lead to more happiness — they lead to more anxiety", "the pursuit of happiness is often what prevents it", "the most interesting people are the ones who've failed thoughtfully"],
    surprisingTruths: ["experience consistently outperforms material acquisition for long-term happiness", "the hedonic treadmill means most achievements return people to their baseline emotional state within months", "meaningful relationships are the single highest-returning investment for life satisfaction", "the people who report the highest life satisfaction have the clearest values — not the most success"],
    emotionalNeeds: ["to feel that their life is their own", "to experience genuine joy, not performed contentment", "to matter to the people they love", "to look back without significant regret"],
    powerQuestions: ["Are you building the life you want or the life others expect?", "What are you postponing until someday that deserves to start today?", "What would you change about your life if you weren't afraid of what people thought?", "If you could remove one thing from your life entirely, what would it be — and why haven't you?"],
    actionInsights: ["identify what you'd stop doing if money weren't a constraint — then find the constraint that isn't money", "design the default day before you design the exceptional moment", "every yes is a no to something else — audit your yeses", "the life you want is usually simpler than you're making it"],
    amplifiers: ["your daily experience of being alive", "the choices that quietly shape your days", "what you're optimizing your life toward", "the non-negotiables you've built your life around", "what lights you up vs what weighs you down", "how you want to be remembered"],
    underlyingDesire: "to feel fully alive, fully themselves, and fully present for the life they actually have",
    biggestFear: "looking back and realizing they lived someone else's version of a good life",
  },
};

function detectDomain(topic: string): string {
  const lower = topic.toLowerCase();
  let bestDomain = "lifestyle";
  let bestScore = 0;

  for (const [domain, cluster] of Object.entries(DOMAIN_CLUSTERS)) {
    const score = cluster.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }
  return bestDomain;
}

export function expandTopic(topic: string, variation: number): TopicExpansion {
  const domain = detectDomain(topic);
  const cluster = DOMAIN_CLUSTERS[domain];
  const v = variation % 5;

  const pickN = <T>(arr: T[], n: number, offset = 0): T[] => {
    const start = (v + offset) % arr.length;
    const result: T[] = [];
    for (let i = 0; i < Math.min(n, arr.length); i++) {
      result.push(arr[(start + i) % arr.length]);
    }
    return result;
  };

  return {
    domain,
    coreKeyword: topic,
    subtopics: pickN(cluster.subtopics, 3),
    commonMistakes: pickN(cluster.commonMistakes, 2, 1),
    contrarianAngles: pickN(cluster.contrarianAngles, 2, 2),
    surprisingTruths: pickN(cluster.surprisingTruths, 2, 3),
    emotionalNeeds: pickN(cluster.emotionalNeeds, 2),
    powerQuestions: pickN(cluster.powerQuestions, 2, 1),
    actionInsights: pickN(cluster.actionInsights, 3, 2),
    relatedAmplifiers: pickN(cluster.amplifiers, 3, v),
    underlyingDesire: cluster.underlyingDesire,
    biggestFear: cluster.biggestFear,
    contrarianHook: cluster.contrarianAngles[v % cluster.contrarianAngles.length],
  };
}

// ── Topic Decomposition System ─────────────────────────────────────────────────
// Converts raw user input into structured semantic components so the engine
// never treats the topic as a keyword to repeat — it treats it as a subject to understand.

export interface TopicComponents {
  rawTopic: string;
  mainSubject: string;
  semanticAliases: string[];
  audienceLabel: string;
  outcomePhrase: string;
  coreConcepts: string[];
}

function buildSemanticAliases(topic: string, domain: string, subtopics: string[], amplifiers: string[]): string[] {
  const t = topic.toLowerCase();
  const domainLabel = domain.charAt(0).toUpperCase() + domain.slice(1);
  const base: string[] = [
    subtopics[0] ?? domainLabel.toLowerCase(),
    subtopics[1] ?? "the core practice",
    amplifiers[0] ?? "this framework",
    amplifiers[1] ?? "this approach",
    "this work",
    "the practice",
  ];

  if (t.includes("youtube") || t.includes("video") || t.includes("channel"))
    base.push("video content", "channel growth", "YouTube marketing", "content-driven strategy");
  if (t.includes("money") || t.includes("income") || t.includes("earn") || t.includes("revenue"))
    base.push("income generation", "revenue building", "financial growth", "monetization strategy");
  if (t.includes("digital product") || t.includes("ebook") || t.includes("course") || t.includes("sell"))
    base.push("digital products", "online offerings", "knowledge products", "creator commerce");
  if (t.includes("weight") || t.includes("fat") || t.includes("lose") || t.includes("gym"))
    base.push("body composition", "fat loss", "metabolic health", "physical transformation");
  if (t.includes("business") || t.includes("startup") || t.includes("entrepreneur"))
    base.push("business building", "venture growth", "the business model");
  if (t.includes("mindset") || t.includes("belief") || t.includes("mental"))
    base.push("mental architecture", "belief systems", "cognitive patterns");
  if (t.includes("sleep") || t.includes("rest") || t.includes("recovery"))
    base.push("sleep quality", "recovery protocols", "rest optimization");
  if (t.includes("social media") || t.includes("instagram") || t.includes("tiktok"))
    base.push("social content", "platform growth", "audience building", "organic reach");
  if (t.includes("relationship") || t.includes("dating") || t.includes("marriage"))
    base.push("connection quality", "relationship dynamics", "emotional intimacy");
  if (t.includes("freelance") || t.includes("client") || t.includes("agency"))
    base.push("client work", "freelance business", "service delivery", "client acquisition");

  return [...new Set(base)].filter(Boolean);
}

function detectAudienceLabel(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes("beginner") || t.includes("start") || t.includes("new to") || t.includes("first time")) return "beginners";
  if (t.includes("advanced") || t.includes("expert") || t.includes("master")) return "advanced practitioners";
  if (t.includes("entrepreneur") || t.includes("founder") || t.includes("startup")) return "entrepreneurs";
  if (t.includes("creator") || t.includes("influencer") || t.includes("youtube")) return "content creators";
  if (t.includes("parent") || t.includes("mom") || t.includes("dad") || t.includes("kid")) return "parents";
  if (t.includes("leader") || t.includes("manager") || t.includes("executive")) return "leaders";
  if (t.includes("student") || t.includes("learn") || t.includes("study")) return "learners";
  if (t.includes("freelance") || t.includes("client") || t.includes("agency")) return "freelancers";
  return "practitioners";
}

export function parseTopicComponents(topic: string, expansion: TopicExpansion): TopicComponents {
  const aliases = buildSemanticAliases(topic, expansion.domain, expansion.subtopics, expansion.relatedAmplifiers);
  return {
    rawTopic: topic,
    mainSubject: expansion.domain,
    semanticAliases: aliases,
    audienceLabel: detectAudienceLabel(topic),
    outcomePhrase: expansion.underlyingDesire,
    coreConcepts: expansion.subtopics.slice(0, 4),
  };
}
