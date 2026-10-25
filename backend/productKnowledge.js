/**
 * productKnowledge.js
 * Product knowledge base for Meridian Growth Partners.
 * Used by the AI to generate accurate, product-specific response suggestions.
 */

module.exports = {
  company: 'Meridian Growth Partners',
  location: 'Hyderabad, India',
  tagline: 'India\'s trusted growth consulting partner for manufacturers and B2B businesses',

  whatWeDo: `We are a growth consulting firm that helps Indian manufacturers, exporters, and B2B companies
scale their revenue through structured sales systems, market expansion strategies, and leadership coaching.
We work hands-on inside the client's business — not just as advisors who hand over reports.`,

  services: [
    {
      name: 'Sales Acceleration Programme',
      duration: '90 days',
      desc: 'Build and train a high-performance B2B sales team from scratch or restructure an existing one. Includes call scripts, qualification frameworks, and weekly coaching.',
      bestFor: 'Companies with a sales team that isn\'t hitting targets',
    },
    {
      name: 'Market Expansion Playbook',
      duration: '60–90 days',
      desc: 'Enter new geographies (domestic or export markets) with a proven playbook. Includes prospect lists, pricing strategy, and pilot campaigns.',
      bestFor: 'Manufacturers wanting to add new customer segments or export markets',
    },
    {
      name: 'Revenue Discovery Sprint',
      duration: '30 days',
      desc: 'A rapid 30-day audit to identify and plug revenue leaks — missed follow-ups, wrong pricing, untapped segments, and poor conversion points.',
      bestFor: 'Founders who feel revenue is stagnant despite effort',
    },
    {
      name: 'Founder & Sales Head Coaching',
      duration: 'Ongoing monthly',
      desc: 'One-on-one coaching for founders and sales directors on strategic decision-making, deal reviews, and team management.',
      bestFor: 'Leaders who want a thinking partner for growth decisions',
    },
    {
      name: 'Growth Research Report',
      duration: 'Free initial offering',
      desc: 'A complimentary, customised 8-page research report on the client\'s industry — growth trends, competitor benchmarks, and three actionable opportunities. This is our conversation starter.',
      bestFor: 'Any manufacturer or B2B company — no commitment required',
    },
  ],

  pricing: {
    model: 'Project-based retainer, scoped to the engagement.',
    range: 'Typical range: ₹1.5 lakhs to ₹8 lakhs for a 90-day programme.',
    roi: 'Average client ROI is 5–10x within 6 months of the engagement.',
    flexibility: 'We adjust scope and pace for companies at different growth stages.',
    paymentTerms: '50% upfront, 50% on milestone delivery.',
    note: 'The free Growth Research Report has zero cost and zero obligation.',
  },

  keyBenefits: [
    'Average 38% revenue increase within 6 months for clients who complete a 90-day programme',
    'Proprietary SEED Framework — built from 500+ B2B sales engagements across India',
    'Dedicated senior consultant assigned — the same person, not rotated juniors',
    'Weekly check-ins, real-time WhatsApp support between sessions',
    'Industry-specific playbooks: auto components, textiles, chemicals, food processing, engineering goods',
    'All strategies tested in the Indian market — not copied from US/UK models',
  ],

  proofPoints: [
    'Auto-parts manufacturer in Pune — 65% revenue growth in 8 months after Sales Acceleration Programme',
    'Textile exporter in Surat — successfully opened EU and North American markets in 6 months',
    'Chemical distributor in Hyderabad — sales cycle reduced by 40%, team conversion rate doubled',
    'Food processing company in Bangalore — added ₹2.4 crore annual revenue from a new B2B channel',
    '120+ manufacturing companies served across 18 Indian states since 2019',
  ],

  commonObjections: [
    {
      objection: 'We already have a sales team / We are managing on our own',
      response: 'That\'s great — we don\'t replace your team, we make them significantly more effective. Most of our clients had a team before us; the issue was the system behind the team. We add the structure and training that turns effort into consistent results.',
    },
    {
      objection: 'This seems expensive / We don\'t have budget',
      response: 'I understand. The way our clients see it — if the programme helps add even ₹20 lakhs in new revenue, the fee pays for itself many times over. That\'s why we always start with the free research report: it shows you the opportunity before you spend anything. No risk.',
    },
    {
      objection: 'Not the right time / We are busy right now',
      response: 'I hear that completely. The founders who say that are often the ones who need it most — busy without enough revenue to show for it. The report takes no time from you; our team does all the research. It might be the most valuable half-hour you spend this quarter.',
    },
    {
      objection: 'We tried consultants before and it didn\'t work',
      response: 'That\'s a fair concern and I\'m glad you mentioned it. Most consulting relationships fail because they deliver reports and walk away. We work inside your team — we\'re on calls with you, reviewing deals, training your people. If you\'re open, I\'d love to share how one of our clients said the same thing before their best growth year.',
    },
    {
      objection: 'Send me a brochure / email / WhatsApp something first',
      response: 'Of course — I\'ll send you the research overview on WhatsApp right after this call. But can I ask — if the report shows two or three clear growth opportunities for your segment, would you be open to a 20-minute call to discuss them? That\'s all I\'m asking for.',
    },
    {
      objection: 'We are not looking for growth right now',
      response: 'Understood. May I ask — is that because the current business is where you want it, or because growth feels uncertain right now? Even if you don\'t engage us, the research report might give you useful benchmarks for where your segment is heading.',
    },
    {
      objection: 'What is in it for you? What is your business model?',
      response: 'Honest question — thank you. We make money when clients engage us for the consulting programme after reading the report. The report itself is free, genuinely. We believe if we show you real value upfront, you\'ll want to work with us. That\'s our entire model.',
    },
    {
      objection: 'I am not the right person / Talk to someone else',
      response: 'No problem at all. Who would be the best person to share this research with — is it the MD, the sales head, or someone in business development? I\'ll reach out to them directly so I don\'t waste anyone\'s time.',
    },
  ],

  coldCallScript: {
    opening: 'Good morning, am I speaking with [Name]? My name is [Caller] calling from Meridian Growth Partners, Hyderabad.',
    purpose: 'We work with manufacturers like yourself — we\'ve just completed a short research study on growth trends in your sector, and I wanted to share a copy with you, at no cost. It takes about 2 minutes to explain.',
    permission: 'Do you have just 2 minutes now, or should I call at a better time?',
    nextStepAsk: 'Can I share the report on WhatsApp? It\'s 8 pages and quite specific to your segment. It usually triggers a good conversation.',
  },

  idealCustomer: 'Indian manufacturers, B2B exporters, and industrial suppliers with 20–500 employees and ₹5 crore to ₹200 crore turnover who want to grow revenue without hiring a large team.',
};
