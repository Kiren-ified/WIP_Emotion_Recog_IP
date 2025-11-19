// Global state
const MAX_STIMULI = 3;
let participantData = {
    info: {},
    sreis: {},
    sbc: {},
    bdi: {},
    bai: {},
    dsm5: {},
    des2: {},
    edeqs: {},
    stimuli: [],
    startTime: null
};

let currentStimulusIndex = 0;
let stimuliConfig = [];
let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let cameraPermissionGranted = false;

// SREIS Questions
const SREIS_QUESTIONS = [
    "By looking at people's facial expressions, I recognize the emotions they are experiencing.",
    "I am a rational person and I rarely, if ever, consult my feelings to make a decision.",
    "I have problems dealing with my feelings of anger.",
    "When someone I know is in a bad mood, I can help the person calm down and feel better quickly.",
    "I am aware of the nonverbal messages other people send.",
    "When making decisions, I listen to my feelings to see if the decision feels right.",
    "I could easily write a lot of synonyms for emotion words like happiness or sadness.",
    "I can handle stressful situations without getting too nervous.",
    "I know the strategies to make or improve other people's moods.",
    "I can tell when a person is lying to me by looking at his or her facial expression.",
    "I am a rational person and don't like to rely on my feelings to make decisions.",
    "I have the vocabulary to describe how most emotions progress from simple to complex feelings.",
    "I am able to handle most upsetting problems.",
    "I am not very good at helping others to feel better when they are feeling down or angry.",
    "My quick impressions of what people are feeling are usually wrong.",
    "My “feelings” vocabulary is probably better than most other person's “feelings” vocabularies.",
    "I know how to keep calm in difficult or stressful situations.",
    "I am the type of person to whom others go when they need help with a difficult situation."

];

// SREIS Answers
const SREIS_answers = [
    { value: 1, label: "Very inaccurate" },
    { value: 2, label: "Moderately inaccurate" },
    { value: 3, label: "Neither nor" },
    { value: 4, label: "Moderately accurate" },
    { value: 5, label: "Very accurate" }
];

// Scale of Body Connection (SBC) Questions - 20 items
const SBC_QUESTIONS = [
    "If there is tension in my body, I am aware of the tension.",
    "It is difficult for me to identify my emotions.",
    "I notice that my breathing becomes shallow when I am nervous.",
    "I notice my emotional response to caring touch.",
    "My body feels frozen, as though numb, during uncomfortble situations.",
    "I notice how my body changes when I am angry.",
    "I feel like I am looking at my body from outside of my body.",
    "I am aware of internal sensation during sexual activity.",
    "I can feel my breath travel through my body when I exhale deeply.",
    "I feel separated from my body.",
    "It is hard for me to express certain emotions.",
    "I take cues from my body to help me understand how I feel.",
    "When I am physically uncomfortable, I think about what might have caused the discomfort.",
    "I listen for information from my body about my emotional state.",
    "When I am stressed, I notice the stress in my body.",
    "I distract myself from feelings of physical discomfort.",
    "When I am tense, I take note of where the tension is located in my body.",
    "I notice that my body feels different after a peaceful experience.",
    "I feel separated from my body when I am engaged in sexual activity.",
    "It  is difficult for me to pay attention to my emotions."
];

// SBC Rating Scale (0-4)
const SBC_RATING_SCALE = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "A little bit" },
    { value: 2, label: "Some of the time" },
    { value: 3, label: "Most of the time" },
    { value: 4, label: "All of the time" }
];

// DSM-5-TR Level 1 Cross-Cutting Symptom Measure - 13 domains
const DSM5_QUESTIONS = [
    {
        domain: "Depression",
        question: "Little interest or pleasure in doing things."
    },
    {
        domain: "Depression",
        question: "Feeling down, depressed, or hopeless."
    },
    {
        domain: "Anger",
        question: "Feeling more irritated, grouchy or angry than usual."
    },
    {
        domain: "Mania",
        question: "Sleeping less than usual, but still have a lot of energy."
    },
    {
        domain: "Mania",
        question: "Starting lots more projects than usual or doing more risky things than usual."
    },
    {
        domain: "Anxiety",
        question: "Feeling nervous, frightened, anxious or on edge."
    },
    {
        domain: "Anxiety",
        question: "Feeling panic or being frightened"
    },
    {
        domain: "Anxiety",
        question: "Avoiding situations that make you anxious."
    },
    {
        domain: "Somatic Symptoms",
        question: "Unexplained aches and pains (e.g., head, back, joints, abdomen, legs)."
    },
    {
        domain: "Somatic Symptoms",
        question: "Feeling that your illnesses are not being taken seriously enough."
    },
    {
        domain: "Suicidal Ideation",
        question: "Thoughts of actually hurting yourself."
    },
    {
        domain: "Psychosis",
        question: "Hearing things other people couldn't hear, such as voices even when no one was around."
    },
    {
        domain: "Psychosis",
        question: "Feeling that someone could hear your thoughts, or that you could hear what another person was thinking?"
    },
    {
        domain: "Sleep Problems",
        question: "Problems with sleep that affected your sleep quality over all."
    },
    {
        domain: "Memory",
        question: "Problems with memory (e.g., learning new information) or with location (e.g., finding your way back home)."
    },
    {
        domain: "Repetitive Thoughts and Behaviors",
        question: "Unpleasant thoughts, urges, or images that repeatedly enter your mind."
    },
    {
        domain: "Repetitive Thoughts and Behaviors",
        question: "Feeling driven to perform certain behaviors or mental acts over and over again."
    },
    {
        domain: "Dissociation",
        question: "Feeling detached or distant from yourself, your body, your physicalsurroundings, or your memories"
    },
    {
        domain: "Personality Functioning",
        question: "Not knowing who you really are or what you want out of life."
    },
    {
        domain: "Personality Functioning",
        question: "Not feeling close to other people or enjoying your relationships with them."
    },
    {
        domain: "Substance Use",
        question: "Drinking at least 4 drinks of any kind of alcohol in a single day."
    },
    {
        domain: "Substance Use",
        question: "Smoking any cigarettes, a cigar, or pipe, or using snuff or chewing tobacco"
    },
    {
        domain: "Substance Use",
        question: "Using any of the following medicines ON YOUR OWN, that is, without a doctor’s prescription, in greater amounts or longer than prescribed [e.g., painkillers (like Vicodin), stimulants (like Ritalin or Adderall), sedatives or tranquilizers (like sleeping pills or Valium), or drugs like marijuana, cocaine or crack, club drugs (like ecstasy), hallucinogens (like LSD), heroin, inhalants or solvents (like glue), or methamphetamine (like speed)]."
    },
];

// DSM-5-TR Rating Scale (0-4)
const DSM5_RATING_SCALE = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Slight or rare, less than a day or two" },
    { value: 2, label: "Mild, several days" },
    { value: 3, label: "Moderate, more than half the days" },
    { value: 4, label: "Severe, nearly every day" }
];

// DES-II (Dissociative Experiences Scale-II) Questions - 28 items
const DES2_QUESTIONS = [
    "Some people have the experience of driving a car and suddenly realizing that they don't remember what has happened during all or part of the trip.",
    "Some people find that sometimes they are listening to someone talk and they suddenly realize that they did not hear part or all of what was said.",
    "Some people have the experience of finding themselves in a place and having no idea how they got there.",
    "Some people have the experience of finding themselves dressed in clothes that they don't remember putting on.",
    "Some people have the experience of finding new things among their belongings that they don't remember buying.",
    "Some people sometimes find that they are approached by people that they do not know, who call them by another name or insist that they have met before.",
    "Some people sometimes have the experience of feeling as though they are standing next to themselves or watching themselves do something, and they actually see themselves as if they were looking at another person.",
    "Some people are told that they sometimes do not recognize friends or family members.",
    "Some people find that they have no memory for some important events in their lives (for example, a wedding or graduation).",
    "Some people have the experience of being accused of lying when they do not think that they have lied.",
    "Some people have the experience of looking in a mirror and not recognizing themselves.",
    "Some people have the experience of feeling that other people, objects, and the world around them are not real.",
    "Some people have the experience of feeling that their body does not belong to them.",
    "Some people have the experience of sometimes remembering a past event so vividly that they feel as if they were reliving that event.",
    "Some people have the experience of not being sure whether things that they remember happening really did happen or whether they just dreamed them.",
    "Some people have the experience of being in a familiar place but finding it strange and unfamiliar.",
    "Some people have the experience of feeling that they are looking at the world through a fog so that people and objects appear far away or unclear.",
    "Some people find that when they are watching television or a movie, they become so absorbed in the story that they are unaware of other events happening around them.",
    "Some people find that they become so involved in a fantasy or daydream that it feels as if it were really happening to them.",
    "Some people find that they sometimes are able to ignore pain.",
    "Some people find that they sometimes sit staring off into space, thinking of nothing, and are not aware of the passage of time.",
    "Some people find that when they are alone, they talk out loud to themselves.",
    "Some people find that in one situation they may act so differently compared to another situation that they feel almost as if they were two different people.",
    "Some people sometimes have the experience of feeling as if they are looking at themselves from the outside or as if they were floating above themselves.",
    "Some people sometimes feel that other people are robots or automatons, even though they know they are not.",
    "Some people sometimes have the experience of feeling as if their body, or parts of their body, feel different or strange.",
    "Some people sometimes have the experience of feeling as if the people, objects, and world around them are not real.",
    "Some people sometimes have the experience of feeling as if they are not in control of what they are saying or doing, as if they are a robot or a zombie."
];

// DES-II Rating Scale (0-100% in 10% increments, stored as 0-10)
const DES2_RATING_SCALE = [
    { value: 0, label: "0% (Never)" },
    { value: 1, label: "10%" },
    { value: 2, label: "20%" },
    { value: 3, label: "30%" },
    { value: 4, label: "40%" },
    { value: 5, label: "50%" },
    { value: 6, label: "60%" },
    { value: 7, label: "70%" },
    { value: 8, label: "80%" },
    { value: 9, label: "90%" },
    { value: 10, label: "100% (Always)" }
];

// EDE-QS (Eating Disorder Examination Questionnaire - Short) Questions - 12 items
const EDEQS_QUESTIONS = [
    "Have you been deliberately trying to limit the amount of food you eat to influence your shape or weight (whether or not you have succeeded)?",
    "Have you gone for long periods of time (e.g., 8 hours or more) without eating anything in order to influence your shape or weight?",
    "Has thinking about food, eating or calories made it very difficult to concentrate on things you are interested in (such as working, following a conversation or reading)?",
    "Has thinking about your weight or shape made it very difficult to concentrate on things you are interested in (such as working, following a conversation or reading)?",
    "Have you had a definite fear that you might gain weight?",
    "Have you had a strong desire to lose weight?",
    "Have you tried to control your weight or shape by making yourself sick (vomit) or taking laxatives?",
    "Have you exercised in a driven or compulsive way as a means of controlling your weight, shape or body fat, or to burn off calories?",
    "Have you had a sense of having lost control over your eating (at the time that you were eating)?",
    "On how many of these days ( i.e. days on which you had a sense of having lost control over your eating) did you eat what other people would regard as an unusually large amount of food in one go?",
    "Has your weight or shape influenced how you think about (judge) yourself as a person?",
    "How dissatisfied have you been with your weight or shape?"
];

// EDE-QS Rating Scale (0-3, representing days in past 7 days)
const EDEQS_RATING_SCALE = [
    { value: 0, label: "0 days" },
    { value: 1, label: "1-2 days" },
    { value: 2, label: "3-5 days" },
    { value: 3, label: "6-7 days" }
];

// EDE-QS Rating Scale for last 2 questions (0-3, severity scale)
const EDEQS_SEVERITY_SCALE = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Slightly" },
    { value: 2, label: "Moderately" },
    { value: 3, label: "Markedly" }
];

// BDI-II Questions (Beck Depression Inventory) - Full version with 4 statements per question
const BDI_QUESTIONS = [
    {
        category: "Sadness",
        statements: [
            "I do not feel sad.",
            "I feel sad.",
            "I am sad all the time and I can't snap out of it.",
            "I am so sad or unhappy that I can't stand it."
        ]
    },
    {
        category: "Pessimism",
        statements: [
            "I am not discouraged about my future.",
            "I feel more discouraged about my future than I used to be.",
            "I do not expect things to work out for me.",
            "I feel my future is hopeless and will only get worse."
        ]
    },
    {
        category: "Past Failure",
        statements: [
            "I do not feel like a failure.",
            "I have failed more than I should have.",
            "As I look back, I see a lot of failures.",
            "I feel I am a complete failure as a person."
        ]
    },
    {
        category: "Loss of Pleasure",
        statements: [
            "I get as much pleasure as I ever did from the things I enjoy.",
            "I don't enjoy things as much as I used to.",
            "I get very little pleasure from the things I used to enjoy.",
            "I can't get any pleasure from the things I used to enjoy."
        ]
    },
    {
        category: "Guilty Feelings",
        statements: [
            "I don't feel particularly guilty.",
            "I feel guilty over many things I have done or should have done.",
            "I feel quite guilty most of the time.",
            "I feel guilty all of the time."
        ]
    },
    {
        category: "Punishment Feelings",
        statements: [
            "I don't feel I am being punished.",
            "I feel I may be punished.",
            "I expect to be punished.",
            "I feel I am being punished."
        ]
    },
    {
        category: "Self-Dislike",
        statements: [
            "I feel the same about myself as ever.",
            "I have lost confidence in myself.",
            "I am disappointed in myself.",
            "I dislike myself."
        ]
    },
    {
        category: "Self-Criticalness",
        statements: [
            "I don't criticize or blame myself more than usual.",
            "I am more critical of myself than I used to be.",
            "I criticize myself for all of my faults.",
            "I blame myself for everything bad that happens."
        ]
    },
    {
        category: "Suicidal Thoughts or Wishes",
        statements: [
            "I don't have any thoughts of killing myself.",
            "I have thoughts of killing myself, but I would not carry them out.",
            "I would like to kill myself.",
            "I would kill myself if I had the chance."
        ]
    },
    {
        category: "Crying",
        statements: [
            "I don't cry any more than usual.",
            "I cry more than I used to.",
            "I cry over every little thing.",
            "I feel like crying, but I can't."
        ]
    },
    {
        category: "Agitation",
        statements: [
            "I am no more restless or wound up than usual.",
            "I feel more restless than usual.",
            "I am so restless or agitated that it's hard to stay still.",
            "I am so restless or agitated that I have to keep moving or doing something."
        ]
    },
    {
        category: "Loss of Interest",
        statements: [
            "I have not lost interest in other people or activities.",
            "I am less interested in other people or things than before.",
            "I have lost most of my interest in other people or things.",
            "It's hard to get interested in anything."
        ]
    },
    {
        category: "Indecisiveness",
        statements: [
            "I make decisions about as well as ever.",
            "I find it more difficult to make decisions than usual.",
            "I have much greater difficulty in making decisions than I used to.",
            "I have trouble making any decisions."
        ]
    },
    {
        category: "Worthlessness",
        statements: [
            "I do not feel I am worthless.",
            "I don't consider myself as worthwhile and useful as I used to.",
            "I feel more worthless as compared to other people.",
            "I feel utterly worthless."
        ]
    },
    {
        category: "Loss of Energy",
        statements: [
            "I have as much energy as ever.",
            "I have less energy than I used to have.",
            "I don't have enough energy to do very much.",
            "I don't have enough energy to do anything."
        ]
    },
    {
        category: "Changes in Sleeping Pattern",
        statements: [
            "I have not experienced any change in my sleeping pattern.",
            "I sleep somewhat more than usual, or somewhat less than usual.",
            "I sleep a lot more than usual, or a lot less than usual.",
            "I sleep most of the day, or I wake up 1-2 hours early and can't get back to sleep."
        ]
    },
    {
        category: "Irritability",
        statements: [
            "I am no more irritable than usual.",
            "I am more irritable than usual.",
            "I am much more irritable than usual.",
            "I am irritable all the time."
        ]
    },
    {
        category: "Changes in Appetite",
        statements: [
            "I have not experienced any change in my appetite.",
            "My appetite is somewhat less than usual, or somewhat greater than usual.",
            "My appetite is much less than usual, or much greater than usual.",
            "I have no appetite at all, or I crave food all the time."
        ]
    },
    {
        category: "Concentration Difficulty",
        statements: [
            "I can concentrate as well as ever.",
            "I can't concentrate as well as usual.",
            "It's hard to keep my mind on anything for very long.",
            "I find I can't concentrate on anything."
        ]
    },
    {
        category: "Tiredness or Fatigue",
        statements: [
            "I am no more tired or fatigued than usual.",
            "I get more tired or fatigued more easily than usual.",
            "I am too tired or fatigued to do a lot of the things I used to do.",
            "I am too tired or fatigued to do most of the things I used to do."
        ]
    },
    {
        category: "Loss of Interest in Sex",
        statements: [
            "I have not noticed any recent change in my interest in sex.",
            "I am less interested in sex than I used to be.",
            "I am much less interested in sex now.",
            "I have lost interest in sex completely."
        ]
    }
];

// BAI (Beck Anxiety Inventory) Questions - 21 items
const BAI_QUESTIONS = [
    "Numbness or tingling",
    "Feeling hot",
    "Wobbliness in legs",
    "Unable to relax",
    "Fear of the worst happening",
    "Dizzy or lightheaded",
    "Heart pounding or racing",
    "Unsteady",
    "Terrified or afraid",
    "Nervous",
    "Feeling of choking",
    "Hands trembling",
    "Shaky / unsteady",
    "Fear of losing control",
    "Difficulty breathing",
    "Fear of dying",
    "Scared",
    "Indigestion",
    "Faint / lightheaded",
    "Face flushed",
    "Hot/cold sweats"
];

// BAI Rating Scale (0-3)
const BAI_RATING_SCALE = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Mildly, but it didn't bother me much" },
    { value: 2, label: "Moderately, it wasn't pleasant at times" },
    { value: 3, label: "Severely, it bothered me a lot" }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStimuliConfig();
    renderSREIS();
    renderSBC();
    renderBDI();
    renderBAI();
    renderDSM5();
    renderDES2();
    renderEDEQS();
    
    // Check URL hash for direct page access
    checkUrlHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkUrlHash);
});

// Handle URL hash for direct page navigation
function checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        // Map hash to page ID
        const pageMap = {
            'info': 'info-page',
            'introduction': 'introduction-page',
            'SREIS': 'assessment-sreis-page',
            'sbc': 'assessment-sbc-page',
            'bdi': 'assessment-bdi-page',
            'bai': 'assessment-bai-page',
            'dsm5': 'assessment-dsm5-page',
            'des2': 'assessment-des2-page',
            'edeqs': 'assessment-edeqs-page',
            'instructions': 'instructions-page',
            'stimuli': 'stimuli-page',
            'thankyou': 'thankyou-page'
        };
        
        const pageId = pageMap[hash];
        if (pageId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            // Show requested page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                // Scroll to top of page
                window.scrollTo(0, 0);
            }
        }
    }
}

// Page navigation
function nextPage(currentPageId, nextPageId) {
    document.getElementById(currentPageId).classList.remove('active');
    document.getElementById(nextPageId).classList.add('active');
    // Update URL hash for direct page access
    window.location.hash = nextPageId.replace('-page', '');
    // Scroll to top of page
    window.scrollTo(0, 0);
}

// Info page submission
function submitInfo() {
    const form = document.getElementById('info-form');
    if (form.checkValidity()) {
        const formData = new FormData(form);
        participantData.info = {
            participantId: formData.get('participantId'),
            age: formData.get('age'),
            gender: formData.get('gender'),
            timestamp: new Date().toISOString()
        };
        nextPage('info-page', 'introduction-page');
    } else {
        form.reportValidity();
    }
}

// Assessment rendering and submission
function renderSREIS() {
    const container = document.getElementById('sreis-questions');
    SREIS_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${SREIS_answers.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="sreis_q${index}" value="${option.value}">
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderSBC() {
    const container = document.getElementById('sbc-questions');
    SBC_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${SBC_RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="sbc_q${index}" value="${option.value}">
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderBDI() {
    const container = document.getElementById('bdi-questions');
    BDI_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label class="question-category">${index + 1}. ${question.category}</label>
            <div class="bdi-statements">
                ${question.statements.map((statement, stmtIndex) => `
                    <label class="rating-option bdi-statement">
                        <input type="radio" name="bdi_q${index}" value="${stmtIndex}">
                        <span class="statement-number">${stmtIndex}</span>
                        <span class="statement-text">${statement}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.bdi-statement');
            // Remove selected class from all options in this question group
            const questionItem = parent.closest('.question-item');
            questionItem.querySelectorAll('.bdi-statement').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderBAI() {
    const container = document.getElementById('bai-questions');
    BAI_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${BAI_RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="bai_q${index}" value="${option.value}">
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderDSM5() {
    const container = document.getElementById('dsm5-questions');
    DSM5_QUESTIONS.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${item.question}</label>
            <div class="rating-scale">
                ${DSM5_RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="dsm5_q${index}" value="${option.value}">
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderDES2() {
    const container = document.getElementById('des2-questions');
    DES2_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item des2-question';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="des2-slider-container">
                <div class="des2-slider-wrapper">
                    <input type="range" 
                           name="des2_q${index}" 
                           id="des2_slider_${index}" 
                           min="0" 
                           max="10" 
                           value="0" 
                           step="1" 
                           class="des2-slider">
                    <div class="des2-slider-labels">
                        <span class="slider-label-left">0%</span>
                        <span class="slider-label-right">100%</span>
                    </div>
                </div>
                <div class="des2-percentage-display" id="des2_percentage_${index}">0%</div>
            </div>
        `;
        container.appendChild(questionDiv);
        
        // Add event listener to update percentage display
        const slider = document.getElementById(`des2_slider_${index}`);
        const percentageDisplay = document.getElementById(`des2_percentage_${index}`);
        
        slider.addEventListener('input', function() {
            const value = parseInt(this.value);
            const percentage = value * 10;
            percentageDisplay.textContent = `${percentage}%`;
            
            // Update slider filled portion for visual feedback (Webkit browsers)
            const percentageValue = (value / 10) * 100;
            this.style.setProperty('--value', `${percentageValue}%`);
            
            // Show/hide arrow indicator
            if (value > 0) {
                percentageDisplay.classList.add('has-value');
            } else {
                percentageDisplay.classList.remove('has-value');
            }
        });
        
        // Initialize the display and slider state
        slider.style.setProperty('--value', '0%');
    });
}

function renderEDEQS() {
    const container = document.getElementById('edeqs-questions');
    
    // Render first 10 questions (indices 0-9)
    for (let index = 0; index < 10; index++) {
        const question = EDEQS_QUESTIONS[index];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${EDEQS_RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="edeqs_q${index}" value="${option.value}">
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    }
    
    // Add instruction line
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instructions';
    instructionDiv.style.marginTop = '20px';
    instructionDiv.style.marginBottom = '20px';
    instructionDiv.style.fontWeight = 'bold';
    instructionDiv.innerHTML = '<p>Over the past 7 days...</p>';
    container.appendChild(instructionDiv);
    
    // Render last 2 questions (indices 10-11) with severity scale
    for (let index = 10; index < 12; index++) {
        const question = EDEQS_QUESTIONS[index];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${EDEQS_SEVERITY_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="edeqs_q${index}" value="${option.value}">
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    }

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function submitAssessment(type, nextPageId) {
    const form = document.getElementById(`${type}-form`);
    // Bypass validation - allow proceeding without answering all questions
    const formData = new FormData(form);
    const answers = {};
    
    // Collect all form values (handles both radio buttons and sliders)
    formData.forEach((value, key) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            answers[key] = numValue;
        }
    });
    
    // For DES-II, also collect directly from sliders
    if (type === 'des2') {
        const allSliders = form.querySelectorAll('input[type="range"]');
        allSliders.forEach(slider => {
            const numValue = parseInt(slider.value, 10);
            if (!isNaN(numValue) && !answers[slider.name]) {
                answers[slider.name] = numValue;
            }
        });
    } else {
        // For other assessments, collect from radio buttons as fallback
        const allRadios = form.querySelectorAll('input[type="radio"]:checked');
        allRadios.forEach(radio => {
            const numValue = parseInt(radio.value, 10);
            if (!isNaN(numValue) && !answers[radio.name]) {
                answers[radio.name] = numValue;
            }
        });
    }
    
    participantData[type] = answers;
    console.log(`${type} assessment data:`, answers); // Debug log
    console.log(`Total questions answered: ${Object.keys(answers).length}`);
    nextPage(`assessment-${type}-page`, nextPageId);
}

// Camera permission
async function requestCameraPermission() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
        });
        const video = document.getElementById('participant-video');
        video.srcObject = stream;
        
        // Video must play (even if hidden) to capture frames properly
        try {
            await video.play();
            console.log('Video play() successful');
        } catch (err) {
            console.error('Video play error:', err);
        }
        
        // Wait for video to be ready and ensure it's rendering
        await new Promise((resolve) => {
            if (video.readyState >= 2) {
                console.log('Video already ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
                resolve();
            } else {
                video.onloadedmetadata = () => {
                    console.log('Video stream ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
                    // Force a frame render
                    video.currentTime = 0;
                    resolve();
                };
            }
        });
        
        // Wait a bit more to ensure video is actually rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Keep video hidden - but it's playing in background for recording
        // video.style.display = 'block'; // Hidden for participant experience
        cameraPermissionGranted = true;
        
        document.getElementById('camera-permission-btn').style.display = 'none';
        document.getElementById('start-experiment-btn').style.display = 'block';
    } catch (error) {
        alert('Camera permission was denied. Please grant camera access to continue.');
        console.error('Error accessing camera:', error);
    }
}

// Load stimuli configuration from CSV
async function loadStimuliConfig() {
    try {
        const response = await fetch('stimuli.csv');
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
        // Parse CSV (simple parser, assumes no commas in values)
        const headers = lines[0].split(',').map(h => h.trim());
        stimuliConfig = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= headers.length && values[0]) { // Ensure Image exists
                const config = {};
                headers.forEach((header, index) => {
                    config[header] = values[index];
                });
                
                // Map CSV structure to expected format
                const correctEmotion = config.Corr_emotion ? config.Corr_emotion.trim().toLowerCase() : '';
                
                // Find which option matches the correct emotion
                // The correct option MUST be in one of the 4 options (data validation)
                let correctOption = null;
                if (correctEmotion) {
                    const options = [
                        config.option1 ? config.option1.trim().toLowerCase() : '',
                        config.option2 ? config.option2.trim().toLowerCase() : '',
                        config.option3 ? config.option3.trim().toLowerCase() : '',
                        config.option4 ? config.option4.trim().toLowerCase() : ''
                    ];
                    
                    const matchIndex = options.findIndex(opt => opt === correctEmotion);
                    if (matchIndex !== -1) {
                        correctOption = `option${matchIndex + 1}`;
                    } else {
                        // This should never happen if CSV data is correct
                        console.error(`ERROR: Could not find correct emotion "${correctEmotion}" in options for ${config.Image}`);
                        console.error(`Options were:`, options);
                        throw new Error(`Data validation failed: Correct emotion "${config.Corr_emotion}" not found in options for image ${config.Image}`);
                    }
                } else {
                    throw new Error(`Missing Corr_emotion for image ${config.Image}`);
                }
                
                // Store in expected format
                stimuliConfig.push({
                    imageName: config.Image,
                    option1: config.option1 || '',
                    option2: config.option2 || '',
                    option3: config.option3 || '',
                    option4: config.option4 || '',
                    correctOption: correctOption, // Must be set (validated above)
                    // Store metadata for reference
                    metadata: {
                        gender: config.Gender,
                        model: config.Model,
                        race: config.Race,
                        mouth: config.Mouth,
                        correctEmotion: config.Corr_emotion
                    }
                });
            }
        }
        
        if (stimuliConfig.length === 0) {
            throw new Error('No valid stimuli found in CSV file');
        }
        // DEVELOPMENT: Limit to MAX_STIMULI images for testing
        if (stimuliConfig.length > MAX_STIMULI) {
            stimuliConfig = stimuliConfig.slice(0, MAX_STIMULI);
            console.log(`Development mode: Limited to first ${MAX_STIMULI} stimuli`);
        }
        
        console.log('Loaded', stimuliConfig.length, 'stimuli configurations');
        
        // Validate required fields
        for (let i = 0; i < stimuliConfig.length; i++) {
            const config = stimuliConfig[i];
            if (!config.imageName || !config.option1 || !config.option2 || !config.option3 || !config.option4) {
                console.warn(`Stimulus ${i + 1} is missing required fields:`, config);
            }
        }
        
        // Preload images to verify they exist
        await preloadImages();
        
    } catch (error) {
        console.error('Error loading stimuli config:', error);
        alert(`Error loading experiment configuration: ${error.message}\n\nPlease ensure:\n1. stimuli.csv exists in the same folder\n2. The app is running via a web server (not file://)\n3. The CSV file has valid data`);
        // Create sample config for testing (but warn user)
        stimuliConfig = [
            {
                imageName: 'sample1.jpg',
                option1: 'Happy',
                option2: 'Sad',
                option3: 'Angry',
                option4: 'Surprised',
                correctOption: 'option1'
            }
        ];
        console.warn('Using fallback sample configuration');
    }
}

// Preload images to verify they exist
async function preloadImages() {
    const imagePromises = stimuliConfig.map((config, index) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✓ Image ${index + 1}: ${config.imageName} loaded successfully`);
                resolve({ success: true, config, index });
            };
            img.onerror = () => {
                console.error(`✗ Image ${index + 1}: ${config.imageName} failed to load`);
                reject({ success: false, config, index, error: new Error(`Image not found: ${config.imageName}`) });
            };
            img.src = `images/${config.imageName}`;
        }).catch(error => error); // Catch rejections to continue checking all images
    });
    
    const results = await Promise.all(imagePromises);
    const failed = results.filter(r => r && !r.success);
    
    if (failed.length > 0) {
        console.warn(`${failed.length} image(s) failed to load:`, failed.map(f => f.config.imageName));
        // Don't block experiment, but warn user
        const failedNames = failed.map(f => f.config.imageName).join(', ');
        alert(`Warning: ${failed.length} image(s) failed to load:\n${failedNames}\n\nPlease check the images folder. The experiment will continue but these images may not display correctly.`);
    } else {
        console.log('All images preloaded successfully');
    }
}

// Start experiment
function startExperiment() {
    if (!cameraPermissionGranted) {
        alert('Please grant camera permission first.');
        return;
    }
    
    // Validate that stimuli are loaded
    if (!stimuliConfig || stimuliConfig.length === 0) {
        alert('Error: No stimuli configuration loaded. Please check stimuli.csv file.');
        console.error('No stimuli config available');
        return;
    }
    
    participantData.startTime = Date.now();
    currentStimulusIndex = 0;
    participantData.stimuli = [];
    
    // Show first stimulus (recording will start when image is displayed)
    showStimulus();
}

// Show stimulus
function showStimulus() {
    if (currentStimulusIndex >= stimuliConfig.length) {
        endExperiment();
        return;
    }
    
    const config = stimuliConfig[currentStimulusIndex];
    const imageContainer = document.getElementById('stimulus-image-container');
    const image = document.getElementById('stimulus-image');
    const optionsContainer = document.getElementById('emotion-options');
    const waitingMessage = document.getElementById('waiting-message');
    
    waitingMessage.style.display = 'none';
    
    // Start video recording only when first stimulus is displayed
    if (currentStimulusIndex === 0) {
        startRecording().catch(err => console.error('Error starting recording:', err));
    }
    
    // Load and show image with error handling
    image.onerror = function() {
        console.error(`Failed to load image: ${config.imageName}`);
        alert(`Error: Could not load image "${config.imageName}". Please ensure it exists in the images folder.`);
        // Continue to next stimulus or end experiment
        currentStimulusIndex++;
        if (currentStimulusIndex >= stimuliConfig.length) {
            endExperiment();
        } else {
            setTimeout(() => showStimulus(), 1000);
        }
    };
    
    image.onload = function() {
        console.log(`Image loaded: ${config.imageName}`);
    };
    
    image.src = `images/${config.imageName}`;
    image.style.display = 'block';
    imageContainer.style.display = 'block';
    optionsContainer.style.display = 'none';
    
    // Record start time
    const stimulusStartTime = Date.now();
    
    // After 1 second, show options
    setTimeout(() => {
        image.style.display = 'none';
        optionsContainer.style.display = 'block';
        showOptions(config, stimulusStartTime);
    }, 1000);
}

function showOptions(config, stimulusStartTime) {
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Capitalize first letter of emotion labels for better display
    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    
    // Options for clicking
    const options = [
        { label: capitalize(config.option1) || 'Option 1', value: 'option1' },
        { label: capitalize(config.option2) || 'Option 2', value: 'option2' },
        { label: capitalize(config.option3) || 'Option 3', value: 'option3' },
        { label: capitalize(config.option4) || 'Option 4', value: 'option4' }
    ];
    
    // Track if an option has been selected to prevent multiple selections
    let optionSelected = false;
    
    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.innerHTML = `
            <div>${option.label}</div>
        `;
        optionDiv.dataset.value = option.value;
        
        // Add click handler
        optionDiv.addEventListener('click', () => {
            if (!optionSelected) {
                optionSelected = true;
                selectOption(optionDiv, config, stimulusStartTime);
            }
        });
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // All options start in neutral state - no highlighting until user clicks
}


function selectOption(optionDiv, config, stimulusStartTime) {
    const reactionTime = Date.now() - stimulusStartTime;
    const selectedValue = optionDiv.dataset.value;
    const isCorrect = selectedValue === config.correctOption;
    
    // Get the selected emotion label (the actual text, not the option number)
    const labelDiv = optionDiv.querySelector('div');
    const selectedLabel = labelDiv ? labelDiv.textContent.trim() : 
                         (selectedValue === 'option1' ? config.option1 :
                          selectedValue === 'option2' ? config.option2 :
                          selectedValue === 'option3' ? config.option3 :
                          selectedValue === 'option4' ? config.option4 : '');
    
    // Store response
    participantData.stimuli.push({
        imageName: config.imageName,
        stimulusIndex: currentStimulusIndex,
        selectedOption: selectedValue,
        selectedLabel: selectedLabel.trim(), // Store the emotion label
        correctOption: config.correctOption,
        isCorrect: isCorrect,
        reactionTime: reactionTime,
        timestamp: new Date().toISOString(),
        stimulusStartTime: stimulusStartTime, // Absolute timestamp when stimulus was shown
        stimulusStartOffset: stimulusStartTime - participantData.startTime, // Milliseconds since experiment start
        config: config // Store full config for later use
    });
    
    // Visual feedback
    optionDiv.classList.add('selected');
    
    // Move to next stimulus after brief delay
    setTimeout(() => {
        currentStimulusIndex++;
        showStimulus();
    }, 500);
}

function endExperiment() {
    // Stop recording
    stopRecording();
    
    // Save all data
    saveParticipantData();
    
    // Show thank you page
    nextPage('stimuli-page', 'thankyou-page');
}

// Video recording
async function startRecording() {
    if (!stream || !stream.active) {
        console.error('Stream not available or not active');
        return;
    }
    
    recordedChunks = [];
    const canvas = document.getElementById('video-canvas');
    const video = document.getElementById('participant-video');
    const ctx = canvas.getContext('2d');
    
    // Ensure video is playing and has dimensions
        if (video.readyState < 2) {
            console.warn('Video not ready, waiting...');
            video.onloadedmetadata = () => {
                startRecording().catch(err => console.error('Error starting recording:', err));
            };
            return;
        }
    
    // Set canvas dimensions based on actual video dimensions
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    console.log('Starting recording with dimensions:', videoWidth, 'x', videoHeight);
    
    try {
        // Ensure video is playing and rendering frames
        if (video.paused) {
            video.play().catch(err => console.error('Video play error:', err));
        }
        
        // Force video to render by making it visible (very small) in viewport
        // Chrome requires video to be in viewport and actively rendering to capture frames
        // Keep video visible throughout recording
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '160px';
        video.style.height = '120px';
        video.style.opacity = '0.01'; // Almost invisible but still renders
        video.style.zIndex = '-1';
        video.style.pointerEvents = 'none';
        video.style.display = 'block'; // Ensure it's displayed (not hidden)
        
        // Ensure video is playing and stays playing
        if (video.paused) {
            await video.play();
        }
        
        // Keep video playing throughout recording - prevent it from pausing
        video.addEventListener('pause', () => {
            console.log('Video paused, restarting...');
            video.play();
        });
        
        // Wait for video to actually start rendering frames
        let frameCheckAttempts = 0;
        await new Promise(resolve => {
            const checkRendering = () => {
                frameCheckAttempts++;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                // Check if we have non-black pixels (video is rendering)
                let hasContent = false;
                let pixelCount = 0;
                for (let i = 0; i < data.length && pixelCount < 1000; i += 4) {
                    if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) {
                        hasContent = true;
                        pixelCount++;
                    }
                }
                if (hasContent && pixelCount > 50) {
                    console.log('Video is rendering frames (detected', pixelCount, 'non-black pixels)');
                    resolve();
                } else if (frameCheckAttempts > 20) {
                    console.warn('Video frame check timeout - proceeding anyway');
                    resolve();
                } else {
                    setTimeout(checkRendering, 100);
                }
            };
            setTimeout(checkRendering, 200);
        });
        
        // Use canvas stream for recording - more reliable than direct MediaStream
        // Continuously draw video frames to canvas and record from canvas stream
        const drawToCanvas = () => {
            if (video.readyState >= 2 && stream.active) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
        };
        
        // Start drawing frames to canvas immediately
        const canvasDrawInterval = setInterval(drawToCanvas, 33); // ~30 FPS
        window.canvasDrawInterval = canvasDrawInterval;
        
        // Now create a stream from the canvas and record that
        setTimeout(() => {
            // Use canvas stream - canvas is being updated with video frames
            const canvasStream = canvas.captureStream(30); // 30 FPS
            
            // Check for supported MIME types
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            }
            
            console.log('Creating MediaRecorder with canvas stream');
            
            mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    console.log('MediaRecorder data available:', event.data.size, 'bytes');
                    recordedChunks.push(event.data);
                } else {
                    console.warn('MediaRecorder data event with no data or size 0');
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped. Total chunks:', recordedChunks.length);
                console.log('Total data size:', recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
                saveVideo();
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                if (event.error) {
                    console.error('MediaRecorder error details:', event.error);
                }
            };
            
            mediaRecorder.onstart = () => {
                console.log('MediaRecorder started successfully');
            };
            
            // Start recording with timeslice to ensure regular data capture
            mediaRecorder.start(1000); // Capture data every second
            console.log('MediaRecorder.start() called, state:', mediaRecorder.state);
            
            // Canvas drawing is already happening (started above)
        }, 200); // Wait 200ms for video to start rendering
        
    } catch (error) {
        console.error('MediaRecorder setup error:', error);
        // Fallback to frame capture
        alert('Error setting up video recording. Please check console for details.');
    }
}

function stopRecording() {
    // Stop canvas drawing interval
    if (window.canvasDrawInterval) {
        clearInterval(window.canvasDrawInterval);
        window.canvasDrawInterval = null;
    }
    
    // Keep video playing until recording fully stops
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        // If paused, resume then stop to ensure final data
        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
        mediaRecorder.stop();
    }
    
    // Stop stream tracks after recording finishes (in saveVideo callback)
    // Don't stop immediately - wait for MediaRecorder.onstop to fire
    setTimeout(() => {
        if (stream) {
            console.log('Stopping stream tracks');
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('Track stopped:', track.kind, track.readyState);
            });
        }
    }, 1000);
}

function saveVideo() {
    if (recordedChunks.length === 0) {
        // Fallback: create video from canvas frames
        createVideoFromFrames();
        return;
    }
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const participantId = participantData.info.participantId || 'participant';
    
    // Save video after Excel files have been initiated (with delay to avoid browser blocking)
    setTimeout(() => {
        // Note: Browser records in WebM format
        // To convert to MP4, use: ffmpeg -i {participantId}_video.webm {participantId}_video.mp4
        // Or use the convert_to_mp4.sh script: ./convert_to_mp4.sh {participantId}
        downloadFile(blob, `${participantId}_video.webm`, 'video/webm');
    }, 1000);
}

function createVideoFromFrames() {
    // This is a simplified approach - in production you'd want to use a library
    // For now, we'll save a representative frame
    const canvas = document.getElementById('video-canvas');
    canvas.toBlob((blob) => {
        if (blob) {
            // Note: This saves as image, not video. For true video, you'd need a library like RecordRTC
            downloadFile(blob, `${participantData.info.participantId}_recording.jpg`, 'image/jpeg');
        }
    });
}

// Data saving functions
function saveParticipantData() {
    const participantId = participantData.info.participantId || 'participant';
    
    // Calculate accuracy
    const totalStimuli = participantData.stimuli.length;
    const correctAnswers = participantData.stimuli.filter(s => s.isCorrect).length;
    const accuracy = totalStimuli > 0 ? (correctAnswers / totalStimuli * 100).toFixed(2) : 0;
    
    // Save files with delays to avoid browser blocking multiple downloads
    // Save assessments Excel first (with small delay to ensure browser is ready)
    setTimeout(() => {
        try {
            saveAssessmentsExcel(participantId);
        } catch (error) {
            console.error('Error saving assessment Excel:', error);
            alert('Error saving assessment data. Please check the console.');
        }
    }, 100);
    
    // Save metadata Excel after a delay
    setTimeout(() => {
        try {
            saveMetadataExcel(participantId, accuracy);
        } catch (error) {
            console.error('Error saving metadata Excel:', error);
            alert('Error saving metadata. Please check the console.');
        }
    }, 600);
    
    // Note: Video is saved asynchronously when recording stops (in saveVideo function)
}

function saveAssessmentsExcel(participantId) {
    try {
        const wb = XLSX.utils.book_new();
        
        // Debug: Check what data we have
        console.log('SREIS data:', participantData.sreis);
        console.log('SBC data:', participantData.sbc);
        console.log('BDI data:', participantData.bdi);
        console.log('BAI data:', participantData.bai);
        console.log('DSM-5 data:', participantData.dsm5);
        console.log('DES-II data:', participantData.des2);
        console.log('EDE-QS data:', participantData.edeqs);
        
        // SREIS Sheet
        const sreisData = [
            ['Question', 'Score'],
            ...SREIS_QUESTIONS.map((q, i) => {
                const key = `sreis_q${i}`;
                const value = participantData.sreis && participantData.sreis[key] !== undefined 
                    ? participantData.sreis[key] 
                    : 0;
                console.log(`SREIS Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const sreisWS = XLSX.utils.aoa_to_sheet(sreisData);
        XLSX.utils.book_append_sheet(wb, sreisWS, 'SREIS');
        
        // SBC Sheet
        const sbcData = [
            ['Question', 'Score'],
            ...SBC_QUESTIONS.map((q, i) => {
                const key = `sbc_q${i}`;
                const value = participantData.sbc && participantData.sbc[key] !== undefined 
                    ? participantData.sbc[key] 
                    : 0;
                console.log(`SBC Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const sbcWS = XLSX.utils.aoa_to_sheet(sbcData);
        XLSX.utils.book_append_sheet(wb, sbcWS, 'SBC');
        
        // BDI Sheet
        const bdiData = [
            ['Question', 'Score'],
            ...BDI_QUESTIONS.map((q, i) => {
                const key = `bdi_q${i}`;
                const value = participantData.bdi && participantData.bdi[key] !== undefined 
                    ? participantData.bdi[key] 
                    : 0;
                console.log(`BDI Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q.category}`, value];
            })
        ];
        const bdiWS = XLSX.utils.aoa_to_sheet(bdiData);
        XLSX.utils.book_append_sheet(wb, bdiWS, 'BDI');
        
        // BAI Sheet
        const baiData = [
            ['Question', 'Score'],
            ...BAI_QUESTIONS.map((q, i) => {
                const key = `bai_q${i}`;
                const value = participantData.bai && participantData.bai[key] !== undefined 
                    ? participantData.bai[key] 
                    : 0;
                console.log(`BAI Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const baiWS = XLSX.utils.aoa_to_sheet(baiData);
        XLSX.utils.book_append_sheet(wb, baiWS, 'BAI');
        
        // DSM-5 Sheet
        const dsm5Data = [
            ['Domain', 'Question', 'Score'],
            ...DSM5_QUESTIONS.map((item, i) => {
                const key = `dsm5_q${i}`;
                const value = participantData.dsm5 && participantData.dsm5[key] !== undefined 
                    ? participantData.dsm5[key] 
                    : 0;
                console.log(`DSM-5 Q${i+1}: key="${key}", value=${value}`);
                return [item.domain, `Q${i + 1}: ${item.question}`, value];
            })
        ];
        const dsm5WS = XLSX.utils.aoa_to_sheet(dsm5Data);
        XLSX.utils.book_append_sheet(wb, dsm5WS, 'DSM-5-TR');
        
        // DES-II Sheet
        const des2Data = [
            ['Question', 'Score (0-10, representing 0-100%)'],
            ...DES2_QUESTIONS.map((q, i) => {
                const key = `des2_q${i}`;
                const value = participantData.des2 && participantData.des2[key] !== undefined 
                    ? participantData.des2[key] 
                    : 0;
                console.log(`DES-II Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const des2WS = XLSX.utils.aoa_to_sheet(des2Data);
        XLSX.utils.book_append_sheet(wb, des2WS, 'DES-II');
        
        // EDE-QS Sheet
        const edeqsData = [
            ['Question', 'Score', 'Scale Type'],
            ...EDEQS_QUESTIONS.map((q, i) => {
                const key = `edeqs_q${i}`;
                const value = participantData.edeqs && participantData.edeqs[key] !== undefined 
                    ? participantData.edeqs[key] 
                    : 0;
                const scaleType = i < 10 
                    ? 'Days (0-3: 0 days, 1-2 days, 3-5 days, 6-7 days)' 
                    : 'Severity (0-3: Not at all, Slightly, Moderately, Markedly)';
                console.log(`EDE-QS Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value, scaleType];
            })
        ];
        const edeqsWS = XLSX.utils.aoa_to_sheet(edeqsData);
        XLSX.utils.book_append_sheet(wb, edeqsWS, 'EDE-QS');
        
        const excelBlob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        console.log(`Downloading assessment Excel for ${participantId}...`);
        downloadFile(new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
                     `${participantId}_assessment.xlsx`, 
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) {
        console.error('Error in saveAssessmentsExcel:', error);
        throw error;
    }
}

function saveMetadataExcel(participantId, accuracy) {
    const wb = XLSX.utils.book_new();
    
    // Create a copy of stimuli.csv with user responses and reaction times
    // Include all original columns plus new columns
    const stimuliData = [
        ['Image', 'Gender', 'Model', 'Race', 'Mouth', 'Corr_emotion', 'option1', 'option2', 'option3', 'option4', 'User response', 'Reaction Time (ms)', 'Stimulus Start Time (ms)', 'Frame at 300ms (ms)'],
        ...participantData.stimuli.map(s => {
            const config = s.config || stimuliConfig.find(c => c.imageName === s.imageName);
            if (!config) {
                return [s.imageName, '', '', '', '', '', '', '', '', '', s.selectedLabel || '', s.reactionTime, s.stimulusStartOffset || '', (s.stimulusStartOffset || 0) + 300];
            }

            return [
                config.imageName,
                config.metadata?.gender || '',
                config.metadata?.model || '',
                config.metadata?.race || '',
                config.metadata?.mouth || '',
                config.metadata?.correctEmotion || '',
                config.option1 || '',
                config.option2 || '',
                config.option3 || '',
                config.option4 || '',
                s.selectedLabel || '', // User's selected emotion label
                s.reactionTime, // Reaction time in milliseconds
                s.stimulusStartOffset || '', // Time from video start when stimulus was shown
                (s.stimulusStartOffset || 0) + 300 // Time from video start for 300ms frame
            ];
        })
    ];
    
    // Add metadata rows at the end
    const avgReactionTime = participantData.stimuli.length > 0 
        ? Math.round(participantData.stimuli.reduce((sum, s) => sum + s.reactionTime, 0) / participantData.stimuli.length)
        : 0;
    
    stimuliData.push([]); // Empty row separator
    stimuliData.push(['--- METADATA ---', '', '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Participant ID', participantData.info.participantId, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Age', participantData.info.age, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Gender', participantData.info.gender, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Timestamp', participantData.info.timestamp, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Accuracy', `${accuracy}%`, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Total Stimuli', participantData.stimuli.length, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Correct Answers', participantData.stimuli.filter(s => s.isCorrect).length, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Average Reaction Time (ms)', avgReactionTime, '', '', '', '', '', '', '', '', '', '']);
    
    const ws = XLSX.utils.aoa_to_sheet(stimuliData);
    XLSX.utils.book_append_sheet(wb, ws, 'Stimuli Data');
    
    const excelBlob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    downloadFile(new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
                 `${participantId}_metadata.xlsx`, 
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function downloadFile(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Start experiment when stimuli page is shown
let experimentStarted = false;
document.addEventListener('DOMContentLoaded', function() {
    const stimuliPage = document.getElementById('stimuli-page');
    const observer = new MutationObserver(function(mutations) {
        if (stimuliPage.classList.contains('active') && !experimentStarted) {
            experimentStarted = true;
            setTimeout(() => {
                startExperiment();
            }, 500);
        }
    });
    observer.observe(stimuliPage, { attributes: true, attributeFilter: ['class'] });
});

// Reset experiment flag when leaving stimuli page
const stimuliPage = document.getElementById('stimuli-page');
if (stimuliPage) {
    const pageObserver = new MutationObserver(function(mutations) {
        if (!stimuliPage.classList.contains('active')) {
            experimentStarted = false;
        }
    });
    pageObserver.observe(stimuliPage, { attributes: true, attributeFilter: ['class'] });
}

