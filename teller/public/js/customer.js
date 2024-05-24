frappe.ui.form.on("Customer", {
  validate: function (frm) {
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.place_of_birth) {
      frappe.msgprint(__("Place of birth is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_card_type) {
      frappe.msgprint(__("Card Type is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_nationality) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_address) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Egyptian" &&
      !frm.doc.custom_date_of_birth
    ) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_job_title) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_work_for) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_issue_date) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_expired) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.gender) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Egyptian" &&
      !frm.doc.custom_mobile_number
    ) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Egyptian" && !frm.doc.custom_phone) {
      frappe.msgprint(__("Nationality is required for Egyptian customers"));
      frappe.validated = false;
    }

    // validate company
    if (frm.doc.customer_group === "Company" && !frm.doc.custom_company_no) {
      frappe.msgprint(__("Company no is required for company "));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Company" &&
      !frm.doc.custom_start_registration_date
    ) {
      frappe.msgprint(__("start reg date  is required for company "));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Company" && !frm.doc.custom_is_expired) {
      frappe.msgprint(__("Expired is required for company "));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Company" && !frm.doc.custom_commercial_no) {
      frappe.msgprint(__("Commerical no is required for company "));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Company" &&
      !frm.doc.custom_company_activity
    ) {
      frappe.msgprint(__("activity  is required for company "));
      frappe.validated = false;
    }
    if (frm.doc.customer_group === "Company" && !frm.doc.custom_legal_form) {
      frappe.msgprint(__("legal form  is required for company "));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Company" &&
      !frm.doc.custom_comany_address1
    ) {
      frappe.msgprint(__("address  is required for company "));
      frappe.validated = false;
    }
    if (
      frm.doc.customer_group === "Company" &&
      !frm.doc.custom_end_registration_date
    ) {
      frappe.msgprint(__("end reg date  is required for company "));
      frappe.validated = false;
    }
  },
  //   customer_group: function (frm) {
  //     if (frm.doc.customer_group === "Egyptian") {
  //       frm.set_df_property("place_of_birth", "reqd", 1);
  //     } else {
  //       frm.set_df_property("place_of_birth", "reqd", 0);
  //     }
  //   },
  //   refresh: function (frm) {
  //     if (frm.doc.customer_group === "Egyptian") {
  //       frm.set_df_property("place_of_birth", "reqd", 1);
  //     } else {
  //       frm.set_df_property("place_of_birth", "reqd", 0);
  //     }
  //   },
});