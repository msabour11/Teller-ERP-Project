// Copyright (c) 2024, Mohamed AbdElsabour and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sales Entry", {
	refresh(frm) {

	},
});
frappe.ui.form.on("Entry Child",{
	paid_from:function (frm,cdt,cdn){
		var row=locals[cdt][cdn]
		if (row.paid_from && row.usd_amount && row.received_amount && row.paid_to)
		{
			frappe.call({
				method:"teller.teller_customization.doctype.sales_entry.sales_entry.get_currency",
				args:{
					account:row.paid_from
				},
				callback:function (r){
					console.log(r.message[0])
					let curr=r.message[0]
					let currency_rate=r.message[1]
					frappe.model.set_value(cdt,cdn,"currency",curr)
					frappe.model.set_value(cdt,cdn,"rate",currency_rate)
					frappe.call({
						method:"teller.teller_customization.doctype.sales_entry.sales_entry.create_payment_entry",
						args:{
							account:row.paid_from,
							usd_amount:row.usd_amount,
							recieved_amount:row.received_amount,
							paid_to:row.paid_to

						},
						callback:function (r)
						{
							console.log(r.message)
						}
					})
				}
			})

		}
	}
})
