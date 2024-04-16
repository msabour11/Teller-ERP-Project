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
         for row in self.get("transactions"):
            
            if row.paid_from and row.paid_to and row.usd_amount and row.received_amount:
                # Call create_gl_entry function to create GL Entry for each row
                gl_entry = create_gl_entry(
                    account_from=row.paid_from,
                    account_to=row.paid_to,
                    usd_amount=row.usd_amount,
                    credit_amount=row.total_amount,  # Assuming this is the credit amount in GL Entry
                    currency=row.currency,
                    currency_rate=row.rate,
                    voucher_no=self.name,
                    credit_in_transaction_currency= row.total_amount # Assuming the Sales Entry document name is used as the voucher number
                )
                if gl_entry:
                    frappe.msgprint(_("GL Entry created successfully for row {0}").format(row.idx))
                else:
                    frappe.msgprint(_("Failed to create GL Entry for row {0}").format(row.idx))
            else:
                frappe.throw(_("You must enter all required fields in row {0}").format(row.idx))

         
  
     


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
def create_gl_entry(account_from, account_to, usd_amount, currency, currency_rate,voucher_no,credit_amount,credit_in_transaction_currency):

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
        'voucher_no':voucher_no,
        "credit_in_transaction_currency":credit_in_transaction_currency
    })

    # Insert the document into the database
    gl_entry.insert()
    gl_entry.submit()

    # Create a new GL Entry document for the credit entry
    credit_gl_entry = get_doc({
        'doctype': 'GL Entry',
        'posting_date': nowdate(),  # Use the current date
        'account': account_to,  # Debit account (To)
        "debit":credit_amount,
        "credit":0,
        'against_account': account_from,  # Credit account (From)
        'debit_in_account_currency': credit_amount,  # Debit amount
        'credit_in_account_currency': 0,  # Credit amount
        # 'account_currency': currency,  # Currency
        # 'exchange_rate': currency_rate,  # Currency rate
        'voucher_type': 'Sales Entry',  # Voucher Type
        'voucher_no': voucher_no,
            # Voucher No
    })
    credit_gl_entry.insert()
    credit_gl_entry.submit()

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
