// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Invoice", {
  refresh(frm) {
    // filter customers based on  customer group
    frm.fields_dict["client"].get_query = function (doc) {
      return {
        filters: {
          customer_group: doc.client_type,
        },
      };
    };
  },
  onload(frm) {
    // Check if the document is newly created
    if (!frm.doc.__islocal) {
      return;
    }

    // add printing roll serial to each invoice
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Printing Roll",
        filters: {
          active: 1, // Filter to get active Printing Roll
        },
        fields: ["name"],
        limit: 1, // Get only one active Printing Roll
        order_by: "creation DESC", // Order by creation date to get the latest active Printing Roll
      },
      callback: function (response) {
        if (response && response.message && response.message.length > 0) {
          let current_active_roll = response.message[0].name;

          // Set the current_roll field in the Teller Purchase doctype to the current active Printing Roll
          frm.set_value("current_roll", current_active_roll);

          // Fetch additional details of the active Printing Roll and update receipt number and last printed number
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Printing Roll",
              name: current_active_roll,
            },
            callback: function (response) {
              if (response.message) {
                let lpn = response.message.last_printed_number;
                let start_letters = response.message.starting_letters;
                lpn = parseInt(lpn);
                lpn += 1;

                // Set receipt number
                frm.set_value("receipt_number", start_letters + "-" + lpn);

                // Update last printed number in Printing Roll document
                frappe.call({
                  method: "frappe.client.set_value",
                  args: {
                    doctype: "Printing Roll",
                    name: current_active_roll,
                    fieldname: "last_printed_number",
                    value: lpn,
                  },
                  callback: function (response) {
                    if (!response.exc) {
                      // Success
                      refresh_field("last_printed_number");
                      console.log("Last printed number updated successfully.");
                    } else {
                      // Handle error
                      console.error(
                        "Error updating last printed number:",
                        response.exc
                      );
                    }
                  },
                });
              }
            },
          });
        }
      },
    });
    // get the active open shift and the associated teller user
    frappe.call({
      method: "frappe.client.get_value",
      args: {
        doctype: "OPen Shift",
        filters: { active: 1 },
        fieldname: ["name", "current_user"],
      },
      callback: function (response) {
        console.log(response.message);
        frm.set_value("shift", response.message.name);
        frm.set_value("teller", response.message.current_user);
      },
    });
  },

  // Get customer information if exists
  client: function (frm) {
    if (frm.doc.client_type == "Individual") {
      if (frm.doc.client) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.client,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("test", r.message.customer_name);
            frm.set_value("gender", r.message.gender);
            frm.set_value("nationality", r.message.custom_nationality);
            frm.set_value("primary_contacts", r.message.primary_address);
            frm.set_value("mobile_number", r.message.mobile_no);
            frm.set_value("work_for", r.message.custom_work_for);
            frm.set_value("national_id", r.message.custom_national_id);
          },
        });
      } else {
        // clear the fields
        frm.set_value("test", "");
        frm.set_value("gender", "");
        frm.set_value("nationality", "");
        frm.set_value("primary_contacts", "");
        frm.set_value("mobile_number", "");
        frm.set_value("work_for", "");
        frm.set_value("national_id", "");
      }
    } else if (frm.doc.client_type == "Companies") {
      if (frm.doc.client) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.client,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("comp", r.message.custom_legal_form);
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
        frm.set_value("comp", "");
        frm.set_value("company_activity", "");
        frm.set_value("company_commercial_no", "");
        frm.set_value("start_registration_date", "");
        frm.set_value("end_registration_date", "");
      }
    }
  },

  // set Special sales rates
  speacial_price: function (frm) {
    // frappe.msgprint("Special price");

    // Iterate over each item and set the rate to the special rate
    frm.doc.items.forEach((item) => {
      frappe.call({
        method: "frappe.client.get_value",
        args: {
          doctype: "Item Price",
          filters: { item_code: item.item_code },
          fieldname: "custom_selling_special_rate",
        },

        callback: function (response) {
          console.log(response);
          if (response.message) {
            special_selling_rate = response.message.custom_selling_special_rate;
            // console.log(custom_selling_special_rate);

            frappe.model.set_value(
              "Teller Items",
              item.name,
              "rate",
              special_selling_rate
            );
            special_amount = special_selling_rate * item.quantity;
            if (item.quantity) {
              frappe.model.set_value(
                "Teller Items",
                item.name,
                "amount",
                special_amount
              );
            }
            // console.log(special_amount);
          }
        },
      });
    });
  },
});
// set currency items code and selling  rate
//  Transactions currency table
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

// items price table
frappe.ui.form.on("Teller Items", {
  item_code: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.item_code) {
      frappe.call({
        method: "frappe.client.get_value",
        args: {
          doctype: "Item Price",
          filters: { item_code: row.item_code },
          fieldname: "custom_selling_rate",
        },
        callback: function (response) {
          console.log(response); // Log the entire response
          if (response.message) {
            let item_rate = response.message.custom_selling_rate;
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
  items_remove: function (frm) {
    let total = 0;
    frm.doc.items.forEach(function (item) {
      total += item.amount;
    });
    frm.set_value("total", total);
  },
});
