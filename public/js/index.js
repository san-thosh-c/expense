document.addEventListener("DOMContentLoaded", async () => {
  const popup = document.getElementById("popupForm");
  const popupTrip = document.getElementById("trippopupForm");
  const openBtn = document.getElementById("openFormBtn");
  const openTripBtn = document.getElementById("addtrip");
  const select = document.querySelector("select[name='tripname1']");
  const tableBody = document.querySelector("#tripRecordsTable tbody");
  const expTableBody = document.querySelector("#Total_expenses tbody");
  const finalTable = document.querySelector("#Final tbody");
  const exptable = document.querySelector("#expensesTable tbody");
  const mainBody = document.getElementById("main-data-content");
  const expense_popup = document.getElementById("addexpense");
  const settlement_popup = document.getElementById("settlement");
  const popupexpense = document.getElementById("expenseform");
  const popupsettlment = document.getElementById("settlementform");
  const selectguest = document.querySelector("select[name='guestname']");
  const editPopup = document.getElementById("editAmountPopup");
  const editAmountInput = document.getElementById("editAmountInput");
  const saveAmountBtn = document.getElementById("saveAmountBtn");
  const saveGuestDetails = document.getElementById("saveGuestDetails");
  const summary = document.getElementById("summary");
  const generatesummary = document.getElementById("generatesummary");

  try {
    const response = await fetch("/api/trips");
    const trips = await response.json();
    select.innerHTML = "";
    console.log("Tripid = ", trips);
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

  settlement_popup.onclick = async() => {
    popupsettlment.style.display = "flex";
    popupsettlment.style.zIndex = "1";
  };

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

  window.closeSettlementForm = function(){
    popupsettlment.style.display="none";
  }

  generatesummary.onclick = async () => {
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
          <td>₹ ${record.amount}</td>
        `;
          expTableBody.appendChild(row);
        });

        let step1 = await final_summary1(tripId, summary);
        let step2 = await final_summary2(tripId);
        let step3 = await final_summary3(step1,step2);
        let step4 = await final_summary4(step3);
        console.log("step4 = ", step4);
        finalTable.innerHTML = "";
        step4.forEach((record) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td>${record.name}</td>
          <td>₹ ${record.amount}</td>
          <td>${record.totalhc}</td>
          <td>₹ ${record.totalexpense}</td>
          <td>₹ ${record.transport}</td>
          <td>₹ ${record.totalCost}</td>
          <td>₹ ${record.tobepaid}</td>
          <td>₹ ${record.toReceive}</td>
        `;
          finalTable.appendChild(row);
        });
      }
    } catch (err) {
      showNotification("Failed to load Details");
    }
  };
  async function final_summary1(trip_id, summary) {
  try {
    const response_user = await fetch(`/api/trip/${trip_id}`);
    const records_user = await response_user.json();
    let final = [];
    for (let user of records_user) {
      let summary_obj = summary.filter((obj) => Number(obj.flatNumber) === Number(user.flatNumber));
      if (summary_obj.length > 0){
        let data = {};
        data.name = summary_obj[0].guestname;
        data.amount = summary_obj[0].amount;
        data.adults = user.adults;
        data.kids = user.kids;
        data.totalhc = Number(user.adults) + Number(user.kids);
        final.push(data);
      }
      else {
        let data = {};
        data.name = user.guestname;
        data.amount = 0;
        data.adults = user.adults;
        data.kids = user.kids;
        data.totalhc = Number(user.adults) + Number(user.kids);
        final.push(data);
      }
    }

    return final;
  } catch (err) {
    console.log("Error Occured");
  }
}

  async function final_summary2(tripId) {

    try {
      const req_exp = await fetch(`/api/trips/${tripId}`);
      const res_exp = await req_exp.json();
      const result = Object.values(
        res_exp.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = { category: item.category, amount: 0 };
          }
          acc[item.category].amount += item.amount;
          return acc;
        }, {})
      );
      return result;
    } catch(err){
      console.log("Error occured at step 2");
    }



  }

  async function final_summary3(step1, step2) {
    console.log("step1 = ", step1);
    console.log("step2 = ", step2);
    let final = [];
    const totalAmount = step2
      .filter(item => item.category !== "Transport")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalTransport = step2
      .filter(obj => obj.category === "Transport")
      .reduce((sum,item) => sum + item.amount, 0);
    const totalAdults = step1.reduce((sum, person) => sum + person.adults, 0);
    const totalKids = step1.reduce((sum, person) => sum + person.kids, 0);
    const perhead = totalAmount / totalAdults;
    const perhead_transport = totalTransport / (totalAdults + totalKids);

    console.log("totalAmount = ", totalAmount);
    console.log("totalTransport = ", totalTransport);
    console.log("totalAdults = ", totalAdults);
    console.log("totalKids = ", totalKids);
    console.log("perhead = ", Math.floor(perhead).toFixed(2));
    console.log("perhead_transport = ", Math.floor(perhead_transport).toFixed(2));
    for (let t1 of step1){
      let data = {};
      data.name = t1.name;
      data.amount = t1.amount;
      data.adults = t1.adults;
      data.kids = t1.kids;
      data.totalhc = t1.totalhc;
      data.totalexpense = Math.floor(perhead).toFixed(2) * t1.adults;
      data.transport = Math.floor(perhead_transport).toFixed(2) * (t1.adults + t1.kids);
      final.push(data);
    }
    return final;
  }

  async function final_summary4(step3){
    for (let t1 of step3){
      t1.totalCost = (t1.totalexpense + t1.transport);
      let balance = (t1.totalexpense + t1.transport) - t1.amount;
      console.log("balance = ", balance);
      if (balance < 0){
        t1.toReceive = balance;
        t1.tobepaid = 0;
      }
      if (balance > 0){
        t1.tobepaid = balance;
        t1.toReceive = 0;
      }
    }
    return step3;
  }


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

  window.submitsettlementForm = async function () {
    const settlementname = document.getElementById("settlement_category").value;
    const s_amount = document.getElementById("settlementamount").value;
    console.log("settlementname = ", select.value);
    try{
        const response = await fetch("/addsettlement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: select.value,
          category: settlementname,
          amount: s_amount,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showNotification("Settlement added successfully!");
        const response_exp = await fetch(`/api/trips/${select.value}`);
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
            <td>${record.category}</td>
            <td>${record.amount}</td>
          `;
          exptable.appendChild(row);
        });
      } else {
        showNotification(result.message);
      }

    } catch(err){
      console.error("Error:", err);
    
    }
    console.log("Hi");
    closeSettlementForm();
    
  }

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
//fetch guest details      
      records.forEach((record) => {
        mainBody.style.display = "flex";
        const row = document.createElement("tr");
        row.setAttribute("data-id", record._id);
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
//fetch Expense details      
      records_exp.forEach((record) => {
        mainBody.style.display = "flex";
        const row = document.createElement("tr");
        row.setAttribute("data-id", record._id);
        row.innerHTML = `
        <td>${record.guestname}</td>
        <td>${record.category}</td>
        <td>₹ ${record.amount}</td>
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
          <td>₹ ${record.amount}</td>
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
    console.log(selectedExpenseRow);
    selectedRecordId = row.dataset.id;
    console.log(row.cells);
    const currentAmount = row.cells[2].textContent;
    editAmountInput.value = currentAmount;
    editPopup.style.display = "flex";
  });

  saveAmountBtn.addEventListener("click", async () => {
    const newAmount = editAmountInput.value;
    if (selectedExpenseRow) {
      selectedExpenseRow.cells[2].textContent = newAmount;
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

  document.getElementById("tripRecordsTable").addEventListener("click", function (e) {
    const row = e.target.closest("tr");
    console.log("row = ", row);
    if (!row || row.rowIndex === 0) return;
    const adults = row.cells[2].textContent;
    const kids = row.cells[3].textContent;
    const f_no = row.cells[1].textContent;
     selectedRecordId = row.dataset.id
     console.log("selectedRecordId = ", selectedRecordId);
     window.selectedRow = row;
     fno.value = f_no;
    document.getElementById("fno").value = f_no;
    document.getElementById("editAdults").value = adults;
    document.getElementById("editKids").value = kids;
    document.getElementById("editGuestPopup").style.display = "flex";
  });

  saveGuestDetails.addEventListener("click", async () => {
      const newflat = document.getElementById("fno").value;
      const newAdults = document.getElementById("editAdults").value;
      const newKids = document.getElementById("editKids").value;
      // const newguestName = document.getElementById("editguestname").value;
      
      if (window.selectedRow) {
        // window.selectedRow.cells[0].textContent = newguestName;
        window.selectedRow.cells[1].textContent = newflat;
        window.selectedRow.cells[2].textContent = newAdults;
        window.selectedRow.cells[3].textContent = newKids;
      }
      
      try {
            const response = await fetch(`/update-guest/${selectedRecordId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ flatNumber: newflat, adults:newAdults, kids: newKids  }),
            });

            const result = await response.json();
            if (result.success) {
              showNotification("Guest updated successfully!");
            } else {
              showNotification("Failed to update Guest");
            }
          } catch (err) {
            console.error("Update error:", err);
            showNotification("Error updating Guest");
          }
      closeGuestPopup();

  });

 window.closeGuestPopup = function() {
  document.getElementById("editGuestPopup").style.display = "none";
}

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

