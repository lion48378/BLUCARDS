
const players = [
    // FOOTBALL
    { id: 101, name: "Kylian Mbappé", team: "Real Madrid", sport: "FOOTBALL", rating: 97, rarity: "LEGENDARY", icon: "⚽", image: "images/mbappe.jpg" },
    { id: 102, name: "Vinícius Jr.", team: "Real Madrid", sport: "FOOTBALL", rating: 96, rarity: "LEGENDARY", icon: "⚽", image: "images/vinicius.jpg" },
    { id: 103, name: "Lamine Yamal", team: "FC Barcelona", sport: "FOOTBALL", rating: 95, rarity: "EPIC", icon: "⚽", image: "images/yamal.jpg" },
    { id: 104, name: "Pedri", team: "FC Barcelona", sport: "FOOTBALL", rating: 93, rarity: "EPIC", icon: "⚽", image: "images/pedri.jpg" },
    { id: 105, name: "Erling Haaland", team: "Manchester City", sport: "FOOTBALL", rating: 96, rarity: "LEGENDARY", icon: "⚽", image: "images/haaland.jpg" },
    { id: 106, name: "Mohamed Salah", team: "Trabzonspor", sport: "FOOTBALL", rating: 94, rarity: "EPIC", icon: "⚽", image: "images/salah.jpg" },
    { id: 107, name: "Jude Bellingham", team: "Real Madrid", sport: "FOOTBALL", rating: 94, rarity: "EPIC", icon: "⚽", image: "images/bellingham.jpg" },
    { id: 108, name: "Harry Kane", team: "Bayern Munich", sport: "FOOTBALL", rating: 93, rarity: "RARE", icon: "⚽", image: "images/kane.jpg" },

    // BASKETBALL
    { id: 109, name: "Stephen Curry", team: "Golden State Warriors", sport: "BASKETBALL", rating: 96, rarity: "LEGENDARY", icon: "🏀", image: "images/curry.jpg" },
    { id: 110, name: "LeBron James", team: "Philadelphia 76ers", sport: "BASKETBALL", rating: 95, rarity: "LEGENDARY", icon: "🏀", image: "images/lebron.jpg" },
    { id: 111, name: "Luka Dončić", team: "Los Angeles Lakers", sport: "BASKETBALL", rating: 97, rarity: "LEGENDARY", icon: "🏀", image: "images/luka.jpg" },
    { id: 112, name: "Nikola Jokić", team: "Denver Nuggets", sport: "BASKETBALL", rating: 98, rarity: "LEGENDARY", icon: "🏀", image: "images/jokic.jpg" },
    { id: 113, name: "Shai Gilgeous-Alexander", team: "Oklahoma City Thunder", sport: "BASKETBALL", rating: 96, rarity: "EPIC", icon: "🏀", image: "images/shai.jpg" },
    { id: 114, name: "Victor Wembanyama", team: "San Antonio Spurs", sport: "BASKETBALL", rating: 95, rarity: "EPIC", icon: "🏀", image: "images/wembanyama.jpg" },
    { id: 115, name: "Giannis Antetokounmpo", team: "Miami Heat", sport: "BASKETBALL", rating: 96, rarity: "LEGENDARY", icon: "🏀", image: "images/giannis.jpg" },
    { id: 116, name: "Cade Cunningham", team: "Detroit Pistons", sport: "BASKETBALL", rating: 92, rarity: "RARE", icon: "🏀", image: "images/cade.jpg" }
];

// STORAGE

const STORAGE_KEY = "blucardsCollection";
const CREDIT_KEY = "blucardsCredits";

function loadSaved(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

let collection = loadSaved(STORAGE_KEY, []);
let credits = loadSaved(CREDIT_KEY, 500);

if (!Array.isArray(collection)) collection = [];

collection = collection.filter(card =>
    card && players.some(player => player.id === card.id)
);

if (!Number.isFinite(credits) || credits < 0) credits = 500;
credits = Math.floor(credits);

let activeFilter = "ALL";
let activeMarketFilter = "ALL";
let isOpening = false;

// ELEMENTS

const collectionGrid = document.getElementById("collectionGrid");
const packResults = document.getElementById("packResults");
const packMessage = document.getElementById("packMessage");
const emptyMessage = document.getElementById("emptyMessage");
const openButton = document.getElementById("openPack");
const packArt = document.querySelector(".pack-art");

const legendaryOverlay = document.getElementById("legendaryOverlay");
const legendaryCard = document.getElementById("legendaryCard");
const claimButton = document.getElementById("claimLegendary");

const marketplaceGrid = document.getElementById("marketplaceGrid");
const marketMessage = document.getElementById("marketMessage");
const creditBalance = document.getElementById("creditBalance");

const playerModal = document.getElementById("playerModal");
const playerProfileContent = document.getElementById("playerProfileContent");
const closePlayerModal = document.getElementById("closePlayerModal");

// PRICES

const buyPrices = {
    RARE: 150,
    EPIC: 250,
    LEGENDARY: 400
};

const tradeValues = {
    RARE: 50,
    EPIC: 100,
    LEGENDARY: 175
};

// SAVE DATA


// SAVE DATA

let cloudReady = false;
let cloudUserId = null;
let cloudLoadToken = 0;

function saveCollection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));

    window.dispatchEvent(new Event("blucards-collection-updated"));

    if (cloudReady) saveCloudData();
}

function saveCredits() {
    localStorage.setItem(CREDIT_KEY, JSON.stringify(credits));

    window.dispatchEvent(new Event("blucards-collection-updated"));

    if (cloudReady) saveCloudData();
}

// SAVE THE SIGNED-IN COLLECTOR'S DATA
async function saveCloudData() {
    if (!cloudReady || !cloudUserId) return;

    const user = window.blucardsCurrentUser;

    const { error } = await window.supabaseClient
        .from("collector_data")
        .upsert({
            user_id: cloudUserId,
            username: user?.user_metadata?.username || "COLLECTOR",
            collection: collection,
            credits: credits,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error("BLUCARDS cloud save failed:", error.message);
        marketMessage.textContent =
            "Cloud save failed. Check your connection and try again.";
    }
}

// LOAD THE SIGNED-IN COLLECTOR'S DATA
async function initializeCloudForUser(user) {
    const token = ++cloudLoadToken;

    cloudReady = false;
    cloudUserId = null;

    if (!user) {
        collection = [];
        credits = 500;

        renderCollection();
        renderMarketplace();
        window.dispatchEvent(new Event("blucards-collection-updated"));
        return;
    }

    cloudUserId = user.id;

    const { data, error } = await window.supabaseClient
        .from("collector_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (token !== cloudLoadToken) return;

    if (error) {
        console.error("BLUCARDS cloud load failed:", error.message);
        marketMessage.textContent =
            "Could not load your cloud collection.";
        return;
    }

    if (data) {
        collection = Array.isArray(data.collection)
            ? data.collection.filter(card =>
                card && players.some(player => player.id === card.id)
            )
            : [];

        credits = Number.isFinite(Number(data.credits))
            ? Math.max(0, Math.floor(Number(data.credits)))
            : 500;
    } else {
        // Only the first collector imports the existing browser collection.
        const migrationDone =
            localStorage.getItem("blucardsInitialMigrationDone") === "true";

        if (!migrationDone) {
            collection = loadSaved(STORAGE_KEY, []);
            credits = loadSaved(CREDIT_KEY, 500);

            if (!Array.isArray(collection)) collection = [];

            collection = collection.filter(card =>
                card && players.some(player => player.id === card.id)
            );

            if (!Number.isFinite(credits) || credits < 0) {
                credits = 500;
            }

            credits = Math.floor(credits);
        } else {
            // New accounts start with a clean collection.
            collection = [];
            credits = 500;
        }
    }

    if (token !== cloudLoadToken) return;

    // Save the loaded data locally for the existing website features.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    localStorage.setItem(CREDIT_KEY, JSON.stringify(credits));

    const { error: saveError } = await window.supabaseClient
        .from("collector_data")
        .upsert({
            user_id: user.id,
            username: user.user_metadata?.username || "COLLECTOR",
            collection: collection,
            credits: credits,
            updated_at: new Date().toISOString()
        });

    if (token !== cloudLoadToken) return;

    if (saveError) {
        console.error("BLUCARDS initial cloud save failed:", saveError.message);
        marketMessage.textContent =
            "Your collection loaded, but cloud saving failed.";
        return;
    }

    localStorage.setItem("blucardsInitialMigrationDone", "true");

    cloudReady = true;

    renderCollection();
    renderMarketplace();

    window.dispatchEvent(new Event("blucards-collection-updated"));

    marketMessage.textContent = "Your collector data is synced.";
}


// OWNED COUNT

function getOwnedCount(playerId) {
    return collection.filter(card => card.id === playerId).length;
}

// CREATE CARD

function createCard(player, index = 0, animate = false) {
    const animationClass = animate ? "reveal-card" : "";
    const delay = animate ? `style="--reveal-delay:${index * 0.65}s"` : "";

    return `
        <article
            class="player-card rarity-${player.rarity.toLowerCase()} ${animationClass}"
            data-player-id="${player.id}"
            role="button"
            tabindex="0"
            aria-label="View ${player.name} profile"
            ${delay}
        >
            <div class="player-art photo-card">
                <img
                    src="${player.image}"
                    alt="${player.name}"
                    class="player-photo"
                    onload="this.nextElementSibling.style.display='none';"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
                >

                <span class="photo-fallback" style="display:grid;">
                    ${player.icon}
                </span>

                <span class="rating">${player.rating}</span>
            </div>

            <h3>${player.name}</h3>
            <p class="team">${player.team}</p>

            <div class="card-meta">
                <span>${player.sport}</span>
                <span class="rarity">${player.rarity}</span>
            </div>

            <span class="view-profile-label">VIEW PLAYER ↗</span>
        </article>
    `;
}

// STATISTICS

function updateStats() {
    const uniquePlayers = new Set(
        collection.map(card => card.id)
    ).size;

    document.getElementById("totalCards").textContent = collection.length;
    document.getElementById("uniqueCards").textContent = uniquePlayers;

    document.getElementById("completion").textContent =
        Math.round((uniquePlayers / players.length) * 100) + "%";

    creditBalance.textContent = credits.toLocaleString();
}

// COLLECTION

function renderCollection() {
    const filtered = activeFilter === "ALL"
        ? collection
        : collection.filter(card => card.sport === activeFilter);

    collectionGrid.innerHTML = filtered.map(card => {
        const player = players.find(item => item.id === card.id);
        if (!player) return "";

        const count = getOwnedCount(player.id);

        return `
            <div class="collection-item">
                ${createCard(player)}

                <div class="duplicate-info">
                    <span>OWNED: ${count}</span>
                    ${
                        count > 1
                            ? `<button class="trade-button" data-trade-id="${player.id}">
                                TRADE DUPLICATE +${tradeValues[player.rarity]} BC
                               </button>`
                            : `<span class="keep-card">KEEPING YOUR COPY</span>`
                    }
                </div>
            </div>
        `;
    }).join("");

    if (filtered.length === 0) {
        emptyMessage.style.display = "block";

        emptyMessage.textContent = collection.length === 0
            ? "Your collection is empty. Open a pack to get started!"
            : "No cards in this category yet.";
    } else {
        emptyMessage.style.display = "none";
    }

    updateStats();
}

// MARKETPLACE

function renderMarketplace() {
    const availablePlayers = activeMarketFilter === "ALL"
        ? players
        : players.filter(player => player.sport === activeMarketFilter);

    marketplaceGrid.innerHTML = availablePlayers.map(player => {
        const owned = getOwnedCount(player.id);
        const price = buyPrices[player.rarity];

        return `
            <div class="market-item">
                ${createCard(player)}

                <div class="market-card-info">
                    <span class="market-owned">OWNED: ${owned}</span>
                    <span class="market-price">${price} BC</span>
                </div>

                <button
                    class="buy-button"
                    data-buy-id="${player.id}"
                    ${credits < price ? "disabled" : ""}
                >
                    ${credits < price ? "NOT ENOUGH CREDITS" : "BUY CARD"}
                </button>
            </div>
        `;
    }).join("");

    updateStats();
}

// BUY CARD

function buyCard(playerId) {
    const player = players.find(item => item.id === playerId);
    if (!player) return;

    const price = buyPrices[player.rarity];

    if (credits < price) {
        marketMessage.textContent = "You don't have enough credits for this card.";
        return;
    }

    credits -= price;
    collection.push(player);

    saveCredits();
    saveCollection();

    marketMessage.textContent =
        `You purchased ${player.name} for ${price} BC!`;

    renderMarketplace();
    renderCollection();
}

// TRADE DUPLICATE

function tradeDuplicate(playerId) {
    const player = players.find(item => item.id === playerId);
    if (!player) return;

    if (getOwnedCount(playerId) <= 1) {
        marketMessage.textContent = "You must keep at least one copy of every card.";
        return;
    }

    const value = tradeValues[player.rarity];
    const index = collection.findIndex(card => card.id === playerId);

    if (index === -1) return;

    collection.splice(index, 1);
    credits += value;

    saveCollection();
    saveCredits();

    marketMessage.textContent =
        `Traded in ${player.name} for ${value} BC!`;

    renderCollection();
    renderMarketplace();
}

// MARKETPLACE EVENTS

marketplaceGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-buy-id]");

    if (!button || button.disabled) return;

    buyCard(Number(button.dataset.buyId));
});

// COLLECTION EVENTS

collectionGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-trade-id]");

    if (!button) return;

    tradeDuplicate(Number(button.dataset.tradeId));
});

// PACK OPENING

function finishOpening() {
    openButton.disabled = false;
    openButton.textContent = "OPEN ANOTHER FREE PACK ✦";
    isOpening = false;
}

function showLegendary(player) {
    legendaryCard.innerHTML = createCard(player);
    legendaryOverlay.classList.add("active");
}

function openPack() {
    if (isOpening) return;

    isOpening = true;
    openButton.disabled = true;
    openButton.textContent = "OPENING...";
    packMessage.textContent = "Your pack is shaking...";
    packResults.innerHTML = "";

    if (packArt) {
        packArt.classList.remove("pack-shake");
        void packArt.offsetWidth;
        packArt.classList.add("pack-shake");
    }

    const pulledCards = [];

    for (let i = 0; i < 3; i++) {
        const player = players[
            Math.floor(Math.random() * players.length)
        ];

        pulledCards.push(player);
        collection.push(player);
    }

    saveCollection();
    renderCollection();
    renderMarketplace();

    setTimeout(() => {
        packMessage.textContent = "REVEALING YOUR CARDS...";

        packResults.innerHTML = pulledCards
            .map((player, index) => createCard(player, index, true))
            .join("");

        const legendary = pulledCards.find(
            player => player.rarity === "LEGENDARY"
        );

        setTimeout(() => {
            if (legendary) {
                packMessage.textContent = "★ LEGENDARY CARD DISCOVERED!";
                showLegendary(legendary);
            } else {
                packMessage.textContent =
                    "You discovered 3 cards! Check your collection below.";

                finishOpening();
            }
        }, 2500);
    }, 1100);
}

openButton.addEventListener("click", openPack);

claimButton.addEventListener("click", () => {
    legendaryOverlay.classList.remove("active");
    finishOpening();
});

// COLLECTION FILTERS

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
        renderCollection();
    });
});

// MARKETPLACE FILTERS

document.querySelectorAll("[data-market-filter]").forEach(button => {
    button.addEventListener("click", () => {
        activeMarketFilter = button.dataset.marketFilter;

        document.querySelectorAll("[data-market-filter]").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
        renderMarketplace();
    });
});

// PLAYER PROFILES

function openPlayerProfile(playerId) {
    const player = players.find(item => item.id === playerId);
    if (!player) return;

    const owned = getOwnedCount(player.id);

    playerProfileContent.innerHTML = `
        <div class="profile-player-art rarity-${player.rarity.toLowerCase()}">
            <img
                src="${player.image}"
                alt="${player.name}"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
            >
            <span class="profile-fallback">${player.icon}</span>
            <span class="profile-player-rating">${player.rating}</span>
        </div>

        <div class="profile-player-details">
            <p class="eyebrow">BLUCARDS PLAYER PROFILE</p>
            <h2>${player.name}</h2>
            <p class="profile-player-team">${player.team}</p>

            <div class="profile-tags">
                <span>${player.sport}</span>
                <span class="profile-rarity">${player.rarity}</span>
            </div>

            <div class="profile-stat-grid">
                <div>
                    <span>RATING</span>
                    <strong>${player.rating}</strong>
                </div>
                <div>
                    <span>RARITY</span>
                    <strong>${player.rarity}</strong>
                </div>
                <div>
                    <span>YOU OWN</span>
                    <strong>${owned}</strong>
                </div>
            </div>

            <p class="profile-description">
                ${owned > 0
                    ? "This player is part of your BLUCARDS collection."
                    : "This player hasn't joined your collection yet."}
            </p>

            <button class="profile-close-button" id="profileDone">
                BACK TO COLLECTION
            </button>
        </div>
    `;

    playerModal.classList.add("active");
    document.body.classList.add("modal-open");

    document.getElementById("profileDone").addEventListener("click", closeProfile);
}

function closeProfile() {
    playerModal.classList.remove("active");
    document.body.classList.remove("modal-open");
}

document.addEventListener("click", event => {
    const card = event.target.closest(".player-card[data-player-id]");

    if (card) {
        openPlayerProfile(Number(card.dataset.playerId));
    }
});

document.addEventListener("keydown", event => {
    const card = event.target.closest?.(".player-card[data-player-id]");

    if (card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openPlayerProfile(Number(card.dataset.playerId));
    }

    if (event.key === "Escape") {
        closeProfile();
    }
});

closePlayerModal.addEventListener("click", closeProfile);

playerModal.addEventListener("click", event => {
    if (event.target === playerModal) {
        closeProfile();
    }
});

// INITIALIZE

saveCollection();
saveCredits();
renderCollection();
renderMarketplace();

// SUPABASE CLOUD INITIALIZATION

window.addEventListener("blucards-auth-changed", event => {
    initializeCloudForUser(event.detail.user);
});

window.supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error("BLUCARDS session error:", error.message);
        return;
    }

    initializeCloudForUser(data.session?.user || null);
});
