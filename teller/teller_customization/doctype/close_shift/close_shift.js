// // Copyright (c) 2024, Mohamed AbdElsabour and contributors
// // For license information, please see license.txt

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
//                       item_code: element["item_code"],
//                       reference: invocies.name,
//                       quantity: element["quantity"],
//                       amount: element["amount"],
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

frappe.ui.form.on("Close Shift", {
  refresh(frm) {},
  get_invoices(frm) {
    // console.log("Heell", frm.doc.current_user);
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Teller Purchase",
        filters: {
          shift: frm.doc.open_shift,
          teller: frm.doc.current_user,
        },
      },
      callback: function (response) {
        if (response.message) {
          msg = response.message;

          // create a set to store the reference names of invoices
          let reference_set = new Set();

          for (let row of msg) {
            // console.log(row.name);
            frappe.call({
              method: "frappe.client.get",
              args: {
                doctype: "Teller Purchase",
                name: row.name,
              },
              callback: function (response) {
                // console.log(response);
                if (response.message) {
                  let invocies = response.message;
                  console.log(invocies);
                  arr = invocies.items;
                  arr.forEach((element) => {
                    console.log(element["amount"]);

                    // check if the reference name is already in the set
                    if (!reference_set.has(invocies.name)) {
                      // add the reference name to the set
                      reference_set.add(invocies.name);

                      // add a new row to the child table
                      const new_item = frm.add_child("invoices_tables", {
                        // item_code: element["item_code"],
                        reference: invocies.name,
                        // quantity: element["quantity"],
                        // amount: element["amount"],
                        total: invocies.total,
                      });
                    }
                  });

                  frm.refresh_field("invoices_tables");
                }
              },
            });
          }
        }
      },
    });
  },
});
