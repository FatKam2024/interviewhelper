let questions = [];
let stories = [];
let darkMode = false;
let favorites = [];
let customLists = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    fetchStories();
    startTimer();
    loadProgress();
    loadFavoritesAndCustomLists();
    initKeyboardShortcuts();

    document.getElementById('searchInput').addEventListener('input', filterQuestions);
    document.getElementById('filterBtn').addEventListener('click', toggleFilters);
    document.getElementById('randomBtn').addEventListener('click', showRandomQuestions);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

    const filterSelects = document.querySelectorAll('.filters select');
    filterSelects.forEach(select => select.addEventListener('change', filterQuestions));
});

async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        populateFilters();
        displayQuestions(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

async function fetchStories() {
    try {
        const response = await fetch('stories.json');
        stories = await response.json();
    } catch (error) {
        console.error('Error fetching stories:', error);
    }
}

function populateFilters() {
    const categories = new Set();
    const types = new Set();
    const jobs = new Set();

    questions.forEach(question => {
        categories.add(question.category);
        types.add(question.type);
        jobs.add(question.relevantJob);
    });

    populateSelect('categoryFilter', categories);
    populateSelect('typeFilter', types);
    populateSelect('jobFilter', jobs);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function displayQuestions(questionsToDisplay) {
    const questionList = document.getElementById('questionList');
    questionList.innerHTML = '';

    questionsToDisplay.forEach(question => {
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item', 'fade-in');
        questionItem.innerHTML = `
            <h3>${question.question}</h3>
            <p>Category: ${question.category}</p>
            <p>Type: ${question.type}</p>
            <p>Relevant Job: ${question.relevantJob}</p>
            <div class="answer">
                <h4>English Answer:</h4>
                <p>${question.answers.openai.english || question.answers.claude.english || 'No answer available'}</p>
                <h4>Cantonese Answer:</h4>
                <p>${question.answers.openai.cantonese || question.answers.claude.cantonese || 'No answer available'}</p>
            </div>
            <button class="favorite-btn" onclick="toggleFavorite(${question.id})">
                ${favorites.includes(question.id) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button class="complete-btn" onclick="toggleQuestionCompletion(${question.id})">
                ${question.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </button>
        `;
        questionList.appendChild(questionItem);
    });
}

function filterQuestions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const type = document.getElementById('typeFilter').value;
    const job = document.getElementById('jobFilter').value;
    const language = document.getElementById('languageFilter').value;
    const source = document.getElementById('sourceFilter').value;

    const filteredQuestions = questions.filter(question => {
        const matchesSearch = question.question.toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || question.category === category;
        const matchesType = type === '' || question.type === type;
        const matchesJob = job === '' || question.relevantJob === job;
        const matchesLanguage = language === '' || (language === 'english' && (question.answers.openai.english || question.answers.claude.english)) || (language === 'cantonese' && (question.answers.openai.cantonese || question.answers.claude.cantonese));
        const matchesSource = source === '' || (source === 'Human' && question.answers.human) || (source === 'OpenAI' && question.answers.openai) || (source === 'Claude' && question.answers.claude);

        return matchesSearch && matchesCategory && matchesType && matchesJob && matchesLanguage && matchesSource;
    });

    displayQuestions(filteredQuestions);
}

function toggleFilters() {
    const filters = document.getElementById('filters');
    filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
}

function showRandomQuestions() {
    const numQuestions = 5;
    const randomQuestions = [];
    const questionsCopy = [...questions];

    for (let i = 0; i < numQuestions && questionsCopy.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * questionsCopy.length);
        randomQuestions.push(questionsCopy.splice(randomIndex, 1)[0]);
    }

    displayQuestions(randomQuestions);
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Content`).classList.add('active');

    if (tabName === 'stories') {
        displayStories();
    }
}

function displayStories() {
    const personalStories = document.getElementById('personalStories');
    personalStories.innerHTML = '';

    stories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.classList.add('story-item', 'fade-in');
        storyItem.innerHTML = `
            <h3>${story.title}</h3>
            <p><strong>Situation:</strong> ${story.situation}</p>
            <p><strong>Story:</strong> ${story.story}</p>
        `;
        personalStories.appendChild(storyItem);
    });
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    let seconds = 0;

    setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        timerElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }, 1000);
}

function pad(number) {
    return number.toString().padStart(2, '0');
}

function toggleQuestionCompletion(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
        question.completed = !question.completed;
        updateProgressBar();
        saveProgress();
    }
}

function updateProgressBar() {
    const totalQuestions = questions.length;
    const completedQuestions = questions.filter(q => q.completed).length;
    const progressPercentage = (completedQuestions / totalQuestions) * 100;

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${Math.round(progressPercentage)}%`;
}

function saveProgress() {
    localStorage.setItem('interviewPrepProgress', JSON.stringify(questions));
}

function loadProgress() {
    const savedProgress = localStorage.getItem('interviewPrepProgress');
    if (savedProgress) {
        questions = JSON.parse(savedProgress);
        updateProgressBar();
    }
}

function toggleFavorite(questionId) {
    const index = favorites.indexOf(questionId);
    if (index === -1) {
        favorites.push(questionId);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    updateFavoriteButton(questionId);
}

function updateFavoriteButton(questionId) {
    const favoriteBtn = document.querySelector(`.favorite-btn[onclick="toggleFavorite(${questionId})"]`);
    if (favoriteBtn) {
        favoriteBtn.textContent = favorites.includes(questionId) ? 'Remove from Favorites' : 'Add to Favorites';
    }
}

function saveFavorites() {
    localStorage.setItem('interviewPrepFavorites', JSON.stringify(favorites));
}

function loadFavoritesAndCustomLists() {
    const savedFavorites = localStorage.getItem('interviewPrepFavorites');
    const savedCustomLists = localStorage.getItem('interviewPrepCustomLists');

    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
    if (savedCustomLists) {
        customLists = JSON.parse(savedCustomLists);
    }
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            document.getElementById('searchInput').focus();
        } else if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            showRandomQuestions();
        } else if (event.ctrlKey && event.key === 'd') {
            event.preventDefault();
            toggleDarkMode();
        }
    });
}

// Advanced search function using Fuse.js
function advancedSearch(searchTerm, questions) {
    const fuse = new Fuse(questions, {
        keys: ['question', 'category', 'type', 'relevantJob'],
        threshold: 0.4,
        includeScore: true
    });

    return fuse.search(searchTerm).map(result => result.item);
}

// Load dark mode preference on page load
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    toggleDarkMode();
}
