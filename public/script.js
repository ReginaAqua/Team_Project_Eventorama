document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("modal");
  const closeModal = document.querySelector(".close");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const modalTitle = document.getElementById("modalTitle");
  const createEventSection = document.getElementById("createEventSection");
  const createEventForm = document.getElementById("createEventForm");
  const viewDateInput = document.getElementById("viewDate");
  const viewDateBtn = document.getElementById("viewDateBtn");

  // By default, show today's events
  let selectedDate = new Date().toISOString().split("T")[0];

  // Simple session management using localStorage
  let currentUser = localStorage.getItem("currentUser") || null;
  updateUI();

  // Initialize the date picker to today's date
  if (viewDateInput) {
    viewDateInput.value = selectedDate;
  }

  // Listen for "View Events" button click
  if (viewDateBtn) {
    viewDateBtn.addEventListener("click", () => {
      selectedDate = viewDateInput.value;
      fetchEvents();
    });
  }

  loginBtn.addEventListener("click", () => {
    showModal("login");
  });

  signupBtn.addEventListener("click", () => {
    showModal("register");
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    currentUser = null;
    updateUI();
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const response = await fetch("../backend/api.php?endpoint=auth", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      localStorage.setItem("currentUser", result.username);
      currentUser = result.username;
      updateUI();
      modal.style.display = "none";
    } else {
      alert(result.message);
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const response = await fetch("../backend/api.php?endpoint=auth", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      localStorage.setItem("currentUser", result.username);
      currentUser = result.username;
      updateUI();
      modal.style.display = "none";
    } else {
      alert(result.message);
    }
  });

  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to create an event.");
      return;
    }
    const formData = new FormData(createEventForm);
    formData.append("username", currentUser);
    const response = await fetch("../backend/api.php?endpoint=events", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      alert("Event created successfully!");
      createEventForm.reset();
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  function showModal(type) {
    modal.style.display = "block";
    if (type === "login") {
      modalTitle.textContent = "Login";
      loginForm.style.display = "block";
      signupForm.style.display = "none";
    } else {
      modalTitle.textContent = "Sign Up";
      loginForm.style.display = "none";
      signupForm.style.display = "block";
    }
  }

  function updateUI() {
    if (currentUser) {
      logoutBtn.style.display = "inline-block";
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      createEventSection.style.display = "block";
    } else {
      logoutBtn.style.display = "none";
      loginBtn.style.display = "inline-block";
      signupBtn.style.display = "inline-block";
      createEventSection.style.display = "none";
    }
    fetchEvents();
  }

  async function fetchEvents() {
    const response = await fetch("../backend/api.php?endpoint=events&action=get");
    const result = await response.json();
    if (result.success && result.events) {
      displayEvents(result.events);
    } else {
      displayEvents([]);
    }
  }

  function displayEvents(events) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";

    // 1) Filter by selected date
    const filtered = events.filter(ev => ev.date === selectedDate);

    // 2) If no events for that date, show "No events"
    if (filtered.length === 0) {
      calendarDiv.innerHTML = "<p>No events</p>";
      return;
    }

    // 3) Group them by hour to mimic a schedule
    const eventsByHour = {};
    filtered.forEach(ev => {
      const hour = new Date(`${ev.date}T${ev.time}`).getHours();
      if (!eventsByHour[hour]) {
        eventsByHour[hour] = [];
      }
      eventsByHour[hour].push(ev);
    });

    // Sort hours ascending
    const sortedHours = Object.keys(eventsByHour).sort((a, b) => a - b);

    // 4) Display each hour slot and its events
    sortedHours.forEach(hour => {
      const hourSlot = document.createElement("div");
      hourSlot.className = "hour-slot";
      hourSlot.innerHTML = `<strong>${hour}:00</strong>`;

      eventsByHour[hour].forEach(ev => {
        const eventDiv = document.createElement("div");
        eventDiv.className = "event";
        eventDiv.innerHTML = `
          <p><strong>${ev.eventName}</strong> at ${ev.location}</p>
          <p>${ev.description}</p>
          <p>${ev.date} ${ev.time}</p>
          ${
            ev.poster
              ? `<img src="${ev.poster}" alt="${ev.eventName}" style="max-width:100px;">`
              : ""
          }
          <button data-eventid="${ev.id}" class="goingBtn">Going</button>
          <button data-eventid="${ev.id}" class="thinkingBtn">Thinking</button>
        `;
        hourSlot.appendChild(eventDiv);
      });

      calendarDiv.appendChild(hourSlot);
    });

    // Demo event button actions
    document.querySelectorAll(".goingBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        alert("You clicked 'Going'!");
      });
    });
    document.querySelectorAll(".thinkingBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        alert("You clicked 'Thinking about it'!");
      });
    });
  }
});
