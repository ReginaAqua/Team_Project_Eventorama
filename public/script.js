document.addEventListener("DOMContentLoaded", () => {
  // Basic references
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("modal");
  const closeModal = document.querySelector(".close");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const modalTitle = document.getElementById("modalTitle");
  const viewDateInput = document.getElementById("viewDate");
  const viewDateBtn = document.getElementById("viewDateBtn");

  // Create Event modal references
  const openCreateModalBtn = document.getElementById("openCreateModalBtn");
  const createModal = document.getElementById("createModal");
  const createClose = document.getElementById("createClose");
  const createEventForm = document.getElementById("createEventForm");
  const createLat = document.getElementById("createLat");
  const createLon = document.getElementById("createLon");
  const createLocation = document.getElementById("createLocation");

  // "My Events" button (header nav)
  const myEventsBtn = document.getElementById("myEventsBtn");

  // Edit modal references
  const editModal = document.getElementById("editModal");
  const editClose = document.getElementById("editClose");
  const editEventForm = document.getElementById("editEventForm");
  const editEventId = document.getElementById("editEventId");
  const editEventName = document.getElementById("editEventName");
  const editDate = document.getElementById("editDate");
  const editTime = document.getElementById("editTime");
  const editDescription = document.getElementById("editDescription");
  const editDisplayLocation = document.getElementById("editDisplayLocation");
  const editLat = document.getElementById("editLat");
  const editLon = document.getElementById("editLon");
  const editLocation = document.getElementById("editLocation");

  let selectedDate = null;
  let currentUser = localStorage.getItem("currentUser") || null;
  let currentUserRole = localStorage.getItem("currentUserRole") || null;

  // Initialize UI based on whether user is logged in
  updateUI();

  // Set default date for date picker
  if (viewDateInput) {
    viewDateInput.value = new Date().toISOString().split("T")[0];
  }
  if (viewDateBtn) {
    viewDateBtn.addEventListener("click", () => {
      selectedDate = viewDateInput.value;
      fetchEvents();
    });
  }

  // "My Events" button fade-out animation
  if (myEventsBtn) {
    myEventsBtn.addEventListener("click", () => {
      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = "my_events.html";
      }, 300);
    });
  }

  // Create Event modal open
  if (openCreateModalBtn) {
    openCreateModalBtn.addEventListener("click", () => {
      createModal.style.display = "block";
      // Invalidate map size after modal opens
      setTimeout(() => {
        mapCreate.invalidateSize();
      }, 300);
    });
  }
  // Create Event modal close
  if (createClose) {
    createClose.addEventListener("click", () => {
      createModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === createModal) {
      createModal.style.display = "none";
    }
  });

  // Edit modal close
  editClose.addEventListener("click", () => {
    editModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });

  // Auth modals
  loginBtn.addEventListener("click", () => showModal("login"));
  signupBtn.addEventListener("click", () => showModal("register"));
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserRole");
    currentUser = null;
    currentUserRole = null;
    updateUI();
  });
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Login Form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const response = await fetch("../backend/api.php?endpoint=auth", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      localStorage.setItem("currentUser", result.username);
      localStorage.setItem("currentUserRole", result.role);
      currentUser = result.username;
      currentUserRole = result.role;
      updateUI();
      modal.style.display = "none";
    } else {
      alert(result.message);
    }
  });

  // Signup Form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const response = await fetch("../backend/api.php?endpoint=auth", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      localStorage.setItem("currentUser", result.username);
      localStorage.setItem("currentUserRole", result.role);
      currentUser = result.username;
      currentUserRole = result.role;
      updateUI();
      modal.style.display = "none";
    } else {
      alert(result.message);
    }
  });

  // Create Event Form submission
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
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      alert("Event created!");
      createEventForm.reset();
      createLat.value = "";
      createLon.value = "";
      createLocation.value = "";
      createModal.style.display = "none";
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  // Edit Event Form submission
  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editEventForm);
    // Use action=edit so events.php updates instead of creating
    formData.append("action", "edit");
    formData.append("username", currentUser);

    const response = await fetch("../backend/api.php?endpoint=events", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      alert("Event updated!");
      editModal.style.display = "none";
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  // Show the login/signup modal
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

  // Decide which buttons to show
  function updateUI() {
    if (currentUser) {
      logoutBtn.style.display = "inline-block";
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      openCreateModalBtn.style.display = "block";
      myEventsBtn.style.display = "inline-block";
    } else {
      logoutBtn.style.display = "none";
      loginBtn.style.display = "inline-block";
      signupBtn.style.display = "inline-block";
      openCreateModalBtn.style.display = "none";
      myEventsBtn.style.display = "none";
    }
    fetchEvents();
  }

  // Fetch events from the backend
  async function fetchEvents() {
    const response = await fetch("../backend/api.php?endpoint=events&action=get");
    const result = await response.json();
    if (result.success && result.events) {
      if (selectedDate) {
        const filtered = result.events.filter(ev => ev.date === selectedDate);
        if (filtered.length === 0) {
          document.getElementById("calendar").innerHTML = "<p>No events</p>";
        } else {
          filtered.sort((a, b) => new Date("1970-01-01T" + a.time) - new Date("1970-01-01T" + b.time));
          displayEvents(filtered);
        }
      } else {
        // Show upcoming events
        const now = new Date();
        const upcoming = result.events.filter(ev => new Date(ev.date + "T" + ev.time) > now);
        upcoming.sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time));
        if (upcoming.length === 0) {
          document.getElementById("calendar").innerHTML = "<p>No upcoming events</p>";
        } else {
          displayUpcomingEvents(upcoming);
        }
      }
    } else {
      document.getElementById("calendar").innerHTML = "<p>No events</p>";
    }
  }

  function displayUpcomingEvents(events) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "<h3>Upcoming Events</h3>";
    events.forEach(ev => {
      const eventDiv = createEventElement(ev);
      calendarDiv.appendChild(eventDiv);
    });
    attachEventListeners();
  }

  function displayEvents(events) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";
    const eventsByHour = {};
    events.forEach(ev => {
      const hour = new Date("1970-01-01T" + ev.time).getHours();
      if (!eventsByHour[hour]) {
        eventsByHour[hour] = [];
      }
      eventsByHour[hour].push(ev);
    });
    const sortedHours = Object.keys(eventsByHour).sort((a, b) => a - b);
    sortedHours.forEach(hour => {
      const hourSlot = document.createElement("div");
      hourSlot.className = "hour-slot";
      hourSlot.innerHTML = `<strong>${hour}:00</strong>`;
      eventsByHour[hour].forEach(ev => {
        const eventDiv = createEventElement(ev);
        hourSlot.appendChild(eventDiv);
      });
      calendarDiv.appendChild(hourSlot);
    });
    attachEventListeners();
  }

  // Creates an event card with hover expansion (500ms delay)
  function createEventElement(ev) {
    const eventDiv = document.createElement("div");
    eventDiv.className = "event";
    eventDiv.setAttribute("data-eventid", ev.id);
    eventDiv.setAttribute("data-eventname", ev.eventName);
    eventDiv.setAttribute("data-date", ev.date);
    eventDiv.setAttribute("data-time", ev.time);
    eventDiv.setAttribute("data-description", ev.description || "");
    eventDiv.setAttribute("data-displayLocation", ev.displayLocation || "");
    eventDiv.setAttribute("data-location", ev.location || "");

    const hiddenDetails = `
      <div class="hidden-details">
        ${ev.displayLocation ? `<p>${ev.displayLocation}</p>` : ""}
        ${ev.poster ? `<img src="${ev.poster}" alt="Event Poster">` : ""}
      </div>
    `;

    const goingCount = ev.going && Array.isArray(ev.going) ? ev.going.length : 0;
    const thinkingCount = ev.thinking && Array.isArray(ev.thinking) ? ev.thinking.length : 0;
    const countsHTML = `<p>Going: ${goingCount}, Thinking: ${thinkingCount}</p>`;

    let voteButtonsHTML = "";
    if (currentUser) {
      voteButtonsHTML = `
        <button data-eventid="${ev.id}" class="goingBtn">Going</button>
        <button data-eventid="${ev.id}" class="thinkingBtn">Thinking</button>
      `;
    }

    let adminButtonsHTML = "";
    if (currentUserRole === "admin") {
      adminButtonsHTML = `
        <button data-eventid="${ev.id}" class="editBtn">Edit</button>
        <button data-eventid="${ev.id}" class="deleteBtn">Delete</button>
      `;
    }

    const detailsLink = `<a href="event_details.html?id=${ev.id}">Details</a>`;

    eventDiv.innerHTML = `
      <div class="event-content">
        <p><strong>${ev.eventName}</strong> (${ev.date} ${ev.time})</p>
        ${countsHTML}
        ${voteButtonsHTML}
        ${adminButtonsHTML}
        ${detailsLink}
      </div>
      ${hiddenDetails}
    `;

    // Hover expansion with 500ms delay
    let hoverTimer = null;
    eventDiv.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => {
        eventDiv.classList.add("expanded");
      }, 500);
    });
    eventDiv.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      eventDiv.classList.remove("expanded");
    });

    return eventDiv;
  }

  function attachEventListeners() {
    if (currentUser) {
      document.querySelectorAll(".goingBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const eventId = btn.dataset.eventid;
          const formData = new FormData();
          formData.append("vote", "going");
          formData.append("eventId", eventId);
          formData.append("username", currentUser);
          const response = await fetch("../backend/api.php?endpoint=events", {
            method: "POST",
            body: formData
          });
          const result = await response.json();
          if (result.success) {
            fetchEvents();
          } else {
            alert(result.message);
          }
        });
      });
      document.querySelectorAll(".thinkingBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const eventId = btn.dataset.eventid;
          const formData = new FormData();
          formData.append("vote", "thinking");
          formData.append("eventId", eventId);
          formData.append("username", currentUser);
          const response = await fetch("../backend/api.php?endpoint=events", {
            method: "POST",
            body: formData
          });
          const result = await response.json();
          if (result.success) {
            fetchEvents();
          } else {
            alert(result.message);
          }
        });
      });
      if (currentUserRole === "admin") {
        document.querySelectorAll(".deleteBtn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const eventId = btn.dataset.eventid;
            if (confirm("Are you sure you want to delete this event?")) {
              const formData = new FormData();
              formData.append("adminAction", "delete");
              formData.append("eventId", eventId);
              formData.append("username", currentUser);
              const response = await fetch("../backend/api.php?endpoint=events", {
                method: "POST",
                body: formData
              });
              const result = await response.json();
              if (result.success) {
                fetchEvents();
              } else {
                alert(result.message);
              }
            }
          });
        });
        document.querySelectorAll(".editBtn").forEach(btn => {
          btn.addEventListener("click", () => {
            const eventDiv = btn.closest(".event");
            editEventId.value = eventDiv.getAttribute("data-eventid");
            editEventName.value = eventDiv.getAttribute("data-eventname");
            editDate.value = eventDiv.getAttribute("data-date");
            editTime.value = eventDiv.getAttribute("data-time");
            editDescription.value = eventDiv.getAttribute("data-description");
            editDisplayLocation.value = eventDiv.getAttribute("data-displayLocation");
            editPoster.value = "";
            editModal.style.display = "block";
            initializeEditMap();
          });
        });
      }
    }
  }

  // Leaflet map for Create Event form
  let mapCreate = L.map("mapCreate").setView([37.9838, 23.7275], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapCreate);
  let markerCreate = L.marker([37.9838, 23.7275]).addTo(mapCreate);
  let geocoderCreate = L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on("markgeocode", function(e) {
      const center = e.geocode.center;
      markerCreate.setLatLng(center);
      mapCreate.setView(center, 15);
      markerCreate.bindPopup(e.geocode.name).openPopup();
      createLat.value = center.lat;
      createLon.value = center.lng;
      createLocation.value = e.geocode.name;
    })
    .addTo(mapCreate);

  // Leaflet map for Edit Event form
  let mapEdit, markerEdit, geocoderEdit;
  function initializeEditMap() {
    if (mapEdit) {
      mapEdit.remove();
    }
    let defaultLat = 37.9838, defaultLon = 23.7275;
    if (editLat.value && editLon.value) {
      defaultLat = editLat.value;
      defaultLon = editLon.value;
    }
    mapEdit = L.map("mapEdit").setView([defaultLat, defaultLon], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapEdit);
    markerEdit = L.marker([defaultLat, defaultLon]).addTo(mapEdit);
    geocoderEdit = L.Control.geocoder({
      defaultMarkGeocode: false
    })
      .on("markgeocode", function(e) {
        const center = e.geocode.center;
        markerEdit.setLatLng(center);
        mapEdit.setView(center, 15);
        markerEdit.bindPopup(e.geocode.name).openPopup();
        editLat.value = center.lat;
        editLon.value = center.lng;
        editLocation.value = e.geocode.name;
      })
      .addTo(mapEdit);
  }

  fetchEvents();
});
