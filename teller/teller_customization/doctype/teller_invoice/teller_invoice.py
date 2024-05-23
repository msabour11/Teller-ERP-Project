# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt
import frappe
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
    def validate(self):
        # prevent to buy more than three currency

        if len(self.get("transactions")) > 3:
            frappe.throw("Can not Buy more than three currency")

    def get_printing_roll(self):
        active_roll = frappe.db.get("Printing Roll", {"active": 1})
        roll_name = active_roll["name"]
        last_number = active_roll["last_printed_number"]
        start_letter = active_roll["starting_letters"]
        start_count = active_roll["start_count"]

        # start_count
        last_number += 1
        receipt_num = f"{start_letter}-{self.branch_no}-{last_number}"
        self.receipt_number = receipt_num
        self.current_roll = start_count
        # current_roll = active_roll['name']
        # self.current_roll = current_roll
        show_number = str(last_number)
        show_number = len(show_number)

        frappe.db.commit()
        frappe.db.set_value(
            "Printing Roll", roll_name, "last_printed_number", last_number
        )
        frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)

    # def set_move_number(self):

    #     last_invoice = frappe.db.get("Teller Invoice", {"docstatus": 1})
    #     if last_invoice is not None:

    #         last_move = last_invoice["movement_number"]
    #         last_move_num = last_move.split("-")[1]
    #         last_move_num = int(last_move_num)
    #         last_move_num += 1
    #         move = f"{self.branch_no}-{last_move_num}"

    #     else:
    #         move = f"{self.branch_no}-{1}"

    #     self.movement_number = move
    #     frappe.db.commit()

    def set_move_number(self):
        # Fetch the last submitted Teller Invoice
        last_invoice = frappe.db.get("Teller Invoice", {"docstatus": 1})

        # Check if the last_invoice exists and has the expected field
        if last_invoice is not None and "movement_number" in last_invoice:
            # Get the last movement number and increment it
            last_move = last_invoice["movement_number"]
            try:
                last_move_num = int(last_move.split("-")[1])
            except (IndexError, ValueError):
                frappe.throw(
                    _("Invalid format for movement number in the last invoice.")
                )

            last_move_num += 1
            move = f"{self.branch_no}-{last_move_num}"
        else:
            # If no last invoice, start the movement number from 1
            move = f"{self.branch_no}-1"

        # Set the new movement number
        self.movement_number = move

        # Commit the changes to the database
        frappe.db.commit()

    def before_submit(self):
        self.get_printing_roll()
        self.set_move_number()

    def on_submit(self):

        # create Gl entry on submit

        for row in self.get("transactions"):
            if row.paid_from and self.egy and row.usd_amount and row.received_amount:
                account_from = get_doc(
                    {
                        "doctype": "GL Entry",
                        "posting_date": nowdate(),
                        "account": row.paid_from,
                        "debit": 0,
                        "credit": row.total_amount,
                        "credit_in_account_currency": row.usd_amount,
                        "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {row.paid_from} to {self.egy}",
                        "voucher_type": "Teller Invoice",
                        "voucher_no": self.name,
                        "against": self.egy,
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
                        "debit": row.total_amount,
                        "credit": 0,
                        "debit_in_account_currency": row.total_amount,
                        "credit_in_account_currency": 0,
                        "remarks": f"Amount {row.currency} {row.usd_amount} transferred from {row.paid_from} to {self.egy}",
                        "voucher_type": "Teller Invoice",
                        "voucher_no": self.name,
                        "against": row.paid_from,
                        # "cost_center": row.cost_center,
                        # "project": row.project,
                        "debit_in_transaction_currency": row.total_amount,
                        "credit_in_transaction_currency": 0,
                    }
                )
                account_to.insert(ignore_permissions=True).submit()
                if account_from and account_to:
                    frappe.msgprint(
                        _("Teller Invoice created successfully with  Total {0}").format(
                            self.total
                        )
                    )
                else:
                    frappe.msgprint(
                        _("Failed to create GL Entry for row {0}").format(row.idx)
                    )

            else:
                frappe.throw(
                    _("You must enter all required fields in row {0}").format(row.idx)
                )

    def before_save(self):
        pass

    def set_cost(self):
        cost = frappe.db.get_value("Branch", {"custom_active": 1}, "branch")
        self.cost_center = cost

    def set_closing_date(self):

        shift_closing = frappe.db.get_value("OPen Shift", {"active": 1}, "end_date")
        self.closing_date = shift_closing


# get currency and exchange rate associated with each account
@frappe.whitelist(allow_guest=True)
def get_currency(account):
    currency = frappe.db.get_value("Account", {"name": account}, "account_currency")
    selling_rate = frappe.db.get_value(
        "Currency Exchange", {"from_currency": currency}, "custom_selling_exchange_rate"
    )
    special_selling_rate = frappe.db.get_value(
        "Currency Exchange", {"from_currency": currency}, "custom_special_selling"
    )
    return currency, selling_rate, special_selling_rate


@frappe.whitelist()
def account_from_balance(paid_from):
    try:
        balance = get_balance_on(
            account=paid_from,
            # company=company,
        )
        return balance
    except Exception as e:
        error_message = f"Error fetching account balance: {str(e)}"
        frappe.log_error(error_message)
        return _(
            "Error: Unable to fetch account balance."
        )  # Return a descriptive error message


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
        return _(
            "Error: Unable to fetch account balance."
        )  # Return a descriptive error message


@frappe.whitelist(allow_guest=True)
def get_printing_roll():
    active_roll = frappe.db.get_list(
        "Printing Roll", {"active": 1}, ["name", "last_printed_number"]
    )
    if active_roll:
        return active_roll[0]["name"], active_roll[0]["last_printed_number"]
    else:
        return None, None


@frappe.whitelist(allow_guest=True)
def get_current_shift():
    branch = frappe.db.get_value("Branch", {"custom_active": 1}, "branch")
    return branch
