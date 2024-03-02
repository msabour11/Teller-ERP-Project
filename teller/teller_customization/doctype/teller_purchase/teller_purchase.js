// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Purchase", {
  refresh(frm) {
    frm.set_query("buyer", function (doc) {
      return {
        filters: {
          customer_group: doc.category_of_buyer,
        },
      };
    });
  },

  buyer: function (frm) {
    if (frm.doc.category_of_buyer == "Individual") {
      if (frm.doc.buyer) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.buyer,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("customer_name", r.message.customer_name);
            frm.set_value("gender", r.message.gender);
            frm.set_value("nationality", r.message.custom_nationality);
            frm.set_value("primary_contacts", r.message.primary_address);
            frm.set_value("mobile_number", r.message.mobile_no);
            frm.set_value("work_for", r.message.custom_work_for);
          },
        });
      } else {
        // clear the fields
        frm.set_value("customer_name", "");
        frm.set_value("gender", "");
        frm.set_value("nationality", "");
        frm.set_value("primary_contacts", "");
        frm.set_value("mobile_number", "");
        frm.set_value("work_for", "");
      }
    } else if (frm.doc.category_of_buyer == "Companies") {
      if (frm.doc.buyer) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.buyer,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("company_legal_form", r.message.custom_legal_form);
            frm.set_value(
              "company_activity",
              r.message.custom_company_activity
            );
            frm.set_value(
              "company_commercial_no",
              r.message.custom_commercial_no
            );

            frm.set_value(
              "start_registration_date",
              r.message.custom_start_registration_date
            );

            frm.set_value(
              "end_registration_date",
              r.message.custom_end_registration_date
            );
          },
        });
      } else {
        // clear the fields
        frm.set_value("company_legal_form", "");
        frm.set_value("company_activity", "");
        frm.set_value("company_commercial_no", "");
        frm.set_value("start_registration_date", "");
        frm.set_value("end_registration_date", "");
      }
    }
  },
});

// frappe.ui.form.on("Teller Items", {
//   item_code: function (frm, cdt, cdn) {
//     var row = locals[cdt][cdn];

//     if (row.item_code) {
//       frappe.call({
//         method: "frappe.client.get_value",
//         args: {
//           doctype: "Item Price",
//           filters: { item_code: row.item_code },
//           fieldname: "price_list_rate",
//         },
//         callback: function (response) {
//           console.log(response);
//           if (response.message) {
//             let item_rate = response.message.price_list_rate;
//             console.log(item_rate);

//             // row.rate = item_rate;
//             // refresh_field(cdt, cdn, "rate");

//             frappe.model.set_value(cdt, cdn, "rate", item_rate);
//             frappe.model.set_value(
//               cdt,
//               cdn,
//               "amount",
//               item_rate * row.quantity
//             );
//             console.log(row.amount);
//           }
//         },
//       });
//     }
//   },
// });

frappe.ui.form.on("Teller Items", {
  item_code: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.item_code) {
      frappe.call({
        method: "frappe.client.get_value",
        args: {
          doctype: "Item Price",
          filters: { item_code: row.item_code },
          fieldname: "price_list_rate",
        },
        callback: function (response) {
          console.log(response); // Log the entire response
          if (response.message) {
            let item_rate = response.message.price_list_rate;
            console.log(item_rate);
            frappe.model.set_value(cdt, cdn, "rate", item_rate);
            if (row.quantity) {
              frappe.model.set_value(
                cdt,
                cdn,
                "amount",
                item_rate * row.quantity
              );
              console.log(row.amount);
            }
          }
        },
      });
    }
  },

  quantity: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.rate && row.quantity) {
      frappe.model.set_value(cdt, cdn, "amount", row.rate * row.quantity);
    }
  },
  amount: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.amount) {
      let total = 0;
      frm.doc.items.forEach(function (item) {
        total += item.amount;
      });
      frm.set_value("total", total);
    }
  },
});
