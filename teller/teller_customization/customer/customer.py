import frappe


def autoname(doc, method):
    if doc.custom_type == "Egyptian" and doc.custom_national_id:
        doc.name = doc.custom_national_id
    elif doc.custom_type == "Company" and doc.custom_commercial_no:
        doc.name = doc.custom_commercial_no
    else:
        frappe.throw(
            "Naming Error: Please ensure National ID or Commercial No is set properly based on the identity type."
        )
