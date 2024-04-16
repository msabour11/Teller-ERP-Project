# # Copyright (c) 2024, Mohamed AbdElsabour and contributors
# # For license information, please see license.txt

import frappe
from frappe import get_doc,new_doc
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
from erpnext.accounts.general_ledger import make_gl_entries,make_acc_dimensions_offsetting_entry



class SalesEntry(Document):
     def on_submit(self):
         pass
  
     


@frappe.whitelist(allow_guest=True)
def get_currency(account):
    # currency = frappe.db.get_value("Payment Entry",{"paid_from":account}, "paid_from_account_currency")
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    currency_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency}, "exchange_rate")
    return currency, currency_rate


@frappe.whitelist(allow_guest=True)
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

@frappe.whitelist(allow_guest=True)
def create_gl_entry(account_from, account_to, usd_amount, currency, currency_rate,voucher_no,credit_amount):

    # Create a new GL Entry document
    gl_entry = get_doc({
        'doctype': 'GL Entry',
        'posting_date':nowdate() ,  # Use the current date
        'account':account_from ,  # Debit account (From)
        'against': account_to,  # Credit account (To)
        'debit': 0, 
        'credit':credit_amount,
        'credit_in_account_currency': usd_amount,
        'debit_in_account_currency':0,  # Credit amount
        'account_currency': currency,  # Currency
        'exchange_rate':currency_rate, 
        'voucher_type':'Sales Entry', # Currency rate
        'voucher_no':voucher_no
    })

    # Insert the document into the database
    gl_entry.insert()
    gl_entry.submit()
    return gl_entry


@frappe.whitelist(allow_guest=True)
def paid_to_account_balance(paid_to,company):
    try:
        balance = get_balance_on(
            account=paid_to,
            company=company,
          
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _("Error: Unable to fetch account balance.")  # Return a descriptive error message
