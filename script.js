// ==========================================
// SMART EXPENSE TRACKER
// ==========================================

// Load saved information
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
let goals = JSON.parse(localStorage.getItem("goals") || "[]");

let currentType = "expense";
let overviewChart;
let categoryChart;


// ==========================================
// HELPERS
// ==========================================

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("goals", JSON.stringify(goals));
}

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function escapeHTML(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}


// ==========================================
// TRANSACTIONS
// ==========================================

function openTransaction() {

    document.getElementById("date").value =
        new Date().toISOString().slice(0, 10);

    openModal("transactionModal");
}

function setType(type, button) {

    currentType = type;

    document.getElementById("transactionType").value = type;

    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");
}

document.getElementById("transactionForm").addEventListener("submit", function (e) {

    e.preventDefault();

    const transaction = {
        id: Date.now(),

        type: currentType,

        amount: Number(document.getElementById("amount").value),

        category: document.getElementById("category").value,

        date: document.getElementById("date").value,

        payment: document.getElementById("payment").value,

        account: document.getElementById("account").value,

        description: document.getElementById("description").value,

        attachment: document.getElementById("attachment").files[0]?.name || ""
    };

    transactions.push(transaction);

    saveData();

    renderAll();

    closeModal("transactionModal");

    this.reset();

    alert("Transaction saved successfully!");
});

function deleteTransaction(id) {

    if (!confirm("Delete this transaction?")) return;

    transactions = transactions.filter(t => t.id !== id);

    saveData();

    renderAll();
}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const upiExpenses = transactions
        .filter(t => t.type === "expense" && t.payment === "UPI")
        .reduce((sum, t) => sum + t.amount, 0);

    document.getElementById("income").textContent = money(totalIncome);

    document.getElementById("expenses").textContent = money(totalExpenses);

    document.getElementById("balance").textContent =
        money(totalIncome - totalExpenses);

    document.getElementById("upiTotal").textContent = money(upiExpenses);
}


// ==========================================
// TRANSACTION TABLE
// ==========================================

function renderTransactions() {

    const search = document.getElementById("search").value.toLowerCase();

    const filtered = transactions.filter(t =>
        (t.description || "").toLowerCase().includes(search) ||
        (t.category || "").toLowerCase().includes(search) ||
        (t.payment || "").toLowerCase().includes(search)
    );

    const rows = document.getElementById("transactionRows");

    if (filtered.length === 0) {

        rows.innerHTML = `
            <tr>
                <td colspan="6">No transactions found.</td>
            </tr>
        `;

        return;
    }

    rows.innerHTML = filtered.slice().reverse().map(t => {

        let color = t.type === "income" ? "green" : "red";

        let sign = t.type === "income" ? "+" : "−";

        return `
            <tr>
                <td>
                    <b>${escapeHTML(t.description || t.category)}</b>
                    <br>
                    <small>${escapeHTML(t.account || "")}</small>
                </td>

                <td>${escapeHTML(t.category)}</td>

                <td>${escapeHTML(t.date)}</td>

                <td>${escapeHTML(t.payment)}</td>

                <td class="${color}">
                    ${sign}${money(t.amount)}
                </td>

                <td>
                    <button class="delete-btn"
                    onclick="deleteTransaction(${t.id})">
                    Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

document.getElementById("search").addEventListener("input", renderTransactions);


// ==========================================
// CHARTS
// ==========================================

function updateCharts() {

    if (typeof Chart === "undefined") return;

    const income = transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

    if (overviewChart) overviewChart.destroy();

    overviewChart = new Chart(document.getElementById("overviewChart"), {

        type: "bar",

        data: {
            labels: ["Income", "Expenses"],

            datasets: [{
                data: [income, expenses],

                backgroundColor: ["#14b88a", "#ef7d83"],

                borderRadius: 8
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });


    let categories = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {

            categories[t.category] =
                (categories[t.category] || 0) + t.amount;

        });

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(document.getElementById("categoryChart"), {

        type: "doughnut",

        data: {
            labels: Object.keys(categories),

            datasets: [{
                data: Object.values(categories),

                backgroundColor: [
                    "#0d9488",
                    "#60a5fa",
                    "#f59e0b",
                    "#a78bfa",
                    "#f472b6",
                    "#34d399",
                    "#fb7185",
                    "#94a3b8"
                ]
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ==========================================
// BILL REMINDERS
// ==========================================

function openReminder() {

    document.getElementById("billDate").value =
        new Date().toISOString().slice(0, 10);

    openModal("reminderModal");
}

document.getElementById("reminderForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const reminder = {

        id: Date.now(),

        name: document.getElementById("billName").value,

        amount: Number(document.getElementById("billAmount").value || 0),

        dueDate: document.getElementById("billDate").value,

        repeat: document.getElementById("billRepeat").value,

        paid: false
    };

    reminders.push(reminder);

    saveData();

    renderReminders();

    closeModal("reminderModal");

    this.reset();

    checkReminders();

    alert("Bill reminder created!");
});


function renderReminders() {

    const list = document.getElementById("reminderList");

    if (reminders.length === 0) {

        list.innerHTML = "<p>No reminders added yet.</p>";

        return;
    }

    list.innerHTML = reminders.map(r => {

        const days = daysUntil(r.dueDate);

        let status;

        if (r.paid) {
            status = `<span class="paid">Paid</span>`;
        } else if (days < 0) {
            status = `<span class="due">Overdue</span>`;
        } else if (days === 0) {
            status = `<span class="due">Due Today</span>`;
        } else if (days <= 3) {
            status = `<span class="due">Due in ${days} days</span>`;
        } else {
            status = `<span class="due">Upcoming</span>`;
        }

        return `
            <div class="reminder-card">

                <h4>🔔 ${escapeHTML(r.name)}</h4>

                <p>Amount: ${money(r.amount)}</p>

                <p>Due: ${escapeHTML(r.dueDate)}</p>

                <p>Repeat: ${escapeHTML(r.repeat)}</p>

                ${status}

                <div class="goal-actions">

                    ${!r.paid ? `
                    <button class="secondary"
                    onclick="markPaid(${r.id})">
                    Mark Paid
                    </button>` : ""}

                    <button class="delete-btn"
                    onclick="deleteReminder(${r.id})">
                    Delete
                    </button>

                </div>

            </div>
        `;
    }).join("");
}


function daysUntil(date) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const due = new Date(date + "T00:00:00");

    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}


function markPaid(id) {

    const reminder = reminders.find(r => r.id === id);

    if (!reminder) return;

    reminder.paid = true;

    saveData();

    renderReminders();

    alert("Bill marked as paid!");
}


function deleteReminder(id) {

    reminders = reminders.filter(r => r.id !== id);

    saveData();

    renderReminders();
}


function checkReminders() {

    reminders.forEach(r => {

        if (r.paid) return;

        const days = daysUntil(r.dueDate);

        if (days === 0) {

            alert(
                "🔔 Bill Reminder!\n\n" +
                r.name + " is due today.\n" +
                "Amount: " + money(r.amount)
            );

        } else if (days === 1) {

            alert(
                "⚠️ Reminder!\n\n" +
                r.name + " is due tomorrow.\n" +
                "Amount: " + money(r.amount)
            );

        } else if (days < 0) {

            alert(
                "⚠️ Overdue Bill!\n\n" +
                r.name + " is overdue.\n" +
                "Amount: " + money(r.amount)
            );

        }

    });

}


// ==========================================
// SAVINGS GOALS
// ==========================================

function openGoal() {

    openModal("goalModal");
}

document.getElementById("goalForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const goal = {

        id: Date.now(),

        name: document.getElementById("goalName").value,

        target: Number(document.getElementById("goalTarget").value),

        saved: Number(document.getElementById("goalSaved").value || 0),

        date: document.getElementById("goalDate").value
    };

    goals.push(goal);

    saveData();

    renderGoals();

    closeModal("goalModal");

    this.reset();

    alert("Savings goal created!");
});


function renderGoals() {

    const list = document.getElementById("goalList");

    if (goals.length === 0) {

        list.innerHTML = "<p>Create your first savings goal!</p>";

        return;
    }

    list.innerHTML = goals.map(g => {

        const percentage = Math.min(
            100,
            Math.round((g.saved / g.target) * 100)
        );

        const remaining = Math.max(0, g.target - g.saved);

        return `
            <div class="goal-card">

                <h4>🎯 ${escapeHTML(g.name)}</h4>

                <p>Target: ${money(g.target)}</p>

                <p>Saved: ${money(g.saved)}</p>

                <p>Remaining: ${money(remaining)}</p>

                <div class="progress-bar">
                    <div class="progress"
                    style="width:${percentage}%"></div>
                </div>

                <p>${percentage}% completed</p>

                <p>Target date: ${escapeHTML(g.date || "Not set")}</p>

                <div class="goal-actions">

                    <button class="primary"
                    onclick="addSavings(${g.id})">
                    + Add Savings
                    </button>

                    <button class="delete-btn"
                    onclick="deleteGoal(${g.id})">
                    Delete
                    </button>

                </div>

            </div>
        `;
    }).join("");
}


function addSavings(id) {

    document.getElementById("contributeGoalId").value = id;

    document.getElementById("contributeAmount").value = "";

    openModal("contributeModal");
}


document.getElementById("contributeForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const id = Number(document.getElementById("contributeGoalId").value);

    const amount = Number(document.getElementById("contributeAmount").value);

    const goal = goals.find(g => g.id === id);

    if (!goal || amount <= 0) return;

    goal.saved += amount;

    saveData();

    renderGoals();

    closeModal("contributeModal");

    if (goal.saved >= goal.target) {

        alert("🎉 Congratulations! You achieved your savings goal!");
    } else {

        alert("Savings added successfully!");
    }

});


function deleteGoal(id) {

    if (!confirm("Delete this savings goal?")) return;

    goals = goals.filter(g => g.id !== id);

    saveData();

    renderGoals();
}


// ==========================================
// VOICE INPUT
// ==========================================

function startVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert("Voice recognition is not supported. Please use Chrome.");

        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    document.getElementById("voiceStatus").textContent =
        "Listening... Speak now.";

    recognition.onresult = function(event) {

        const speech = event.results[0][0].transcript;

        document.getElementById("voiceStatus").textContent =
            "Recognized: " + speech;

        const amountMatch = speech.match(/\d+(\.\d+)?/);

        const amount = amountMatch ? amountMatch[0] : "";

        const lower = speech.toLowerCase();

        let category = "Other";

        const categories = [
            "food",
            "travel",
            "shopping",
            "electricity",
            "health",
            "education",
            "entertainment",
            "rent"
        ];

        categories.forEach(c => {

            if (lower.includes(c)) category = c;
        });

        openTransaction();

        document.getElementById("amount").value = amount;

        document.getElementById("description").value = speech;

        document.getElementById("category").value = category;

        if (lower.includes("upi")) {

            document.getElementById("payment").value = "UPI";

        } else if (lower.includes("cash")) {

            document.getElementById("payment").value = "Cash";
        }

    };

    recognition.onerror = function() {

        document.getElementById("voiceStatus").textContent =
            "Voice recognition failed. Try again.";
    };

    recognition.start();
}


// ==========================================
// DOCUMENT UPLOAD
// ==========================================

document.getElementById("documentFile").addEventListener("change", function() {

    const files = Array.from(this.files);

    document.getElementById("fileInfo").innerHTML =
        files.map(f => "📎 " + escapeHTML(f.name)).join("<br>");

});


// ==========================================
// RECEIPT SCANNER WITH OCR
// ==========================================

document.getElementById("receiptFile").addEventListener("change", async function() {

    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        document.getElementById("ocrStatus").textContent =
            "Please select an image for OCR.";

        return;
    }

    document.getElementById("ocrStatus").textContent =
        "Scanning receipt... Please wait.";

    try {

        const result = await Tesseract.recognize(file, "eng");

        const text = result.data.text;

        document.getElementById("ocrStatus").innerHTML =
            "<b>Extracted text:</b><br>" +
            escapeHTML(text.substring(0, 500));

        const amountMatch = text.match(
            /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i
        );

        if (amountMatch) {

            const amount = amountMatch[1];

            if (confirm("Possible amount detected: ₹" + amount +
                "\nWould you like to add this transaction?")) {

                openTransaction();

                document.getElementById("amount").value = amount;

                document.getElementById("description").value =
                    "Scanned receipt";
            }
        }

    } catch (error) {

        document.getElementById("ocrStatus").textContent =
            "Could not scan this receipt. Try a clearer image.";
    }

});


// ==========================================
// UPI LINK
// ==========================================

function openUPI() {

    const amount = prompt("Enter payment amount (optional):");

    const receiver = prompt("Enter UPI ID (optional):");

    const note = prompt("Enter payment note:", "Expense Tracker");

    let url = "upi://pay?";

    if (receiver) {
        url += "pa=" + encodeURIComponent(receiver) + "&";
    }

    if (amount && Number(amount) > 0) {
        url += "am=" + encodeURIComponent(amount) + "&";
    }

    url += "tn=" + encodeURIComponent(note || "Payment");

    window.location.href = url;
}


// ==========================================
// CSV IMPORT
// ==========================================

document.getElementById("statementFile").addEventListener("change", function() {

    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {

        const lines = event.target.result.split(/\r?\n/);

        let imported = 0;

        for (let i = 1; i < lines.length; i++) {

            if (!lines[i].trim()) continue;

            const cols = lines[i].split(",");

            if (cols.length < 3) continue;

            const amount = Number(cols[1]);

            if (!amount || isNaN(amount)) continue;

            transactions.push({

                id: Date.now() + i,

                type: amount >= 0 ? "income" : "expense",

                amount: Math.abs(amount),

                category: cols[2] || "Other",

                date: cols[0] || new Date().toISOString().slice(0, 10),

                payment: "UPI",

                account: "Imported Statement",

                description: cols[3] || "Imported Transaction",

                attachment: ""
            });

            imported++;
        }

        saveData();

        renderAll();

        alert(imported + " transactions imported.");

    };

    reader.readAsText(file);

});


// ==========================================
// CSV EXPORT
// ==========================================

function exportCSV() {

    const header =
        "Type,Amount,Category,Date,Payment,Account,Description\n";

    const rows = transactions.map(t => {

        return [
            t.type,
            t.amount,
            t.category,
            t.date,
            t.payment,
            t.account,
            t.description
        ].map(value => '"' + String(value || "").replaceAll('"', '""') + '"')
        .join(",");
    });

    const csv = header + rows.join("\n");

    const blob = new Blob([csv], {
        type: "text/csv"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "SmartExpenseTracker.csv";

    link.click();

    URL.revokeObjectURL(link.href);
}


// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {

    updateDashboard();

    renderTransactions();

    updateCharts();

    renderReminders();

    renderGoals();
}


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

renderAll();

checkReminders();