# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import (
    add_days,
    cint,
    cstr,
    flt,
    formatdate,
    get_link_to_form,
    getdate,
    nowdate,
)
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
    def before_submit(self):
        self.set_move_number()
        self.get_printing_roll()

    def on_submit(self):

        for row in self.get("transactions"):
            if row.paid_from and self.egy and row.usd_amount and row.received_amount:
                account_from = get_doc(
                    {
                        "doctype": "GL Entry",
                        "posting_date": nowdate(),
                        "account": row.paid_from,
                        "debit": row.total_amount,
                        "credit": 0,
                        "credit_in_account_currency": 0,
                        "debit_in_account_currency": row.usd_amount,
                        "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {self.egy} to {row.paid_from}",
                        "voucher_type": "Teller Purchase",
                        "voucher_no": self.name,
                        "against": self.egy,
                        "account_currency": row.currency,
                        # "cost_center": row.cost_center,
                        # "project": row.project,
                        "credit_in_transaction_currency": row.total_amount,
                    }
                )
                account_from.insert(ignore_permissions=True).submit()

                account_to = get_doc(
                    {
                        "doctype": "GL Entry",
                        "posting_date": nowdate(),
                        "account": self.egy,
                        "debit": 0,
                        "credit": row.total_amount,
                        "debit_in_account_currency": 0,
                        "credit_in_account_currency": row.total_amount,
                        "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {self.egy} to {row.paid_from}",
                        "voucher_type": "Teller Purchase",
                        "voucher_no": self.name,
                        "against": row.paid_from,
                        # "cost_center": row.cost_center,
                        # "project": row.project,
                        "debit_in_transaction_currency": 0,
                        "credit_in_transaction_currency": row.total_amount,
                    }
                )
                account_to.insert(ignore_permissions=True).submit()
                if account_from and account_to:

                    frappe.msgprint(
                        _("Teller Invoice created successfully with  Total {0}").format(
                            self.egy_balance
                        )
                    )
                else:
                    frappe.msgprint(
                        _("Failed to create GL Entry for row {0}").format(row.idx)
                    )

            else:
                frappe.throw(
                    _("You must enter all required fFields in row {0}").format(row.idx)
                )

    def onload(self):

        pass

    # def set_current_printing_roll(self):
    #     active_roll = frappe.db.get("Printing Roll", {"active": 1})
    #     last_printed_number = active_roll['last_printed_number']

    def set_move_number(self):

        last_move = frappe.db.get("Teller Purchase", {"docstatus": 1})
        last_move = last_move["movement_number"]
        print(last_move)

        if last_move and "-" in last_move:
            last_move_num = last_move.split("-")[1]
            last_move_num = int(last_move_num)
            last_move_num += 1
        else:
            last_move_num = 1

        move = f"{self.branch_no}-{last_move_num}"
        self.movement_number = move
        frappe.db.commit()
        print(self.movement_number)

    def get_printing_roll(self):
        # check_count
        active_roll = frappe.db.get("Printing Roll", {"active": 1})
        roll_name = active_roll["name"]
        last_number = active_roll["last_printed_number"]
        start_letter = active_roll["starting_letters"]

        last_number += 1
        receipt_num = f"{start_letter}-{self.branch_no}-{last_number}"
        self.receipt_number = receipt_num
        self.current_roll = last_number

        show_number = str(last_number)
        show_number = len(show_number)

        frappe.db.commit()
        frappe.db.set_value(
            "Printing Roll", roll_name, "last_printed_number", last_number
        )
        frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)


# get currency and currency rate from each account
@frappe.whitelist()
def get_currency(account):
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    currency_rate = frappe.db.get_value(
        "Currency Exchange", {"from_currency": currency}, "exchange_rate"
    )
    special_purchase_rate = frappe.db.get_value(
        "Currency Exchange", {"from_currency": currency}, "custom_special_purchasing"
    )
    return currency, currency_rate, special_purchase_rate


# Get the  Balance from the source account
@frappe.whitelist()
def account_from_balance(paid_from):
    try:
        balance = get_balance_on(
            account=paid_from,
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _("Error: Unable to fetch account balance.")


@frappe.whitelist()
def account_to_balance(paid_to):
    try:
        balance = get_balance_on(
            account=paid_to,
            # company=company,
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _("Error: Unable to fetch account balance.")
