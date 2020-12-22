sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	'sap/m/MessageToast',
	'sap/m/Dialog',
	'sap/m/Button',
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/ui/core/ValueState"
], function (BaseController, JSONModel, formatter, mobileLibrary, MessageToast, Dialog, Button,MessagePopover,MessagePopoverItem,ValueState) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("zwx.sm.charm.urgentchange.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy : false,
				delay : 0,
				title: this.getResourceBundle().getText("detailTitle"),
			});
			this.initViewComponents();
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			
		},
		
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_onObjectMatched : function (oEvent) {
			var sObjectId =  oEvent.getParameter("arguments").objectId;
			var sGUID =  oEvent.getParameter("arguments").guid;
			
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

			this.getModel().metadataLoaded().then( function() {
				var sObjectPath = this.getModel().createKey("WorkPackageSet", {
					ObjectId :  sObjectId,
					GUID : sGUID
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		
		initViewComponents : function(){
			var oView = this.getView();
			oView.attachmentCollection = this.byId("fileupload");
		    oView.attachmentfltr = this.byId("attachmentFilter");
		    oView.trfltr = this.byId("trFilter");
			oView.textList = this.byId("textList");
			oView.scopeTable = this.byId("scopeTable");
			oView.effertTable = this.byId("effertTable");
		},
		

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress : function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},



		

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView : function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			var oView = this.getView();
			oView.urgentChangeDocSetPath = sObjectPath;
			oView.taskListItemPath = "/TaskListItemSet";
			oView.attachmentPath = sObjectPath + "/AttachmentSet";
		    oView.textcountPath = sObjectPath + "/$count";
		    oView.attachmentcountPath = sObjectPath + "/$count";

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path : sObjectPath,
				events: {
					change : this._onBindingChange.bind(this),
					dataRequested : function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		
		readItems: function (oView) {
			var that = this;
			var fnSuccess = function (oResponse) {
		        that.oTaskListItemSet = oResponse.results;
		        that.oView.trfltr.setCount(oResponse.results.length);
		    };
		    
		    var fnError = function (oResponse) {
		    };
		    
			this.getOwnerComponent().getModel().read(oView.taskListItemPath, {
		    	success: fnSuccess,
		    	error: fnError
		    });
			
		},
		
		readTr: function (oView) {
			var that = this;
			var fnSuccess = function (oResponse) {
		        that.oTaskListItemSet = oResponse.results;
//		        that.oView.trfltr.setCount(oResponse.results.length);
		    };
		    
		    var fnError = function (oResponse) {
		    };
		    
			this.getOwnerComponent().getModel().read(oView.taskListItemPath, {
		    	success: fnSuccess,
		    	error: fnError
		    });
			
		},
		
		readAttachments: function (oView) {
			var that = this;
		    if (this.getView().attachmentCollection.getUploadEnabled()) {
		    	oView.attachmentCollection.setUploadUrl(oView.getModel().sServiceUrl + oView.attachmentPath);
		    }
		    
			this.jsonModelAttachments = new JSONModel();
		    oView.attachmentCollection.setModel(this.jsonModelAttachments);
		      
		    //Clear all attachments first
		    oView.attachmentCollection.removeAllItems();
		    oView.attachmentCollection.aItems = [];
		    
		    oView.getModel().read(oView.attachmentPath, {
		    	success: fnSuccess,
		    	error: fnError
		    });
		    
		    var fnSuccess = function (oResponse) {
		        that.oView.attachmentCollection.setBusy(false);
		        that.oAttachmentSet = oResponse.results;
		        //that.setAttachments(that, that.oAttachmentSet);
		    };
		    
		    var fnError = function (oResponse) {
		        that.oView.attachmentCollection.setBusy(false);
		    };

		    oView.attachmentCollection.setBusy(true);
//		    that.setAttachments(that, that.oAttachmentSet.getData());
		    that.oView.attachmentCollection.setBusy(false);
		    
		},
		
		setAttachments: function (controller, AttachmentSet) {
			$.each(AttachmentSet, function (index, value) {
		        AttachmentSet[index].url = value.url;
		        AttachmentSet[index].documentId = "refGuid=guid'" + value.refGUID + "',loioId='" + value.loioId + "',phioId='" + value.phioId +"'";
		        var oFile = value;
		        if (this.extHookUploadCollectionItemData) { // check whether any extension has implemented the hook...
		          this.extHookUploadCollectionItemData(oFile); // ...and call it
		        }
		      });

		      controller.jsonModelAttachments.setData({
		        AttachmentSet: AttachmentSet
		      });

		      controller.oView.attachmentfltr.setCount(AttachmentSet.length);
		    },

		    _onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();
	
				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}
	
				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.ObjectId,
					sObjectDescription = oObject.Description,
					oViewModel = this.getModel("detailView");
					this.getOwnerComponent().oListSelector.selectAListItem(sPath);
					oViewModel.setProperty("/shareSendEmailSubject",
						oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
					oViewModel.setProperty("/shareSendEmailMessage",
						oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectDescription, sObjectId, location.href]));
			},

		_onMetadataLoaded : function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
			}
		},
		
		
		// Attachment upload
		/**
		 * Add Token on http head
		 */
		onChange: function (oEvent) {
		      var oModel = this.getModel();
		      var oUploadCollection = oEvent.getSource();

		      var token = this.sToken || oModel.getSecurityToken();

		      // If filename exceeds 40 characters, trim it
		      var filename = oEvent.getParameter("mParameters").files[0].name;
		      if (filename.length > 40) {
		        var aFilenameParts = filename.split(".");
		        if (aFilenameParts.length === 1) {
		          filename = filename.substring(0, 40);
		        } else {
		          var filenameExtension = aFilenameParts[aFilenameParts.length - 1];
		          aFilenameParts = aFilenameParts.slice(0, aFilenameParts.length - 1);
		          var remainingCharacters = 39 - filenameExtension.length;
		          filename = aFilenameParts.join(".").substring(0, remainingCharacters) + "." + filenameExtension;
		        }
		      }
		      /* eslint-disable JS_ODATA_MANUAL_TOKEN */
		      // Header Token
		      var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
		        name: "x-csrf-token",
		        value: token
		      });
		      /* eslint-enable JS_ODATA_MANUAL_TOKEN */
		      oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

		      // Header Content-Disposition
		      var oCustomerHeaderContentDisp = new sap.m.UploadCollectionParameter({
		        name: "content-disposition",
		        value: "inline; filename=\"" + encodeURIComponent(filename) + "\""
		      });
		      oUploadCollection.addHeaderParameter(oCustomerHeaderContentDisp);
		    },
		    
		    onButtonPress: function(oEvent) {
				var oButton = oEvent.getSource();
				this.byId("actionSheet").openBy(oButton);
			},
			
			onSaveButtonPress: function(oEvent) {
				var oButton = oEvent.getSource();
				this.getOwnerComponent().getModel().read("/WorkPackageSet", {
					success: function (oData, oResponse) {
						console.log(oData.results.length);
					},error: function (oError) {

					}})
			},
			
			onPressAccept: function(oEvent) {
				 MessageToast.show("Accept");
			},

			
		    onUploadComplete: function (oEvent) {
		        var that = this;
		        var fnSuccess = function (oResponse) {

		          var hasDocumentId = function (a, docId) {
		            for (var i = 0, len = a.length; i < len; i++) {
		              if (decodeURI(a[i].documentId) === docId) {
		                return true;
		              }
		            }
		          };

		          var addedAttachments = [];

		          $.each(oResponse.results, function (index, value) {
		            oResponse.results[index].url = value.__metadata.media_src;
		            oResponse.results[index].documentId = "refGuid=GUID'" + value.refGuid + "',loioId='" + value.loioId + "',phioId='" + value.phioId +
		              "'";

		            if (hasDocumentId(that.oAttachmentSet, oResponse.results[index].documentId)) {
		              // nothing to check
		            } else {
		              addedAttachments.push(oResponse.results[index]);
		            }

		          });

		          $.each(addedAttachments, function (index, value) {
		            that.addNewUploadCollectionItem(that.getView().attachmentCollection, value);
		          });

		          that.getView().attachmentfltr.setCount(that.oAttachmentSet.length);
		          that.getView().attachmentCollection.setBusy(false);

		        };

		        var fnError = function (oResponse) {
		          that.getView().attachmentCollection.setBusy(false);
		        };

		        if (oEvent.getParameters().getParameter("status") !== 201) // Bad request
		        {
		          var errorMsg = $($.parseXML(oEvent.getParameters().getParameter("responseRaw"))).find("message").text();
		          that.getView().attachmentCollection.setBusy(false);
		          Util.showErrorMessageBox(that.bundle.getText("ERROR_CONTACT_SYSADMIN"), that.bundle.getText("ATTACHMENT_UPLOAD_ERROR"), errorMsg);

		        } else {

		          this.getView().attachmentCollection.setBusy(true);
		          this.getView().getModel().read(this.getView().attachmentPath, {
		            success: fnSuccess,
		            error: fnError
		          });
		          MessageToast.show(this.bundle.getText("ATTACHMENT_UPLOAD_SUCCESS"));
		        }
		      },
		      
		      onAddText : function(oEvent){
		    	  var that = this;
				if (!this._selectNotificationDialog) {
					this._selectNotificationDialog = sap.ui.xmlfragment(
							"zwx.sm.charm.urgentchange.view.NotificationDialog", this);
					this.getView().addDependent(this._selectNotificationDialog);
				}
//					this.getView().setModel(new JSONModel(obj), "NotificationListSet");
				this._selectNotificationDialog.open();
		      },
		      
		      handleNotificationSelect: function(oEvent){
		    	  var sText = sap.ui.getCore().byId('textAreaWithBinding').getValue(); 
		    	  console.log(sText);
		    	  
		    	  this._selectNotificationDialog.close();
		    	  sap.ui.getCore().byId('textAreaWithBinding').setValue(""); 
			  },
				
				handleNotificationCancelDialog : function() {
					this.getView().getModel().resetChanges();
					this._selectNotificationDialog.close();
				},
				
				onMessagesButtonPress: function(oEvent) {
					var oMessagesButton = oEvent.getSource();

					if (!this._messagePopover) {
						this._messagePopover = new MessagePopover({
							items: {
								path: "message>/",
								template: new MessagePopoverItem({
									description: "{message>description}",
									type: "{message>type}",
									title: "{message>message}"
								})
							}
						});
						oMessagesButton.addDependent(this._messagePopover);
					}
					this._messagePopover.toggle(oMessagesButton);
				},
				
				onSaveButtonTestPress: function(oEvent) {
					var titleModel = this.getView().getModel("titleInfo");
					titleModel.setProperty("/Type", "Good");
//					var oButton = oEvent.getSource();
//					var oModel = this.getOwnerComponent().getModel();
//					var result = oModel.getData();
//					oModel.setHeaders({
//					    "content-type": "application/json;charset=utf-8"
//					});
//					var oEntry = {};
//					oEntry.ObjectId = "8000019216";
//					oEntry.Description = "Test Create";
//					console.log(oEntry);
//					oModel.update("/WorkPackageSet", oEntry, {
//						
//						merge: true,
//						success: function (oData, oResponse) {
//							 MessageToast.show("Create successful");
//						},
//						error: function (oError) {
//							MessageToast.show("fail");
//						}
//					})
					
//					var mParams = {};
//					  mParams.success = function () {
//						  MessageToast.show("Create successful");
//						  console.log("Create successful");
//					  };
//
//					  oModel.submitChanges(mParams);
				}
	});

});