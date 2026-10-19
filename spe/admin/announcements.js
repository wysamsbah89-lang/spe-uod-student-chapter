
import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const form = document.getElementById("announcementForm");
const announcementList = document.getElementById("announcementList");
const submitButton = form.querySelector('button[type="submit"]');

let editingId = null;

const fields = ["title", "date", "image", "description"];

const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

async function loadAnnouncements() {
    announcementList.replaceChildren();

    try {
        const snapshot = await getDocs(collection(db, "announcements"));

        snapshot.forEach(item => {
            const announcement = item.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${safe(announcement.title)}</td>
                <td>${safe(announcement.date)}</td>
                <td>
                    <button type="button" class="action-btn editBtn">
                        Edit
                    </button>
                    <button type="button" class="action-btn delete deleteBtn">
                        Delete
                    </button>
                </td>
            `;

            row.querySelector(".editBtn").addEventListener("click", () => {
                editingId = item.id;

                fields.forEach(field => {
                    document.getElementById(field).value =
                        announcement[field] ?? "";
                });

                submitButton.textContent = "Update Announcement";
                form.scrollIntoView({ behavior: "smooth" });
            });

            row.querySelector(".deleteBtn").addEventListener("click", async () => {
                if (!confirm("Delete this announcement?")) return;

                try {
                    await deleteDoc(doc(db, "announcements", item.id));

                    if (editingId === item.id) resetForm();

                    await loadAnnouncements();
                    alert("Announcement deleted successfully!");
                } catch (error) {
                    console.error(error);
                    alert("Could not delete announcement.");
                }
            });

            announcementList.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        alert("Could not load announcements. Please try again.");
    }
}

function resetForm() {
    editingId = null;
    form.reset();
    submitButton.textContent = "Add Announcement";
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = Object.fromEntries(
        fields.map(field => [
            field,
            document.getElementById(field).value.trim()
        ])
    );

    submitButton.disabled = true;

    try {
        if (editingId) {
            await updateDoc(
                doc(db, "announcements", editingId),
                data
            );
        } else {
            await addDoc(collection(db, "announcements"), data);
        }

        resetForm();
        await loadAnnouncements();

        alert("Announcement saved successfully!");
    } catch (error) {
        console.error(error);
        alert("Could not save announcement. Please try again.");
    } finally {
        submitButton.disabled = false;
    }
});

loadAnnouncements();
