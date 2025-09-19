(function () {
  const STORAGE_KEY = "todo_tasks_v3";

  // DOM refs
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const list = document.getElementById("task-list");
  const stats = document.getElementById("stats");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const clearAllBtn = document.getElementById("clear-all");
  const sortToggleBtn = document.getElementById("sort-toggle");
  const logList = document.getElementById("task-log-list");

  // State
  let tasks = [];
  let sortOrder = "oldest";

  // Save to localStorage
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      sortOrder
    }));
    renderStats();
  }

  // Load from localStorage
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        tasks = data.tasks || [];
        sortOrder = data.sortOrder || "oldest";
        sortToggleBtn.textContent = `Sort: ${sortOrder === "oldest" ? "Oldest → Newest" : "Newest → Oldest"}`;
      } else {
        tasks = [];
        sortOrder = "oldest";
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
      tasks = [];
      sortOrder = "oldest";
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  // Rendering
  function render() {
    if (sortOrder === "oldest") {
      tasks.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      tasks.sort((a, b) => b.createdAt - a.createdAt);
    }

    list.innerHTML = "";
    if (tasks.length === 0) {
      const empty = document.createElement("li");
      empty.className = "task";
      empty.innerHTML = `<div class="task-text" style="color:rgba(255,255,255,0.7)">No tasks yet — add one above.</div>`;
      list.appendChild(empty);
      renderStats();
      renderLog();
      return;
    }

    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = "task";
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="left">
          <button class="checkbox ${task.done ? 'checked' : ''}">${task.done ? '✓' : ''}</button>
          <div class="task-text ${task.done ? 'completed' : ''}" tabindex="0">
            ${index + 1}. ${escapeHtml(task.text)}
            <div class="task-date">(Added on ${formatDate(task.createdAt)})</div>
          </div>
        </div>
        <div class="actions">
          <button class="action-btn toggle" title="Toggle done">⟳</button>
          <button class="action-btn delete" title="Delete task">✕</button>
        </div>
      `;

      li.querySelector(".checkbox").addEventListener("click", () => toggleDone(task.id));
      li.querySelector(".action-btn.toggle").addEventListener("click", () => toggleDone(task.id));
      li.querySelector(".action-btn.delete").addEventListener("click", () => deleteTask(task.id));

      list.appendChild(li);
    });

    renderStats();
    renderLog();
  }

  function renderStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    stats.textContent = `${total} task${total !== 1 ? 's' : ''} • ${done} completed`;
  }

  function renderLog() {
    logList.innerHTML = "";
    const logTasks = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
    logTasks.forEach(task => {
      const li = document.createElement("li");
      li.textContent = `Task added: "${task.text}" at ${formatDate(task.createdAt)}`;
      logList.appendChild(li);
    });
  }

  // Actions
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTask = { id: uid(), text: trimmed, done: false, createdAt: Date.now() };
    tasks.push(newTask);
    save();
    render();
  }

  function toggleDone(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  }

  function clearAll() {
    if (!confirm("Delete ALL tasks? This cannot be undone.")) return;
    tasks = [];
    save();
    render();
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // Events
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);
  clearAllBtn.addEventListener("click", clearAll);

  sortToggleBtn.addEventListener("click", () => {
    sortOrder = (sortOrder === "oldest") ? "newest" : "oldest";
    sortToggleBtn.textContent = `Sort: ${sortOrder === "oldest" ? "Oldest → Newest" : "Newest → Oldest"}`;
    save();
    render();
  });

  // Init
  load();
  render();

})();
