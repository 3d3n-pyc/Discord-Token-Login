/**
 *  ad888888b,           88   ad888888b,               
 * d8"     "88           88  d8"     "88               
 *         a8P           88          a8P               
 *      aad8"    ,adPPYb,88       aad8"   8b,dPPYba,   
 *      ""Y8,   a8"    `Y88       ""Y8,   88P'   `"8a  
 *         "8b  8b       88          "8b  88       88  
 * Y8,     a88  "8a,   ,d88  Y8,     a88  88       88  
 *  "Y888888P'   `"8bbdP"Y8   "Y888888P'  88       88  
 * 
 * This extension allows you to log in to your Discord account using your token.
 * It is designed for educational purposes only and should not be used for any malicious activities.
 */

async function deleteCookies(): Promise<void> {
    const cookies: chrome.cookies.Cookie[] = await chrome.cookies.getAll({ domain: "discord.com" });
    for (const cookie of cookies) {
        const url = `https://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
    }
}

async function login(): Promise<void> {
    const tokenInput = document.getElementById("tokenInput") as HTMLInputElement | null;
    if (!tokenInput) return;

    const token: string = tokenInput.value.trim();
    if (!token) return;

    // Delete Discord cookies
    await deleteCookies();

    // Find or create a tab on discord.com/login
    const [tab] = await chrome.tabs.query({ url: "https://discord.com/*" });
    let targetTab: chrome.tabs.Tab;

    if (tab?.id) {
        const updated = await chrome.tabs.update(tab.id, { url: "https://discord.com/login", active: true });
        if (!updated) return;
        targetTab = updated;
    } else {
        targetTab = await chrome.tabs.create({ url: "https://discord.com/login" });
    }

    // Wait for the tab to finish loading
    await new Promise<void>((resolve) => {
        function listener(tabId: number, info: chrome.tabs.OnUpdatedInfo): void {
            if (tabId === targetTab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        }
        chrome.tabs.onUpdated.addListener(listener);
    });

    // Inject script to set the token in Discord's localStorage
    await chrome.scripting.executeScript({
        target: { tabId: targetTab.id! },
        func: (tok: string) => {
            localStorage.clear();
            localStorage.setItem("token", `"${tok}"`);
            window.location.replace("https://discord.com/channels/@me");
        },
        args: [token],
    });
}

document.getElementById("loginButton")!.addEventListener("click", login);
