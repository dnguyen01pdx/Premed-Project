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
 * listening for.
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
        q: "Why this school specifically?",
        why: "The same test as the secondary essay, live. Anything you could say about any school reads as filler.",
      },
      {
        q: "What would you do if you did not get in this cycle?",
        why: "They are looking for a considered answer, not devastation or indifference.",
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
        q: "Do you have any questions for us?",
        why: "Never say no. One specific question about their curriculum or their students beats three generic ones.",
      },
    ],
  },
];

export const TOTAL_QUESTIONS = QUESTION_CATEGORIES.reduce(
  (n, c) => n + c.questions.length,
  0,
);
