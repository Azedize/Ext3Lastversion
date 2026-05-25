importScripts("utils.js");





//========================================
// captureFullPage :
// ========================================

async function captureFullPage(tabId, imageName) {
    Logger.groupCollapsed("captureFullPage", "captureFullPage");
    Logger.timeStart("captureFullPage", "captureFullPage");
    Logger.info("Démarrage captureFullPage", { tabId, imageName }, "captureFullPage");

    try {
        // 🔧 Attacher debugger
        Logger.step("Attachement du debugger", { tabId }, "captureFullPage");
        await new Promise((res) => chrome.debugger.attach({ tabId }, "1.3", res));
        Logger.success("Debugger attaché avec succès", null, "captureFullPage");

        // 📄 Activer Page domain
        Logger.step("Activation du domaine Page", null, "captureFullPage");
        await new Promise((res) =>
            chrome.debugger.sendCommand({ tabId }, "Page.enable", {}, res),
        );
        Logger.success("Domaine Page activé", null, "captureFullPage");

        // 📐 Récupérer layout metrics
        Logger.step("Récupération des métriques de layout", null, "captureFullPage");
        const { cssContentSize } = await new Promise((res) =>
            chrome.debugger.sendCommand({ tabId }, "Page.getLayoutMetrics", {}, res),
        );
        Logger.inspect(cssContentSize, "Métriques de layout", "captureFullPage");

        const { width, height } = cssContentSize;
        const chunkHeight = 3000;
        Logger.info("Configuration capture", { width, height, chunkHeight }, "captureFullPage");

        // 🖼️ Création OffscreenCanvas
        Logger.step("Création OffscreenCanvas", { width, height }, "captureFullPage");
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // 📸 Capture en chunks
        Logger.step("Début capture en chunks", { totalHeight: height, chunkHeight }, "captureFullPage");
        for (let y = 0; y < height; y += chunkHeight) {
            const h = Math.min(chunkHeight, height - y);
            Logger.step(`Capture chunk ${Math.floor(y / chunkHeight) + 1}`, { y, height: h }, "captureFullPage");

            const screenshot = await new Promise((res) =>
                chrome.debugger.sendCommand(
                    { tabId },
                    "Page.captureScreenshot",
                    {
                        format: "png",
                        fromSurface: true,
                        clip: { x: 0, y, width, height: h, scale: 1 },
                    },
                    res,
                ),
            );

            const blob = await (
                await fetch("data:image/png;base64," + screenshot.data)
            ).blob();
            const img = await createImageBitmap(blob);

            Logger.step("Dessin du chunk sur canvas", null, "captureFullPage");
            ctx.drawImage(img, 0, y, width, h);
        }

        Logger.step("Conversion canvas → PNG Blob", null, "captureFullPage");
        const finalBlob = await canvas.convertToBlob({ type: "image/png" });

        // ✅ MV3 : télécharger directement via FileReader (Data URL)
        const reader = new FileReader();
        reader.onloadend = () => {
            Logger.step("Téléchargement du fichier", { filename: `${imageName}.png` }, "captureFullPage");
            chrome.downloads.download(
                {
                    url: reader.result,
                    filename: `${imageName}.png`,
                },
                (downloadId) => {
                    if (downloadId) {
                        Logger.success("Téléchargement lancé", { downloadId }, "captureFullPage");
                    } else {
                        Logger.error("Échec du téléchargement", chrome.runtime.lastError, "captureFullPage");
                    }
                },
            );
        };
        reader.readAsDataURL(finalBlob);

        // 🔌 Detach debugger
        Logger.step("Détachement du debugger", null, "captureFullPage");
        await new Promise((res) => chrome.debugger.detach({ tabId }, res));
        Logger.success("Debugger détaché", null, "captureFullPage");

        Logger.success("Screenshot full page terminé", null, "captureFullPage");

    } catch (err) {
        Logger.error("Erreur dans captureFullPage", err, "captureFullPage");
        try {
            Logger.step("Nettoyage: tentative détachement debugger", null, "captureFullPage");
            await new Promise((res) => chrome.debugger.detach({ tabId }, res));
            Logger.success("Debugger détaché lors du nettoyage", null, "captureFullPage");
        } catch (e) {
            Logger.error("Impossible de détacher le debugger", e, "captureFullPage");
        }
    }

    Logger.timeEnd("captureFullPage", "captureFullPage");
    Logger.groupEnd();
}





function sendMessageToContentScript(tabId, message, onSuccess, onError) {
    Logger.debug("Envoi message au content script", { tabId, action: message?.action }, "sendMessageToContentScript");

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            Logger.error("Erreur envoi message content script", chrome.runtime.lastError, "sendMessageToContentScript");
            onError?.(chrome.runtime.lastError);
        } else {
            Logger.success("Message envoyé au content script", { tabId, response }, "sendMessageToContentScript");
            onSuccess?.(response);
        }
    });
}


// ===========================
// 🔑 Constantes principales
// ===========================
const COMBINED_KEYS = "&rep";
const PBKDF2_ITERATIONS = 100000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 256;
const PASSWORD = "A9!fP3z$wQ8@rX7kM2#dN6^bH1&yL4t*";

const processingTabs = {};




// ======================================
// ⚙️ Sauvegarde et application du proxy
// ======================================
function configureProxyDirectly(host, port, user, pass) {
    Logger.step("Configuration proxy directe", { host, port, user }, "configureProxyDirectly");

    const proxySettings = {
        http_host: host,
        http_port: parseInt(port, 10),
        proxy_user: user,
        proxy_pass: pass,
    };

    chrome.storage.local.set({ proxySetting: proxySettings }, () => {
        Logger.success("Paramètres proxy sauvegardés", { host, port }, "configureProxyDirectly");
        applyProxySettings(proxySettings);
    });
}







// =============================================
// 🛠️ Appliquer la config et gérer l'auth proxy
// =============================================

function applyProxySettings(proxySetting) {
    Logger.step("Application paramètres proxy", {
        host: proxySetting.http_host,
        port: proxySetting.http_port,
        user: proxySetting.proxy_user
    }, "applyProxySettings");

    chrome.proxy.settings.set(
        {
            value: {
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: "http",
                        host: proxySetting.http_host,
                        port: proxySetting.http_port,
                    },
                    bypassList: ["<local>"],
                },
            },
            scope: "regular",
        },
        () => {
            Logger.success("Paramètres proxy appliqués", null, "applyProxySettings");

            chrome.webRequest.onAuthRequired.addListener(
                (details, callback) => {
                    Logger.debug("Authentification proxy requise", { url: details.url }, "applyProxySettings");
                    callback({
                        authCredentials: {
                            username: proxySetting.proxy_user,
                            password: proxySetting.proxy_pass,
                        },
                    });
                },
                { urls: ["<all_urls>"] },
                ["asyncBlocking"],
            );

            Logger.success("Listener authentification proxy configuré", null, "applyProxySettings");
        },
    );
}



// ===========================
// 🔄 Fonctions utilitaires
// ===========================

function hexToBytes(hex) {
    if (hex.length % 2 !== 0)
        throw new Error("Hex length must be even: " + hex.length);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        if (isNaN(byte)) throw new Error("Invalid hex byte: " + hex.substr(i, 2));
        bytes[i / 2] = byte;
    }
    return bytes;
}







// ===========================
// Retourne une chaîne de caractères à partir d'un tableau d'octets
// ===========================
function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}





// ===========================
// Retourne une clé AES-GCM à partir du mot de passe et de la chaîne de salage
// ===========================
async function deriveKey(password, saltBytes) {
    const pwKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: saltBytes,
            iterations: PBKDF2_ITERATIONS,
        },
        pwKey,
        { name: "AES-GCM", length: KEY_LEN },
        false,
        ["decrypt", "encrypt"],
    );
}





// ===========================
// Décrypte un message AES-GCM
// ===========================
async function decryptAESGCM(password, hexPayload) {
    Logger.debug("Décryptage AES-GCM", { payloadLength: hexPayload?.length }, "decryptAESGCM");

    try {
        const payload = hexToBytes(hexPayload);
        const salt = payload.slice(0, SALT_LEN);
        const iv = payload.slice(SALT_LEN, SALT_LEN + IV_LEN);
        const data = payload.slice(SALT_LEN + IV_LEN);

        Logger.debug("Composants extraits", {
            saltLength: salt.length,
            ivLength: iv.length,
            dataLength: data.length
        }, "decryptAESGCM");

        const key = await deriveKey(password, salt);
        const plainBuf = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data,
        );

        const result = bytesToString(new Uint8Array(plainBuf));
        Logger.success("Décryptage réussi", { resultLength: result.length }, "decryptAESGCM");
        return result;

    } catch (error) {
        Logger.error("Erreur décryptage AES-GCM", error, "decryptAESGCM");
        throw error;
    }
}






// ===========================
// Retourne vrai si la chaine de caractères est un hexadécimal
// ===========================
function looksLikeEncryptedHex(s) {
    Logger.debug("Vérification format hexadécimal", { stringLength: s?.length }, "looksLikeEncryptedHex");
    if (!s) {
        Logger.debug("Chaîne vide ou null", null, "looksLikeEncryptedHex");
        return false;
    }
    const isHex = /^[0-9a-fA-F]+$/.test(s) && s.length >= (SALT_LEN + IV_LEN + 16) * 2;
    Logger.debug("Résultat vérification", { isHex }, "looksLikeEncryptedHex");
    return isHex;
}




// ===========================
// Role : Attendre un certain temps
// ===========================
async function sleep(ms) {
    Logger.debug("Pause", { duration: ms }, "sleep");
    return new Promise((resolve) => setTimeout(resolve, ms));
}





// =============================
// Enregistre un message de log
// =============================
function saveLog(message) {
    Logger.debug("Sauvegarde log", { message }, "saveLog");
    chrome.storage.local.get({ logs: [] }, (data) => {
        const logMessage = `[${new Date().toISOString()}] ${message}`;
        const updatedLogs = [...data.logs, `🔔 ${logMessage}`];
        chrome.storage.local.set({ logs: updatedLogs });
        Logger.success("Log sauvegardé", { logCount: updatedLogs.length }, "saveLog");
    });
}







// ===================================
// Retourne un proxy extrait de l'url
// ===================================

async function extractProxyFromUrl(url, tabId, sendNow = true) {
    Logger.groupCollapsed("extractProxyFromUrl", "extractProxyFromUrl");
    Logger.timeStart("extractProxyFromUrl", "extractProxyFromUrl");
    Logger.info("Extraction proxy depuis URL", { url, tabId, sendNow }, "extractProxyFromUrl");

    try {
        if (!url || !url.startsWith("http")) {
            Logger.debug("URL invalide pour extraction proxy", { url }, "extractProxyFromUrl");
            Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
            Logger.groupEnd();
            return null;
        }

        let decodedUrl = decodeURIComponent(url);
        Logger.debug("URL décodée", { decodedUrl }, "extractProxyFromUrl");

        let payload = null;

        try {
            const u = new URL(decodedUrl);
            payload = u.searchParams.get("rep") || u.searchParams.get("payload") || (u.pathname || "").replace(/^\/+/, "");
            Logger.debug("Payload extrait depuis URL", { payload }, "extractProxyFromUrl");
        } catch (error) {
            Logger.debug("Erreur parsing URL", { error: error.message }, "extractProxyFromUrl");
        }

        if (!payload) {
            const clean = decodedUrl.replace(/^https?:\/\//i, "").split(/[?#\s]/)[0];
            payload = clean.split("/").pop();
            Logger.debug("Payload extrait depuis chemin", { payload }, "extractProxyFromUrl");
        }

        if (!payload) {
            Logger.warning("Aucun payload trouvé", null, "extractProxyFromUrl");
            Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
            Logger.groupEnd();
            return null;
        }

        payload = payload.replace(/&rep(?:\.com)?$/i, "").replace(/^rep=/i, "");
        Logger.debug("Payload nettoyé", { payload }, "extractProxyFromUrl");

        try {
            if (/%[0-9A-Fa-f]{2}/.test(payload)) {
                payload = decodeURIComponent(payload);
                Logger.debug("Payload décodé URI", { payload }, "extractProxyFromUrl");
            }
        } catch (error) {
            Logger.debug("Erreur décodage URI", { error: error.message }, "extractProxyFromUrl");
        }

        let finalText = looksLikeEncryptedHex(payload) ? await decryptAESGCM(PASSWORD, payload) : payload;
        Logger.debug("Texte final", { finalText, wasEncrypted: looksLikeEncryptedHex(payload) }, "extractProxyFromUrl");

        const parts = finalText.split(";").map((p) => p.trim());
        if (parts.length !== 9) {
            Logger.error("Nombre de parties incorrect", { partsCount: parts.length, expected: 9 }, "extractProxyFromUrl");
            Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
            Logger.groupEnd();
            return null;
        }

        let [host, port, user, pass, profile_email, profile_password, recovery_email, new_password, new_recovery_email] = parts;
        pass = String(pass).split(/[\/\.]/)[0];

        const portNum = parseInt(port, 10);
        if (!/^\d{1,5}$/.test(String(portNum)) || portNum <= 0 || portNum > 65535) {
            Logger.error("Port invalide", { port, portNum }, "extractProxyFromUrl");
            Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
            Logger.groupEnd();
            return null;
        }

        if (!host || !user || !pass || isNaN(portNum) || !profile_email) {
            Logger.error("Paramètres requis manquants", { host, user, pass: !!pass, portNum, profile_email }, "extractProxyFromUrl");
            Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
            Logger.groupEnd();
            return null;
        }

        Logger.success("Paramètres proxy validés", { host, port: portNum, user, hasPass: !!pass, profile_email }, "extractProxyFromUrl");

        // Save email only in localStorage
        await chrome.storage.local.set({ storedEmail: profile_email });
        Logger.step("Email sauvegardé", { profile_email }, "extractProxyFromUrl");

        // Optionnel : config proxy si bghiti
        Logger.step("Configuration proxy", { host, port: portNum, user }, "extractProxyFromUrl");
        configureProxyDirectly(host, portNum, user, pass);

        const dataToSend = {
            profile_email,
            profile_password,
            recovery_email,
            new_password,
            new_recovery_email,
        };

        await chrome.storage.local.set({ currentData: dataToSend });
        Logger.success("Données sauvegardées", { dataKeys: Object.keys(dataToSend) }, "extractProxyFromUrl");

        Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
        Logger.groupEnd();
        return dataToSend;

    } catch (error) {
        Logger.error("Erreur extraction proxy", error, "extractProxyFromUrl");
        try {
            delete processingTabs[tabId];
            Logger.debug("Tab nettoyé après erreur", { tabId }, "extractProxyFromUrl");
        } catch (cleanupError) {
            Logger.debug("Erreur nettoyage tab", { cleanupError: cleanupError.message }, "extractProxyFromUrl");
        }
        Logger.timeEnd("extractProxyFromUrl", "extractProxyFromUrl");
        Logger.groupEnd();
        return null;
    }
}





// ===========================
// Gestion des tabs
// ===========================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    Logger.groupCollapsed(`Tab Updated: ${tabId}`, "chrome.tabs.onUpdated");
    Logger.debug("Tab mis à jour", { tabId, changeInfo, url: tab.url }, "chrome.tabs.onUpdated");

    if (changeInfo.status !== "complete" || tab.url !== "https://www.youtube.com/") {
        Logger.debug("Conditions non remplies pour traitement YouTube", { status: changeInfo.status, url: tab.url }, "chrome.tabs.onUpdated");
        Logger.groupEnd();
        return;
    }

    Logger.step("Traitement onglet YouTube terminé", { tabId }, "chrome.tabs.onUpdated");

    const { sentMessages } = await chrome.storage.local.get("sentMessages");
    if (!sentMessages || sentMessages.length === 0) {
        Logger.warning("Aucun message envoyé trouvé", null, "chrome.tabs.onUpdated");
        Logger.groupEnd();
        return;
    }

    Logger.info("Messages envoyés trouvés", { count: sentMessages.length }, "chrome.tabs.onUpdated");

    await sleep(5000);

    const isMonitoredTab = sentMessages.some((item) => item.TabId === tabId);
    if (!isMonitoredTab) {
        Logger.debug("Onglet non surveillé", { tabId }, "chrome.tabs.onUpdated");
        Logger.groupEnd();
        return;
    }

    Logger.step("Fermeture onglet surveillé", { tabId }, "chrome.tabs.onUpdated");

    try {
        await chrome.tabs.remove(tabId);
        Logger.success("Onglet YouTube fermé", { tabId }, "chrome.tabs.onUpdated");

        await chrome.storage.local.remove("sentMessages");
        Logger.success("Messages envoyés nettoyés", null, "chrome.tabs.onUpdated");

        if (callerTabId_CheckLoginYoutube) {
            Logger.step("Envoi message de fin CheckLogin", { callerTabId: callerTabId_CheckLoginYoutube }, "chrome.tabs.onUpdated");
            await chrome.tabs.sendMessage(callerTabId_CheckLoginYoutube, {
                action: "Closed_tab_Finished_CheckLoginYoutube",
            });
        }

        currentMapTabId_CheckLoginYoutube = null;
        callerTabId_CheckLoginYoutube = null;
        originalTabIds_CheckLoginYoutube = [];
        Logger.success("Variables CheckLogin nettoyées", null, "chrome.tabs.onUpdated");

    } catch (error) {
        Logger.error("Erreur lors de la fermeture onglet YouTube", error, "chrome.tabs.onUpdated");
    }

    Logger.groupEnd();
});





// ===========================
// Gestion des tabs
// ===========================
// Attendre chaque création de tab, qu’elle soit créée par l’utilisateur ou automatiquement par le système.

//     Dans`chrome.tabs.onCreated`, vérifier systématiquement si le tab contient un `dataToSend` valide avant de lancer le traitement(`chrome.tabs.create`).

//         Si `dataToSend` est invalide, vide ou introuvable:

// * ne pas démarrer le process immédiatement,
// * continuer à surveiller les nouveaux tabs créés pendant une durée maximale de 15 secondes,
// * durant cette période, vérifier chaque nouveau tab créé afin de détecter un dataset valide.

// Le système doit continuer le check jusqu’à 15 secondes maximum.

//     Après 15 secondes:

// * récupérer tous les tabs actuellement ouverts,
// * effectuer un refresh / reload de chaque tab avec son URL actuelle,
// * conserver exactement les URLs existantes sans les modifier,
// * éviter absolument les boucles infinies de reload ou de navigation.

// Le code doit être stable, optimisé, éviter les conflits async et nettoyer correctement les états de traitement.



// ===========================
// STATE
// ===========================

let monitoringActive = false;
let processDone = false;


// ===========================
// START 15s WATCHER
// ===========================

function start15sWatcher() {
    if (monitoringActive) return;

    monitoringActive = true;
    processDone = false;

    Logger.info("🟢 Start 15s monitoring", null, "watcher");

    setTimeout(async () => {

        Logger.warning("⏱ 15s finished", null, "watcher");

        // ❗ refresh ONLY if no process was executed
        if (!processDone) {
            try {
                const tabs = await chrome.tabs.query({});

                for (const tab of tabs) {
                    if (!tab.id || !tab.url) continue;

                    Logger.step("🔄 Refresh tab", { tabId: tab.id }, "watcher");

                    chrome.tabs.reload(tab.id);
                }

                Logger.success("✅ All tabs refreshed", { count: tabs.length }, "watcher");

            } catch (err) {
                Logger.error("❌ Refresh error", err, "watcher");
            }
        }

        monitoringActive = false;

    }, 15000);
}


// ===========================
// TAB CREATED
// ===========================

chrome.tabs.onCreated.addListener(async (tab) => {

    Logger.groupCollapsed(`Tab Created: ${tab.id}`, "tabs");

    const url = tab.pendingUrl || tab.url;

    // start 15s watcher once
    start15sWatcher();

    if (processingTabs[tab.id]) {
        Logger.debug("Already processing", { tabId: tab.id }, "tabs");
        Logger.groupEnd();
        return;
    }

    processingTabs[tab.id] = true;

    let dataToSend = null;

    try {
        dataToSend = await extractProxyFromUrl(url, tab.id, false);
    } catch (err) {
        Logger.error("Extract error", err, "tabs");
    }

    // ===========================
    // INVALID DATA → DO NOTHING
    // ===========================
    if (!dataToSend) {
        Logger.warning("No valid data → waiting 15s", { tabId: tab.id }, "tabs");

        delete processingTabs[tab.id];

        Logger.groupEnd();
        return;
    }

    // ===========================
    // VALID DATA → NORMAL PROCESS
    // ===========================

    processDone = true; 

    Logger.success("Valid data found → process start", { tabId: tab.id }, "tabs");

    chrome.tabs.create({ url: "https://accounts.google.com/" }, (newTab) => {

        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {

            if (tabId === newTab.id && changeInfo.status === "complete") {

                chrome.tabs.onUpdated.removeListener(listener);

                sendMessageToContentScript(
                    newTab.id,
                    { action: "startProcess", ...dataToSend },

                    () => {
                        Logger.success("Process OK", { tabId: newTab.id }, "tabs");
                        delete processingTabs[newTab.id];
                    },

                    () => {
                        Logger.error("Process FAIL", { tabId: newTab.id }, "tabs");
                        delete processingTabs[newTab.id];
                    }
                );
            }
        });
    });

    Logger.groupEnd();
});




// ===========================
// Gestion des tabs
// ===========================
chrome.webNavigation.onCompleted.addListener(async (details) => {
    Logger.groupCollapsed(`Navigation Completed: ${details.tabId}`, "chrome.webNavigation.onCompleted");
    Logger.debug("Navigation terminée", { tabId: details.tabId, url: details.url }, "chrome.webNavigation.onCompleted");

    const ignoredUrls = [
        "https://contacts.google.com",
        "https://www.google.com/maps",
        "https://trends.google.com/trends/",
    ];
    const monitoredPatterns = [
        "https://mail.google.com/mail",
        "https://workspace.google.com/",
        "https://accounts.google.com/",
        "https://accounts.google.com/signin/v2/",
        "https://myaccount.google.com/security",
        "https://gds.google.com/",
        "https://myaccount.google.com/interstitials/birthday",
        "https://gds.google.com/web/recoveryoptions",
        "https://gds.google.com/web/homeaddress",
    ];

    if (ignoredUrls.some((prefix) => details.url.startsWith(prefix))) {
        Logger.debug("URL ignorée", { url: details.url }, "chrome.webNavigation.onCompleted");
        Logger.groupEnd();
        return;
    }

    const storedDataJson = await chrome.storage.local.get("currentData");
    let dataToSend = storedDataJson.currentData;

    if (!dataToSend && details.url.startsWith("https://example.com/?rep")) {
        Logger.step("Extraction proxy depuis URL", { url: details.url }, "chrome.webNavigation.onCompleted");
        dataToSend = await extractProxyFromUrl(details.url, details.tabId, false);
        if (dataToSend) {
            Logger.success("Données proxy extraites", { dataKeys: Object.keys(dataToSend) }, "chrome.webNavigation.onCompleted");
            // Rediriger le tab vers Google Accounts
            Logger.step("Redirection vers Google Accounts", null, "chrome.webNavigation.onCompleted");
            chrome.tabs.update(details.tabId, {
                url: "https://accounts.google.com/",
            });
        } else {
            Logger.warning("Échec extraction proxy", { url: details.url }, "chrome.webNavigation.onCompleted");
            Logger.groupEnd();
            return;
        }
    } else if (!dataToSend) {
        Logger.debug("Aucune donnée à envoyer", null, "chrome.webNavigation.onCompleted");
        Logger.groupEnd();
        return;
    }

    let shouldProcess =
        details.url === "chrome://newtab/" ||
        monitoredPatterns.some(
            (pattern) =>
                details.url.includes(pattern) || details.url.startsWith(pattern),
        );

    if (!shouldProcess || processingTabs[details.tabId]) {
        Logger.debug("Traitement non requis", { shouldProcess, isProcessing: processingTabs[details.tabId] }, "chrome.webNavigation.onCompleted");
        Logger.groupEnd();
        return;
    }

    processingTabs[details.tabId] = true;
    Logger.info("Démarrage traitement navigation", { tabId: details.tabId, url: details.url }, "chrome.webNavigation.onCompleted");

    sendMessageToContentScript(
        details.tabId,
        { action: "startProcess", ...dataToSend },
        () => {
            Logger.success("Message envoyé avec succès", { tabId: details.tabId }, "chrome.webNavigation.onCompleted");
            delete processingTabs[details.tabId];
        },
        () => {
            Logger.error("Échec envoi message", { tabId: details.tabId }, "chrome.webNavigation.onCompleted");
            delete processingTabs[details.tabId];
        },
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));
    Logger.groupEnd();
});

// ===========================
// Gestion des messages
// ===========================

// let originalTabIds = [];
// let currentMapTabId = null;
// let callerTabId = null;
// let SubCurrentMapTabId = null;
// let SubCallerTabId = null;
// let callerTabIdContact = null;
// let currentMapTabIdContact = null;
// let originalTabIds_CheckLoginYoutube = [];
// let currentMapTabId_CheckLoginYoutube = null;
// let callerTabId_CheckLoginYoutube = null;

// chrome.runtime.onMessage.addListener((message, sender) => {

//     if (message.action === "Open_tab_CheckLoginYoutube") {
//         const senderTabId = sender.tab?.id ?? null;

//         chrome.tabs.query({}, tabs => {
//             originalTabIds_CheckLoginYoutube = tabs.map(t => t.id);
//             callerTabId_CheckLoginYoutube = senderTabId;

//             chrome.tabs.create({ url: message.url }, newTab => {
//                 currentMapTabId_CheckLoginYoutube = newTab.id;

//                 setTimeout(() => {
//                     chrome.scripting.executeScript(
//                         { target: { tabId: newTab.id }, files: ["ReportingActions.js"] },
//                         () => {
//                             chrome.storage.local.get("sentMessages", result => {
//                                 const sentMessages = result.sentMessages || [];
//                                 sentMessages.push({ TabId: newTab.id });
//                                 chrome.storage.local.set({ sentMessages }, () => {
//                                     chrome.tabs.sendMessage(newTab.id, {
//                                         action: "Data_Google_CheckLoginYoutube",
//                                         data: message.saveLocationData
//                                     });
//                                 });
//                             });
//                         }
//                     );
//                 }, 3000);
//             });
//         });
//     }

//     if (message.action === "Closed_tab_CheckLoginYoutube") {
//         setTimeout(() => {
//             if (!currentMapTabId_CheckLoginYoutube) return;

//             if (callerTabId_CheckLoginYoutube)
//                 chrome.tabs.sendMessage(callerTabId_CheckLoginYoutube, { action: "Closed_tab_Finished_CheckLoginYoutube" });

//             chrome.tabs.remove(currentMapTabId_CheckLoginYoutube, () => {
//                 currentMapTabId_CheckLoginYoutube = null;
//                 callerTabId_CheckLoginYoutube = null;

//                 chrome.tabs.query({}, tabs => {
//                     const currentIds = tabs.map(t => t.id);
//                     currentIds
//                         .filter(id => !originalTabIds_CheckLoginYoutube.includes(id))
//                         .forEach(id => chrome.tabs.remove(id));
//                     originalTabIds_CheckLoginYoutube = [];
//                 });
//             });
//         }, 3000);
//     }

//     if (message.action === "Open_tab") {
//         chrome.tabs.query({}, tabs => originalTabIds = tabs.map(t => t.id));
//         callerTabId = sender.tab?.id ?? null;

//         chrome.tabs.create({ url: message.url }, tab => {
//             currentMapTabId = tab.id;

//             setTimeout(() => {
//                 chrome.scripting.executeScript(
//                     { target: { tabId: tab.id }, files: ["ReportingActions.js"] },
//                     () => chrome.tabs.sendMessage(tab.id, {
//                         action: "Data_Google",
//                         data: message.saveLocationData
//                     })
//                 );
//             }, 1000);
//         });
//     }

//     if (message.action === "Sub_Open_tab") {
//         SubCallerTabId = sender.tab?.id ?? null;

//         chrome.tabs.create({ url: message.url }, tab => {
//             SubCurrentMapTabId = tab.id;

//             setTimeout(() => {
//                 chrome.scripting.executeScript(
//                     { target: { tabId: tab.id }, files: ["ReportingActions.js"] },
//                     () => chrome.tabs.sendMessage(tab.id, {
//                         action: "Sub_Data_Google",
//                         data: message.saveLocationData
//                     })
//                 );
//             }, 1000);
//         });
//     }

//     if (message.action === "Closed_tab") {
//         setTimeout(() => {
//             if (!currentMapTabId) return;

//             if (callerTabId)
//                 chrome.tabs.sendMessage(callerTabId, { action: "Closed_tab_Finished" });

//             chrome.tabs.remove(currentMapTabId, () => {
//                 currentMapTabId = null;
//                 callerTabId = null;

//                 chrome.tabs.query({}, tabs => {
//                     tabs.map(t => t.id)
//                         .filter(id => !originalTabIds.includes(id))
//                         .forEach(id => chrome.tabs.remove(id));
//                     originalTabIds = [];
//                 });
//             });
//         }, 4000);
//         return true;
//     }

//     if (message.action === "Sub_Closed_tab") {
//         setTimeout(() => {
//             if (!SubCurrentMapTabId) return;

//             if (SubCallerTabId)
//                 chrome.tabs.sendMessage(SubCallerTabId, { action: "Sub_Closed_tab_Finished" });

//             chrome.tabs.remove(SubCurrentMapTabId, () => {
//                 SubCurrentMapTabId = null;
//                 SubCallerTabId = null;
//             });
//         }, 3000);
//         return true;
//     }

//     if (message.action === "Open_tab_Add_Contact") {
//         callerTabIdContact = sender.tab?.id ?? null;

//         chrome.tabs.create({ url: message.url }, tab => {
//             currentMapTabIdContact = tab.id;

//             setTimeout(() => {
//                 chrome.scripting.executeScript(
//                     { target: { tabId: tab.id }, files: ["ReportingActions.js"] },
//                     () => chrome.tabs.sendMessage(tab.id, {
//                         action: "Data_Google_Add_Contact",
//                         data: message.saveLocationData,
//                         email: message.email
//                     })
//                 );
//             }, 1000);
//         });
//     }

//     if (message.action === "Closed_tab_Add_Contact") {
//         setTimeout(() => {
//             if (!currentMapTabIdContact) return;

//             if (callerTabIdContact)
//                 chrome.tabs.sendMessage(callerTabIdContact, { action: "Closed_tab_Finished_Add_Contact" });

//             chrome.tabs.remove(currentMapTabIdContact, () => {
//                 currentMapTabIdContact = null;
//                 callerTabIdContact = null;
//             });
//         }, 3000);
//         return true;
//     }
// });

// =====================
// Fonction sleep
// =====================
const sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    Logger.groupCollapsed(`Message Background: ${message.action}`, "chrome.runtime.onMessage");
    Logger.timeStart(`Message-${message.action}`, "chrome.runtime.onMessage");
    Logger.info("Nouveau message background reçu", {
        action: message.action,
        senderTabId: sender.tab?.id,
        senderUrl: sender.tab?.url
    }, "chrome.runtime.onMessage");

    try {


        // ==================== OPEN_TAB_CHECKLOGINYOUTUBE ====================
        if (message.action === "Open_tab_CheckLoginYoutube") {
            Logger.step("Action: Open_tab_CheckLoginYoutube", { url: message.url }, "chrome.runtime.onMessage");
            await sleep2(1000); // قبل الفتح

            const senderTabId = sender.tab?.id ?? null;
            Logger.debug("Sender tab ID", { senderTabId }, "chrome.runtime.onMessage");

            chrome.tabs.query({}, async (tabs) => {
                originalTabIds_CheckLoginYoutube = tabs.map((t) => t.id);
                callerTabId_CheckLoginYoutube = senderTabId;
                Logger.info("Configuration tabs YouTube", {
                    originalTabsCount: originalTabIds_CheckLoginYoutube.length,
                    callerTabId: callerTabId_CheckLoginYoutube
                }, "chrome.runtime.onMessage");

                chrome.tabs.create({ url: message.url }, async (newTab) => {
                    await sleep2(1000); // بعد الفتح
                    currentMapTabId_CheckLoginYoutube = newTab.id;
                    Logger.success("Nouvel onglet YouTube créé", { newTabId: newTab.id }, "chrome.runtime.onMessage");

                    chrome.scripting.executeScript(
                        {
                            target: { tabId: newTab.id },
                            files: ["utils.js", "ReportingActions.js"],
                        },
                        async () => {
                            await sleep2(500); // قبل الإرسال
                            Logger.step("Envoi données CheckLogin YouTube", null, "chrome.runtime.onMessage");
                            chrome.tabs.sendMessage(newTab.id, {
                                action: "Data_Google_CheckLoginYoutube",
                                data: message.saveLocationData,
                            });
                        },
                    );
                });
            });
        }

        if (message.action === "Closed_tab_CheckLoginYoutube") {
            Logger.step("Action: Closed_tab_CheckLoginYoutube", null, "chrome.runtime.onMessage");
            await sleep2(1000); // قبل الغلق

            if (currentMapTabId_CheckLoginYoutube) {
                Logger.info("Fermeture onglet YouTube", { tabId: currentMapTabId_CheckLoginYoutube }, "chrome.runtime.onMessage");

                if (callerTabId_CheckLoginYoutube) {
                    Logger.step("Envoi message de fin à l'appelant", { callerTabId: callerTabId_CheckLoginYoutube }, "chrome.runtime.onMessage");
                    chrome.tabs.sendMessage(callerTabId_CheckLoginYoutube, {
                        action: "Closed_tab_Finished_CheckLoginYoutube",
                    });
                }

                chrome.tabs.remove(currentMapTabId_CheckLoginYoutube, async () => {
                    await sleep2(500); // بعد الغلق
                    Logger.success("Onglet YouTube fermé", { tabId: currentMapTabId_CheckLoginYoutube }, "chrome.runtime.onMessage");
                    currentMapTabId_CheckLoginYoutube = null;
                    callerTabId_CheckLoginYoutube = null;
                    originalTabIds_CheckLoginYoutube = [];
                });
            } else {
                Logger.warning("Aucun onglet YouTube à fermer", null, "chrome.runtime.onMessage");
            }
        }

        // ==================== OPEN_TAB PRINCIPAL ====================
        if (message.action === "Open_tab") {
            Logger.step("Action: Open_tab", { url: message.url }, "chrome.runtime.onMessage");
            await sleep2(1000); // قبل الفتح
            callerTabId = sender.tab?.id ?? null;
            Logger.debug("Configuration appelant", { callerTabId }, "chrome.runtime.onMessage");

            chrome.tabs.create({ url: message.url }, async (tab) => {
                await sleep2(1000); // بعد الفتح
                currentMapTabId = tab.id;
                Logger.success("Nouvel onglet créé", { tabId: tab.id, url: message.url }, "chrome.runtime.onMessage");

                chrome.scripting.executeScript(
                    {
                        target: { tabId: tab.id },
                        files: ["utils.js", "ReportingActions.js"],
                    },
                    async () => {
                        await sleep2(500);
                        Logger.step("Envoi données Google", { tabId: tab.id }, "chrome.runtime.onMessage");
                        chrome.tabs.sendMessage(tab.id, {
                            action: "Data_Google",
                            data: message.saveLocationData,
                        });
                    },
                );
            });
        }

        if (message.action === "Closed_tab") {
            Logger.step("Action: Closed_tab", null, "chrome.runtime.onMessage");
            await sleep2(1000); // قبل الغلق

            if (currentMapTabId) {
                Logger.info("Fermeture onglet", { tabId: currentMapTabId }, "chrome.runtime.onMessage");

                if (callerTabId) {
                    Logger.step("Envoi message de fin à l'appelant", { callerTabId }, "chrome.runtime.onMessage");
                    chrome.tabs.sendMessage(callerTabId, { action: "Closed_tab_Finished" });
                }

                chrome.tabs.remove(currentMapTabId, async () => {
                    await sleep2(500); // بعد الغلق
                    Logger.success("Onglet fermé", { tabId: currentMapTabId }, "chrome.runtime.onMessage");
                    currentMapTabId = null;
                    callerTabId = null;
                });
            } else {
                Logger.warning("Aucun onglet à fermer", null, "chrome.runtime.onMessage");
            }
        }

        // ==================== SUB_OPEN_TAB ====================
        if (message.action === "Sub_Open_tab") {
            Logger.step("Action: Sub_Open_tab", { url: message.url }, "chrome.runtime.onMessage");
            await sleep2(500);
            SubCallerTabId = sender.tab?.id ?? null;
            Logger.debug("Configuration sous-appelant", { SubCallerTabId }, "chrome.runtime.onMessage");

            chrome.tabs.create({ url: message.url }, async (tab) => {
                await sleep2(500);
                SubCurrentMapTabId = tab.id;
                Logger.success("Sous-onglet créé", { tabId: tab.id, url: message.url }, "chrome.runtime.onMessage");

                chrome.scripting.executeScript(
                    {
                        target: { tabId: tab.id },
                        files: ["utils.js", "ReportingActions.js"],
                    },
                    async () => {
                        await sleep2(300);
                        Logger.step("Envoi données sous-Google", { tabId: tab.id }, "chrome.runtime.onMessage");
                        chrome.tabs.sendMessage(tab.id, {
                            action: "Sub_Data_Google",
                            data: message.saveLocationData,
                        });
                    },
                );
            });
        }

        if (message.action === "Sub_Closed_tab") {
            Logger.step("Action: Sub_Closed_tab", null, "chrome.runtime.onMessage");
            await sleep2(500);

            if (SubCurrentMapTabId) {
                Logger.info("Fermeture sous-onglet", { tabId: SubCurrentMapTabId }, "chrome.runtime.onMessage");

                if (SubCallerTabId) {
                    Logger.step("Envoi message de fin au sous-appelant", { SubCallerTabId }, "chrome.runtime.onMessage");
                    chrome.tabs.sendMessage(SubCallerTabId, {
                        action: "Sub_Closed_tab_Finished",
                    });
                }

                chrome.tabs.remove(SubCurrentMapTabId, async () => {
                    await sleep2(300);
                    Logger.success("Sous-onglet fermé", { tabId: SubCurrentMapTabId }, "chrome.runtime.onMessage");
                    SubCurrentMapTabId = null;
                    SubCallerTabId = null;
                });
            } else {
                Logger.warning("Aucun sous-onglet à fermer", null, "chrome.runtime.onMessage");
            }
        }

        // ==================== ADD_CONTACT ====================
        if (message.action === "Open_tab_Add_Contact") {
            Logger.step("Action: Open_tab_Add_Contact", { url: message.url, email: message.email }, "chrome.runtime.onMessage");
            await sleep2(500);
            callerTabIdContact = sender.tab?.id ?? null;
            Logger.debug("Configuration contact", { callerTabIdContact, email: message.email }, "chrome.runtime.onMessage");

            chrome.tabs.create({ url: message.url }, async (tab) => {
                await sleep2(500);
                currentMapTabIdContact = tab.id;
                Logger.success("Onglet contact créé", { tabId: tab.id, url: message.url }, "chrome.runtime.onMessage");

                chrome.scripting.executeScript(
                    {
                        target: { tabId: tab.id },
                        files: ["utils.js", "ReportingActions.js"],
                    },
                    async () => {
                        await sleep2(300);
                        Logger.step("Envoi données ajout contact", { tabId: tab.id, email: message.email }, "chrome.runtime.onMessage");
                        chrome.tabs.sendMessage(tab.id, {
                            action: "Data_Google_Add_Contact",
                            data: message.saveLocationData,
                            email: message.email,
                        });
                    },
                );
            });
        }

        if (message.action === "Closed_tab_Add_Contact") {
            Logger.step("Action: Closed_tab_Add_Contact", null, "chrome.runtime.onMessage");
            await sleep2(500);

            if (currentMapTabIdContact) {
                Logger.info("Fermeture onglet contact", { tabId: currentMapTabIdContact }, "chrome.runtime.onMessage");

                if (callerTabIdContact) {
                    Logger.step("Envoi message de fin contact", { callerTabIdContact }, "chrome.runtime.onMessage");
                    chrome.tabs.sendMessage(callerTabIdContact, {
                        action: "Closed_tab_Finished_Add_Contact",
                    });
                }

                chrome.tabs.remove(currentMapTabIdContact, async () => {
                    await sleep2(300);
                    Logger.success("Onglet contact fermé", { tabId: currentMapTabIdContact }, "chrome.runtime.onMessage");
                    currentMapTabIdContact = null;
                    callerTabIdContact = null;
                });
            } else {
                Logger.warning("Aucun onglet contact à fermer", null, "chrome.runtime.onMessage");
            }
        }

        if (message.action === "CAPTURE_FULL_PAGE") {
            Logger.groupCollapsed("CAPTURE_FULL_PAGE", "chrome.runtime.onMessage");
            Logger.info("Message reçu pour capture full page", message, "chrome.runtime.onMessage");

            const tabId = message.tabId || sender.tab?.id;
            let imageName = message.imageName;

            if (!tabId || !imageName) {
                Logger.error("Paramètres manquants", { tabId, imageName }, "chrome.runtime.onMessage");
                sendResponse({ ok: false, error: "No tabId or imageName" });
                Logger.groupEnd();
                return;
            }

            Logger.info("Configuration capture", { tabId, imageName }, "chrome.runtime.onMessage");
            Logger.step("Lancement de la capture full page", null, "chrome.runtime.onMessage");

            captureFullPage(tabId, imageName)
                .then(() => {
                    Logger.success("Capture réussie", { imageName }, "chrome.runtime.onMessage");
                    sendResponse({ ok: true });
                })
                .catch((err) => {
                    Logger.error("Erreur lors de la capture", err, "chrome.runtime.onMessage");
                    sendResponse({ ok: false, error: err.message });
                });

            Logger.groupEnd();
            // Important pour que sendResponse fonctionne de façon asynchrone
            return true;
        }

    } catch (error) {
        Logger.error("Erreur dans le listener de messages background", error, "chrome.runtime.onMessage");
    }

    Logger.timeEnd(`Message-${message.action}`, "chrome.runtime.onMessage");
    Logger.groupEnd();
});

// ==========================
// Gestion des erreurs de proxy
// ==========================

let badProxyFileDownloaded = false;

chrome.webRequest.onErrorOccurred.addListener(
    async (details) => {
        Logger.groupCollapsed(`Erreur Proxy: ${details.error}`, "chrome.webRequest.onErrorOccurred");
        Logger.debug("Erreur de requête détectée", {
            url: details.url,
            error: details.error,
            tabId: details.tabId
        }, "chrome.webRequest.onErrorOccurred");

        const proxyErrors = [
            "ERR_PROXY_CONNECTION_FAILED",
            "ERR_TUNNEL_CONNECTION_FAILED",
            "ERR_PROXY_AUTH_FAILED",
            "ERR_TOO_MANY_RETRIES",
            "ERR_CONNECTION_RESET",
            "ERR_CONNECTION_REFUSED",
            "ERR_TIMED_OUT",
            "NS_ERROR_NET_TIMEOUT",
        ];

        if (proxyErrors.some((err) => details.error.includes(err))) {
            Logger.warning("Erreur proxy détectée", { error: details.error, url: details.url }, "chrome.webRequest.onErrorOccurred");

            if (!badProxyFileDownloaded) {
                Logger.step("Appel openNewTabAndDownloadFile (context=background)", null, "chrome.webRequest.onErrorOccurred");
                await openNewTabAndDownloadFile("bad_proxy", "background");
                badProxyFileDownloaded = true;
                Logger.success("Fichier bad_proxy marqué comme téléchargé", null, "chrome.webRequest.onErrorOccurred");
                throw new Error("🛑 HARD STOP: Proxy invalide détecté");
            } else {
                Logger.debug("Fichier bad_proxy déjà téléchargé", null, "chrome.webRequest.onErrorOccurred");
            }
        } else {
            Logger.debug("Erreur non-proxy ignorée", { error: details.error }, "chrome.webRequest.onErrorOccurred");
        }

        Logger.groupEnd();
    },
    { urls: ["<all_urls>"] },
);

// ==========================
// Gestion des downloads
// ==========================
// ✅ Daalé : openNewTabAndDownloadFile(etat, context)
//    - Importée depuis utils.js
//    - Contexte "background" : utilise Chrome Downloads API
//    - Contexte "content" : utilise DOM manipulation
//    - Détection automatique: typeof window === "undefined" ? "background" : "content"
// }





// ==========================
// Gestion des downloads
// ==========================

// async function openNewTabAndDownloadFile(etat) {
//     Logger.groupCollapsed("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
//     Logger.timeStart("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
//     Logger.info("Début téléchargement fichier", { etat }, "openNewTabAndDownloadFile");

//     try {
//         // Pause 3s avant traitement
//         // await new Promise(resolve => setTimeout(resolve, 3000));

//         // Lire data.txt
//         Logger.step("Lecture du fichier data.txt", null, "openNewTabAndDownloadFile");
//         const dataTxtPath = chrome.runtime.getURL("data.txt");
//         const response = await fetch(dataTxtPath);
//         if (!response.ok) {
//             Logger.error("Erreur téléchargement data.txt", { status: response.status, statusText: response.statusText }, "openNewTabAndDownloadFile");
//             throw new Error(`Erreur téléchargement data.txt: ${response.statusText}`);
//         }

//         const text = await response.text();
//         const lines = text.split("\n").map((l) => l.trim());
//         if (!lines[0]) {
//             Logger.error("Contenu data.txt invalide", { lines }, "openNewTabAndDownloadFile");
//             throw new Error("data.txt khawi ou invalid");
//         }

//         const session_id = lines[0];
//         Logger.success("Session ID récupéré", { session_id }, "openNewTabAndDownloadFile");

//         // Lire email men localStorage
//         Logger.step("Lecture email depuis localStorage", null, "openNewTabAndDownloadFile");
//         const stored = await chrome.storage.local.get("storedEmail");
//         const trimmedEmail = stored.storedEmail?.trim();
//         if (!trimmedEmail || !session_id) {
//             Logger.error("Valeurs manquantes", { trimmedEmail, session_id }, "openNewTabAndDownloadFile");
//             throw new Error("valeurs manquantes f data.txt");
//         }
//         Logger.success("Email récupéré", { email: trimmedEmail }, "openNewTabAndDownloadFile");

//         // Contenu fichier
//         const fileContent = `session_id:${session_id}_Email:${trimmedEmail}_etat:${etat}`;
//         Logger.debug("Contenu du fichier généré", { fileContent }, "openNewTabAndDownloadFile");

//         const blob = new Blob([fileContent], { type: "text/plain" });

//         const reader = new FileReader();
//         reader.onloadend = () => {
//             const dataUrl = reader.result;

//             // Filename dynamique : session_id_email_etat.txt
//             const filename = `${session_id}_${trimmedEmail}_${etat}.txt`;
//             Logger.step("Téléchargement du fichier", { filename }, "openNewTabAndDownloadFile");

//             chrome.downloads.download({
//                 url: dataUrl,
//                 filename: filename,
//                 conflictAction: "uniquify",
//                 saveAs: false,
//             }, (downloadId) => {
//                 if (downloadId) {
//                     Logger.success("Téléchargement lancé", { downloadId, filename }, "openNewTabAndDownloadFile");
//                 } else {
//                     Logger.error("Échec du téléchargement", chrome.runtime.lastError, "openNewTabAndDownloadFile");
//                 }
//             });
//         };
//         reader.readAsDataURL(blob);

//     } catch (error) {
//         Logger.error("Erreur dans openNewTabAndDownloadFile", error, "openNewTabAndDownloadFile");
//     }

//     Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
//     Logger.groupEnd();
// }

