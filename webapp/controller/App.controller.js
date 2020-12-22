sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"zwx/sm/charm/urgentchange/controller/ODataModel2Helper"
], function (BaseController, JSONModel, ODataModel2Helper) {
	"use strict";

	return BaseController.extend("zwx.sm.charm.urgentchange.controller.App", {

		onInit : function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				layout : "OneColumn",
				previousLayout : "",
				actionButtonsInfo : {
					midColumn : {
						fullScreen : false
					}
				}
			});
			this.setModel(oViewModel, "appView");
			this.getUserInfo();

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};
			
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

		},
		
		getUserInfo : function(){
			var userInfoModel = new JSONModel();
			this.getOwnerComponent().setModel(userInfoModel, "userInfo");
			userInfoModel.loadData("/sap/bc/ui2/start_up?depth=0");
			userInfoModel.attachRequestCompleted(function onCompleted(oEvent) {
				if (oEvent.getParameter("success")) {
					this.setData({"json" : this.getJSON(), "status": "Success"}, true);
				} else {
					var msg = oEvent.getParameter("errorObject").textStatus;
					if (msg) {
						this.setData("status", msg);
					} else {
						this.setData("status", "Unknown error retrieving user info");
					}
			    }
			});
		}
	});
});