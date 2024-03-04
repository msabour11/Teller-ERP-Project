# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TellerPurchase(Document):
    def onload(self):
        self.set_treasury()
        self.set_branch()
        self.set_price()
        self.set_cost()
        self.get_active_shift()

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

    def get_active_shift(self):
        shift = frappe.db.get_value('OPen Shift', {'active': 1})
        user = frappe.db.get_value('OPen Shift', {'active': 1},'current_user')
        self.shift =shift
        self.teller=user
#
# import frappe
# from frappe.model.document import Document
#
# class TellerPurchase(Document):
#     def onload(self):
#         self.set_treasury()
#         self.set_branch()
#         self.set_price()
#         self.set_cost()
#         self.get_active_shift()
#
#     def set_treasury(self):
#         treasury_code = frappe.db.get_single_value('Teller Setting', 'treasury_code')
#         self.treasury = treasury_code
#
#     def set_branch(self):
#         branch = frappe.db.get_single_value('Teller Setting', 'branch')
#         self.branch = branch
#
#     def set_price(self):
#         price_lst = frappe.db.get_single_value('Teller Setting', 'price_list')
#         self.price_list = price_lst
#
#     def set_cost(self):
#         cost = frappe.db.get_single_value('Teller Setting', 'cost_center')
#         self.cost_center_number = cost
#
#     def get_active_shift(self):
#         shift = frappe.db.get_value('Open Shift', {'active': 1})
#         user = frappe.db.get_value('Open Shift', {'active': 1}, 'current_user')
#         if shift:
#             self.shift = shift
#             self.teller = user
#         else:
#             frappe.msgprint("No active shift found.")
