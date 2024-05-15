// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.query_reports["Teller Balance Sheet"] = {
  filters: [
    {
      fieldname: "account",
      label: "Account Name",
      fieldtype: "Link",
      options: "Account",
      width: "200px",
    },
    {
      fieldname: "account_currency",
      label: "Currency",
      fieldtype: "Link",
      options: "Currency",
      width: "200px",
    },
  ],
};
