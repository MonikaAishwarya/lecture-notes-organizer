// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlGuXcKG44ihvegBPDsxC5I-Tf6RDioJM",
  authDomain: "lecture-notes-organizer-1.firebaseapp.com",
  projectId: "lecture-notes-organizer-1",
  storageBucket: "lecture-notes-organizer-1.firebasestorage.app",
  messagingSenderId: "1010797649637",
  appId: "1:1010797649637:web:c47a1c4154d00d7c6dfe0c",
  measurementId: "G-XPER8H185T",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ====================== AUTH =========================

// Sign Up
document.getElementById("signup-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Sign-up successful!");
      window.location.href = "login.html";
    })
    .catch((error) => alert(error.message));
});

// Log In
document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "dashboard.html";
    })
    .catch((error) => alert(error.message));
});

// ===================== NOTES =========================

window.saveNote = function () {
  const noteInput = document.getElementById("note-input");
  const fileInput = document.getElementById("note-file");
  const content = noteInput.value.trim();
  const file = fileInput.files[0];

  if (!content && !file) {
    alert("Please write something or upload a file.");
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  const noteData = {
    content,
    userId: user.uid,
    timestamp: serverTimestamp(),
  };

  if (file) {
    const fileRef = ref(storage, `notes/${user.uid}/${Date.now()}_${file.name}`);
    uploadBytes(fileRef, file)
      .then((snapshot) => getDownloadURL(snapshot.ref))
      .then((downloadURL) => {
        noteData.fileUrl = downloadURL;
        noteData.fileName = file.name;
        return addDoc(collection(db, "notes"), noteData);
      })
      .then(() => {
        noteInput.value = "";
        fileInput.value = "";
        displayNotes(user.uid);
      })
      .catch((error) => console.error("Error uploading file:", error));
  } else {
    addDoc(collection(db, "notes"), noteData).then(() => {
      noteInput.value = "";
      fileInput.value = "";
      displayNotes(user.uid);
    });
  }
};

// Display Notes
function displayNotes(uid) {
  const notesList = document.getElementById("notes-list");
  if (!notesList) return;

  notesList.innerHTML = "<p>Loading notes...</p>";

  const q = query(
    collection(db, "notes"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc")
  );

  getDocs(q)
    .then((snapshot) => {
      notesList.innerHTML = "";

      if (snapshot.empty) {
        notesList.innerHTML = "<p>No notes yet.</p>";
        return;
      }

      snapshot.forEach((docSnap) => {
        const note = docSnap.data();
        const noteDiv = document.createElement("div");
        noteDiv.className = "note-card";

        let html = `
          <p>${note.content || ""}</p>
          <small>${note.timestamp?.toDate().toLocaleString() || "No timestamp"}</small><br>
        `;

        if (note.fileUrl) {
          const isImage = note.fileName.match(/\.(jpeg|jpg|gif|png)$/);
          if (isImage) {
            html += `<br><img src="${note.fileUrl}" alt="Uploaded Image" style="max-width: 200px;"><br>`;
          } else {
            html += `<br><a href="${note.fileUrl}" target="_blank">📎 ${note.fileName}</a><br>`;
          }
        }

        html += `
          <button onclick="editNote('${docSnap.id}', \`${note.content}\`)">✏️ Edit</button>
          <button onclick="deleteNote('${docSnap.id}')">🗑️ Delete</button>
        `;

        noteDiv.innerHTML = html;
        notesList.appendChild(noteDiv);
      });
    })
    .catch((error) => {
      console.error("Error fetching notes:", error);
      notesList.innerHTML = "<p>Error loading notes.</p>";
    });
}

// Delete Note
window.deleteNote = function (id) {
  if (confirm("Are you sure you want to delete this note?")) {
    deleteDoc(doc(db, "notes", id))
      .then(() => {
        const user = auth.currentUser;
        if (user) displayNotes(user.uid);
      })
      .catch((error) => console.error("Error deleting note:", error));
  }
};

// Edit Note
window.editNote = function (id, currentContent) {
  const newContent = prompt("Edit your note:", currentContent);
  if (newContent) {
    updateDoc(doc(db, "notes", id), {
      content: newContent,
      timestamp: serverTimestamp(),
    }).then(() => {
      const user = auth.currentUser;
      if (user) displayNotes(user.uid);
    });
  }
};

// Log Out
window.logout = function () {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      window.location.href = "index.html";
    });
};

// Auto-load notes if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    displayNotes(user.uid);
  } else if (window.location.pathname.includes("dashboard")) {
    window.location.href = "login.html";
  }
});