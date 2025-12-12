const token = localStorage.getItem("token");
const apiBase = "http://localhost:5000/api";

if (!token) {
  alert("Please login first");
  window.location = "login.html";
}

// Populate participants from backend
async function loadParticipants() {
  try {
    const res = await fetch(`${apiBase}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    const select = document.getElementById("participantsSelect");
    users.forEach((u) => {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent = u.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load participants");
  }
}

loadParticipants();

document.getElementById("meetingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const participants = Array.from(formData.getAll("participants[]"));

  const nextMeetingDate = formData.get("next_meeting_date") || null;
  const nextMeetingTopic = formData.get("next_meeting_topic") || null;

  const body = {
    company_name: formData.get("company_name"),
    contact_person: formData.get("contact_person"),
    medium: formData.get("medium"),
    meeting_date: formData.get("meeting_date"),
    discussed_matter: formData.get("discussed_matter"),
    outcome: formData.get("outcome"),
    next_meeting_date: nextMeetingDate,
    next_meeting_topic: nextMeetingTopic,
    participants,
  };

  try {
    const res = await fetch(`${apiBase}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Meeting added!");
      form.reset();
    } else {
      alert(data.message || "Error adding meeting");
    }
  } catch (err) {
    console.error(err);
    alert("Error adding meeting");
  }
});
