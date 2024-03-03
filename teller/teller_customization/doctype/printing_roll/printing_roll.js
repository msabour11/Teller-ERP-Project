frappe.ui.form.on("Printing Roll", {
  onload: function (frm) {
    // Fetch the value from the previous document and set it in the current document
    // frappe.call({
    //   method: "frappe.client.get_value",
    //   args: {
    //     doctype: "Printing Roll",
    //     fieldname: "last_printed_number",
    //     order_by: "creation",
    //     order: "desc",
    //     limit: 1,
    //     filters: {
    //       name: ["!=", frm.docname], // Exclude the current document
    //     },
    //   },
    //   callback: function (response) {
    //     if (response.message) {
    //       lpn = response.message.last_printed_number;
    //       lpn = parseInt(lpn);
    //       frm.set_value("last_printed_number", lpn);
    //       lpn += 1;
    //       frm.set_value("last_printed_number", lpn);
    //       console.log(lpn);
    //     }
    //   },
    // });
  },
});
