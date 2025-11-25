const NOTES_STORAGE_KEY = 'smartNotesPro_notes';
const THEME_STORAGE_KEY = 'smartNotesPro_theme';
let notes = [];

const notesContainer = document.getElementById('notes-container');
const noteFormContainer = document.getElementById('note-form-container');
const noteForm = document.getElementById('note-form');
const searchBar = document.getElementById('search-bar');
const sortBySelect = document.getElementById('sort-by');
const modeToggleBtn = document.getElementById('mode-toggle');
const downloadBtn = document.getElementById('download-btn');

function loadNotes() {
    const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    notes = storedNotes ? JSON.parse(storedNotes) : [];
    renderNotes();
}

function saveNotes() {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function mockAiFeatures(content) {
    const lowerContent = content.toLowerCase();
    
    const summary = content.substring(0, 50) + (content.length > 50 ? '...' : '');

    let tags = [];
    if (lowerContent.includes('meeting') || lowerContent.includes('work') || lowerContent.includes('project')) {
        tags.push('Work');
    }
    if (lowerContent.includes('idea') || lowerContent.includes('concept')) {
        tags.push('Idea');
    }
    if (tags.length === 0) tags.push('General');

    let mood = 'Neutral';
    if (lowerContent.includes('great') || lowerContent.includes('happy') || lowerContent.includes('success')) {
        mood = 'Positive 😊';
    } else if (lowerContent.includes('urgent') || lowerContent.includes('error') || lowerContent.includes('bug')) {
        mood = 'Urgent 🚨';
    }
    
    return { summary, tags, mood };
}

function applyMarkdown(text) {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    html = html.replace(/^#\s(.*?)$/gm, '<h1>$1</h1>');
    
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

function createNoteCardHTML(note, searchTerm) {
    const highlight = (text, term) => {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    };

    let formattedContent = applyMarkdown(note.content);

    const displayTitle = highlight(note.title, searchTerm);
    const displayContent = highlight(formattedContent, searchTerm);

    return `
        <div class="note-card ${note.isPinned ? 'pinned-note' : ''}" data-id="${note.id}">
            <div class="note-header">
                <h3>${displayTitle}</h3>
                <div class="card-actions">
                    <button onclick="togglePinNote(${note.id})">${note.isPinned ? '📌' : '📍'}</button>
                    <button onclick="editNote(${note.id})">✏️</button>
                    <button onclick="deleteNote(${note.id})">🗑️</button>
                </div>
            </div>
            <div class="note-meta">
                <span>Created: ${new Date(note.createdAt).toLocaleDateString()}</span> | 
                <span>Mood: ${note.mood}</span> |
                <span>Tags: ${note.tags.join(', ')}</span>
            </div>
            <div class="note-content">${displayContent}</div>
            <div class="note-summary">
                <small>Summary: ${note.summary}</small>
            </div>
        </div>
    `;
}

function renderNotes() {
    const searchTerm = searchBar.value.toLowerCase();
    const sortBy = sortBySelect.value;
    
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
    );

    filteredNotes.sort((a, b) => {
        const timeA = a.createdAt;
        const timeB = b.createdAt;

        let sortResult = 0;
        if (sortBy === 'newest') {
            sortResult = timeB - timeA;
        } else if (sortBy === 'oldest') {
            sortResult = timeA - timeB;
        }
        
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        return sortResult;
    });

    if (notes.length === 0 && searchTerm.trim() === '') {
        notesContainer.innerHTML = `
            <div class="no-results-message">
                <h2>Welcome to Smart Notes Pro!</h2>
                <p>Click "➕ Add New Note" to create your first note.</p>
            </div>
        `;
    } 
    else if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `
            <div class="no-results-message">
                <h2>No Notes Found</h2>
                <p>Your search for "<strong>${searchTerm}</strong>" did not match any notes.</p>
                <p>Try a different search term or add a new note!</p>
            </div>
        `;
    } 
    else {
        notesContainer.innerHTML = filteredNotes.map(note => 
            createNoteCardHTML(note, searchTerm)
        ).join('');
    }
}

function handleNoteSubmission(e) {
    e.preventDefault();

    const idToEdit = document.getElementById('note-id-edit').value;
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title || !content) return;

    if (idToEdit) {
        const noteIndex = notes.findIndex(n => n.id === parseInt(idToEdit));
        if (noteIndex !== -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            const aiData = mockAiFeatures(content);
            notes[noteIndex].summary = aiData.summary;
            notes[noteIndex].tags = aiData.tags;
            notes[noteIndex].mood = aiData.mood;
        }
    } else {
        const newNote = {
            id: Date.now(),
            title,
            content,
            createdAt: Date.now(),
            isPinned: false,
            ...mockAiFeatures(content)
        };
        notes.push(newNote);
    }

    saveNotes();
    renderNotes();
    noteFormContainer.classList.add('hidden');
    noteForm.reset();
    document.getElementById('note-id-edit').value = '';
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-id-edit').value = note.id;
    document.getElementById('save-note-btn').textContent = 'Update Note';
    noteFormContainer.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }
}

function togglePinNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.isPinned = !note.isPinned;
        saveNotes();
        renderNotes();
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    
    const currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
}

function downloadFile(filename, text, mimeType) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downloadNotes() {
    if (notes.length === 0) {
        alert('No notes found to download!');
        return;
    }

    const format = prompt('Enter format to download (json or txt):').toLowerCase().trim();

    if (format === 'json') {
        const jsonContent = JSON.stringify(notes, null, 2);
        downloadFile('smartnotes_backup.json', jsonContent, 'application/json');
    } else if (format === 'txt') {
        const textContent = notes.map(note => 
            `--- Note: ${note.title} ---\nDate: ${new Date(note.createdAt).toLocaleDateString()}\nTags: ${note.tags.join(', ')}\nMood: ${note.mood}\n\n${note.content}\n\n`
        ).join('====================\n');
        downloadFile('smartnotes_export.txt', textContent, 'text/plain');
    } else if (format) {
        alert('Invalid format. Please enter "json" or "text".');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (savedTheme) {
        document.body.classList.remove('light-mode', 'dark-mode'); 
        document.body.classList.add(`${savedTheme}-mode`);
    }

    loadNotes(); 

    document.getElementById('add-note-btn').addEventListener('click', () => {
        noteFormContainer.classList.remove('hidden');
        document.getElementById('note-title').focus();
    });

    document.getElementById('cancel-note-btn').addEventListener('click', () => {
        noteFormContainer.classList.add('hidden');
        noteForm.reset();
        document.getElementById('note-id-edit').value = '';
        document.getElementById('save-note-btn').textContent = 'Save Note';
    });

    noteForm.addEventListener('submit', handleNoteSubmission);
    
    searchBar.addEventListener('input', renderNotes);
    sortBySelect.addEventListener('change', renderNotes);

    modeToggleBtn.addEventListener('click', toggleDarkMode);
    
    downloadBtn.addEventListener('click', downloadNotes);
});