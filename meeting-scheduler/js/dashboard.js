// dashboard.js
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const apiBase = "http://localhost:5000/api";

if (!token) {
  alert("Please login first");
  window.location = "login.html";
}

// Fetch meetings for logged-in user
async function fetchMeetings() {
  const res = await fetch(`${apiBase}/dashboard/${userId}`, {
    headers: { Authorization: token },
  });
  const data = await res.json();

  const today = new Date().toISOString().split("T")[0];
  const table = document.getElementById("meetingsTable");
  const notificationsDiv = document.getElementById("notifications");
  table.innerHTML = "";
  notificationsDiv.innerHTML = "";

  data.forEach((meeting) => {
    const meetingDate = meeting.meeting_date.split("T")[0];

    // Add to today's meetings table
    if (meetingDate === today) {
      notificationsDiv.innerHTML += `
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-2">
          Meeting with ${meeting.company_name} today at ${meeting.meeting_date
        .split("T")[1]
        .slice(0, 5)}
        </div>
      `;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="border px-4 py-2">${meeting.company_name}</td>
      <td class="border px-4 py-2">${meeting.contact_person}</td>
      <td class="border px-4 py-2">${meeting.medium}</td>
      <td class="border px-4 py-2">${meeting.meeting_date.replace(
        "T",
        " "
      )}</td>
      <td class="border px-4 py-2">${meeting.outcome || ""}</td>
    `;
    table.appendChild(row);
  });
}

fetchMeetings();
