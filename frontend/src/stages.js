/**
 * stages.js
 * All 8 cold-call stages for Meridian Growth Partners.
 * Content derived from reading 100 real call transcripts.
 *
 * Caller: Meridian Growth Partners (Hyderabad-based growth consulting firm)
 * Prospect: Founders, CEOs, Directors of Indian mid-size manufacturers
 * Pitch: Growth research report → consulting engagement
 */

export const STAGES = [
  {
    number: 1,
    name: 'Opening',
    purpose: 'Reach the right person and say who you are. The prospect decides in the first few seconds whether to keep listening.',
    theyMaySay: [
      '"Who is this? From where are you calling?"',
      '"He is not available right now. Can you call back?"',
      '"What is this regarding? Tell me now."',
    ],
    whatHappenedOptions: [
      'Reached the right person',
      'Gatekeeper answered',
      'Wrong number / person left',
      'Call back later',
    ],
    nextStage: 2,
  },
  {
    number: 2,
    name: 'Purpose',
    purpose: 'Say why you called in one or two sentences the prospect can repeat to a colleague.',
    theyMaySay: [
      '"From where? I did not get the company name."',
      '"I have not asked for a growth report."',
      '"Are you a research company, or a consulting firm?"',
    ],
    whatHappenedOptions: [
      'Understood the purpose',
      'Asked what we do',
      'Questioned our motive',
      'Asked how it\'s free',
    ],
    nextStage: 3,
  },
  {
    number: 3,
    name: 'Permission',
    purpose: 'Find out if they are willing to talk now. A clear yes, a clear no, or a time to call back are all good outcomes.',
    theyMaySay: [
      '"I am not able to talk right now. Call me next week."',
      '"Okay, go ahead."',
      '"Send it on WhatsApp and we will see."',
    ],
    whatHappenedOptions: [
      'Clear yes – talking now',
      'Call back later',
      'Send first, talk later',
      'Kept talking (no clear answer)',
    ],
    nextStage: 4,
  },
  {
    number: 4,
    name: 'Their Business',
    purpose: "Ask about their company and their work before saying anything about yours. People talk about what they do.",
    theyMaySay: [
      '"We are only manufacturing. We do not have an R&D team."',
      '"We work with the government only – not sure how you can help."',
      '"What do you need to know? Tell me what you want."',
    ],
    whatHappenedOptions: [
      'Shared company context',
      'Corrected my assumption',
      'Said not relevant to them',
      'Asked me to pitch first',
    ],
    nextStage: 5,
  },
  {
    number: 5,
    name: 'Their Need',
    purpose: 'Hear what they are trying to do or struggling with, in their own words. Write down exactly what they say.',
    theyMaySay: [
      '"My customers are pushing for sustainability – that is my focus now."',
      '"We want to expand exports to Europe and the US."',
      '"Everything is running fine. I do not see a need right now."',
    ],
    whatHappenedOptions: [
      'Named a clear goal',
      'Named a pain point',
      'Said no current need',
      'Turned it around – asked what I can do',
    ],
    nextStage: 6,
  },
  {
    number: 6,
    name: 'Objection',
    purpose: 'Hear the reason for a hesitation or no. A reason you understand can be answered now or on the next call.',
    theyMaySay: [
      '"I am not the right person. Talk to our business development team."',
      '"Send something in writing and we will review it."',
      '"What is in it for you? I do not see your angle."',
    ],
    whatHappenedOptions: [
      'Wrong person – referred someone',
      'Asked to send in writing',
      'Questioned our business model',
      'No budget / no interest now',
    ],
    nextStage: 7,
  },
  {
    number: 7,
    name: 'Next Step',
    purpose: 'Agree on one concrete thing: a document on WhatsApp, a call at a named time, a meeting with the founder.',
    theyMaySay: [
      '"Send it on WhatsApp. I will go through it."',
      '"Call me on Tuesday morning. We can discuss then."',
      '"Speak to Mr. Suresh. I will give you his number."',
    ],
    whatHappenedOptions: [
      'Report on WhatsApp agreed',
      'Call back time agreed',
      'Meeting with founder set',
      'Referred to colleague',
    ],
    nextStage: 8,
  },
  {
    number: 8,
    name: 'Close',
    purpose: 'End the call clearly. Record the outcome, the next step, and the prospect\'s exact words from stage 5.',
    theyMaySay: [
      '"Okay, thank you. Have a good day."',
      '"Not interested – thank you for asking."',
      '"Let\'s connect again. I will be in touch."',
    ],
    whatHappenedOptions: [
      'Interested – follow-up set',
      'Not interested',
      'Call dropped',
      'Warm close – prospect will review',
    ],
    nextStage: null,
  },
];

export const OUTCOME_OPTIONS = [
  'next_step_agreed',
  'agreed_to_receive_report',
  'interested',
  'follow_up',
  'not_interested',
  'wrong_person',
  'do_not_call',
  'call_back_later',
  'call_dropped',
];

export const OUTCOME_LABELS = {
  next_step_agreed: 'Next step agreed',
  agreed_to_receive_report: 'Agreed to receive report',
  interested: 'Interested',
  follow_up: 'Follow-up needed',
  not_interested: 'Not interested',
  wrong_person: 'Wrong person',
  do_not_call: 'Do not call',
  call_back_later: 'Call back later',
  call_dropped: 'Call dropped',
};

export const STAGE_NAMES = STAGES.map((s) => s.name);
