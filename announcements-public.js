
import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const container = document.getElementById("announcementList");

const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

async function loadAnnouncements() {
    if (!container) return;

    container.replaceChildren();

    try {
        const snapshot = await getDocs(collection(db, "announcements"));

        snapshot.forEach(document => {
            const announcement = document.data();
            const card = document.createElement("div");

            card.className = "news-card";

            const image = announcement.image
                ? `<img src="${safe(announcement.image)}" alt="${safe(announcement.title)}" loading="lazy">`
                : "";

            card.innerHTML = `
                <span class="news-type">ANNOUNCEMENT</span>
                ${image}
                <div class="news-content">
                    <span class="news-date">${safe(announcement.date)}</span>
                    <h3>${safe(announcement.title)}</h3>
                    <p>${safe(announcement.description)}</p>
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Could not load announcements:", error);
    }
}

loadAnnouncements();
