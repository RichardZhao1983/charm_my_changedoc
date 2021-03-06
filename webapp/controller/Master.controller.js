sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter",
	'sap/m/MessageToast'
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter,MessageToast) {
	"use strict";

	return BaseController.extend("zwx.sm.charm.urgentchange.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit : function () {
			this.oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView()));
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

//			this.oSemanticPage = this.byId("masterPage");
			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter : [],
				aSearch : []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.initFilterView();
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},
		
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}
			
			var startDate = this.byId("createDateRange").getDateValue();
			var endDate = this.byId("createDateRange").getSecondDateValue();
			this._oListFilterState.aSearch = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				var oFilter1 = new Filter("ObjectIdOrCountryCode", FilterOperator.Contains, sQuery);
				this._oListFilterState.aSearch.push(oFilter1);
			} 
			
			if (startDate != null && endDate!= null) {
				var oFilter2 = new Filter({path: "CreatedDate",  operator: FilterOperator.BT, value1: startDate, value2: endDate});
				this._oListFilterState.aSearch.push(oFilter2);
			} 
			this._applyFilterSearch();
		},
		
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch : function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			if(aFilters.length > 1){
				aFilters = new Filter(aFilters, true);
			}
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar : function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings : function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "zwx.sm.charm.urgentchange.view.ViewSettingsDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog : function (oEvent) {

			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange : function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed : function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader : function (oGroup) {
			return new GroupHeaderListItem({
				title : oGroup.text,
				upperCase : false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_createViewModel : function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "ObjectId",
				groupBy: "None"
			});
		},

		_onMasterMatched :  function() {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
			this._applyFilter();
		},
		
		

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail : function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				guid : oItem.getBindingContext().getProperty("GUID")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},
		
		showFooter : function() {
			this.oSemanticPage.setShowFooter(!this.oSemanticPage.getShowFooter());
		},
		
		onFilterButtonPress : function() {		
			if (!this.filterDialog) {
				this.filterDialog = sap.ui.xmlfragment(
						"zwx.sm.charm.urgentchange.view.FilterDialog", this);
				this.getView().addDependent(this.filterDialog);
			}
			this.filterDialog.open();
		},
		
		_openDialog : function (sName, sPage, fInit) {

			// creates dialog list if not yet created
			if (!this._oDialogs) {
				this._oDialogs = {};
			}

			// creates requested dialog if not yet created
			if (!this._oDialogs[sName]) {
				Fragment.load({
					name: "zwx.sm.charm.urgentchange.view" + sName,
					controller: this
				}).then(function(oDialog){
					this._oDialogs[sName] = oDialog;
					this.getView().addDependent(this._oDialogs[sName]);
					if (fInit) {
						fInit(this._oDialogs[sName]);
					}
					// opens the dialog
					this._oDialogs[sName].open(sPage);
				}.bind(this));
			} else {
				// opens the requested dialog
				this._oDialogs[sName].open(sPage);
			}
		},
		
		_applyFilter : function() {
			var currentUser = "currentUser";
			var oFilterCreatedBy = new Filter("CreatedBy",FilterOperator.EQ, currentUser),
			 	oFilterSolutionArchitect = new Filter("SolutionArchitect",FilterOperator.EQ, currentUser),
			 	oFilterPOP = new Filter("POP",FilterOperator.EQ, currentUser),
			 	oFilterCoordinator = new Filter("Coordinator",FilterOperator.EQ, currentUser);
			
			this._oListFilterState.aFilter = [];
			var filterViewModel = this.getModel("filterView");
			if(filterViewModel != null){
				if(filterViewModel.getData().CreatedBy === true){
					this._oListFilterState.aFilter.push(oFilterCreatedBy);
				}
				if(filterViewModel.getData().SolutionArchitect === true){
					this._oListFilterState.aFilter.push(oFilterSolutionArchitect);
				}
				if(filterViewModel.getData().POP === true){
					this._oListFilterState.aFilter.push(oFilterPOP);
				}
				if(filterViewModel.getData().Coordinator === true){
					this._oListFilterState.aFilter.push(oFilterCoordinator);
				}
			}
			this._applyFilterSearch();
		},
		
		initFilterView :  function() {
			var filterViewModel = new JSONModel({
				CreatedBy : true,
				SolutionArchitect : true,
				POP : true,
				Coordinator : true,
			});
			this.setModel(filterViewModel, "filterView");
		},
		
		handleConfirm: function (oEvent) {
			if (oEvent.getParameters().filterString) {
				MessageToast.show(oEvent.getParameters().filterString);
			}
			this._applyFilter();
		},
		
		onCreateDateSearchButtonPress: function (oEvent) {
			var startDate = this.byId("createDateRange").getDateValue();
			var endDate = this.byId("createDateRange").getSecondDateValue();
			MessageToast.show(startDate+"  "+endDate);
			if (startDate != null && endDate!= null) {
				var oFilter3 = new Filter({path: "CreatedDate",  operator: FilterOperator.BT, value1: startDate, value2: endDate});
				this._oListFilterState.aSearch = [oFilter3];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();
		}
		
	});

});