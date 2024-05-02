// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Close Shift", {
  refresh(frm) {
    frappe.call({
      method:
        "teller.teller_customization.doctype.close_shift.close_shift.get_active_shift",
      callback: function (r) {
        console.log(r.message);
        frm.set_value("open_shift", r.message);
      },
    });
    frappe.call({
      method:
        "teller.teller_customization.doctype.close_shift.close_shift.active_active_user",
      callback: function (r) {
        console.log(r.message["name"]);
        frm.set_value("current_user", r.message["name"]);
      },
    });
  },

  // get_invoices: function (frm) {
  //   console.log(frm.doc.name);
  //   frappe.call({
  //     method:
  //       "teller.teller_customization.doctype.close_shift.close_shift.get_sales_invoice",
  //     args: {
  //       close_shift_name: frm.doc.name,
  //       current_open_shift: frm.doc.open_shift,
  //     },
  //     callback: function (r) {
  //       // console.log(r.message[0]);
  //       // console.log(r.message[1]);
  //       // frappe.publish_progress(
  //       //   25,
  //       //   (title = "Some title"),
  //       //   (description = "Some description")
  //       // );
  //       // frappe.publish_progress(100, "from JS");
  //       console.log("total is ", r.message[0]);
  //       let total = r.message[0];
  //       console.log("type is ", typeof total);
  //       frm.set_value("total_sales", total);

  //       // Calculate progress based on array length
  //       let arr = r.message[1];

  //       let progressStep = 100 / arr.length;
  //       let currentProgress = 0;

  //       for (let i = 0; i < arr.length; i++) {
  //         // Simulate processing time for each item
  //         setTimeout(() => {
  //           currentProgress += progressStep;
  //           frappe.show_progress(
  //             "Getting Invoices...",
  //             currentProgress,
  //             "Please wait"
  //           );
  //         }, 500 * i); // Adjust delay as needed
  //       }

  //       // let arr = r.message[1];
  //       // console.log("arr is", arr);
  //       // for (let i = 0; i < arr.length; i++) {
  //       //   frappe.show_progress(
  //       //     "Getting Contacts..",
  //       //     (i + 1) * 10,
  //       //     "Please wait"
  //       //   );
  //       // }

  //       // frappe.show_progress("Getting Contacts..", 90, 100, "Please wait");
  //       // frappe.hide_progress();
  //     },
  //     // freeze: true,
  //     // freeze_message: "Processing data...",
  //     // progress: function (progress) {
  //     //   frappe.show_progress("Processing data", 90, 100, "wait");
  //     // },
  //   });
  // },
  get_invoices: function (frm) {
    console.log(frm.doc.name);
    frappe.call({
      method:
        "teller.teller_customization.doctype.close_shift.close_shift.get_sales_invoice",
      args: {
        close_shift_name: frm.doc.name,
        current_open_shift: frm.doc.open_shift,
      },
      callback: function (r) {
        console.log("total is ", r.message[0]);
        let total = r.message[0];
        console.log("type is ", typeof total);
        frm.set_value("total_sales", total);

        // Calculate progress based on array length
        let arr = r.message[1];

        let progressStep = 100 / arr.length;
        let currentProgress = 0;

        for (let i = 0; i < arr.length; i++) {
          // Simulate processing time for each item
          setTimeout(() => {
            currentProgress += progressStep;
            frappe.show_progress(
              "Getting Invoices...",
              currentProgress,
              "Please wait"
            );
          }, 500 * i); // Adjust delay as needed
        }

        // Hide the progress bar after all invoices have been processed
        setTimeout(() => {
          frappe.hide_progress();
        }, 500 * arr.length);
      },
    });
  },

  // on_save: function (frm) {
  //   frappe.call({
  //     method:
  //       "teller.teller_customization.doctype.close_shift.close_shift.get_sales_invoice",
  //     args: {
  //       close_shift_name: frm.doc.name,
  //       current_open_shift: frm.doc.open_shift,
  //     },
  //     callback: function (r) {
  //       console.log(r.message[0]);
  //       console.log("total is ", r.message[1]);
  //       let total = r.message[1];
  //       console.log("type is ", typeof total);

  //       frm.set_value("total_sales", total);
  //     },
  //   });
  // },

  //  async get_invoices(frm) {
  //    try {
  //      let total_purchase_invoices = 0;
  //      const response = await frappe.call({
  //        method: "frappe.client.get_list",
  //        args: {
  //          doctype: "Teller Purchase",
  //          filters: {
  //            shift: frm.doc.open_shift,
  //            teller: frm.doc.current_user,
  //          },
  //        },
  //      });
  //
  //      if (response.message) {
  //        const invoices = response.message;
  //
  //        for (let row of invoices) {
  //          const invResponse = await frappe.call({
  //            method: "frappe.client.get",
  //            args: {
  //              doctype: "Teller Purchase",
  //              name: row.name,
  //            },
  //          });
  //
  //          if (invResponse.message) {
  //            const invocies = invResponse.message;
  //            const arr = invocies.items;
  //            let amount = 0;
  //            console.log(arr);
  //
  //            arr.forEach((element) => {
  //              // console.log(element["amount"]);
  //              amount += element["amount"];
  //              frm.add_child("invoices_tables", {
  //                reference: invocies.name,
  //                //  total: invocies.total,
  //                amount: element["amount"],
  //                item_code: element["item_code"],
  //                quantity: element["quantity"],
  //              });
  //            });
  //
  //            // frm.add_child("invoices_tables", {
  //            //   reference: invocies.name,
  //            //   total: invocies.total,
  //            //   // amount: element["amount"],
  //            // });
  //
  //            total_purchase_invoices += invocies.total;
  //          }
  //        }
  //      }
  //
  //      frm.set_value("total_purchase", total_purchase_invoices);
  //      frm.refresh_field("invoices_tables");
  //    } catch (err) {
  //      console.error(err);
  //    }
  //    try {
  //      let total_sale_invoices = 0;
  //      const response = await frappe.call({
  //        method: "frappe.client.get_list",
  //        args: {
  //          doctype: "Teller Invoice",
  //          filters: {
  //            shift: frm.doc.open_shift,
  //            teller: frm.doc.current_user,
  //          },
  //        },
  //      });
  //
  //      if (response.message) {
  //        const sale_invoices = response.message;
  //
  //        for (let row of sale_invoices) {
  //          const invResponse = await frappe.call({
  //            method: "frappe.client.get",
  //            args: {
  //              doctype: "Teller Invoice",
  //              name: row.name,
  //            },
  //          });
  //
  //          if (invResponse.message) {
  //            const invocies = invResponse.message;
  //            const arr = invocies.items;
  //            let amount = 0;
  //
  //            arr.forEach((element) => {
  //              console.log(element["amount"]);
  //              amount += element["amount"];
  //              frm.add_child("sales_table", {
  //                reference: invocies.name,
  //                //  total: invocies.total,
  //                amount: element["amount"],
  //                item_code: element["item_code"],
  //                quantity: element["quantity"],
  //              });
  //            });
  //
  //            // total currency
  //            // arr.forEach((element) => {
  //            //   console.log(element["amount"]);
  //            //   amount += element["amount"];
  //            //   frm.add_child("total_currency", {
  //            //     amount: element["amount"],
  //            //     item_code: element["item_code"],
  //            //     quantity: element["quantity"],
  //            //   });
  //            // });
  //
  //            // frm.add_child("sales_table", {
  //            //   reference: invocies.name,
  //            //   total: invocies.total,
  //            //   // amount: amount,
  //            // });
  //
  //            total_sale_invoices += invocies.total;
  //          }
  //        }
  //      }
  //
  //      frm.set_value("total_sales", total_sale_invoices);
  //      frm.refresh_field("sales_table");
  //    } catch (err) {
  //      console.error(err);
  //    }
  //  },
});
