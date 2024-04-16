import frappe
from datetime import datetime
from frappe.model.document import Document
from frappe import _, utils
import frappe
from erpnext.accounts.general_ledger import make_gl_entries
from frappe.utils import nowdate

@frappe.whitelist(allow_guest=True)
def get_currency(account):
    # currency = frappe.db.get_value("Payment Entry",{"paid_from":account}, "paid_from_account_currency")
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    currency_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency}, "exchange_rate")
    return currency, currency_rate

@frappe.whitelist(allow_guest=True)
def create_payment_entry(account, currency,usd_amount,recieved_amount,paid_to):
    payment_entry = frappe.new_doc("Payment Entry")
    payment_entry.payment_type = "Internal Transfer"
    payment_entry.paid_from = account
    payment_entry.paid_to = paid_to
    payment_entry.paid_amount = usd_amount
    # payment_entry.party_type = "Customer"
    payment_entry.received_amount = recieved_amount
    # payment_entry.party = "Customer Name"
    payment_entry.reference_no = "Ref No"
    payment_entry.reference_date = utils.getdate()
    # payment_entry.mode_of_payment = "Cash"
    payment_entry.save()

@frappe.whitelist(allow_guest=False)
def create_gl_entries():
    
        # Prepare the GL entries data (list of dictionaries)
        gl_entries = [
            {
                "account": "Ahmed-USD - BD",  
                "company": "Bank (Demo)",
                "posting_date": nowdate(),
                "voucher_type": "Sales Invoice",
                "debit": 1000,  # Debit amount
                "credit": 0,
                "against": "Ahmed-EGY - BD",  # Example account code for credit
                "remarks": "Transaction details for debit entry"
            },
            {
                "account": "Ahmed-EGY - BD",  # Example account code for credit
                "company": "ABC Company",
                "posting_date": nowdate(),
                "voucher_type": "Sales Invoice",
                "debit": 0,
                "credit": 1000,  # Credit amount
                "against": "Ahmed-USD - BD",  # Example account code for debit
                "remarks": "Transaction details for credit entry"
            }
        ]

        # Make the GL entries
        gl= make_gl_entries(gl_entries)

        return gl
