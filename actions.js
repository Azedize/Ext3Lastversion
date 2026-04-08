// =========================================================
// EXTRACTION DE LA VALEUR "reply_message" DANS UN SCÉNARIO
// scenario : tableau d'actions ou sous-processus
// retourne : la première valeur trouvée pour "reply_message" ou null
// =========================================================

// ┌──────────────────────────────┐
// │   Start extractReplyMessageValue │
// └──────────────┬───────────────┘
//                │
//                ▼
// ┌──────────────────────────────┐
// │ Logger: "Extraction de reply_message" │
// └──────────────┬───────────────┘
//                │
//                ▼
// ┌──────────────────────────────┐
// │ foundValue = null            │
// └──────────────┬───────────────┘
//                │
//                ▼
// ┌──────────────────────────────┐
// │ Function explore(arr)        │
// └──────────────┬───────────────┘
//                │
//                ▼
// ┌──────────────────────────────┐
// │ Is arr an Array?             │
// ├──────────────┬───────────────┤
// │   Yes        │     No       │
// │              │               │
// ▼              ▼
// For each step   Logger.debug("Élément non-array rencontré")
// in arr          return
// │
// ▼
// Check if step.process === "reply_message" && step.value exists
// ├──────────────┬───────────────┤
// │   Yes        │     No        │
// │              │               │
// ▼              ▼
// foundValue = step.value     Check if step.sub_process exists
// Logger.success(...foundValue) │
// return from explore           │
//                               ▼
//                           explore(step.sub_process)
//                           if foundValue -> return
// │
// ▼
// Repeat for next step in arr
// │
// ▼
// After explore completes
// ├──────────────┬───────────────┤
// │ foundValue exists? │ No      │
// │                   │         │
// ▼                   ▼
// return foundValue    Logger.warning("Aucune valeur reply_message trouvée")
//                      return null
// └──────────────┬───────────────┘
//                ▼
// ┌──────────────────────────────┐
// │ End extractReplyMessageValue │
// └──────────────────────────────┘



const extractReplyMessageValue = (scenario) => {
    Logger.groupCollapsed("extractReplyMessageValue", "extractReplyMessageValue");
    Logger.timeStart("extractReplyMessageValue", "extractReplyMessageValue");
    Logger.info("Extraction de reply_message", { scenarioLength: scenario?.length }, "extractReplyMessageValue");

    let foundValue = null;
    const explore = (arr) => {
        if (!Array.isArray(arr)) {
            Logger.debug("Élément non-array rencontré", arr, "extractReplyMessageValue");
            return;
        }

        Logger.step(`Exploration de ${arr.length} éléments`, null, "extractReplyMessageValue");

        for (const step of arr) {
            Logger.debug("Vérification étape", { process: step.process, hasValue: !!step.value }, "extractReplyMessageValue");

            if (step.process === "reply_message" && step.value) {
                foundValue = step.value;
                Logger.success("reply_message trouvé", foundValue, "extractReplyMessageValue");
                return; // Sortir dès qu'on trouve la première valeur
            }

            if (step.sub_process) {
                Logger.step("Exploration sous-processus", null, "extractReplyMessageValue");
                explore(step.sub_process);
                if (foundValue) return; // Sortir si trouvé dans sous-processus
            }
        }
    };

    explore(scenario);

    if (!foundValue) {
        Logger.warning("Aucune valeur reply_message trouvée", null, "extractReplyMessageValue");
    }

    Logger.timeEnd("extractReplyMessageValue", "extractReplyMessageValue");
    Logger.groupEnd();
    return foundValue;
};





// =========================================================
// INITIALISATION DU PROCESSUS : CHARGEMENT SCÉNARIO ET REMPLACEMENT
// message : données reçues pour le process
// =========================================================

// ┌─────────────────────────────┐
// │       Start createPopup      │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Initialisation du processus │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │   Charger le scénario        │
// │  -> fetch traitement.json   │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Extraire reply_message       │
// │  -> detecté ou non           │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Charger les données du      │
// │ process (message / storage) │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Enregistrer email si présent │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Process ISP (gmail_process) │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Remplacement des placeholders│
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Récupération des actions     │
// │       terminées              │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Démarrage du processus       │
// │       principal             │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Téléchargement du résultat   │
// │ -> openNewTabAndDownloadFile │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ HARD_STOP_DOWNLOAD           │
// │ -> throw Error               │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │ Catch block:                │
// │ - if HARD_STOP -> re-throw  │
// │ - else -> Logger.error       │
// └──────────────┬──────────────┘
//                │
//                ▼
// ┌─────────────────────────────┐
// │       End createPopup        │
// └─────────────────────────────┘

const createPopup = async (message) => {
    const processName = "createPopup";
    const groupOpened = Logger.startProcessGroup(processName, "createPopup");
    Logger.timeStart("createPopup", "createPopup");

    try {
        if (groupOpened) {
            Logger.info("Initialisation du processus", null, "createPopup");

            // --- Afficher les données déjà enregistrées ---
            Logger.step("Vérification des données persistées", null, "createPopup");
            const allStoredData = await new Promise(resolve => {
                chrome.storage.local.get(null, (data) => resolve(data));
            });
            Logger.data(`Données localStorage: ${Object.keys(allStoredData).length} clés`, allStoredData, "createPopup");
            Logger.inspect(allStoredData, "📦 État complet du localStorage", "createPopup");
        }
        await sleep(1000);

        // --- Charger le scénario ---
        Logger.step("Chargement du scénario", null, "createPopup");
        const scenario = await fetch(chrome.runtime.getURL("traitement.json")).then(r => r.json()).catch(() => []);
        Logger.scenario("Scénario chargé", scenario, "createPopup");

        // --- Vérifier que le scénario est un tableau ---
        if (!Array.isArray(scenario)) {
            Logger.error("❌ SCENARIO INVALID: Le scénario doit être un tableau", { scenario, type: typeof scenario }, "createPopup");
            throw new Error("🛑 HARD_STOP_INVALID_SCENARIO: Le scénario n'est pas un tableau valide");
        }

        // --- Extraire reply_message ---
        const replyMessageValue = extractReplyMessageValue(scenario);
        if (replyMessageValue) {
            Logger.success("reply_message détecté", replyMessageValue, "createPopup");
        } else {
            Logger.warning("Aucun reply_message trouvé", null, "createPopup");
        }

        // --- Charger les données du process ---
        Logger.step("Chargement des données du process", null, "createPopup");
        const processData = message && Object.keys(message).length > 0 ? message :
            await new Promise(resolve => chrome.storage.local.get("startProcessData", res => resolve(res.startProcessData || {})));
        Logger.data(`Données du process: ${Object.keys(processData).length} propriétés${processData.profile_email ? ` | Email: ${processData.profile_email}` : ''}`, processData, "createPopup");
        Logger.inspect(processData, "📋 DÉTAIL COMPLET DES DONNÉES DU PROCESS", "createPopup");

        // --- Enregistrer l'email si présent ---
        if (processData.profile_email) {
            chrome.storage.local.set({ profile_email: processData.profile_email });
            Logger.success("Email enregistré", processData.profile_email, "createPopup");
        }

        const ispProcess = gmail_process || {};
        Logger.data(`Process ISP: ${Object.keys(ispProcess).length} propriétés`, ispProcess, "createPopup");

        // ========================================
        // AVANT REMPLACEMENT DES PLACEHOLDERS
        // ========================================
        Logger.groupCollapsed("📊 AVANT REMPLACEMENT DES PLACEHOLDERS", "createPopup");
        Logger.timeStart("PlaceholderBefore", "createPopup");
        Logger.info("État du processData avant remplacement", null, "createPopup");
        Logger.inspect(processData, "processData - Clés disponibles", "createPopup");
        Logger.info("État du ispProcess avant remplacement", null, "createPopup");
        Logger.inspect(ispProcess, "ispProcess - Structure complète", "createPopup");
        Logger.groupEnd();

        // --- Remplacement des placeholders ---
        Logger.step("Remplacement des placeholders", null, "createPopup");
        const replacePlaceholders = (obj) => {
            if (!obj) return;
            if (Array.isArray(obj)) obj.forEach(replacePlaceholders);
            else if (typeof obj === "object") {
                for (let key in obj) {
                    if (typeof obj[key] === "string") {
                        obj[key] = obj[key] === "__email__" ? processData.profile_email || obj[key] :
                                   obj[key] === "__password__" ? processData.profile_password || obj[key] :
                                   obj[key] === "__recovry__" ? processData.recovery_email || obj[key] :
                                   obj[key] === "__newRecovry__" ? processData.new_recovery_email || obj[key] :
                                   obj[key] === "__newPassword__" ? processData.new_password || obj[key] :
                                   obj[key] === "__reply_message__" ? replyMessageValue || obj[key] : obj[key];
                    } else if (typeof obj[key] === "object") replacePlaceholders(obj[key]);
                }
            }
        };
        replacePlaceholders(ispProcess);
        Logger.success("Placeholders remplacés", null, "createPopup");

        // ========================================
        // APRÈS REMPLACEMENT DES PLACEHOLDERS
        // ========================================
        Logger.groupCollapsed("📊 APRÈS REMPLACEMENT DES PLACEHOLDERS", "createPopup");
        Logger.timeStart("PlaceholderAfter", "createPopup");
        Logger.info("État du ispProcess après remplacement", null, "createPopup");
        Logger.inspect(ispProcess, "ispProcess - Structure modifiée", "createPopup");
        Logger.info("Comparaison avant/après: les valeurs __XXX__ doivent être remplacées", null, "createPopup");
        Logger.timeEnd("PlaceholderAfter", "createPopup");
        Logger.groupEnd();

        // --- Récupérer les actions terminées ---
        Logger.step("Récupération des actions terminées", null, "createPopup");
        const completedActions = await new Promise(resolve => chrome.storage.local.get("completedActions", res => resolve(res.completedActions || {})));
        Logger.inspect(completedActions, "Actions terminées", "createPopup");

        // --- Processus principal ---
        Logger.step("Démarrage du processus principal", null, "createPopup");
        await ReportingProcess(scenario, ispProcess);
        Logger.success("Processus principal terminé", null, "createPopup");

        // --- Téléchargement du résultat ---
        Logger.step("Téléchargement du résultat", null, "createPopup");
        await openNewTabAndDownloadFile("completed");
        Logger.success("Fichier téléchargé avec succès", null, "createPopup");
        throw new Error("🛑 HARD_STOP_DOWNLOAD"); // Arrêt forcé après téléchargement

    } catch (err) {
        // Re-throw HARD_STOP errors to truly stop execution
        if (err.message.includes("HARD_STOP")) {
            Logger.warning("Téléchargement terminé - arrêt complet", null, "createPopup");
            throw err;
        }
        Logger.error("Erreur createPopup", err, "createPopup");
    }

    Logger.timeEnd("createPopup", "createPopup");
    Logger.endProcessGroup(processName, "createPopup");
};





// =========================================================
// REMPLACEMENT RÉCURSIF DE "__search_value__" DANS UN OBJET
// obj : objet ou tableau à parcourir
// searchValue : valeur de remplacement
// =========================================================
function deepReplaceSearchValue(obj, searchValue) {
    Logger.groupCollapsed("deepReplaceSearchValue", "deepReplaceSearchValue");
    Logger.timeStart("deepReplaceSearchValue", "deepReplaceSearchValue");
    Logger.info("Remplacement récursif __search_value__", { searchValue, objType: typeof obj }, "deepReplaceSearchValue");

    let replacementsCount = 0;

    const replaceRecursive = (currentObj) => {
        if (Array.isArray(currentObj)) {
            Logger.debug(`Traitement tableau de ${currentObj.length} éléments`, null, "deepReplaceSearchValue");
            currentObj.forEach(item => replaceRecursive(item));
        }
        else if (typeof currentObj === "object" && currentObj !== null) {
            Logger.step("Traitement objet", { keysCount: Object.keys(currentObj).length }, "deepReplaceSearchValue");

            for (const key in currentObj) {
                if (typeof currentObj[key] === "string" && currentObj[key].includes("__search_value__")) {
                    const oldValue = currentObj[key];
                    currentObj[key] = currentObj[key].replace("__search_value__", searchValue);
                    replacementsCount++;
                    Logger.success(`Remplacement effectué: ${key}`, {
                        oldValue,
                        newValue: currentObj[key],
                        replacementsCount
                    }, "deepReplaceSearchValue");
                } else {
                    replaceRecursive(currentObj[key]);
                }
            }
        }
    };

    replaceRecursive(obj);

    Logger.info("Remplacement terminé", { totalReplacements: replacementsCount }, "deepReplaceSearchValue");
    Logger.timeEnd("deepReplaceSearchValue", "deepReplaceSearchValue");
    Logger.groupEnd();
}








let Email_Contact = null;
let cleanEmail = null;
let saveLocationData = null;
// =========================================================
// PROCESSUS DE REPORTING PRINCIPAL
// scenario : tableau des processus à exécuter
// ispProcess : données associées à chaque type de process
// retourne : nombre total d'emails/messages traités
// =========================================================
async function ReportingProcess(scenario, ispProcess) {
    const processName = "ReportingProcess";
    const groupOpened = Logger.startProcessGroup(processName, "ReportingProcess");
    Logger.timeStart("ReportingProcess", "ReportingProcess");

    if (groupOpened) {
        Logger.info("Démarrage du processus de reporting", { scenarioCount: scenario.length }, "ReportingProcess");

        // ========================================
        // DONNÉES D'ENTRÉE DU PROCESSUS
        // ========================================
        Logger.groupCollapsed("📊 DONNÉES D'ENTRÉE DU PROCESSUS", "ReportingProcess");
        Logger.timeStart("InputData", "ReportingProcess");
        Logger.info("Paramètres d'entrée détaillés", null, "ReportingProcess");
        Logger.inspect(scenario, "scenario - Structure complète du scénario", "ReportingProcess");
        Logger.inspect(ispProcess, "ispProcess - Données ISP complètes", "ReportingProcess");
        Logger.info("Statistiques d'entrée", {
            scenarioLength: scenario.length,
            ispProcessKeys: Object.keys(ispProcess).length,
            ispProcessKeysList: Object.keys(ispProcess)
        }, "ReportingProcess");
        Logger.timeEnd("InputData", "ReportingProcess");
        Logger.groupEnd();
    }

    let messagesProcessed = 0;
    // let pageCount = 0;
    let stopAllProcessing = false;

    for (const process of scenario) {
        if (stopAllProcessing) {
            Logger.warning("Arrêt de tous les traitements demandé", null, "ReportingProcess");
            break;
        }

        Logger.groupCollapsed(`Processus ${process.process}`, "ReportingProcess");
        Logger.timeStart(`Process-${process.process}`, "ReportingProcess");
        Logger.info(`Traitement du processus: ${process.process}`, process, "ReportingProcess");
        Logger.inspect(process, "Détails complets du process", "ReportingProcess");

        try {
            const currentURL = window.location.href;
            Logger.debug("URL actuelle", currentURL, "ReportingProcess");

            if ((currentURL.includes("https://mail.google.com/mail") ||
                 currentURL.includes("https://myaccount.google.com/?pli=") ||
                currentURL.startsWith("https://myaccount.google.com/")) && process.process === "login") {
                
                Logger.inspect(process, "Processus login ignoré (déjà connecté)", "ReportingProcess");
                Logger.info("Processus login ignoré (déjà connecté)", null, "ReportingProcess");
                Logger.timeEnd(`Process-${process.process}`, "ReportingProcess");
                Logger.groupEnd();
                continue;
            }

            if (process.process === "loop") {
                Logger.step("Traitement du processus loop", { limit: process.limit_loop }, "ReportingProcess");
                const realMessagesPerPage = await getElementCountByXPath(`//table[.//colgroup]//tbody/tr`);
                Logger.info(`Messages par page détectés: ${realMessagesPerPage}`, null, "ReportingProcess");

                const limitLoop = process.limit_loop;
                let stopAllLoops = false;
                const hasOpenMessage = process.sub_process.some(sp => sp.process === "open_message");
                Logger.debug("Configuration loop", { limitLoop, hasOpenMessage }, "ReportingProcess");

                while (messagesProcessed < limitLoop && !stopAllLoops) {
                    Logger.groupCollapsed(`Boucle d'itération`, "ReportingProcess");
                    Logger.step(`Itération - Messages traités: ${messagesProcessed}/${limitLoop}`, null, "ReportingProcess");

                    if (process.check) {
                        Logger.step("Vérification de condition", process.check, "ReportingProcess");
                        const checkResult = await ReportingActions(ispProcess[process.check], process.process);
                        if (!checkResult) {
                            Logger.warning("Condition non remplie, arrêt des boucles", null, "ReportingProcess");
                            stopAllLoops = true;
                            break;
                        }
                    }

                    let messagesOnPage = hasOpenMessage ? limitLoop : await getElementCountByXPath(`//table[.//colgroup]//tbody/tr`);
                    Logger.info(`Messages sur cette page: ${messagesOnPage}`, null, "ReportingProcess");

                    if (messagesOnPage === 0 && !hasOpenMessage) {
                        Logger.warning("Aucun message trouvé, arrêt du traitement", null, "ReportingProcess");
                        stopAllLoops = true;
                        stopAllProcessing = true;
                        Logger.groupEnd();
                        break;
                    }

                    const startIndex = process.start > 0 ? parseInt(process.start) - 1 : 0;
                    Logger.debug(`Index de départ: ${startIndex}`, null, "ReportingProcess");

                    for (let i = startIndex; i < messagesOnPage && messagesProcessed < limitLoop; i++) {
                        if (stopAllLoops) {
                            Logger.warning("Arrêt des boucles demandé", null, "ReportingProcess");
                            break;
                        }

                        Logger.groupCollapsed(`Traitement message ${i + 1}`, "ReportingProcess");

                        for (const subProcess of process.sub_process) {
                            if (stopAllLoops) break;

                            Logger.step(`Sous-processus: ${subProcess.process}`, null, "ReportingProcess");
                            const prcss = [...ispProcess[subProcess.process]];
                            addUniqueIdsToActions(prcss);

                            if (subProcess.process === "OPEN_MESSAGE_ONE_BY_ONE") {
                                Logger.debug("Modification XPath pour message individuel", { index: i + 1 }, "ReportingProcess");
                                prcss.forEach(p => { p.xpath = p.xpath.replace(/\[(\d+)\]/, `[${i + 1}]`); });
                                await ReportingActions(prcss, process.process);
                                continue;
                            }

                            if (subProcess.process === "add_contacts") {
                                Logger.step("Recherche d'email de contact", null, "ReportingProcess");
                                let Email_Contact = await findElementByXPath('//table//tbody//tr//td//h3//span[@translate and @role="gridcell"]//span[@email and @name and @data-hovercard-id]');
                                if (!Email_Contact) {
                                    Logger.error("Élément email de contact non trouvé", null, "ReportingProcess");
                                    Logger.groupEnd();
                                    return;
                                }
                                let cleanEmail = Email_Contact.getAttribute("email");
                                Logger.success("Email de contact trouvé", cleanEmail, "ReportingProcess");

                                const saveLocationDataUpdated = JSON.parse(JSON.stringify([...ispProcess[subProcess.process]]).replace(/__Email_Contact__/g, cleanEmail));
                                Logger.step("Ouverture onglet contacts", cleanEmail, "ReportingProcess");
                                chrome.runtime.sendMessage({ action: "Open_tab_Add_Contact", saveLocationData: saveLocationDataUpdated, email: cleanEmail, url: "https://contacts.google.com/new" });
                                await waitForBackgroundToFinish("Closed_tab_Finished_Add_Contact");
                                continue;
                            }

                            await ReportingActions(ispProcess[subProcess.process], process.process);
                        }

                        messagesProcessed++;
                        Logger.success(`Message traité (${messagesProcessed}/${limitLoop})`, null, "ReportingProcess");

                        if (messagesProcessed >= limitLoop) {
                            Logger.info("Limite de messages atteinte", { messagesProcessed, limitLoop }, "ReportingProcess");
                            stopAllLoops = true;
                            break;
                        }

                        Logger.groupEnd();
                    }

                    if (!stopAllLoops && messagesProcessed < limitLoop && !hasOpenMessage) {
                        Logger.step("Vérification page suivante", null, "ReportingProcess");
                        const checkNextResult = await ReportingActions(ispProcess["CHECK_NEXT"], process.process);
                        if (!checkNextResult) {
                            Logger.info("Plus de pages disponibles", null, "ReportingProcess");
                            break;
                        }
                        const nextPageActions = [...ispProcess["next_page"]];
                        addUniqueIdsToActions(nextPageActions);
                        Logger.step("Navigation vers page suivante", null, "ReportingProcess");
                        await ReportingActions(nextPageActions, process.process);
                    }

                    Logger.groupEnd();
                }
            }
            else if (process.process === "search") {
                Logger.step("Traitement du processus search", { searchValue: process.value }, "ReportingProcess");
                const updatedProcesses = ispProcess[process.process].map(item => {
                    if (item.value && item.value.includes("__search__")) {
                        item.value = item.value.replace("__search__", process.value);
                        Logger.debug("Remplacement __search__ effectué", item.value, "ReportingProcess");
                    }
                    return item;
                });
                await ReportingActions(updatedProcesses, process.process);
            }
            else if (process.process === "CHECK_FOLDER") {
                Logger.step("Vérification de dossier", null, "ReportingProcess");
                const checkFolderResult = await ReportingActions(ispProcess[process.check], process.process);
                if (!checkFolderResult) {
                    Logger.warning("Vérification de dossier échouée", null, "ReportingProcess");
                    break;
                }
            }
            else if ([
                    "google_preferred_addresses", "google_travel_projects", "google_places_to_visit",
                    "google_favorite_places", "google_restaurants", "google_attractions",
                    "google_museums", "google_transit", "google_pharmacies", "google_atms"
                ].includes(process.process)) {

                    Logger.groupCollapsed(`Traitement Google Maps: ${process.process}`, "ReportingProcess");
                    Logger.step("Démarrage traitement Google Maps", process.process, "ReportingProcess");

                    saveLocationData = ispProcess[process.process];
                    Logger.inspect(saveLocationData, "Données initiales", "ReportingProcess");

                    Logger.step("Remplacement des valeurs de recherche", process.search, "ReportingProcess");
                    deepReplaceSearchValue(saveLocationData, process.search);

                    Logger.step("Ouverture onglet Google Maps", null, "ReportingProcess");
                    chrome.runtime.sendMessage({
                        action: "Open_tab",
                        saveLocationData,
                        url: "https://www.google.com/maps"
                    });

                    Logger.step("Attente fermeture onglet", null, "ReportingProcess");
                    await waitForBackgroundToFinish("Closed_tab_Finished");
                    Logger.success("Traitement Google Maps terminé", null, "ReportingProcess");
                    Logger.groupEnd();
                    await sleep(2000);
                }

            else if (process.process === "google_trends") {
                    Logger.groupCollapsed("Traitement Google Trends", "ReportingProcess");
                    Logger.step("Démarrage traitement Google Trends", null, "ReportingProcess");

                    saveLocationData = ispProcess[process.process];
                    Logger.inspect(saveLocationData, "Données initiales", "ReportingProcess");

                    Logger.step("Ouverture onglet Google Trends", null, "ReportingProcess");
                    chrome.runtime.sendMessage({
                        action: "Open_tab",
                        saveLocationData,
                        url: "https://trends.google.com/trends/"
                    });

                    Logger.step("Attente fermeture onglet", null, "ReportingProcess");
                    await waitForBackgroundToFinish("Closed_tab_Finished");
                    Logger.success("Traitement Google Trends terminé", null, "ReportingProcess");
                    Logger.groupEnd();
            }

            else if (process.process === "news_google") {
                Logger.step("Traitement News Google", null, "ReportingProcess");
                saveLocationData = ispProcess[process.process];
                chrome.runtime.sendMessage({ action: "Open_tab", saveLocationData, url: "https://news.google.com/home" });
                await waitForBackgroundToFinish("Closed_tab_Finished");
            }
            else if (process.process === "youtube_Shorts") {
                Logger.step("Traitement YouTube Shorts", { limit: process.limit }, "ReportingProcess");
                saveLocationData = ispProcess[process.process];
                saveLocationData.forEach(action => { if (action.action === "Loop") action.limit_loop = process.limit; });
                chrome.runtime.sendMessage({ action: "Open_tab", saveLocationData, url: "https://www.youtube.com/shorts" });
                await waitForBackgroundToFinish("Closed_tab_Finished");
                await sleep(4000);
            }
            else if (process.process === "youtube_charts") {
                Logger.step("Traitement YouTube Charts", { limit: process.limit }, "ReportingProcess");
                saveLocationData = ispProcess[process.process];
                saveLocationData.forEach(action => action.limit_loop = process.limit);
                chrome.runtime.sendMessage({ action: "Open_tab", saveLocationData, url: "https://charts.youtube.com/charts/TopSongs/global/weekly" });
                await waitForBackgroundToFinish("Closed_tab_Finished");
                await sleep(4000);
            }
            else if (process.process === "CheckLoginYoutube") {
                Logger.step("Vérification login YouTube", null, "ReportingProcess");
                saveLocationData = ispProcess[process.process];
                chrome.runtime.sendMessage({ action: "Open_tab_CheckLoginYoutube", saveLocationData, url: "https://www.youtube.com/" });
                await waitForBackgroundToFinish("Closed_tab_Finished_CheckLoginYoutube");
                await sleep(4000);
            }
            else {
                Logger.step(`Traitement processus par défaut: ${process.process}`, null, "ReportingProcess");
                await ReportingActions(ispProcess[process.process], process.process);
            }

            Logger.timeEnd(`Process-${process.process}`, "ReportingProcess");
            Logger.groupEnd();

        }
        catch (error) {
            // Re-throw HARD_STOP errors to propagate up
            if (error.message.includes("HARD_STOP")) {
                throw error;
            }
            Logger.error(`Erreur processus '${process.process}'`, error, "ReportingProcess");
            Logger.timeEnd(`Process-${process.process}`, "ReportingProcess");
            Logger.groupEnd();
        }
    }

    Logger.success("Fin du processus de reporting", { messagesProcessed }, "ReportingProcess");
    Logger.timeEnd("ReportingProcess", "ReportingProcess");
    Logger.endProcessGroup(processName, "ReportingProcess");
    return messagesProcessed;
}





// =========================================================
// GESTION DES MESSAGES DE BACKGROUND ET DÉMARRAGE DU PROCESSUS
// =========================================================

let processAlreadyRunning = false;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    Logger.groupCollapsed("Message Background Reçu", "chrome.runtime.onMessage");
    Logger.timeStart("MessageBackground", "chrome.runtime.onMessage");
    Logger.info("Nouveau message background reçu", null, "chrome.runtime.onMessage");
    Logger.inspect(message, "Message reçu (détail)", "chrome.runtime.onMessage");
    Logger.inspect(sender, "Sender du message (détail)", "chrome.runtime.onMessage");
    Logger.info("Résumé du message", { action: message?.action, senderTabId: sender?.tab?.id, senderUrl: sender?.tab?.url || sender?.url }, "chrome.runtime.onMessage");

    try {
        // === Fermeture d'onglet terminée ===
        if (message.action === "Closed_tab_Finished" || message.action === "Closed_tab_Finished_CheckLoginYoutube") {
            Logger.step("Fermeture d'onglet détectée", { action: message.action }, "chrome.runtime.onMessage");
            setTimeout(() => {
                Logger.success("Réponse envoyée pour fermeture onglet", null, "chrome.runtime.onMessage");
                sendResponse({ success: true });
            }, 500);
            Logger.timeEnd("MessageBackground", "chrome.runtime.onMessage");
            Logger.groupEnd();
            return true; // Maintenir le canal ouvert pour async
        }

        // === Démarrage du processus ===
        if (message.action === "startProcess") {
            Logger.step("Démarrage du processus demandé", null, "chrome.runtime.onMessage");

            // URLs bloquées
            const blockedUrls = [
                "https://contacts.google.com",
                "https://www.google.com/maps",
                "https://trends.google.com/trends/",
                "https://news.google.com/home"
            ];

            const currentUrl = window.location.href;
            Logger.debug("Vérification URL actuelle", { currentUrl, blockedUrls }, "chrome.runtime.onMessage");

            if (blockedUrls.some(url => currentUrl.startsWith(url))) {
                Logger.warning("Processus bloqué sur URL interdite", { currentUrl }, "chrome.runtime.onMessage");
                Logger.timeEnd("MessageBackground", "chrome.runtime.onMessage");
                Logger.groupEnd();
                return;
            }

            // Vérifier si un processus est déjà en cours
            if (processAlreadyRunning) {
                Logger.warning("Processus déjà en cours, rejet de la demande", null, "chrome.runtime.onMessage");
                sendResponse({ status: "error", message: "Le processus est déjà en cours." });
                Logger.timeEnd("MessageBackground", "chrome.runtime.onMessage");
                Logger.groupEnd();
                return;
            }

            processAlreadyRunning = true;
            Logger.success("Processus marqué comme en cours", null, "chrome.runtime.onMessage");

            // Lancer le processus principal
            Logger.step("Lancement du processus principal", null, "chrome.runtime.onMessage");
            createPopup(message)
                .then(() => {
                    Logger.success("Processus terminé avec succès", null, "chrome.runtime.onMessage");
                    processAlreadyRunning = false;
                    sendResponse({ status: "success", message: "Le processus a été démarré avec succès." });
                })
                .catch(error => {
                    Logger.error("Erreur lors du processus", error, "chrome.runtime.onMessage");
                    processAlreadyRunning = false;
                    sendResponse({ status: "error", message: error.message });
                });

            Logger.timeEnd("MessageBackground", "chrome.runtime.onMessage");
            Logger.groupEnd();
            return true; // Maintenir le canal ouvert pour async
        }

        Logger.warning("Action non reconnue", { action: message.action }, "chrome.runtime.onMessage");

    } catch (error) {
        Logger.error("Erreur dans le listener de messages", error, "chrome.runtime.onMessage");
        processAlreadyRunning = false;
        sendResponse({ status: "error", message: error.message });
    }

    Logger.timeEnd("MessageBackground", "chrome.runtime.onMessage");
    Logger.groupEnd();
    return false; // Aucun traitement pour les autres messages
});
