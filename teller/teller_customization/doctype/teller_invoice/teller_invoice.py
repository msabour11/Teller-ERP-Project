# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import add_days, cint, cstr, flt, formatdate, get_link_to_form, getdate, nowdate



class TellerInvoice(Document):
	# def validate(self):
	# 	self.calculate_total_amount()
	#
	# def calculate_total_amount(self):
	# 	amount = 0
	# 	for item in self.items:
	# 		amount += item.qty*item.rate
	# 	self.amount = amount
	# 	frappe.msgprint(amount)
	# 	print(amount)
	def update_item(source_doc, target_doc, source_parent):
		# target_doc.qty = flt(source_doc.qty) - flt(source_doc.delivered_qty)
		# target_doc.stock_qty = target_doc.qty * flt(source_doc.conversion_factor)
		#
		# target_doc.base_amount = target_doc.qty * flt(source_doc.base_rate)
		target_doc.amount = target_doc.qty * flt(source_doc.rate)


