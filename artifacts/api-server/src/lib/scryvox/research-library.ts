// ── Domain Research Library ───────────────────────────────────────────────────
// Curated knowledge per domain: specific statistics, named frameworks, expert
// insights, counter-intuitive findings, and practitioner wisdom.
// These ground the engine's output in substantive, credible claims — not vague gestures.
// The result is content that feels researched, not generated.

export interface DomainResearch {
  statistics: string[];
  expertFrameworks: string[];
  counterIntuitives: string[];
  practitionerInsights: string[];
  specificExamples: string[];
  commonBeliefRealities: Array<{ belief: string; reality: string }>;
  groundingFacts: string[];
}

export const DOMAIN_RESEARCH: Record<string, DomainResearch> = {
  finance: {
    statistics: [
      "Behavioral research consistently shows the average investor underperforms their own funds by 1–2% annually — not from bad choices, but from buying high and selling low in response to emotion.",
      "Studies of savings behavior show that people who automate transfers to savings accumulate 2–3× more over a decade than those who save what's left at month's end — identical income, completely different outcomes.",
      "Research on compound growth consistently demonstrates that a 10% return starting at 25 produces roughly double the wealth of the same rate starting at 35 — the gap that's mathematically unfillable.",
      "Financial behavior research documents that most people overestimate their willpower and underestimate their spending by 20–30% when self-reporting — the gap that kills most financial plans before they start.",
      "Longitudinal studies of wealthy individuals consistently find that the majority built wealth through persistent, low-drama processes — not timing markets, not high-risk bets, not clever strategies.",
      "Research into financial stress shows it reduces cognitive capacity by the equivalent of losing 10–13 IQ points — which explains why bad financial decisions cluster during hard times, compounding the problem.",
    ],
    expertFrameworks: [
      "Charlie Munger called it the 'inversion principle': instead of asking how to build wealth, ask what consistently destroys it — and stop doing those things first. Most people never ask the second question.",
      "Warren Buffett's 'moat' framework translates personally: the equivalent of a business moat is skills no one else has combined the same way. Income follows scarcity, not effort alone.",
      "Morgan Housel's distinction between 'getting wealthy' and 'staying wealthy' is underrated — they require almost opposite behaviors. Getting wealthy rewards boldness. Staying wealthy rewards paranoia.",
      "The behavioral finance concept of 'mental accounting' — treating $100 from a tax refund differently from $100 earned — explains why people with the same net worth make wildly different financial decisions.",
      "Ramit Sethi's framework of 'conscious spending' reframes budgeting: instead of cutting everything, ruthlessly eliminate what you don't care about so you can spend extravagantly on what you do.",
    ],
    counterIntuitives: [
      "The counterintuitive truth about building wealth is that income is almost never the constraint — spending rate and time are. Someone earning $50k and saving 30% will consistently outperform someone earning $150k and saving 5%.",
      "Financial advisors who charge flat fees outperform those paid on commission — not because they're smarter, but because their incentives are aligned with yours rather than against them.",
      "The highest-returning 'investment' most people have access to isn't stocks or real estate — it's eliminating high-interest debt. A 20% credit card rate cleared is a guaranteed 20% return, which no market reliably produces.",
      "Most people intuitively believe more options lead to better financial decisions. Research consistently shows the opposite: decision fatigue from too many choices leads to worse outcomes and more procrastination.",
    ],
    practitionerInsights: [
      "Every experienced wealth builder I've seen operate with the same principle: spend on things that appreciate, cut ruthlessly on things that depreciate — and be ruthlessly honest about which is which.",
      "The practitioners who build real wealth rarely talk about it publicly. The ones talking the loudest are almost always selling something, which tells you most of what you need to know about the information diet.",
      "The single highest-leverage financial skill isn't investing, budgeting, or tax optimization — it's increasing your income ceiling. Everything else is allocation. Only income expansion changes the ceiling.",
      "Long-term investors consistently report the same lesson: they made their best decisions when they were bored and their worst decisions when they were excited. This is not a coincidence.",
    ],
    specificExamples: [
      "Think of the difference between two people: one who invests $200/month at 25, another who invests $400/month at 35. The first, at 65, has more money — despite putting in half as much total. The math is brutal and simple.",
      "The story of index fund investing isn't glamorous: buy everything, rebalance occasionally, ignore the noise. Jack Bogle spent his career arguing for something boring. The boring thing won.",
      "Look at the pattern of people who've built real long-term wealth: the asset they kept compounding was usually one thing done consistently for a very long time, not a portfolio of clever moves.",
    ],
    commonBeliefRealities: [
      {
        belief: "You need a high income to build wealth.",
        reality: "Income is a multiplier, not the foundation. The foundation is savings rate. A high income with low savings produces nothing. A moderate income with a high savings rate produces wealth.",
      },
      {
        belief: "You need to find the right investment strategy.",
        reality: "Consistency and time outperform strategy by a wide margin. The 'right' strategy executed inconsistently loses to the 'boring' strategy executed for decades.",
      },
      {
        belief: "Wealthy people take big risks.",
        reality: "Most lasting wealth is built through small, repeated advantages compounded over time. The big-risk stories are memorable precisely because they're rare.",
      },
    ],
    groundingFacts: [
      "The gap between knowing what to do financially and actually doing it is almost never an information problem — it's a behavior problem. Which is why more information rarely changes the outcome.",
      "Every decade of delay roughly halves the final outcome when compound growth is involved. This is not motivational language — it's arithmetic.",
    ],
  },

  health: {
    statistics: [
      "Research on habit formation shows that most behavioral change attempts fail within two weeks — not because of weak motivation, but because the environment wasn't changed to make the new behavior easy and the old one hard.",
      "Sleep research consistently shows that performance on cognitive tasks degrades after 17–19 hours of wakefulness to the equivalent of a blood alcohol level of 0.05% — impaired judgment without the social awareness that you're impaired.",
      "Exercise research shows that 3 sessions per week at moderate intensity produces roughly 80% of the physical benefits of 6 sessions per week — but with a fraction of the compliance failure rate.",
      "Longitudinal health studies consistently find that social connection is a stronger predictor of longevity than diet, exercise, or most medical interventions. It's among the most consistently overlooked health factors.",
      "Research on decision fatigue shows that willpower — to the extent it exists as a resource — depletes through the day. Health decisions made in the morning are systematically better than those made at night.",
      "Studies on metabolic health show that consistent sleep schedule — same bedtime and wake time — matters more than total sleep hours for most metabolic markers. Consistency beats duration.",
    ],
    expertFrameworks: [
      "Peter Attia's concept of 'the centenarian decathlon' reframes health optimization: instead of optimizing for current performance, ask what physical and cognitive capacities you need at 85 — then train backward from there.",
      "Andrew Huberman's emphasis on morning sunlight exposure — 10–30 minutes outdoors within an hour of waking — uses the biology of circadian rhythm to set the day's hormonal cascade. Simple, free, and remarkably effective.",
      "The principle of 'minimum effective dose' from Tim Ferriss's research: find the smallest input that produces the desired result and add nothing. Most health optimization fails by doing too much, not too little.",
      "Psychologist BJ Fogg's 'Tiny Habits' framework argues that motivation is not the right lever — design is. Make the behavior small enough that motivation is irrelevant, and it happens regardless.",
    ],
    counterIntuitives: [
      "The counterintuitive finding from longevity research: the single most predictive physical marker of long-term health is VO2 max — which is improved by zone 2 cardio, the kind most people skip because it feels too easy.",
      "Most nutrition research shows that meal timing matters less than people believe — but eating patterns (consistent vs erratic) matter considerably. What you eat consistently over years matters more than any single food choice.",
      "Recovery research shows that most athletes undertrain on easy days and undertrain on hard days — they cluster in a medium intensity that's too easy for adaptation and too hard for recovery. Most people face the same problem.",
      "Stress research has a counterintuitive finding: moderate, controllable stress (called 'eustress') improves health markers and longevity. The goal isn't stress elimination — it's stress with recovery.",
    ],
    practitionerInsights: [
      "Every experienced health practitioner I've observed focuses first on sleep before anything else — not because sleep is the only lever, but because sleep deprivation undermines every other intervention.",
      "The pattern among people who successfully transform their health long-term isn't discipline — it's environment design. They made the healthy option the default and the unhealthy option inconvenient.",
      "Practitioners who've worked with thousands of people consistently report: the client who tracks their behavior for the first 30 days almost always outperforms the one who relies on feeling. Feelings lag reality.",
      "The most successful long-term health outcomes come from people who stopped pursuing transformation and started pursuing maintenance — the unglamorous, consistent baseline that compounds over decades.",
    ],
    specificExamples: [
      "Think of the difference between someone who relies on motivation to exercise versus someone who scheduled it, laid out clothes the night before, and built it into a commute. Same person, completely different outcomes.",
      "The pattern in elite athlete longevity isn't volume or intensity — it's adaptability. Athletes who last decades are the ones who adjusted their approach when their body required it rather than forcing a method past its useful life.",
    ],
    commonBeliefRealities: [
      {
        belief: "Dramatic overhauls produce lasting change.",
        reality: "Research on behavior change consistently shows that massive, simultaneous changes have very high failure rates. One change at a time, made permanent, consistently outperforms the total reset.",
      },
      {
        belief: "If you're not sore, you didn't work hard enough.",
        reality: "Soreness is a measure of novelty, not effectiveness. Consistent, progressive training with proper recovery produces better long-term outcomes than soreness-chasing.",
      },
    ],
    groundingFacts: [
      "The most powerful health intervention isn't a protocol, supplement, or diet — it's consistency. Almost any reasonable approach, executed consistently over years, produces results. Almost no approach, executed inconsistently, does.",
      "Most health problems that show up in middle age were being built for a decade before any symptom appeared. Which is the argument for early intervention, not crisis management.",
    ],
  },

  productivity: {
    statistics: [
      "Research by Cal Newport and cognitive scientists shows that the average knowledge worker switches tasks every 3–5 minutes and takes up to 23 minutes to regain full focus after an interruption. Most 'productive' days involve almost no deep work.",
      "Studies on decision-making show that the number of high-quality decisions a person makes per day is finite — and exhausted earlier than most realize. Which is why successful people often wear the same thing every day.",
      "Time-tracking research shows that most people overestimate how productively they spend their time by 50–100%. What feels like 6 productive hours is usually 2–3 hours of actual focused output surrounded by activity.",
      "Research on task switching shows that multitasking reduces IQ by an average of 10 points during the task — comparable to losing a night of sleep — while producing the subjective feeling of high productivity.",
    ],
    expertFrameworks: [
      "Cal Newport's 'deep work' framework distinguishes between shallow work (email, meetings, logistics) and deep work (focused, cognitively demanding tasks that create real value). Most people's days are 90% shallow.",
      "David Allen's 'GTD' principle that 'your brain is for having ideas, not holding them' — the moment you trust a system outside your head to capture everything, cognitive load drops and focus increases.",
      "The Eisenhower Matrix's most underused quadrant is Q2 — important but not urgent. That's where strategy, relationships, and skill-building live. Most people spend their time in Q1 (urgent crises) and Q4 (distraction).",
      "Paul Graham's concept of 'maker schedule vs manager schedule' explains why creative work and meetings are fundamentally incompatible: makers need blocks of 3–4 hours; managers need 1-hour slots. Mixing them destroys both.",
    ],
    counterIntuitives: [
      "Counter-intuitively, the most productive people aren't those who work the most hours — they're those who've identified the 20% of inputs producing 80% of outputs and protected time for those inputs ruthlessly.",
      "Research on flow states shows they require a specific condition: challenge slightly above current skill level. Too easy produces boredom; too hard produces anxiety. Neither produces flow. Most people never deliberately engineer this.",
      "The productivity practice with the strongest research backing isn't a technique at all — it's sleep. No productivity system compensates for consistent sleep deprivation, yet most productivity culture treats sleep as something to optimize away.",
      "Studies on deadline psychology show that work expands to fill the time available. Aggressive, slightly uncomfortable deadlines produce better output in less time than generous ones — a finding most people resist because it's uncomfortable.",
    ],
    practitionerInsights: [
      "Every genuinely high-output person I've studied has some version of the same practice: they protect the first 1–2 hours of their day for their most important, cognitively demanding work before the world gets access to them.",
      "The practitioners who consistently produce quality work long-term are almost never the ones chasing productivity hacks. They're the ones who identified the few things that matter and built systems to do those things repeatedly.",
      "The single most effective productivity change most people could make has nothing to do with technique: turn off notifications. Not 'manage them' — eliminate them. The productivity gain is immediate and compounding.",
      "Long-term high performers consistently report that their best work came from doing less, not more — cutting projects, commitments, and responsibilities until they had full attention for the ones that remained.",
    ],
    specificExamples: [
      "Think of the difference between a day with three uninterrupted 90-minute blocks versus a day with 12 one-hour meetings. The first produces real work. The second produces the feeling of productivity without the output.",
      "Warren Buffett's 'two-list strategy' — write your top 25 goals, circle the 5 most important, then actively avoid everything on the remaining 20 — is an extreme version of the elimination principle that most high performers apply.",
    ],
    commonBeliefRealities: [
      {
        belief: "Being busy means being productive.",
        reality: "Busyness is often the enemy of productivity. High activity can mask low output. The distinction between being busy and being productive is one of the most important a knowledge worker can make.",
      },
      {
        belief: "You need motivation to start.",
        reality: "Research consistently shows that action precedes motivation, not the reverse. Starting — even badly — generates the momentum that motivation is supposed to provide.",
      },
    ],
    groundingFacts: [
      "The compounding effect of 1% daily improvement is cited so often it's become a cliché — but the math is real: 1% better every day for a year is 37× better than where you started.",
      "Most productivity systems fail not because they're wrong but because they're never fully installed. The system that gets used consistently — even if suboptimal — outperforms the perfect system used sporadically.",
    ],
  },

  business: {
    statistics: [
      "Research on startup failure rates consistently shows that more companies fail from building something nobody wants than from poor execution. The product-market fit problem is larger than the operational problem — by a significant margin.",
      "Studies on entrepreneurial decision-making show that founders who pivot based on customer feedback outperform those who execute their original vision, across almost every industry and scale.",
      "Research on pricing psychology shows that most founders dramatically underprice — and that raising prices by 20–40% reduces the customer volume by far less than expected while significantly improving business health.",
      "Customer acquisition research consistently shows that retaining an existing customer costs 5–7× less than acquiring a new one — and that most businesses invest the opposite ratio in their marketing spend.",
    ],
    expertFrameworks: [
      "Clayton Christensen's 'jobs to be done' framework reframes what businesses actually sell: customers don't buy products, they hire them to do a job. Understanding the job changes everything about how you market, price, and build.",
      "Paul Graham's 'do things that don't scale' principle for early-stage businesses: the willingness to do unglamorous, manual work to understand customers is what separates companies that find product-market fit from those that don't.",
      "Michael Porter's competitive strategy framework reduces to one question: what would you have to do so well that customers would choose you, specifically, over every alternative? The answer to that question is your strategy.",
      "Alex Hormozi's 'value equation' — the ratio of perceived value to perceived cost — explains why most products that fail aren't bad products; they're well-built products with a communication problem.",
    ],
    counterIntuitives: [
      "The counterintuitive truth about pricing: customers who pay more are typically better customers — more committed, less likely to churn, less demanding, more likely to refer. Competing on price often attracts the worst customers.",
      "Most founders believe more features make a better product. Research consistently shows that the successful products in almost every category do fewer things better — specificity creates preference, not breadth.",
      "The single most common growth mistake isn't insufficient marketing — it's building for an audience that's too broad. Niche specificity creates virality because specific products solve real problems that referral-worthy.",
      "Research on founder performance shows that serial entrepreneurs who failed on their first venture outperform first-time founders on subsequent ventures — but only if they've processed what went wrong honestly.",
    ],
    practitionerInsights: [
      "Every experienced operator I've seen build a real business has this in common: they talk to customers obsessively, not as a phase but as a permanent practice. Customer proximity is a competitive advantage.",
      "The businesses that survive long enough to become interesting share one trait: they maintained enough cash to stay alive through the inevitable rough patches. Profitability matters less than not dying.",
      "Experienced founders consistently report the same mistake: hiring too early for the wrong roles. The first hires should directly generate revenue or radically reduce founder time on critical work — everything else is overhead.",
      "The practitioners who build enduring businesses are almost never the most exciting ones in public. They're executing boring, well-understood processes very consistently while competitors chase novelty.",
    ],
    specificExamples: [
      "Basecamp/37signals' decision to stay small and profitable while competitors raised hundreds of millions is a deliberate counter-example: they built a product that's been generating real revenue for two decades without venture capital.",
      "The pattern in businesses that cross from 'promising' to 'real': they found one channel that worked, ignored everything else until it broke, then found a second. Sequencing beats parallelism in early-stage growth.",
    ],
    commonBeliefRealities: [
      {
        belief: "You need investment to build a real business.",
        reality: "Bootstrapped businesses are often more durable than venture-backed ones — they're required to generate revenue from day one, which forces a clarity that external funding often delays.",
      },
      {
        belief: "The best product wins.",
        reality: "Distribution usually outperforms product quality. The second-best product with superior distribution beats the best product with no distribution — almost every time.",
      },
    ],
    groundingFacts: [
      "The difference between a business and a project is whether it generates enough revenue to sustain itself without constant external input. Most things people call businesses are actually projects.",
      "The most consistently successful customer acquisition strategy across industries, time periods, and company sizes is referral — because trust transfers. Everything else is working against friction that referrals eliminate.",
    ],
  },

  learning: {
    statistics: [
      "Memory research by Hermann Ebbinghaus documented the 'forgetting curve': without reinforcement, 40–80% of new information is lost within a week. Spaced repetition is the only intervention shown to meaningfully counteract this.",
      "Studies on skill acquisition show that passive reading produces roughly 10% retention after 72 hours. Teaching what you've learned to someone else produces 90%. The difference is active recall and explanation.",
      "Research on deliberate practice — Ericsson's foundational studies — shows that what separates experts from experienced practitioners isn't years in the field but hours of focused, feedback-rich practice on specific weaknesses.",
      "Cognitive load research shows that learning is maximized when material is at the outer edge of current ability — challenging enough to require effort but not so difficult it produces shutdown. This 'desirable difficulty' is deliberate.",
    ],
    expertFrameworks: [
      "Anders Ericsson's 'deliberate practice' framework distinguishes between naive practice (doing something repeatedly) and deliberate practice (working on specific weaknesses with immediate feedback). Naive practice rarely produces expertise.",
      "Richard Feynman's learning technique: explain what you know to a child. Where the explanation breaks down is exactly where your understanding breaks down — it's more diagnostic than any test.",
      "Scott Young's 'ultralearning' principle of 'directness': learn the thing by doing the thing, as close to the actual application as possible. Most learning fails because it's too abstracted from the real use case.",
      "Carol Dweck's growth mindset research shows that students who believe intelligence is fixed avoid challenges to protect their self-image; those who believe it's malleable seek challenges. The belief is self-fulfilling.",
    ],
    counterIntuitives: [
      "Counter-intuitively, the most effective learning strategy is also the most unpleasant: testing yourself before you feel ready. The discomfort of not knowing the answer encodes the correct answer more deeply than re-reading does.",
      "Research on interleaving — mixing different problem types — shows it produces slower initial learning but dramatically better long-term retention than 'blocking' (doing all of one type before moving to another).",
      "The feeling of fluency — where material feels familiar — is a notoriously unreliable signal of actual learning. What feels like mastery is often just recognition, which is far weaker than recall under pressure.",
      "Studies on note-taking show that typing notes produces faster, more complete transcription — and significantly worse retention than handwriting, because handwriting forces reprocessing and synthesis.",
    ],
    practitionerInsights: [
      "Every person I've seen become genuinely skilled at something has the same practice: they identify what they can't do, work specifically on that, and measure improvement — rather than doing what they're already good at more often.",
      "The learners who outpace their peers aren't those who study more hours — they're those who build more feedback loops. Getting corrected faster and more often produces faster learning than more time with no feedback.",
      "The most effective learning environment isn't the most comfortable one. Regular discomfort — not pain, not chaos, but productive struggle — is the signal that real learning is happening.",
      "The practitioners who develop expertise fastest are those who teach early — long before they feel qualified. Teaching forces precision, surfaces gaps, and accelerates the feedback loop on what you actually understand.",
    ],
    specificExamples: [
      "Josh Waitzkin's account of learning in 'The Art of Learning' describes the pattern: find the weakest piece, work obsessively on that piece, integrate it, then find the next weakest. Progress in non-linear chunks, not smooth gradients.",
      "The pattern in polyglots — people who speak 6+ languages — is striking: they're not more gifted at languages. They're more comfortable being incompetent in public, which accelerates feedback loops that most people avoid.",
    ],
    commonBeliefRealities: [
      {
        belief: "You need to understand something before you practice it.",
        reality: "Research consistently shows that practice before full understanding often produces better long-term learning. Struggling with a problem before seeing the solution makes the solution encode more deeply.",
      },
      {
        belief: "Smart people learn faster.",
        reality: "Raw cognitive ability is a much smaller predictor of skill acquisition than deliberate practice quality and feedback loop speed. Consistency and method consistently outperform raw talent.",
      },
    ],
    groundingFacts: [
      "The compound interest of learning works the same way as financial compound interest: the more you know, the more new information has something to attach to, and the faster new learning integrates.",
      "The gap between knowing what to do and actually doing it is the whole problem with learning. The information is rarely the constraint — the practice hours are.",
    ],
  },

  mindset: {
    statistics: [
      "Research on cognitive reappraisal — consciously reframing how you interpret a situation — shows it reduces stress responses more effectively than suppression, which increases physiological stress while reducing visible expression.",
      "Studies on locus of control show that people who believe outcomes are within their influence (internal locus) consistently outperform those who believe outcomes are determined by external forces — across health, career, and relationships.",
      "Psychological research documents the 'self-serving bias': people attribute successes to themselves and failures to external circumstances. The inverse — owning failures while recognizing luck in success — is rare and appears to predict long-term growth.",
      "Research on the negativity bias shows that the brain processes negative information 3–5× more deeply than positive information of equal weight — which explains why criticism lands harder than praise, and requires deliberate counterbalancing.",
    ],
    expertFrameworks: [
      "Epictetus' dichotomy of control — some things are within our power, some are not — is 2,000 years old and still among the most practically useful mental frameworks. Most anxiety comes from trying to control the uncontrollable.",
      "Martin Seligman's 'learned helplessness' research shows that repeated exposure to uncontrollable outcomes teaches the brain to stop trying — even when situations change. This pattern can be interrupted, but it has to be deliberately interrupted.",
      "Daniel Kahneman's System 1/System 2 framework — fast, automatic thinking versus slow, deliberate thinking — explains why good decisions are hard under stress: System 1 dominates in high-stakes moments and is biased toward familiar, comfortable patterns.",
      "Carol Dweck's growth mindset distinction matters most at the boundaries: where you place your identity determines where you'll stop. Fixed mindset people protect the identity; growth mindset people update it.",
    ],
    counterIntuitives: [
      "The counterintuitive finding from resilience research: the people who recover best from adversity aren't those who never feel negative emotions — they're those who process them quickly and completely without rumination.",
      "Positive thinking research has a mixed record. What consistently works isn't positive thinking but 'process visualization' — imagining the steps required to reach a goal rather than imagining the goal itself achieved.",
      "Research on motivation shows that external rewards can undermine intrinsic motivation — people who were intrinsically motivated to draw became less motivated when paid to draw. Attaching money to love can diminish the love.",
      "The relationship between confidence and competence is not what most people assume: confidence often follows competence, not the reverse. Starting before you feel confident is the mechanism that generates the confidence.",
    ],
    practitionerInsights: [
      "Every person I've observed genuinely transform their thinking has gone through a similar process: they identified a belief that was producing consistent pain, examined the evidence for it, and updated it — not permanently, but repeatedly.",
      "The mindset shift with the most practical downstream effects isn't optimism or positivity — it's agency. The belief that your actions change outcomes, even imperfectly, is the one that moves everything else.",
      "The practitioners with the most durable mindset aren't those who never doubt — they're those who've developed the habit of distinguishing productive from unproductive thinking without suppressing either.",
      "Long-term high performers consistently report the same practice: they audit their self-talk not for positivity, but for accuracy. Inaccurate negative self-talk is the thing to fix, not the negative affect.",
    ],
    specificExamples: [
      "Viktor Frankl's account of Auschwitz survival is the extreme case: meaning-making in impossible circumstances was what determined psychological survival. The freedom to choose a response to circumstance couldn't be taken.",
      "The pattern in elite athletes' psychology isn't absence of fear or doubt — it's a practiced relationship with both. Michael Jordan famously missed thousands of shots. The willingness to keep shooting was the practice.",
    ],
    commonBeliefRealities: [
      {
        belief: "Positive thinking is the key to success.",
        reality: "Research shows what works is 'mental contrasting' — holding both the desired outcome and the realistic obstacles in mind simultaneously. Pure positive thinking suppresses useful information about what might go wrong.",
      },
      {
        belief: "High achievers don't struggle with self-doubt.",
        reality: "Research on imposter syndrome shows it's most prevalent among high achievers — not because they're deficient, but because they're accurate about the gap between what they know and what there is to know.",
      },
    ],
    groundingFacts: [
      "The mind treats imagined threats the same way it treats real ones — same stress hormones, same physiological response. Managing what you give your attention to is, in that sense, a health practice.",
      "The evidence for neuroplasticity — the brain's capacity to physically change in response to experience — is now robust. The implication: you are not stuck with the thinking patterns you have. But changing them requires practice, not insight.",
    ],
  },

  relationships: {
    statistics: [
      "John Gottman's longitudinal research on couples showed he could predict divorce with over 90% accuracy from 3-minute conversations — not from what couples argued about, but from the ratio of positive to negative interactions (5:1 for stable couples).",
      "Research on loneliness shows it increases mortality risk by 26% — comparable to smoking 15 cigarettes a day. Social connection isn't a nice-to-have for humans; it's a biological requirement.",
      "Studies on communication show that content — what we say — accounts for roughly 7% of emotional impact. Tone and body language account for the rest. Which means the most accurate things said in the wrong tone often don't land.",
      "Research on relationships and career outcomes shows that your network — not your credentials or talent — predicts a surprisingly large portion of career success. This is not cynical; it reflects how trust and opportunity actually move.",
    ],
    expertFrameworks: [
      "Gottman's 'Four Horsemen' framework — criticism, contempt, defensiveness, stonewalling — identifies the four communication patterns most predictive of relationship failure. Contempt is the most toxic: it communicates disrespect rather than displeasure.",
      "Adam Grant's 'giver, taker, matcher' framework: givers who give strategically (helping people who will use that help to help others) outperform both takers and matchers — but only if they don't give to takers indiscriminately.",
      "Brené Brown's research on vulnerability shows that the willingness to be seen imperfectly is correlated with the depth and durability of connection. Invulnerability creates distance; it doesn't protect.",
      "Robert Cialdini's principle of reciprocity — people feel obligated to return favors — operates on trust, not just social obligation. Authentic giving generates authentic reciprocity. Calculated giving generates calculation.",
    ],
    counterIntuitives: [
      "Counter-intuitively, the research on conflict in relationships shows that couples who avoid conflict entirely have worse outcomes than those who fight productively. Avoidance prevents resolution; productive conflict clarifies.",
      "The research on loneliness is striking: adding more people to your social network doesn't reliably reduce loneliness. Quality of connection predicts loneliness reduction; quantity often doesn't.",
      "Research on support — what people actually want when they share a problem — consistently shows they want to feel heard before they want advice. Advice given before acknowledgment is often rejected even when it's good.",
      "Studies on first impressions show they form within 100 milliseconds and are remarkably sticky. More importantly: they're mostly assessed on warmth and competence — not credentials, not accomplishments.",
    ],
    practitionerInsights: [
      "The pattern in the strongest professional relationships I've observed is always the same: one person made a genuine effort to understand what the other was working on and asked a good question about it.",
      "The most reliably relationship-building behavior is showing up consistently when it's low-stakes. People remember who was there when nothing was required of them — and those relationships are the first called in a crisis.",
      "The practitioners who build the largest genuine networks don't 'network' — they contribute to communities, help without asking for anything, and let relationships form around shared interests rather than transactions.",
      "Long-term relationship quality — in any context — is determined more by how conflict is handled than by how easy things are when there's no conflict. The hard moments reveal and build the real relationship.",
    ],
    specificExamples: [
      "The research on 'small talk aversion' is fascinating: people consistently predict they'll enjoy deep conversations more than small talk — and are consistently wrong. Small talk with a stranger turns out to produce more positive affect than expected.",
      "The pattern in long-term friendships that survive career changes, moves, and life disruptions: someone kept reaching out when there was no particular reason to. Durability is maintained through small, consistent acts of attention.",
    ],
    commonBeliefRealities: [
      {
        belief: "Good relationships require constant work.",
        reality: "Good relationships require consistent attention — which is different from constant effort. Small, regular investments outperform intensive but infrequent ones.",
      },
      {
        belief: "Opposites attract and make the best couples.",
        reality: "Research on long-term relationship satisfaction consistently shows similarity — in values, attachment style, and communication approach — predicts durability better than complementarity.",
      },
    ],
    groundingFacts: [
      "The most powerful sentence in most conversations isn't an argument or a compliment — it's 'that makes sense.' It signals understanding, and understanding is what most people are actually seeking.",
      "The quality of your relationships is, in a measurable way, the quality of your life. This isn't sentiment — it's one of the most replicated findings in happiness research across cultures and decades.",
    ],
  },

  lifestyle: {
    statistics: [
      "Research on hedonic adaptation — the tendency to return to a baseline emotional state after positive or negative events — shows that most major life changes (income increases, life upgrades) produce short-term improvement that fades within months.",
      "Studies on life satisfaction consistently show that above $75,000–$100,000 in household income, additional income has diminishing returns on day-to-day emotional well-being (though it continues to affect 'life evaluation' on surveys).",
      "Time use research shows that people who have more discretionary time than they need actually report lower well-being — suggesting that purposeful structure contributes to satisfaction, not just freedom from obligation.",
      "Research on experience vs material goods shows experiences produce more lasting satisfaction — in part because they're harder to compare and depreciate, and in part because they're shared with others.",
    ],
    expertFrameworks: [
      "Tim Ferriss's 'lifestyle design' framework inverts the conventional sequence: instead of building a career first and designing life around what's left, design the life first and build the income to fund it.",
      "Oliver Burkeman's 'Four Thousand Weeks' framework reframes time: you have roughly 4,000 weeks in a human life. Making peace with finitude — choosing deliberately rather than optimizing everything — is the practice.",
      "Csikszentmihalyi's 'flow' framework: the conditions for psychological happiness aren't relaxation or pleasure, but engagement with a challenge that matches skill level. Vacation often produces less well-being than good work.",
      "Annie Dillard's principle: 'How we spend our days is how we spend our lives.' Not the dramatic decisions — the daily structure, the defaults, the ordinary Tuesday.",
    ],
    counterIntuitives: [
      "Counter-intuitively, research on leisure shows that unstructured free time is often less enjoyable than structured free time — people are happier watching a movie they planned than one they stumbled on.",
      "The research on 'more options' is consistently surprising: beyond a moderate number of choices, more options produce more dissatisfaction. Barry Schwartz calls this the 'paradox of choice' — the more you could have chosen, the harder it is to appreciate what you chose.",
      "Studies on 'ideal day' simulations show that people's imagined ideal life looks radically different from their actual choices — they report wanting more nature, more conversation, more slow mornings. But their actual behavior contradicts this at nearly every point.",
      "Research on purpose shows that people who describe their work as a 'calling' — regardless of the work itself — report higher life satisfaction than those who describe the same work as a job. The frame matters more than the content.",
    ],
    practitionerInsights: [
      "Every person I've seen build a life they actively love has one thing in common: they defined it explicitly first. Not as a general aspiration but as a specific image of what the good day looks like — and then built toward that.",
      "The lifestyle change with the highest leverage is almost never the dramatic one. It's usually something small: the morning practice, the boundary that holds, the relationship maintained. Compound interest applies here too.",
      "The practitioners who seem most genuinely content are consistently those who've stopped benchmarking against others and started benchmarking against their own stated values. The comparison game has no win condition.",
      "Long-term well-being research points at the same few variables repeatedly: meaningful work, quality relationships, physical health, and a sense of purpose. No lifestyle optimization outside those quadrants produces durable improvement.",
    ],
    specificExamples: [
      "The difference between the person who says 'I want to travel more' and the one who actually does is almost never financial — it's usually a matter of decision architecture: they booked the flight before they were ready.",
      "The pattern in people who describe their lives as genuinely good isn't a common set of circumstances — it's a common orientation: they've decided to notice what's working rather than cataloging what isn't.",
    ],
    commonBeliefRealities: [
      {
        belief: "More freedom produces more happiness.",
        reality: "Research shows that unconstrained freedom is often experienced as anxiety, not liberation. People tend to be happiest when they have freedom within meaningful structure.",
      },
      {
        belief: "You can have it all — career, relationships, health, passion projects.",
        reality: "At any given life stage, a few things get full attention and the rest get maintenance. The question isn't how to have everything — it's which season you're in and what it calls for.",
      },
    ],
    groundingFacts: [
      "The well-studied concept of 'anticipated utility' shows that what we think will make us happy and what actually makes us happy are often different. The implication: test before optimizing.",
      "The most enduring lifestyle satisfaction comes from alignment between stated values and actual choices — not from accomplishment, accumulation, or status. The gap between who you are and who you say you are is where dissatisfaction lives.",
    ],
  },
};

// ── Research Access Functions ──────────────────────────────────────────────────

export function getResearchForDomain(domain: string): DomainResearch {
  return DOMAIN_RESEARCH[domain] ?? DOMAIN_RESEARCH.lifestyle;
}

export function pickResearch(domain: string, category: keyof DomainResearch, index: number): string {
  const research = getResearchForDomain(domain);
  const arr = research[category] as string[];
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr[Math.abs(index) % arr.length];
}

export function pickBeliefReality(domain: string, index: number): { belief: string; reality: string } | null {
  const research = getResearchForDomain(domain);
  const arr = research.commonBeliefRealities;
  if (!arr || arr.length === 0) return null;
  return arr[Math.abs(index) % arr.length];
}
