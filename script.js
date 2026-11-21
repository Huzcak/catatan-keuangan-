
// DATABASE LOKAL
let transactions = JSON.parse(
    localStorage.getItem("transactions")
) || [];

let editId = null;

// FORMAT RUPIAH
function rupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(number);
}

// TANGGAL HARI INI
const today = new Date();

const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

document.getElementById("date").value = localDate;

// SIMPAN DATABASE
function saveData() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// FORM SUBMIT
document.getElementById("transactionForm")
.addEventListener("submit", function(e) {

    e.preventDefault();

    const transaction = {
        id: editId || Date.now(),
        date: document.getElementById("date").value,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        amount: Number(document.getElementById("amount").value),
        description: document.getElementById("description").value
    };

    if (!Number.isSafeInteger(transaction.amount) ||
        transaction.amount <= 0) {
        alert("Masukkan nominal yang valid.");
        return;
    }

    if (editId !== null) {
        transactions = transactions.map(item =>
            item.id === editId ? transaction : item
        );

        editId = null;
    } else {
        transactions.push(transaction);
    }

    saveData();
    this.reset();

    document.getElementById("date").value = localDate;

    document.getElementById("formTitle").innerText =
        "+ Tambahkan Transaksi";

    document.getElementById("submitBtn").innerText =
        "Simpan Transaksi";

    render();
});

// DASHBOARD
function renderDashboard() {

    let income = 0;
    let expense = 0;

    transactions.forEach(item => {

        if (item.type === "income") {
            income += item.amount;
        } else {
            expense += item.amount;
        }

    });

    document.getElementById("income").innerText =
        rupiah(income);

    document.getElementById("expense").innerText =
        rupiah(expense);

    document.getElementById("balance").innerText =
        rupiah(income - expense);

    document.getElementById("total").innerText =
        transactions.length;
}

// TABEL TRANSAKSI
function renderTransactions() {

    const list = document.getElementById("transactionList");

    const filterDate = document.getElementById("filterDate").value;
    const filterType = document.getElementById("filterType").value;

    let filtered = transactions.filter(item => {

        const matchDate = !filterDate || item.date === filterDate;

        const matchType = filterType === "all" ||
                          item.type === filterType;

        return matchDate && matchType;
    });

    filtered.sort((a,b) =>
        b.date.localeCompare(a.date) || b.id - a.id
    );

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    Belum ada transaksi.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(item => {

        const row = document.createElement("tr");

        const values = [
            item.date,
            item.description || "-",
            item.category,
            item.type === "income" ? "Pemasukan" : "Pengeluaran",
            rupiah(item.amount)
        ];

        values.forEach((value, index) => {

            const cell = document.createElement("td");

            cell.textContent = value;

            if (index === 3) {
                cell.style.color =
                    item.type === "income" ? "#159568" : "#e05252";
            }

            row.appendChild(cell);
        });

        const action = document.createElement("td");
        action.className = "action";

        const editButton = document.createElement("button");
        editButton.className = "edit";
        editButton.textContent = "Edit";
        editButton.onclick = () => editTransaction(item.id);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete";
        deleteButton.textContent = "Hapus";
        deleteButton.onclick = () => deleteTransaction(item.id);

        action.append(editButton, deleteButton);
        row.appendChild(action);

        list.appendChild(row);
    });
}

// EDIT TRANSAKSI
function editTransaction(id) {

    const item = transactions.find(t => t.id === id);

    if (!item) return;

    editId = id;

    document.getElementById("date").value = item.date;
    document.getElementById("type").value = item.type;
    document.getElementById("category").value = item.category;
    document.getElementById("amount").value = item.amount;
    document.getElementById("description").value = item.description;

    document.getElementById("formTitle").innerText =
        "Edit Transaksi";

    document.getElementById("submitBtn").innerText =
        "Update Transaksi";

    window.scrollTo({top: 0, behavior: "smooth"});
}

// HAPUS TRANSAKSI
function deleteTransaction(id) {

    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;

    transactions = transactions.filter(item => item.id !== id);

    if (editId === id) {
        editId = null;

        document.getElementById("transactionForm").reset();
        document.getElementById("date").value = localDate;

        document.getElementById("formTitle").innerText =
            "+ Tambahkan Transaksi";

        document.getElementById("submitBtn").innerText =
            "Simpan Transaksi";
    }

    saveData();
    render();
}

// FILTER
function resetFilter() {

    document.getElementById("filterDate").value = "";
    document.getElementById("filterType").value = "all";

    renderTransactions();
}

document.getElementById("filterDate")
.addEventListener("change", renderTransactions);

document.getElementById("filterType")
.addEventListener("change", renderTransactions);

// GRAFIK 7 HARI
function renderChart() {

    const chart = document.getElementById("chart");
    chart.innerHTML = "";

    const days = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();
        date.setDate(date.getDate() - i);

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        days.push({
            key,
            label: date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short"
            }),
            income: 0,
            expense: 0
        });
    }

    days.forEach(day => {

        transactions.forEach(item => {

            if (item.date === day.key) {

                if (item.type === "income") {
                    day.income += item.amount;
                } else {
                    day.expense += item.amount;
                }
            }
        });
    });

    const maxValue = Math.max(
        1,
        ...days.map(d => Math.max(d.income, d.expense))
    );

    days.forEach(day => {

        const group = document.createElement("div");
        group.className = "bar-group";

        const bars = document.createElement("div");
        bars.className = "bars";

        const incomeBar = document.createElement("div");
        incomeBar.className = "bar income-bar";
        incomeBar.style.height =
            (day.income / maxValue * 125) + "px";
        incomeBar.title = "Pemasukan: " + rupiah(day.income);

        const expenseBar = document.createElement("div");
        expenseBar.className = "bar expense-bar";
        expenseBar.style.height =
            (day.expense / maxValue * 125) + "px";
        expenseBar.title = "Pengeluaran: " + rupiah(day.expense);

        bars.append(incomeBar, expenseBar);

        const label = document.createElement("small");
        label.textContent = day.label;

        group.append(bars, label);
        chart.appendChild(group);
    });
}

// EXPORT CSV
function exportCSV() {

    if (transactions.length === 0) {
        alert("Belum ada data transaksi.");
        return;
    }

    const header = [
        "Tanggal",
        "Jenis",
        "Kategori",
        "Nominal",
        "Keterangan"
    ];

    const rows = transactions.map(item => [
        item.date,
        item.type === "income" ? "Pemasukan" : "Pengeluaran",
        item.category,
        item.amount,
        item.description
    ]);

    function escapeCSV(value) {
        return '"' + String(value ?? "").replace(/"/g, '""') + '"';
    }

    const csv = [header, ...rows]
        .map(row => row.map(escapeCSV).join(";"))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        {type: "text/csv;charset=utf-8;"}
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-keuangan.csv";
    link.click();

    URL.revokeObjectURL(url);
}

// RENDER SEMUA
function render() {
    renderDashboard();
    renderTransactions();
    renderChart();
}

// JALANKAN APLIKASI
render();
