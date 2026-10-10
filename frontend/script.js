"use strict";

const $ = (selector) => document.querySelector(selector);

const form = $("#sentenceForm");
const keywordInput = $("#keyword");
const contextInput = $("#context");
const charCount = $("#charCount");

const generateButton = $("#generateButton");
const buttonText = $("#buttonText");

const emptyState = $("#emptyState");
const resultContent = $("#resultContent");
const sentenceText = $("#sentenceText");
const resultTag = $("#resultTag");
const wordCount = $("#wordCount");

const copyButton = $("#copyButton");
const copyText = $("#copyText");
const successMessage = $("#successMessage");

const anotherButton = $("#anotherButton");
const tryExample = $("#tryExample");
const writingTip = $("#writingTip");
const toast = $("#toast");

const styleCards = document.querySelectorAll(".style-card");

let selectedStyle = "simple";
let lastSentence = "";
let toastTimer;

const styleNames = {
    simple: "SIMPLE SENTENCE",
    creative: "CREATIVE SENTENCE",
    professional: "PROFESSIONAL SENTENCE",
    motivational: "MOTIVATIONAL SENTENCE",
    question: "QUESTION SENTENCE",
    negative: "NEGATIVE SENTENCE"
};

const tips = {
    simple: "Keep your sentence short, clear, and easy to understand.",
    creative: "Use expressive words to make your writing more interesting.",
    professional: "Use precise language and maintain a respectful tone.",
    motivational: "Focus on positive action, confidence, and progress.",
    question: "A question sentence asks something and usually ends with a question mark.",
    negative: "Negative sentences express denial or the absence of something."
};

const templates = {
    simple: [
        (word) => `${capitalize(word)} is an important part of everyday life.`,
        (word) => `We can learn many valuable lessons from ${word}.`,
        (word) => `${capitalize(word)} can make a meaningful difference in our lives.`,
        (word) => `Everyone can understand the importance of ${word}.`,
        (word) => `${capitalize(word)} helps us understand the world better.`
    ],

    creative: [
        (word) => `${capitalize(word)} is like a little spark that can light up an entire world.`,
        (word) => `In the story of life, ${word} adds a beautiful new chapter.`,
        (word) => `${capitalize(word)} turns ordinary moments into extraordinary memories.`,
        (word) => `Somewhere between dreams and reality, ${word} finds its magic.`,
        (word) => `${capitalize(word)} is a quiet whisper that inspires a thousand possibilities.`
    ],

    professional: [
        (word) => `${capitalize(word)} plays an important role in achieving meaningful outcomes.`,
        (word) => `Understanding ${word} can contribute to personal and professional development.`,
        (word) => `${capitalize(word)} provides valuable opportunities for growth and improvement.`,
        (word) => `A clear understanding of ${word} supports effective decision-making.`,
        (word) => `${capitalize(word)} remains an important consideration in our daily activities.`
    ],

    motivational: [
        (word) => `Believe in yourself, embrace ${word}, and keep moving toward your goals.`,
        (word) => `Every small step involving ${word} can bring you closer to success.`,
        (word) => `${capitalize(word)} becomes powerful when you combine it with determination.`,
        (word) => `Let ${word} inspire you to become a better version of yourself.`,
        (word) => `With patience and persistence, you can turn ${word} into an opportunity for growth.`
    ],

    question: [
        (word) => `How can ${word} make a positive difference in our lives?`,
        (word) => `Why is ${word} important for our future?`,
        (word) => `What can we learn by understanding ${word}?`,
        (word) => `How would our lives change without ${word}?`,
        (word) => `What opportunities can ${word} create for us?`
    ],

    negative: [
        (word) => `${capitalize(word)} is not something we should ignore.`,
        (word) => `We cannot understand the whole picture without considering ${word}.`,
        (word) => `${capitalize(word)} does not always produce the same result for everyone.`,
        (word) => `Ignoring ${word} is not always the best approach.`,
        (word) => `Success does not come from ${word} alone; consistent effort matters too.`
    ]
};

function capitalize(text) {
    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeSentence(sentence) {
    let result = sentence.trim().replace(/\s+/g, " ");

    result = result.replace(/\s+([,.!?;:])/g, "$1");

    if (!result) return "";

    if (!/[.!?]$/.test(result)) {
        result += ".";
    }

    return result;
}

function getRandomTemplate(style, previousSentence) {
    const options = templates[style] || templates.simple;

    let available = options.filter(
        (template) => template !== previousSentence
    );

    if (available.length === 0) {
        available = options;
    }

    return available[Math.floor(Math.random() * available.length)];
}

function createSentence(keyword, context, style) {
    const cleanedKeyword = keyword.trim();

    const template = getRandomTemplate(style, lastSentence);

    let sentence = template(cleanedKeyword);

    if (context.trim()) {
        const extra = context.trim().replace(/[.!?]+$/, "");

        if (style === "question") {
            sentence = `${sentence.slice(0, -1)} Consider this: ${extra}?`;
        } else {
            sentence = `${sentence.slice(0, -1)}, especially when ${extra}.`;
        }
    }

    return normalizeSentence(sentence);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function setLoading(isLoading) {
    generateButton.disabled = isLoading;

    if (isLoading) {
        buttonText.textContent = "Creating your sentence...";
    } else {
        buttonText.textContent = "Create My Sentence";
    }
}

function showResult(sentence, style) {
    lastSentence = sentence;

    sentenceText.textContent = sentence;

    resultTag.innerHTML = `<span>✦</span> ${styleNames[style]}`;

    const words = sentence.match(/\b[\w'-]+\b/g) || [];

    wordCount.textContent =
        `${words.length} ${words.length === 1 ? "word" : "words"}`;

    writingTip.textContent = tips[style];

    emptyState.classList.add("hidden");
    resultContent.classList.remove("hidden");

    successMessage.classList.add("hidden");
    copyText.textContent = "Copy sentence";

    // Restart the reveal animation.
    resultContent.style.animation = "none";
    void resultContent.offsetWidth;
    resultContent.style.animation = "";

    resultContent.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

styleCards.forEach((card) => {
    card.addEventListener("click", () => {
        styleCards.forEach((item) => item.classList.remove("active"));

        card.classList.add("active");
        selectedStyle = card.dataset.style;

        writingTip.textContent = tips[selectedStyle];

        showToast(`${capitalize(selectedStyle)} style selected`);
    });
});

keywordInput.addEventListener("input", () => {
    charCount.textContent = `${keywordInput.value.length}/120`;
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const keyword = keywordInput.value.trim();
    const context = contextInput.value.trim();

    if (!keyword) {
        showToast("Please enter a word or idea first.");
        keywordInput.focus();
        return;
    }

    if (keyword.length < 2) {
        showToast("Please enter at least two characters.");
        keywordInput.focus();
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/generate-sentence", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                keyword: keyword,
                context: context,
                style: selectedStyle
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Failed to generate sentence."
            );
        }

        showResult(data.sentence, selectedStyle);

        showToast("AI sentence generated successfully!");

    } catch (error) {
        console.error("Sentence generation error:", error);
        showToast(
            error.message || "Unable to connect to the AI server."
        );
    } finally {
        setLoading(false);
    }
});

    // Small delay to make the creation animation feel smoother.
    await new Promise((resolve) => setTimeout(resolve, 450));

    try {
        const sentence = createSentence(
            keyword,
            context,
            selectedStyle
        );

        showResult(sentence, selectedStyle);

        showToast("Your sentence is ready! ✨");
    } catch (error) {
        console.error("Sentence creation error:", error);
        showToast("Something went wrong. Please try again.");
    } finally {
        setLoading(false);
    }

copyButton.addEventListener("click", async () => {
    if (!lastSentence) {
        showToast("Create a sentence first.");
        return;
    }

    try {
        await navigator.clipboard.writeText(lastSentence);

        copyText.textContent = "Copied!";
        successMessage.classList.remove("hidden");

        showToast("Sentence copied successfully!");

        setTimeout(() => {
            copyText.textContent = "Copy sentence";
        }, 1800);
    } catch (error) {
        // Fallback for browsers where Clipboard API is unavailable.
        const temporaryTextArea = document.createElement("textarea");

        temporaryTextArea.value = lastSentence;
        temporaryTextArea.style.position = "fixed";
        temporaryTextArea.style.opacity = "0";

        document.body.appendChild(temporaryTextArea);

        temporaryTextArea.select();

        try {
            const copied = document.execCommand("copy");

            if (copied) {
                successMessage.classList.remove("hidden");
                copyText.textContent = "Copied!";
                showToast("Sentence copied successfully!");
            } else {
                showToast("Please select and copy the sentence manually.");
            }
        } catch {
            showToast("Please select and copy the sentence manually.");
        } finally {
            temporaryTextArea.remove();
        }
    }
});

anotherButton.addEventListener("click", () => {
    if (!keywordInput.value.trim()) {
        showToast("Enter a word to create another sentence.");
        keywordInput.focus();
        return;
    }

    form.requestSubmit();
});

tryExample.addEventListener("click", () => {
    keywordInput.value = "Success";
    charCount.textContent = `${keywordInput.value.length}/120`;

    keywordInput.focus();

    showToast("Example added! Choose a style and create your sentence.");
});

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        form.requestSubmit();
    }
});

console.log("SentenceCraft Studio loaded successfully.");