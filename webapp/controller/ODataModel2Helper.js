sap.ui.define([
	'sap/ui/base/Object'
], function(Object) {
	"use strict";

	var oDataModel;

	var oDataModel2Helper = Object.extend("zwx.sm.charm.urgentchange.controller.ODataModel2Helper", {
		createODataModel: function() {
			var local = false;
			var serviceUrl = "/sap/opu/odata/sap/zwanhua_test_srv/";
			if (window.location.hostname == "localhost") {
				serviceUrl = "proxy" + serviceUrl;
				local = true;
			} else if (window.location.hostname == "10.0.2.2") { // For VirtualBox
				serviceUrl = "proxy" + serviceUrl;
				local = true;
			}

			if (local) {
				var h = {
//					"AUTHORIZATION": "BASIC STMXNZYZMJP6YXEXMLDTWA==",
					"X-CSRF-Token": "Fetch"
				};
				var oModel = new sap.ui.model.odata.v2.ODataModel({
					serviceUrl: serviceUrl,
					user: "I317632",
					password: "zaq12WSX",
					headers: h,
					withCredentials: true,
					useBatch: false
				});

				return oModel;
			} else {
				var h = {
					"X-CSRF-Token": "Fetch"
				};
				var oModel = new sap.ui.model.odata.v2.ODataModel({
					serviceUrl: serviceUrl,
					headers: h,
					useBatch: true
				});

				return oModel;
			}
		},
		
		getODataModel: function() {
			if (!oDataModel) {
				oDataModel = this.createODataModel();
			}
			return oDataModel;
		}
	});

	return oDataModel2Helper;
});
