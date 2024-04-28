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
        console.log(r);
      },
    });
  },

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
