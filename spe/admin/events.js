
import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const form = document.getElementById("eventForm");
const eventList = document.getElementById("eventList");
const imageInput = document.getElementById("image");
const preview = document.getElementById("imagePreview");
const submit = form.querySelector('button[type="submit"]');

const IMGBB_KEY = "0ae53f2c09442ffc12135ae8839d24f5";

let editingId = null;
let existingImage = "";
let previewURL = null;

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function showPreview(url) {
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }

  if (url) {
    preview.src = url;
    preview.hidden = false;
  } else {
    preview.hidden = true;
    preview.removeAttribute("src");
  }
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) {
    showPreview(existingImage);
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please select an image.");
    imageInput.value = "";
    showPreview(existingImage);
    return;
  }

  previewURL = URL.createObjectURL(file);
  preview.src = previewURL;
  preview.hidden = false;
});

async function uploadImage(file) {
  const data = new FormData();
  data.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
    {
      method: "POST",
      body: data
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error("Image upload failed");
  }

  return result.data.url;
}

function resetForm() {
  editingId = null;
  existingImage = "";
  form.reset();
  showPreview("");
  submit.textContent = "Add Event";
}

async function loadEvents() {
  eventList.replaceChildren();

  try {
    const snapshot = await getDocs(collection(db, "events"));

    snapshot.forEach(item => {
      const event = item.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${safe(event.title)}</td>
        <td>${safe(event.date)}</td>
        <td>
          <button type="button" class="action-btn editBtn">
            Edit
          </button>
          <button type="button" class="action-btn delete deleteBtn">
            Delete
          </button>
        </td>
      `;

      row.querySelector(".editBtn").onclick = () => {
        editingId = item.id;
        existingImage = event.image || "";

        document.getElementById("title").value =
          event.title || "";

        document.getElementById("date").value =
          event.date || "";

        document.getElementById("description").value =
          event.description || "";

        imageInput.value = "";
        showPreview(existingImage);

        submit.textContent = "Update Event";
        form.scrollIntoView({ behavior: "smooth" });
      };

      row.querySelector(".deleteBtn").onclick = async () => {
        if (!confirm("Delete this event?")) return;

        try {
          await deleteDoc(doc(db, "events", item.id));

          if (editingId === item.id) resetForm();

          await loadEvents();
          alert("Event deleted successfully!");
        } catch (error) {
          console.error(error);
          alert("Could not delete event.");
        }
      };

      eventList.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    alert("Could not load events.");
  }
}

form.addEventListener("submit", async e => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value.trim();
  const description =
    document.getElementById("description").value.trim();

  const file = imageInput.files[0];

  if (!title || !date || !description) {
    alert("Please fill in all event details.");
    return;
  }

  submit.disabled = true;
  submit.textContent = "Saving...";

  try {
    let image = existingImage;

    if (file) {
      image = await uploadImage(file);
    }

    const data = {
      title,
      date,
      description,
      image
    };

    if (editingId) {
      await updateDoc(doc(db, "events", editingId), data);
    } else {
      await addDoc(collection(db, "events"), data);
    }

    resetForm();
    await loadEvents();

    alert("Event saved successfully!");

  } catch (error) {
    console.error(error);
    alert("Failed to save event. Please try again.");
  } finally {
    submit.disabled = false;
    if (!editingId) submit.textContent = "Add Event";
  }
});

loadEvents();
