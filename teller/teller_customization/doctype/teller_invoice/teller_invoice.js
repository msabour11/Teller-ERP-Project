// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Invoice", {
  // setup basic inforamation

  setup: function (frm) {
    // filters accounts with cash ,is group False and account currency not EGY

    frm.fields_dict["transactions"].grid.get_field("paid_from").get_query =
      function (doc, cdt, cdn) {
        var row = locals[cdt][cdn];
        var account_types = ["Cash"];
        return {
          filters: {
            account_type: ["in", account_types],
            account_currency: ["!=", "EGP"],
            is_group: 0,
          },
        };
      };
  },

  refresh(frm) {
    frm.set_query("client", function (doc) {
      return {
        filters: {
          customer_group: doc.client_type,
        },
      };
    });
    // add ledger button in refresh To Teller Invoice
    frm.events.show_general_ledger(frm);
    set_branch_and_shift(frm);
  },

  show_general_ledger: function (frm) {
    if (frm.doc.docstatus > 0) {
      frm.add_custom_button(
        __("Ledger"),
        function () {
          frappe.route_options = {
            voucher_no: frm.doc.name,
            from_date: frm.doc.date,
            to_date: moment(frm.doc.modified).format("YYYY-MM-DD"),
            company: frm.doc.company,
            group_by: "",
            show_cancelled_entries: frm.doc.docstatus === 2,
          };
          frappe.set_route("query-report", "General Ledger");
        },
        "fa fa-table"
      );
    }
    //
  },

  onload(frm) {},

  // Get customer information if exists
  client: function (frm) {
    // get the information for Egyptian
    if (
      frm.doc.client_type == "Egyptian" ||
      frm.doc.client_type == "Foreigner"
    ) {
      if (frm.doc.client) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.client,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("customer_name", r.message.customer_name);
            frm.set_value("gender", r.message.gender);
            frm.set_value("card_type", r.message.custom_card_type);
            frm.set_value("card_info", r.message.custom_military_number);
            frm.set_value("mobile_number", r.message.custom_mobile);
            frm.set_value("work_for", r.message.custom_work_for);
            frm.set_value("phone", r.message.custom_national_id);
            frm.set_value("address", r.message.custom_address);
            frm.set_value("nationality", r.message.custom_nationality);
            frm.set_value("issue_date", r.message.custom_issue_date);
            frm.set_value("address", r.message.custom_address);
            frm.set_value("expired", r.message.custom_expired);
            frm.set_value("place_of_birth", r.message.custom_place_of_birth);
            frm.set_value("date_of_birth", r.message.custom_date_of_birth);
            frm.set_value("job_title", r.message.custom_job_title);
          },
        });
      } else {
        // clear the fields
        frm.set_value("customer_name", "");
        frm.set_value("gender", "");
        frm.set_value("card_type", "");
        frm.set_value("card_info", "");
        frm.set_value("mobile_number", "");
        frm.set_value("work_for", "");
        frm.set_value("phone", "");
        frm.set_value("address", "");
        frm.set_value("nationality", "");
        frm.set_value("issue_date", "");
        frm.set_value("expired", "");
        frm.set_value("place_of_birth", "");
        frm.set_value("date_of_birth", "");
        frm.set_value("job_title", "");
      }
    }
    // get the information for company
    else if (
      frm.doc.client_type == "Company" ||
      frm.doc.client_type == "Interbank"
    ) {
      if (frm.doc.client) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.client,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("company_name", r.message.customer_name);
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
            frm.set_value("company_number", r.message.custom_company_no);
            frm.set_value("comoany_address", r.message.custom_comany_address1);
            frm.set_value("is_expired1", r.message.custom_is_expired);
            frm.set_value("interbank", r.message.custom_interbank);
            frm.set_value("company_legal_form", r.message.custom_legal_form);
          },
        });
      } else {
        // clear the fields
        frm.set_value("company_name", "");
        frm.set_value("company_activity", "");
        frm.set_value("company_commercial_no", "");
        frm.set_value("company_number", "");
        frm.set_value("end_registration_date", "");
        frm.set_value("start_registration_date", "");
        frm.set_value("comoany_address", "");
        frm.set_value("is_expired1", "");
        frm.set_value("interbank", "");
        frm.set_value("company_legal_form", "");
      }
    }
    // get the data for Foreigners
    // else if (
    //   frm.doc.client_type == "Foreigner" ||
    //   frm.doc.client_type == "اجانب"
    // ) {
    //   if (frm.doc.client) {
    //     frappe.call({
    //       method: "frappe.client.get",
    //       args: {
    //         doctype: "Customer",
    //         name: frm.doc.client,
    //       },
    //       callback: function (r) {
    //         // set the fields with r.message.fieldname
    //         frm.set_value("customer_name_copy", r.message.customer_name);
    //         frm.set_value("gender_copy", r.message.gender);
    //         frm.set_value("nationality_copy", r.message.custom_nationality);
    //         frm.set_value("primary_contacts_copy", r.message.primary_address);
    //         frm.set_value("mobile_number_copy", r.message.mobile_no);
    //         frm.set_value("work_for__copy", r.message.custom_work_for);
    //         frm.set_value("national_id_copy", r.message.custom_national_id);
    //       },
    //     });
    //   } else {
    //     // clear the fields
    //     frm.set_value("customer_name_copy", "");
    //     frm.set_value("gender_copy", "");
    //     frm.set_value("nationality_copy", "");
    //     frm.set_value("primary_contacts_copy", "");
    //     frm.set_value("mobile_number_copy", "");
    //     frm.set_value("work_for__copy", "");
    //     frm.set_value("national_id_copy", "");
    //   }
    // }

    //get data for interbank group
    // else if (
    //   frm.doc.client_type == "Interbank" ||
    //   frm.doc.client_type == "انتربنك"
    // ) {
    //   if (frm.doc.client) {
    //     frappe.call({
    //       method: "frappe.client.get",
    //       args: {
    //         doctype: "Customer",
    //         name: frm.doc.client,
    //       },
    //       callback: function (r) {
    //         // set the fields with r.message.fieldname
    //         //            frm.set_value("customer_name_copy", r.message.customer_name);
    //         //            frm.set_value("gender_copy", r.message.gender);
    //         //            frm.set_value("nationality_copy", r.message.custom_nationality);
    //         //            frm.set_value("primary_contacts_copy", r.message.primary_address);
    //         //            frm.set_value("mobile_number_copy", r.message.mobile_no);
    //         //            frm.set_value("work_for__copy", r.message.custom_work_for);
    //         //            frm.set_value("national_id_copy", r.message.custom_national_id);
    //       },
    //     });
    //   } else {
    //     // clear the fields
    //     //        frm.set_value("test", "");
    //     //        frm.set_value("gender", "");
    //     //        frm.set_value("nationality", "");
    //     //        frm.set_value("primary_contacts", "");
    //     //        frm.set_value("mobile_number", "");
    //     //        frm.set_value("work_for", "");
    //     //        frm.set_value("national_id", "");
    //   }
    // }
  },

  // set special price
  special_price: function (frm) {
    if (frm.doc.docstatus == 0) {
      let total_currency_amount = 0;

      frm.doc.transactions.forEach((row) => {
        if (row.paid_from) {
          frappe.call({
            method:
              "teller.teller_customization.doctype.teller_invoice.teller_invoice.get_currency",
            args: {
              account: row.paid_from,
            },
            callback: function (r) {
              console.log(r.message[2]);
              selling_special_rate = r.message[2];
              row.rate = selling_special_rate;
              console.log(r.message[2]);
              let currency_total = row.rate * row.usd_amount;
              row.total_amount = currency_total;

              console.log(
                `the total of ${row.currency} is ${row.total_amount}`
              );

              total_currency_amount += currency_total;
              console.log("from loop: " + total_currency_amount);
              frm.refresh_field("transactions");
              frm.set_value("total", total_currency_amount);
            },
          });
        }
      });
      console.log("from outer loop: " + total_currency_amount);
    }
  },

  egy: (frm) => {
    if (frm.doc.egy) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_invoice.teller_invoice.account_to_balance",
        args: {
          paid_to: frm.doc.egy,
          // company: frm.doc.company,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            let egy_balance = r.message;

            frm.set_value("egy_balance", egy_balance);
          } else {
            console.log("not found");
          }
        },
      });
    }
  },
});

//  Transactions currency table
frappe.ui.form.on("Entry Child", {
  // filter accounts

  paid_from: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.paid_from) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_invoice.teller_invoice.get_currency",
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

    if (row.paid_from && row.usd_amount) {
      let total = row.usd_amount * row.rate;

      frappe.model.set_value(cdt, cdn, "total_amount", total);

      // Update account balances

      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_invoice.teller_invoice.account_from_balance",
        args: {
          paid_from: row.paid_from,
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            let from_balance = r.message;

            frappe.model.set_value(cdt, cdn, "balance", from_balance);
          } else {
            console.log("not found");
          }
        },
      });
    } else {
      frappe.throw("You must enter all required fields.");
    }
  },

  total_amount: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let total = 0;
    if (row.total_amount) {
      frm.doc.transactions.forEach((item) => {
        total += item.total_amount;
      });
      frm.set_value("total", total);
    }
  },
  transactions_remove: function (frm) {
    let total = 0;
    frm.doc.transactions.forEach((item) => {
      total += item.total_amount;
    });
    frm.set_value("total", total);
  },
});
function set_branch_and_shift(frm) {
  frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Branch",
      filters: {
        custom_active: 1,
      },
    },
    callback: function (r) {
      if (!r.exc) {
        let branch = r.message.name;
        frm.set_value("branch_no", branch);
      }
    },
  });
  // Set the the active open shift and current user
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "OPen Shift",
      filters: { active: 1 },
      fieldname: ["name", "current_user"],
    },
    callback: function (r) {
      if (!r.exc) {
        let shift = r.message.name;
        let current_user = r.message.current_user;

        frm.set_value("shift", shift);
        frm.set_value("teller", current_user);
      }
    },
  });
  // set the current active Printing roll
  // frappe.call({
  //   method: "frappe.client.get_list",
  //   args: {
  //     doctype: "Printing Roll",
  //     filters: {
  //       active: 1, // Filter to get active Printing Roll
  //     },
  //     limit: 1, // Get only one active Printing Roll
  //     order_by: "creation DESC", // Order by creation date to get the latest active Printing Roll
  //   },
  //   callback: (r) => {
  //     if (!r.exc && r.message && r.message.length > 0) {
  //       active_roll = r.message[0].name;
  //       frm.set_value("current_roll", active_roll);
  //     }
  //   },
  // });
}
