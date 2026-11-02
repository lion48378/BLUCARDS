
// ======================================
// BLUCARDS — MY CLUB PROFILE
// ======================================

const clubUsername = document.getElementById("clubUsername");
const clubEmail = document.getElementById("clubEmail");
const clubAvatar = document.getElementById("clubAvatar");
const clubStatus = document.getElementById("clubStatus");

const clubTotalCards = document.getElementById("clubTotalCards");
const clubUniqueCards = document.getElementById("clubUniqueCards");
const clubCompletion = document.getElementById("clubCompletion");
const clubCredits = document.getElementById("clubCredits");

const clubRarestCard = document.getElementById("clubRarestCard");
const clubSignIn = document.getElementById("clubSignIn");
const clubSignOut = document.getElementById("clubSignOut");

const clubCollectionKey = "blucardsCollection";
const clubCreditKey = "blucardsCredits";

const clubRarityOrder = [
    "COMMON",
    "RARE",
    "EPIC",
    "LEGENDARY"
];

function getClubCollection() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(clubCollectionKey) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function getClubCredits() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(clubCreditKey) || "500"
        );

        return Number(saved) || 0;
    } catch {
        return 500;
    }
}

function updateClubStats() {
    const cards = getClubCollection();

    const uniqueIds = new Set(cards.map(card => card.id));

    const total = cards.length;
    const unique = uniqueIds.size;

    // Your current first collection contains 16 players.
    const completion = Math.min(
        100,
        Math.round((unique / 16) * 100)
    );

    clubTotalCards.textContent = total;
    clubUniqueCards.textContent = unique;
    clubCompletion.textContent = `${completion}%`;
    clubCredits.textContent = getClubCredits().toLocaleString();

    // Find the rarest card.
    const rarest = [...cards].sort((a, b) => {
        const rarityA = clubRarityOrder.indexOf(
            String(a.rarity || "COMMON").toUpperCase()
        );

        const rarityB = clubRarityOrder.indexOf(
            String(b.rarity || "COMMON").toUpperCase()
        );

        return rarityB - rarityA;
    })[0];

    if (!rarest) {
        clubRarestCard.textContent =
            "Open a pack to discover your first card.";

        return;
    }

    const name = document.createElement("h3");
    name.textContent = rarest.name || "Unknown Player";

    const rarity = document.createElement("p");
    rarity.textContent = rarest.rarity || "COMMON";

    clubRarestCard.replaceChildren(name, rarity);
}

function updateClubProfile(user) {
    if (!user) {
        clubUsername.textContent = "GUEST COLLECTOR";
        clubEmail.textContent = "Sign in to view your account details.";
        clubAvatar.textContent = "B";
        clubStatus.textContent = "GUEST";

        clubSignIn.hidden = false;
        clubSignOut.hidden = true;

        updateClubStats();
        return;
    }

    const username = user.user_metadata?.username || "COLLECTOR";

    clubUsername.textContent = username;
    clubEmail.textContent = "BLUCARDS MEMBER";
    clubAvatar.textContent = username.charAt(0).toUpperCase();
    clubStatus.textContent = "REGISTERED COLLECTOR";

    clubSignIn.hidden = true;
    clubSignOut.hidden = false;

    updateClubStats();
}

// Open the existing sign-in modal.
clubSignIn.addEventListener("click", () => {
    document.getElementById("accountButton").click();
});

// Sign out using the existing authentication system.
clubSignOut.addEventListener("click", () => {
    document.getElementById("logoutButton").click();
});

// Listen for account changes.
window.addEventListener("blucards-auth-changed", event => {
    updateClubProfile(event.detail.user);
});

// Refresh stats whenever cards or credits change.
window.addEventListener("blucards-collection-updated", updateClubStats);
window.addEventListener("storage", updateClubStats);

// Load the current account when the page opens.
async function initializeClub() {
    updateClubStats();

    if (!window.supabaseClient) {
        updateClubProfile(null);
        return;
    }

    const { data, error } =
        await window.supabaseClient.auth.getSession();

    if (error) {
        console.error("MY CLUB session error:", error.message);
        updateClubProfile(null);
        return;
    }

    updateClubProfile(data.session?.user || null);
}

initializeClub();

console.log("BLUCARDS MY CLUB loaded.");
