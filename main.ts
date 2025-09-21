(() => {
  const STORAGE_KEY = "todo_tasks_v3";

  // Interfaces
  interface Task {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
  }

  type SortOrder = "oldest" | "newest";

  // DOM refs (with non-null assertions, since elements must exist in HTML)
  const form = document.getElementById("task-form") as HTMLFormElement;
  const input = document.getElementById("task-input") as HTMLInputElement;
  const list = document.getElementById("task-list") as HTMLUListElement;
  const stats = document.getElementById("stats") as HTMLElement;
  const clearCompletedBtn = document.getElementById("clear-completed") as HTMLButtonElement;
  const clearAllBtn = document.getElementById("clear-all") as HTMLButtonElement;
  const sortToggleBtn = document.getElementById("sort-toggle") as HTMLButtonElement;
  const logList = document.getElementById("task-log-list") as HTMLUListElement;

  // State
  let tasks: Task[] = [];
  let sortOrder: SortOrder = "oldest";

  // Save to localStorage
  function save(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks, sortOrder })
    );
    renderStats();
  }

  // Load from localStorage
  function load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { tasks: Task[]; sortOrder: SortOrder };
        tasks = data.tasks || [];
        sortOrder = data.sortOrder || "oldest";
        sortToggleBtn.textContent = `Sort: ${
          sortOrder === "oldest" ? "Oldest → Newest" : "Newest → Oldest"
        }`;
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

  function uid(): string {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    );
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Rendering
  function render(): void {
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
          <button class="checkbox ${task.done ? "checked" : ""}">
            ${task.done ? "✓" : ""}
          </button>
          <div class="task-text ${task.done ? "completed" : ""}" tabindex="0">
            ${index + 1}. ${escapeHtml(task.text)}
            <div class="task-date">(Added on ${formatDate(task.createdAt)})</div>
          </div>
        </div>
        <div class="actions">
          <button class="action-btn toggle" title="Toggle done">⟳</button>
          <button class="action-btn delete" title="Delete task">✕</button>
        </div>
      `;

      const checkbox = li.querySelector(".checkbox") as HTMLButtonElement;
      const toggleBtn = li.querySelector(".action-btn.toggle") as HTMLButtonElement;
      const deleteBtn = li.querySelector(".action-btn.delete") as HTMLButtonElement;

      checkbox.addEventListener("click", () => toggleDone(task.id));
      toggleBtn.addEventListener("click", () => toggleDone(task.id));
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      list.appendChild(li);
    });

    renderStats();
    renderLog();
  }

  function renderStats(): void {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    stats.textContent = `${total} task${total !== 1 ? "s" : ""} • ${done} completed`;
  }

  function renderLog(): void {
    logList.innerHTML = "";
    const logTasks = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
    logTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = `Task added: "${task.text}" at ${formatDate(task.createdAt)}`;
      logList.appendChild(li);
    });
  }

  // Actions
  function addTask(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTask: Task = {
      id: uid(),
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    };
    tasks.push(newTask);
    save();
    render();
  }

  function toggleDone(id: string): void {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
  }

  function deleteTask(id: string): void {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function clearCompleted(): void {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  }

  function clearAll(): void {
    if (!confirm("Delete ALL tasks? This cannot be undone.")) return;
    tasks = [];
    save();
    render();
  }

  function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string)
    );
  }

  // Events
  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);
  clearAllBtn.addEventListener("click", clearAll);

  sortToggleBtn.addEventListener("click", () => {
    sortOrder = sortOrder === "oldest" ? "newest" : "oldest";
    sortToggleBtn.textContent = `Sort: ${
      sortOrder === "oldest" ? "Oldest → Newest" : "Newest → Oldest"
    }`;
    save();
    render();
  });

  // Init
  load();
  render();
})();
