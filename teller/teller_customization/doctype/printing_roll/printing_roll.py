# Copyright (c) 2024, Mohamed AbdElsabour and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from frappe.utils import nowdate


class PrintingRoll(Document):

    def before_save(self):

        self.last_printed_number = self.start_count
