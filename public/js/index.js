document.addEventListener("DOMContentLoaded", async () => {
  const popup = document.getElementById("popupForm");
  const popupTrip = document.getElementById("trippopupForm");
  const openBtn = document.getElementById("openFormBtn");
  const openTripBtn = document.getElementById("addtrip");
  const select = document.querySelector("select[name='tripname1']");
  const tableBody = document.querySelector("#tripRecordsTable tbody");
  const expTableBody = document.querySelector("#Total_expenses tbody");
  const exptable = document.querySelector("#expensesTable tbody");
  const mainBody = document.getElementById("main-data-content");
  const expense_popup = document.getElementById("addexpense");
  const popupexpense = document.getElementById("expenseform");
  const selectguest = document.querySelector("select[name='guestname']");
  const editPopup = document.getElementById("editAmountPopup");
  const editAmountInput = document.getElementById("editAmountInput");
  const saveAmountBtn = document.getElementById("saveAmountBtn");
  const summary = document.getElementById("summary");
  const generatesummary = document.getElementById("generatesummary");

  try {
    const response = await fetch("/api/trips");
    const trips = await response.json();
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select a trip";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    trips.forEach((trip) => {
      const option = document.createElement("option");
      option.value = trip._id;
      option.textContent = trip.tripname;
      select.appendChild(option);
    });
  } catch (err) {
    showNotification("Failed to load trips on app start");
  }

  selectguest.addEventListener("change", (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const flatNumber = selectedOption.getAttribute("data-flat");
    const selectedFlatNumber = flatNumber;
    const selectedTripId = selectedOption.getAttribute("data-tripid");

    document.getElementById("flat").value = selectedFlatNumber;
    document.getElementById("trip_id").value = selectedTripId;
    // console.log("Selected trip number:", selectedGuestName);
  });

  expense_popup.onclick = async () => {
    popupexpense.style.display = "flex";
    popupexpense.style.zIndex = "1";
    const tripId = select.value;
    if (!tripId) return;
    try {
      const response = await fetch(`/api/trip/${tripId}`);
      const guests = await response.json();
      selectguest.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Select the Guest";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      selectguest.appendChild(defaultOption);
      guests.forEach((guest) => {
        const option = document.createElement("option");
        option.value = guest.guestname;
        option.textContent = guest.guestname;
        option.setAttribute("data-flat", guest.flatNumber);
        option.setAttribute("data-tripid", guest.trip_id);
        selectguest.appendChild(option);
      });
    } catch (err) {
      showNotification("Failed to load guest list");
    }
  };

  window.closeExpenseForm = function () {
    popupexpense.style.display = "none";
  };

  generatesummary.onclick = async () => {
    summary.style.display = "flex";
    const tripId = select.value;
    try {
      const response_exp = await fetch(`/api/trips/${tripId}`);
      const records_exp = await response_exp.json();
      if (records_exp.length > 0) {
        expTableBody.innerHTML = "";
        const summaryMap = new Map();
        records_exp.forEach(({ guestname, flatNumber, amount }) => {
          const key = `${guestname}-${flatNumber}`;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, { guestname, flatNumber, amount });
          } else {
            summaryMap.get(key).amount += amount;
          }
        });
        const summary = Array.from(summaryMap.values());
        console.log(summary);

        summary.forEach((record) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td>${record.guestname}</td>
          <td>${record.flatNumber}</td>
          <td>${record.amount}</td>
        `;
          expTableBody.appendChild(row);
        });
      }
    } catch (err) {
      showNotification("Failed to load Details");
    }
  };

  openBtn.onclick = async () => {
    popup.style.display = "flex";
    popup.style.zIndex = "1";
    document.getElementById("name").value = "";
    document.getElementById("flatNumber").value = "";
    document.getElementById("noOfAdults").value = "";
    document.getElementById("noOfKids").value = "";

    try {
      const response = await fetch("/api/trips");
      const trips = await response.json();
      const select = document.querySelector(
        "#popupForm select[name='tripname']"
      );
      select.innerHTML = "";
      trips.forEach((trip) => {
        const option = document.createElement("option");
        option.value = trip._id;
        option.textContent = trip.tripname;
        select.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to load trips:", err);
    }
  };

  openTripBtn.onclick = () => {
    popupTrip.style.display = "flex";
    popupTrip.style.zIndex = "1";
  };

  window.closeForm = function () {
    popup.style.display = "none";
  };

  window.closeTripForm = function () {
    popupTrip.style.display = "none";
  };

  window.submitTripForm = async function () {
    const tripname = document.getElementById("tripname").value;
    console.log({ tripname });

    try {
      const response = await fetch("/addtrip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tripname }),
      });

      const result = await response.json();

      if (result.success) {
        const newOption = document.createElement("option");
        newOption.value = result._id || tripname;
        newOption.textContent = tripname;
        select.appendChild(newOption);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error:", err);
    }
    closeTripForm();
  };

  window.submitForm = async function () {
    const guestname = document.getElementById("name").value;
    const flatNumber = document.getElementById("flatNumber").value;
    const adults = document.getElementById("noOfAdults").value;
    const kids = document.getElementById("noOfKids").value;
    const trip_id = document.getElementById("tripd").value;

    console.log({ guestname, flatNumber, adults, kids, trip_id });

    try {
      const response = await fetch("/addguest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestname,
          flatNumber,
          adults,
          kids,
          trip_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification("Guest added successfully!");
      } else {
        showNotification(result.message);
      }
    } catch (err) {
      console.error("Error:", err);
    }

    closeForm();
  };

  window.submitExpenseForm = async function () {
    const guestname = document.getElementById("guestname").value;
    const flatNumber = document.getElementById("flat").value;
    const category = document.getElementById("category").value;
    const amt = Number(document.getElementById("amount").value);
    const trip_id = document.getElementById("trip_id").value;
    console.log({ guestname, flatNumber, category, amt, trip_id });
    try {
      const response = await fetch("/addexpense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestname,
          flatNumber,
          trip_id,
          category,
          amount: amt,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showNotification("Expense added successfully!");
        const response_exp = await fetch(`/api/trips/${trip_id}`);
        const records_exp = await response_exp.json();
        exptable.innerHTML = "";
        if (records_exp.length === 0) {
          const emptyRow = document.createElement("tr");
          emptyRow.innerHTML = `<td colspan="5">No records found for this trip</td>`;
          exptable.appendChild(emptyRow);
          return;
        }
        records_exp.forEach((record) => {
          mainBody.style.display = "flex";
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${record.guestname}</td>
            <td>${record.flatNumber}</td>
            <td>${record.category}</td>
            <td>${record.amount}</td>
          `;
          exptable.appendChild(row);
        });
      } else {
        showNotification(result.message);
      }
    } catch (err) {
      console.error("Error:", err);
    }
    closeExpenseForm();
  };

  select.addEventListener("change", async (e) => {
    const tripId = e.target.value;
    try {
      const response = await fetch(`/api/trip/${tripId}`);
      const records = await response.json();
      tableBody.innerHTML = "";
      if (records.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="5">No records found for this trip</td>`;
        tableBody.appendChild(emptyRow);
        return;
      }
      records.forEach((record) => {
        mainBody.style.display = "flex";
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${record.guestname}</td>
        <td>${record.flatNumber}</td>
        <td>${record.adults}</td>
        <td>${record.kids}</td>
      `;
        tableBody.appendChild(row);
      });

      const response_exp = await fetch(`/api/trips/${tripId}`);
      const records_exp = await response_exp.json();
      exptable.innerHTML = "";
      if (records_exp.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="5">No records found for this trip</td>`;
        exptable.appendChild(emptyRow);
        return;
      }
      records_exp.forEach((record) => {
        mainBody.style.display = "flex";
        const row = document.createElement("tr");
        row.setAttribute("data-id", record._id);
        row.innerHTML = `
        <td>${record.guestname}</td>
        <td>${record.flatNumber}</td>
        <td>${record.category}</td>
        <td>${record.amount}</td>
      `;
        exptable.appendChild(row);
      });

      const response_exp_sum = await fetch(`/api/trips/${tripId}`);
      const records_exp_sum = await response_exp_sum.json();
      if (records_exp_sum.length > 0) {
        expTableBody.innerHTML = "";
        const summaryMap = new Map();
        records_exp_sum.forEach(({ guestname, flatNumber, amount }) => {
          const key = `${guestname}-${flatNumber}`;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, { guestname, flatNumber, amount });
          } else {
            summaryMap.get(key).amount += amount;
          }
        });
        const summary = Array.from(summaryMap.values());
        console.log(summary);

        summary.forEach((record) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td>${record.guestname}</td>
          <td>${record.flatNumber}</td>
          <td>${record.amount}</td>
        `;
          expTableBody.appendChild(row);
        });
      }
    } catch (err) {
      showNotification("Failed to load trip records");
      exptable.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
      tableBody.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
      expTableBody.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
    }
  });

  let selectedExpenseRow = null;

  document.getElementById("expensesTable").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row || row.parentNode.tagName === "THEAD") return;
    selectedExpenseRow = row;
    selectedRecordId = row.dataset.id;
    const currentAmount = row.cells[3].textContent;
    editAmountInput.value = currentAmount;
    editPopup.style.display = "flex";
  });

  saveAmountBtn.addEventListener("click", async () => {
    const newAmount = editAmountInput.value;
    if (selectedExpenseRow) {
      selectedExpenseRow.cells[3].textContent = newAmount;
      try {
        const response = await fetch(`/update-expense/${selectedRecordId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: newAmount }),
        });

        const result = await response.json();
        if (result.success) {
          showNotification("Amount updated successfully!");
        } else {
          showNotification("Failed to update amount");
        }
      } catch (err) {
        console.error("Update error:", err);
        showNotification("Error updating amount");
      }
    }
    closeEditPopup();
  });

  window.closeEditPopup = function () {
    editPopup.style.display = "none";
  };
});

function showNotification(message, duration = 3000) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, duration);
}
