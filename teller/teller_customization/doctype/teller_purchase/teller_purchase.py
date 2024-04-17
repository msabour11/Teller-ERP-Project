# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, cint, cstr, flt, formatdate, get_link_to_form, getdate, nowdate
from frappe import get_doc
from frappe.model.document import Document
from frappe.utils import nowdate, nowtime
from erpnext.accounts.utils import (
    cancel_exchange_gain_loss_journal,
    get_account_currency,
    get_balance_on,
    get_outstanding_invoices,
    get_party_types_from_account_type,
)
from frappe import _, utils


class TellerPurchase(Document):
    def onload(self):
        self.set_treasury()
        self.set_branch()
        self.set_price()
        self.set_cost()
        # self.get_active_shift()

    def set_treasury(self):
        treasury_code = frappe.db.get_single_value('Teller Setting', 'treasury_code')
        self.treasury = treasury_code

    def set_branch(self):
        branch = frappe.db.get_single_value('Teller Setting', 'branch')
        self.branch = branch

    def set_price(self):
        price_lst = frappe.db.get_single_value('Teller Setting', 'price_list')
        self.price_list = price_lst

    def set_cost(self):
        cost = frappe.db.get_single_value('Teller Setting', 'cost_center')
        self.cost_center_number = cost

    # def get_active_shift(self):
    #     shift = frappe.db.get_value('OPen Shift', {'active': 1})
    #     user = frappe.db.get_value('OPen Shift', {'active': 1},'current_user')
    #     self.shift =shift
    #     self.teller=user


# transactions section
@frappe.whitelist()
def get_currency(account):
    # currency = frappe.db.get_value("Payment Entry",{"paid_from":account}, "paid_from_account_currency")
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    currency_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency}, "exchange_rate")
    return currency, currency_rate


@frappe.whitelist()
def account_from_balance(paid_from, company=None):
    try:
        balance = get_balance_on(
            account=paid_from,
            company=company,
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _("Error: Unable to fetch account balance.")  # Return a descriptive error message


@frappe.whitelist()
def create_gl_entry(account_from, account_to, usd_amount, currency, currency_rate, voucher_no, credit_amount,
                    credit_in_transaction_currency):
    # Create a new GL Entry document
    gl_entry = get_doc({
        'doctype': 'GL Entry',
        'posting_date': nowdate(),  # Use the current date
        'account': account_from,  # Debit account (From)
        'against': account_to,  # Credit account (To)
        'debit': 0,
        'credit': credit_amount,
        'credit_in_account_currency': usd_amount,
        'debit_in_account_currency': 0,  # Credit amount
        'account_currency': currency,  # Currency
        'exchange_rate': currency_rate,    # Currency rate
        'voucher_type': 'Teller Invoice',
        'voucher_no': voucher_no,
        "credit_in_transaction_currency": credit_in_transaction_currency
    })

    # Insert the document into the database
    gl_entry.insert()
    gl_entry.submit()

    # Create a new GL Entry document for the credit entry
    credit_gl_entry = get_doc({
        'doctype': 'GL Entry',
        'posting_date': nowdate(),  # Use the current date
        'account': account_to,  # Debit account (To)
        "debit": credit_amount,
        "credit": 0,
        'against_account': account_from,  # Credit account (From)
        'debit_in_account_currency': credit_amount,  # Debit amount
        'credit_in_account_currency': 0,  # Credit amount
        # 'account_currency': currency,  # Currency
        # 'exchange_rate': currency_rate,  # Currency rate
        'voucher_type': 'Teller Invoice',  # Voucher Type
        'voucher_no': voucher_no,
        # Voucher No
    })
    credit_gl_entry.insert()
    credit_gl_entry.submit()

    return gl_entry