// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Setting", {
  refresh(frm) {
    console.log(typeof frm.doc.duration);
    if (frm.doc.currency && frm.doc.amount) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_setting.teller_setting.rate_settings",
        args: {
          currency: frm.doc.currency,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            let allowedAmount = r.message * frm.doc.amount;
            frm.set_value("allowed_amount", allowedAmount);
          }
        },
      });
    }
  },
});
