# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document
from frappe import _, utils
from frappe.utils import flt
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import make_autoname
from frappe.utils import nowdate, nowtime

from frappe.utils.data import today


class SalesEntry(Document):
    # def validate(self):
    #     self.create_payment_entry()
    pass


@frappe.whitelist(allow_guest=True)
def get_currency(account):
    # currency = frappe.db.get_value("Payment Entry",{"paid_from":account}, "paid_from_account_currency")
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    currency_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency}, "exchange_rate")
    return currency, currency_rate


@frappe.whitelist(allow_guest=True)
def create_payment_entry(account, usd_amount, recieved_amount, paid_to):
    arr = []
    payment_entry = frappe.new_doc("Payment Entry")
    payment_entry.payment_type = "Internal Transfer"
    payment_entry.paid_from = account
    payment_entry.paid_to = paid_to
    payment_entry.paid_amount = int(usd_amount)
    # payment_entry.party_type = "Customer"
    payment_entry.received_amount = recieved_amount
    # payment_entry.party = "Customer Name"
    payment_entry.reference_no = "Ref No"
    payment_entry.reference_date = utils.getdate()
    # payment_entry.mode_of_payment = "Cash"
    arr.append(payment_entry.paid_from)
    payment_entry.save()
    return payment_entry


# Function to create ledger entry
# @frappe.whitelist()
# def create_ledger_entry(account, amount):
#     # Create a new GL Entry document
#     gl_entry = frappe.new_doc("GL Entry")
#     gl_entry.update({
#         "account": account,
#         "debit": int(amount) if int(amount) > 0 else 0,
#         "credit": abs(amount) if int(amount) < 0 else 0,
#         "posting_date": frappe.utils.today(),
#         "posting_time": frappe.utils.now_datetime().strftime("%H:%M:%S"),
#         "voucher_type": "Sales Entry",  # Update with your actual voucher type
#         # "voucher_no": frappe.utils.get_next_auto_name("GL Entry"),
#           "voucher_no": make_autoname("GL-.YYYY.-.#####"), 
#         "user_remark": "Automatically generated ledger entry from Sales Entry",
#     })
#     gl_entry.insert(ignore_permissions=True)

#     return gl_entry.name  # Return the name of the created GL Entry document

# import frappe
# from frappe.utils import nowdate, nowtime, flt
# from frappe.model.naming import make_autoname

# @frappe.whitelist()
# def create_ledger_entry(account, amount, paid_to):
#     # Create a new GL Entry document
#     gl_entry = frappe.new_doc("GL Entry")
#     voucher_subtype="Internal Transfer"
#     gl_entry.update({
#         "account": account,
#         "debit": flt(amount) if flt(amount) > 0 else 0,
#         "credit": abs(flt(amount)) if flt(amount) < 0 else 0,
#         "posting_date": nowdate(),
#         "posting_time": nowtime(),
#         "voucher_type": "Sales Entry",  # Update with your actual voucher type
#         "voucher_subtype": voucher_subtype,  # Set the voucher subtype
#         "against": paid_to,  # Set the against account (paid_to)
#     })

#     # Generate the auto name for GL Entry
#     voucher_no = make_autoname("GL-.YYYY.-.########")
#     gl_entry.voucher_no = voucher_no

#     try:
#         gl_entry.insert(ignore_permissions=True)
#         return gl_entry.name  # Return the name of the created GL Entry document
#     except Exception as e:
#         frappe.log_error(f"Error creating GL Entry: {str(e)}")
#         frappe.throw("Error creating GL Entry. Please try again.")

import frappe
from frappe.utils import nowdate, nowtime, flt
from frappe.model.naming import make_autoname

# @frappe.whitelist()
# def create_ledger_entry(account, amount, paid_to):
#     # Create a new GL Entry document
#     gl_entry = frappe.new_doc("GL Entry")
#     voucher_subtype="Internal Transfer"
#     gl_entry.update({
#         "account": account,
#         "debit": flt(amount) if flt(amount) > 0 else 0,
#         "credit": abs(flt(amount)) if flt(amount) < 0 else 0,
#         "posting_date": nowdate(),
#         "posting_time": nowtime(),
#         "voucher_type": "Sales Entry",  # Update with your actual voucher type
#         "voucher_subtype": voucher_subtype,  # Set the voucher subtype
#         "against": paid_to,  # Set the against account (paid_to)
#     })

#     # Generate the auto name for GL Entry
#     voucher_no = make_autoname("GL-.YYYY.-.########")
#     gl_entry.voucher_no = voucher_no

#     try:
#         gl_entry.insert(ignore_permissions=True)
#         return gl_entry.name  # Return the name of the created GL Entry document
#     except Exception as e:
#         frappe.log_error(f"Error creating GL Entry: {str(e)}")
#         frappe.throw("Error creating GL Entry. Please try again.")

# Import necessary modules
import frappe

# @frappe.whitelist()
# def create_internal_transfer(paid_from_account, paid_to_account, amount, currency, exchange_rate):
#     try:
#         # Create an internal transfer document
#         internal_transfer = frappe.get_doc({
#             "doctype": "Internal Transfer",
#             "paid_from_account": paid_from_account,
#             "paid_to_account": paid_to_account,
#             "amount": amount,
#             "currency": currency,
#             "exchange_rate": exchange_rate
#         })
#         internal_transfer.insert()

        # Create General Ledger entries
        # create_gl_entries(internal_transfer)

    #     frappe.db.commit()
    #     return "Internal transfer created successfully!"
    # except Exception as e:
    #     frappe.log_error(f"Error creating internal transfer: {str(e)}")
    #     frappe.db.rollback()
    #     return "Error creating internal transfer."

# def create_gl_entries(internal_transfer):
#     # Create debit entry for Paid From Account
#     frappe.get_doc({
#         "doctype": "GL Entry",
#         "account": internal_transfer.paid_from_account,
#         "debit": internal_transfer.amount,
#         "voucher_type": "Internal Transfer",
#         "voucher_no": internal_transfer.name
#     }).insert()

#     # Create credit entry for Paid To Account
#     frappe.get_doc({
#         "doctype": "GL Entry",
#         "account": internal_transfer.paid_to_account,
#         "credit": internal_transfer.amount,
#         "voucher_type": "Internal Transfer",
#         "voucher_no": internal_transfer.name
#     }).insert()

# # Example usage
# if __name__ == "__main__":
#     paid_from_account = "Cash Account"  # Replace with actual account name
#     paid_to_account = "Bank Account"  # Replace with actual account name
#     amount = 1000  # Amount in base currency
#     currency = "USD"
#     exchange_rate = 1.0  # If applicable

#     result = create_internal_transfer(paid_from_account, paid_to_account, amount, currency, exchange_rate)
#     print(result)


# Pseudo-code for creating an internal transfer entry
@frappe.whitelist()

def create_internal_transfer_entry(paid_from_account, paid_to_account, amount, currency, exchange_rate):
    try:
        # Create a Journal Entry (Internal Transfer)
        je = frappe.get_doc({
            "doctype": "Journal Entry",
            "posting_date": today(),
            "accounts": [
                {
                    "account": paid_from_account,
                    "debit_in_account_currency": amount,
                    # "party_type": "Customer",  # Adjust as needed
                    # "party": "Customer Name",  # Adjust as needed
                },
                {
                    "account": paid_to_account,
                    "credit_in_account_currency": amount,
                    # "party_type": "Supplier",  # Adjust as needed
                    # "party": "Supplier Name",  # Adjust as needed
                }
            ],
            # "company": "Your Company",
            "currency": currency,
            "exchange_rate": exchange_rate,
            "remarks": "Internal Transfer"
        })
        je.insert()

        frappe.db.commit()
        return "Internal transfer entry created successfully!"
    except Exception as e:
        frappe.log_error(f"Error creating internal transfer entry: {str(e)}")
        frappe.db.rollback()
        return "Error creating internal transfer entry."

# Example usage
# result = create_internal_transfer_entry("Cash Account", "Bank Account", 1000, "USD", 1.0)
# print(result)
