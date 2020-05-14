sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"SD/SOCredit/model/models",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (UIComponent, Device, models, MessageToast, Filter, FilterOperator) {
	"use strict";

	return UIComponent.extend("SD.SOCredit.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(models.createLocalModel());
			this._JSONModel = this.getModel();
			var that = this;
			this.getModel("userAttributes").attachRequestCompleted(function (oEvent) {
				var userAttributes = this.getData();
				that._JSONModel.setProperty("/SOCredit/APPLICANT", userAttributes.name);
				that.getBlockDoc(that);
				// 获取员工信息
				var sPath = "/EMPLOYEES" + "('" + userAttributes.name + "')";
				var mParameters = {
					success: function (oData) {
						that._JSONModel.setProperty("/SOCredit/EMAIL", oData.EMAIL);
						that._JSONModel.setProperty("/SOCredit/APPLICANTNAME", oData.FULLNAME); //申请人姓名
					}
				};
				that.getModel("GetEMPLOYEES").read(sPath, mParameters);
			});
		},
		getBlockDoc: function (that) {
			var language = sap.ui.getCore().getConfiguration().getLanguage();
			switch (language) {
			case "zh-Hant":
			case "zh-TW":
				language = "zh_CN_F";
				break;
			case "zh-Hans":
			case "zh-CN":
				language = "zh_CN";
				break;
			case "EN":
			case "en":
				language = "en_GB";
				break;
			default:
				break;
			}
			var oFilter1 = new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, "6310");
			var oFilter2 = new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, "VE");
			var oFilter3 = new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, language);
			var aFilters = [oFilter1, oFilter2, oFilter3];
			var mParameters = {
				filters: aFilters,
				success: function (oData) {
					var Arry = !oData ? [] : oData.results;
					if (Arry.length === 0) {
						MessageToast.show("未查詢到凍結交貨單");
					} else {

						var arr = [];
						for (var i = 0; i < Arry.length; i++) {
							if (i == 0) arr.push(Arry[i]);
							var flag = false;
							if (arr.length > 0 && i > 0) {
								for (var j = 0; j < arr.length; j++) {
									if (arr[j].DeliveryDocument === Arry[i].DeliveryDocument & arr[j].SalesDocument === Arry[i].SalesDocument & arr[j].SalesDocumentItem ===
										Arry[i].SalesDocumentItem) {
										var flag = true;
										//break;
									}
								}
								if (!flag) {
									arr.push(Arry[i]);
								}
							}
						}

						var map = {},
							dest1 = [];
						for (var i = 0; i < arr.length; i++) {
							var ai = arr[i];
							if (!map[ai.DeliveryDocument]) {
								dest1.push({
									DeliveryDocument: ai.DeliveryDocument,
									SalesDocument: ai.SalesDocument,
									SalesDocumentItem: ai.SalesDocumentItem,
									SalesOrganization: ai.SalesOrganization,
									SoldToParty: ai.SoldToParty,
									ControllingAreaCurrency: ai.ControllingAreaCurrency,
									ReferenceSDDocument: ai.ReferenceSDDocument,
									Personnel: ai.Personnel,
									CustomerPaymentTermsName: ai.CustomerPaymentTermsName,
									NetAmount: ai.NetAmount,
									TransactionCurrency: ai.TransactionCurrency,
									CustomerPaymentTerms: ai.CustomerPaymentTerms,
									TaxAmount: ai.TaxAmount
								});
								map[ai.DeliveryDocument] = ai;
							} else {
								for (var j = 0; j < dest1.length; j++) {
									var dj = dest1[j];
									if (dj.DeliveryDocument === ai.DeliveryDocument) {
										dj.DeliveryDocument = ai.DeliveryDocument;
										dj.SalesDocument = ai.SalesDocument;
										// dj.SalesDocumentItem = ai.SalesDocumentItem;
										dj.SalesOrganization = ai.SalesOrganization;
										dj.SoldToParty = ai.SoldToParty;
										dj.ControllingAreaCurrency = ai.ControllingAreaCurrency;
										dj.ReferenceSDDocument = ai.ReferenceSDDocument;
										dj.Personnel = ai.Personnel;
										dj.CustomerPaymentTermsName = ai.CustomerPaymentTermsName;
										dj.TaxAmount = parseFloat(parseFloat(dj.TaxAmount) + parseFloat(ai.TaxAmount)).toFixed(2);
										dj.NetAmount = parseFloat(parseFloat(dj.NetAmount) + parseFloat(ai.NetAmount))
											.toFixed(2);
										// dj.TaxAmount = parseFloat(parseFloat(dj.TaxAmount) + parseFloat(ai.TaxAmount)).toFixed(2);
										dj.TransactionCurrency = ai.TransactionCurrency;
										dj.CustomerPaymentTerms = ai.CustomerPaymentTerms;
										break;
									}
								}
							}
						}

						var arr1 = [];
						for (var i = 0; i < dest1.length; i++) {
							if (i == 0) arr1.push(dest1[i]);
							var flag = false;
							if (arr1.length > 0 && i > 0) {
								for (var j = 0; j < arr1.length; j++) {
									if (arr1[j].DeliveryDocument === dest1[i].DeliveryDocument) {
										var flag = true;
										//break;
									}
								}
								if (!flag) {
									dest1[i].NetAmount = parseFloat(parseFloat(dest1[i].NetAmount) + parseFloat(dest1[i].TaxAmount)).toFixed(2);
									arr1.push(dest1[i]);
								}
							}
						}
						that._JSONModel.setProperty("/DeliveryDocList", arr1);
					}
				}
			};
			that.getModel("BlockDoc").read("/YY1_SALESCREDIT", mParameters);
		}
	});
});