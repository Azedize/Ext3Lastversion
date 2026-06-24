// utils.js
// =========================================================
// REDIRECT URLS
// LOG STORAGE (SILENT)
// CLEAR STORAGE (SILENT)
// =========================================================

const redirectUrls = [
    "https://myaccount.google.com/interstitials/birthday",
    "https://gds.google.com/web/recoveryoptions",
    "https://gds.google.com/web/homeaddress",
];





const Logger={
    levels:{
        info:{icon:"ℹ️",method:"log",style:"color:#1a73e8;background:#e8f0fe;padding:2px 6px;border-radius:4px;"},
        success:{icon:"✅",method:"log",style:"color:#0f9d58;background:#e6f4ea;padding:2px 6px;border-radius:4px;"},
        warning:{icon:"⚠️",method:"warn",style:"color:#d97706;background:#fffbeb;padding:2px 6px;border-radius:4px;"},
        error:{icon:"❌",method:"error",style:"color:#b00020;background:#fce8e6;padding:2px 6px;border-radius:4px;"},
        debug:{icon:"🐛",method:"log",style:"color:#111;background:#eef2ff;padding:2px 6px;border-radius:4px;font-weight:600;"}
    },

    activeGroups:new Set(),

    timestamp(){return new Date().toISOString();},
    formatContext(c){return c?` [${c}]`:"";},
    formatHeader(l,c){
        const m=`${this.levels[l].icon} ${l.toUpperCase()}${this.formatContext(c)}`;
        return `%c${m}%c ${this.timestamp()}`;
    },

    log(l,m,d,c){
        if(!this.levels[l])l="info";
        const {method,style}=this.levels[l];
        const h=this.formatHeader(l,c);
        const p=[h,style,"color:#999;font-size:.85em;"];
        if(m!=null)p.push(m);
        if(d!=null)p.push(d);
        console[method](...p);
    },

    info(m,d,c){this.log("info",m,d,c);},
    success(m,d,c){this.log("success",m,d,c);},
    warning(m,d,c){this.log("warning",m,d,c);},
    error(m,d,c){this.log("error",m,d,c);},
    debug(m,d,c){this.log("debug",m,d,c);},

    groupCollapsed(t,c){
        console.groupCollapsed(`%c${this.levels.debug.icon} ${t}${this.formatContext(c)}`,"color:#111;background:#eef2ff;font-weight:700;padding:2px 6px;border-radius:4px;");
    },

    group(t,c){
        console.group(`%c${t}${this.formatContext(c)}`,"color:#111;background:#f1f5ff;font-weight:700;padding:2px 6px;border-radius:4px;");
    },

    groupEnd(){console.groupEnd();},

    table(l,d,c){
        this.groupCollapsed(`📊 ${l}${Array.isArray(d)?` (${d.length})`:""}`,c);
        if(Array.isArray(d)&&!d.length)this.warning(`Empty array: ${l}`,d,c);
        if(Array.isArray(d)||this.isPlainObject(d))console.table(d);
        else this.warning(`Unable to table ${l}`,d,c);
        this.groupEnd();
    },

    inspect(v,l="Value",c){
        if(this.isEmpty(v)&&v!==Object(v))return this.warning(`${l} empty`,v,c);
        if(Array.isArray(v))return this.table(l,v,c);
        if(v&&typeof v==="object"){
            this.groupCollapsed(`📦 ${l}`,c);
            console.dir(v,{depth:null});
            return this.groupEnd();
        }
        this.info(`${l}:`,v,c);
    },

    isEmpty(v){
        return v==null||v===""||
        (typeof v==="string"&&v.trim()==="")||
        (Array.isArray(v)&&!v.length)||
        (this.isPlainObject(v)&&!Object.keys(v).length);
    },

    isPlainObject(v){return v&&typeof v==="object"&&v.constructor===Object;},

    timeStart(l,c){console.time(`${l}${this.formatContext(c)}`);},
    timeEnd(l,c){console.timeEnd(`${l}${this.formatContext(c)}`);},

    action(m,d,c){this.groupCollapsed(`🧭 ACTION: ${m}`,c);if(d!=null)console.table([d]);this.groupEnd();},
    element(m,d,c){this.groupCollapsed(`🔎 ELEMENT: ${m}`,c);if(d!=null)console.table([d]);this.groupEnd();},
    scenario(m,d,c){this.groupCollapsed(`📂 SCENARIO: ${m}`,c);if(d!=null)console.table(Array.isArray(d)?d:[d]);this.groupEnd();},
    data(m,d,c){this.groupCollapsed(`📦 DATA: ${m}`,c);if(d!=null)console.dir(d,{depth:null});this.groupEnd();},

    step(m,d,c){this.info(`➡️ ${m}`,d,c);},

    completed(m,d,c){
        console.groupCollapsed(`%c✅ COMPLETED: ${m}${this.formatContext(c)}`,"color:#0f9d58;background:#e6f4ea;font-weight:700;padding:2px 6px;border-radius:4px;");
        if(d!=null)console.table([d]);
        this.groupEnd();
    },

    processing(m,d,c){
        const r=m.includes("✅ DÉJÀ TRAITÉE");
        const bg=r?"#b00020":"#1a73e8";
        console.groupCollapsed(`%c🔄 PROCESSING: ${m}${this.formatContext(c)}`,"color:#fff;background:"+bg+";font-weight:700;padding:2px 6px;border-radius:4px;");
        if(d!=null)console.table([d]);
        this.groupEnd();
    },

    upcoming(m,d,c){
        console.groupCollapsed(`%c⏳ À TRAITER: ${m}${this.formatContext(c)}`,"color:#666;background:#f5f5f5;font-weight:700;padding:2px 6px;border-radius:4px;");
        if(d!=null)console.table([d]);
        this.groupEnd();
    },

    alertProcess(m,d,c){
        console.groupCollapsed(`%c🚨 ${m}${this.formatContext(c)}`,"color:#fff;background:linear-gradient(90deg,#d32f2f,#f48fb1);font-weight:700;padding:6px 10px;border-radius:6px;border:2px solid #fff;");
        if(d!=null)console.table([d]);
        this.groupEnd();
    },

    startProcessGroup(n,c){
        const k=`${n}-${c||"default"}`;
        if(!this.activeGroups.has(k)){
            this.activeGroups.add(k);
            console.group(`%c🚀 PROCESS: ${n}${this.formatContext(c)}`,"color:#fff;background:#1a73e8;font-weight:700;padding:4px 8px;border-radius:6px;");
            this.info(`Début: ${n}`,null,c);
            return true;
        }
        return false;
    },

    endProcessGroup(n,c){
        const k=`${n}-${c||"default"}`;
        if(this.activeGroups.has(k)){
            this.success(`Fin: ${n}`,null,c);
            console.groupEnd();
            this.activeGroups.delete(k);
            return true;
        }
        return false;
    },

    isProcessGroupActive(n,c){
        return this.activeGroups.has(`${n}-${c||"default"}`);
    }
};



function saveLog(message) {
    Logger.groupCollapsed("saveLog", "saveLog");
    Logger.timeStart("saveLog", "saveLog");

    Logger.info("Message reçu", message, "saveLog");

    const logMessage = `[${new Date().toISOString()}] ${message}`;
    Logger.debug("Message formaté", logMessage, "saveLog");

    Logger.step("Lecture des logs existants depuis chrome.storage.local...", null, "saveLog");
    chrome.storage.local.get({ logs: [] }, (data) => {
        Logger.inspect(data, `Données récupérées: ${Object.keys(data).length} clés (${data.logs ? data.logs.length : 0} logs)`, "saveLog");

        const logs = data.logs || [];
        Logger.inspect(logs, `Logs actuels (${logs.length} items)`, "saveLog");

        logs.push(logMessage);
        Logger.success("Log ajouté en mémoire", null, "saveLog");

        Logger.step("Sauvegarde des logs...", null, "saveLog");
        chrome.storage.local.set({ logs }, () => {
            if (chrome.runtime.lastError) {
                Logger.error("Erreur lors de la sauvegarde", chrome.runtime.lastError, "saveLog");
            } else {
                Logger.success("Logs sauvegardés avec succès", null, "saveLog");
            }
            Logger.timeEnd("saveLog", "saveLog");
            Logger.groupEnd();
        });
    });
}





function clearChromeStorageLocal() {
    Logger.groupCollapsed("clearChromeStorageLocal", "clearChromeStorageLocal");
    Logger.timeStart("clearChromeStorageLocal", "clearChromeStorageLocal");
    Logger.warning("Suppression de toutes les données chrome.storage.local...", null, "clearChromeStorageLocal");

    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                Logger.error("Erreur lors du clear", chrome.runtime.lastError, "clearChromeStorageLocal");
                Logger.timeEnd("clearChromeStorageLocal", "clearChromeStorageLocal");
                Logger.groupEnd();
                reject(chrome.runtime.lastError);
            } else {
                Logger.success("chrome.storage.local vidé avec succès", null, "clearChromeStorageLocal");
                Logger.timeEnd("clearChromeStorageLocal", "clearChromeStorageLocal");
                Logger.groupEnd();
                resolve();
            }
        });
    });
}




// =========================================================
// FICHIER UTILITAIRE : GESTION D'ÉLÉMENTS
// =========================================================

// =========================================================
// ATTENDRE LA PRÉSENCE D'UN ÉLÉMENT SUR LA PAGE
// xpath : XPath de l'élément
// timeout : Durée maximale d'attente en secondes (défaut 30s)
// retourne : true si trouvé, false sinon
// =========================================================

async function waitForElement(xpath, timeout = 30) {
    Logger.groupCollapsed("waitForElement", "waitForElement");
    Logger.timeStart("waitForElement", "waitForElement");
    Logger.element(`Attente d'un élément XPath: "${xpath}" (timeout: ${timeout}s)`, { xpath, timeout }, "waitForElement");

    const start = Date.now();
    const end = start + timeout * 1000;
    let attempt = 0;

    while (Date.now() < end) {
        attempt++;
        try {
            const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (el) {
                Logger.element(`Element trouvé à l'essai #${attempt}`, { xpath, attempt, elapsedSeconds: ((Date.now() - start) / 1000).toFixed(2) }, "waitForElement");
                Logger.inspect(el, "Element DOM trouvé", "waitForElement");
                Logger.timeEnd("waitForElement", "waitForElement");
                Logger.groupEnd();
                return true;
            }
        } catch (e) {
            Logger.error("XPath error", e, "waitForElement");
        }
        Logger.step(`Try #${attempt}...`, null, "waitForElement");
        await sleep(1000);
    }

    Logger.warning("Timeout, not found", { xpath, timeout }, "waitForElement");
    Logger.timeEnd("waitForElement", "waitForElement");
    Logger.groupEnd();
    return false;
}





// =========================================================
// RÉCUPÉRER LE TEXTE D'UN ÉLÉMENT VIA XPATH
// xpath : XPath de l'élément
// retourne : texte de l'élément ou null si introuvable
// =========================================================

function getElementTextByXPath(xpath) {
    Logger.groupCollapsed("getElementTextByXPath", "getElementTextByXPath");
    Logger.timeStart("getElementTextByXPath", "getElementTextByXPath");

    try {
        const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const result = el ? el.textContent.trim() : null;

        if (result !== null) {
            Logger.success(`Element trouvé: "${xpath}" → "${result}"`, result, "getElementTextByXPath");
        } else {
            Logger.warning(`Element introuvable: "${xpath}"`, xpath, "getElementTextByXPath");
        }

        Logger.timeEnd("getElementTextByXPath", "getElementTextByXPath");
        Logger.groupEnd();
        return result;
    } catch (e) {
        Logger.error("XPath error", e, "getElementTextByXPath");
        Logger.timeEnd("getElementTextByXPath", "getElementTextByXPath");
        Logger.groupEnd();
        return null;
    }
}

// =========================================================
// TROUVER UN ÉLÉMENT VIA XPATH AVEC ATTENTE OPTIONNELLE
// xpath : XPath de l'élément
// timeout : durée maximale d'attente en secondes (défaut 10s)
// obligatoire : si true, log d'erreur si l'élément n'est pas trouvé
// type : type d'élément optionnel pour traitement futur
// retourne : élément DOM trouvé ou null
// =========================================================

// async function findElementByXPath( xpath, timeout = 10, obligatoire = false , type = undefined) {
//     const end = Date.now() + timeout * 1000;
//     while (Date.now() < end) {
//         try {
//         const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
//         if (el) return el;
//         } catch {}
//         await sleep(500);
//     }
//     return null;
// }





async function findElementByXPath(xpath, timeout = 10, obligatoire = false, type = undefined) {
    Logger.groupCollapsed("findElementByXPath", "findElementByXPath");
    Logger.timeStart("findElementByXPath", "findElementByXPath");
    Logger.element(`Recherche d'élément XPath: "${xpath}" (timeout: ${timeout}s, obligatoire: ${obligatoire})`, { xpath, timeout, obligatoire, type }, "findElementByXPath");

    const start = Date.now(), end = start + timeout * 1000;
    let attempt = 0;

    while (Date.now() < end) {
        attempt++;
        try {
            const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (el) {
                Logger.element("Element trouvé", { xpath, elapsedSeconds: ((Date.now() - start) / 1000).toFixed(2), attempt }, "findElementByXPath");
                Logger.inspect(el, "Element DOM trouvé", "findElementByXPath");
                Logger.timeEnd("findElementByXPath", "findElementByXPath");
                Logger.groupEnd();
                return el;
            }
        } catch (e) {
            Logger.error("XPath error", e, "findElementByXPath");
        }

        Logger.step(`Try #${attempt}`, null, "findElementByXPath");
        await sleep(500);
    }

    Logger.warning(`Timeout after ${((Date.now() - start) / 1000).toFixed(2)}s`, { xpath, timeout }, "findElementByXPath");
    if (obligatoire) Logger.error("Element obligatoire introuvable", { xpath, timeout }, "findElementByXPath");

    Logger.timeEnd("findElementByXPath", "findElementByXPath");
    Logger.groupEnd();

    return null;
}


// =========================================================
// === Attendre qu'une action spécifique du background soit reçue ===
// expectedAction : nom de l'action attendue
// retourne : Promise résolue lorsque le message attendu est reçu
// =========================================================

// function waitForBackgroundToFinish(expectedAction) {
//     return new Promise((resolve) => {
//         const interval = setInterval(() => {}, 1000); // juste attente silencieuse
//         const listener = (message) => {
//         if (message.action === expectedAction) {
//             clearInterval(interval);
//             chrome.runtime.onMessage.removeListener(listener);
//             resolve();
//         }
//         };
//         chrome.runtime.onMessage.addListener(listener);
//     });
// }


function waitForBackgroundToFinish(expectedAction) {
    Logger.groupCollapsed("waitForBackgroundToFinish", "waitForBackgroundToFinish");
    Logger.timeStart("waitForBackgroundToFinish", "waitForBackgroundToFinish");

    return new Promise((resolve) => {
        let seconds = 0;

        const interval = setInterval(() => {
            Logger.step(`Waiting "${expectedAction}"... ${++seconds}s`, null, "waitForBackgroundToFinish");
        }, 1000);

        const listener = (msg) => {
            if (msg.action === expectedAction) {
                clearInterval(interval);
                chrome.runtime.onMessage.removeListener(listener);

                Logger.success(`Received "${expectedAction}" after ${seconds}s`, msg, "waitForBackgroundToFinish");
                Logger.timeEnd("waitForBackgroundToFinish", "waitForBackgroundToFinish");
                Logger.groupEnd();
                resolve();
            }
        };

        chrome.runtime.onMessage.addListener(listener);
    });
}

// =========================================================
// === Compter le nombre d'éléments correspondant à un XPath ===
// xpath : XPath des éléments
// retourne : nombre d'éléments trouvés
// =========================================================

function getElementCountByXPath(xpath) {
    Logger.groupCollapsed("getElementCountByXPath", "getElementCountByXPath");
    Logger.timeStart("getElementCountByXPath", "getElementCountByXPath");

    let count = 0;
    try {
        const snapshot = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        count = snapshot.snapshotLength;
        Logger.success(`Found ${count} element(s) for XPath: "${xpath}"`, xpath, "getElementCountByXPath");
    } catch (e) {
        Logger.error("XPath error", e, "getElementCountByXPath");
    }

    Logger.timeEnd("getElementCountByXPath", "getElementCountByXPath");
    Logger.groupEnd();
    return count;
}

// =========================================================
// === Générer un identifiant unique ===
// retourne : string unique basé sur timestamp + random
// =========================================================

function genererIdUnique() {
    Logger.groupCollapsed("genererIdUnique", "genererIdUnique");
    Logger.timeStart("genererIdUnique", "genererIdUnique");

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const idUnique = `${timestamp}-${random}`;

    Logger.success("ID généré", idUnique, "genererIdUnique");

    Logger.timeEnd("genererIdUnique", "genererIdUnique");
    Logger.groupEnd();

    return idUnique;
}

// =========================================================
// === Ajouter un ID unique à chaque action et sous-action ===
// actions : tableau d'objets action
// =========================================================

function addUniqueIdsToActions(actions) {
    Logger.groupCollapsed("addUniqueIdsToActions", "addUniqueIdsToActions");
    Logger.timeStart("addUniqueIdsToActions", "addUniqueIdsToActions");

    actions.forEach((action, index) => {
        action.id = genererIdUnique();

        Logger.success(`Action #${index} ID généré`, action.id, "addUniqueIdsToActions");

        if (action.sub_action && Array.isArray(action.sub_action)) {
            Logger.debug(`Action #${index} a des sous-actions, génération récursive...`, action.sub_action, "addUniqueIdsToActions");
            addUniqueIdsToActions(action.sub_action);
        }
    });

    Logger.timeEnd("addUniqueIdsToActions", "addUniqueIdsToActions");
    Logger.groupEnd();
}








// =========================================================
// === Pause asynchrone silencieuse ===
// ms : durée en millisecondes
// retourne : Promise résolue après la pause
// =========================================================

async function sleep(ms) {
    Logger.groupCollapsed("sleep", "sleep");
    Logger.timeStart("sleep", "sleep");

    Logger.step(`Attente de ${ms}ms...`, null, "sleep");
    await new Promise((resolve) => setTimeout(resolve, ms));

    Logger.success("Attente terminée", { ms }, "sleep");
    Logger.timeEnd("sleep", "sleep");
    Logger.groupEnd();
}






// =========================================================
// === Télécharger les logs depuis le stockage local ===
// email : email utilisé dans le nom du fichier
// =========================================================

async function downloadLogs(email) {
    Logger.groupCollapsed("downloadLogs", "downloadLogs");
    Logger.timeStart("downloadLogs", "downloadLogs");

    try {
        Logger.info("Début du processus capture & logs", email, "downloadLogs");

        // 1️⃣ envoyer message pour background captureFullPage
        Logger.step("Envoi du message à background pour screenshot...", null, "downloadLogs");
        const screenshotResult = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: "CAPTURE_FULL_PAGE", imageName: email },
                (response) => {
                    Logger.inspect(response, "Réponse du background", "downloadLogs");
                    resolve(response);
                }
            );
        });

        Logger.success("Screenshot terminé, attente de 3s avant lecture des logs...", screenshotResult, "downloadLogs");
        await sleep(3000);

        // 2️⃣ récupérer les logs
        const logsData = await new Promise((resolve) => {
            chrome.storage.local.get({ logs: [] }, (data) => resolve(data.logs));
        });

        if (!logsData.length) {
            Logger.warning("Aucun log trouvé à télécharger", null, "downloadLogs");
            Logger.timeEnd("downloadLogs", "downloadLogs");
            Logger.groupEnd();
            return;
        }

        Logger.table("Logs récupérés", logsData, "downloadLogs");

        // 3️⃣ créer et déclencher le téléchargement
        const blob = new Blob([logsData.join("\n")], { type: "text/plain" });
        const reader = new FileReader();
        reader.onloadend = () => {
            const link = document.createElement("a");
            link.href = reader.result;
            link.download = `log_${new Date().toISOString().replace(/[:.]/g, "-")}_${email}.txt`;
            link.click();
            Logger.success("Logs téléchargés avec succès", null, "downloadLogs");
        };
        reader.readAsDataURL(blob);

    } catch (err) {
        Logger.error("Erreur dans downloadLogs", err, "downloadLogs");
    }

    Logger.timeEnd("downloadLogs", "downloadLogs");
    Logger.groupEnd();
}




// =========================================================
// === Ouvrir un nouvel onglet et télécharger un fichier (session + email) ===
// etat : état à inclure dans le nom du fichier
// =========================================================


 

async function openNewTabAndDownloadFile(etat, context = "auto") {
    Logger.groupCollapsed("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
    Logger.timeStart("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
    Logger.info("Début téléchargement", { etat, context }, "openNewTabAndDownloadFile");

    
    try {
        if (context === "auto") {
            context = typeof window === "undefined" ? "background" : "content";
            Logger.debug("Contexte détecté automatiquement", { context }, "openNewTabAndDownloadFile");
        }

        // 📧 Extraction des données communes
        Logger.step("Extraction des données", null, "openNewTabAndDownloadFile");
        const stored = await chrome.storage.local.get(["storedEmail", "profile_email"]);
        const email = stored.storedEmail?.trim() || stored.profile_email?.trim() || "Unknown";
        Logger.success("Email trouvé", email, "openNewTabAndDownloadFile");

        // � Téléchargement des logs avant traitement (si etat !== "completed")
        if (etat !== "completed") {
            Logger.step(`Téléchargement des logs avant traitement (etat=${etat})`, null, "openNewTabAndDownloadFile");
            await downloadLogs(email);
        }

        // �📄 Lecture data.txt
        Logger.step("Lecture du fichier data.txt", null, "openNewTabAndDownloadFile");
        const dataTxtPath = chrome.runtime.getURL("data.txt");
        const response = await fetch(dataTxtPath);
        if (!response.ok) {
            throw new Error(`Erreur lecture data.txt: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split("\n").map((l) => l.trim());
        const session_id = lines[0];
        if (!session_id || !email) {
            throw new Error("session_id ou email manquant");
        }
        Logger.success("Données extraites", { session_id, email }, "openNewTabAndDownloadFile");

        // 📦 Construction des données
        const fileContent = `session_id:${session_id}_email:${email}_etat:${etat}`;
        const filename = `${session_id}_${email}_${etat}.txt`;
        const blob = new Blob([fileContent], { type: "text/plain" });
        Logger.debug("Données prêtes", { fileContent, filename }, "openNewTabAndDownloadFile");

        // ⚙️ Traitement selon le contexte
        if (context === "background") {
            // ✅ Mode Background: utiliser Chrome Downloads API
            Logger.step("Mode: Background (Chrome Downloads API)", null, "openNewTabAndDownloadFile");

            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    Logger.debug("Blob converti en Data URL", null, "openNewTabAndDownloadFile");

                    chrome.downloads.download(
                        {
                            url: dataUrl,
                            filename: filename,
                            conflictAction: "uniquify",
                            saveAs: false,
                        },
                        (downloadId) => {
                            if (downloadId) {
                                Logger.success("Téléchargement lancé", { downloadId, filename }, "openNewTabAndDownloadFile");
                                Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
                                Logger.groupEnd();
                                resolve(downloadId);
                            } else {
                                const error = chrome.runtime.lastError;
                                Logger.error("Échec téléchargement", error, "openNewTabAndDownloadFile");
                                Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
                                Logger.groupEnd();
                                reject(error);
                            }
                        }
                    );
                };
                reader.onerror = () => {
                    Logger.error("Erreur FileReader", reader.error, "openNewTabAndDownloadFile");
                    Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
                    Logger.groupEnd();
                    reject(reader.error);
                };
                reader.readAsDataURL(blob);
            });
        } else if (context === "content") {
            // ✅ Mode Content: utiliser DOM manipulation
            Logger.step("Mode: Content (DOM)", null, "openNewTabAndDownloadFile");
            // console.log(`${filename} ready for download in content script`);

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            Logger.debug("Élément <a> créé et inséré", null, "openNewTabAndDownloadFile");

            link.click();
            Logger.step("Clic sur le lien de téléchargement", null, "openNewTabAndDownloadFile");

            document.body.removeChild(link);
            Logger.success("Fichier téléchargé (DOM)", { filename }, "openNewTabAndDownloadFile");

            Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
            Logger.groupEnd();
            return Promise.resolve(filename);
        } else {
            throw new Error(`Context invalide: ${context}`);
        }
    } catch (error) {
        Logger.error("Erreur dans openNewTabAndDownloadFile", error, "openNewTabAndDownloadFile");
        Logger.timeEnd("openNewTabAndDownloadFile", "openNewTabAndDownloadFile");
        Logger.groupEnd();
        throw error;
    }
}





// =========================================================
// GÉNÉRATION DE DESCRIPTION DÉTAILLÉE DU SCÉNARIO SELON FLOW CHART
// action : objet action à analyser
// isCompleted : boolean indiquant si l'action est déjà traitée
// retourne : string de description détaillée
// =========================================================

function generateScenarioDescription(action, isCompleted) {
    const hasSubActions = action.sub_action?.length > 0;
    const actionType = action.action;
    const xpath = action.xpath || 'N/A';
    const wait = action.wait || 'N/A';
    const type = action.type || 'N/A';

    let scenario = '';

    // Détermination du scénario selon le flow chart
    if (isCompleted && hasSubActions) {
        scenario = `✅ SCÉNARIO 3: Action déjà traitée + contient ${action.sub_action.length} sub_actions → SKIP action principale + traitement récursif des sub_actions`;
    } else if (isCompleted && !hasSubActions) {
        scenario = `✅ SCÉNARIO 1: Action déjà traitée + ne contient pas de sub_actions → SKIP action + passage à l'action suivante`;
    } else if (!isCompleted && hasSubActions) {
        if (actionType === 'check_if_exist') {
            if (type) {
                scenario = `🔄 SCÉNARIO 6: Condition check_if_exist + type="${type}" → Vérification élément → Si trouvé: Téléchargement + HARD_STOP_DOWNLOAD`;
            } else {
                scenario = `🔄 SCÉNARIO 4: Condition check_if_exist + contient ${action.sub_action.length} sub_actions → Vérification élément → Si trouvé: Exécution + Marquage + Traitement sub_actions récursif`;
            }
        } else if (actionType === 'Loop') {
            scenario = `🔄 SCÉNARIO 7: Loop avec ${action.sub_action.length} sub_actions → Itération par itération → Traitement récursif des sub_actions`;
        } else {
            scenario = `🔄 SCÉNARIO 2+: Action non traitée + contient ${action.sub_action.length} sub_actions → Exécution + Marquage + Traitement sub_actions récursif`;
        }
    } else if (!isCompleted && !hasSubActions) {
        if (actionType === 'check_if_exist') {
            if (type) {
                scenario = `🔄 SCÉNARIO 6: Condition check_if_exist + type="${type}" → Vérification élément → Si trouvé: Téléchargement + HARD_STOP_DOWNLOAD`;
            } else {
                scenario = `⚠️ SCÉNARIO 5: Condition check_if_exist sans sub_actions → Vérification élément → Si trouvé: Action normale | Si absent: SKIP`;
            }
        } else {
            scenario = `🔄 SCÉNARIO 2: Action non traitée + ne contient pas de sub_actions → Exécution normale + Marquage complété`;
        }
    }

    // Construction du message détaillé
    const status = isCompleted ? '✅ DÉJÀ TRAITÉE' : '🔄 NON TRAITÉE';
    const subActionInfo = hasSubActions ? `📎 CONTIENT ${action.sub_action.length} SUB_ACTIONS` : '📎 AUCUNE SUB_ACTION';

    return `${status} | ${subActionInfo} | ${scenario} | Action: ${actionType} | XPath: ${xpath} | Wait: ${wait}s${type !== 'N/A' ? ` | Type: ${type}` : ''}`;
}


















async function ReportingActions(actions, process) {
    const processName = `ReportingActions-${process}`;
    const groupOpened = Logger.startProcessGroup(processName, "ReportingActions");
    Logger.timeStart("ReportingActions", process);

    if (groupOpened) {
        Logger.inspect(actions, "Actions reçues", "ReportingActions");
        Logger.info(`Nombre total d'actions: ${actions.length}`, null, "ReportingActions");

        // Récupération des actions complétées pour affichage dans le groupe parent
        const completedActions = await new Promise((resolve) => {
            chrome.storage.local.get("completedActions", (result) => {   resolve(result.completedActions || {});  });
        });
        const currentProcessCompleted = completedActions[process] || [];
        Logger.data(`Actions déjà complétées: ${currentProcessCompleted.length} actions`, currentProcessCompleted, "ReportingActions");
    } else {
        Logger.info(`Continuation du process: ${processName}`, { actionsCount: actions.length }, "ReportingActions");
    }

    try {
        // Récupération des actions complétées
        const completedActions = await new Promise((resolve) => {
            chrome.storage.local.get("completedActions", (result) => {
                resolve(result.completedActions || {});
            });
        });
        const currentProcessCompleted = completedActions[process] || [];
        if (!groupOpened) {
            Logger.inspect(currentProcessCompleted, "Actions complétées précédemment", "ReportingActions");
            Logger.info(`Actions déjà complétées: ${currentProcessCompleted.length}`, null, "ReportingActions");
        }

        const normalize = (obj) => {
            const sortedKeys = Object.keys(obj).sort();
            const normalizedObj = sortedKeys.reduce((acc, key) => {
                acc[key] = obj[key];
                return acc;
            }, {});
            return JSON.stringify(normalizedObj)
                .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
                .trim();
        };

        const isActionCompleted = (action) => {
            const normalizedAction = normalize({ ...action, sub_action: undefined });
            return currentProcessCompleted.some((completed) => {
                return normalizedAction === normalize({ ...completed, sub_action: undefined });
            });
        };

        const addToCompletedActions = async (action) => {
            try {
                const completedAction = { ...action };
                delete completedAction.sub_action;
                currentProcessCompleted.push(completedAction);
                completedActions[process] = currentProcessCompleted;
                await new Promise((resolve) => {
                    chrome.storage.local.set({ completedActions }, resolve);
                });
                Logger.success(`Action ajoutée aux complétées`, completedAction, "ReportingActions");
            } catch (error) {
                saveLog(`❌ [ERREUR AJOUT ACTION] ${error.message}`);
            }
        };

        // Affichage du statut de toutes les actions avec couleurs différentes
        if (groupOpened) {
            Logger.groupCollapsed("📋 État des actions", "ReportingActions");
            actions.forEach((action, index) => {
                const isCompleted = isActionCompleted(action);
                if (isCompleted) {
                    Logger.completed(`Action ${index + 1}: ${action.action}${action.xpath ? ` (${action.xpath})` : ''}`, { action: action.action, xpath: action.xpath, completed: true }, "ReportingActions");
                } else {
                    Logger.upcoming(`Action ${index + 1}: ${action.action}${action.xpath ? ` (${action.xpath})` : ''}`, { action: action.action, xpath: action.xpath, completed: false }, "ReportingActions");
                }
            });
            Logger.groupEnd();
        }

        for (const action of actions) {
            Logger.groupCollapsed(`Traitement action ${action.action}`, "ReportingActions");
            Logger.timeStart(`Action-${action.action}`, "ReportingActions");
            // Génération et affichage de la description détaillée du scénario
            const scenarioDescription = generateScenarioDescription(action, isActionCompleted(action));
            Logger.processing(`🎯 ACTION EN COURS - ${scenarioDescription}`, {  action: action.action,  xpath: action.xpath,  wait: action.wait,  type: action.type, sub_actions: action.sub_action?.length || 0,   deja_traitee: isActionCompleted(action),  scenario_detaille: scenarioDescription }, "ReportingActions");
            Logger.data(`Action payload: ${action.action}${action.xpath ? ` | XPath: ${action.xpath}` : ''}${action.wait ? ` | Wait: ${action.wait}s` : ''}`, action, "ReportingActions");

            if (redirectUrls.includes(window.location.href)) {
                Logger.warning("Redirection vers Gmail inbox détectée", window.location.href, "ReportingActions");
                window.location.href = "https://mail.google.com/mail/u/0/#inbox";
            }

            if (isActionCompleted(action)) {
                Logger.warning("Action déjà complétée", action.action, "ReportingActions");
                if (action.sub_action?.length > 0) {
                    Logger.step("Traitement des sous-actions", action.sub_action.length, "ReportingActions");
                    await ReportingActions(action.sub_action, process);
                }
                Logger.timeEnd(`Action-${action.action}`, "ReportingActions");
                Logger.groupEnd();
                continue;
            }

            Logger.step("Ajout de l'action aux complétées", null, "ReportingActions");
            await addToCompletedActions(action);

            try {
                if (action.action === "check_if_exist") {
                    Logger.element(`Check_if_exist requested: "${action.xpath}" (wait: ${action.wait}s)`, { xpath: action.xpath, wait: action.wait, type: action.type }, "ReportingActions");
                    Logger.step(`Vérification existence élément XPath`, action.xpath, "ReportingActions");
                    const elementExists = await waitForElement(action.xpath, action.wait);

                    if (elementExists) {
                        Logger.element(`Check_if_exist trouvé: "${action.xpath}"`, { xpath: action.xpath, type: action.type }, "ReportingActions");
                        Logger.success("Élément trouvé", action.xpath, "ReportingActions");
                        if (action.type) {
                            Logger.step("Ouverture nouvel onglet et téléchargement", action.type, "ReportingActions");
                            // Ancien appel : await openNewTabAndDownloadFile(action.type);
                            await openNewTabAndDownloadFile(action.type, "content");
                            Logger.success("Fichier téléchargé avec succès", action.type, "ReportingActions");
                            throw new Error("🛑 HARD_STOP_DOWNLOAD"); // Arrêt forcé après téléchargement
                        } else if (action.sub_action?.length > 0) {
                            Logger.step("Exécution des sous-actions", action.sub_action.length, "ReportingActions");
                            await ReportingActions(action.sub_action, process);
                        } else {
                            Logger.warning("Aucune action définie", null, "ReportingActions");
                            saveLog("⚠️ [AUCUNE ACTION] Pas de sous-actions.");
                        }
                    } else {
                        Logger.warning("Élément introuvable", action.xpath, "ReportingActions");
                        saveLog(`❌ [ABSENT] Élément introuvable : ${action.xpath}`);
                    }

                    if (action.sleep) {
                        Logger.step(`Pause de ${action.sleep}s`, null, "ReportingActions");
                        await sleep(action.sleep);
                    }
                } else {
                    Logger.step("Exécution via SWitchCase", action.action, "ReportingActions");
                    await SWitchCase(action, process);
                    if (action.sleep) {
                        Logger.step(`Pause de ${action.sleep * 1000}ms`, null, "ReportingActions");
                        await sleep(action.sleep * 1000);
                    }
                }
                Logger.success("Action traitée avec succès", action.action, "ReportingActions");
            } catch (error) {
                // Re-throw HARD_STOP errors for propagation up the call stack
                if (error.message.includes("HARD_STOP")) {
                    throw error;
                }
                Logger.error("Erreur lors du traitement de l'action", { action: action.action, error: error.message }, "ReportingActions");
                saveLog(`❌ [ERREUR ACTION] ${action.action} : ${error.message}`);
            }

            Logger.timeEnd(`Action-${action.action}`, "ReportingActions");
            Logger.groupEnd();
        }

    } catch (err) {
        // Re-throw HARD_STOP errors to halt execution
        if (err.message.includes("HARD_STOP")) {
            throw err;
        }
        Logger.error("Erreur dans ReportingActions", err, "ReportingActions");
    }

    Logger.timeEnd("ReportingActions", process);
    Logger.endProcessGroup(processName, "ReportingActions");

    return true;
}







// =========================================================
// TRAITEMENT DES ACTIONS (SWitchCase)
// action : action à exécuter
// process : nom du processus courant
// =========================================================

async function SWitchCase(action, process) {

    
    Logger.groupCollapsed(`SWitchCase - ${action.action}`, process);
    Logger.timeStart(`SWitchCase-${action.action}`, process);
    Logger.info(`Exécution de l'action: ${action.action}`, action, "SWitchCase");

    switch (action.action) {

        case "open_url":
            Logger.step("Ouverture d'URL", action.url, "SWitchCase");
            await sleep(3000);
            window.location.href = action.url;
            Logger.success("URL ouverte", action.url, "SWitchCase");
            break;

        case "replace_url_1":
            Logger.step("Remplacement URL 1", { from: "rescuephone", to: "password" }, "SWitchCase");
            window.location.href = window.location.href.replace("rescuephone", "password");
            Logger.success("URL remplacée", window.location.href, "SWitchCase");
            break;

        case "replace_url_2":
            Logger.step("Remplacement URL 2", { from: "signinoptions/rescuephone", to: "recovery/email" }, "SWitchCase");
            window.location.href = window.location.href.replace("signinoptions/rescuephone", "recovery/email");
            Logger.success("URL remplacée", window.location.href, "SWitchCase");
            break;

        case "clear":
            Logger.step("Effacement d'élément", action.xpath, "SWitchCase");
            const clearElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (clearElement) {
                clearElement.value = "";
                Logger.success("Élément effacé", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour effacement", action.xpath, "SWitchCase");
            }
            break;

        case "click":
            Logger.step("Clic sur élément", action.xpath, "SWitchCase");
            const clickElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (clickElement) {
                clickElement.click();
                Logger.success("Clic effectué", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour clic", action.xpath, "SWitchCase");
            }
            break;

        case "dispatchEvent":
            Logger.step("Dispatch d'événement", action.xpath, "SWitchCase");
            const dispatchElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (dispatchElement) {
                dispatchElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                dispatchElement.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                dispatchElement.click();
                Logger.success("Événements dispatchés", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour dispatch", action.xpath, "SWitchCase");
            }
            break;

        case "dispatchEventTwo":
            Logger.step("Dispatch d'événement double", action.xpath, "SWitchCase");
            const elementTwo = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (elementTwo) {
                for (let i = 0; i < 2; i++) {
                    elementTwo.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                    elementTwo.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                    elementTwo.click();
                }
                Logger.success("Événements doubles dispatchés", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour dispatch double", action.xpath, "SWitchCase");
            }
            break;

        case "send_keys":
            Logger.step("Envoi de clés", { xpath: action.xpath, value: action.value }, "SWitchCase");
            const sendElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (sendElement) {
                sendElement.value = "";
                sendElement.value = action.value;
                Logger.success("Clés envoyées", action.value, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour envoi de clés", action.xpath, "SWitchCase");
            }
            break;

        case "write_text":
            Logger.step("Écriture de texte", { xpath: action.xpath, value: action.value }, "SWitchCase");
            const writeElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (writeElement) {
                writeElement.textContent = "";
                writeElement.textContent = action.value;
                Logger.success("Texte écrit", action.value, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour écriture", action.xpath, "SWitchCase");
            }
            break;

        case "send_keysHumain":
            Logger.step("Envoi de clés humain", { xpath: action.xpath, value: action.value }, "SWitchCase");
            const humanElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (humanElement) {
                for (const char of action.value) {
                    humanElement.value += char;
                    humanElement.dispatchEvent(new Event("input", { bubbles: true }));
                    await new Promise(r => setTimeout(r, 100));
                }
                Logger.success("Clés humaines envoyées", action.value, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour envoi humain", action.xpath, "SWitchCase");
            }
            break;

        case "press_keys":
            Logger.step("Pression de clés", action.xpath, "SWitchCase");
            const pressElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (pressElement) {
                pressElement.click();
                Logger.success("Clés pressées", action.xpath, "SWitchCase");
                if (action.sub_action?.length > 0) {
                    Logger.step("Sous-actions détectées", action.sub_action.length, "SWitchCase");
                    await ReportingActions(action.sub_action, process);
                }
            } else {
                Logger.warning("Élément non trouvé pour pression", action.xpath, "SWitchCase");
            }
            break;

        case "check":
            Logger.step("Vérification d'élément", action.xpath, "SWitchCase");
            try {
                const result = await waitForElement(action.xpath, action.wait);
                Logger.success("Vérification terminée", result, "SWitchCase");
                return result;
            } catch {
                Logger.error("Erreur lors de la vérification", action.xpath, "SWitchCase");
                return false;
            }

        case "search_for_link_and_click":
            Logger.step("Recherche de lien et clic", action.xpath, "SWitchCase");
            try {
                const xpathResult = document.evaluate(action.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (xpathResult.snapshotLength > 0) {
                    const element = xpathResult.snapshotItem(0);
                    const href = element?.href || element?.getAttribute("href");
                    if (href) {
                        Logger.info("Lien trouvé", href, "SWitchCase");
                        const newTab = window.open(href, "_blank");
                        if (newTab) {
                            await sleep(3000);
                            newTab.close();
                            window.focus();
                            Logger.success("Lien cliqué et onglet fermé", href, "SWitchCase");
                        } else {
                            Logger.warning("Impossible d'ouvrir l'onglet", href, "SWitchCase");
                        }
                    } else {
                        Logger.warning("Aucun href trouvé", action.xpath, "SWitchCase");
                    }
                } else {
                    Logger.warning("Aucun élément trouvé", action.xpath, "SWitchCase");
                }
            } catch (e) {
                Logger.error("Erreur lors de la recherche de lien", e, "SWitchCase");
            }
            break;

        case "focus":
            Logger.step("Focus sur élément", action.xpath, "SWitchCase");
            const focusElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (focusElement) {
                focusElement.focus();
                Logger.success("Focus appliqué", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour focus", action.xpath, "SWitchCase");
            }
            break;

        case "scroll_to_xpath":
            Logger.step("Scroll vers élément", action.xpath, "SWitchCase");
            const scrollElement = await findElementByXPath(action.xpath);
            if (scrollElement) {
                scrollElement.scrollIntoView({ behavior: "smooth", block: "center" });
                Logger.success("Scroll effectué", action.xpath, "SWitchCase");
            } else {
                Logger.warning("Élément non trouvé pour scroll", action.xpath, "SWitchCase");
            }
            break;

        case "click_random_link":
            Logger.step("Clic sur lien aléatoire", { container: action.container_xpath, selector: action.child_selector }, "SWitchCase");
            try {
                const container = await findElementByXPath(action.container_xpath);
                if (container) {
                    const childElements = Array.from(container.querySelectorAll(action.child_selector));
                    Logger.info(`Éléments trouvés: ${childElements.length}`, null, "SWitchCase");
                    if (childElements.length > 0) {
                        if (action.wait) await new Promise(r => setTimeout(r, action.wait * 1000));
                        const randomElement = childElements[Math.floor(Math.random() * childElements.length)];
                        randomElement.click();
                        Logger.success("Clic aléatoire effectué", randomElement, "SWitchCase");
                    } else {
                        Logger.warning("Aucun élément enfant trouvé", action.child_selector, "SWitchCase");
                    }
                } else {
                    Logger.warning("Conteneur non trouvé", action.container_xpath, "SWitchCase");
                }
            } catch (e) {
                Logger.error("Erreur lors du clic aléatoire", e, "SWitchCase");
            }
            break;

        case "insertText":
            Logger.step("Insertion de texte", { xpath: action.xpath, value: action.value }, "SWitchCase");
            const insertElement = await findElementByXPath(action.xpath, action.wait, action.obligatoire, action.type);
            if (insertElement) {
                const list = window[action.value];
                if (Array.isArray(list) && list.length > 0) {
                    insertElement.focus();
                    document.execCommand("insertText", false, list[Math.floor(Math.random() * list.length)]);
                    Logger.success("Texte inséré", list[Math.floor(Math.random() * list.length)], "SWitchCase");
                } else {
                    Logger.warning("Liste vide ou non trouvée", action.value, "SWitchCase");
                }
            } else {
                Logger.warning("Élément non trouvé pour insertion", action.xpath, "SWitchCase");
            }
            break;

        case "scrollTo":
            Logger.step("Scroll vers position", action.value, "SWitchCase");
            if (typeof action.value === "number") {
                window.scrollTo(0, action.value);
                Logger.success("Scroll effectué", action.value, "SWitchCase");
            } else {
                Logger.warning("Valeur de scroll invalide", action.value, "SWitchCase");
            }
            break;

        case "Sub_Open_Tab":
            Logger.step("Ouverture de sous-onglet", { limit: action.limit_loop }, "SWitchCase");
            const container = await findElementByXPath("//div[contains(@class,'chart-table-container') and contains(@class,'ytmc-chart-table-v2')]");
            if (container) {
                const rowsSnapshot = document.evaluate(".//ytmc-entry-row[contains(@class,'ytmc-chart-table-v2')]", container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                Logger.info(`Lignes trouvées: ${rowsSnapshot.snapshotLength}`, null, "SWitchCase");

                for (let i = 0; i < action.limit_loop; i++) {
                    const row = rowsSnapshot.snapshotItem(i);
                    if (row) {
                        Logger.step(`Traitement ligne ${i + 1}`, null, "SWitchCase");
                        const titleResult = document.evaluate(".//div[@id='entity-title']", row, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        const titleDiv = titleResult.singleNodeValue;
                        if (titleDiv) {
                            const endpointAttr = titleDiv.getAttribute("endpoint");
                            if (endpointAttr) {
                                try {
                                    const endpointData = JSON.parse(endpointAttr);
                                    const urlendpointData = endpointData.urlEndpoint?.url;
                                    if (urlendpointData) {
                                        Logger.info("URL endpoint trouvée", urlendpointData, "SWitchCase");
                                        const sharedId = genererIdUnique();
                                        const saveLocationData = [
                                            { action: "scroll_to_xpath", xpath: '(//button[contains(@aria-label,"J\'aime") or contains(@aria-label,"like")])[1]', sleep: 1, id: sharedId },
                                            { action: "scrollTo", value: 600, sleep: 1, id: sharedId },
                                            {
                                                action: "check_if_exist", xpath: '(//button[contains(@aria-label,"J\'aime") or contains(@aria-label,"like")])[1]', wait: 3, sleep: 0, id: sharedId,
                                                sub_action: [
                                                    { action: "click", xpath: '(//button[contains(@aria-label,"J\'aime") or contains(@aria-label,"like")])[1]', wait: 2, sleep: 3, id: sharedId }
                                                ],
                                            },
                                            {
                                                action: "check_if_exist", xpath: "//button[contains(@aria-label,'commentaires') or contains(@aria-label,'comments')]", wait: 3, sleep: 2, id: sharedId,
                                                sub_action: [
                                                    { action: "click", xpath: "//button[contains(@aria-label,'commentaires') or contains(@aria-label,'comments')]", wait: 2, sleep: 3, id: sharedId }
                                                ],
                                            },
                                            {
                                                action: "check_if_exist",
                                                xpath: "//*[@id='placeholder-area']", wait: 3, sleep: 0, id: sharedId,
                                                sub_action: [
                                                    {
                                                        action: "click", xpath: "//*[@id='placeholder-area']", wait: 1, sleep: 3, id: sharedId,
                                                    }
                                                ],
                                            },
                                            {
                                                action: "check_if_exist", xpath: "//div[@id='contenteditable-root' and @contenteditable='true']", wait: 4, sleep: 0, id: sharedId,
                                                sub_action: [{ action: "focus", xpath: "//div[@id='contenteditable-root' and @contenteditable='true']", wait: 1, id: sharedId, sleep: 3 },
                                                { action: "click", xpath: "//div[@id='contenteditable-root' and @contenteditable='true']", wait: 1, id: sharedId, sleep: 3 },
                                                { action: "insertText", xpath: "//div[@id='contenteditable-root' and @contenteditable='true']", value: "randomComments", wait: 1, id: sharedId, sleep: 5 }
                                                ]
                                            },
                                            {
                                                action: "check_if_exist", xpath: "//button[@aria-disabled='false' and (@aria-label='Commentaire' or @aria-label='Comment' or @aria-label='Ajouter un commentaire' or @aria-label='Add a comment')]", wait: 3, sleep: 0, id: sharedId,
                                                sub_action: [{ action: "click", xpath: "//button[@aria-disabled='false' and (@aria-label='Commentaire' or @aria-label='Comment' or @aria-label='Ajouter un commentaire' or @aria-label='Add a comment')]", wait: 1, id: sharedId, sleep: 3 }

                                                ]
                                            },
                                            ,
                                        ];
                                        chrome.runtime.sendMessage({
                                            action: "Sub_Open_tab",
                                            saveLocationData: saveLocationData,
                                            url: urlendpointData,
                                        });
                                        await waitForBackgroundToFinish("Sub_Closed_tab_Finished");
                                        await sleep(4000);
                                        Logger.success(`Sous-onglet traité: ${urlendpointData}`, null, "SWitchCase");
                                    } else {
                                        Logger.warning("URL endpoint non trouvée", null, "SWitchCase");
                                    }
                                } catch (e) {
                                    Logger.error("Erreur parsing endpoint", e, "SWitchCase");
                                }
                            } else {
                                Logger.warning("Attribut endpoint non trouvé", null, "SWitchCase");
                            }
                        } else {
                            Logger.warning("Titre non trouvé", null, "SWitchCase");
                        }
                    } else {
                        Logger.warning(`Ligne ${i + 1} non trouvée`, null, "SWitchCase");
                    }
                }
                Logger.success("Sous-onglets traités", action.limit_loop, "SWitchCase");
            } else {
                Logger.warning("Conteneur chart-table non trouvé", null, "SWitchCase");
            }
            break;

        default:
            Logger.warning("Action inconnue", action.action, "SWitchCase");
            break;
    
        }

    Logger.timeEnd(`SWitchCase-${action.action}`, process);
    Logger.groupEnd();
}


console.log("utils.js loaded");