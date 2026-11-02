
// BLUCARDS AUTHENTICATION
const db = window.supabaseClient;

const authModal = document.getElementById("authModal");
const accountButton = document.getElementById("accountButton");
const closeAuth = document.getElementById("closeAuth");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authUsername = document.getElementById("authUsername");
const usernameField = document.getElementById("usernameField");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const authSwitch = document.getElementById("authSwitch");
const logoutButton = document.getElementById("logoutButton");

let authMode = "login";
let currentUser = null;

// Make the signed-in user available to other BLUCARDS scripts.
window.blucardsCurrentUser = null;

function openAuth() {
    authModal.classList.add("active");
}

function closeAuthModal() {
    authModal.classList.remove("active");
    authMessage.textContent = "";
}

accountButton.addEventListener("click", openAuth);
closeAuth.addEventListener("click", closeAuthModal);

authModal.addEventListener("click", event => {
    if (event.target === authModal) closeAuthModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAuthModal();
});

function setAuthMode(mode) {
    authMode = mode;

    const isSignup = mode === "signup";

    authTitle.textContent = isSignup
        ? "JOIN THE CLUB."
        : "YOUR CLUB STARTS HERE.";

    authDescription.textContent = isSignup
        ? "Create your BLUCARDS collector account."
        : "Sign in to your collector account.";

    authSubmit.textContent = isSignup ? "CREATE ACCOUNT" : "SIGN IN";

    usernameField.hidden = !isSignup;
    authUsername.required = isSignup;

    authSwitch.textContent = isSignup
        ? "Already have an account? Sign in"
        : "Don't have an account? Create one";

    authMessage.textContent = "";
}

authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
});

function updateAccountUI(user) {
    currentUser = user;
    window.blucardsCurrentUser = user;

    // Notify other parts of the website.
    window.dispatchEvent(new CustomEvent("blucards-auth-changed", {
        detail: { user }
    }));

    if (user) {
        const username = user.user_metadata?.username || "COLLECTOR";

        accountButton.textContent = username;
        logoutButton.hidden = false;
        authSwitch.hidden = true;
        authForm.hidden = true;

        authTitle.textContent = "WELCOME BACK.";
        authDescription.textContent = `Signed in as ${username}.`;
        authMessage.textContent = "Your BLUCARDS account is active.";
    } else {
        accountButton.textContent = "SIGN IN";
        logoutButton.hidden = true;
        authSwitch.hidden = false;
        authForm.hidden = false;

        setAuthMode("login");
    }
}

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;
    const username = authUsername.value.trim();

    authSubmit.disabled = true;
    authSubmit.textContent = "PLEASE WAIT...";
    authMessage.textContent = "";

    try {
        if (authMode === "signup") {
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                throw new Error(
                    "Username must be 3–20 characters using letters, numbers or underscores."
                );
            }

            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (error) throw error;

            if (data.session) {
                authMessage.textContent =
                    "Account created! Welcome to BLUCARDS.";

                updateAccountUI(data.user);
            } else {
                authMessage.textContent =
                    "Account created! Check your email to confirm your account before signing in.";
            }
        } else {
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            updateAccountUI(data.user);
            authMessage.textContent = "Successfully signed in!";
        }
    } catch (error) {
        authMessage.textContent = error.message;
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent =
            authMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
    }
});

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    const { error } = await db.auth.signOut();

    logoutButton.disabled = false;

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    authMessage.textContent = "You have signed out.";
    updateAccountUI(null);
});

async function initializeAuth() {
    const { data, error } = await db.auth.getSession();

    if (error) {
        console.error("Session error:", error.message);
        return;
    }

    updateAccountUI(data.session?.user || null);
}

db.auth.onAuthStateChange((event, session) => {
    updateAccountUI(session?.user || null);
});

initializeAuth();

console.log("BLUCARDS authentication loaded.");
