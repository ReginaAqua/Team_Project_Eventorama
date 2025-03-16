document.addEventListener("DOMContentLoaded", () => {
  // DOM references
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
  const editPoster = document.getElementById("editPoster");

  // Hidden fields for location
  const createLat = document.getElementById("createLat");
  const createLon = document.getElementById("createLon");
  const createLocation = document.getElementById("createLocation");

  const editLat = document.getElementById("editLat");
  const editLon = document.getElementById("editLon");
  const editLocation = document.getElementById("editLocation");

  // For filtering events
  let selectedDate = null;
  let currentUser = localStorage.getItem("currentUser") || null;
  let currentUserRole = localStorage.getItem("currentUserRole") || null;

  // Initialize UI
  updateUI();

  // Setup date picker default
  if (viewDateInput) {
    viewDateInput.value = new Date().toISOString().split("T")[0];
  }
  if (viewDateBtn) {
    viewDateBtn.addEventListener("click", () => {
      selectedDate = viewDateInput.value;
      fetchEvents();
    });
  }

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

  closeModal.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Auth forms
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

  // Create event form
  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to create an event.");
      return;
    }
    const formData = new FormData(createEventForm);
    formData.append("username", currentUser);
    // The lat/lon/location are already in hidden fields
    const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      alert("Event created successfully!");
      createEventForm.reset();
      // Reset lat/lon/location
      createLat.value = "";
      createLon.value = "";
      createLocation.value = "";
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  // Edit modal close
  editClose.addEventListener("click", () => { editModal.style.display = "none"; });
  window.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.style.display = "none";
  });

  // Edit event form
  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editEventForm);
    formData.append("adminAction", "edit");
    formData.append("username", currentUser);
    const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      alert("Event updated successfully!");
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

  // Fetch events from backend
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

  // Display upcoming events in a simple list
  function displayUpcomingEvents(events) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "<h3>Upcoming Events</h3>";
    events.forEach(ev => {
      const eventDiv = createEventElement(ev);
      calendarDiv.appendChild(eventDiv);
    });
    attachEventListeners();
  }

  // Display events grouped by hour for a specific date
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

  // Helper to create an .event element
  function createEventElement(ev) {
    const eventDiv = document.createElement("div");
    eventDiv.className = "event";
    eventDiv.setAttribute("data-eventid", ev.id);
    eventDiv.setAttribute("data-eventname", ev.eventName);
    eventDiv.setAttribute("data-date", ev.date);
    eventDiv.setAttribute("data-time", ev.time);
    eventDiv.setAttribute("data-description", ev.description);
    // We'll store the location text in data-loc
    eventDiv.setAttribute("data-location", ev.location || "");
    // We'll skip lat/lon if they're not stored, or you can store them too.

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
    const goingCount = ev.going && Array.isArray(ev.going) ? ev.going.length : 0;
    const thinkingCount = ev.thinking && Array.isArray(ev.thinking) ? ev.thinking.length : 0;
    const voteCountsHTML = `<p>Going: ${goingCount}, Thinking: ${thinkingCount}</p>`;

    eventDiv.innerHTML = `
      <p><strong>${ev.eventName}</strong></p>
      <p>${ev.description}</p>
      <p>${ev.date} ${ev.time}</p>
      <p>${ev.location || ""}</p>
      ${ ev.poster ? `<img src="${ev.poster}" alt="${ev.eventName}" style="max-width:100px;">` : "" }
      ${voteCountsHTML}
      ${voteButtonsHTML}
      ${adminButtonsHTML}
    `;
    return eventDiv;
  }

  // Attach event listeners for Going/Thinking/Admin actions
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
          const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
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
              const response = await fetch("../backend/api.php?endpoint=events", { method: "POST", body: formData });
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
            // We won't know lat/lon unless we stored them in the DB. We'll skip for now.
            // location text:
            editLocation.value = eventDiv.getAttribute("data-location");
            editPoster.value = "";
            // Show the edit modal
            editModal.style.display = "block";
            // Re-center the map on the old location if lat/lon exist (optional).
          });
        });
      }
    }
  }

  // -------------- LEAFLET MAPS + CONTROL GEOCODER --------------

  // CREATE EVENT MAP
  let mapCreate = L.map("mapCreate").setView([37.9838, 23.7275], 13); // Athens default
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapCreate);

  let markerCreate = L.marker([37.9838, 23.7275]).addTo(mapCreate);

  // Add the geocoder control
  let geocoderCreate = L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on("markgeocode", function(e) {
      const center = e.geocode.center;
      markerCreate.setLatLng(center);
      mapCreate.setView(center, 15);
      markerCreate.bindPopup(e.geocode.name).openPopup();
      // Store in hidden fields
      createLat.value = center.lat;
      createLon.value = center.lng;
      createLocation.value = e.geocode.name;
    })
    .addTo(mapCreate);

  // EDIT EVENT MAP
  let mapEdit = L.map("mapEdit").setView([37.9838, 23.7275], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapEdit);

  let markerEdit = L.marker([37.9838, 23.7275]).addTo(mapEdit);

  let geocoderEdit = L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on("markgeocode", function(e) {
      const center = e.geocode.center;
      markerEdit.setLatLng(center);
      mapEdit.setView(center, 15);
      markerEdit.bindPopup(e.geocode.name).openPopup();
      // Store in hidden fields
      editLat.value = center.lat;
      editLon.value = center.lng;
      editLocation.value = e.geocode.name;
    })
    .addTo(mapEdit);
});
