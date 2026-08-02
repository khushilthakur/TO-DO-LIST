(function () {
  "use strict";

  const STORAGE_KEY = "docket.tasks.v1";

  const els = {
    form: document.getElementById("entryForm"),
    input: document.getElementById("taskInput"),
    error: document.getElementById("entryError"),
    list: document.getElementById("ledgerList"),
    empty: document.getElementById("emptyState"),
    tabs: document.querySelectorAll(".tabs__tab"),
    statTotal: document.getElementById("statTotal"),
    statPending: document.getElementById("statPending"),
    statDone: document.getElementById("statDone"),
    remainingText: document.getElementById("remainingText"),
    clearCompleted: document.getElementById("clearCompleted"),
  };

  let tasks = loadTasks();
  let currentFilter = "all";


  // ---------- Storage ----------

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return [];

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];

    } catch (e) {
      console.error("Could not read saved tasks:", e);
      return [];
    }
  }


  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    } catch (e) {
      console.error("Could not save tasks:", e);
    }
  }



  // ---------- Helpers ----------

  function uid() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }


  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }


  function bump(el) {
    el.classList.remove("is-bump");
    void el.offsetWidth;
    el.classList.add("is-bump");
  }



  // ---------- Validation ----------

  function showError(msg) {
    els.error.textContent = msg;
    els.error.classList.add("is-visible");

    els.form.classList.remove("is-shaking");
    void els.form.offsetWidth;
    els.form.classList.add("is-shaking");
  }


  function clearError() {
    els.error.textContent = "";
    els.error.classList.remove("is-visible");
  }



  // ---------- Rendering ----------

  function getFiltered() {

    if (currentFilter === "pending") {
      return tasks.filter((t) => !t.completed);
    }


    if (currentFilter === "completed") {
      return tasks.filter((t) => t.completed);
    }


    return tasks;
  }



  function render() {

    const filtered = getFiltered();

    els.list.innerHTML = "";


    if (filtered.length === 0) {
      els.empty.classList.add("is-visible");
    } else {
      els.empty.classList.remove("is-visible");
    }


    filtered.forEach((task) => {
      els.list.appendChild(buildTicket(task));
    });


    updateStats();
  }



  function buildTicket(task) {

    const li = document.createElement("li");

    li.className = "ticket" + (task.completed ? " is-complete" : "");

    li.dataset.id = task.id;


    li.innerHTML = `
      <button class="ticket__stamp" title="Mark ${task.completed ? "pending" : "complete"}">
        ${task.completed ? "✓" : ""}
      </button>

      <div class="ticket__body">
        <span class="ticket__text">${escapeHtml(task.text)}</span>
      </div>

      <div class="ticket__actions">
        <button class="ticket__action-btn is-edit">✎</button>
        <button class="ticket__action-btn is-delete">✕</button>
      </div>
    `;


    li.querySelector(".ticket__stamp")
      .addEventListener("click", () => toggleComplete(task.id));


    li.querySelector(".is-delete")
      .addEventListener("click", () => deleteTask(task.id, li));


    li.querySelector(".is-edit")
      .addEventListener("click", () => startEdit(task.id, li));


    return li;
  }



  function startEdit(id, li) {

    const task = tasks.find((t) => t.id === id);

    if (!task || task.completed) return;


    const body = li.querySelector(".ticket__body");


    body.innerHTML = `
      <input 
        type="text"
        class="ticket__edit-input"
        maxlength="120"
        value="${escapeHtml(task.text)}"
      >
    `;


    const input = body.querySelector("input");

    input.focus();

    input.setSelectionRange(input.value.length, input.value.length);



    function commit() {

      const value = input.value.trim();


      if (value === "") {
        render();
        return;
      }


      task.text = value;

      saveTasks();

      render();
    }



    input.addEventListener("keydown", (e) => {

      if (e.key === "Enter") commit();

      if (e.key === "Escape") render();

    });


    input.addEventListener("blur", commit);
  }



  function updateStats() {

    const total = tasks.length;

    const done = tasks.filter((t) => t.completed).length;

    const pending = total - done;


    els.statTotal.textContent = total;

    els.statPending.textContent = pending;

    els.statDone.textContent = done;


    els.remainingText.textContent =
      pending === 1
        ? "1 item open"
        : pending + " items open";
  }



  // ---------- Actions ----------

  function addTask(text) {

    const trimmed = text.trim();


    if (trimmed === "") {

      showError("A task can't be blank — write something down first.");

      return false;
    }


    tasks.unshift({

      id: uid(),

      text: trimmed,

      completed: false,

      createdAt: Date.now()

    });


    saveTasks();

    clearError();

    render();

    bump(els.statTotal);


    return true;
  }



  function toggleComplete(id) {

    const task = tasks.find((t) => t.id === id);

    if (!task) return;


    task.completed = !task.completed;


    saveTasks();

    render();


    bump(els.statDone);

    bump(els.statPending);
  }



  function deleteTask(id, li) {

    li.classList.add("is-removing");


    setTimeout(() => {

      tasks = tasks.filter((t) => t.id !== id);

      saveTasks();

      render();

    }, 200);
  }



  function clearCompleted() {

    tasks = tasks.filter((t) => !t.completed);

    saveTasks();

    render();

  }



  // ---------- Events ----------

  els.form.addEventListener("submit", (e) => {

    e.preventDefault();


    const ok = addTask(els.input.value);


    if (ok) {

      els.input.value = "";

      els.input.focus();

    }

  });



  els.input.addEventListener("input", () => {

    if (els.error.classList.contains("is-visible")) {

      clearError();

    }

  });



  els.tabs.forEach((tab) => {

    tab.addEventListener("click", () => {


      els.tabs.forEach((t) => {

        t.classList.remove("is-active");

        t.setAttribute("aria-selected", "false");

      });


      tab.classList.add("is-active");

      tab.setAttribute("aria-selected", "true");


      currentFilter = tab.dataset.filter;


      render();

    });

  });



  els.clearCompleted.addEventListener(
    "click",
    clearCompleted
  );



  // ---------- Init ----------

  render();

})();