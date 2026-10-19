
import { db } from "./firebase.js";

import {
    collection, addDoc, getDocs, deleteDoc,
    updateDoc, doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const form = document.getElementById("announcementForm");
const list = document.getElementById("announcementList");
const submit = form.querySelector('button[type="submit"]');
const imageInput = document.getElementById("image");
const preview = document.getElementById("imagePreview");

const IMGBB_KEY = "0ae53f2c09442ffc12135ae8839d24f5";

let editingId = null;
let existingImage = "";

const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    }[ch]));

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please choose an image.");
        imageInput.value = "";
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
});

async function uploadImage(file) {
    const body = new FormData();
    body.append("image", file);

    const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
        { method: "POST", body }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error("Photo upload failed.");
    }

    return result.data.url;
}

async function loadAnnouncements() {
    list.replaceChildren();

    try {
        const snapshot = await getDocs(collection(db, "announcements"));

        snapshot.forEach(item => {
            const a = item.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${safe(a.title)}</td>
                <td>${safe(a.date)}</td>
                <td>
                    <button type="button" class="action-btn editBtn">Edit</button>
                    <button type="button" class="action-btn delete deleteBtn">Delete</button>
                </td>`;

            row.querySelector(".editBtn").onclick = () => {
                editingId = item.id;
                existingImage = a.image || "";

                document.getElementById("title").value = a.title || "";
                document.getElementById("date").value = a.date || "";
                document.getElementById("description").value = a.description || "";

                imageInput.value = "";

                if (existingImage) {
                    preview.src = existingImage;
                    preview.hidden = false;
                } else {
                    preview.hidden = true;
                }

                submit.textContent = "Update Announcement";
                form.scrollIntoView({ behavior: "smooth" });
            };

            row.querySelector(".deleteBtn").onclick = async () => {
                if (!confirm("Delete this announcement?")) return;

                try {
                    await deleteDoc(doc(db, "announcements", item.id));

                    if (editingId === item.id) resetForm();

                    await loadAnnouncements();
                } catch (error) {
                    console.error(error);
                    alert("Could not delete announcement.");
                }
            };

            list.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        alert("Could not load announcements.");
    }
}

function resetForm() {
    editingId = null;
    existingImage = "";
    form.reset();
    preview.hidden = true;
    preview.removeAttribute("src");
    submit.textContent = "Add Announcement";
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const date = document.getElementById("date").value.trim();
    const description = document.getElementById("description").value.trim();
    const file = imageInput.files[0];

    if (!title || !date || !description) {
        alert("Please enter a title, date, and description.");
        return;
    }

    submit.disabled = true;
    submit.textContent = "Saving...";

    try {
        let image = existingImage;

        if (file) {
            image = await uploadImage(file);
        }

        const data = { title, date, description, image };

        if (editingId) {
            await updateDoc(doc(db, "announcements", editingId), data);
        } else {
            await addDoc(collection(db, "announcements"), data);
        }

        resetForm();
        await loadAnnouncements();
        alert("Announcement saved successfully!");
    } catch (error) {
        console.error(error);
        alert("Could not save the announcement or upload its photo. Please try again.");
    } finally {
        submit.disabled = false;

        if (!editingId) {
            submit.textContent = "Add Announcement";
        }
    }
});

loadAnnouncements();
