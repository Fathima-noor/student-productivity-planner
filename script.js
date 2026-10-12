
const STORAGE_KEY = "studyflow_tasks";

const taskList = document.getElementById("task-list");
const calendarList = document.getElementById("calendar-list");
const taskDialog = document.getElementById("task-dialog");
const taskForm = document.getElementById("task-form");

const taskFields = {
  id: document.getElementById("task-id"),
  title: document.getElementById("task-title"),
  subject: document.getElementById("task-subject"),
  description: document.getElementById("task-description"),
  date: document.getElementById("task-date"),
  priority: document.getElementById("task-priority")
};

let currentView = "dashboard";
let searchTerm = "";
let statusFilter = "all";
let priorityFilter = "all";

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function createDemoTasks() {
  return [
    {
      id: "demo-1",
      title: "Complete database assignment",
      subject: "Database Management",
      description: "Finish SQL queries and prepare the assignment.",
      date: dateAfter(1),
      priority: "High",
      completed: false
    },
    {
      id: "demo-2",
      title: "Revise JavaScript fundamentals",
      subject: "Web Development",
      description: "Review functions, arrays, and DOM manipulation.",
      date: dateAfter(2),
      priority: "Medium",
      completed: false
    },
    {
      id: "demo-3",
      title: "Prepare project presentation",
      subject: "Project Work",
      description: "Organize slides and practise the presentation.",
      date: dateAfter(3),
      priority: "High",
      completed: false
    },
    {
      id: "demo-4",
      title: "Review computer networks",
      subject: "Computer Networks",
      description: "Revise the important concepts from class.",
      date: dateAfter(0),
      priority: "Low",
      completed: true
    }
  ];
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      const demoTasks = createDemoTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoTasks));
      return demoTasks;
    }

    const parsed = JSON.parse(saved);

    if (
      !Array.isArray(parsed) ||
      !parsed.every(task =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.subject === "string" &&
        typeof task.date === "string" &&
        ["High", "Medium", "Low"].includes(task.priority) &&
        typeof task.completed === "boolean"
      )
    ) {
      throw new Error("Invalid saved task data.");
    }

    return parsed;
  } catch (error) {
    console.error("Unable to load saved tasks:", error);
    alert("Saved task data could not be loaded. The planner will start with demo tasks.");
    return createDemoTasks();
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Unable to save tasks:", error);
    alert("Your changes could not be saved. Check your browser storage.");
    return false;
  }
}

function isOverdue(task) {
  return !task.completed && task.date < localDateString();
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(isOverdue).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("total-count").textContent = total;
  document.getElementById("completed-count").textContent = completed;
  document.getElementById("pending-count").textContent = pending;
  document.getElementById("overdue-count").textContent = overdue;

  document.getElementById("progress-percent").textContent = `${percentage}%`;
  document.getElementById("progress-fill").style.width = `${percentage}%`;
  document.getElementById("progress-summary").textContent =
    `${completed} of ${total} tasks completed`;
}

function getFilteredTasks() {
  return tasks
    .filter(task => {
      const searchMatch =
        task.title.toLowerCase().includes(searchTerm) ||
        task.subject.toLowerCase().includes(searchTerm) ||
        (task.description || "").toLowerCase().includes(searchTerm);

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "completed" && task.completed) ||
        (statusFilter === "pending" && !task.completed);

      const priorityMatch =
        priorityFilter === "all" || task.priority === priorityFilter;

      return searchMatch && statusMatch && priorityMatch;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function taskMarkup(task) {
  const overdue = isOverdue(task);

  return `
    <article class="task-row">
      <input
        class="complete-checkbox"
        type="checkbox"
        data-action="toggle"
        data-id="${escapeHTML(task.id)}"
        aria-label="Mark ${escapeHTML(task.title)} as completed"
        ${task.completed ? "checked" : ""}
      >

      <div>
        <div class="task-title ${task.completed ? "done" : ""}">
          ${escapeHTML(task.title)}
        </div>

        ${task.description ? `
          <p class="task-description">
            ${escapeHTML(task.description)}
          </p>
        ` : ""}

        <div class="task-meta">
          <span class="subject-tag">${escapeHTML(task.subject)}</span>
          <span class="priority-tag ${task.priority.toLowerCase()}">
            ${escapeHTML(task.priority)}
          </span>
          ${task.completed ? '<span class="status-tag">Completed</span>' : ""}
        </div>

        <p class="task-date ${overdue ? "overdue" : ""}">
          ${overdue ? "Overdue · " : "Due "}
          ${escapeHTML(formatDate(task.date))}
        </p>
      </div>

      <div class="task-actions">
        <button
          class="icon-button"
          type="button"
          data-action="edit"
          data-id="${escapeHTML(task.id)}"
          aria-label="Edit ${escapeHTML(task.title)}"
          title="Edit task"
        >✎</button>

        <button
          class="icon-button"
          type="button"
          data-action="delete"
          data-id="${escapeHTML(task.id)}"
          aria-label="Delete ${escapeHTML(task.title)}"
          title="Delete task"
        >×</button>
      </div>
    </article>
  `;
}

function renderTaskList(container, taskArray, emptyTitle, emptyMessage) {
  if (taskArray.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>${escapeHTML(emptyTitle)}</strong>
        <p>${escapeHTML(emptyMessage)}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = taskArray.map(taskMarkup).join("");
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  renderTaskList(
    taskList,
    filteredTasks,
    "No tasks found",
    "Try another search or add a new task to your planner."
  );

  const upcomingTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => a.date.localeCompare(b.date));

  renderTaskList(
    calendarList,
    upcomingTasks,
    "No upcoming deadlines",
    "All caught up! Add a task whenever you need to."
  );
}

function renderApp() {
  updateDashboard();
  renderTasks();
  updateView();
}

function updateView() {
  const isCalendar = currentView === "calendar";
  const isTasks = currentView === "tasks";

  document.getElementById("task-section").classList.toggle("hidden", isCalendar);
  document.getElementById("calendar-section").classList.toggle("hidden", !isCalendar);

  document.getElementById("page-title").textContent =
    isCalendar ? "Calendar" : isTasks ? "My Tasks" : "Dashboard";

  document.getElementById("task-section-title").textContent =
    isTasks ? "All tasks" : "Your tasks";

  document.getElementById("task-section-subtitle").textContent =
    isTasks
      ? "Search, filter, and manage all your study tasks."
      : "Manage your assignments and study goals.";

  document.querySelectorAll(".nav-link").forEach(button => {
    const active = button.dataset.view === currentView;

    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function openCreateDialog() {
  taskForm.reset();
  taskFields.id.value = "";
  taskFields.date.value = dateAfter(1);

  document.getElementById("dialog-title").textContent = "Create a task";
  document.getElementById("save-task-button").textContent = "Save task";
  document.getElementById("form-error").textContent = "";

  taskDialog.showModal();
  taskFields.title.focus();
}

function openEditDialog(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  taskFields.id.value = task.id;
  taskFields.title.value = task.title;
  taskFields.subject.value = task.subject;
  taskFields.description.value = task.description || "";
  taskFields.date.value = task.date;
  taskFields.priority.value = task.priority;

  document.getElementById("dialog-title").textContent = "Edit task";
  document.getElementById("save-task-button").textContent = "Update task";
  document.getElementById("form-error").textContent = "";

  taskDialog.showModal();
  taskFields.title.focus();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const title = taskFields.title.value.trim();
  const subject = taskFields.subject.value.trim();
  const description = taskFields.description.value.trim();
  const date = taskFields.date.value;
  const priority = taskFields.priority.value;
  const existingId = taskFields.id.value;

  const errorElement = document.getElementById("form-error");
  errorElement.textContent = "";

  if (!title || !subject || !date) {
    errorElement.textContent = "Please complete all required fields.";
    return;
  }

  const parsedDate = new Date(`${date}T12:00:00`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    localDateString(parsedDate) !== date
  ) {
    errorElement.textContent = "Please enter a valid due date.";
    return;
  }

  if (!["High", "Medium", "Low"].includes(priority)) {
    errorElement.textContent = "Please select a valid priority.";
    return;
  }

  const existingTask = tasks.find(task => task.id === existingId);

  const taskData = {
    id: existingTask ? existingTask.id : crypto.randomUUID(),
    title,
    subject,
    description,
    date,
    priority,
    completed: existingTask ? existingTask.completed : false
  };

  const previousTasks = [...tasks];

  if (existingTask) {
    tasks = tasks.map(task =>
      task.id === existingId ? taskData : task
    );
  } else {
    tasks.push(taskData);
  }

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  taskDialog.close();
  taskForm.reset();
  renderApp();
}

function toggleTask(id, completed) {
  const previousTasks = [...tasks];

  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed } : task
  );

  if (!saveTasks()) {
    tasks = previousTasks;
  }

  renderApp();
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) {
    return;
  }

  const previousTasks = tasks;
  tasks = tasks.filter(item => item.id !== id);

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  renderApp();
}

document.getElementById("add-task-button").addEventListener("click", openCreateDialog);

document.getElementById("close-dialog").addEventListener("click", () => {
  taskDialog.close();
});

document.getElementById("cancel-dialog").addEventListener("click", () => {
  taskDialog.close();
});

taskForm.addEventListener("submit", handleTaskSubmit);

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    updateView();
  });
});

document.getElementById("search-input").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderTasks();
});

document.getElementById("status-filter").addEventListener("change", event => {
  statusFilter = event.target.value;
  renderTasks();
});

document.getElementById("priority-filter").addEventListener("change", event => {
  priorityFilter = event.target.value;
  renderTasks();
});

document.getElementById("clear-filters").addEventListener("click", () => {
  searchTerm = "";
  statusFilter = "all";
  priorityFilter = "all";

  document.getElementById("search-input").value = "";
  document.getElementById("status-filter").value = "all";
  document.getElementById("priority-filter").value = "all";

  renderTasks();
});

function handleTaskAction(event) {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const control = target.closest("[data-action]");

  if (!control) return;

  const { action, id } = control.dataset;

  if (!id) return;

  if (action === "toggle") {
    toggleTask(id, control.checked);
  } else if (action === "edit") {
    openEditDialog(id);
  } else if (action === "delete") {
    deleteTask(id);
  }
}

taskList.addEventListener("click", handleTaskAction);
calendarList.addEventListener("click", handleTaskAction);

taskList.addEventListener("change", event => {
  if (event.target.matches('[data-action="toggle"]')) {
    handleTaskAction(event);
  }
});

calendarList.addEventListener("change", event => {
  if (event.target.matches('[data-action="toggle"]')) {
    handleTaskAction(event);
  }
});

document.getElementById("today-label").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).toUpperCase();

renderApp();
