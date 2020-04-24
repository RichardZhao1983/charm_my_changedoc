//sap.ui.define([
//	'sap/ui/base/Object',
//	'sap/ui/model/json/JSONModel'
//], function(Object, JSONModel) {
//	"use strict";
//
//	var that;
//
//	var urgentChangeDoc = Object.extend("zwx.sm.charm.urgentchange.controller.UrgentChangeDoc", {
//		constructor: function(oModel, jModel) {
//			that = this;
//			this._oModel = oModel;
//			this._deferred = jQuery.Deferred();
//			
////			this._objectId = '';
////			this._objectType= '';
////			this._description = '';
////			this._changedAt= '';
////			this._postingDate= '';
////			this._status= '';
//			
//			this._urgentChangeDocList = [];
//			
//
//			this._oModel.read("/UrgentChangeDocSet", {
//				success: function(oData, response) {
//					var urgentChangeDocList = oData.results;
//					if (urgentChangeDocList && urgentChangeDocList.length > 0) {
//						for (var i in list) {
//							that._objectId = urgentChangeDocList[i].ObjectId;
//							that._objectType = urgentChangeDocList[i].ObjectType;
//							that._description = urgentChangeDocList[i].Description;
//							that._changedAt = urgentChangeDocList[i].ChangedAt;
//							that._postingDate = urgentChangeDocList[i].PostingDate;
//							that._status = urgentChangeDocList[i].Status;
//							this._urgentChangeDocList;
//						}
//					}
//					that._deferred.resolve();
//				}
//			});
//			this._promise = this._deferred.promise();
//		},
//		
//		getPromise: function() {
//			return this._promise;
//		},
//
//		getUrgentChangeDocList: function() {
//			return {
//				ObjectId: that.objectId,
//				ObjectType: that._objectType,
//				Description: that._description,
//				ChangedAt : that._changedAt,
//				PostingDate : that._postingDate ,
//				Status : that._status,
//			};
//		}
//	});
//	
//	return urgentChangeDoc;
//});
