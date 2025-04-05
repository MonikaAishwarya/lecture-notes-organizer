// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDlGuXcKG44ihvegBPDsxC5I-Tf6RDioJM",
  authDomain: "lecture-notes-organizer-1.firebaseapp.com",
  projectId: "lecture-notes-organizer-1",
  storageBucket: "lecture-notes-organizer-1.appspot.com",
  messagingSenderId: "1010797649637",
  appId: "1:1010797649637:web:c47a1c4154d00d7c6dfe0c",
  measurementId: "G-XPER8H185T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// =================== Reminder Logic ===================

// Save Reminder
window.saveReminder = async function () {
  const title = document.getElementById("reminder-title").value.trim();
  const time = document.getElementById("reminder-time").value;

  if (!title || !time) {
    alert("Please enter both description and time.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Not logged in.");
    return;
  }

  try {
    await addDoc(collection(db, "reminders"), {
      userId: user.uid,
      title,
      time: Timestamp.fromDate(new Date(time)),
      createdAt: serverTimestamp()
    });

    document.getElementById("reminder-title").value = "";
    document.getElementById("reminder-time").value = "";
    displayReminders(user.uid);
  } catch (err) {
    console.error("Error saving reminder:", err);
  }
};

// Display Reminders
async function displayReminders(uid) {
  const list = document.getElementById("reminders-list");
  list.innerHTML = "<p>Loading...</p>";

  try {
    const remindersRef = query(
      collection(db, "reminders"),
      where("userId", "==", uid),
      orderBy("time")
    );

    const snapshot = await getDocs(remindersRef);
    list.innerHTML = "";

    if (snapshot.empty) {
      list.innerHTML = "<p>No reminders yet.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const reminderDiv = document.createElement("div");
      reminderDiv.className = "reminder-card";
      const timeStr = data.time.toDate().toLocaleString();

      reminderDiv.innerHTML = `
        <p><strong>${data.title}</strong></p>
        <p>⏰ ${timeStr}</p>
        <button onclick="deleteReminder('${docSnap.id}')">🗑️ Delete</button>
      `;

      list.appendChild(reminderDiv);
    });
  } catch (err) {
    console.error("Error fetching reminders:", err);
    list.innerHTML = "<p>Error loading reminders.</p>";
  }
}

// Delete Reminder
window.deleteReminder = async function (id) {
  try {
    await deleteDoc(doc(db, "reminders", id));
    const user = auth.currentUser;
    if (user) displayReminders(user.uid);
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

// =================== Auth State ===================

onAuthStateChanged(auth, (user) => {
  if (user) {
    displayReminders(user.uid);
  } else {
    alert("Please log in to view reminders.");
    window.location.href = "login.html";
  }
});

// =================== Logout ===================
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
};