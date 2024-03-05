frappe.ui.form.on("Printing Roll", {
  refresh: function (frm) {
    // frappe.msgprint("frm.doc.show_number");
    last_num_str = frm.doc.last_printed_number.toString().length;
    frm.set_value("show_number", last_num_str);
  },
});
