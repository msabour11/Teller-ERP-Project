# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import add_days, cint, cstr, flt, formatdate, get_link_to_form, getdate, nowdate



class TellerInvoice(Document):

	def onload(self):
		self.set_treasury()
		self.set_branch()
		self.set_price()
		self.set_cost()

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
	
	def update_item(source_doc, target_doc, source_parent):
	# target_doc.qty = flt(source_doc.qty) - flt(source_doc.delivered_qty)
		# target_doc.stock_qty = target_doc.qty * flt(source_doc.conversion_factor)
		#
		# target_doc.base_amount = target_doc.qty * flt(source_doc.base_rate)
		target_doc.amount = target_doc.qty * flt(source_doc.rate)


