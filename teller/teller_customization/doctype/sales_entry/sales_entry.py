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
from frappe import _
from frappe.utils.data import today
from erpnext.accounts.utils import (
	cancel_exchange_gain_loss_journal,
	get_account_currency,
	get_balance_on,
	get_outstanding_invoices,
	get_party_types_from_account_type,
)


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


@frappe.whitelist()
def get_account_balance(paid_from, company):
    try:
        balance = get_balance_on(
            account=paid_from,
            company=company,
            # cost_center=cost_center,
            # date=date,
            # party_type=party_type,
            # party=party,
            # ignore_account_permission=True
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _("Error: Unable to fetch account balance.")  # Return a descriptive error message
# @frappe.whitelist()
# def update_account_balances(paid_from, paid_to, usd_amount, total_amount, company):
#     try:
#         # Subtract usd_amount from paid_from account balance
#         balance_paid_from = get_balance_on(account=paid_from, company=company)
#         new_balance_paid_from = balance_paid_from - usd_amount
        
#         # Add total_amount to paid_to account balance
#         balance_paid_to = get_balance_on(account=paid_to, company=company)
#         new_balance_paid_to = balance_paid_to + total_amount
        
#         # Update account balances in the database
#         frappe.db.set_value("Account", paid_from, "balance", new_balance_paid_from)
#         frappe.db.set_value("Account", paid_to, "balance", new_balance_paid_to)
        
#         return True  # Return a success message or value
#     except Exception as e:
#         error_message = f"Error updating account balances: {str(e)}"
#         frappe.log_error(error_message)
#         return False  # Return a failure message or value

from erpnext.accounts.general_ledger import make_gl_entries
from frappe.utils import nowdate
@frappe.whitelist()
def update_account_balances(paid_from, paid_to, usd_amount, total_amount, company):
    try:
        # Prepare the gl entries
        gl_entries = [
            {
                "account": paid_from,
                "company": company,
                "posting_date": nowdate(),
                "voucher_type": "Sales Entry",
                "debit": usd_amount,
                "credit": 0,
                "against": paid_to
            },
            {
                "account": paid_to,
                "company": company,
                "posting_date": nowdate(),
                "voucher_type": "Sales Entry",
                "debit": 0,
                "credit": total_amount,
                "against": paid_from
            }
        ]

        # Make the gl entries which will update the account balances
        make_gl_entries(gl_entries)

        return True  # Return a success message or value
    except Exception as e:
        error_message = f"Error updating account balances: {str(e)}"
        frappe.log_error(error_message)
        return False  # Return a failure message or value
