let randomComments = [
    "Super vidéo ! 🔥",
    "Merci pour ce contenu de qualité 🙏",
    "Très enrichissant, j'adore 😃",
    "Excellente explication comme toujours 👌",
    "Continue comme ça, t’es au top 💯",
    "Tu expliques super bien, merci 🙌",
    "Je ne rate aucune de tes vidéos 😍",
    "Toujours un plaisir de regarder tes contenus 🎥",
    "Tu m’apprends tellement de choses, merci ! 🙏",
    "Gros respect pour ton travail 👏",
    "Le montage est propre, bien joué 🎬",
    "Tu mérites plus d’abonnés 🔝",
    "Contenu clair, net et précis ✅",
    "Tu rends les choses compliquées faciles à comprendre 💡",
    "Très bon sujet, j’en voulais justement parler ! 😲",
    "Ton contenu est toujours au top niveau 🎯",
    "J’ai appris quelque chose de nouveau, merci 😊",
    "Encore une pépite comme d’habitude 💎",
    "Bravo pour la qualité de ta chaîne ! 🌟",
    "Je recommande cette vidéo à tout le monde 🔁"
];


window.randomComments = randomComments;




// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

//     if (message.action === "Data_Google_CheckLoginYoutube") {
//         (async () => {
//             try {
//                 await ReportingActionsV2(message.data);
//                 chrome.runtime.sendMessage({ action: "Closed_tab_CheckLoginYoutube" });
//             } catch {}
//         })();

//         sendResponse({ status: "done" });
//         return true;
//     }

//     if (message.action === "Data_Google") {
//         setTimeout(async () => {
//             try {
//                 await ReportingActionsV2(message.data);
//                 chrome.runtime.sendMessage({ action: "Closed_tab" });
//                 sendResponse({ status: "done" });
//             } catch (err) {
//                 sendResponse({ status: "error", message: err.message });
//             }
//         }, 0);
//         return true;
//     }

//     if (message.action === "Sub_Data_Google") {
//         setTimeout(async () => {
//             try {
//                 await ReportingActionsV2(message.data);
//                 chrome.runtime.sendMessage({ action: "Sub_Closed_tab" });
//                 sendResponse({ status: "done" });
//             } catch (err) {
//                 sendResponse({ status: "error", message: err.message });
//             }
//         }, 0);
//         return true;
//     }

//     if (message.action === "Sub_Closed_tab_Finished") {
//         setTimeout(() => sendResponse({ success: true }), 500);
//         return true;
//     }

//     if (message.action === "Data_Google_Add_Contact") {
//         setTimeout(async () => {
//             try {
//                 await ReportingActionsV2(message.data, message.email);
//                 chrome.runtime.sendMessage({ action: "Closed_tab_Add_Contact" });
//                 sendResponse({ status: "done" });
//             } catch (err) {
//                 sendResponse({ status: "error", message: err.message });
//             }
//         }, 0);
//         return true;
//     }

// });


async function ReportingActionsV2(actions, process) {
    const processName = `ReportingActionsV2-${process || "default"}`;
    const groupOpened = Logger.startProcessGroup(processName, "ReportingActionsV2");
    Logger.timeStart("ReportingActionsV2", "ReportingActionsV2");

    let completedActions = await new Promise((resolve) => {
        chrome.storage.local.get("completedActions", (result) => {
            resolve(result.completedActions || {});
        });
    });
    let currentProcessCompleted = completedActions[process] || [];

    if (groupOpened) {
        Logger.scenario("Scénario chargé", actions, "ReportingActionsV2");
        Logger.data(`Actions déjà complétées: ${currentProcessCompleted.length} actions`, currentProcessCompleted, "ReportingActionsV2");
    } else {
        Logger.info(`Continuation du process: ${processName}`, { actionsCount: actions?.length }, "ReportingActionsV2");
    }

    let normalize = (obj) => {
        let sortedKeys = Object.keys(obj).sort();
        let normalizedObj = sortedKeys.reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {});
        return JSON.stringify(normalizedObj)
            .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
            .trim();
    };

    const isActionCompleted = (action) => {
        let normalizedAction = normalize({ ...action, sub_action: undefined });
        return currentProcessCompleted.some((completed) => {
            let normalizedCompleted = normalize({ ...completed, sub_action: undefined });
            return normalizedAction === normalizedCompleted;
        });
    };


    const addToCompletedActions = async (action, process) => {
        try {
            let completedAction = { ...action };
            delete completedAction.sub_action;
            currentProcessCompleted.push(completedAction);
            completedActions[process] = currentProcessCompleted;
            await new Promise((resolve) => {
                chrome.storage.local.set({ completedActions }, resolve);
            });
            Logger.success("Action enregistrée", { action: completedAction.action, process }, "ReportingActionsV2");
        } catch (error) {
            Logger.error("Erreur sauvegarde action", error, "ReportingActionsV2");
        }
    };

    for (const action of actions) {
        Logger.groupCollapsed(`🔧 Action: ${action.action}${action.xpath ? ` (${action.xpath})` : ''}`, "ReportingActionsV2");
        Logger.timeStart(`Action-${action.action}`, "ReportingActionsV2");

        if (process !== "youtube_Shorts") {
            if (isActionCompleted(action)) {
                Logger.warning("Action déjà faite, skip", { action: action.action }, "ReportingActionsV2");
                if (action.sub_action?.length > 0) {
                    Logger.step("Sous-actions récursives", { subActionCount: action.sub_action.length }, "ReportingActionsV2");
                    await ReportingActionsV2(action.sub_action, process);
                }
                continue;
            }
        }

        await addToCompletedActions(action, process);

        try {
            if (action.action === "check_if_exist") {
                Logger.debug(`Vérification existence d'élément: "${action.xpath}" (wait: ${action.wait}s)`, { xpath: action.xpath, wait: action.wait }, "ReportingActionsV2");
                let elementExists = await waitForElement(action.xpath, action.wait);

                if (elementExists) {
                    Logger.success(`Élément trouvé: "${action.xpath}"`, { xpath: action.xpath }, "ReportingActionsV2");

                    if (action.type) {
                        Logger.step("Téléchargement déclenché", { type: action.type }, "ReportingActionsV2");
                        await openNewTabAndDownloadFile(action.type);
                        Logger.success("Fichier téléchargé avec succès", action.type, "ReportingActionsV2");
                        throw new Error("🛑 HARD_STOP_DOWNLOAD"); // Arrêt forcé après téléchargement
                    } else if (action.sub_action?.length > 0) {
                        Logger.step("Exécution sous-actions", { subActionCount: action.sub_action.length }, "ReportingActionsV2");
                        await ReportingActionsV2(action.sub_action, process);
                    }
                } else {
                    Logger.warning(`Élément introuvable: "${action.xpath}"`, { xpath: action.xpath }, "ReportingActionsV2");
                }

                if (action.sleep) {
                    Logger.step("Pause action", { duration: action.sleep }, "ReportingActionsV2");
                    await sleep(action.sleep);
                }
            } else if (action.action === "Loop") {
                Logger.info("Loop action démarrée", { limit: action.limit_loop }, "ReportingActionsV2");
                for (let i = 0; i < parseInt(action.limit_loop, 10); i++) {
                    Logger.step("Début itération Loop", { iteration: i + 1 }, "ReportingActionsV2");
                    try {
                        await ReportingActionsV2(action.sub_action, "youtube_Shorts");
                        Logger.success("Itération Loop terminée", { iteration: i + 1 }, "ReportingActionsV2");
                    } catch (error) {
                        // Re-throw HARD_STOP errors
                        if (error.message.includes("HARD_STOP")) {
                            throw error;
                        }
                        Logger.error("Erreur itération Loop", error, "ReportingActionsV2");
                    }
                }
                Logger.step("Loop action terminée", { iterations: action.limit_loop }, "ReportingActionsV2");
            } else {
                Logger.step("SWITCH action", { action: action.action }, "ReportingActionsV2");
                await SWitchCase(action, process);

                if (action.sleep) {
                    Logger.step("Pause action", { duration: action.sleep }, "ReportingActionsV2");
                    await sleep(action.sleep);
                }
            }
        } catch (error) {
            // Re-throw HARD_STOP errors for propagation
            if (error.message.includes("HARD_STOP")) {
                throw error;
            }
            Logger.error(`Erreur action ${action.action}`, error, "ReportingActionsV2");
        }
    }

    Logger.timeEnd("ReportingActionsV2", "ReportingActionsV2");
    Logger.endProcessGroup(processName, "ReportingActionsV2");
    return true;
}



// Fonctions




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Logger.groupCollapsed(`ReportingActions Message: ${message.action}`, "ReportingActions");
    Logger.timeStart(`ReportingActions-${message.action}`, "ReportingActions");
    Logger.info("Message reçu par ReportingActions", {
        action: message.action,
        senderTabId: sender.tab?.id,
        senderUrl: sender.tab?.url,
    }, "ReportingActions");

    if (message.action === "Data_Google_CheckLoginYoutube") {
        Logger.step("Action reçue", { action: message.action }, "ReportingActions");

        (async () => {
            try {
                await ReportingActionsV2(message.data);
                Logger.success("ReportingActionsV2 terminé (CheckLoginYoutube)", null, "ReportingActions");
                chrome.runtime.sendMessage({ action: "Closed_tab_CheckLoginYoutube" });
            } catch (err) {
                if (err.message.includes("HARD_STOP")) {
                    throw err;
                }
                Logger.error("Erreur ReportingActionsV2 (CheckLoginYoutube)", err, "ReportingActions");
            }
        })();

        sendResponse({ status: "done" });
        Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
        Logger.groupEnd();
        return true;
    }

    if (message.action === "Data_Google") {
        Logger.step("Action reçue", { action: message.action }, "ReportingActions");

        setTimeout(async () => {
            try {
                await ReportingActionsV2(message.data);
                Logger.success("ReportingActionsV2 terminé", null, "ReportingActions");
                chrome.runtime.sendMessage({ action: "Closed_tab" });
                sendResponse({ status: "done" });
            } catch (err) {
                if (err.message.includes("HARD_STOP")) {
                    throw err;
                }
                Logger.error("Erreur ReportingActionsV2", err, "ReportingActions");
                sendResponse({ status: "error", message: err.message });
            }
        }, 0);

        Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
        Logger.groupEnd();
        return true;
    }

    if (message.action === "Sub_Data_Google") {
        Logger.step("Action reçue", { action: message.action }, "ReportingActions");

        setTimeout(async () => {
            try {
                await ReportingActionsV2(message.data);
                Logger.success("ReportingActionsV2 terminé (Sub)", null, "ReportingActions");
                chrome.runtime.sendMessage({ action: "Sub_Closed_tab" });
                sendResponse({ status: "done" });
            } catch (err) {
                if (err.message.includes("HARD_STOP")) {
                    throw err;
                }
                Logger.error("Erreur ReportingActionsV2 (Sub)", err, "ReportingActions");
                sendResponse({ status: "error", message: err.message });
            }
        }, 0);

        Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
        Logger.groupEnd();
        return true;
    }

    if (message.action === "Sub_Closed_tab_Finished") {
        Logger.step("Action reçue", { action: message.action }, "ReportingActions");
        setTimeout(() => {
            Logger.success("Sub_Closed_tab_Finished confirmé", null, "ReportingActions");
            sendResponse({ success: true });
        }, 500);

        Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
        Logger.groupEnd();
        return true;
    }

    if (message.action === "Data_Google_Add_Contact") {
        Logger.step("Action reçue", { action: message.action, email: message.email }, "ReportingActions");

        setTimeout(async () => {
            try {
                await ReportingActionsV2(message.data, message.email);
                Logger.success("ReportingActionsV2 terminé (Add Contact)", null, "ReportingActions");
                chrome.runtime.sendMessage({ action: "Closed_tab_Add_Contact" });
                sendResponse({ status: "done" });
            } catch (err) {
                if (err.message.includes("HARD_STOP")) {
                    throw err;
                }
                Logger.error("Erreur ReportingActionsV2 (Add Contact)", err, "ReportingActions");
                sendResponse({ status: "error", message: err.message });
            }
        }, 0);

        Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
        Logger.groupEnd();
        return true;
    }

    Logger.warning("Action non gérée", { action: message.action }, "ReportingActions");
    Logger.timeEnd(`ReportingActions-${message.action}`, "ReportingActions");
    Logger.groupEnd();
    return false;
});
