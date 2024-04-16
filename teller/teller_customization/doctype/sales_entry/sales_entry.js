// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sales Entry", {
  refresh(frm) {},
});
frappe.ui.form.on("Entry Child", {
  paid_from: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.paid_from) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.sales_entry.sales_entry.get_currency",
        args: {
          account: row.paid_from,
        },
        callback: function (r) {
          console.log(r.message);
          console.log(r.message[0]);
          let curr = r.message[0];
          let currency_rate = r.message[1];
          frappe.model.set_value(cdt, cdn, "currency", curr);
          frappe.model.set_value(cdt, cdn, "rate", currency_rate);
        },
      });
    }
  },

  // usd_amount: function (frm, cdt, cdn) {
  //   var row = locals[cdt][cdn];
  //   // frappe.msgprint("hello")

  //   if (row.paid_from && row.paid_to && row.usd_amount && row.received_amount) {
  //     let total = row.usd_amount * row.rate;
  //     console.log(total);
  //     console.log(frm.doc.comapny);
  //     frappe.model.set_value(cdt, cdn, "total_amount", total);
  //     // Create ledger entry

  //     frappe.call({
  //       method:
  //         "teller.teller_customization.doctype.sales_entry.sales_entry.get_account_balance",
  //       args: {
  //         paid_from: row.paid_from,
  //         company: frm.doc.comapny,
  //       },
  //       callback: function (r) {
  //         if (r.message) {
  //           console.log(r.message);
  //           let account_balance = r.message;

  //           frm.set_value("balance", account_balance);
  //         } else {
  //           console.log("not found");
  //         }
  //       },
  //     });
  //   } else {
  //     frappe.throw("you must enter this fields");
  //   }
  // },
  usd_amount: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.paid_from && row.paid_to && row.usd_amount && row.received_amount) {
      let total = row.usd_amount * row.rate;

      frappe.model.set_value(cdt, cdn, "total_amount", total);

      // Update account balances

      frappe.call({
        method:
          "teller.teller_customization.doctype.sales_entry.sales_entry.get_account_balance",
        args: {
          paid_from: row.paid_from,
          company: frm.doc.comapny,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            let account_balance = r.message;

            frm.set_value("balance", account_balance);
          } else {
            console.log("not found");
          }
        },
      });
      frappe.call({
        method:
          "teller.teller_customization.doctype.sales_entry.sales_entry.paid_to_account_balance",
        args: {
          paid_to: row.paid_to,
          company: frm.doc.comapny,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            let balance_to = r.message;

            frm.set_value("balance_to", balance_to);
          } else {
            console.log("not found");
          }
        },

      })
    } else {
      frappe.throw("You must enter all required fields.");
    }
  },
  // on_submit: function (frm, cdt, cdn) {
  //   let row = locals[cdt][cdn];
  //   if (row.paid_from && row.paid_to && row.usd_amount && row.received_amount) {
  //     frappe.call({
  //       method:
  //         "teller.teller_customization.doctype.sales_entry.sales_entry.create_gl_entry",
  //       args: {
  //         account_from: row.paid_from,
  //         account_to: row.paid_to,
  //         usd_amount: row.usd_amount,
  //         credit_amount: row.total_amount,
  //         currency: row.currency,
  //         currency_rate: row.rate,
  //         voucher_no: frm.doc.name,
  //       },
  //       callback: function (r) {
  //         if (r.message) {
  //           // Update the UI or show a message if needed
  //           console.log("create gl ");
  //           console.log(r.message);
  //           console.log("Account balances updated successfully.");
  //         } else {
  //           console.log("Failed to update account balances.");
  //         }
  //       },
  //     });
  //   }
  // },
});
