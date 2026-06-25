const STORAGE_KEY = "dkverse-v2-state";

const terms = [
  ["User Responsibility", "Each user is responsible for all account data, card information, photos, values, listings, bids, negotiations, payment, delivery and physical exchange."],
  ["No Financial Intermediation", "DKVerse is not a bank, broker, escrow service, payment processor, custodian, insurer, carrier or guarantor of any transaction."],
  ["Card Data", "Estimated values, condition, grading, authenticity and availability are provided by users. DKVerse does not certify or guarantee card information."],
  ["DKmarket", "DKmarket is an information and negotiation environment. Buyers and sellers must verify each other and agree on payment and delivery outside the platform."],
  ["Physical Exchange", "Shipping, meetings, hand delivery, customs, taxes, damage, loss and disputes are the sole responsibility of the users involved."],
  ["Legal Use", "Users must comply with applicable laws, tax rules, consumer rules, privacy laws and internet regulations in their country or region."],
  ["Content Rights", "By uploading images or text, users confirm they have the right to use that content inside DKVerse."],
  ["Future DKarena", "DKarena is reserved for future rules, matches, rankings and tournaments. Features may change before public gameplay."],
  ["Privacy", "This first version stores data locally in the browser. Firebase can later be connected for authentication, shared data and storage."],
  ["Changes", "Terms may be updated to improve safety, compliance and clarity before public launch."]
];

const seedListings = [
  {
    id: "seed-001",
    owner: "DKLegend",
    name: "Drakonis Mythic #001",
    category: "Pokémon",
    collection: "Drakonis Legacy",
    condition: "Graded",
    value: 4250,
    ask: 4250,
    notes: "Featured sample listing for visual testing.",
    seed: true
  },
  {
    id: "seed-002",
    owner: "NeoCollector",
    name: "Vyrael Legendary #023",
    category: "Magic",
    collection: "Celestial Order",
    condition: "Raw - Near Mint",
    value: 3800,
    ask: 3800,
    notes: "Premium sample listing.",
    seed: true
  },
  {
    id: "seed-003",
    owner: "ArenaVault",
    name: "Korvan Rare #289",
    category: "Yu-Gi-Oh!",
    collection: "Voidwalkers",
    condition: "Raw - Excellent",
    value: 620,
    ask: 620,
    notes: "Sample market depth card.",
    seed: true
  }
];

let state = loadState();

function defaultState() {
  return {
    account: null,
    cards: [],
    watchlist: [
      { id: "watch-1", name: "Charizard Base Set", target: 1200, category: "Pokémon" },
      { id: "watch-2", name: "Blue-Eyes White Dragon", target: 900, category: "Yu-Gi-Oh!" }
    ],
    offers: []
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name) {
  return String(name || "DK")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DK";
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function navigate(route) {
  const nextRoute = route || "home";
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#view-${nextRoute}`)?.classList.add("active");
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === nextRoute);
  });
  document.querySelector(".nav-links")?.classList.remove("open");
  location.hash = nextRoute;
  renderAll();
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
  document.querySelector("#menuToggle").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });
  document.querySelector("#accountForm").addEventListener("submit", saveAccount);
  document.querySelector("#cardForm").addEventListener("submit", saveCard);
  document.querySelector("#marketSearch").addEventListener("input", renderMarket);
  document.querySelector("#deskSearch").addEventListener("input", (event) => {
    document.querySelector("#marketSearch").value = event.target.value;
    renderMarket();
  });
  document.querySelector("#marketCategory").addEventListener("change", renderMarket);
  document.querySelector("#marketMax").addEventListener("input", renderMarket);
  document.querySelector("#marketSort").addEventListener("change", renderMarket);
  document.querySelector("#clearMarketFilters").addEventListener("click", clearMarketFilters);
  document.querySelector("#createWishlist").addEventListener("click", addWatchlistItem);
  document.querySelector("#closeModal").addEventListener("click", closeModal);
  document.querySelector("#modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") closeModal();
  });
  document.querySelector("#searchToggle").addEventListener("click", () => {
    navigate("market");
    setTimeout(() => document.querySelector("#deskSearch")?.focus(), 80);
  });
}

function saveAccount(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.account = {
    fullName: data.get("fullName"),
    email: data.get("email"),
    handle: data.get("handle"),
    country: data.get("country"),
    profileType: data.get("profileType"),
    acceptedTerms: Boolean(data.get("acceptedTerms")),
    createdAt: new Date().toISOString()
  };
  saveState();
  renderAll();
  showToast("Account saved. DKvault is ready.");
  navigate("vault");
}

function saveCard(event) {
  event.preventDefault();
  if (!state.account) {
    showToast("Open your DKVerse account first.");
    navigate("account");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("image");
  const card = {
    id: uid("card"),
    owner: state.account.handle,
    name: data.get("name"),
    category: data.get("category"),
    collection: data.get("collection"),
    number: data.get("number"),
    condition: data.get("condition"),
    value: Number(data.get("value") || 0),
    ask: Number(data.get("ask") || 0),
    forSale: Boolean(data.get("forSale")),
    notes: data.get("notes"),
    createdAt: new Date().toISOString(),
    image: ""
  };

  const finish = () => {
    state.cards.unshift(card);
    saveState();
    form.reset();
    renderAll();
    showToast(card.forSale ? "Card saved and listed on DKmarket." : "Card saved to DKvault.");
  };

  if (file && file.size) {
    const reader = new FileReader();
    reader.onload = () => {
      card.image = reader.result;
      finish();
    };
    reader.readAsDataURL(file);
  } else {
    finish();
  }
}

function ownListings() {
  return state.cards.filter((card) => card.forSale || card.ask > 0);
}

function allListings() {
  return [...ownListings(), ...seedListings];
}

function clearMarketFilters() {
  document.querySelector("#marketSearch").value = "";
  document.querySelector("#deskSearch").value = "";
  document.querySelector("#marketCategory").value = "All";
  document.querySelector("#marketMax").value = "";
  renderMarket();
}

function addWatchlistItem() {
  const name = prompt("Card name for your watchlist:");
  if (!name) return;
  const target = Number(prompt("Target price in USD:", "500") || 0);
  const category = prompt("Category:", "Pokémon") || "Other";
  state.watchlist.unshift({ id: uid("watch"), name, target, category });
  saveState();
  renderAll();
  showToast("Watchlist item added.");
}

function makeBid(listingId) {
  const listing = allListings().find((item) => item.id === listingId);
  if (!listing) return;
  if (!state.account) {
    showToast("Open your DKVerse account before bidding.");
    navigate("account");
    return;
  }
  const amount = Number(prompt(`Bid for ${listing.name}:`, String(Math.max(1, Math.round((listing.ask || listing.value || 100) * .92)))) || 0);
  if (!amount) return;
  state.offers.unshift({
    id: uid("offer"),
    listingId,
    cardName: listing.name,
    buyer: state.account.handle,
    seller: listing.owner,
    amount,
    status: "Open negotiation",
    createdAt: new Date().toISOString()
  });
  saveState();
  renderAll();
  showToast("Bid registered locally. Use your preferred contact channel to negotiate.");
}

function openListing(listingId) {
  const listing = allListings().find((item) => item.id === listingId);
  if (!listing) return;
  openModal(`
    <span class="eyebrow">Listing Details</span>
    <h2>${escapeHtml(listing.name)}</h2>
    <p>${escapeHtml(listing.notes || "No notes provided.")}</p>
    <div class="row"><span>Owner</span><strong>${escapeHtml(listing.owner)}</strong></div>
    <div class="row"><span>Category</span><strong>${escapeHtml(listing.category)}</strong></div>
    <div class="row"><span>Collection</span><strong>${escapeHtml(listing.collection || "Not informed")}</strong></div>
    <div class="row"><span>Condition</span><strong>${escapeHtml(listing.condition)}</strong></div>
    <div class="row"><span>Ask</span><strong>${money(listing.ask || listing.value)}</strong></div>
    <p class="small-copy">DKVerse does not process payment or delivery. Both parties are responsible for verification, payment and physical exchange.</p>
    <button class="primary-button" onclick="window.dkverseBid('${listing.id}')">Place Bid</button>
  `);
}

function deleteCard(cardId) {
  if (!confirm("Delete this card from DKvault?")) return;
  state.cards = state.cards.filter((card) => card.id !== cardId);
  saveState();
  renderAll();
  showToast("Card removed.");
}

function toggleSale(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) return;
  card.forSale = !card.forSale;
  if (card.forSale && !card.ask) card.ask = card.value;
  saveState();
  renderAll();
}

function renderAll() {
  renderAccount();
  renderVault();
  renderMarket();
  renderTerms();
}

function renderAccount() {
  const target = document.querySelector("#accountSummary");
  const account = state.account;
  if (!account) {
    target.innerHTML = `
      <div class="account-summary">
        <div class="avatar-badge">DK</div>
        <h2>No account yet</h2>
        <p>Open your account to unlock DKvault and your local trading desk.</p>
      </div>
    `;
    return;
  }
  const total = state.cards.reduce((sum, card) => sum + Number(card.value || 0), 0);
  target.innerHTML = `
    <div class="account-summary">
      <div class="avatar-badge">${escapeHtml(initials(account.handle || account.fullName))}</div>
      <h2>${escapeHtml(account.handle)}</h2>
      <p>${escapeHtml(account.fullName)} · ${escapeHtml(account.profileType)} · ${escapeHtml(account.country || "Global")}</p>
      <div class="row"><span>Email</span><strong>${escapeHtml(account.email)}</strong></div>
      <div class="row"><span>Cards</span><strong>${state.cards.length}</strong></div>
      <div class="row"><span>Portfolio</span><strong>${money(total)}</strong></div>
      <span class="tag">Terms accepted</span>
    </div>
  `;
}

function renderVault() {
  const target = document.querySelector("#vaultCards");
  const value = state.cards.reduce((sum, card) => sum + Number(card.value || 0), 0);
  document.querySelector("#portfolioValue").textContent = money(value);
  if (!state.cards.length) {
    target.innerHTML = `
      <div class="panel">
        <span class="eyebrow">Empty DKvault</span>
        <h2>Add your first card</h2>
        <p>Your card wallet will show images, value, market status and quick actions here.</p>
      </div>
    `;
    return;
  }
  target.innerHTML = state.cards.map((card) => cardTemplate(card, true)).join("");
  target.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteCard(button.dataset.delete));
  });
  target.querySelectorAll("[data-toggle-sale]").forEach((button) => {
    button.addEventListener("click", () => toggleSale(button.dataset.toggleSale));
  });
}

function cardTemplate(card, vault = false) {
  const image = card.image ? `<img src="${card.image}" alt="" />` : "";
  return `
    <article class="${vault ? "wallet-card" : "listing-card"}">
      <div class="card-art">
        ${image}
        <div class="card-art-content">
          <span class="tag">${escapeHtml(card.category)}</span>
          <h3>${escapeHtml(card.name)}</h3>
        </div>
      </div>
      <div class="card-body">
        <div class="row"><span>Collection</span><strong>${escapeHtml(card.collection || "Not informed")}</strong></div>
        <div class="row"><span>Condition</span><strong>${escapeHtml(card.condition || "Not informed")}</strong></div>
        <div class="row"><span>Value</span><strong>${money(card.value)}</strong></div>
        <div class="row"><span>Ask</span><strong>${card.ask ? money(card.ask) : "Not listed"}</strong></div>
        ${vault ? `
          <button class="ghost-button" data-toggle-sale="${card.id}" type="button">${card.forSale ? "Remove from Market" : "List on DKmarket"}</button>
          <button class="ghost-button" data-delete="${card.id}" type="button">Delete</button>
        ` : `
          <button class="primary-button" data-bid="${card.id}" type="button">Place Bid</button>
          <button class="ghost-button" data-open-listing="${card.id}" type="button">Details</button>
        `}
      </div>
    </article>
  `;
}

function renderMarket() {
  const search = document.querySelector("#marketSearch")?.value.toLowerCase() || "";
  const category = document.querySelector("#marketCategory")?.value || "All";
  const max = Number(document.querySelector("#marketMax")?.value || 0);
  const sort = document.querySelector("#marketSort")?.value || "newest";
  let listings = allListings().filter((listing) => {
    const haystack = `${listing.name} ${listing.collection} ${listing.owner} ${listing.category}`.toLowerCase();
    const matchSearch = !search || haystack.includes(search);
    const matchCategory = category === "All" || listing.category === category;
    const price = Number(listing.ask || listing.value || 0);
    const matchMax = !max || price <= max;
    return matchSearch && matchCategory && matchMax;
  });
  if (sort === "priceAsc") listings.sort((a, b) => Number(a.ask || a.value) - Number(b.ask || b.value));
  if (sort === "priceDesc") listings.sort((a, b) => Number(b.ask || b.value) - Number(a.ask || a.value));

  document.querySelector("#listingCount").textContent = `${listings.length} items`;
  const target = document.querySelector("#marketListings");
  target.innerHTML = listings.length
    ? listings.map((listing) => cardTemplate(listing, false)).join("")
    : `<div class="panel"><h2>No listings found</h2><p>Change filters or publish a card from DKvault.</p></div>`;

  target.querySelectorAll("[data-bid]").forEach((button) => {
    button.addEventListener("click", () => makeBid(button.dataset.bid));
  });
  target.querySelectorAll("[data-open-listing]").forEach((button) => {
    button.addEventListener("click", () => openListing(button.dataset.openListing));
  });
  renderActivity();
  renderWatchlist();
}

function renderActivity() {
  const target = document.querySelector("#activityFeed");
  const items = [
    ...state.offers.slice(0, 4).map((offer) => ({
      title: `${offer.buyer} bid ${money(offer.amount)}`,
      detail: offer.cardName
    })),
    ...allListings().slice(0, 4).map((listing) => ({
      title: `${listing.name}`,
      detail: `Listed for ${money(listing.ask || listing.value)}`
    }))
  ].slice(0, 5);
  target.innerHTML = items.map((item) => `
    <div class="activity-item">
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </div>
  `).join("");
}

function renderWatchlist() {
  const target = document.querySelector("#watchlist");
  target.innerHTML = state.watchlist.length
    ? state.watchlist.map((item) => `
      <div class="watch-item">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.category)} · target ${money(item.target)}</small>
      </div>
    `).join("")
    : `<p class="small-copy">Your watchlist is empty.</p>`;
}

function renderTerms() {
  const target = document.querySelector("#termsList");
  target.innerHTML = terms.map(([title, text]) => `
    <article class="panel">
      <span class="eyebrow">${escapeHtml(title)}</span>
      <p>${escapeHtml(text)}</p>
    </article>
  `).join("");
}

function openModal(html) {
  document.querySelector("#modalContent").innerHTML = html;
  document.querySelector("#modal").classList.remove("hidden");
}

function closeModal() {
  document.querySelector("#modal").classList.add("hidden");
}

window.dkverseBid = (listingId) => {
  closeModal();
  makeBid(listingId);
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
  navigate(location.hash.replace("#", "") || "home");
});
