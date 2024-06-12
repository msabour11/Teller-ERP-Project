# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt
import frappe
import json
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
    get_account_currency,
    get_balance_on,
)
from frappe import _, utils

from erpnext.accounts.general_ledger import (
    make_reverse_gl_entries,
)


class TellerInvoice(Document):
    def validate(self):
        # prevent to buy more than three currency

        if len(self.get("transactions")) > 3:
            frappe.throw("Can not Buy more than three currency")

    def before_save(self):
        self.set_customer_invoices()

    # def increase_printing_roll_serial(self):
    #     active_roll = frappe.db.get_all(
    #         "Printing Roll",
    #         filters={"active": 1},
    #         fields=[
    #             "name",
    #             "last_printed_number",
    #             "starting_letters",
    #             "start_count",
    #             "end_count",
    #         ],
    #         order_by="creation desc",
    #     )
    #     roll_name = active_roll[0]["name"]
    #     last_number = active_roll[0]["last_printed_number"]
    #     start_letter = active_roll[0]["starting_letters"]
    #     start_count = active_roll[0]["start_count"]
    #     end_count = active_roll[0]["end_count"]
    #     sales_invoice = frappe.db.get_all("Teller Invoice", filters={"docstatus": 1})
    #     sales_purchase = frappe.db.get_all("Teller Purchase", filters={"docstatus": 1})
    #     if len(sales_invoice) == 0 and len(sales_purchase) == 0:
    #         last_number = start_count
    #         receipt_number = f"{start_letter}-{self.branch_no}-{last_number}"
    #         self.receipt_number = receipt_number
    #         self.current_roll = start_count
    #         show_number = str(last_number)
    #         show_number = len(show_number)
    #         frappe.db.commit()
    #         frappe.db.set_value(
    #             "Printing Roll", roll_name, "last_printed_number", last_number
    #         )
    #         frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)

    #     elif start_count < end_count and last_number < end_count:
    #         last_number += 1
    #         receipt_num = f"{start_letter}-{self.branch_no}-{last_number}"
    #         self.receipt_number = receipt_num
    #         self.current_roll = start_count

    #         show_number = str(last_number)
    #         show_number = len(show_number)

    #         frappe.db.commit()
    #         frappe.db.set_value(
    #             "Printing Roll", roll_name, "last_printed_number", last_number
    #         )
    #         frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)
    #     else:
    #         frappe.throw("No printing roll available please create one")

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
                "show_number",
            ],
            order_by="creation desc",
        )

        roll_name = active_roll[0]["name"]
        last_number = active_roll[0]["last_printed_number"]
        start_letter = active_roll[0]["starting_letters"]
        start_count = active_roll[0]["start_count"]
        end_count = active_roll[0]["end_count"]
        count_show_number = active_roll[0]["show_number"]

        show_number_int = int(count_show_number)  #
        last_number_str = str(last_number)
        last_number_str_len = len(last_number_str)
        diff_cells = show_number_int - last_number_str_len

        sales_invoice = frappe.db.get_all("Teller Invoice", filters={"docstatus": 1})
        sales_purchase = frappe.db.get_all("Teller Purchase", filters={"docstatus": 1})

        if len(sales_invoice) == 0 and len(sales_purchase) == 0:
            last_number = start_count
            last_number_str = str(last_number).zfill(diff_cells + len(str(last_number)))
            receipt_number = f"{start_letter}-{self.branch_no}-{last_number_str}"
            self.receipt_number = receipt_number
            self.current_roll = start_count
            show_number = len(last_number_str)
            frappe.db.commit()
            frappe.db.set_value(
                "Printing Roll", roll_name, "last_printed_number", last_number
            )
            # frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)

        elif start_count < end_count and last_number < end_count:
            last_number += 1
            last_number_str = str(last_number).zfill(diff_cells + len(str(last_number)))
            receipt_number = f"{start_letter}-{self.branch_no}-{last_number_str}"
            self.receipt_number = receipt_number
            self.current_roll = start_count

            show_number = len(last_number_str)

            frappe.db.commit()
            frappe.db.set_value(
                "Printing Roll", roll_name, "last_printed_number", last_number
            )
            # frappe.db.set_value("Printing Roll", roll_name, "show_number", show_number)
        else:
            frappe.throw("No printing roll available, please create one")

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
        self.check_allow_amount()
        self.get_printing_roll()
        self.set_move_number()

    def check_allow_amount(self):
        if self.exceed == 1:
            # frappe.throw("Please check allow amount")
            customer = frappe.get_doc("Customer", self.client)
            customer.custom_is_exceed = True
            customer.save(ignore_permissions=True)

    @frappe.whitelist()
    def customer_total_amount(self):
        if self.client:

            data = frappe.db.sql(
                """SELECT sum(ti.total) as Total FROM `tabTeller Invoice` as ti WHERE ti.client=%s GROUP BY ti.client
        """,
                self.client,
                as_dict=True,
            )
            res = data[0]["Total"]

            return res

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

            # add custom logic or user notifications
            frappe.msgprint(_("Teller Sales document canceled successfully."))

        except Exception as e:
            frappe.throw(_("An error occurred during cancellation: {0}").format(str(e)))

    def set_cost(self):
        cost = frappe.db.get_value("Branch", {"custom_active": 1}, "branch")
        self.cost_center = cost

    def set_closing_date(self):

        shift_closing = frappe.db.get_value("OPen Shift", {"active": 1}, "end_date")
        self.closing_date = shift_closing

    def set_customer_invoices(self):
        duration = self.get_duration()
        duration = int(duration)
        if duration:
            today = nowdate()
            post_duration = add_days(today, -duration)
            invoices = frappe.db.get_list(
                "Teller Invoice",
                fields=["name", "client", "total", "date"],
                filters={
                    "docstatus": 1,
                    "client": self.client,
                    "date": ["between", [post_duration, today]],
                },
            )
            if not invoices:
                frappe.msgprint("No invoices")
            else:
                # Clear existing customer history to avoid duplicates
                self.set("customer_history", [])
                for invoice in invoices:
                    self.append(
                        "customer_history",
                        {
                            "invoice": invoice["name"],
                            "amount": invoice["total"],
                            "posting_date": invoice["date"],
                        },
                    )
        else:
            frappe.msgprint("Please Setup Duration in Teller Settings")

    # get duration from teller settings
    @staticmethod
    def get_duration():
        duration = frappe.db.get_single_value(
            "Teller Setting",
            "duration",
        )
        return duration


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


# get allowed amounts from Teller settings doctype
@frappe.whitelist(allow_guest=True)
def get_allowed_amount():
    allowed_amount = frappe.db.get_single_value("Teller Setting", "allowed_amount")
    return allowed_amount


@frappe.whitelist(allow_guest=True)
def get_customer_total_amount(client_name):

    data = frappe.db.sql(
        """SELECT sum(ti.total) as Total FROM `tabTeller Invoice` as ti WHERE ti.docstatus=1 and ti.client=%s GROUP BY ti.client
""",
        client_name,
        as_dict=True,
    )
    res = 0
    if data:
        res = data[0]["Total"]
        return res
    else:
        res = -1

    return res


# @frappe.whitelist(allow_guest=True)
# def get_customer_invoices(client_name, invoice_name):
#     today = nowdate()
#     post_duration = add_days(today, -6)
#     invoices = frappe.db.get_list(
#         "Teller Invoice",
#         fields=["name", "client", "total", "date"],
#         filters={
#             "docstatus": 1,
#             "client": client_name,
#             "date": ["between", [post_duration, today]],
#         },
#     )
#     if not invoices:
#         frappe.msgprint("No invoices")
#     else:
#         current_doc = frappe.get_doc("Teller Invoice", invoice_name)
#         for invoice in invoices:
#             current_doc.append(
#                 "customer_history",
#                 {
#                     "invoice": invoice["name"],
#                     "amount": invoice["total"],
#                     "posting_date": invoice["date"],
#                 },
#             )
#         current_doc.save()
#         frappe.db.commit()

#     return "Success"
