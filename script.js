/* ============================================================
   PLACEMENT PREPARATION TRACKER — script.js
   Features: Load / Save / Add / Render / Delete
   ============================================================ */


/* ============================================================
   1. DATA STORE
   The main array that holds all question objects in memory.
   This stays in sync with Local Storage on every change.
   ============================================================ */
let questions = [];


/* ============================================================
   2. LOCAL STORAGE KEY
   A single constant so we never mistype the key string.
   ============================================================ */
const STORAGE_KEY = 'placementQuestions';


/* ============================================================
   3. DOM ELEMENT REFERENCES
   Select every element we need once, at the top.
   Faster than calling getElementById() inside every function.
   ============================================================ */

// ── Form ──
const questionForm   = document.getElementById('question-form');

// ── Form Fields ──
const companyInput    = document.getElementById('company');
const topicInput      = document.getElementById('topic');
const titleInput      = document.getElementById('question-title');
const linkInput       = document.getElementById('leetcode-link');
const difficultyInput = document.getElementById('difficulty');
const statusInput     = document.getElementById('status');

// ── Table ──
const tableBody      = document.getElementById('questions-table-body');
const questionsTable = document.querySelector('.questions-table');

// ── Empty State ──
const emptyState     = document.getElementById('empty-state');


/* ============================================================
   4. FUNCTION: loadQuestions()
   Reads the questions array from Local Storage.
   If nothing is saved yet, keeps the empty array.
   ============================================================ */
function loadQuestions() {

  // Try to get saved data from Local Storage
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    // localStorage stores everything as a string, so we
    // convert it back to a JS array using JSON.parse()
    questions = JSON.parse(savedData);
    console.log(`✅ Loaded ${questions.length} question(s) from Local Storage.`);
  } else {
    // Nothing saved yet — start with an empty array
    questions = [];
    console.log('ℹ️  No saved questions found. Starting fresh.');
  }
}


/* ============================================================
   5. FUNCTION: saveQuestions()
   Writes the current questions array into Local Storage
   so data survives a page refresh.
   ============================================================ */
function saveQuestions() {

  // JSON.stringify() converts the JS array to a string
  // because localStorage can only store strings
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  console.log(`💾 Saved ${questions.length} question(s) to Local Storage.`);
}


/* ============================================================
   6. HELPER: getDifficultyBadge(difficulty)
   Returns an HTML string for a colored difficulty badge.
     Easy   → green   (.badge--easy)
     Medium → orange  (.badge--medium)
     Hard   → red     (.badge--hard)
   ============================================================ */
function getDifficultyBadge(difficulty) {

  // Map each difficulty value to its CSS modifier class
  const classMap = {
    'Easy':   'badge--easy',
    'Medium': 'badge--medium',
    'Hard':   'badge--hard'
  };

  const cssClass = classMap[difficulty] || 'badge--easy';
  return `<span class="badge ${cssClass}">${difficulty}</span>`;
}


/* ============================================================
   7. HELPER: getStatusBadge(status)
   Returns an HTML string for a colored status badge.
     Solved   → green  (.badge--solved)
     Unsolved → red    (.badge--unsolved)
   ============================================================ */
function getStatusBadge(status) {

  const cssClass = status === 'Solved' ? 'badge--solved' : 'badge--unsolved';
  return `<span class="badge ${cssClass}">${status}</span>`;
}


/* ============================================================
   8. HELPER: getLinkCell(link)
   If a LeetCode URL was provided → returns a clickable link.
   If the link is empty → returns a dash "—".
   ============================================================ */
function getLinkCell(link) {

  if (link) {
    // target="_blank" opens in a new tab
    // rel="noopener"  is a security best practice for external links
    return `
      <div class="link-cell">
        <a href="${link}" target="_blank" rel="noopener noreferrer">
          Open <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>`;
  }

  return '<span style="color: var(--clr-text-muted);">—</span>';
}


/* ============================================================
   9. FUNCTION: createTableRow(question)
   Accepts a single question object and returns a complete
   <tr> element with all 7 columns filled in.
   The Delete button's click event is wired up here.
   ============================================================ */
function createTableRow(question) {

  // Create a new <tr> DOM element
  const row = document.createElement('tr');

  // Fill its 7 columns using a template literal
  row.innerHTML = `
    <td><span class="tag-company">${question.company}</span></td>
    <td><span class="tag-topic">${question.topic}</span></td>
    <td><span class="question-title-cell">${question.title}</span></td>
    <td>${getDifficultyBadge(question.difficulty)}</td>
    <td>${getStatusBadge(question.status)}</td>
    <td>${getLinkCell(question.link)}</td>
    <td>
      <div class="actions-cell">
        <button class="btn--delete" data-id="${question.id}" title="Delete this question">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </td>
  `;

  // Wire up the Delete button with addEventListener
  // (cleaner than inline onclick attributes)
  const deleteBtn = row.querySelector('.btn--delete');
  deleteBtn.addEventListener('click', function () {
    // data-id is stored as a string; convert to Number
    // because question.id was saved as Date.now() (a Number)
    const questionId = Number(this.dataset.id);
    deleteQuestion(questionId);
  });

  return row;
}


/* ============================================================
   10. FUNCTION: renderQuestions()
   Clears the table body and re-draws every row from scratch
   using the current state of the questions array.

   Flow:
     1. Clear existing rows.
     2. Array empty  → show empty state, hide table.
     3. Array filled → hide empty state, show table,
                       loop and append one row per question.
   ============================================================ */
function renderQuestions() {

  // ── Step 1: Clear any existing rows ──
  tableBody.innerHTML = '';

  // ── Step 2: Nothing to show ──
  if (questions.length === 0) {
    emptyState.style.display     = 'flex';
    questionsTable.style.display = 'none';
    console.log('📭 No questions — showing empty state.');
    return;
  }

  // ── Step 3: Questions exist — show the table ──
  emptyState.style.display     = 'none';
  questionsTable.style.display = 'table';

  // Loop through every question and append a row
  questions.forEach(function (question) {
    const row = createTableRow(question);
    tableBody.appendChild(row);
  });

  console.log(`📋 Rendered ${questions.length} question(s).`);
}


/* ============================================================
   11. FUNCTION: deleteQuestion(id)
   Removes a single question from the array by its id,
   then saves and re-renders.

   Steps:
     a) Ask the user to confirm.
     b) Filter out the matching question.
     c) Save the updated array.
     d) Re-render the table.
   ============================================================ */
function deleteQuestion(id) {

  // ── a) Confirm before deleting — there is no undo ──
  const confirmed = confirm('🗑️  Are you sure you want to delete this question?\nThis action cannot be undone.');

  if (!confirmed) {
    return; // User clicked Cancel — do nothing
  }

  // ── b) Remove the question ──
  // filter() creates a new array keeping every question
  // whose id does NOT match the one we want to delete
  questions = questions.filter(function (question) {
    return question.id !== id;
  });

  console.log(`🗑️  Deleted question id: ${id}. Remaining: ${questions.length}`);

  // ── c) Persist the change ──
  saveQuestions();

  // ── d) Refresh the table ──
  renderQuestions();
}


/* ============================================================
   12. FUNCTION: addQuestion(event)
   Handles the form's submit event:
     a) Prevent page refresh.
     b) Read and trim all field values.
     c) Validate required fields.
     d) Build the question object.
     e) Push into the array.
     f) Save to Local Storage.
     g) Reset the form.
     h) Show a success alert.
     i) Re-render the table.
   ============================================================ */
function addQuestion(event) {

  // ── a) Stop the browser from refreshing the page ──
  event.preventDefault();

  // ── b) Read values from every field ──
  // .trim() removes accidental leading/trailing spaces
  const company    = companyInput.value.trim();
  const topic      = topicInput.value.trim();
  const title      = titleInput.value.trim();
  const link       = linkInput.value.trim();      // optional field
  const difficulty = difficultyInput.value.trim();
  const status     = statusInput.value.trim();

  // ── c) Validate required fields ──
  // LeetCode link is optional, so we skip it here
  if (!company) {
    alert('⚠️  Please select a Company.');
    companyInput.focus();
    return;
  }

  if (!topic) {
    alert('⚠️  Please select a Topic.');
    topicInput.focus();
    return;
  }

  if (!title) {
    alert('⚠️  Please enter the Question Title.');
    titleInput.focus();
    return;
  }

  if (!difficulty) {
    alert('⚠️  Please select a Difficulty level.');
    difficultyInput.focus();
    return;
  }

  if (!status) {
    alert('⚠️  Please select a Status.');
    statusInput.focus();
    return;
  }

  // ── d) Build the question object ──
  // Date.now() gives a unique number (ms since 1970) as the id
  const newQuestion = {
    id:         Date.now(),
    company:    company,
    topic:      topic,
    title:      title,
    link:       link,        // may be an empty string — that's fine
    difficulty: difficulty,
    status:     status
  };

  console.log('📝 New question created:', newQuestion);

  // ── e) Add to the array ──
  questions.push(newQuestion);

  // ── f) Persist to Local Storage ──
  saveQuestions();

  // ── g) Clear the form for the next entry ──
  questionForm.reset();

  // ── h) Confirm success to the user ──
  alert('✅ Question Added Successfully!');

  // ── i) Refresh the table so the new row appears ──
  renderQuestions();
}


/* ============================================================
   13. EVENT LISTENER — Form Submit
   Fires when the "Add Question" button is clicked OR when
   the user presses Enter inside any form field.
   ============================================================ */
questionForm.addEventListener('submit', addQuestion);


/* ============================================================
   14. FUNCTION: init()
   Entry point — runs once when the page loads.
     1. Load saved questions from Local Storage.
     2. Render the table (or empty state).
   ============================================================ */
function init() {
  console.log('🚀 Placement Preparation Tracker initialising...');
  loadQuestions();
  renderQuestions();
  console.log('🖥️  Initial render complete.');
}

// Start the app
init();

/* ============================================================
   PART 3 — LIVE SEARCH + FILTERS
   ============================================================ */


/* ============================================================
   15. NEW DOM REFERENCES (Search & Filter inputs)
   ============================================================ */
const searchInput     = document.getElementById('search-input');
const filterCompany   = document.getElementById('filter-company');
const filterTopic     = document.getElementById('filter-topic');


/* ============================================================
   16. FUNCTION: getFilteredQuestions()
   Reads the current values of the search box and both
   filter dropdowns, then returns a filtered subset of
   the questions array.

   All three conditions are combined with AND logic:
     - Company filter matches  AND
     - Topic filter matches    AND
     - Search text matches (company OR topic OR title)
   ============================================================ */
function getFilteredQuestions() {

  // Read current filter values and normalise to lowercase
  const searchText      = searchInput.value.trim().toLowerCase();
  const selectedCompany = filterCompany.value;   // "" = All Companies
  const selectedTopic   = filterTopic.value;     // "" = All Topics

  return questions.filter(function (question) {

    // ── Company filter ──
    // If a specific company is selected, the question must match it
    const companyMatch = selectedCompany === ''
      ? true
      : question.company === selectedCompany;

    // ── Topic filter ──
    // Same logic for topic
    const topicMatch = selectedTopic === ''
      ? true
      : question.topic === selectedTopic;

    // ── Live search ──
    // Check if the search text appears anywhere in company,
    // topic, or title (all lowercased for case-insensitive match)
    const searchMatch = searchText === ''
      ? true
      : question.company.toLowerCase().includes(searchText) ||
        question.topic.toLowerCase().includes(searchText)   ||
        question.title.toLowerCase().includes(searchText);

    // Question must pass ALL three conditions
    return companyMatch && topicMatch && searchMatch;
  });
}


/* ============================================================
   17. FUNCTION: renderFiltered()
   Gets the filtered subset and renders it into the table.
   Unlike renderQuestions() which always shows ALL questions,
   this function works from the filtered subset.

   If the filtered result is empty it shows the empty state
   with a "No matching questions found." message.
   If the full questions array is also empty it falls back to
   the standard "No questions added yet." message.
   ============================================================ */
function renderFiltered() {

  const filtered = getFilteredQuestions();

  // Always clear existing rows first
  tableBody.innerHTML = '';

  if (filtered.length === 0) {

    // Hide the table
    questionsTable.style.display = 'none';

    // Show empty state with context-aware message
    emptyState.style.display = 'flex';

    const emptyText = emptyState.querySelector('.empty-state-text');
    const emptySub  = emptyState.querySelector('.empty-state-sub');

    if (questions.length === 0) {
      // No questions exist at all
      emptyText.textContent = 'No questions added yet.';
      emptySub.textContent  = 'Fill in the form above to start tracking your progress.';
    } else {
      // Questions exist but none match the current filters
      emptyText.textContent = 'No matching questions found.';
      emptySub.textContent  = 'Try adjusting your search or clearing the filters.';
    }

    return;
  }

  // Matching questions found — show the table
  emptyState.style.display     = 'none';
  questionsTable.style.display = 'table';

  filtered.forEach(function (question) {
    const row = createTableRow(question);
    tableBody.appendChild(row);
  });

  console.log(`🔍 Showing ${filtered.length} of ${questions.length} question(s).`);
}


/* ============================================================
   18. PATCH: renderQuestions()
   Every place that previously called renderQuestions() should
   now go through renderFiltered() so active filters are always
   respected (e.g. after adding or deleting a question).

   We reassign the name renderQuestions to renderFiltered so
   all existing callers (addQuestion, deleteQuestion, init)
   automatically get the new behaviour without touching them.
   ============================================================ */
renderQuestions = renderFiltered;   // redirect existing callers


/* ============================================================
   19. EVENT LISTENERS — Search & Filters
   'input'  fires on every keystroke in the search box.
   'change' fires when a new dropdown option is selected.
   All three listeners call renderFiltered() to update the view.
   ============================================================ */
searchInput.addEventListener('input',  renderFiltered);
filterCompany.addEventListener('change', renderFiltered);
filterTopic.addEventListener('change',   renderFiltered);

/* ============================================================
   PART 4 — DASHBOARD + PROGRESS BAR
   ============================================================ */


/* ============================================================
   20. NEW DOM REFERENCES (Dashboard cards + progress bar)
   ============================================================ */
const totalEl             = document.getElementById('total-questions');
const solvedEl            = document.getElementById('solved-questions');
const remainingEl         = document.getElementById('remaining-questions');
const progressPercentEl   = document.getElementById('progress-percent');
const progressBarFill     = document.getElementById('progress-bar-fill');
const progressBarTrack    = document.getElementById('progress-bar-track');
const progressBarPercent  = document.getElementById('progress-bar-percent');
const progressLegendSolved    = document.getElementById('progress-legend-solved');
const progressLegendRemaining = document.getElementById('progress-legend-remaining');


/* ============================================================
   21. FUNCTION: updateDashboard()
   Calculates all four stats from the questions array and
   pushes the values into every dashboard element.

   Stats:
     Total     = questions.length
     Solved    = questions where status === 'Solved'
     Remaining = Total - Solved
     Progress  = (Solved / Total) * 100  →  rounded integer
                 0 when Total is 0 (avoid division by zero)
   ============================================================ */
function updateDashboard() {

  // ── Calculate stats ──
  const total     = questions.length;
  const solved    = questions.filter(function (q) {
    return q.status === 'Solved';
  }).length;
  const remaining = total - solved;
  const percent   = total === 0
    ? 0
    : Math.round((solved / total) * 100);

  // ── Update the four stat cards ──
  totalEl.textContent           = total;
  solvedEl.textContent          = solved;
  remainingEl.textContent       = remaining;
  progressPercentEl.textContent = percent + '%';

  // ── Update the progress bar fill width ──
  progressBarFill.style.width = percent + '%';

  // ── Update aria-valuenow for accessibility ──
  progressBarTrack.setAttribute('aria-valuenow', percent);

  // ── Update the % label above the bar ──
  progressBarPercent.textContent = percent + '%';

  // ── Update the Solved / Remaining legend below the bar ──
  progressLegendSolved.textContent    = solved;
  progressLegendRemaining.textContent = remaining;

  console.log(`📊 Dashboard updated — Total: ${total} | Solved: ${solved} | Remaining: ${remaining} | Progress: ${percent}%`);
}


/* ============================================================
   22. PATCH: hook updateDashboard() into existing functions
   We wrap renderQuestions (which already points to
   renderFiltered) so every render automatically refreshes
   the dashboard too — covers add, delete, and page load
   without touching any of the original functions.
   ============================================================ */
const _renderFiltered = renderQuestions;   // save current reference

renderQuestions = function () {
  _renderFiltered();      // render the table (with active filters)
  updateDashboard();      // then refresh all dashboard numbers
};

// Re-bind the three filter/search listeners to the new wrapper
// so typing in the search box also keeps the dashboard correct
searchInput.removeEventListener('input',    renderFiltered);
filterCompany.removeEventListener('change', renderFiltered);
filterTopic.removeEventListener('change',   renderFiltered);

searchInput.addEventListener('input',    renderQuestions);
filterCompany.addEventListener('change', renderQuestions);
filterTopic.addEventListener('change',   renderQuestions);


/* ============================================================
   23. INITIAL DASHBOARD RENDER
   Page has already loaded questions in init().
   Call updateDashboard() once now so the cards show correct
   numbers immediately on first paint.
   ============================================================ */
updateDashboard();

/* ============================================================
   FINAL PART — Edit, Reset Edit Mode, Duplicate Check, UX
   ============================================================ */


/* ============================================================
   24. EDIT STATE
   editingId tracks which question is being edited.
   null  = Add mode (normal)
   number = Edit mode (that question's id)
   ============================================================ */
let editingId = null;


/* ============================================================
   25. NEW DOM REFERENCES (Add/Update button + Reset button)
   ============================================================ */
const addBtn   = document.getElementById('add-question-btn');
const resetBtn = document.getElementById('reset-form-btn');


/* ============================================================
   26. HELPER: enterEditMode(question)
   Populates the form with an existing question's data and
   switches the UI into Edit mode.
   ============================================================ */
function enterEditMode(question) {

  // Store which question we are editing
  editingId = question.id;

  // Populate every form field with the question's current values
  companyInput.value    = question.company;
  topicInput.value      = question.topic;
  titleInput.value      = question.title;
  linkInput.value       = question.link;
  difficultyInput.value = question.difficulty;
  statusInput.value     = question.status;

  // Change the submit button label
  addBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Question';

  // Scroll smoothly to the form so the user sees it
  questionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Focus the first field
  companyInput.focus();

  console.log(`✏️  Entered edit mode for question id: ${editingId}`);
}


/* ============================================================
   27. HELPER: exitEditMode()
   Clears the form, resets the button label, and returns
   the app to normal Add mode.
   ============================================================ */
function exitEditMode() {

  editingId = null;

  questionForm.reset();

  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Question';

  console.log('↩️  Exited edit mode.');
}


/* ============================================================
   28. HELPER: isDuplicate(company, title, excludeId)
   Returns true if a question with the same company + title
   already exists in the array.
   excludeId lets us skip the question currently being edited
   so updating it does not falsely trigger the duplicate check.
   ============================================================ */
function isDuplicate(company, title, excludeId) {

  return questions.some(function (q) {

    // Skip the question we are currently editing
    if (q.id === excludeId) return false;

    return (
      q.company.toLowerCase() === company.toLowerCase() &&
      q.title.toLowerCase()   === title.toLowerCase()
    );
  });
}


/* ============================================================
   29. HELPER: scrollToTable()
   Smoothly scrolls the viewport to the Question List section
   so the user can immediately see the result of their action.
   ============================================================ */
function scrollToTable() {
  const tableSection = document.querySelector('.question-list');
  if (tableSection) {
    tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


/* ============================================================
   30. PATCH: replace the addQuestion submit handler
   The original handler (Part 1) does not know about edit mode
   or duplicate checking. We remove it and replace it with a
   new version that handles both Add and Update in one place.
   ============================================================ */

// Remove the original submit listener added in Part 1
questionForm.removeEventListener('submit', addQuestion);

// Also remove the Part 3 filter-redirect listener if present
// (renderQuestions wrapper handles those now via Part 4 patch)

// Define the new unified submit handler
function handleFormSubmit(event) {

  event.preventDefault();

  // ── Read & trim all fields ──
  const company    = companyInput.value.trim();
  const topic      = topicInput.value.trim();
  const title      = titleInput.value.trim();
  const link       = linkInput.value.trim();
  const difficulty = difficultyInput.value.trim();
  const status     = statusInput.value.trim();

  // ── Validate required fields ──
  if (!company) {
    alert('⚠️  Please select a Company.');
    companyInput.focus();
    return;
  }
  if (!topic) {
    alert('⚠️  Please select a Topic.');
    topicInput.focus();
    return;
  }
  if (!title) {
    alert('⚠️  Please enter the Question Title.');
    titleInput.focus();
    return;
  }
  if (!difficulty) {
    alert('⚠️  Please select a Difficulty level.');
    difficultyInput.focus();
    return;
  }
  if (!status) {
    alert('⚠️  Please select a Status.');
    statusInput.focus();
    return;
  }

  // ── Duplicate check ──
  // Pass editingId so the current question is excluded
  if (isDuplicate(company, title, editingId)) {
    alert('⚠️  This question already exists.');
    titleInput.focus();
    return;
  }

  // ════════════════════════════════════════
  // EDIT MODE — update the existing question
  // ════════════════════════════════════════
  if (editingId !== null) {

    // Find the question in the array and update its fields
    questions = questions.map(function (q) {
      if (q.id === editingId) {
        return {
          id:         q.id,       // keep the original id
          company:    company,
          topic:      topic,
          title:      title,
          link:       link,
          difficulty: difficulty,
          status:     status
        };
      }
      return q;                   // leave all other questions untouched
    });

    console.log(`✅ Updated question id: ${editingId}`);

    saveQuestions();
    exitEditMode();               // resets form + button + editingId
    renderQuestions();            // re-renders table + dashboard

    alert('✅ Question Updated Successfully!');
    scrollToTable();

    return;
  }

  // ════════════════════════════════════════
  // ADD MODE — create a brand-new question
  // ════════════════════════════════════════
  const newQuestion = {
    id:         Date.now(),
    company:    company,
    topic:      topic,
    title:      title,
    link:       link,
    difficulty: difficulty,
    status:     status
  };

  console.log('📝 New question created:', newQuestion);

  questions.push(newQuestion);
  saveQuestions();

  questionForm.reset();
  renderQuestions();            // re-renders table + dashboard

  alert('✅ Question Added Successfully!');
  scrollToTable();
}

// Attach the new unified handler
questionForm.addEventListener('submit', handleFormSubmit);


/* ============================================================
   31. PATCH: createTableRow — add Edit button beside Delete
   We override createTableRow so every rendered row includes
   an Edit button that calls enterEditMode() when clicked.
   ============================================================ */
const _createTableRow = createTableRow;   // keep original for reference

createTableRow = function (question) {

  // Build the row using the original function
  const row = _createTableRow(question);

  // Grab the actions cell (last <td>)
  const actionsCell = row.querySelector('.actions-cell');

  // Build the Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn--edit';
  editBtn.dataset.id = question.id;
  editBtn.title = 'Edit this question';
  editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';

  // Wire up the click — find the question object and enter edit mode
  editBtn.addEventListener('click', function () {
    const id = Number(this.dataset.id);
    const target = questions.find(function (q) { return q.id === id; });
    if (target) enterEditMode(target);
  });

  // Insert Edit button BEFORE the existing Delete button
  actionsCell.insertBefore(editBtn, actionsCell.firstChild);

  return row;
};


/* ============================================================
   32. RESET BUTTON — exit edit mode on click
   The HTML reset button already clears the form via the
   browser's built-in behaviour. We just need to also exit
   edit mode and restore the button label.
   ============================================================ */
resetBtn.addEventListener('click', function () {
  if (editingId !== null) {
    exitEditMode();
    console.log('🔄 Edit cancelled via Reset button.');
  }
});


/* ============================================================
   33. RE-RENDER once so Edit buttons appear on existing rows
   ============================================================ */
renderQuestions();