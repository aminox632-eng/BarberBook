/* ==========================================================================
   BarberBook — Vanilla JS MVP Logic & localStorage Persistence
   Challenge 4 — Solicode · LAKHBAL ZOUBAIR
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    BOOKINGS: "barberbook_bookings_v1",
    PROFILE: "barberbook_profile_v1",
    REVIEWS: "barberbook_reviews_v1",
  };

  const TIME_SLOTS = [
    "09:30",
    "10:30",
    "11:30",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:30",
    "20:00",
  ];

  const BARBERSHOPS = [
    {
      id: "atelier-noir",
      name: "Atelier Noir Barber",
      district: "Centre-ville",
      address: "Boulevard Mohammed V, Tanger",
      hours: "09:30 – 21:00",
      rating: 4.9,
      nextSlot: "Aujourd'hui · 14:00",
      image: "images/salon-atelier-noir.jpg",
      description:
        "Salon contemporain dédié aux coupes précises, dégradés soignés et rituels de barbe dans une ambiance calme.",
      barbers: ["Amine K.", "Karim B.", "Mehdi R."],
      services: [
        { id: "coupe", name: "Coupe classique / dégradé", duration: "30 min", price: 60 },
        { id: "barbe", name: "Taille & contours de barbe", duration: "20 min", price: 40 },
        { id: "pack", name: "Pack Coupe + Barbe", duration: "45 min", price: 90 },
        { id: "soin", name: "Soin visage & serviette chaude", duration: "25 min", price: 70 },
      ],
      reviews: [
        { author: "Omar T.", rating: 5, text: "Ponctualité remarquable et coupe très propre. Zéro attente." },
        { author: "Hamza M.", rating: 5, text: "Accueil soigné et créneau respecté à la minute près." },
      ],
    },
    {
      id: "maison-cedre",
      name: "Maison Cèdre Grooming",
      district: "Malabata",
      address: "Avenue Mohammed VI, Tanger",
      hours: "10:00 – 21:30",
      rating: 4.8,
      nextSlot: "Aujourd'hui · 15:00",
      image: "images/salon-maison-cedre.jpg",
      description:
        "Espace chaleureux en bois de noyer offrant un accompagnement sur mesure pour la coiffure et l'entretien de la barbe.",
      barbers: ["Sami L.", "Nabil E."],
      services: [
        { id: "coupe", name: "Coupe tendance & coiffage", duration: "35 min", price: 75 },
        { id: "barbe", name: "Rasage traditionnel", duration: "25 min", price: 50 },
        { id: "pack", name: "Rituel Complet Cèdre", duration: "55 min", price: 115 },
        { id: "etudiant", name: "Tarif Étudiant (Coupe)", duration: "30 min", price: 55 },
      ],
      reviews: [
        { author: "Reda S.", rating: 5, text: "Le tarif étudiant est clair et la réservation en ligne est très pratique." },
        { author: "Anas B.", rating: 4, text: "Cadre apaisant et barbiers à l'écoute." },
      ],
    },
    {
      id: "studio-or",
      name: "Studio Or & Lame",
      district: "Iberia",
      address: "Rue de Belgique, Quartier Iberia, Tanger",
      hours: "09:30 – 20:30",
      rating: 4.9,
      nextSlot: "Aujourd'hui · 16:00",
      image: "images/salon-studio-or.jpg",
      description:
        "Studio minimaliste axé sur la précision des lignes, le soin capillaire et une gestion fluide sur rendez-vous.",
      barbers: ["Tarik H.", "Yassine D."],
      services: [
        { id: "coupe", name: "Coupe précision & finitions", duration: "30 min", price: 70 },
        { id: "barbe", name: "Sculpture de barbe", duration: "20 min", price: 45 },
        { id: "pack", name: "Signature Coupe + Barbe", duration: "50 min", price: 105 },
        { id: "soin", name: "Soin vapeur purifiant", duration: "25 min", price: 65 },
      ],
      reviews: [
        { author: "Bilal N.", rating: 5, text: "Finition impeccable et aucune perte de temps en salle d'attente." },
      ],
    },
  ];

  const DEFAULT_PROFILE = {
    name: "Youssef",
    age: 24,
    role: "Étudiant",
    phone: "06 12 34 56 78",
  };

  // Safe localStorage helpers
  function loadJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
  }

  // Application State
  const state = {
    currentView: "home",
    filterDistrict: "all",
    searchQuery: "",
    selectedShopId: BARBERSHOPS[0].id,
    booking: {
      shopId: BARBERSHOPS[0].id,
      barber: BARBERSHOPS[0].barbers[0],
      serviceId: BARBERSHOPS[0].services[0].id,
      date: getTodayISO(),
      time: "",
    },
    lastConfirmation: null,
    bookings: loadJSON(STORAGE_KEYS.BOOKINGS, []),
    profile: loadJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
    customReviews: loadJSON(STORAGE_KEYS.REVIEWS, {}),
  };

  function getTodayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getShopById(id) {
    return BARBERSHOPS.find((s) => s.id === id) || BARBERSHOPS[0];
  }

  function getShopReviews(shop) {
    const added = state.customReviews[shop.id] || [];
    return [...added, ...shop.reviews];
  }

  function getMinPrice(shop) {
    return Math.min(...shop.services.map((s) => s.price));
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let toastTimer = null;
  function showToast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function navigateTo(viewName) {
    state.currentView = viewName;
    document.querySelectorAll(".view").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });
    document.querySelectorAll(".nav-link").forEach((btn) => {
      const target = btn.getAttribute("data-nav");
      btn.classList.toggle("active", target === viewName || (viewName === "details" && target === "barbershops"));
    });
    const navLinks = document.getElementById("navLinks");
    const toggle = document.getElementById("menuToggle");
    if (navLinks) navLinks.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");

    if (viewName === "home") renderHomeFeatured();
    if (viewName === "barbershops") renderListing();
    if (viewName === "details") renderDetails();
    if (viewName === "booking") renderBookingForm();
    if (viewName === "confirmation") renderConfirmation();
    if (viewName === "profile") renderProfile();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openShopDetails(shopId) {
    state.selectedShopId = shopId;
    navigateTo("details");
  }

  function startBooking(shopId, serviceId, barberName) {
    const shop = getShopById(shopId || state.booking.shopId);
    state.booking.shopId = shop.id;
    state.booking.barber = barberName || shop.barbers[0];
    state.booking.serviceId = serviceId || shop.services[0].id;
    state.booking.date = state.booking.date || getTodayISO();
    state.booking.time = "";
    navigateTo("booking");
  }

  // ── Card Template ────────────────────────────────────────────────────────
  function buildShopCardHTML(shop) {
    return `
      <article class="shop-card">
        <div class="shop-img-wrap">
          <img src="${shop.image}" alt="${escapeHTML(shop.name)}" loading="lazy" />
          <span class="shop-rating">★ ${shop.rating.toFixed(1)}</span>
          <span class="shop-slot-tag">${escapeHTML(shop.nextSlot)}</span>
        </div>
        <div class="shop-body">
          <span class="shop-loc">${escapeHTML(shop.district)}</span>
          <h3>${escapeHTML(shop.name)}</h3>
          <p class="shop-desc">${escapeHTML(shop.description)}</p>
          <div class="shop-meta-row">
            <span>${shop.barbers.length} barbiers</span>
            <span class="shop-price">Dès ${getMinPrice(shop)} DH</span>
          </div>
          <div class="shop-actions">
            <button type="button" class="btn btn-outline btn-sm" data-action="details" data-shop="${shop.id}">Détails</button>
            <button type="button" class="btn btn-gold btn-sm" data-action="book" data-shop="${shop.id}">Réserver</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindShopCardActions(container) {
    container.querySelectorAll("[data-action='details']").forEach((btn) => {
      btn.addEventListener("click", () => openShopDetails(btn.getAttribute("data-shop")));
    });
    container.querySelectorAll("[data-action='book']").forEach((btn) => {
      btn.addEventListener("click", () => startBooking(btn.getAttribute("data-shop")));
    });
  }

  // ── Render: Home Featured ────────────────────────────────────────────────
  function renderHomeFeatured() {
    const grid = document.getElementById("homeFeaturedGrid");
    if (!grid) return;
    grid.innerHTML = BARBERSHOPS.map(buildShopCardHTML).join("");
    bindShopCardActions(grid);
  }

  // ── Render: Listing ──────────────────────────────────────────────────────
  function renderListing() {
    const grid = document.getElementById("listingGrid");
    const empty = document.getElementById("listingEmpty");
    if (!grid || !empty) return;

    const q = state.searchQuery.trim().toLowerCase();
    const filtered = BARBERSHOPS.filter((shop) => {
      const matchDistrict = state.filterDistrict === "all" || shop.district === state.filterDistrict;
      const matchQuery =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.district.toLowerCase().includes(q) ||
        shop.services.some((s) => s.name.toLowerCase().includes(q));
      return matchDistrict && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      grid.innerHTML = filtered.map(buildShopCardHTML).join("");
      bindShopCardActions(grid);
    }
  }

  // ── Render: Barber Details ───────────────────────────────────────────────
  function renderDetails() {
    const wrap = document.getElementById("detailContainer");
    if (!wrap) return;
    const shop = getShopById(state.selectedShopId);
    const reviews = getShopReviews(shop);

    wrap.innerHTML = `
      <div class="detail-hero">
        <img class="detail-img" src="${shop.image}" alt="${escapeHTML(shop.name)}" />
        <div class="detail-info">
          <span class="kicker">${escapeHTML(shop.district)}</span>
          <h1 id="detailName">${escapeHTML(shop.name)}</h1>
          <p class="page-sub">${escapeHTML(shop.description)}</p>
          <div class="detail-meta">
            <span>★ ${shop.rating.toFixed(1)} (${reviews.length} avis)</span>
            <span>${escapeHTML(shop.address)}</span>
            <span>Ouvert ${escapeHTML(shop.hours)}</span>
          </div>
          <div>
            <button type="button" class="btn btn-gold btn-lg" id="detailBookNowBtn">Réserver dans ce salon</button>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="card-panel">
          <span class="kicker">CARTE DES PRESTATIONS</span>
          <h2>Services &amp; tarifs</h2>
          <div class="service-list">
            ${shop.services
              .map(
                (srv) => `
              <div class="service-row">
                <div>
                  <h4>${escapeHTML(srv.name)}</h4>
                  <small>Durée estimée : ${escapeHTML(srv.duration)}</small>
                </div>
                <div class="service-right">
                  <span class="price-tag">${srv.price} DH</span>
                  <button type="button" class="btn btn-outline btn-sm" data-pick-service="${srv.id}">Choisir</button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="card-panel">
          <span class="kicker">ÉQUIPE &amp; RETOURS</span>
          <h2>Nos barbiers</h2>
          <div class="barbers-chips">
            ${shop.barbers
              .map(
                (b) => `
              <button type="button" class="barber-chip" data-pick-barber="${escapeHTML(b)}">
                <span class="barber-dot">${escapeHTML(b.charAt(0))}</span>
                <span>${escapeHTML(b)}</span>
              </button>
            `
              )
              .join("")}
          </div>

          <h3>Avis clients (${reviews.length})</h3>
          <div class="reviews-list">
            ${reviews
              .map(
                (rev) => `
              <div class="review-item">
                <div class="review-top">
                  <strong>${escapeHTML(rev.author)}</strong>
                  <span class="review-stars">${"★".repeat(rev.rating)}</span>
                </div>
                <p>${escapeHTML(rev.text)}</p>
              </div>
            `
              )
              .join("")}
          </div>

          <form class="review-form" id="addReviewForm">
            <label class="sub-label" for="reviewText">Laisser un avis en tant que ${escapeHTML(state.profile.name)}</label>
            <textarea id="reviewText" class="form-control" rows="2" placeholder="Partagez votre expérience..." required></textarea>
            <div style="display:flex; gap:0.6rem; align-items:center;">
              <select id="reviewRating" class="form-control" style="max-width:120px;">
                <option value="5">5 ★</option>
                <option value="4">4 ★</option>
                <option value="3">3 ★</option>
              </select>
              <button type="submit" class="btn btn-outline btn-sm">Publier l'avis</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("detailBookNowBtn").addEventListener("click", () => {
      startBooking(shop.id);
    });
    wrap.querySelectorAll("[data-pick-service]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startBooking(shop.id, btn.getAttribute("data-pick-service"));
      });
    });
    wrap.querySelectorAll("[data-pick-barber]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startBooking(shop.id, shop.services[0].id, btn.getAttribute("data-pick-barber"));
      });
    });
    document.getElementById("addReviewForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const textEl = document.getElementById("reviewText");
      const ratingEl = document.getElementById("reviewRating");
      const text = textEl.value.trim();
      if (!text) return;
      const list = state.customReviews[shop.id] || [];
      list.unshift({
        author: state.profile.name || "Youssef",
        rating: Number(ratingEl.value) || 5,
        text,
      });
      state.customReviews[shop.id] = list;
      saveJSON(STORAGE_KEYS.REVIEWS, state.customReviews);
      showToast("Merci ! Votre avis a été publié.");
      renderDetails();
    });
  }

  // ── Render: Booking Form ─────────────────────────────────────────────────
  function renderBookingForm() {
    const shopSelect = document.getElementById("bookShop");
    const barberSelect = document.getElementById("bookBarber");
    const dateInput = document.getElementById("bookDate");
    const nameInput = document.getElementById("clientName");
    const phoneInput = document.getElementById("clientPhone");
    const errBox = document.getElementById("bookingError");

    if (errBox) errBox.classList.add("hidden");

    shopSelect.innerHTML = BARBERSHOPS.map(
      (s) => `<option value="${s.id}" ${s.id === state.booking.shopId ? "selected" : ""}>${escapeHTML(s.name)} — ${escapeHTML(s.district)}</option>`
    ).join("");

    const shop = getShopById(state.booking.shopId);
    if (!shop.barbers.includes(state.booking.barber)) {
      state.booking.barber = shop.barbers[0];
    }
    if (!shop.services.some((s) => s.id === state.booking.serviceId)) {
      state.booking.serviceId = shop.services[0].id;
    }

    barberSelect.innerHTML = shop.barbers
      .map((b) => `<option value="${escapeHTML(b)}" ${b === state.booking.barber ? "selected" : ""}>${escapeHTML(b)}</option>`)
      .join("");

    dateInput.min = getTodayISO();
    dateInput.value = state.booking.date || getTodayISO();

    if (!nameInput.value) nameInput.value = state.profile.name;
    if (!phoneInput.value) phoneInput.value = state.profile.phone;

    renderBookingServices(shop);
    renderBookingSlots(shop);
    renderSummary();
  }

  function renderBookingServices(shop) {
    const grid = document.getElementById("bookServicesGrid");
    grid.innerHTML = shop.services
      .map(
        (srv) => `
      <button type="button" class="service-opt ${srv.id === state.booking.serviceId ? "selected" : ""}" data-srv="${srv.id}">
        <strong>${escapeHTML(srv.name)}</strong>
        <span>${srv.price} DH · ${escapeHTML(srv.duration)}</span>
      </button>
    `
      )
      .join("");

    grid.querySelectorAll("[data-srv]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.booking.serviceId = btn.getAttribute("data-srv");
        renderBookingServices(shop);
        renderSummary();
      });
    });
  }

  function renderBookingSlots(shop) {
    const grid = document.getElementById("bookSlotsGrid");
    const taken = new Set(
      state.bookings
        .filter((b) => b.shopId === shop.id && b.date === state.booking.date && b.barber === state.booking.barber)
        .map((b) => b.time)
    );

    if (state.booking.time && taken.has(state.booking.time)) {
      state.booking.time = "";
    }

    grid.innerHTML = TIME_SLOTS.map((slot) => {
      const isTaken = taken.has(slot);
      const isSelected = state.booking.time === slot;
      return `
        <button type="button" class="slot-btn ${isSelected ? "selected" : ""}" data-slot="${slot}" ${isTaken ? "disabled" : ""}>
          ${slot}
        </button>
      `;
    }).join("");

    grid.querySelectorAll("[data-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.booking.time = btn.getAttribute("data-slot");
        renderBookingSlots(shop);
        renderSummary();
      });
    });
  }

  function renderSummary() {
    const box = document.getElementById("summaryContent");
    if (!box) return;
    const shop = getShopById(state.booking.shopId);
    const service = shop.services.find((s) => s.id === state.booking.serviceId) || shop.services[0];

    box.innerHTML = `
      <div class="summary-row"><span>Salon</span><strong>${escapeHTML(shop.name)}</strong></div>
      <div class="summary-row"><span>Barbier</span><strong>${escapeHTML(state.booking.barber)}</strong></div>
      <div class="summary-row"><span>Prestation</span><strong>${escapeHTML(service.name)}</strong></div>
      <div class="summary-row"><span>Date</span><strong>${escapeHTML(state.booking.date || "—")}</strong></div>
      <div class="summary-row"><span>Heure</span><strong>${escapeHTML(state.booking.time || "À choisir")}</strong></div>
      <div class="summary-row summary-total"><span>Total à régler sur place</span><strong>${service.price} DH</strong></div>
    `;
  }

  function handleBookingSubmit(e) {
    e.preventDefault();
    const errBox = document.getElementById("bookingError");
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const date = document.getElementById("bookDate").value;

    const errors = [];
    if (!date) errors.push("Veuillez choisir une date.");
    if (!state.booking.time) errors.push("Veuillez sélectionner un créneau horaire disponible.");
    if (name.length < 2) errors.push("Veuillez saisir votre nom complet.");
    if (phone.replace(/\s+/g, "").length < 8) errors.push("Veuillez saisir un numéro de téléphone valide.");

    if (errors.length > 0) {
      errBox.textContent = errors.join(" ");
      errBox.classList.remove("hidden");
      return;
    }

    errBox.classList.add("hidden");
    const shop = getShopById(state.booking.shopId);
    const service = shop.services.find((s) => s.id === state.booking.serviceId) || shop.services[0];
    const refCode = "BB-" + String(Math.floor(1000 + Math.random() * 9000));

    const record = {
      id: refCode,
      shopId: shop.id,
      shopName: shop.name,
      address: shop.address,
      barber: state.booking.barber,
      serviceName: service.name,
      duration: service.duration,
      price: service.price,
      date,
      time: state.booking.time,
      clientName: name,
      clientPhone: phone,
      createdAt: new Date().toISOString(),
    };

    state.bookings.unshift(record);
    saveJSON(STORAGE_KEYS.BOOKINGS, state.bookings);
    state.lastConfirmation = record;
    state.booking.time = "";
    updateHistoryBadge();
    showToast("Rendez-vous confirmé et enregistré !");
    navigateTo("confirmation");
  }

  // ── Render: Confirmation ─────────────────────────────────────────────────
  function renderConfirmation() {
    const box = document.getElementById("confirmationContent");
    if (!box) return;
    const rec = state.lastConfirmation || state.bookings[0];

    if (!rec) {
      box.innerHTML = `
        <h1 id="confirmTitle">Aucune réservation récente</h1>
        <p class="page-sub" style="margin:0.8rem auto 1.5rem;">Commencez par choisir un salon et un créneau disponible.</p>
        <button type="button" class="btn btn-gold" id="confirmGoBookBtn">Prendre un rendez-vous</button>
      `;
      document.getElementById("confirmGoBookBtn").addEventListener("click", () => navigateTo("booking"));
      return;
    }

    box.innerHTML = `
      <div class="confirm-icon" aria-hidden="true">✓</div>
      <span class="kicker">RÉSERVATION VALIDÉE</span>
      <h1 id="confirmTitle">Votre créneau est réservé !</h1>
      <span class="confirm-ref">RÉFÉRENCE · ${escapeHTML(rec.id)}</span>
      <div class="confirm-details">
        <div class="summary-row"><span>Client</span><strong>${escapeHTML(rec.clientName)} (${escapeHTML(rec.clientPhone)})</strong></div>
        <div class="summary-row"><span>Salon</span><strong>${escapeHTML(rec.shopName)}</strong></div>
        <div class="summary-row"><span>Adresse</span><strong>${escapeHTML(rec.address)}</strong></div>
        <div class="summary-row"><span>Barbier</span><strong>${escapeHTML(rec.barber)}</strong></div>
        <div class="summary-row"><span>Prestation</span><strong>${escapeHTML(rec.serviceName)} (${escapeHTML(rec.duration)})</strong></div>
        <div class="summary-row"><span>Date &amp; heure</span><strong>${escapeHTML(rec.date)} à ${escapeHTML(rec.time)}</strong></div>
        <div class="summary-row summary-total"><span>Tarif</span><strong>${rec.price} DH</strong></div>
      </div>
      <div class="confirm-actions">
        <button type="button" class="btn btn-gold" id="confirmHistoryBtn">Voir mes réservations</button>
        <button type="button" class="btn btn-outline" id="confirmHomeBtn">Retour à l'accueil</button>
      </div>
    `;

    document.getElementById("confirmHistoryBtn").addEventListener("click", () => navigateTo("profile"));
    document.getElementById("confirmHomeBtn").addEventListener("click", () => navigateTo("home"));
  }

  // ── Render: Profile & History ────────────────────────────────────────────
  function renderProfile() {
    document.getElementById("profileAvatar").textContent = (state.profile.name || "Y").charAt(0).toUpperCase();
    document.getElementById("profileDisplayName").textContent = state.profile.name;
    document.getElementById("profileMeta").textContent = `${state.profile.age} ans · ${state.profile.role}`;

    document.getElementById("profName").value = state.profile.name;
    document.getElementById("profAge").value = state.profile.age;
    document.getElementById("profRole").value = state.profile.role;
    document.getElementById("profPhone").value = state.profile.phone;

    const list = document.getElementById("historyList");
    if (state.bookings.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>Aucune réservation enregistrée</h3>
          <p>Vos rendez-vous réservés sur BarberBook apparaîtront ici automatiquement.</p>
          <button type="button" class="btn btn-gold btn-sm" id="emptyBookBtn">Réserver mon premier créneau</button>
        </div>
      `;
      document.getElementById("emptyBookBtn").addEventListener("click", () => navigateTo("booking"));
      return;
    }

    list.innerHTML = state.bookings
      .map(
        (b) => `
      <article class="history-item">
        <div>
          <span class="status-pill">Confirmé · ${escapeHTML(b.id)}</span>
          <h4>${escapeHTML(b.shopName)} — ${escapeHTML(b.serviceName)}</h4>
          <p>${escapeHTML(b.date)} à ${escapeHTML(b.time)} · Barbier : ${escapeHTML(b.barber)} · <strong>${b.price} DH</strong></p>
        </div>
        <button type="button" class="btn-danger-ghost" data-cancel-id="${escapeHTML(b.id)}">Annuler</button>
      </article>
    `
      )
      .join("");

    list.querySelectorAll("[data-cancel-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-cancel-id");
        state.bookings = state.bookings.filter((item) => item.id !== id);
        saveJSON(STORAGE_KEYS.BOOKINGS, state.bookings);
        updateHistoryBadge();
        showToast("Réservation annulée.");
        renderProfile();
      });
    });
  }

  function updateHistoryBadge() {
    const badge = document.getElementById("historyCountBadge");
    if (badge) badge.textContent = String(state.bookings.length);
  }

  // ── Init & Global Event Wiring ───────────────────────────────────────────
  function init() {
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(el.getAttribute("data-nav"));
      });
    });

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    document.getElementById("navQuickBookBtn").addEventListener("click", () => startBooking());
    document.getElementById("heroBookBtn").addEventListener("click", () => startBooking());
    document.getElementById("heroExploreBtn").addEventListener("click", () => navigateTo("barbershops"));
    document.getElementById("homeSeeAllBtn").addEventListener("click", () => navigateTo("barbershops"));
    document.getElementById("detailBackBtn").addEventListener("click", () => navigateTo("barbershops"));
    document.getElementById("profileNewBookBtn").addEventListener("click", () => startBooking());

    // Search & Filters
    document.getElementById("searchInput").addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderListing();
    });
    document.querySelectorAll("#filterPills .pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll("#filterPills .pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.filterDistrict = pill.getAttribute("data-filter");
        renderListing();
      });
    });
    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      state.searchQuery = "";
      state.filterDistrict = "all";
      document.getElementById("searchInput").value = "";
      document.querySelectorAll("#filterPills .pill").forEach((p) => {
        p.classList.toggle("active", p.getAttribute("data-filter") === "all");
      });
      renderListing();
    });

    // Booking dynamic selects
    document.getElementById("bookShop").addEventListener("change", (e) => {
      state.booking.shopId = e.target.value;
      state.booking.time = "";
      renderBookingForm();
    });
    document.getElementById("bookBarber").addEventListener("change", (e) => {
      state.booking.barber = e.target.value;
      state.booking.time = "";
      renderBookingSlots(getShopById(state.booking.shopId));
      renderSummary();
    });
    document.getElementById("bookDate").addEventListener("change", (e) => {
      state.booking.date = e.target.value;
      state.booking.time = "";
      renderBookingSlots(getShopById(state.booking.shopId));
      renderSummary();
    });
    document.getElementById("bookingForm").addEventListener("submit", handleBookingSubmit);

    // Profile save
    document.getElementById("profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("profName").value.trim() || "Youssef";
      const age = Number(document.getElementById("profAge").value) || 24;
      const role = document.getElementById("profRole").value.trim() || "Étudiant";
      const phone = document.getElementById("profPhone").value.trim() || "06 12 34 56 78";
      state.profile = { name, age, role, phone };
      saveJSON(STORAGE_KEYS.PROFILE, state.profile);
      document.getElementById("clientName").value = name;
      document.getElementById("clientPhone").value = phone;
      renderProfile();
      showToast("Profil mis à jour.");
    });

    updateHistoryBadge();
    renderHomeFeatured();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
