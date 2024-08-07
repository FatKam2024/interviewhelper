let questions = [];
let stories = [];
let darkMode = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    fetchStories();
    startTimer();

    document.getElementById('searchInput').addEventListener('input', filterQuestions);
    document.getElementById('filterBtn').addEventListener('click', toggleFilters);
    document.getElementById('randomBtn').addEventListener('click', showRandomQuestions);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('storiesBtn').addEventListener('click', toggleStories);

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
        questionItem.classList.add('question-item');
        questionItem.innerHTML = `
            <h3>${question.question}</h3>
            <p>Category: ${question.category}</p>
            <p>Type: ${question.type}</p>
            <p>Relevant Job: ${question.relevantJob}</p>
            <div class="answer">
                <h4>OpenAI Answer:</h4>
                <h5>English:</h5>
                <p>${question.answers.openai.english || 'No answer available'}</p>
                <h5>Cantonese:</h5>
                <p>${question.answers.openai.cantonese || 'No answer available'}</p>
                <h4>Claude Answer:</h4>
                <h5>English:</h5>
                <p>${question.answers.claude.english || 'No answer available'}</p>
                <h5>Cantonese:</h5>
                <p>${question.answers.claude.cantonese || 'No answer available'}</p>
            </div>
        `;
        questionList.appendChild(questionItem);
    });
}

function filterQuestions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const type = document.getElementById('typeFilter').value;
    const job = document.getElementById('jobFilter').value;
    const source = document.getElementById('sourceFilter').value;

    const filteredQuestions = questions.filter(question => {
        const matchesSearch = question.question.toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || question.category === category;
        const matchesType = type === '' || question.type === type;
        const matchesJob = job === '' || question.relevantJob === job;
        const matchesSource = source === '' || (source === 'OpenAI' && question.answers.openai) || (source === 'Claude' && question.answers.claude);

        return matchesSearch && matchesCategory && matchesType && matchesJob && matchesSource;
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
}

function toggleStories() {
    const questionList = document.getElementById('questionList');
    const personalStories = document.getElementById('personalStories');

    if (personalStories.style.display === 'none') {
        questionList.style.display = 'none';
        personalStories.style.display = 'block';
        displayStories();
    } else {
        questionList.style.display = 'block';
        personalStories.style.display = 'none';
    }
}

function displayStories() {
    const personalStories = document.getElementById('personalStories');
    personalStories.innerHTML = '';

    stories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.classList.add('story-item');
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
