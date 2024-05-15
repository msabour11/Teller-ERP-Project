# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    # Get columns
    columns = get_columns()
    # Get filters
    filter_account = filters.get("account")
    filter_currency = filters.get("account_currency")
    filter_posting_date = filters.get("posting_date")
	# Get data
    sql_query = """
        SELECT
			 account,
			sum(credit_in_account_currency) as sum_currency_sale,
            sum(debit_in_account_currency) as sum_currency_purchase,
            account_currency,
            sum(credit) as sum_egy_sale,
            sum(debit) as sum_egy_purchase
            
        FROM
            `tabGL Entry`
        WHERE
            account IN (SELECT name FROM `tabAccount` WHERE account_type = 'Cash' and account_currency <>"EGP" )
        and  (%(filter_account)s IS NULL OR account LIKE %(filter_account)s)
        and  (%(filter_currency)s IS NULL OR account_currency LIKE %(filter_currency)s)
        and  (%(filter_posting_date)s IS NULL OR posting_date LIKE %(filter_posting_date)s)
        group by account,account_currency
    """
    # Get parameters
    parameters = {
        "filter_account": filter_account,
        "filter_currency": filter_currency,
        "filter_posting_date": filter_posting_date,
    }

    try:
        data = frappe.db.sql(sql_query, parameters, as_dict=True)
    except frappe.exceptions.SQLError as e:
        frappe.log_error(frappe.get_traceback(), "ERPNext Script Report Error")

        data = []
    # Get chart data
    chart = {
        "data": {
            "labels": [d["account"] for d in data],
            "datasets": [
                {
                    "name": "Total Selling",
                    "values": [d["sum_currency_sale"] for d in data],
                },
                {
                    "name": "Total Purchasing",
                    "values": [d["sum_currency_purchase"] for d in data],
                },
            ],
        },
        "type": "bar",  # Can be "line", "scatter", "pie", "percentage","bar"
        "height": 300,
    }
    # Calculate summary data
    total_sales = sum(d["sum_egy_sale"] for d in data)
    total_purchases = sum(d["sum_egy_purchase"] for d in data)

    report_summary = [
        {
            "value": total_sales + total_purchases,
            "indicator": "Yellow",
            "label": _("Total Currencies"),
        },
        {
            "value": total_sales,
            "indicator": "Blue",
            "label": _("Total Currencies Sales"),
        },
        {
            "value": total_purchases,
            "indicator": "Green",
            "label": _("Total Currencies Purchases"),
        },
    ]
    return columns, data, None, chart, report_summary
    # return {"columns": columns, "result": data, "chart": chart}

# define columns
def get_columns():
    return [
        {
            "label": _("Account"),
            "fieldname": "account",
            "fieldtype": "Link",
            "options": "Account",
            "width": 120,
        },
        {
            "label": _("Total Selling"),
            "fieldname": "sum_currency_sale",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": _("Total Purchasing"),
            "fieldname": "sum_currency_purchase",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": _("Currency"),
            "fieldname": "account_currency",
            "fieldtype": "Link",
            "options": "Currency",
            "width": 150,
        },
        {
            "label": _("Egy Selling"),
            "fieldname": "sum_egy_sale",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": _("Egy Purchasing"),
            "fieldname": "sum_egy_purchase",
            "fieldtype": "Currency",
            "width": 150,
        },
    ]
