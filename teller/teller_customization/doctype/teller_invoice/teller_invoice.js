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
    //test new client

    //////////////////
    // get last submitted Teller  invoice
    frappe
      .call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Teller Invoice",
          fields: ["name", "receipt_number"],
          limit: 1,
          order_by: "creation desc",
          filters: {
            docstatus: 1,
          },
        },
      })
      .then((r) => {
        if (r.message) {
          let last_invoice = r.message[0].name;
          console.log(last_invoice);
        }
      });

    // filter clients based on client type
    frm.set_query("client", function (doc) {
      return {
        filters: {
          custom_type: doc.client_type,
        },
      };
    });
    // add ledger button in refresh To Teller Invoice
    frm.events.show_general_ledger(frm);
    set_branch_and_shift(frm);
    loginUser = frappe.session.logged_in_user;
    frappe
      .call({
        method: "frappe.client.get",
        args: {
          doctype: "User",
          name: loginUser,
        },
      })
      .then((r) => {
        if (r.message) {
          console.log(r.message.egy_account);
          let user_account = r.message.egy_account;
          if (user_account) {
            frm.set_value("egy", user_account);
          } else {
            frappe.throw("there is no egy account linked to this user");
          }
        } else {
          frappe.throw("Error while getting user");
        }
      });
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
  /////test2
  // client: function (frm) {
  //   if (
  //     frm.doc.client_type === "Egyptian" ||
  //     frm.doc.client_type === "Foreigner"
  //   ) {
  //     if (frm.doc.client) {
  //       frappe.call({
  //         method: "frappe.client.get",
  //         args: {
  //           doctype: "Customer",
  //           name: frm.doc.client,
  //         },
  //         callback: function (r) {
  //           if (r.message) {
  //             frm.set_value("customer_name", r.message.customer_name);
  //             frm.set_value("gender", r.message.gender);
  //             frm.set_value("card_type", r.message.custom_card_type);
  //             frm.set_value("mobile_number", r.message.custom_mobile);
  //             frm.set_value("work_for", r.message.custom_work_for);
  //             frm.set_value("address", r.message.custom_address);
  //             frm.set_value("nationality", r.message.custom_nationality);
  //             frm.set_value("issue_date", r.message.custom_issue_date);
  //             frm.set_value("expired", r.message.custom_expired);
  //             frm.set_value("place_of_birth", r.message.custom_place_of_birth);
  //             frm.set_value("date_of_birth", r.message.custom_date_of_birth);
  //             frm.set_value("job_title", r.message.custom_job_title);
  //             if (frm.doc.card_type === "National ID") {
  //               frm.set_value("national_id", r.message.custom_national_id);
  //             } else if (frm.doc.card_type === "Passport") {
  //               frm.set_value(
  //                 "passport_number",
  //                 r.message.custom_passport_number
  //               );
  //             } else {
  //               frm.set_value(
  //                 "military_number",
  //                 r.message.custom_military_number
  //               );
  //             }
  //           }
  //         },
  //       });
  //     } else {
  //       frm.clear_custom_fields([
  //         "customer_name",
  //         "gender",
  //         "card_type",
  //         "mobile_number",
  //         "work_for",
  //         "phone",
  //         "address",
  //         "nationality",
  //         "issue_date",
  //         "expired",
  //         "place_of_birth",
  //         "date_of_birth",
  //         "job_title",
  //       ]);
  //     }
  //   } else if (
  //     frm.doc.client_type === "Company" ||
  //     frm.doc.client_type === "Interbank"
  //   ) {
  //     if (frm.doc.client) {
  //       frappe.call({
  //         method: "frappe.client.get",
  //         args: {
  //           doctype: "Customer",
  //           name: frm.doc.client,
  //         },
  //         callback: function (r) {
  //           if (r.message) {
  //             frm.set_value("company_name", r.message.customer_name);
  //             frm.set_value(
  //               "company_activity",
  //               r.message.custom_company_activity
  //             );
  //             frm.set_value(
  //               "company_commercial_no",
  //               r.message.custom_commercial_no
  //             );
  //             frm.set_value(
  //               "start_registration_date",
  //               r.message.custom_start_registration_date
  //             );
  //             frm.set_value(
  //               "end_registration_date",
  //               r.message.custom_end_registration_date
  //             );
  //             frm.set_value("company_number", r.message.custom_company_no);
  //             frm.set_value(
  //               "company_address",
  //               r.message.custom_comany_address1
  //             );
  //             frm.set_value("is_expired1", r.message.custom_is_expired);
  //             frm.set_value("interbank", r.message.custom_interbank);
  //             frm.set_value("company_legal_form", r.message.custom_legal_form);
  //           }
  //         },
  //       });
  //     } else {
  //       frm.clear_custom_fields([
  //         "company_name",
  //         "company_activity",
  //         "company_commercial_no",
  //         "company_number",
  //         "end_registration_date",
  //         "start_registration_date",
  //         "company_address",
  //         "is_expired1",
  //         "interbank",
  //         "company_legal_form",
  //       ]);
  //     }
  //   }
  // },

  // Add or update customer on submit
  // before_submit: function (frm) {
  //   function update_customer(doc) {
  //     frappe.call({
  //       method: "frappe.client.save",
  //       args: {
  //         doc: doc,
  //       },
  //       callback: function (r) {
  //         if (r.message) {
  //           frm.set_value("client", r.message.name);
  //         } else {
  //           frappe.throw("Error while updating customer");
  //         }
  //       },
  //       error: function (err) {
  //         if (
  //           err &&
  //           err.exception &&
  //           err.exception.includes("TimestampMismatchError")
  //         ) {
  //           frappe.msgprint(
  //             "Document has been modified after you have opened it. Please refresh and try again."
  //           );
  //         } else {
  //           frappe.throw("Error while updating customer");
  //         }
  //       },
  //     });
  //   }

  //   function create_customer(doc) {
  //     frappe.call({
  //       method: "frappe.client.insert",
  //       args: {
  //         doc: doc,
  //       },
  //       callback: function (r) {
  //         if (r.message) {
  //           frm.set_value("client", r.message.name);
  //         } else {
  //           frappe.throw("Error while creating customer");
  //         }
  //       },
  //     });
  //   }

  //   if (
  //     frm.doc.client_type === "Egyptian" ||
  //     frm.doc.client_type === "Foreigner"
  //   ) {
  //     let customer_doc = {
  //       doctype: "Customer",
  //       customer_name: frm.doc.customer_name,
  //       gender: frm.doc.gender || "Male",
  //       custom_card_type: frm.doc.card_type,
  //       custom_mobile: frm.doc.mobile_number || "",
  //       custom_address: frm.doc.address,
  //       custom_date_of_birth:
  //         frm.doc.date_of_birth || frappe.datetime.get_today(),
  //       custom_type: frm.doc.client_type,
  //       custom_national_id:
  //         frm.doc.card_type === "National ID" ? frm.doc.national_id : null,
  //       custom_passport_number:
  //         frm.doc.card_type === "Passport" ? frm.doc.passport_number : null,
  //       custom_military_number:
  //         frm.doc.card_type === "Military ID" ? frm.doc.military_number : null,
  //     };

  //     if (frm.doc.client) {
  //       customer_doc.name = frm.doc.client;
  //       update_customer(customer_doc);
  //     } else {
  //       create_customer(customer_doc);
  //     }
  //   } else if (
  //     frm.doc.client_type === "Company" ||
  //     frm.doc.client_type === "Interbank"
  //   ) {
  //     let customer_doc = {
  //       doctype: "Customer",
  //       customer_name: frm.doc.company_name,
  //       custom_start_registration_date:
  //         frm.doc.start_registration_date || frappe.datetime.get_today(),
  //       custom_end_registration_date:
  //         frm.doc.end_registration_date || frappe.datetime.get_today(),
  //       custom_comany_address1: frm.doc.company_address || "",
  //       custom_type: frm.doc.client_type,
  //       custom_interbank:
  //         frm.doc.interbank && frm.doc.client_type === "Interbank"
  //           ? true
  //           : false,
  //     };

  //     if (frm.doc.client) {
  //       customer_doc.name = frm.doc.client;
  //       update_customer(customer_doc);
  //     } else {
  //       create_customer(customer_doc);
  //     }
  //   }
  // },

  //////////

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
            // frm.set_value("card_info", r.message.custom_military_number);
            frm.set_value("mobile_number", r.message.custom_mobile);
            frm.set_value("work_for", r.message.custom_work_for);
            frm.set_value("address", r.message.custom_address);
            frm.set_value("nationality", r.message.custom_nationality);
            frm.set_value("issue_date", r.message.custom_issue_date);
            frm.set_value("address", r.message.custom_address);
            frm.set_value("expired", r.message.custom_expired);
            frm.set_value("place_of_birth", r.message.custom_place_of_birth);
            frm.set_value("date_of_birth", r.message.custom_date_of_birth);
            frm.set_value("job_title", r.message.custom_job_title);
            if (frm.doc.card_type == "National ID") {
              frm.set_value("national_id", r.message.custom_national_id);
            } else if (frm.doc.card_type == "Passport") {
              frm.set_value(
                "passport_number",
                r.message.custom_passport_number
              );
            } else {
              frm.set_value(
                "military_number",
                r.message.custom_military_number
              );
            }
          },
        });
      } else {
        // clear the fields
        frm.set_value("customer_name", "");
        frm.set_value("gender", "");
        frm.set_value("card_type", "");
        // frm.set_value("card_info", "");
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
  },

  // add customer if not already existing///////////////////
  before_submit: function (frm) {
    if (
      (frm.doc.client_type == "Egyptian" ||
        frm.doc.client_type == "Foreigner") &&
      !frm.doc.client
    ) {
      frappe.call({
        method: "frappe.client.insert",
        args: {
          doc: {
            doctype: "Customer",
            customer_name: frm.doc.customer_name,
            gender: frm.doc.gender ? frm.doc.gender : "Male",
            custom_card_type: frm.doc.card_type,
            custom_mobile: frm.doc.mobile_number ? frm.doc.mobile_number : "",
            // custom_work_for: frm.doc.work_for,
            custom_address: frm.doc.address,
            // custom_nationality: frm.doc.nationality,
            // custom_issue_date: frm.doc.issue_date,
            // custom_expired: frm.doc.expired,
            // custom_place_of_birth: frm.doc.place_of_birth,
            custom_date_of_birth: frm.doc.date_of_birth
              ? frm.doc.date_of_birth
              : frappe.datetime.get_today(),
            // custom_job_title: frm.doc.job_title,
            custom_type: frm.doc.client_type,
            custom_national_id:
              frm.doc.card_type == "National ID" ? frm.doc.national_id : null,
            custom_passport_number:
              frm.doc.card_type == "Passport" ? frm.doc.passport_number : null,
            custom_military_number:
              frm.doc.card_type == "Military ID"
                ? frm.doc.military_number
                : null,
          },
        },
        callback: function (r) {
          if (r.message) {
            frm.set_value("client", r.message.name);
          } else {
            frappe.throw("Error while creating customer");
          }
        },
      });
    } else {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Customer",
          filters: {
            customer_name: frm.doc.client,
          },
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);
            // Update the existing client record
            // var existing_client = frappe.get_doc("Customer", r.message.name);

            // // Update the relevant fields
            // // existing_client.gender = frm.doc.gender || "Male";
            // existing_client.custom_card_type = frm.doc.card_type;
            // existing_client.custom_mobile = frm.doc.mobile_number || "";
            // existing_client.custom_address = frm.doc.address;
            // existing_client.custom_date_of_birth =
            //   frm.doc.date_of_birth || frappe.datetime.get_today();
            // existing_client.custom_national_id =
            //   frm.doc.card_type == "National ID" ? frm.doc.national_id : null;
            // existing_client.custom_passport_number =
            //   frm.doc.card_type == "Passport" ? frm.doc.passport_number : null;
            // existing_client.custom_military_number =
            //   frm.doc.card_type == "Military ID"
            //     ? frm.doc.military_number
            //     : null;

            // // Save the updated client document
            // existing_client
            //   .save()
            //   .then(function () {
            //     frm.set_value("client", existing_client.name);
            //   })
            //   .catch(function (err) {
            //     frappe.throw("Error while updating customer: " + err);
            //   });

            /////////////////////////////////
            var existing_client = r.message;
            var existing_client = r.message;

            // Fetch the latest version of the document
            frappe.call({
              method: "frappe.client.get",
              args: {
                doctype: "Customer",
                name: existing_client.name,
              },
              callback: function (response) {
                if (response.message) {
                  var latest_client = response.message;
                  // Update the relevant fields
                  latest_client.custom_card_type = frm.doc.card_type;
                  latest_client.custom_mobile = frm.doc.mobile_number || "";
                  latest_client.custom_address = frm.doc.address;
                  latest_client.custom_date_of_birth =
                    frm.doc.date_of_birth || frappe.datetime.get_today();
                  latest_client.custom_national_id =
                    frm.doc.card_type == "National ID"
                      ? frm.doc.national_id
                      : null;
                  latest_client.custom_passport_number =
                    frm.doc.card_type == "Passport"
                      ? frm.doc.passport_number
                      : null;
                  latest_client.custom_military_number =
                    frm.doc.card_type == "Military ID"
                      ? frm.doc.military_number
                      : null;

                  // Save the updated client document
                  frappe.call({
                    method: "frappe.client.save",
                    args: {
                      doc: latest_client,
                    },
                    callback: function (save_response) {
                      if (save_response.message) {
                        frm.set_value("client", save_response.message.name);
                      } else {
                        frappe.throw("Error while updating customer");
                      }
                    },
                  });
                }
              },
            });

            /////////////////////////////
          }
        },
      });
    }

    // else if (
    //   (frm.doc.client_type == "Company" ||
    //     frm.doc.client_type == "Interbank") &&
    //   !frm.doc.client
    // ) {
    //   frappe.call({
    //     method: "frappe.client.insert",
    //     args: {
    //       doc: {
    //         doctype: "Customer",
    //         customer_name: frm.doc.company_name,
    //         custom_start_registration_date: frm.doc.start_registration_date
    //           ? frm.doc.start_registration_date
    //           : frappe.datetime.get_today(),

    //         custom_end_registration_date: frm.doc.end_registration_date
    //           ? frm.doc.end_registration_date
    //           : frappe.datetime.get_today(),

    //         custom_comany_address1: frm.doc.custom_comany_address1
    //           ? frm.doc.custom_comany_address1
    //           : "",

    //         custom_type: frm.doc.client_type,
    //         custom_interbank:
    //           frm.doc.interbank && frm.doc.client_type == "Interbank"
    //             ? true
    //             : false,
    //       },
    //     },
    //     callback: function (r) {
    //       if (r.message) {
    //         frm.set_value("client", r.message.name);
    //       } else {
    //         frappe.throw("Error while creating customer");
    //       }
    //     },
    //   });
    // }
  },

  /////////////////////////////////////////////

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
    var acc_currency;
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
          acc_currency = curr;

          frappe.model.set_value(cdt, cdn, "currency", curr);

          frappe.model.set_value(cdt, cdn, "rate", currency_rate);
        },
      });

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
            let formatted_balance = format_currency(from_balance, acc_currency);
            console.log(typeof formatted_balance);

            frappe.model.set_value(cdt, cdn, "balance", formatted_balance);
          } else {
            console.log("not found");
          }
        },
      });
    }
  },

  usd_amount: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.paid_from && row.usd_amount) {
      let total = row.usd_amount * row.rate;

      frappe.model.set_value(cdt, cdn, "total_amount", total);
      // set received amount
      frappe.model.set_value(cdt, cdn, "received_amount", total);

      // let currency = row.currency; // Fetch the stored currency
      // let formatted_usd_amount = format_currency(row.usd_amount, currency);
      // frappe.model.set_value(cdt, cdn, "usd_amount", formatted_usd_amount);
    }
    // else {
    //   frappe.throw("You must enter all required fields.");
    // }
  },

  total_amount: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let total = 0;
    let currency_total = 0;
    if (row.total_amount) {
      frm.doc.transactions.forEach((item) => {
        total += item.total_amount;
      });
      frm.set_value("total", total);
    }
    // validate if invoice is exceeding more than 15000
    if (row.usd_amount) {
      frm.doc.transactions.forEach((item) => {
        currency_total += item.usd_amount;
      });
    }
    if (currency_total > 15000) {
      frappe.msgprint("The total amount of the invoice is more than 15000");
      // frm.set_value("total", 0);
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

// Helper function to clear custom fields
frappe.ui.form.CustomFieldsMixin = {
  clear_custom_fields: function (fields) {
    var me = this;
    fields.forEach(function (field) {
      me.set_value(field, "");
    });
  },
};
