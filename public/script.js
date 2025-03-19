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
  const createEventSection = document.getElementById("createEventSection");
  const createEventForm = document.getElementById("createEventForm");
  const viewDateInput = document.getElementById("viewDate");
  const viewDateBtn = document.getElementById("viewDateBtn");

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

  // Hidden fields for map selections (Create)
  const createLat = document.getElementById("createLat");
  const createLon = document.getElementById("createLon");
  const createLocation = document.getElementById("createLocation");

  // Hidden fields for map selections (Edit)
  const editLat = document.getElementById("editLat");
  const editLon = document.getElementById("editLon");
  const editLocation = document.getElementById("editLocation");

  let selectedDate = null;
  let currentUser = localStorage.getItem("currentUser") || null;
  let currentUserRole = localStorage.getItem("currentUserRole") || null;

  updateUI();

  if (viewDateInput) {
    viewDateInput.value = new Date().toISOString().split("T")[0];
  }
  if (viewDateBtn) {
    viewDateBtn.addEventListener("click", () => {
      selectedDate = viewDateInput.value;
      fetchEvents();
    });
  }

  loginBtn.addEventListener("click", () => showModal("login"));
  signupBtn.addEventListener("click", () => showModal("register"));
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserRole");
    currentUser = null;
    currentUserRole = null;
    updateUI();
  });
  closeModal.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const response = await fetch("../backend/api.php?endpoint=auth", { method: "POST", body: formData });
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

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const response = await fetch("../backend/api.php?endpoint=auth", { method: "POST", body: formData });
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

  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to create an event.");
      return;
    }
    const formData = new FormData(createEventForm);
    formData.append("username", currentUser);
    const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      alert("Event created!");
      createEventForm.reset();
      // Clear hidden fields
      createLat.value = "";
      createLon.value = "";
      createLocation.value = "";
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  editClose.addEventListener("click", () => { editModal.style.display = "none"; });
  window.addEventListener("click", (e) => { if (e.target === editModal) editModal.style.display = "none"; });

  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editEventForm);
    formData.append("adminAction", "edit");
    formData.append("username", currentUser);
    const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      alert("Event updated!");
      editModal.style.display = "none";
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
      if (selectedDate) {
        const filtered = result.events.filter(ev => ev.date === selectedDate);
        if (filtered.length === 0) {
          document.getElementById("calendar").innerHTML = "<p>No events</p>";
        } else {
          filtered.sort((a, b) => new Date("1970-01-01T" + a.time) - new Date("1970-01-01T" + b.time));
          displayEvents(filtered);
        }
      } else {
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

  // Creates an event card with hover expansion
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

    // Hidden details that expand on hover
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

    // "Details" link
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

    // 3-second hover expansion
    let hoverTimer = null;
    eventDiv.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => {
        eventDiv.classList.add("expanded");
      }, 3000);
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
          const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
          const result = await response.json();
          if (result.success) { fetchEvents(); } else { alert(result.message); }
        });
      });
      document.querySelectorAll(".thinkingBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const eventId = btn.dataset.eventid;
          const formData = new FormData();
          formData.append("vote", "thinking");
          formData.append("eventId", eventId);
          formData.append("username", currentUser);
          const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
          const result = await response.json();
          if (result.success) { fetchEvents(); } else { alert(result.message); }
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
              const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
              const result = await response.json();
              if (result.success) { fetchEvents(); } else { alert(result.message); }
            }
          });
        });
        document.querySelectorAll(".editBtn").forEach(btn => {
          btn.addEventListener("click", () => {
            const eventDiv = btn.closest(".event");
            // Pre-populate form fields from event data
            editEventId.value = eventDiv.getAttribute("data-eventid");
            editEventName.value = eventDiv.getAttribute("data-eventname");
            editDate.value = eventDiv.getAttribute("data-date");
            editTime.value = eventDiv.getAttribute("data-time");
            editDescription.value = eventDiv.getAttribute("data-description");
            editDisplayLocation.value = eventDiv.getAttribute("data-displayLocation");
            editPoster.value = "";
            // Show the modal
            editModal.style.display = "block";
            // Initialize the edit map: if the event has lat/lon, use them; otherwise, use default
            initializeEditMap();
          });
        });
      }
    }
  }

  // Initialize Leaflet map for Create Event form
  let mapCreate = L.map("mapCreate").setView([37.9838, 23.7275], 13); // Default to Athens
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
      // Update hidden fields for create form
      createLat.value = center.lat;
      createLon.value = center.lng;
      createLocation.value = e.geocode.name;
    })
    .addTo(mapCreate);

  // Variables for edit map
  let mapEdit, markerEdit, geocoderEdit;
  function initializeEditMap() {
    // If map already exists, remove it (if re-editing another event)
    if (mapEdit) {
      mapEdit.remove();
    }
    // Default center: use event's lat/lon if available, else default to Athens
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
        // Update hidden fields for edit form
        editLat.value = center.lat;
        editLon.value = center.lng;
        editLocation.value = e.geocode.name;
      })
      .addTo(mapEdit);
  }
  
  // End of DOMContentLoaded
  fetchEvents();
});
