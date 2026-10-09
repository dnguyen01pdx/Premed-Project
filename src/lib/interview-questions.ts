/**
 * Interview question bank.
 *
 * These are question TYPES, not a claim about what any particular school asks.
 * Nothing here is attributed to a school, because school-specific question
 * lists circulating online are mostly folklore, and getting one wrong costs
 * someone an interview. What is durable is the shape of the questions: every
 * med school interview draws from roughly these buckets.
 *
 * The "why it is asked" line matters more than the question itself. Applicants
 * over-prepare answers and under-prepare for what the interviewer is actually
 * listening for. No sample answers, ever: same line as the feedback policy.
 *
 * IMPORTANT: prep notes in `prep.ts` are keyed by the exact `q` string. Never
 * reword an existing question; a changed string silently orphans every note
 * anyone wrote against it. Moving a question between categories is safe.
 */

export type QuestionCategory = {
  key: string;
  label: string;
  blurb: string;
  /** Which formats this category shows up in most. */
  formats: string[];
  questions: Array<{ q: string; why: string }>;
};

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    key: "motivation",
    label: "Why medicine, why you",
    blurb:
      "Almost every interview opens here. The failure mode is a rehearsed origin story that could belong to anyone.",
    formats: ["Traditional", "Panel"],
    questions: [
      {
        q: "Tell me about yourself.",
        why: "They are checking whether you can be concise and whether what you choose to lead with matches the rest of your application. Two minutes, not ten.",
      },
      {
        q: "Why do you want to be a physician?",
        why: "They have heard every version of 'I want to help people'. What distinguishes an answer is a specific moment where you learned something about the work that you could not have learned from outside it.",
      },
      {
        q: "Why not nursing, PA, research, or public health?",
        why: "They want to know you understand what is distinctive about a physician's role, not that you think the alternatives are lesser.",
      },
      {
        q: "What would you do if you did not get in this cycle?",
        why: "They are looking for a considered answer, not devastation or indifference.",
      },
      {
        q: "When did you first seriously consider medicine, and what kept you on the path?",
        why: "The first spark matters less than the second half. They want evidence the decision was tested by something hard and survived it.",
      },
      {
        q: "What do you think a physician's day actually looks like?",
        why: "A reality check. Shadowing and clinical hours should show up here as paperwork, uncertainty, and time pressure, not just the dramatic parts.",
      },
      {
        q: "What kind of doctor do you see yourself becoming?",
        why: "Nobody holds you to a specialty. They are listening for whether you can describe the kind of physician, not just the field, and why.",
      },
    ],
  },
  {
    key: "fit",
    label: "Why this school",
    blurb:
      "The live version of the 'Why us' secondary. Anything you could say about any school will read as filler.",
    formats: ["Traditional", "Panel"],
    questions: [
      {
        q: "Why this school specifically?",
        why: "The same test as the secondary essay, live. Anything you could say about any school reads as filler.",
      },
      {
        q: "What would you contribute to our class?",
        why: "They want something concrete a classmate would notice, not a list of virtues. One specific thing beats five general ones.",
      },
      {
        q: "Our curriculum is different from a traditional one. How do you learn best?",
        why: "Checks that you actually know their curriculum and that your answer about yourself is honest rather than tailored to flatter it.",
      },
      {
        q: "What do you know about the community this school serves?",
        why: "Especially at schools with a strong local or underserved mission. Specifics about the patients, not the city's tourist attractions.",
      },
      {
        q: "If you were accepted to several schools, how would you decide?",
        why: "They are not fishing for a promise. They want to see you have real criteria and can explain them without flattery.",
      },
    ],
  },
  {
    key: "experience",
    label: "Your experiences",
    blurb:
      "Anything in your application is fair game. Assume the interviewer read it this morning.",
    formats: ["Traditional", "Panel"],
    questions: [
      {
        q: "Tell me more about the experience you called most meaningful.",
        why: "They are testing whether the writing was true and whether you can go deeper than what fit in the character limit.",
      },
      {
        q: "Describe a patient interaction that changed how you think.",
        why: "Specificity is the whole answer. A named moment beats a general reflection every time.",
      },
      {
        q: "Tell me about your research. Explain it to someone outside your field.",
        why: "This is a communication test as much as a science one. If they cannot follow it, that is the finding.",
      },
      {
        q: "What did you learn from a job or activity unrelated to medicine?",
        why: "They are looking for someone with a life, and for transferable skills you noticed yourself.",
      },
      {
        q: "Tell me about a time you failed.",
        why: "The failure matters less than whether you can describe it without minimizing it or over-apologizing.",
      },
      {
        q: "Walk me through your application. What should I not miss?",
        why: "A test of judgment. They want to see what you think matters most about yourself, and whether you can say it in under two minutes.",
      },
      {
        q: "Is there anything in your application you wish were stronger?",
        why: "An invitation to address a weak spot on your own terms. Owning it plainly lands better than spinning it.",
      },
    ],
  },
  {
    key: "interpersonal",
    label: "Teamwork and conflict",
    blurb:
      "Medicine is a team sport and they are screening for people who are hard to work with.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "Describe a conflict with a teammate and how it resolved.",
        why: "Watch for the trap: answers where the other person was entirely at fault suggest you have not thought about it honestly.",
      },
      {
        q: "Tell me about a time you received criticism you disagreed with.",
        why: "They want to see you take input seriously without collapsing or getting defensive.",
      },
      {
        q: "How do you handle a teammate who is not contributing?",
        why: "They are listening for whether you go to the person first, and whether you consider why before you escalate.",
      },
      {
        q: "Describe a time you had to explain something difficult to someone.",
        why: "Direct proxy for patient communication.",
      },
      {
        q: "Tell me about a time you were the least experienced person on a team.",
        why: "Every medical student is this person for years. They want to see you can contribute, ask for help, and not overstep.",
      },
      {
        q: "Describe a time you had to deliver bad news or say no to someone.",
        why: "They are listening for honesty and care at the same time, not one at the expense of the other.",
      },
      {
        q: "Tell me about a time you led without a formal title.",
        why: "Leadership in medicine is mostly informal. A specific moment of stepping up beats a list of officer positions.",
      },
    ],
  },
  {
    key: "ethics",
    label: "Ethical scenarios",
    blurb:
      "The core of most MMI circuits. There is rarely a correct answer; they are grading your reasoning, not your verdict.",
    formats: ["MMI"],
    questions: [
      {
        q: "A patient refuses a treatment you believe they need. What do you do?",
        why: "Autonomy versus beneficence. Strong answers explore why the patient is refusing before deciding anything.",
      },
      {
        q: "You see a classmate cheating on an exam. What do you do?",
        why: "They are testing whether you can hold competing obligations (to a friend, to the profession) without pretending one does not exist.",
      },
      {
        q: "A colleague comes to work appearing impaired. What do you do?",
        why: "Patient safety comes first, but the answer that names the human cost of reporting is stronger than the one that does not.",
      },
      {
        q: "How would you allocate a scarce resource, like one transplant organ between two patients?",
        why: "Nobody expects you to solve it. They want to hear you name the competing principles and reason out loud.",
      },
      {
        q: "A parent refuses a vaccine for their child. How do you respond?",
        why: "Tests whether you can stay curious about someone whose view you disagree with rather than lecturing them.",
      },
      {
        q: "You notice a senior physician made a mistake that a patient does not know about. What do you do?",
        why: "Hierarchy versus honesty. They want to see you take it seriously, think about how to raise it, and keep the patient at the center.",
      },
      {
        q: "A patient asks you not to tell their family about a serious diagnosis. How do you handle it?",
        why: "Confidentiality and autonomy, with real people pulling the other way. Strong answers explore what the patient is afraid of first.",
      },
      {
        q: "A pharmaceutical representative offers you a free dinner. Do you go?",
        why: "Small-stakes conflict of interest. They are checking whether you notice the issue at all and can explain why it matters.",
      },
      {
        q: "A friend asks you to look up their relative's medical record. What do you say?",
        why: "Tests a bright line (privacy) under social pressure. The best answers hold the line and still take care of the friendship.",
      },
    ],
  },
  {
    key: "systems",
    label: "Healthcare and society",
    blurb:
      "They want evidence you have thought about the system you are joining, not just the clinic room.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "What do you think is the biggest problem in healthcare today?",
        why: "Any well-reasoned answer works. What is graded is whether you can explain a mechanism, not just name a headline.",
      },
      {
        q: "How would you address health disparities in a community you know?",
        why: "Specific and local beats sweeping and abstract.",
      },
      {
        q: "What are your thoughts on the role of AI in medicine?",
        why: "Increasingly common. They want a considered take, not enthusiasm or alarm.",
      },
      {
        q: "How should physicians handle misinformation from patients?",
        why: "Tests patience and respect for the patient as much as your factual knowledge.",
      },
      {
        q: "Should healthcare be a right? Explain your reasoning.",
        why: "Not a political test. They want to hear you lay out the tradeoffs and arguments on more than one side before landing anywhere.",
      },
      {
        q: "Why do you think physician burnout is so common, and what would help?",
        why: "Shows whether you have thought about the job you are signing up for, and whether your answer goes past individual resilience.",
      },
      {
        q: "Tell me about a recent development in medicine or health policy that caught your attention.",
        why: "Pick something you actually understand. Being able to explain why it matters beats naming the biggest headline.",
      },
    ],
  },
  {
    key: "research",
    label: "Research and critical thinking",
    blurb:
      "Even at schools that are not research-heavy, they want to see how you reason through something you do not know yet.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "What question in your research did you not get to answer, and how would you approach it?",
        why: "Tests whether you understood the project or just ran the protocol. A thoughtful next step is the strongest signal.",
      },
      {
        q: "Tell me about a result that surprised you or did not work.",
        why: "Real research is mostly this. They want to see you treat a failed experiment as information, not embarrassment.",
      },
      {
        q: "How do you decide whether to trust a study you read?",
        why: "A basic scientific literacy check. Sample size, design, and who funded it are all fair game.",
      },
      {
        q: "How would you explain a new treatment's risks and benefits to a patient?",
        why: "Critical thinking applied to a person. They want clarity and honesty about uncertainty, without jargon.",
      },
      {
        q: "Describe a problem you solved where the answer was not obvious.",
        why: "The process matters more than the answer. Talk through how you got unstuck, not just that you did.",
      },
    ],
  },
  {
    key: "perspective",
    label: "Perspective and difference",
    blurb:
      "Patients will not look, think, or live like you. They want to see you can work across that gap with curiosity.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "Tell me about a time you worked closely with someone whose background was very different from yours.",
        why: "Specific beats abstract. What you learned from them matters more than the fact that you were different.",
      },
      {
        q: "Describe a time your assumptions about someone turned out to be wrong.",
        why: "Self-awareness test. They are looking for honesty about the assumption, not a story where you were right all along.",
      },
      {
        q: "How would you care for a patient whose values conflict with yours?",
        why: "They want to see that the patient's care comes first and that you have thought about where your own limits are.",
      },
      {
        q: "What perspective would you bring that might be missing from a medical school class?",
        why: "Not a request to list identities. They want something about how you see problems or people that came from your own life.",
      },
      {
        q: "How would you communicate with a patient who does not speak your language?",
        why: "Practical and ethical at once. Mentioning trained interpreters over family members shows you know how this works in practice.",
      },
    ],
  },
  {
    key: "self",
    label: "Self-awareness",
    blurb:
      "Deceptively hard. Canned answers are obvious and the honest ones land better.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "What is your greatest weakness?",
        why: "A disguised strength gets marked down. A real weakness plus what you are actually doing about it does not.",
      },
      {
        q: "How do you handle stress and burnout?",
        why: "They are screening for people who will survive four hard years. Concrete habits beat 'I stay positive'.",
      },
      {
        q: "What would your closest friend say is your biggest flaw?",
        why: "Same question, harder to dodge.",
      },
      {
        q: "What do you do outside of medicine?",
        why: "A genuine answer here is a differentiator. Interviewers remember the person, not the CV.",
      },
      {
        q: "Tell me about a time you changed your mind about something important.",
        why: "Tests intellectual honesty. A real change, and what caused it, beats a story about convincing someone else.",
      },
      {
        q: "What is something you are proud of that is not on your application?",
        why: "A chance to show who you are outside the resume. Small and true beats impressive and generic.",
      },
      {
        q: "How do you know when you need help, and what do you do?",
        why: "Medicine punishes people who cannot ask. They want a specific example of you recognizing your limit and acting on it.",
      },
    ],
  },
  {
    key: "askthem",
    label: "Questions you ask them",
    blurb:
      "Every interview ends with 'Do you have any questions?' These are prompts to plan your own, and what each kind of question signals.",
    formats: ["Traditional", "MMI", "Panel"],
    questions: [
      {
        q: "Do you have any questions for us?",
        why: "Never say no. One specific question about their curriculum or their students beats three generic ones.",
      },
      {
        q: "Ask about something specific you read on their website or heard on their tour.",
        why: "Signals real interest. A follow-up on something concrete shows you did more than skim the homepage.",
      },
      {
        q: "Ask the interviewer what they would change about the school.",
        why: "Shows you want an honest picture, not a sales pitch. Most interviewers enjoy this one.",
      },
      {
        q: "Ask how students get support when they struggle academically or personally.",
        why: "A practical question that shows you are thinking about four real years there, not just getting in.",
      },
      {
        q: "Ask what the interviewer's own path to this school looked like.",
        why: "Builds rapport and gives you something specific to mention in your thank-you note.",
      },
    ],
  },
];

export const TOTAL_QUESTIONS = QUESTION_CATEGORIES.reduce(
  (n, c) => n + c.questions.length,
  0,
);

/**
 * Format-specific prep, shown on the interview tracker once a school's format
 * is known. Logistics and habits, not answers.
 */
export const FORMAT_PREP: Record<
  "traditional" | "mmi" | "panel" | "hybrid",
  string[]
> = {
  traditional: [
    "Reread your primary and this school's secondary the night before. Anything in them is fair game.",
    "Prepare a two-minute version of 'tell me about yourself' and practice stopping on time.",
    "Know two or three specific things about this school you could talk about for a few minutes each.",
    "Have two questions ready to ask that are specific to this school.",
    "Write down your interviewer's name right after so you can personalize the thank-you note.",
  ],
  mmi: [
    "Practice timed stations: two minutes to read, about eight to respond. Use a phone timer.",
    "For ethics stations, practice naming the competing principles out loud before giving a position.",
    "Expect role-play stations with an actor. Practice staying calm and asking questions before acting.",
    "Each station is a fresh start. Practice letting a weak station go before the next one begins.",
  ],
  panel: [
    "Answer the person who asked, but make eye contact with the whole panel as you go.",
    "Expect follow-ups from someone other than who asked the first question. Stay with the thread.",
    "Know your application well enough that a non-physician panelist can follow it.",
    "Get every panelist's name if you can, for thank-you notes.",
  ],
  hybrid: [
    "Ask the school which parts are one-on-one and which are stations or panel, if they have not said.",
    "Prepare as if for each format separately, then do one full mock run back-to-back.",
    "Plan your energy. Hybrid days are long; eat beforehand and bring water if it is in person.",
  ],
};
