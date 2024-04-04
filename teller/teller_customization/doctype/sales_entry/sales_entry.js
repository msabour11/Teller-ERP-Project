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

  usd_amount: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    // frappe.msgprint("hello")

    if (row.paid_from && row.paid_to && row.usd_amount && row.received_amount) {
      let total = row.usd_amount * row.rate;
      console.log(total);
      frappe.model.set_value(cdt, cdn, "total_amount", total);
      // Create ledger entry

      frappe.call({
        method:
          "teller.teller_customization.doctype.sales_entry.sales_entry.create_internal_transfer_entry",
        args: {
          paid_from_account: row.paid_from,
          amount: row.usd_amount,
          currency: row.currency,
          paid_to_account: row.paid_to,
          exchange_rate: row.rate,
        },
        callback: function (r) {
          console.log(r.message);
        },
      });
    } else {
      frappe.throw("you must enter this fields");
    }
  },
});
