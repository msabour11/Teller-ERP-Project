// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Close Shift", {
//   refresh(frm) {},
//   get_invoices(frm) {
//     // console.log("Heell", frm.doc.current_user);
//     frappe.call({
//       method: "frappe.client.get_list",
//       args: {
//         doctype: "Teller Purchase",
//         filters: {
//           shift: frm.doc.open_shift,
//           teller: frm.doc.current_user,
//         },
//       },
//       callback: function (response) {
//         if (response.message) {
//           msg = response.message;

//           for (let row of msg) {
//             // console.log(row.name);
//             frappe.call({
//               method: "frappe.client.get",
//               args: {
//                 doctype: "Teller Purchase",
//                 name: row.name,
//               },
//               callback: function (response) {
//                 // console.log(response);
//                 if (response.message) {
//                   let invocies = response.message;
//                   console.log(invocies);
//                   arr = invocies.items;
//                   arr.forEach((element) => {
//                     console.log(element["amount"]);
//                     const new_item = frm.add_child("invoices_tables", {
//                       // item_code: element["item_code"],
//                       reference: invocies.name,
//                       // quantity: element["quantity"],
//                       // amount: element["amount"],
//                       total: invocies.total,
//                     });
//                   });

//                   frm.refresh_field("invoices_tables");
//                 }
//               },
//             });
//           }
//         }
//       },
//     });
//   },
// });

// frappe.ui.form.on("Close Shift", {
//   refresh(frm) {},
//   get_invoices(frm) {
//     frappe.call({
//       method: "frappe.client.get_list",
//       args: {
//         doctype: "Teller Purchase",
//         filters: {
//           shift: frm.doc.open_shift,
//           teller: frm.doc.current_user,
//         },
//       },
//       callback: function (response) {
//         if (response.message) {
//           msg = response.message;
//
//           for (let row of msg) {
//             // console.log(row.name);
//             frappe.call({
//               method: "frappe.client.get",
//               args: {
//                 doctype: "Teller Purchase",
//                 name: row.name,
//               },
//               callback: function (response) {
//                 // console.log(response);
//                 if (response.message) {
//                   let invocies = response.message;
//                   let total_purchase_invoices=0
//
//                   // console.log(invocies);
//                   arr = invocies.items;
//                   // Add a new child row for the invoice
//                   const new_item = frm.add_child("invoices_tables", {
//                     reference: invocies.name,
//                     total: invocies.total,
//                   });
//                   total_purchase_invoices+=invocies.total
//                   // console.log(`the total is ${total_invoices}`)
//
//                   // Loop over the items and calculate the amount
//                   let amount = 0;
//                   arr.forEach((element) => {
//                     console.log(element["amount"]);
//                     amount += element["amount"];
//                   });
//                   // Set the amount field in the child row
//                   new_item.amount = amount;
//                   frm.refresh_field("invoices_tables");
//                 }
//               },
//             });
//           }
//           frm.set_value("total_purchase", total_purchase_invoices)
//
//         }
//       },
//     });
//   },
// });


frappe.ui.form.on("Close Shift", {
  refresh(frm) {},
  async get_invoices(frm) {
    try {
      let total_purchase_invoices = 0;
      const response = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Teller Purchase",
          filters: {
            shift: frm.doc.open_shift,
            teller: frm.doc.current_user,
          },
        },
      });

      if (response.message) {
        const invoices = response.message;

        for (let row of invoices) {
          const invResponse = await frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Teller Purchase",
              name: row.name,
            },
          });

          if (invResponse.message) {
            const invocies = invResponse.message;
            const arr = invocies.items;
            let amount = 0;

            arr.forEach((element) => {
              // console.log(element["amount"]);
              amount += element["amount"];
            });

            frm.add_child("invoices_tables", {
              reference: invocies.name,
              total: invocies.total,
              amount: amount,
            });

            total_purchase_invoices += invocies.total;
          }
        }
      }

      frm.set_value("total_purchase", total_purchase_invoices);
      frm.refresh_field("invoices_tables");
    } catch (err) {
      console.error(err);
    }
    try {
      let total_sale_invoices = 0;
      const response = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Teller Invoice",
          filters: {
            shift: frm.doc.open_shift,
            teller: frm.doc.current_user,
          },
        },
      });

      if (response.message) {
        const sale_invoices = response.message;

        for (let row of sale_invoices) {
          const invResponse = await frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Teller Invoice",
              name: row.name,
            },
          });

          if (invResponse.message) {
            const invocies = invResponse.message;
            const arr = invocies.items;
            let amount = 0;

            arr.forEach((element) => {
              // console.log(element["amount"]);
              amount += element["amount"];
            });

            frm.add_child("sales_table", {
              reference: invocies.name,
              total: invocies.total,
              // amount: amount,
            });

            total_sale_invoices += invocies.total;
          }
        }
      }

      frm.set_value("total_sales", total_sale_invoices);
      frm.refresh_field("sales_table");
    } catch (err) {
      console.error(err);
    }
  },
});
