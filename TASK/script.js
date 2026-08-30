/* =========================================================
   TASKORA - TODO LIST + SUPABASE + GOOGLE LOGIN
   ========================================================= */

const SUPABASE_URL =
  'https://xljupiytzvmqssdwuyyv.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_5bGWv2n2BsxAeCTH3j5cZQ_0j6quVoJ';

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function signInWithGoogle() {
  try {
    const redirectUrl =
      window.location.origin +
      window.location.pathname;

    const { error } =
      await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

    if (error) {
      console.error(
        'Google login error:',
        error
      );

      alert(
        'Google login failed: ' +
        error.message
      );
    }
  } catch (error) {
    console.error(
      'Google login error:',
      error
    );

    alert(
      'Google login failed.'
    );
  }
}


async function signOut() {
  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    currentUser = null;
    tasks = [];

    resetForm();
    render();
    updateAuthUI();

    showToast(
      'Signed out successfully'
    );

  } catch (error) {
    console.error(
      'Sign out error:',
      error
    );

    showToast(
      'Could not sign out',
      {
        error: true
      }
    );
  }
}


/* Make functions available globally */
window.signInWithGoogle =
  signInWithGoogle;

window.signOut =
  signOut;


/* =========================================================
   APP
   ========================================================= */

(() => {
  'use strict';


  /* =======================================================
     CONSTANTS
     ======================================================= */

  const THEME_KEY =
    'taskora.theme';

  const CATEGORIES = [
    'Work',
    'Personal',
    'Study',
    'Shopping',
    'Health',
    'Other'
  ];

  const PRIORITIES = [
    'Low',
    'Medium',
    'High'
  ];

  const PRIORITY_RANK = {
    High: 0,
    Medium: 1,
    Low: 2
  };

  const CATEGORY_VAR = {
    Work: 'work',
    Personal: 'personal',
    Study: 'study',
    Shopping: 'shopping',
    Health: 'health',
    Other: 'other'
  };

  const UNDO_WINDOW_MS =
    4500;


  /* =======================================================
     STATE
     ======================================================= */

  let tasks = [];

  let currentUser = null;

  let currentFilter = 'all';

  let searchTerm = '';

  let categoryFilterValue =
    'all';

  let priorityFilterValue =
    'all';

  let sortValue = 'created';

  let editingId = null;

  let pendingDeleteId = null;

  let modalMode = null;

  let lastFocusedBeforeModal =
    null;

  let pendingUndo = null;

  let isSubmitting = false;

  let toastTimer = null;


  /* =======================================================
     DOM
     ======================================================= */

  const loadingOverlay =
    document.getElementById(
      'loadingOverlay'
    );

  const loadingMessage =
    document.getElementById(
      'loadingMessage'
    );


  const taskForm =
    document.getElementById(
      'taskForm'
    );

  const formHeading =
    document.getElementById(
      'formHeading'
    );

  const titleInput =
    document.getElementById(
      'title'
    );

  const descInput =
    document.getElementById(
      'description'
    );

  const categorySelect =
    document.getElementById(
      'category'
    );

  const dateInput =
    document.getElementById(
      'date'
    );

  const timeInput =
    document.getElementById(
      'time'
    );

  const submitBtn =
    document.getElementById(
      'submitBtn'
    );

  const cancelEditBtn =
    document.getElementById(
      'cancelEditBtn'
    );

  const titleField =
    titleInput
      ? titleInput.closest('.field')
      : null;

  const dateField =
    dateInput
      ? dateInput.closest('.field')
      : null;


  const searchInput =
    document.getElementById(
      'search'
    );

  const searchClear =
    document.getElementById(
      'searchClear'
    );

  const categoryFilter =
    document.getElementById(
      'categoryFilter'
    );

  const priorityFilter =
    document.getElementById(
      'priorityFilter'
    );

  const sortBy =
    document.getElementById(
      'sortBy'
    );

  const filterPills =
    document.querySelectorAll(
      '.pill'
    );


  const taskGrid =
    document.getElementById(
      'taskList'
    );

  const emptyTemplate =
    document.getElementById(
      'emptyTemplate'
    );

  const taskTemplate =
    document.getElementById(
      'taskTemplate'
    );


  const toast =
    document.getElementById(
      'toast'
    );

  const toastMessage =
    document.getElementById(
      'toastMessage'
    );

  const toastAction =
    document.getElementById(
      'toastAction'
    );


  const fabAdd =
    document.getElementById(
      'fabAdd'
    );

  const addCard =
    document.querySelector(
      '.add-card'
    );


  const statTotal =
    document.getElementById(
      'statTotal'
    );

  const statPending =
    document.getElementById(
      'statPending'
    );

  const statCompleted =
    document.getElementById(
      'statCompleted'
    );

  const statHigh =
    document.getElementById(
      'statHigh'
    );

  const progressValue =
    document.getElementById(
      'progressValue'
    );

  const ringFill =
    document.getElementById(
      'ringFill'
    );


  const countAll =
    document.getElementById(
      'countAll'
    );

  const countPending =
    document.getElementById(
      'countPending'
    );

  const countCompleted =
    document.getElementById(
      'countCompleted'
    );

  const categoryGrid =
    document.getElementById(
      'categoryGrid'
    );


  const headerStats =
    document.getElementById(
      'headerStats'
    );

  const mobileNavStats =
    document.getElementById(
      'mobileNavStats'
    );


  const menuBtn =
    document.getElementById(
      'menuBtn'
    );

  const mobileNav =
    document.getElementById(
      'mobileNav'
    );

  const mobileNavScrim =
    document.getElementById(
      'mobileNavScrim'
    );

  const mobileNavClose =
    document.getElementById(
      'mobileNavClose'
    );


  const themeToggle =
    document.getElementById(
      'themeToggle'
    );

  const mobileThemeToggle =
    document.getElementById(
      'mobileThemeToggle'
    );

  const mobileThemeLabel =
    mobileThemeToggle
      ? mobileThemeToggle.querySelector(
        '.mobile-theme-label'
      )
      : null;


  const clearCompletedBtn =
    document.getElementById(
      'clearCompletedBtn'
    );

  const clearAllBtn =
    document.getElementById(
      'clearAllBtn'
    );


  const modalOverlay =
    document.getElementById(
      'modalOverlay'
    );

  const modalTitle =
    document.getElementById(
      'modalTitle'
    );

  const modalDesc =
    document.getElementById(
      'modalDesc'
    );

  const modalCancel =
    document.getElementById(
      'modalCancel'
    );

  const modalConfirm =
    document.getElementById(
      'modalConfirm'
    );


  /* =======================================================
     LOADING
     ======================================================= */

  function showLoading(
    message = 'Loading your tasks…'
  ) {
    if (!loadingOverlay) {
      return;
    }

    if (loadingMessage) {
      loadingMessage.textContent =
        message;
    }

    loadingOverlay.hidden =
      false;
  }


  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.hidden =
        true;
    }
  }


  /* =======================================================
     AUTH UI
     ======================================================= */

  function createAuthUI() {
    const headerInner =
      document.querySelector(
        '.header-inner'
      );

    if (!headerInner) {
      return;
    }

    if (
      document.getElementById(
        'taskoraAuthArea'
      )
    ) {
      return;
    }

    const authArea =
      document.createElement(
        'div'
      );

    authArea.id =
      'taskoraAuthArea';

    authArea.style.display =
      'flex';

    authArea.style.alignItems =
      'center';

    authArea.style.gap =
      '8px';

    authArea.style.marginLeft =
      '10px';

    const loginButton =
      document.createElement(
        'button'
      );

    loginButton.type =
      'button';

    loginButton.id =
      'taskoraGoogleLogin';

    loginButton.className =
      'btn btn-primary';

    loginButton.textContent =
      'Sign in with Google';

    loginButton.addEventListener(
      'click',
      signInWithGoogle
    );


    const userArea =
      document.createElement(
        'div'
      );

    userArea.id =
      'taskoraUserArea';

    userArea.style.display =
      'none';

    userArea.style.alignItems =
      'center';

    userArea.style.gap =
      '8px';


    const userName =
      document.createElement(
        'span'
      );

    userName.id =
      'taskoraUserName';


    const logoutButton =
      document.createElement(
        'button'
      );

    logoutButton.type =
      'button';

    logoutButton.id =
      'taskoraLogout';

    logoutButton.className =
      'btn btn-ghost btn-small';

    logoutButton.textContent =
      'Logout';

    logoutButton.addEventListener(
      'click',
      signOut
    );


    userArea.appendChild(
      userName
    );

    userArea.appendChild(
      logoutButton
    );

    authArea.appendChild(
      loginButton
    );

    authArea.appendChild(
      userArea
    );

    headerInner.appendChild(
      authArea
    );
  }


  function updateAuthUI() {
    const loginButton =
      document.getElementById(
        'taskoraGoogleLogin'
      );

    const userArea =
      document.getElementById(
        'taskoraUserArea'
      );

    const userName =
      document.getElementById(
        'taskoraUserName'
      );

    if (!loginButton || !userArea) {
      return;
    }

    if (currentUser) {
      loginButton.style.display =
        'none';

      userArea.style.display =
        'flex';

      if (userName) {
        const name =
          currentUser.user_metadata
            ?.full_name ||
          currentUser.user_metadata
            ?.name ||
          currentUser.email ||
          'Signed in';

        userName.textContent =
          name;
      }

    } else {
      loginButton.style.display =
        '';

      userArea.style.display =
        'none';
    }
  }


  async function getCurrentUser() {
    try {
      const {
        data,
        error
      } =
        await supabaseClient.auth.getUser();

      if (error) {
        console.error(
          'Get user error:',
          error
        );

        return null;
      }

      return data.user || null;

    } catch (error) {
      console.error(
        'Get user error:',
        error
      );

      return null;
    }
  }


  /* =======================================================
     THEME
     ======================================================= */

  function getTheme() {
    return (
      document.documentElement
        .getAttribute(
          'data-theme'
        ) === 'dark'
    )
      ? 'dark'
      : 'light';
  }


  function applyTheme(theme) {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    const isDark =
      theme === 'dark';

    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-pressed',
        String(isDark)
      );

      themeToggle.setAttribute(
        'aria-label',
        isDark
          ? 'Switch to light theme'
          : 'Switch to dark theme'
      );
    }

    if (mobileThemeLabel) {
      mobileThemeLabel.textContent =
        isDark
          ? 'Switch to light theme'
          : 'Switch to dark theme';
    }

    try {
      localStorage.setItem(
        THEME_KEY,
        theme
      );
    } catch (error) {
      // Ignore theme storage errors.
    }
  }


  function toggleTheme() {
    applyTheme(
      getTheme() === 'dark'
        ? 'light'
        : 'dark'
    );
  }


  let savedTheme =
    'light';

  try {
    savedTheme =
      localStorage.getItem(
        THEME_KEY
      ) ||
      (
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
          ? 'dark'
          : 'light'
      );
  } catch (error) {
    savedTheme =
      'light';
  }

  applyTheme(
    savedTheme
  );


  if (themeToggle) {
    themeToggle.addEventListener(
      'click',
      toggleTheme
    );
  }

  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener(
      'click',
      toggleTheme
    );
  }


  /* =======================================================
     TOAST
     ======================================================= */

  function showToast(
    message,
    options = {}
  ) {
    if (
      !toast ||
      !toastMessage
    ) {
      return;
    }

    toastMessage.textContent =
      message;

    toast.classList.toggle(
      'error',
      Boolean(options.error)
    );


    if (
      options.actionLabel &&
      typeof options.onAction ===
      'function' &&
      toastAction
    ) {
      toastAction.textContent =
        options.actionLabel;

      toastAction.hidden =
        false;

      toastAction.onclick =
        () => {
          options.onAction();
          hideToast();
        };

    } else if (toastAction) {
      toastAction.hidden =
        true;

      toastAction.onclick =
        null;
    }


    toast.classList.add(
      'show'
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        hideToast,
        options.duration ||
        2600
      );
  }


  function hideToast() {
    if (toast) {
      toast.classList.remove(
        'show'
      );
    }

    clearTimeout(
      toastTimer
    );
  }


  /* =======================================================
     TASK NORMALIZATION
     ======================================================= */

  function normalizeTask(
    raw
  ) {
    if (
      !raw ||
      typeof raw !== 'object'
    ) {
      return null;
    }

    const title =
      typeof raw.title ===
        'string'
        ? raw.title.trim()
        : '';

    if (!title) {
      return null;
    }

    let createdAt =
      Date.now();

    if (raw.created_at) {
      const timestamp =
        new Date(
          raw.created_at
        ).getTime();

      if (!isNaN(timestamp)) {
        createdAt =
          timestamp;
      }
    }

    return {
      id:
        raw.id,

      title:
        title,

      description:
        typeof raw.description ===
          'string'
          ? raw.description.trim()
          : '',

      category:
        CATEGORIES.includes(
          raw.category
        )
          ? raw.category
          : 'Other',

      date:
        typeof raw.date ===
          'string'
          ? raw.date
          : '',

      time:
        typeof raw.time ===
          'string'
          ? String(
            raw.time
          ).slice(0, 5)
          : '',

      priority:
        PRIORITIES.includes(
          raw.priority
        )
          ? raw.priority
          : 'Low',

      completed:
        Boolean(
          raw.completed
        ),

      createdAt:
        createdAt
    };
  }


  /* =======================================================
     LOAD TASKS FROM SUPABASE
     ======================================================= */

  async function loadTasks() {
    if (!currentUser) {
      tasks = [];
      render();
      return;
    }

    try {
      showLoading(
        'Loading your tasks…'
      );

      const {
        data,
        error
      } =
        await supabaseClient
          .from('todos')
          .select('*')
          .eq(
            'user_id',
            currentUser.id
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        throw error;
      }

      tasks =
        (data || [])
          .map(
            normalizeTask
          )
          .filter(
            Boolean
          );

      render();

    } catch (error) {
      console.error(
        'Supabase load error:',
        error
      );

      tasks = [];

      render();

      showToast(
        'Could not load tasks from Supabase: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );

    } finally {
      hideLoading();
    }
  }


  /* =======================================================
     ADD TASK TO SUPABASE
     ======================================================= */

  async function addTask(
    taskData
  ) {
    if (!currentUser) {
      showToast(
        'Please sign in with Google first',
        {
          error: true
        }
      );

      return false;
    }

    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from('todos')
          .insert({
            user_id:
              currentUser.id,

            title:
              taskData.title,

            description:
              taskData.description ||
              null,

            category:
              taskData.category,

            date:
              taskData.date ||
              null,

            time:
              taskData.time ||
              null,

            priority:
              taskData.priority,

            completed:
              false
          })
          .select('*')
          .single();

      if (error) {
        throw error;
      }

      const newTask =
        normalizeTask(
          data
        );

      if (newTask) {
        tasks.unshift(
          newTask
        );
      }

      return true;

    } catch (error) {
      console.error(
        'Supabase add error:',
        error
      );

      showToast(
        'Could not save task: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );

      return false;
    }
  }


  /* =======================================================
     UPDATE TASK IN SUPABASE
     ======================================================= */

  async function updateTask(
    id,
    taskData
  ) {
    if (!currentUser) {
      showToast(
        'Please sign in with Google first',
        {
          error: true
        }
      );

      return false;
    }

    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from('todos')
          .update({
            title:
              taskData.title,

            description:
              taskData.description ||
              null,

            category:
              taskData.category,

            date:
              taskData.date ||
              null,

            time:
              taskData.time ||
              null,

            priority:
              taskData.priority
          })
          .eq(
            'id',
            id
          )
          .eq(
            'user_id',
            currentUser.id
          )
          .select('*')
          .single();

      if (error) {
        throw error;
      }

      const updatedTask =
        normalizeTask(
          data
        );

      const index =
        tasks.findIndex(
          task =>
            task.id === id
        );

      if (
        index !== -1 &&
        updatedTask
      ) {
        tasks[index] =
          updatedTask;
      }

      return true;

    } catch (error) {
      console.error(
        'Supabase update error:',
        error
      );

      showToast(
        'Could not update task: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );

      return false;
    }
  }


  /* =======================================================
     TOGGLE COMPLETE
     ======================================================= */

  async function toggleComplete(
    id
  ) {
    if (!currentUser) {
      showToast(
        'Please sign in with Google first',
        {
          error: true
        }
      );

      return;
    }

    const task =
      tasks.find(
        item =>
          item.id === id
      );

    if (!task) {
      return;
    }

    const newCompleted =
      !task.completed;

    try {
      const {
        error
      } =
        await supabaseClient
          .from('todos')
          .update({
            completed:
              newCompleted
          })
          .eq(
            'id',
            id
          )
          .eq(
            'user_id',
            currentUser.id
          );

      if (error) {
        throw error;
      }

      task.completed =
        newCompleted;

      render();

      showToast(
        newCompleted
          ? 'Task marked complete'
          : 'Task marked pending'
      );

    } catch (error) {
      console.error(
        'Supabase completion error:',
        error
      );

      showToast(
        'Could not update task: ' +
        error.message,
        {
          error: true
        }
      );
    }
  }


  /* =======================================================
     DELETE TASK
     ======================================================= */

  async function deleteTaskFromSupabase(
    id
  ) {
    if (!currentUser) {
      return false;
    }

    try {
      const {
        error
      } =
        await supabaseClient
          .from('todos')
          .delete()
          .eq(
            'id',
            id
          )
          .eq(
            'user_id',
            currentUser.id
          );

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      console.error(
        'Supabase delete error:',
        error
      );

      showToast(
        'Could not delete task: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );

      return false;
    }
  }


  async function performDelete(
    id
  ) {
    const task =
      tasks.find(
        item =>
          item.id === id
      );

    if (!task) {
      return;
    }

    task._hidden =
      true;

    render();


    if (pendingUndo) {
      clearTimeout(
        pendingUndo.timerId
      );
    }


    const timerId =
      setTimeout(
        async () => {
          const success =
            await deleteTaskFromSupabase(
              id
            );

          if (success) {
            tasks =
              tasks.filter(
                item =>
                  item.id !== id
              );

            render();
          } else {
            delete task._hidden;
            render();
          }

          pendingUndo =
            null;
        },
        UNDO_WINDOW_MS
      );


    pendingUndo = {
      id: id,
      timerId: timerId
    };


    showToast(
      'Task deleted',
      {
        actionLabel:
          'Undo',

        duration:
          UNDO_WINDOW_MS,

        onAction:
          () => {
            if (
              pendingUndo &&
              pendingUndo.id === id
            ) {
              clearTimeout(
                pendingUndo.timerId
              );

              pendingUndo =
                null;
            }

            delete task._hidden;

            render();

            showToast(
              'Task restored'
            );
          }
      }
    );
  }


  /* =======================================================
     CLEAR COMPLETED
     ======================================================= */

  async function performClearCompleted() {
    if (!currentUser) {
      showToast(
        'Please sign in with Google first',
        {
          error: true
        }
      );

      return;
    }

    const completedIds =
      tasks
        .filter(
          task =>
            !task._hidden &&
            task.completed
        )
        .map(
          task =>
            task.id
        );

    if (
      !completedIds.length
    ) {
      showToast(
        'No completed tasks to clear'
      );

      return;
    }


    try {
      const {
        error
      } =
        await supabaseClient
          .from('todos')
          .delete()
          .eq(
            'user_id',
            currentUser.id
          )
          .in(
            'id',
            completedIds
          );

      if (error) {
        throw error;
      }

      tasks =
        tasks.filter(
          task =>
            !completedIds.includes(
              task.id
            )
        );

      if (editingId) {
        if (
          completedIds.includes(
            editingId
          )
        ) {
          resetForm();
        }
      }

      render();

      showToast(
        'Completed tasks cleared'
      );

    } catch (error) {
      console.error(
        'Clear completed error:',
        error
      );

      showToast(
        'Could not clear completed tasks: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );
    }
  }


  /* =======================================================
     CLEAR ALL
     ======================================================= */

  async function performClearAll() {
    if (!currentUser) {
      showToast(
        'Please sign in with Google first',
        {
          error: true
        }
      );

      return;
    }

    const liveTasks =
      tasks.filter(
        task =>
          !task._hidden
      );

    if (!liveTasks.length) {
      showToast(
        'No tasks to clear'
      );

      return;
    }


    try {
      const {
        error
      } =
        await supabaseClient
          .from('todos')
          .delete()
          .eq(
            'user_id',
            currentUser.id
          );

      if (error) {
        throw error;
      }

      if (pendingUndo) {
        clearTimeout(
          pendingUndo.timerId
        );

        pendingUndo =
          null;
      }

      tasks = [];

      resetForm();

      render();

      showToast(
        'All tasks cleared'
      );

    } catch (error) {
      console.error(
        'Clear all error:',
        error
      );

      showToast(
        'Could not clear all tasks: ' +
        error.message,
        {
          error: true,
          duration: 6000
        }
      );
    }
  }


  /* =======================================================
     FORM HELPERS
     ======================================================= */

  function getPriority() {
    const checked =
      taskForm
        ? taskForm.querySelector(
          'input[name="priority"]:checked'
        )
        : null;

    return checked
      ? checked.value
      : 'Low';
  }


  function setPriority(
    value
  ) {
    const radio =
      document.getElementById(
        'p-' +
        String(
          value || 'Low'
        ).toLowerCase()
      );

    if (radio) {
      radio.checked =
        true;
    }
  }


  function isValidDateValue(
    value
  ) {
    if (!value) {
      return true;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      return false;
    }

    const date =
      new Date(
        value +
        'T00:00:00'
      );

    return !isNaN(
      date.getTime()
    );
  }


  function isValidTimeValue(
    value
  ) {
    if (!value) {
      return true;
    }

    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      value
    );
  }


  function resetForm() {
    if (!taskForm) {
      return;
    }

    taskForm.reset();

    setPriority(
      'Low'
    );

    if (categorySelect) {
      categorySelect.value =
        'Work';
    }

    if (titleField) {
      titleField.classList.remove(
        'invalid'
      );
    }

    if (dateField) {
      dateField.classList.remove(
        'invalid'
      );
    }

    editingId =
      null;

    if (formHeading) {
      formHeading.textContent =
        'Add a task';
    }

    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3V13M3 8H13"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"/>
        </svg>
        Add task`;
    }

    if (cancelEditBtn) {
      cancelEditBtn.hidden =
        true;
    }
  }


  function enterEditMode(
    task
  ) {
    editingId =
      task.id;

    titleInput.value =
      task.title;

    descInput.value =
      task.description || '';

    categorySelect.value =
      task.category || 'Other';

    dateInput.value =
      task.date || '';

    timeInput.value =
      task.time || '';

    setPriority(
      task.priority
    );

    if (titleField) {
      titleField.classList.remove(
        'invalid'
      );
    }

    if (dateField) {
      dateField.classList.remove(
        'invalid'
      );
    }

    formHeading.textContent =
      'Edit task';

    submitBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M10.5 1.5L13.5 4.5L5 13H2V10L10.5 1.5Z"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"/>
      </svg>
      Save changes`;

    cancelEditBtn.hidden =
      false;

    if (addCard) {
      addCard.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    titleInput.focus();
  }


  /* =======================================================
     FORM SUBMIT
     ======================================================= */

  if (taskForm) {
    taskForm.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        if (isSubmitting) {
          return;
        }

        if (!currentUser) {
          showToast(
            'Please sign in with Google first',
            {
              error: true,
              duration: 4000
            }
          );

          return;
        }

        const title =
          titleInput.value.trim();

        if (!title) {
          if (titleField) {
            titleField.classList.add(
              'invalid'
            );
          }

          titleInput.focus();

          showToast(
            'Task title is required',
            {
              error: true
            }
          );

          return;
        }

        if (titleField) {
          titleField.classList.remove(
            'invalid'
          );
        }


        if (
          !isValidDateValue(
            dateInput.value
          )
        ) {
          if (dateField) {
            dateField.classList.add(
              'invalid'
            );
          }

          dateInput.focus();

          showToast(
            'Enter a valid date',
            {
              error: true
            }
          );

          return;
        }

        if (dateField) {
          dateField.classList.remove(
            'invalid'
          );
        }


        const priority =
          getPriority();


        const taskData = {
          title:
            title,

          description:
            descInput.value.trim(),

          category:
            CATEGORIES.includes(
              categorySelect.value
            )
              ? categorySelect.value
              : 'Other',

          date:
            dateInput.value,

          time:
            isValidTimeValue(
              timeInput.value
            )
              ? timeInput.value
              : '',

          priority:
            PRIORITIES.includes(
              priority
            )
              ? priority
              : 'Low'
        };


        isSubmitting =
          true;

        submitBtn.disabled =
          true;


        let success =
          false;


        if (editingId) {
          success =
            await updateTask(
              editingId,
              taskData
            );

          if (success) {
            showToast(
              'Task updated'
            );
          }

        } else {
          success =
            await addTask(
              taskData
            );

          if (success) {
            showToast(
              'Task added'
            );
          }
        }


        if (success) {
          resetForm();
          render();
        }


        isSubmitting =
          false;

        submitBtn.disabled =
          false;
      }
    );
  }


  if (cancelEditBtn) {
    cancelEditBtn.addEventListener(
      'click',
      resetForm
    );
  }


  if (titleInput) {
    titleInput.addEventListener(
      'input',
      () => {
        if (
          titleInput.value.trim() &&
          titleField
        ) {
          titleField.classList.remove(
            'invalid'
          );
        }
      }
    );
  }


  if (dateInput) {
    dateInput.addEventListener(
      'input',
      () => {
        if (
          isValidDateValue(
            dateInput.value
          ) &&
          dateField
        ) {
          dateField.classList.remove(
            'invalid'
          );
        }
      }
    );
  }


  /* =======================================================
     MOBILE NAV
     ======================================================= */

  function openMobileNav() {
    if (!mobileNav) {
      return;
    }

    mobileNav.hidden =
      false;

    if (mobileNavScrim) {
      mobileNavScrim.hidden =
        false;
    }

    requestAnimationFrame(
      () => {
        mobileNav.classList.add(
          'open'
        );

        if (mobileNavScrim) {
          mobileNavScrim.classList.add(
            'show'
          );
        }
      }
    );

    if (menuBtn) {
      menuBtn.setAttribute(
        'aria-expanded',
        'true'
      );
    }

    document.body.style.overflow =
      'hidden';
  }


  function closeMobileNav() {
    if (!mobileNav) {
      return;
    }

    mobileNav.classList.remove(
      'open'
    );

    if (mobileNavScrim) {
      mobileNavScrim.classList.remove(
        'show'
      );
    }

    if (menuBtn) {
      menuBtn.setAttribute(
        'aria-expanded',
        'false'
      );
    }

    document.body.style.overflow =
      '';

    setTimeout(
      () => {
        mobileNav.hidden =
          true;

        if (mobileNavScrim) {
          mobileNavScrim.hidden =
            true;
        }
      },
      240
    );
  }


  if (menuBtn) {
    menuBtn.addEventListener(
      'click',
      () => {
        if (
          mobileNav.classList.contains(
            'open'
          )
        ) {
          closeMobileNav();
        } else {
          openMobileNav();
        }
      }
    );
  }


  if (mobileNavClose) {
    mobileNavClose.addEventListener(
      'click',
      closeMobileNav
    );
  }


  if (mobileNavScrim) {
    mobileNavScrim.addEventListener(
      'click',
      closeMobileNav
    );
  }


  if (mobileNav) {
    mobileNav
      .querySelectorAll(
        '[data-close-nav]'
      )
      .forEach(
        link => {
          link.addEventListener(
            'click',
            closeMobileNav
          );
        }
      );
  }


  /* =======================================================
     MODAL
     ======================================================= */

  function openModal(
    mode,
    id = null
  ) {
    if (!modalOverlay) {
      return;
    }

    modalMode =
      mode;

    pendingDeleteId =
      mode === 'delete'
        ? id
        : null;

    lastFocusedBeforeModal =
      document.activeElement;


    if (
      mode === 'delete'
    ) {
      modalTitle.textContent =
        'Delete this task?';

      modalDesc.textContent =
        'This action cannot be undone.';

      modalConfirm.textContent =
        'Delete task';
    }


    if (
      mode === 'clearCompleted'
    ) {
      modalTitle.textContent =
        'Clear completed tasks?';

      modalDesc.textContent =
        'This will permanently remove every completed task.';

      modalConfirm.textContent =
        'Clear completed';
    }


    if (
      mode === 'clearAll'
    ) {
      modalTitle.textContent =
        'Clear all tasks?';

      modalDesc.textContent =
        'This will permanently remove every task.';

      modalConfirm.textContent =
        'Clear all tasks';
    }


    modalOverlay.hidden =
      false;

    requestAnimationFrame(
      () => {
        modalOverlay.classList.add(
          'show'
        );
      }
    );

    document.body.style.overflow =
      'hidden';

    if (modalConfirm) {
      modalConfirm.focus();
    }
  }


  function closeModal() {
    if (!modalOverlay) {
      return;
    }

    modalOverlay.classList.remove(
      'show'
    );

    document.body.style.overflow =
      '';

    setTimeout(
      () => {
        modalOverlay.hidden =
          true;
      },
      180
    );

    modalMode =
      null;

    pendingDeleteId =
      null;

    if (
      lastFocusedBeforeModal &&
      typeof lastFocusedBeforeModal.focus ===
      'function'
    ) {
      lastFocusedBeforeModal.focus();
    }
  }


  if (modalCancel) {
    modalCancel.addEventListener(
      'click',
      closeModal
    );
  }


  if (modalOverlay) {
    modalOverlay.addEventListener(
      'click',
      event => {
        if (
          event.target ===
          modalOverlay
        ) {
          closeModal();
        }
      }
    );
  }


  if (modalConfirm) {
    modalConfirm.addEventListener(
      'click',
      async () => {
        const mode =
          modalMode;

        const id =
          pendingDeleteId;

        closeModal();

        if (
          mode === 'delete'
        ) {
          await performDelete(
            id
          );
        }

        if (
          mode ===
          'clearCompleted'
        ) {
          await performClearCompleted();
        }

        if (
          mode ===
          'clearAll'
        ) {
          await performClearAll();
        }
      }
    );
  }


  /* =======================================================
     FAB
     ======================================================= */

  if (fabAdd) {
    fabAdd.addEventListener(
      'click',
      () => {
        if (addCard) {
          addCard.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }

        if (titleInput) {
          titleInput.focus();
        }
      }
    );
  }


  /* =======================================================
     FILTERS
     ======================================================= */

  filterPills.forEach(
    pill => {
      pill.addEventListener(
        'click',
        () => {
          filterPills.forEach(
            item => {
              item.classList.remove(
                'active'
              );

              item.setAttribute(
                'aria-selected',
                'false'
              );
            }
          );

          pill.classList.add(
            'active'
          );

          pill.setAttribute(
            'aria-selected',
            'true'
          );

          currentFilter =
            pill.dataset.filter;

          render();
        }
      );
    }
  );


  if (searchInput) {
    searchInput.addEventListener(
      'input',
      () => {
        searchTerm =
          searchInput.value
            .trim()
            .toLowerCase();

        if (searchClear) {
          searchClear.hidden =
            !searchInput.value;
        }

        render();
      }
    );
  }


  if (searchClear) {
    searchClear.addEventListener(
      'click',
      () => {
        searchInput.value =
          '';

        searchTerm =
          '';

        searchClear.hidden =
          true;

        searchInput.focus();

        render();
      }
    );
  }


  if (categoryFilter) {
    categoryFilter.addEventListener(
      'change',
      () => {
        categoryFilterValue =
          categoryFilter.value;

        render();
      }
    );
  }


  if (priorityFilter) {
    priorityFilter.addEventListener(
      'change',
      () => {
        priorityFilterValue =
          priorityFilter.value;

        render();
      }
    );
  }


  if (sortBy) {
    sortBy.addEventListener(
      'change',
      () => {
        sortValue =
          sortBy.value;

        render();
      }
    );
  }


  /* =======================================================
     CLEAR BUTTONS
     ======================================================= */

  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener(
      'click',
      () => {
        const hasCompleted =
          activeTasks().some(
            task =>
              task.completed
          );

        if (!hasCompleted) {
          showToast(
            'No completed tasks to clear'
          );

          return;
        }

        openModal(
          'clearCompleted'
        );
      }
    );
  }


  if (clearAllBtn) {
    clearAllBtn.addEventListener(
      'click',
      () => {
        if (
          !activeTasks().length
        ) {
          showToast(
            'No tasks to clear'
          );

          return;
        }

        openModal(
          'clearAll'
        );
      }
    );
  }


  /* =======================================================
     KEYBOARD
     ======================================================= */

  document.addEventListener(
    'keydown',
    event => {
      if (
        event.key !==
        'Escape'
      ) {
        return;
      }

      if (
        modalOverlay &&
        !modalOverlay.hidden
      ) {
        closeModal();

      } else if (
        mobileNav &&
        mobileNav.classList.contains(
          'open'
        )
      ) {
        closeMobileNav();
      }
    }
  );


  /* =======================================================
     DATE / TIME DISPLAY
     ======================================================= */

  function formatWhen(
    dateStr,
    timeStr
  ) {
    if (
      !dateStr &&
      !timeStr
    ) {
      return '';
    }

    let label =
      '';

    if (dateStr) {
      const date =
        new Date(
          dateStr +
          'T00:00:00'
        );

      if (
        !isNaN(
          date.getTime()
        )
      ) {
        label =
          date.toLocaleDateString(
            undefined,
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }
          );
      }
    }


    if (timeStr) {
      const parts =
        timeStr.split(
          ':'
        );

      const date =
        new Date();

      date.setHours(
        Number(
          parts[0]
        ),
        Number(
          parts[1]
        ),
        0,
        0
      );

      const timeLabel =
        date.toLocaleTimeString(
          undefined,
          {
            hour: 'numeric',
            minute: '2-digit'
          }
        );

      label =
        label
          ? `${label} · ${timeLabel}`
          : timeLabel;
    }

    return label;
  }


  function isOverdue(
    task
  ) {
    if (
      task.completed ||
      !task.date
    ) {
      return false;
    }

    const due =
      new Date(
        task.date +
        'T' +
        (
          task.time ||
          '23:59'
        ) +
        ':00'
      );

    if (
      isNaN(
        due.getTime()
      )
    ) {
      return false;
    }

    return (
      due.getTime() <
      Date.now()
    );
  }


  function getDueStatus(
    task
  ) {
    if (
      !task.date ||
      task.completed
    ) {
      return '';
    }

    const due =
      new Date(
        task.date +
        'T00:00:00'
      );

    if (
      isNaN(
        due.getTime()
      )
    ) {
      return '';
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const difference =
      Math.round(
        (
          due.getTime() -
          today.getTime()
        ) /
        86400000
      );

    if (
      difference < 0
    ) {
      return '';
    }

    if (
      difference === 0
    ) {
      return 'Due today';
    }

    if (
      difference === 1
    ) {
      return 'Due tomorrow';
    }

    return 'Upcoming';
  }


  /* =======================================================
     SORTING
     ======================================================= */

  function sortTasks(
    list
  ) {
    const sorted =
      list.slice();

    if (
      sortValue ===
      'priority'
    ) {
      sorted.sort(
        (a, b) =>
          PRIORITY_RANK[
          a.priority
          ] -
          PRIORITY_RANK[
          b.priority
          ] ||
          b.createdAt -
          a.createdAt
      );

    } else if (
      sortValue ===
      'date'
    ) {
      sorted.sort(
        (a, b) => {
          if (
            !a.date &&
            !b.date
          ) {
            return (
              b.createdAt -
              a.createdAt
            );
          }

          if (!a.date) {
            return 1;
          }

          if (!b.date) {
            return -1;
          }

          const aDate =
            a.date +
            (
              a.time ||
              '00:00'
            );

          const bDate =
            b.date +
            (
              b.time ||
              '00:00'
            );

          const comparison =
            aDate.localeCompare(
              bDate
            );

          if (
            comparison !==
            0
          ) {
            return comparison;
          }

          return (
            b.createdAt -
            a.createdAt
          );
        }
      );

    } else {
      sorted.sort(
        (a, b) =>
          b.createdAt -
          a.createdAt
      );
    }

    return sorted;
  }


  /* =======================================================
     FILTERING
     ======================================================= */

  function activeTasks() {
    return tasks.filter(
      task =>
        !task._hidden
    );
  }


  function getVisibleTasks() {
    const visible =
      activeTasks().filter(
        task => {

          if (
            currentFilter ===
            'pending' &&
            task.completed
          ) {
            return false;
          }

          if (
            currentFilter ===
            'completed' &&
            !task.completed
          ) {
            return false;
          }

          if (
            categoryFilterValue !==
            'all' &&
            task.category !==
            categoryFilterValue
          ) {
            return false;
          }

          if (
            priorityFilterValue !==
            'all' &&
            task.priority !==
            priorityFilterValue
          ) {
            return false;
          }


          if (searchTerm) {
            const searchText =
              (
                task.title +
                ' ' +
                (
                  task.description ||
                  ''
                ) +
                ' ' +
                (
                  task.category ||
                  ''
                )
              ).toLowerCase();

            if (
              !searchText.includes(
                searchTerm
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );

    return sortTasks(
      visible
    );
  }


  /* =======================================================
     STATISTICS
     ======================================================= */

  function renderStats() {
    const live =
      activeTasks();

    const total =
      live.length;

    const completed =
      live.filter(
        task =>
          task.completed
      ).length;

    const pending =
      total -
      completed;

    const high =
      live.filter(
        task =>
          task.priority ===
          'High' &&
          !task.completed
      ).length;


    if (statTotal) {
      statTotal.textContent =
        total;
    }

    if (statPending) {
      statPending.textContent =
        pending;
    }

    if (statCompleted) {
      statCompleted.textContent =
        completed;
    }

    if (statHigh) {
      statHigh.textContent =
        high;
    }


    const percentage =
      total
        ? Math.round(
          (
            completed /
            total
          ) *
          100
        )
        : 0;


    if (progressValue) {
      progressValue.textContent =
        percentage +
        '%';
    }


    if (ringFill) {
      ringFill.setAttribute(
        'stroke-dashoffset',
        String(
          100 -
          percentage
        )
      );
    }


    const summary =
      total
        ? `${completed}/${total} completed`
        : 'No tasks yet';


    if (headerStats) {
      headerStats.textContent =
        summary;
    }

    if (mobileNavStats) {
      mobileNavStats.textContent =
        summary;
    }


    if (countAll) {
      countAll.textContent =
        total;
    }

    if (countPending) {
      countPending.textContent =
        pending;
    }

    if (countCompleted) {
      countCompleted.textContent =
        completed;
    }
  }


  /* =======================================================
     CATEGORY OVERVIEW
     ======================================================= */

  function renderCategoryOverview() {
    if (!categoryGrid) {
      return;
    }

    const live =
      activeTasks();

    if (!live.length) {
      categoryGrid.innerHTML =
        '<p class="category-overview-empty">Add a task to see your categories break down here.</p>';

      return;
    }


    categoryGrid.innerHTML =
      '';


    const fragment =
      document.createDocumentFragment();


    CATEGORIES.forEach(
      category => {
        const count =
          live.filter(
            task =>
              (
                task.category ||
                'Other'
              ) ===
              category
          ).length;


        const variable =
          CATEGORY_VAR[
          category
          ] ||
          'other';


        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'category-tile';


        if (
          categoryFilterValue ===
          category
        ) {
          button.classList.add(
            'is-active'
          );
        }


        button.style.setProperty(
          '--cat-color',
          `var(--category-${variable})`
        );

        button.style.setProperty(
          '--cat-bg',
          `var(--category-${variable}-bg)`
        );


        button.setAttribute(
          'aria-pressed',
          String(
            categoryFilterValue ===
            category
          )
        );


        button.innerHTML = `
          <span class="dot" aria-hidden="true"></span>

          <span class="category-tile-text">
            <span class="category-tile-name">
              ${category}
            </span>

            <span class="category-tile-count">
              ${count}
              task${count === 1 ? '' : 's'}
            </span>
          </span>
        `;


        button.addEventListener(
          'click',
          () => {
            const next =
              categoryFilterValue ===
                category
                ? 'all'
                : category;

            categoryFilterValue =
              next;

            if (
              categoryFilter
            ) {
              categoryFilter.value =
                next;
            }

            render();

            if (taskGrid) {
              taskGrid.scrollIntoView({
                behavior:
                  'smooth',

                block:
                  'start'
              });
            }
          }
        );


        fragment.appendChild(
          button
        );
      }
    );


    categoryGrid.appendChild(
      fragment
    );
  }


  /* =======================================================
     TASK CARD
     ======================================================= */

  function buildTaskCard(
    task
  ) {
    if (!taskTemplate) {
      return null;
    }

    const node =
      taskTemplate.content
        .firstElementChild
        .cloneNode(true);


    node.dataset.id =
      task.id;

    node.dataset.priority =
      task.priority;


    if (task.completed) {
      node.classList.add(
        'completed'
      );
    }


    const overdue =
      isOverdue(
        task
      );

    if (overdue) {
      node.classList.add(
        'is-overdue'
      );
    }


    const title =
      node.querySelector(
        '.task-title'
      );

    if (title) {
      title.textContent =
        task.title;
    }


    const description =
      node.querySelector(
        '.task-desc'
      );

    if (description) {
      description.textContent =
        task.description ||
        '';
    }


    const priority =
      node.querySelector(
        '.priority-badge'
      );

    if (priority) {
      priority.textContent =
        task.priority;
    }


    const categoryBadge =
      node.querySelector(
        '.category-badge'
      );

    if (categoryBadge) {
      categoryBadge.textContent =
        task.category ||
        'Other';

      categoryBadge.dataset.category =
        task.category ||
        'Other';
    }


    const overdueBadge =
      node.querySelector(
        '.overdue-badge'
      );

    if (overdueBadge) {
      overdueBadge.hidden =
        !overdue;
    }


    const dueBadge =
      node.querySelector(
        '.due-badge'
      );

    if (dueBadge) {
      const status =
        overdue
          ? ''
          : getDueStatus(
            task
          );

      if (status) {
        dueBadge.textContent =
          status;

        dueBadge.hidden =
          false;
      } else {
        dueBadge.hidden =
          true;
      }
    }


    const when =
      node.querySelector(
        '.task-when'
      );

    if (when) {
      when.textContent =
        formatWhen(
          task.date,
          task.time
        );
    }


    const checkButton =
      node.querySelector(
        '.check'
      );

    if (checkButton) {
      checkButton.setAttribute(
        'aria-label',
        task.completed
          ? 'Mark as pending'
          : 'Mark complete'
      );

      checkButton.addEventListener(
        'click',
        () =>
          toggleComplete(
            task.id
          )
      );
    }


    const editButton =
      node.querySelector(
        '.edit-btn'
      );

    if (editButton) {
      editButton.addEventListener(
        'click',
        () =>
          enterEditMode(
            task
          )
      );
    }


    const deleteButton =
      node.querySelector(
        '.delete-btn'
      );

    if (deleteButton) {
      deleteButton.addEventListener(
        'click',
        () =>
          openModal(
            'delete',
            task.id
          )
      );
    }


    return node;
  }


  /* =======================================================
     RENDER
     ======================================================= */

  function render() {
    if (!taskGrid) {
      return;
    }

    const visible =
      getVisibleTasks();

    taskGrid.innerHTML =
      '';


    if (!visible.length) {

      if (emptyTemplate) {

        const empty =
          emptyTemplate.content
            .firstElementChild
            .cloneNode(true);


        const title =
          empty.querySelector(
            '.empty-title'
          );

        const sub =
          empty.querySelector(
            '.empty-sub'
          );


        const hasAnyTasks =
          activeTasks().length >
          0;


        if (
          hasAnyTasks &&
          searchTerm
        ) {
          if (title) {
            title.textContent =
              'No matching tasks';
          }

          if (sub) {
            sub.textContent =
              'Try another search term.';
          }

        } else if (
          hasAnyTasks &&
          categoryFilterValue !==
          'all'
        ) {
          if (title) {
            title.textContent =
              'No tasks in this category';
          }

          if (sub) {
            sub.textContent =
              'Try another category or clear the filter.';
          }

        } else if (
          hasAnyTasks &&
          priorityFilterValue !==
          'all'
        ) {
          if (title) {
            title.textContent =
              'No tasks at this priority';
          }

          if (sub) {
            sub.textContent =
              'Try another priority or clear the filter.';
          }

        } else if (
          hasAnyTasks &&
          currentFilter ===
          'completed'
        ) {
          if (title) {
            title.textContent =
              'Nothing completed yet';
          }

          if (sub) {
            sub.textContent =
              'Complete a task and it will appear here.';
          }

        } else if (
          hasAnyTasks &&
          currentFilter ===
          'pending'
        ) {
          if (title) {
            title.textContent =
              'Nothing pending';
          }

          if (sub) {
            sub.textContent =
              'Every task is complete — nice work.';
          }
        }


        taskGrid.appendChild(
          empty
        );
      }

    } else {

      const fragment =
        document.createDocumentFragment();


      visible.forEach(
        task => {
          const card =
            buildTaskCard(
              task
            );

          if (card) {
            fragment.appendChild(
              card
            );
          }
        }
      );


      taskGrid.appendChild(
        fragment
      );
    }


    renderStats();

    renderCategoryOverview();
  }


  /* =======================================================
     SUPABASE AUTH STATE
     ======================================================= */

  supabaseClient.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      console.log(
        'Auth event:',
        event
      );


      currentUser =
        session?.user ||
        null;


      updateAuthUI();


      if (
        event ===
        'SIGNED_IN' ||
        event ===
        'INITIAL_SESSION'
      ) {

        if (currentUser) {

          await loadTasks();

          render();

          showToast(
            'Signed in successfully'
          );
        }

      }


      if (
        event ===
        'SIGNED_OUT'
      ) {

        tasks = [];

        editingId =
          null;

        resetForm();

        render();

        updateAuthUI();
      }
    }
  );


  /* =======================================================
     INITIALIZE
     ======================================================= */

  async function initialize() {

    showLoading(
      'Connecting to Supabase…'
    );


    createAuthUI();


    try {

      currentUser =
        await getCurrentUser();


      updateAuthUI();


      if (currentUser) {

        await loadTasks();

      } else {

        tasks = [];

        render();

      }

    } catch (error) {

      console.error(
        'Initialization error:',
        error
      );

      showToast(
        'Could not connect to Supabase',
        {
          error: true,
          duration: 5000
        }
      );

    } finally {

      hideLoading();
    }
  }


  /* =======================================================
     START
     ======================================================= */

  setPriority(
    'Low'
  );

  if (categorySelect) {
    categorySelect.value =
      'Work';
  }

  render();

  initialize();

})();