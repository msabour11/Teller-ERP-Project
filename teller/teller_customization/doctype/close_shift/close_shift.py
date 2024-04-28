# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import whitelist


class CloseShift(Document):
    pass


# @whitelist(allow_guest=True)
# def get_sales_invoice(close_shift_name):
#     test = []

#     child_list = []
#     invoice_list = []

#     invs = frappe.db.get_list("Teller Invoice", {"docstatus": 1})
#     for i in invs:
#         doc = frappe.get_doc("Teller Invoice", i)
#         invoice_list.append(doc)

#     # # # user = frappe.get_doc("User", frappe.session.user)
#     # # # active_open_shift = frappe.db.get_list("OPen Shift", {"active": 1})

#     # # # active_open_shift_name = active_open_shift[0]["name"]
#     parent = frappe.get_doc("Close Shift", close_shift_name)

#     for invoice in invoice_list:
#         for transaction in invoice.transactions:
#             existing_child = next(
#                 (
#                     c
#                     for c in child_list
#                     if c.reference == invoice.name
#                     and c.currency == transaction.currency
#                 ),
#                 None,
#             )
#             if existing_child is None:
#                 child = frappe.new_doc("Sales Table")
#                 child.update(
#                     {
#                         "doctype": "Sales Table",
#                         "parent": parent.name,
#                         "parentfield": "sales_table",
#                         "parenttype": parent.doctype,
#                         "reference": invoice.name,
#                         "currency": transaction.currency,
#                         "currency_amount": transaction.usd_amount,
#                         "currency_balance": transaction.balance,
#                         "egy_amount": transaction.total_amount,
#                     }
#                 )

#                 parent.append("sales_table", child)
#                 child_list.append(child)

#         # currency_amount
#     parent.save()
#     return child_list


##############################3
# @whitelist()
# def get_sales_invoice(close_shift_name):
#     child_list = []
#     invoice_list = []

#     invs = frappe.db.get_list("Teller Invoice", {"docstatus": 1})
#     for i in invs:
#         doc = frappe.get_doc("Teller Invoice", i)
#         invoice_list.append(doc)

#     parent = frappe.get_doc("Close Shift", close_shift_name)

#     for invoice in invoice_list:
#         for transaction in invoice.transactions:
#             existing_child = next(
#                 (
#                     c
#                     for c in parent.sales_table
#                     if c.reference == invoice.name
#                     and c.currency == transaction.currency
#                 ),
#                 None,
#             )
#             if existing_child is None:
#                 child = frappe.new_doc("Sales Table")
#                 child.update(
#                     {
#                         "doctype": "Sales Table",
#                         "parent": parent.name,
#                         "parentfield": "sales_table",
#                         "parenttype": parent.doctype,
#                         "reference": invoice.name,
#                         "currency": transaction.currency,
#                         "currency_amount": transaction.usd_amount,
#                         "currency_balance": transaction.balance,
#                         "egy_amount": transaction.total_amount,
#                     }
#                 )

#                 parent.append("sales_table", child)
#                 child_list.append(child)

#     parent.save()
#     return child_list


@whitelist()
def active_active_user():
    user = frappe.get_doc("User", frappe.session.user)
    return user


@whitelist()
def get_active_shift():
    active_open_shift = frappe.db.get_list("OPen Shift", {"active": 1})

    active_open_shift_name = active_open_shift[0]["name"]
    return active_open_shift_name


@whitelist()
def get_sales_invoice(close_shift_name, current_open_shift):
    child_list = []
    invoice_list = []
    currency_list = []

    invs = frappe.db.get_list(
        "Teller Invoice", {"docstatus": 1, "shift": current_open_shift}
    )
    for i in invs:
        doc = frappe.get_doc("Teller Invoice", i)
        invoice_list.append(doc)

    parent = frappe.get_doc("Close Shift", close_shift_name)

    for invoice in invoice_list:
        for transaction in invoice.transactions:

            if not any(
                c.reference == invoice.name and c.currency == transaction.currency
                for c in parent.sales_table
            ):
                child = frappe.new_doc("Sales Table")
                child.update(
                    {
                        "doctype": "Sales Table",
                        "parent": parent.name,
                        "parentfield": "sales_table",
                        "parenttype": parent.doctype,
                        "reference": invoice.name,
                        "currency": transaction.currency,
                        "currency_amount": transaction.usd_amount,
                        "currency_balance": transaction.balance,
                        "egy_amount": transaction.total_amount,
                    }
                )

                parent.append("sales_table", child)
                child_list.append(child)
    total = 0
    for c in child_list:
        currency_list.append(c.currency)

    parent.save()
    return f"the list is {currency_list}"
