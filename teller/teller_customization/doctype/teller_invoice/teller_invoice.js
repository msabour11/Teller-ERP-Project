// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Invoice", {
  // items: function (frm) {
  //   if (frm.doc.items.length > 3) {
  //     frappe.throw("You cannot add more than three items.");
  //     //   validated = false;
  //   }
  // },

  //   "items_add": function(frm, cdt, cdn) {
  //   if (frm.doc.items.length > 3) {
  //     frappe.throw("You cannot add more than three items.");
  //     // Remove the last row
  //     frm.doc.items.splice(-1,1);
  //     frm.refresh_field("items");
  //   }
  // },
  // onload(frm) {
  //   frappe.call({
  //     method: "frappe.client.get",
  //     args: {
  //       doctype: "Printing Roll",
  //       // fieldname: "last_printed_number",
  //       name: frm.doc.current_roll,

  //       // filters: {
  //       //   name: frm.doc.current_roll,
  //       // },
  //     },
  //     callback: function (response) {
  //       if (response.message) {
  //         // lpn = response.message.last_printed_number;
  //         // lpn = parseInt(lpn);
  //         // frm.set_value("last_printed_number", lpn);
  //         // lpn += 1;
  //         // frm.set_value("last_printed_number", lpn);
  //         // console.log(lpn);
  //         console.log(response.message);
  //       }
  //     },
  //   });
  // },

  refresh(frm) {
    // filter customers by customer group
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
});
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
});
