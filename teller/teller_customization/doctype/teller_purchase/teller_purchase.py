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
from erpnext.accounts.general_ledger import (
    make_gl_entries,
    make_reverse_gl_entries,
    process_gl_map,
    make_entry,
)
from frappe.utils import nowdate, now
from erpnext.accounts.general_ledger import make_entry


class TellerPurchase(Document):
    def before_submit(self):
        self.set_move_number()
        # self.get_printing_roll()

    def on_save(self):
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

    def on_cancel(self):
        self.ignore_linked_doctypes = (
            "GL Entry",
            "Stock Ledger Entry",
            "Payment Ledger Entry",
            "Repost Payment Ledger",
            "Repost Payment Ledger Items",
            "Repost Accounting Ledger",
            "Repost Accounting Ledger Items",
            "Unreconcile Payment",
            "Unreconcile Payment Entries",
        )

        try:
            # Reverse GL Entries

            make_reverse_gl_entries(voucher_type=self.doctype, voucher_no=self.name)

            # Optionally, add custom logic or user notifications
            frappe.msgprint(_("Teller Purchase document canceled successfully."))
            print("Teller Purchase document canceled successfully.")

        except Exception as e:
            frappe.throw(_("An error occurred during cancellation: {0}").format(str(e)))

    def set_move_number(self):
        # Fetch the last submitted Teller Invoice
        last_invoice = frappe.db.get("Teller Purchase", {"docstatus": 1})

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

    def get_printing_roll(self):

        active_roll = frappe.db.get_all(
            "Printing Roll",
            filters={"active": 1},
            fields=[
                "name",
                "last_printed_number",
                "starting_letters",
                "start_count",
                "end_count",
            ],
            order_by="creation desc",
        )
        roll_name = active_roll[0]["name"]
        last_number = active_roll[0]["last_printed_number"]
        start_letter = active_roll[0]["starting_letters"]
        start_count = active_roll[0]["start_count"]
        end_count = active_roll[0]["end_count"]
        sales_invoice = frappe.db.get_all("Teller Invoice", filters={"docstatus": 1})
        sales_purchase = frappe.db.get_all("Teller Purchase", filters={"docstatus": 1})
        if len(sales_invoice) == 0 and len(sales_purchase) == 0:
            last_number = start_count
            receipt_number = f"{start_letter}-{self.branch_no}-{last_number}"
            self.receipt_number = receipt_number
            self.current_roll = start_count
            show_number = str(last_number)
            show_number = len(show_number)
            frappe.db.commit()
            frappe.db.set_value(
                "Printing Roll", roll_name, "last_printed_number", last_number
            )
            frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)

        elif start_count < end_count and last_number < end_count:
            last_number += 1
            receipt_num = f"{start_letter}-{self.branch_no}-{last_number}"
            self.receipt_number = receipt_num
            self.current_roll = start_count

            show_number = str(last_number)
            show_number = len(show_number)

            frappe.db.commit()
            frappe.db.set_value(
                "Printing Roll", roll_name, "last_printed_number", last_number
            )
            frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)
        else:
            frappe.throw("No printing roll available please create one")


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


@frappe.whitelist(allow_guest=True)
def get_printing_roll1():
    sales_invoice = frappe.db.get_all("Teller Invoice", filters={"docstatus": 1})
    sales_purchase = frappe.db.get_all("Teller Purchase", filters={"docstatus": 1})

    # check_count
    active_roll = frappe.db.get_all(
        "Printing Roll",
        filters={"active": 1},
        fields=[
            "name",
            "last_printed_number",
            "starting_letters",
            "start_count",
            "end_count",
        ],
        order_by="creation desc",
    )
    roll_name = active_roll[0]["name"]
    last_number = active_roll[0]["last_printed_number"]
    start_letter = active_roll[0]["starting_letters"]
    start_count = active_roll[0]["start_count"]
    end_count = active_roll[0]["end_count"]
    return len(sales_purchase)
