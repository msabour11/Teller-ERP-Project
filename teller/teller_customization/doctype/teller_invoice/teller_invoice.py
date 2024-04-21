# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt
import frappe
from frappe.utils import add_days, cint, cstr, flt, formatdate, get_link_to_form, getdate, nowdate
from frappe import get_doc
from frappe.model.document import Document
from frappe.utils import nowdate
from erpnext.accounts.utils import (
    cancel_exchange_gain_loss_journal,
    get_account_currency,
    get_balance_on,
    get_outstanding_invoices,
    get_party_types_from_account_type,
)
from frappe import _, utils
from erpnext.setup.utils import get_exchange_rate


class TellerInvoice(Document):
    def on_submit(self):
        # create Gl entry on submit

        for row in self.get("transactions"):
            if row.paid_from and row.paid_to and row.usd_amount and row.received_amount:
                account_from = get_doc({
                    "doctype": "GL Entry",
                    "posting_date": nowdate(),
                    "account": row.paid_from,
                    "debit": 0,
                    "credit": row.total_amount,
                    "credit_in_account_currency": row.usd_amount,
                    "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {row.paid_from} to {row.paid_to}",
                    "voucher_type": "Teller Invoice",
                    "voucher_no": self.name,
                    "against": row.paid_to,
                    # "cost_center": row.cost_center,
                    # "project": row.project,
                    "credit_in_transaction_currency": row.total_amount
                })
                account_from.insert(ignore_permissions=True).submit()

                account_to = get_doc({
                    "doctype": "GL Entry",
                    "posting_date": nowdate(),
                    "account": row.paid_to,
                    "debit": row.total_amount,
                    "credit": 0,
                    "debit_in_account_currency": row.total_amount,
                    "credit_in_account_currency": 0,
                    "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {row.paid_from} to {row.paid_to}",
                    "voucher_type": "Teller Invoice",
                    "voucher_no": self.name,
                    "against": row.paid_from,
                    # "cost_center": row.cost_center,
                    # "project": row.project,
                    "debit_in_transaction_currency": row.total_amount,
                    "credit_in_transaction_currency": 0
                })
                account_to.insert(ignore_permissions=True).submit()
                if account_from and account_to:
                    frappe.msgprint(_("GL Entry created successfully for row {0}").format(row.idx))
                else:
                    frappe.msgprint(_("Failed to create GL Entry for row {0}").format(row.idx))


            else:
                frappe.throw(_("You must enter all required fields in row {0}").format(row.idx))

    def onload(self):
        # self.set_treasury()
        # self.set_branch()
        # self.set_price()
        # self.set_cost()
        # self.get_active_shift()
        # self.get_printing_roll()
        pass

    def set_treasury(self):
        treasury_code = frappe.db.get_single_value('Teller Setting', 'treasury_code')
        self.treasury_code = treasury_code

    def set_branch(self):
        branch = frappe.db.get_single_value('Teller Setting', 'branch')
        self.branch_number = branch

    def set_price(self):
        price_lst = frappe.db.get_single_value('Teller Setting', 'price_list')
        self.price_list = price_lst

    def set_cost(self):
        cost = frappe.db.get_single_value('Teller Setting', 'cost_center')
        self.cost_center_number = cost

    def get_active_shift(self):
        shift = frappe.db.get_value('OPen Shift', {'active': 1})
        user = frappe.db.get_value('OPen Shift', {'active': 1}, 'current_user')
        self.shift = shift
        self.teller = user

    # def get_printing_roll(self):
    # 	roll_code = frappe.db.get_value('Printing Roll',{'active':1},)
    # 	self.current_roll = roll_code
    # 	last_printed_no = frappe.db.get_value('Printing Roll',{'active':1},'last_printed_number')
    # 	lettres = frappe.db.get_value('Printing Roll',{'active':1},'starting_letters')
    # 	frappe.msgprint(roll_code)
    #
    # 	last_printed_no += 1
    # 	recp=f"{lettres}-{last_printed_no}"
    # 	self.receipt_number = recp


# get currency and exchange rate associated with each account
@frappe.whitelist(allow_guest=True)
def get_currency(account):
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    selling_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency}, "custom_selling_exchange_rate")
    special_selling_rate = frappe.db.get_value("Currency Exchange", {"from_currency": currency},
                                               "custom_special_selling")
    return currency, selling_rate, special_selling_rate



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
def account_to_balance(paid_to, company):
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

