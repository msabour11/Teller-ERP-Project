// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Teller Purchase", {
  // validation on national id and registration date
  validate: function (frm) {
    // validate individual client national id
    if (
      (frm.doc.category_of_buyer == "Egyptian" ||
        frm.doc.category_of_buyer == "Foreigner") &&
      frm.doc.national_id
    ) {
      validateNationalId(frm, frm.doc.national_id);
    }

    // validate commissar national id

    if (
      (frm.doc.category_of_buyer == "Company" ||
        frm.doc.category_of_buyer == "Interbank") &&
      frm.doc.commissar &&
      frm.doc.com_national_id
    ) {
      validateNationalId(frm, frm.doc.com_national_id);
    }
    if (
      (frm.doc.category_of_buyer == "Company" ||
        frm.doc.category_of_buyer == "Interbank") &&
      frm.doc.buyer
    ) {
      validateRegistrationDate(
        frm,
        frm.doc.start_registration_date,
        frm.doc.end_registration_date
      );
      validateRegistrationDateExpiration(frm, frm.doc.end_registration_date);
    }
  },
  // filters accounts with cash ,is group False and account currency not EGY
  setup: function (frm) {
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
    //add ledger button in refresh To Purchase invoice
    frm.events.show_general_ledger(frm);
    set_branch_and_shift(frm);
    // filter customers based on  customer category
    frm.set_query("buyer", function (doc) {
      return {
        filters: {
          custom_type: doc.category_of_buyer,
        },
      };
    });

    // fetch agy account

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
          console.log("the session egyptian account", r.message.egy_account);
          let user_account = r.message.egy_account;
          if (user_account) {
            frm.set_value("egy", user_account);
            frm.set_value("egy_account", user_account);

            console.log(
              "the session egyptian account after set is ",
              user_account
            );
          } else {
            frappe.throw("there is no egy account linked to this user");
          }
        } else {
          frappe.throw("Error while getting user");
        }
      });
  },

  // add ledger report button on submit doctype
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

    // filters commissar based on company name
    frm.set_query("commissar", function (doc) {
      return {
        query:
          "teller.teller_customization.doctype.teller_purchase.teller_purchase.filters_commissars_by_company",
        filters: {
          link_doctype: "Customer",
          link_name: doc.buyer,
        },
      };
    });
    //
  },

  // get customer information if exists
  buyer: function (frm) {
    // get the information for Egyptian
    if (
      frm.doc.category_of_buyer == "Egyptian" ||
      frm.doc.category_of_buyer == "Foreigner"
    ) {
      if (frm.doc.buyer) {
        //test add
        var customerName = frm.doc.buyer;

        //////////////

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
            frm.set_value("card_type", r.message.custom_card_type);

            frm.set_value("phone", r.message.custom_phone);
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
    } // get the information for company
    else if (
      frm.doc.category_of_buyer == "Company" ||
      frm.doc.category_of_buyer == "Interbank"
    ) {
      if (frm.doc.buyer) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Customer",
            name: frm.doc.buyer,
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
            // frm.set_value("company_number", r.message.custom_company_no);
            frm.set_value("company_address", r.message.custom_comany_address1);
            frm.set_value("is_expired", r.message.custom_is_expired);
            frm.set_value("interbank", r.message.custom_interbank);
            frm.set_value("company_legal_form", r.message.custom_legal_form);
          },
        });
      } else {
        // clear the fields
        frm.set_value("company_name", "");
        frm.set_value("company_activity", "");
        frm.set_value("company_commercial_no", "");
        // frm.set_value("company_number", "");
        frm.set_value("end_registration_date", "");
        frm.set_value("start_registration_date", "");
        frm.set_value("company_address", "");
        frm.set_value("is_expired", "");
        frm.set_value("interbank", "");
        frm.set_value("company_legal_form", "");
      }
    }
  },

  // add comissar to invoice

  commissar: function (frm) {
    if (
      frm.doc.category_of_buyer == "Company" ||
      (frm.doc.category_of_buyer == "Interbank" && frm.doc.buyer)
    ) {
      if (frm.doc.commissar) {
        var commissarNAme = frm.doc.commissar;
        var companyName = frm.doc.buyer;
        var fullCommissarName = commissarNAme;

        //test add

        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Contact",
            name: fullCommissarName,
          },
          callback: function (r) {
            // set the fields with r.message.fieldname
            frm.set_value("com_national_id", r.message.custom_national_id);
            frm.set_value("com_gender", r.message.custom_com_gender);
            frm.set_value("com_address", r.message.custom_com_address);
            frm.set_value("com_name", r.message.first_name);

            frm.set_value("com_phone", r.message.custom_com_phone);
            frm.set_value("com_job_title", r.message.custom_job_title);
            frm.set_value("com_mobile_number", r.message.custom_mobile_number);
          },
        });
      } else {
        // clear the fields
        frm.set_value("com_national_id", "");
        frm.set_value("com_gender", "");
        frm.set_value("com_address", "");
        frm.set_value("com_name", "");
        frm.set_value("com_phone", "");
        frm.set_value("com_job_title", "");
        frm.set_value("com_mobile_number", "");
      }
    } else {
      __("Please select Company Name Before add Commissar");
    }
  },
  // add customer information if not already present or update existing customer information
  after_save: function (frm) {
    /////test customer history

    ////////

    if (frm.doc.buyer) {
      // update_contact_list(frm);
    }
    if (
      (frm.doc.category_of_buyer == "Egyptian" ||
        frm.doc.category_of_buyer == "Foreigner") &&
      !frm.doc.buyer
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
            custom_type: frm.doc.category_of_buyer,
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
            frm.set_value("buyer", r.message.name);
          } else {
            frappe.throw("Error while creating customer");
          }
        },
      });
    } else if (
      (frm.doc.category_of_buyer == "Egyptian" ||
        frm.doc.category_of_buyer == "Foreigner") &&
      frm.doc.buyer
    ) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Customer",
          filters: {
            customer_name: frm.doc.buyer,
          },
        },
        callback: function (r) {
          if (r.message) {
            console.log(r.message);

            /////////////////////////////////
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
                  latest_client.custom_work_for = frm.doc.work_for;

                  latest_client.custom_nationality = frm.doc.nationality;
                  latest_client.custom_mobile = frm.doc.mobile_number;
                  latest_client.custom_phone = frm.doc.phone;
                  latest_client.custom_place_of_birth = frm.doc.place_of_birth;

                  latest_client.custom_address = frm.doc.address;
                  latest_client.custom_job_title = frm.doc.job_title;
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
                        frm.set_value("buyer", save_response.message.name);
                      } else {
                        frappe.throw("Error while updating customer");
                      }
                    },
                  });
                }
              },
            });
          }
        },
      });
    }

    // update company if company is already existing or created it if company not already existing
    else if (
      (frm.doc.category_of_buyer == "Company" ||
        frm.doc.category_of_buyer == "Interbank") &&
      !frm.doc.buyer
    ) {
      frappe.call({
        method: "frappe.client.insert",
        args: {
          doc: {
            doctype: "Customer",
            customer_name: frm.doc.company_name,
            custom_start_registration_date: frm.doc.start_registration_date
              ? frm.doc.start_registration_date
              : frappe.datetime.get_today(),

            custom_end_registration_date: frm.doc.end_registration_date
              ? frm.doc.end_registration_date
              : frappe.datetime.get_today(),

            custom_comany_address1: frm.doc.company_address
              ? frm.doc.company_address
              : "",

            custom_type: frm.doc.category_of_buyer,
            custom_interbank:
              frm.doc.interbank && frm.doc.category_of_buyer == "Interbank"
                ? true
                : false,

            custom_commercial_no: frm.doc.company_commercial_no
              ? frm.doc.company_commercial_no
              : "",
            custom_company_activity: frm.doc.company_activity
              ? frm.doc.company_activity
              : "",
            custom_legal_form: frm.doc.company_legal_form
              ? frm.doc.company_legal_form
              : "",
            custom_is_expired: frm.doc.is_expired,

            //company_commercial_no
          },
        },
        callback: function (r) {
          if (r.message) {
            frm.set_value("buyer", r.message.name);
            console.log("buyer updated successfully", r.message.name);
            handleCommissarCreationOrUpdate(frm);
          } else {
            frappe.throw("Error while creating customer");
          }
        },
      });
    } else if (
      (frm.doc.category_of_buyer == "Company" ||
        frm.doc.category_of_buyer == "Interbank") &&
      frm.doc.buyer
    ) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Customer",
          filters: {
            customer_name: frm.doc.buyer,
          },
        },
        callback: function (r) {
          if (r.message) {
            console.log("response from comapny updated", r.message);

            /////////////////////////////////
            var existing_company = r.message;

            // Fetch the latest version of the document
            frappe.call({
              method: "frappe.client.get",
              args: {
                doctype: "Customer",
                name: existing_company.name,
              },
              callback: function (response) {
                if (response.message) {
                  console.log("company name response", response.message);
                  let latest_company = response.message;
                  // Update the relevant fields
                  latest_company.custom_start_registration_date =
                    frm.doc.start_registration_date;
                  latest_company.custom_end_registration_date =
                    frm.doc.end_registration_date;
                  latest_company.custom_comany_address1 =
                    frm.doc.company_address || "";
                  latest_company.custom_commercial_no =
                    frm.doc.company_commercial_no;
                  latest_company.custom_legal_form = frm.doc.company_legal_form;
                  // latest_company.custom_company_no = frm.doc.company_number;
                  latest_company.custom_company_activity =
                    frm.doc.company_activity;

                  // latest_company.custom_interbank = true
                  //   ? frm.doc.interbank && frm.doc.client_type == "Interbank"
                  //   : false;

                  // Save the updated client document
                  frappe.call({
                    method: "frappe.client.save",
                    args: {
                      doc: latest_company,
                    },
                    callback: function (save_response) {
                      if (save_response.message) {
                        frm.set_value("buyer", save_response.message.name);
                        handleCommissarCreationOrUpdate(frm);
                      } else {
                        frappe.throw("Error while updating customer");
                      }
                    },
                  });
                }
              },
            });
          }
        },
      });
    }
  },

  // set special purchaase rates
  special_price: (frm) => {
    if (frm.doc.docstatus == 0) {
      let total_currency_amount = 0;

      frm.doc.transactions.forEach((row) => {
        if (row.paid_from && row.currency) {
          frappe.call({
            method:
              "teller.teller_customization.doctype.teller_purchase.teller_purchase.get_currency",
            args: {
              account: row.paid_from,
            },
            callback: function (r) {
              console.log("all rates", r.message);
              let purchase_special_rate = r.message[2];
              if (purchase_special_rate) {
                row.rate = purchase_special_rate;
                console.log("special purchase ", purchase_special_rate);
                let currency_total = row.rate * row.usd_amount;
                row.total_amount = currency_total;

                console.log(
                  `the total of ${row.currency} is ${row.total_amount}`
                );

                total_currency_amount += currency_total;
                console.log("from loop: " + total_currency_amount);
                frm.refresh_field("transactions");
                frm.set_value("total", total_currency_amount);
              }
            },
          });
        } else {
          console.log("error occure");
          // frappe.throw(__("please insert all fields"));
          frappe.throw(
            __("Special Rate Error Please Insert All Required Fields")
          );
          return;
        }
      });
      // console.log("from outer loop: " + total_currency_amount);
    }
  },

  egy_account: (frm) => {
    if (frm.doc.egy) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_purchase.teller_purchase.account_to_balance",
        args: {
          paid_to: frm.doc.egy_account,
          // company: frm.doc.company,
        },
        callback: function (r) {
          if (r.message) {
            console.log("the egy balance", r.message);
            let egy_balance = r.message;

            frm.set_value("egy_balance", egy_balance);
          } else {
            console.log("not found");
          }
        },
      });
    }
  },
  total: function (frm) {
    if (frm.doc.buyer && frm.doc.total) {
      // check if the total is exceeded
      isExceededLimit(frm, frm.doc.buyer, frm.doc.total);
    } else {
      frappe.msgprint({
        message:
          '<div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 14px;">Please enter Customer to validate the transaction</div>',
        title: "Missing Data Error",
        indicator: "red",
      });
    }
  },
});
// currency transactions table

frappe.ui.form.on("Teller Purchase Child", {
  paid_from: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.paid_from) {
      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_purchase.teller_purchase.get_currency",
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

      frappe.call({
        method:
          "teller.teller_customization.doctype.teller_purchase.teller_purchase.account_from_balance",
        args: {
          paid_from: row.paid_from,
          // company: frm.doc.company,
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
    }
  },

  usd_amount: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.paid_from && row.usd_amount) {
      let total = row.usd_amount * row.rate;

      frappe.model.set_value(cdt, cdn, "total_amount", total);
      frappe.model.set_value(cdt, cdn, "received_amount", total);

      //received_amount

      // Update currency balances

      // frappe.call({
      //   method:
      //     "teller.teller_customization.doctype.teller_purchase.teller_purchase.account_from_balance",
      //   args: {
      //     paid_from: row.paid_from,
      //     // company: frm.doc.company,
      //   },
      //   callback: function (r) {
      //     if (r.message) {
      //       console.log(r.message);
      //       let from_balance = r.message;

      //       frappe.model.set_value(cdt, cdn, "balance", from_balance);
      //     } else {
      //       console.log("not found");
      //     }
      //   },
      // });
    } else {
      frappe.throw("Amount and Account From  are required");
    }
  },
  total_amount: (frm, cdt, cdn) => {
    let total = 0;
    frm.doc.transactions.forEach((item) => {
      total += item.total_amount;
    });
    frm.set_value("total", total);
  },
  transactions_remove: (frm, cdt, cdn) => {
    let total = 0;
    frm.doc.transactions.forEach((item) => {
      total += item.total_amount;
    });
    frm.set_value("total", total);
    console.log(`after remove ${total}`);
  },
});
// function to setup branch and shift
function set_branch_and_shift(frm) {
  // set the branch
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
        console.log("the branch is ", branch);
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

// create or update commissar
function handleCommissarCreationOrUpdate(frm) {
  if (
    (frm.doc.category_of_buyer == "Company" ||
      frm.doc.category_of_buyer == "Interbank") &&
    frm.doc.buyer &&
    !frm.doc.commissar
  ) {
    if (!frm.doc.buyer) {
      frappe.msgprint(__("Please select Company first."));
      return;
    }

    var newContact = frappe.model.get_new_doc("Contact");
    newContact.links = [
      {
        link_doctype: "Customer",
        link_name: frm.doc.buyer,
      },
    ];

    // Set the necessary fields
    newContact.first_name = frm.doc.com_name;
    newContact.custom_com_gender = frm.doc.com_gender;

    newContact.custom_com_address = frm.doc.com_address;
    newContact.custom_com_phone = frm.doc.com_phone;
    newContact.custom_national_id = frm.doc.com_national_id;
    newContact.custom_job_title = frm.doc.com_job_title;
    newContact.custom_mobile_number = frm.doc.com_mobile_number;

    frappe.call({
      method: "frappe.client.insert",
      args: {
        doc: newContact,
      },
      callback: function (r) {
        if (r.message) {
          frappe.show_alert({
            message: __("Commissar added successfully"),
            indicator: "green",
          });
          frm.set_value("commissar", r.message.name);
        }
      },
    });
  } else if (
    (frm.doc.category_of_buyer === "Company" ||
      frm.doc.category_of_buyer === "Interbank") &&
    frm.doc.buyer &&
    frm.doc.commissar
  ) {
    frappe.call({
      method: "frappe.client.get",
      args: {
        doctype: "Contact",
        name: frm.doc.commissar,
      },
      callback: function (r) {
        if (r.message) {
          let existing_contact = r.message;

          // Update the relevant fields
          existing_contact.first_name = frm.doc.com_name;
          existing_contact.custom_com_gender = frm.doc.com_gender;
          existing_contact.custom_national_id = frm.doc.com_national_id;
          existing_contact.custom_com_address = frm.doc.com_address || "";
          existing_contact.custom_com_phone = frm.doc.com_phone;
          existing_contact.custom_job_title = frm.doc.com_job_title;
          existing_contact.custom_mobile_number = frm.doc.com_mobile_number;

          frappe.call({
            method: "frappe.client.save",
            args: {
              doc: existing_contact,
            },
            callback: function (save_response) {
              if (save_response.message) {
                frappe.show_alert({
                  message: __("Commissar updated successfully"),
                  indicator: "green",
                });
                frm.set_value("commissar", save_response.message.name);
              } else {
                frappe.throw(__("Error while updating Commissar"));
              }
            },
            error: function () {
              frappe.throw(__("Error while updating Commissar"));
            },
          });
        } else {
          frappe.throw(__("Commissar not found"));
        }
      },
      error: function () {
        frappe.throw(__("Error while fetching Commissar details"));
      },
    });
  }
}

// get the allowed amount from Teller settings
async function fetchAllowedAmount() {
  return frappe.db.get_single_value(
    "Teller Setting",
    "purchase_allowed_amount"
  );
}

// fetch the duration of days for the limit
async function fetchLimitDuration() {
  return frappe.db.get_single_value("Teller Setting", "purchase_duration");
}

// get the customer Total Invoices Amount
async function getCustomerTotalAmount(clientName, duration) {
  let limiDuration = await fetchLimitDuration();
  return new Promise((resolve, reject) => {
    frappe.call({
      method:
        "teller.teller_customization.doctype.teller_purchase.teller_purchase.get_customer_total_amount",
      args: {
        client_name: clientName,
        duration: limiDuration,
      },
      callback: function (r) {
        if (r.message) {
          resolve(r.message);
        } else {
          reject("No response message");
        }
      },
    });
  });
}

//  check if the if the current invioce or customer total invoices  exceeds the limit

async function isExceededLimit(frm, clientName, invoiceTotal) {
  let allowedAmount = await fetchAllowedAmount();
  console.log("the allowed amount is", allowedAmount);

  let customerTotal = await getCustomerTotalAmount(clientName);
  console.log("the customer total is", customerTotal);

  let limiDuration = await fetchLimitDuration();
  console.log("the limit duration", limiDuration);

  if (allowedAmount && limiDuration && customerTotal) {
    if (invoiceTotal > allowedAmount && customerTotal > allowedAmount) {
      let message = `
            <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 14px;">
              The Total Amount of the Current Invoice  And  Customer Total  ${customerTotal} Withen ${limiDuration} Days EGP are Exceed Limit  ${allowedAmount} EGP 
            </div>`;

      frappe.msgprint({
        message: message,
        title: "Limitations Exceeded",
        indicator: "red",
      });
      frm.set_value("exceed", true);
    } else if (invoiceTotal > allowedAmount) {
      let message = `
        <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 14px;">
          The Total Amount of the Current Invoice  is Exceed Limit ${allowedAmount} EGP 
        </div>`;

      frappe.msgprint({
        message: message,
        title: "Limitations Exceeded",
        indicator: "red",
      });
      frm.set_value("exceed", true);
    } else if (customerTotal > allowedAmount) {
      let message = `
        <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 14px;">
           Customer Total   ${customerTotal} EGP Withen ${limiDuration} Days  are Exceed Limit ${allowedAmount} EGP 
        </div>`;

      frappe.msgprint({
        message: message,
        title: "Limitations Exceeded",
        indicator: "red",
      });
      frm.set_value("exceed", true);
    } else {
      frm.set_value("exceed", false);
    }
  } else {
    frappe.throw(
      "Please provide in settings allowing for limit  and the duration"
    );
  }
}

// validate the national id

function validateNationalId(frm, nationalId) {
  if (!/^\d{14}$/.test(nationalId)) {
    frappe.msgprint(
      __("National ID must be exactly 14 digits and contain only numbers.")
    );
    frappe.validated = false;
  }
}
// validate end registration date is must be after start registration
function validateRegistrationDate(frm, start, end) {
  if (start && end && start > end) {
    frappe.msgprint(__("Registration Date cannot be after Expiration Date."));
    frappe.validated = false;
  }
}
// validate if the registration date is expired
function validateRegistrationDateExpiration(frm, end) {
  if (end) {
    // Get today's date using Frappe's date utility
    const today = frappe.datetime.get_today();

    // Convert dates to Date objects for comparison
    const endDate = new Date(end);
    const todayDate = new Date(today);

    // Compare the dates
    if (endDate < todayDate) {
      frm.set_value("is_expired", true);
    }
  }
}
