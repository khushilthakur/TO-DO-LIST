(() => {
  const STORAGE_KEY = 'taskora.tasks';
  const LEGACY_STORAGE_KEY = 'taskflow.tasks';
  const THEME_KEY = 'taskora.theme';
  const CATEGORIES = ['Work', 'Personal', 'Study', 'Shopping', 'Health', 'Other'];
  const PRIORITIES = ['Low', 'Medium', 'High'];
  const CATEGORY_VAR = {
    Work: 'work',
    Personal: 'personal',
    Study: 'study',
    Shopping: 'shopping',
    Health: 'health',
    Other: 'other',
  };
  const UNDO_WINDOW_MS = 4500;
  const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

  let storageAvailable = true;
  try {
    const testKey = '__taskora_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch (err) {
    storageAvailable = false;
  }

  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingMessage = document.getElementById('loadingMessage');

  function showLoading(message) {
    if (!loadingOverlay) return;
    if (loadingMessage) loadingMessage.textContent = message || 'Loading your tasks…';
    loadingOverlay.hidden = false;
  }

  function hideLoading() {
    if (!loadingOverlay) return;
    loadingOverlay.hidden = true;
  }

  showLoading();

  let tasks = loadTasks();
  let currentFilter = 'all';
  let searchTerm = '';
  let categoryFilterValue = 'all';
  let priorityFilterValue = 'all';
  let sortValue = 'created';
  let editingId = null;
  let pendingDeleteId = null;
  let modalMode = null;
  let lastFocusedBeforeModal = null;
  let pendingUndo = null;
  let isSubmitting = false;

  const taskForm = document.getElementById('taskForm');
  const formHeading = document.getElementById('formHeading');
  const titleInput = document.getElementById('title');
  const titleField = titleInput.closest('.field');
  const descInput = document.getElementById('description');
  const categorySelect = document.getElementById('category');
  const dateInput = document.getElementById('date');
  const dateField = dateInput.closest('.field');
  const timeInput = document.getElementById('time');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const searchInput = document.getElementById('search');
  const searchClear = document.getElementById('searchClear');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortBy = document.getElementById('sortBy');
  const filterPills = document.querySelectorAll('.pill');
  const taskGrid = document.getElementById('taskList');
  const emptyTemplate = document.getElementById('emptyTemplate');
  const taskTemplate = document.getElementById('taskTemplate');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastAction = document.getElementById('toastAction');
  const fabAdd = document.getElementById('fabAdd');
  const headerStats = document.getElementById('headerStats');
  const mobileNavStats = document.getElementById('mobileNavStats');
  const addCard = document.querySelector('.add-card');

  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statCompleted = document.getElementById('statCompleted');
  const statHigh = document.getElementById('statHigh');
  const progressValue = document.getElementById('progressValue');
  const ringFill = document.getElementById('ringFill');

  const countAll = document.getElementById('countAll');
  const countPending = document.getElementById('countPending');
  const countCompleted = document.getElementById('countCompleted');
  const categoryGrid = document.getElementById('categoryGrid');

  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavScrim = document.getElementById('mobileNavScrim');
  const mobileNavClose = document.getElementById('mobileNavClose');

  const themeToggle = document.getElementById('themeToggle');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  const mobileThemeLabel = mobileThemeToggle.querySelector('.mobile-theme-label');

  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalCancel = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');

  let toastTimer = null;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    mobileThemeLabel.textContent = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      storageAvailable = false;
    }
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  applyTheme(getTheme());
  themeToggle.addEventListener('click', toggleTheme);
  mobileThemeToggle.addEventListener('click', toggleTheme);

  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) return null;

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
      title,
      description: typeof raw.description === 'string' ? raw.description.trim() : '',
      category: CATEGORIES.includes(raw.category) ? raw.category : 'Other',
      date: typeof raw.date === 'string' && isValidDateValue(raw.date) ? raw.date : '',
      time: typeof raw.time === 'string' && isValidTimeValue(raw.time) ? raw.time : '',
      priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'Low',
      completed: Boolean(raw.completed),
      createdAt: typeof raw.createdAt === 'number' && !isNaN(raw.createdAt) ? raw.createdAt : Date.now(),
    };
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeTask).filter(Boolean);
        }
        return [];
      }
    } catch (err) {
      storageAvailable = false;
    }

    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed)) {
          const migrated = legacyParsed.map(normalizeTask).filter(Boolean);
          if (migrated.length) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            } catch (err) {
              storageAvailable = false;
            }
          }
          return migrated;
        }
      }
    } catch (err) {
      storageAvailable = false;
    }

    return [];
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      storageAvailable = false;
      showToast('Could not save — storage is full or unavailable', { error: true });
    }
  }

  function makeId() {
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function showToast(message, options) {
    const opts = options || {};
    const isSame = toast.classList.contains('show') && toastMessage.textContent === message && !opts.actionLabel;

    toastMessage.textContent = message;
    toast.classList.toggle('error', Boolean(opts.error));

    if (opts.actionLabel && typeof opts.onAction === 'function') {
      toastAction.textContent = opts.actionLabel;
      toastAction.hidden = false;
      toastAction.onclick = () => {
        opts.onAction();
        hideToast();
      };
    } else if (!isSame) {
      toastAction.hidden = true;
      toastAction.onclick = null;
    }

    toast.classList.add('show');
    clearTimeout(toastTimer);
    const duration = opts.duration || 2600;
    toastTimer = setTimeout(hideToast, duration);
  }

  function hideToast() {
    toast.classList.remove('show');
    clearTimeout(toastTimer);
  }

  function openMobileNav() {
    mobileNav.hidden = false;
    mobileNavScrim.hidden = false;
    requestAnimationFrame(() => {
      mobileNav.classList.add('open');
      mobileNavScrim.classList.add('show');
    });
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    mobileNavScrim.classList.remove('show');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => {
      mobileNav.hidden = true;
      mobileNavScrim.hidden = true;
    }, 240);
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    if (isOpen) closeMobileNav();
    else openMobileNav();
  });
  mobileNavClose.addEventListener('click', closeMobileNav);
  mobileNavScrim.addEventListener('click', closeMobileNav);
  mobileNav.querySelectorAll('[data-close-nav]').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  function openModal(mode, id) {
    modalMode = mode;
    pendingDeleteId = mode === 'delete' ? id : null;
    lastFocusedBeforeModal = document.activeElement;

    if (mode === 'delete') {
      modalTitle.textContent = 'Delete this task?';
      modalDesc.textContent = 'This action cannot be undone.';
      modalConfirm.textContent = 'Delete task';
    } else if (mode === 'clearCompleted') {
      modalTitle.textContent = 'Clear completed tasks?';
      modalDesc.textContent = 'This will permanently remove every completed task. This action cannot be undone.';
      modalConfirm.textContent = 'Clear completed';
    } else if (mode === 'clearAll') {
      modalTitle.textContent = 'Clear all tasks?';
      modalDesc.textContent = 'This will permanently remove every task. This action cannot be undone.';
      modalConfirm.textContent = 'Clear all tasks';
    }

    modalOverlay.hidden = false;
    requestAnimationFrame(() => modalOverlay.classList.add('show'));
    document.body.style.overflow = 'hidden';
    modalConfirm.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => { modalOverlay.hidden = true; }, 180);
    modalMode = null;
    pendingDeleteId = null;
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    }
  }

  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  modalConfirm.addEventListener('click', () => {
    const mode = modalMode;
    const id = pendingDeleteId;
    closeModal();
    if (mode === 'delete') performDelete(id);
    else if (mode === 'clearCompleted') performClearCompleted();
    else if (mode === 'clearAll') performClearAll();
  });

  function performDelete(id) {
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    const card = taskGrid.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!task) return;

    const finishRemoval = () => {
      if (!pendingUndo || pendingUndo.id !== id) return;
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      pendingUndo = null;
      render();
    };

    const performHide = () => {
      task._hidden = true;
      if (editingId === id) resetForm();
      render();

      if (pendingUndo) clearTimeout(pendingUndo.timerId);
      const timerId = setTimeout(finishRemoval, UNDO_WINDOW_MS);
      pendingUndo = { id, timerId };

      showToast('Task deleted', {
        actionLabel: 'Undo',
        duration: UNDO_WINDOW_MS,
        onAction: () => {
          if (pendingUndo && pendingUndo.id === id) {
            clearTimeout(pendingUndo.timerId);
            pendingUndo = null;
          }
          delete task._hidden;
          render();
          showToast('Task restored');
        },
      });
    };

    if (card && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.classList.add('removing');
      card.addEventListener('animationend', performHide, { once: true });
    } else {
      performHide();
    }
  }

  function performClearCompleted() {
    const removedIds = tasks.filter((t) => t.completed).map((t) => t.id);
    if (!removedIds.length) {
      showToast('No completed tasks to clear');
      return;
    }
    tasks = tasks.filter((t) => !t.completed);
    if (pendingUndo && removedIds.includes(pendingUndo.id)) {
      clearTimeout(pendingUndo.timerId);
      pendingUndo = null;
    }
    if (editingId && removedIds.includes(editingId)) resetForm();
    saveTasks();
    render();
    showToast('Completed tasks cleared');
  }

  function performClearAll() {
    if (!tasks.length) {
      showToast('No tasks to clear');
      return;
    }
    if (pendingUndo) {
      clearTimeout(pendingUndo.timerId);
      pendingUndo = null;
    }
    if (editingId) resetForm();
    tasks = [];
    saveTasks();
    render();
    showToast('All tasks cleared');
  }

  clearCompletedBtn.addEventListener('click', () => {
    const hasCompleted = activeTasks().some((t) => t.completed);
    if (!hasCompleted) {
      showToast('No completed tasks to clear');
      return;
    }
    openModal('clearCompleted');
  });

  clearAllBtn.addEventListener('click', () => {
    if (!activeTasks().length) {
      showToast('No tasks to clear');
      return;
    }
    openModal('clearAll');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalOverlay.hidden) closeModal();
    else if (mobileNav.classList.contains('open')) closeMobileNav();
  });

  function getPriority() {
    const checked = taskForm.querySelector('input[name="priority"]:checked');
    return checked ? checked.value : 'Low';
  }

  function setPriority(value) {
    const radio = document.getElementById('p-' + String(value || 'Low').toLowerCase());
    if (radio) radio.checked = true;
  }

  function resetForm() {
    taskForm.reset();
    setPriority('Low');
    categorySelect.value = 'Work';
    titleField.classList.remove('invalid');
    dateField.classList.remove('invalid');
    editingId = null;
    formHeading.textContent = 'Add a task';
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      Add task`;
    cancelEditBtn.hidden = true;
  }

  function enterEditMode(task) {
    editingId = task.id;
    titleInput.value = task.title;
    descInput.value = task.description || '';
    categorySelect.value = task.category || 'Other';
    dateInput.value = task.date || '';
    timeInput.value = task.time || '';
    setPriority(task.priority);
    titleField.classList.remove('invalid');
    dateField.classList.remove('invalid');

    formHeading.textContent = 'Edit task';
    submitBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M10.5 1.5L13.5 4.5L5 13H2V10L10.5 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      Save changes`;
    cancelEditBtn.hidden = false;

    addCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    titleInput.focus();
  }

  function isValidDateValue(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T00:00:00');
    return !isNaN(d.getTime());
  }

  function isValidTimeValue(value) {
    if (!value) return true;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  function addTask(data) {
    tasks.unshift({
      id: makeId(),
      title: data.title,
      description: data.description,
      category: data.category,
      date: data.date,
      time: data.time,
      priority: data.priority,
      completed: false,
      createdAt: Date.now(),
    });
    saveTasks();
  }

  function updateTask(id, data) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    Object.assign(task, data);
    saveTasks();
  }

  function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
    showToast(task.completed ? 'Task marked complete' : 'Task marked pending');
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const title = titleInput.value.trim();
    if (!title) {
      titleField.classList.add('invalid');
      titleInput.focus();
      showToast('Task title is required', { error: true });
      return;
    }
    titleField.classList.remove('invalid');

    if (!isValidDateValue(dateInput.value)) {
      dateField.classList.add('invalid');
      dateInput.focus();
      showToast('Enter a valid date', { error: true });
      return;
    }
    dateField.classList.remove('invalid');

    const data = {
      title,
      description: descInput.value.trim(),
      category: CATEGORIES.includes(categorySelect.value) ? categorySelect.value : 'Other',
      date: dateInput.value,
      time: isValidTimeValue(timeInput.value) ? timeInput.value : '',
      priority: PRIORITIES.includes(getPriority()) ? getPriority() : 'Low',
    };

    isSubmitting = true;
    submitBtn.disabled = true;

    if (editingId) {
      updateTask(editingId, data);
      showToast('Task updated');
    } else {
      addTask(data);
      showToast('Task added');
    }

    resetForm();
    render();

    setTimeout(() => {
      isSubmitting = false;
      submitBtn.disabled = false;
    }, 300);
  });

  cancelEditBtn.addEventListener('click', resetForm);

  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim()) titleField.classList.remove('invalid');
  });

  dateInput.addEventListener('input', () => {
    if (isValidDateValue(dateInput.value)) dateField.classList.remove('invalid');
  });

  fabAdd.addEventListener('click', () => {
    addCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    titleInput.focus();
  });

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      currentFilter = pill.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    searchClear.hidden = !searchInput.value;
    render();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    searchClear.hidden = true;
    searchInput.focus();
    render();
  });

  categoryFilter.addEventListener('change', () => {
    categoryFilterValue = categoryFilter.value;
    render();
  });

  if (priorityFilter) {
    priorityFilter.addEventListener('change', () => {
      priorityFilterValue = priorityFilter.value;
      render();
    });
  }

  sortBy.addEventListener('change', () => {
    sortValue = sortBy.value;
    render();
  });

  function formatWhen(dateStr, timeStr) {
    if (!dateStr && !timeStr) return '';

    let label = '';
    if (dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      if (!isNaN(d)) {
        label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    if (timeStr) {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(Number(h), Number(m));
      const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      label = label ? `${label} · ${timeLabel}` : timeLabel;
    }
    return label;
  }

  function isOverdue(task) {
    if (task.completed || !task.date) return false;
    const due = new Date(task.date + 'T' + (task.time || '23:59') + ':00');
    if (isNaN(due)) return false;
    return due.getTime() < Date.now();
  }

  function getDueStatus(task) {
    if (!task.date || task.completed) return '';
    const due = new Date(task.date + 'T00:00:00');
    if (isNaN(due)) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return '';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return 'Upcoming';
  }

  function sortTasks(list) {
    const sorted = list.slice();
    if (sortValue === 'priority') {
      sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt - a.createdAt);
    } else if (sortValue === 'date') {
      sorted.sort((a, b) => {
        if (!a.date && !b.date) return b.createdAt - a.createdAt;
        if (!a.date) return 1;
        if (!b.date) return -1;
        const cmp = (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00'));
        return cmp !== 0 ? cmp : b.createdAt - a.createdAt;
      });
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }

  function activeTasks() {
    return tasks.filter((t) => !t._hidden);
  }

  function getVisibleTasks() {
    const list = activeTasks().filter((task) => {
      if (currentFilter === 'pending' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;
      if (categoryFilterValue !== 'all' && task.category !== categoryFilterValue) return false;
      if (priorityFilterValue !== 'all' && task.priority !== priorityFilterValue) return false;

      if (searchTerm) {
        const haystack = `${task.title} ${task.description || ''} ${task.category || ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
    return sortTasks(list);
  }

  function renderStats() {
    const live = activeTasks();
    const total = live.length;
    const completed = live.filter((t) => t.completed).length;
    const pending = total - completed;
    const high = live.filter((t) => t.priority === 'High' && !t.completed).length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statHigh.textContent = high;

    const pct = total ? Math.round((completed / total) * 100) : 0;
    progressValue.textContent = `${pct}%`;
    ringFill.setAttribute('stroke-dashoffset', String(100 - pct));

    const summary = total ? `${completed}/${total} completed` : 'No tasks yet';
    headerStats.textContent = summary;
    mobileNavStats.textContent = summary;

    countAll.textContent = total;
    countPending.textContent = pending;
    countCompleted.textContent = completed;
  }

  function renderCategoryOverview() {
    if (!categoryGrid) return;
    const live = activeTasks();

    if (!live.length) {
      categoryGrid.innerHTML = '<p class="category-overview-empty">Add a task to see your categories break down here.</p>';
      return;
    }

    categoryGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    CATEGORIES.forEach((cat) => {
      const count = live.filter((t) => (t.category || 'Other') === cat).length;
      const varKey = CATEGORY_VAR[cat] || 'other';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-tile';
      if (categoryFilterValue === cat) btn.classList.add('is-active');
      btn.style.setProperty('--cat-color', `var(--category-${varKey})`);
      btn.style.setProperty('--cat-bg', `var(--category-${varKey}-bg)`);
      btn.setAttribute('aria-pressed', String(categoryFilterValue === cat));

      btn.innerHTML = `
        <span class="dot" aria-hidden="true"></span>
        <span class="category-tile-text">
          <span class="category-tile-name">${cat}</span>
          <span class="category-tile-count">${count} task${count === 1 ? '' : 's'}</span>
        </span>`;

      btn.addEventListener('click', () => {
        const next = categoryFilterValue === cat ? 'all' : cat;
        categoryFilterValue = next;
        categoryFilter.value = next;
        render();
        taskGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      fragment.appendChild(btn);
    });

    categoryGrid.appendChild(fragment);
  }

  function buildTaskCard(task) {
    const node = taskTemplate.content.firstElementChild.cloneNode(true);

    node.dataset.priority = task.priority;
    node.dataset.id = task.id;
    if (task.completed) node.classList.add('completed');

    const overdue = isOverdue(task);
    if (overdue) node.classList.add('is-overdue');

    node.querySelector('.task-title').textContent = task.title;
    node.querySelector('.task-desc').textContent = task.description || '';
    node.querySelector('.priority-badge').textContent = task.priority;

    const categoryBadge = node.querySelector('.category-badge');
    categoryBadge.textContent = task.category || 'Other';
    categoryBadge.dataset.category = task.category || 'Other';

    const overdueBadge = node.querySelector('.overdue-badge');
    overdueBadge.hidden = !overdue;

    const dueBadge = node.querySelector('.due-badge');
    if (dueBadge) {
      const dueStatus = overdue ? '' : getDueStatus(task);
      if (dueStatus) {
        dueBadge.textContent = dueStatus;
        dueBadge.hidden = false;
      } else {
        dueBadge.hidden = true;
      }
    }

    node.querySelector('.task-when').textContent = formatWhen(task.date, task.time);

    const checkBtn = node.querySelector('.check');
    checkBtn.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark complete');
    checkBtn.addEventListener('click', () => toggleComplete(task.id));

    node.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(task));
    node.querySelector('.delete-btn').addEventListener('click', (e) => openModal('delete', task.id));

    return node;
  }

  function render() {
    const visible = getVisibleTasks();
    taskGrid.innerHTML = '';

    if (!visible.length) {
      const empty = emptyTemplate.content.firstElementChild.cloneNode(true);
      const title = empty.querySelector('.empty-title');
      const sub = empty.querySelector('.empty-sub');
      const hasAnyTasks = activeTasks().length > 0;

      if (hasAnyTasks && searchTerm) {
        title.textContent = 'No matching tasks';
        sub.textContent = 'Try another search term.';
      } else if (hasAnyTasks && categoryFilterValue !== 'all' && currentFilter === 'all' && priorityFilterValue === 'all') {
        title.textContent = 'No tasks in this category';
        sub.textContent = 'Try a different category or clear the filter.';
      } else if (hasAnyTasks && priorityFilterValue !== 'all' && currentFilter === 'all' && categoryFilterValue === 'all') {
        title.textContent = 'No tasks at this priority';
        sub.textContent = 'Try a different priority or clear the filter.';
      } else if (hasAnyTasks && (categoryFilterValue !== 'all' || priorityFilterValue !== 'all')) {
        title.textContent = 'No matching tasks';
        sub.textContent = 'Try adjusting your filters.';
      } else if (hasAnyTasks && currentFilter === 'completed') {
        title.textContent = 'Nothing completed yet';
        sub.textContent = 'Complete a task and it will appear here.';
      } else if (hasAnyTasks && currentFilter === 'pending') {
        title.textContent = 'Nothing pending';
        sub.textContent = 'Every task is complete — nice work.';
      }

      taskGrid.appendChild(empty);
    } else {
      const fragment = document.createDocumentFragment();
      visible.forEach((task) => fragment.appendChild(buildTaskCard(task)));
      taskGrid.appendChild(fragment);
    }

    renderStats();
    renderCategoryOverview();
  }

  setPriority('Low');
  categorySelect.value = 'Work';
  render();

  if (!storageAvailable) {
    showToast('Storage is unavailable — changes won\'t be saved', { error: true, duration: 4000 });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(hideLoading);
  });
})();
