document.addEventListener("DOMContentLoaded", () => {
  // Basic element references
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

  // Filter elements
  const categoryFilter = document.getElementById("categoryFilter");
  let selectedCategory = "";
  const cityFilterSelect = document.getElementById("cityFilterSelect");
  let selectedCity = "";
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  let searchQuery = "";

  // Create Event modal references
  const openCreateModalBtn = document.getElementById("openCreateModalBtn");
  const createModal = document.getElementById("createModal");
  const createClose = document.getElementById("createClose");
  const createEventForm = document.getElementById("createEventForm");
  const createLat = document.getElementById("createLat");
  const createLon = document.getElementById("createLon");
  const createLocation = document.getElementById("createLocation");
  const createCategory = document.getElementById("category");

  // "My Events" button
  const myEventsBtn = document.getElementById("myEventsBtn");

  // Review Reports button (admin only)
  const reviewReportsBtn = document.getElementById("reviewReportsBtn");

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
  const editCategory = document.getElementById("editCategory");

  let selectedDate = null;
  let currentUser = localStorage.getItem("currentUser") || null;
  let currentUserRole = localStorage.getItem("currentUserRole") || null;

  // Set default date for the date picker
  if (viewDateInput) {
    viewDateInput.value = new Date().toISOString().split("T")[0];
  }
  if (viewDateBtn) {
    viewDateBtn.addEventListener("click", () => {
      selectedDate = viewDateInput.value;
      fetchEvents();
    });
  }

  // Listen for changes on the category dropdown
  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      selectedCategory = categoryFilter.value;
      fetchEvents();
    });
  }

  // Listen for changes on the city dropdown
  if (cityFilterSelect) {
    cityFilterSelect.addEventListener("change", () => {
      selectedCity = cityFilterSelect.value;
      fetchEvents();
    });
  }

  // Listen for search input
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      searchQuery = searchInput.value.trim();
      fetchEvents();
    });
  }
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim();
        fetchEvents();
      }
    });
  }

  // "My Events" button action
  if (myEventsBtn) {
    myEventsBtn.addEventListener("click", () => {
      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = "my_events.html";
      }, 300);
    });
  }

  // "Review Reports" button action (admin)
  if (reviewReportsBtn) {
    reviewReportsBtn.addEventListener("click", () => {
      window.location.href = "review_reports.html";
    });
  }

  // Create Event modal open/close
  if (openCreateModalBtn) {
    openCreateModalBtn.addEventListener("click", () => {
      createModal.style.display = "block";
      setTimeout(() => {
        mapCreate.invalidateSize();
      }, 300);
    });
  }
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
  if (editClose) {
    editClose.addEventListener("click", () => {
      editModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });

  // Auth modal button actions
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

  // Login form submission
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

  // Signup form submission with password confirmation check
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = signupForm.querySelector('input[name="password"]').value;
    const confirmPassword = signupForm.querySelector('input[name="confirm_password"]').value;
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
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

  // Create Event form submission
  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to create an event.");
      return;
    }
    const formData = new FormData(createEventForm);
    formData.append("username", currentUser);
    formData.append("category", createCategory.value);
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
      document.getElementById("createCity").value = "";
      createModal.style.display = "none";
      fetchEvents();
    } else {
      alert(result.message);
    }
  });

  // Edit Event form submission
  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editEventForm);
    formData.append("action", "edit");
    formData.append("username", currentUser);
    formData.append("category", editCategory.value);
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

  // Reverse geocoding using Nominatim
  function getCityFromCoordinates(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    return fetch(url, { headers: { 'User-Agent': 'EventoramaApp/1.0' } })
      .then(response => response.json())
      .then(data => {
        return data.address.city || data.address.town || data.address.village || '';
      })
      .catch(err => {
        console.error("Reverse geocoding error:", err);
        return '';
      });
  }

  // Show the modal (login or signup)
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

  // Update UI based on login state and role, then fetch events
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
    // Show Review Reports button only for admin users
    if (currentUser && currentUserRole === "admin") {
      reviewReportsBtn.style.display = "inline-block";
    } else {
      reviewReportsBtn.style.display = "none";
    }
    fetchEvents();
  }

  async function fetchEvents() {
    const response = await fetch("../backend/api.php?endpoint=events&action=get");
    const result = await response.json();
    if (result.success && result.events) {
      // Populate city dropdown with unique city names
      populateCityDropdown(result.events);
      let filteredEvents = result.events;
      // Filter by date if selected
      if (selectedDate) {
        filteredEvents = filteredEvents.filter(ev => ev.date === selectedDate);
      }
      // Filter by category
      if (selectedCategory !== "") {
        filteredEvents = filteredEvents.filter(ev => ev.category === selectedCategory);
      }
      // Filter by city
      if (selectedCity !== "") {
        filteredEvents = filteredEvents.filter(ev =>
          ev.city && ev.city.toLowerCase() === selectedCity.toLowerCase()
        );
      }
      // Search filter
      if (searchQuery !== "") {
        filteredEvents = filteredEvents.filter(ev =>
          ev.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ev.category && ev.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      if (filteredEvents.length === 0) {
        document.getElementById("calendar").innerHTML = "<p>No events</p>";
      } else {
        if (!selectedDate) {
          // Upcoming events: filter events after current time
          const now = new Date();
          filteredEvents = filteredEvents.filter(ev => new Date(ev.date + "T" + ev.time) > now);
          filteredEvents.sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time));
          displayUpcomingEvents(filteredEvents);
        } else {
          filteredEvents.sort((a, b) => new Date("1970-01-01T" + a.time) - new Date("1970-01-01T" + b.time));
          displayEvents(filteredEvents);
        }
      }
    } else {
      document.getElementById("calendar").innerHTML = "<p>No events</p>";
    }
  }

  // Populate the city dropdown with distinct city names from events
  function populateCityDropdown(allEvents) {
    const citySet = new Set();
    allEvents.forEach(ev => {
      if (ev.city && ev.city.trim() !== "") {
        citySet.add(ev.city.trim());
      }
    });
    cityFilterSelect.innerHTML = `<option value="">All Cities</option>`;
    citySet.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      cityFilterSelect.appendChild(option);
    });
  }

  // Display upcoming events grouped by date
  function displayUpcomingEvents(events) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "<h3>Upcoming Events</h3>";
    const eventsByDate = {};
    events.forEach(ev => {
      if (!eventsByDate[ev.date]) {
        eventsByDate[ev.date] = [];
      }
      eventsByDate[ev.date].push(ev);
    });
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));
    sortedDates.forEach(date => {
      const dateSection = document.createElement("div");
      dateSection.className = "date-section";
      const dateHeader = document.createElement("h4");
      dateHeader.className = "date-header";
      dateHeader.innerText = date;
      dateSection.appendChild(dateHeader);
      eventsByDate[date].forEach(ev => {
        const eventDiv = createEventElement(ev);
        dateSection.appendChild(eventDiv);
      });
      calendarDiv.appendChild(dateSection);
    });
    attachEventListeners();
  }

  // Display events for a specific date, grouped by hour
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

  // Create an event card element
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
    eventDiv.setAttribute("data-category", ev.category || "");
    eventDiv.setAttribute("data-city", ev.city || "");

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

    const categoryLabel = (ev.category && ev.category.trim() !== "") ? ev.category : "N/A";
    const cityLabel = (ev.city && ev.city.trim() !== "") ? ev.city : "N/A";

    eventDiv.innerHTML = `
      <div class="event-content">
        <p><strong>${ev.eventName}</strong> (${ev.time})</p>
        <p><em>Category: ${categoryLabel}</em></p>
        <p><em>City: ${cityLabel}</em></p>
        ${countsHTML}
        ${voteButtonsHTML}
        ${adminButtonsHTML}
        ${detailsLink}
      </div>
      ${hiddenDetails}
    `;

    // Hover expansion
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
              formData.append("action", "delete");
              formData.append("eventId", eventId);
              formData.append("username", currentUser);
              formData.append("role", currentUserRole);
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
            editCategory.value = eventDiv.getAttribute("data-category") || "";
            if (document.getElementById("editPoster")) {
              document.getElementById("editPoster").value = "";
            }
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
      getCityFromCoordinates(center.lat, center.lng).then(city => {
        document.getElementById("createCity").value = city;
      });
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
        getCityFromCoordinates(center.lat, center.lng).then(city => {
          document.getElementById("editCity").value = city;
        });
      })
      .addTo(mapEdit);
  }

  updateUI();
});