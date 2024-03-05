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
		# self.get_active_shift()
		# self.get_printing_roll()

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


