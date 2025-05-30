class App {
    constructor() {
        this.isLoading = false;
        this.isAuthenticated = false;
        this.currentSection = "home";
        this.qrRefreshInterval = null;
        this.init();
    }

    init() {
        this.initializeSocket();
        this.bindEventListeners();
        this.loadInitialQR();
        this.showSection("home");
    }
    bindEventListeners() {
        // QR Refresh button
        const refreshBtn = document.getElementById("refresh-qr");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => this.refreshQR());
        }

        // Theme toggle
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light") {
            document.body.classList.add("light-theme");
            this.updateThemeIcon();
        }
    }

    async loadInitialQR() {
        this.showLoading();

        try {
            const response = await fetch("/qr");
            const data = await response.json();

            if (data.data === "already_authorized") {
                this.showAuthorizedState();
            } else if (data.qr) {
                this.showQRCode(data.qr);
            } else {
                this.showError(data.message || "Failed to generate QR code");
            }
        } catch (error) {
            console.error("Error fetching QR code:", error);
            this.showError("Network error. Please check your connection.");
        }
    }

    async refreshQR() {
        const refreshBtn = document.getElementById("refresh-qr");
        const originalText = refreshBtn.innerHTML;

        // Show loading state on button
        refreshBtn.innerHTML =
            '<span class="material-icons">hourglass_empty</span>Refreshing...';
        refreshBtn.disabled = true;

        this.hideQR();
        this.showLoading();

        try {
            const response = await fetch("/qr");
            const data = await response.json();

            if (data.data === "already_authorized") {
                this.showAuthorizedState();
            } else if (data.qr) {
                this.showQRCode(data.qr);
            } else {
                this.showError(data.message || "Failed to generate QR code");
            }
        } catch (error) {
            console.error("Error refreshing QR code:", error);
            this.showError("Failed to refresh QR code. Please try again.");
        } finally {
            // Restore button state
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    showLoading() {
        this.isLoading = true;
        const loadingEl = document.getElementById("loading");
        const qrContainer = document.getElementById("qr-container");
        const statusMessage = document.getElementById("status-message");
        const authorizedState = document.getElementById("authorized-state");

        if (loadingEl) loadingEl.classList.remove("hidden");
        if (qrContainer) qrContainer.classList.add("hidden");
        if (statusMessage) statusMessage.classList.add("hidden");
        if (authorizedState) authorizedState.classList.add("hidden");
    }

    hideLoading() {
        this.isLoading = false;
        const loadingEl = document.getElementById("loading");
        if (loadingEl) loadingEl.classList.add("hidden");
    }

    showQRCode(qrData) {
        const qrContainer = document.getElementById("qr-container");
        const qrCodeImg = document.getElementById("qr_code");

        if (qrCodeImg && qrData) {
            qrCodeImg.src = qrData;
            qrCodeImg.onload = () => {
                // Hide loading animation first
                this.hideLoading();

                // QR code loaded successfully - show with smooth animation
                if (qrContainer) {
                    qrContainer.classList.remove("hidden");
                    // Force reflow to ensure the element is rendered
                    qrContainer.offsetHeight;
                    // Add a small delay for smooth animation
                    setTimeout(() => {
                        qrContainer.style.opacity = "1";
                        qrContainer.style.transform = "translateY(0)";
                    }, 50);
                }

                this.showStatus(
                    "Scan the QR code with WhatsApp to authenticate",
                    "info"
                );
            };

            qrCodeImg.onerror = () => {
                this.hideLoading();
                this.showError("Failed to load QR code image");
            };
        } else {
            this.hideLoading();
            this.showError("Invalid QR code data received");
        }
    }

    hideQR() {
        const qrContainer = document.getElementById("qr-container");
        if (qrContainer) {
            qrContainer.style.opacity = "0";
            qrContainer.style.transform = "translateY(20px)";
            setTimeout(() => {
                qrContainer.classList.add("hidden");
            }, 400);
        }
    }

    showAuthorizedState() {
        this.hideLoading();
        this.isAuthenticated = true;

        const authorizedState = document.getElementById("authorized-state");
        if (authorizedState) {
            authorizedState.classList.remove("hidden");
        }

        this.showStatus(
            "WhatsApp is already connected and ready to use",
            "success"
        );
    }

    showError(message) {
        this.hideLoading();
        this.showStatus(message, "error");
    }

    showStatus(message, type = "info") {
        const statusMessage = document.getElementById("status-message");
        const statusText = document.getElementById("status-text");
        const statusIcon = document.getElementById("status-icon");

        if (statusMessage && statusText && statusIcon) {
            // Clear previous status classes
            statusMessage.classList.remove("success", "error", "info");
            statusMessage.classList.add(type);

            // Set appropriate icon
            const icons = {
                success: "check_circle",
                error: "error",
                info: "info"
            };
            statusIcon.textContent = icons[type] || "info";

            statusText.textContent = message;
            statusMessage.classList.remove("hidden");

            // Auto-hide success and info messages after 5 seconds
            if (type !== "error") {
                setTimeout(() => {
                    statusMessage.classList.add("hidden");
                }, 5000);
            }
        }
    }

    handleQRGenerated(data) {
        if (data.status === "success") {
            this.showQRCode(data.qr);
        }
    }

    handleQRError(data) {
        this.showError(data.message || "Failed to generate QR code");
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll(".container");
        sections.forEach(section => {
            section.classList.add("hidden");
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove("hidden");
            // Add fade-in animation
            targetSection.classList.add("fade-in");

            // Remove animation class after animation completes
            setTimeout(() => {
                targetSection.classList.remove("fade-in");
            }, 600);
        }

        this.currentSection = sectionId;
        //close menu on mobile
        this.hideMenu();
    }

    toggleMenu() {
        const menu = document.getElementById("side-menu");
        if (menu) {
            menu.classList.toggle("hidden");
        }
    }

    hideMenu() {
        const menu = document.getElementById("side-menu");
        if (menu) {
            menu.classList.add("hidden");
        }
    }

    toggleTheme() {
        document.body.classList.toggle("light-theme");
        this.updateThemeIcon();

        const isLight = document.body.classList.contains("light-theme");
        localStorage.setItem("theme", isLight ? "light" : "dark");
    }

    updateThemeIcon() {
        const themeIcon = document.querySelector("#theme .material-icons");
        if (themeIcon) {
            const isLight = document.body.classList.contains("light-theme");
            themeIcon.textContent = isLight ? "brightness_2" : "wb_sunny";
        }
    }
}

let App;

function showSection(sectionId) {
    if (App) {
        App.showSection(sectionId);
    }
}

function toggleMenu() {
    if (App) {
        App.toggleMenu();
    }
}

function toggleTheme() {
    if (App) {
        App.toggleTheme();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    appState = new App();
});

document.addEventListener("click", event => {
    const menu = document.getElementById("side-menu");
    const menuButton = document.getElementById("menu");

    if (
        menu &&
        !menu.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        menu.classList.add("hidden");
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
        const menu = document.getElementById("side-menu");
        if (menu) {
            menu.classList.add("hidden");
        }
    }
});

window.addEventListener("scroll", () => {
    const navbar = document.getElementById("nav-bar");
    if (navbar) {
        if (window.scrollY > 10) {
            navbar.style.background = "rgba(30, 30, 30, 0.95)";
            navbar.style.backdropFilter = "blur(20px)";
        } else {
            navbar.style.background = "rgba(30, 30, 30, 0.8)";
            navbar.style.backdropFilter = "blur(10px)";
        }
    }
});
