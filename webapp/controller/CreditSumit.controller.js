sap.ui.define(["./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"./messages"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, messages) {
	"use strict";
	return BaseController.extend("SD.SOCredit.controller.CreditSumit", {
		onInit: function () {
			this._JSONModel = this.getModel();
		},
		handleSearch: function () {
			var sDeliveryDocument = this.byId("DeliveryDocument").getValue();
			if (sDeliveryDocument === "") {
				messages.showText("请先选择交货单号！");
				return;
			}
			var DeliveryDocList = this._JSONModel.getData().DeliveryDocList;
			var SOCredit = this._JSONModel.getData().SOCredit;
			for (var i = 0; i < DeliveryDocList.length; i++) {
				if (sDeliveryDocument === DeliveryDocList[i].DeliveryDocument) {
					SOCredit.DELIVERDOCUMENT = DeliveryDocList[i].DeliveryDocument;
					SOCredit.COMPANYCODE = DeliveryDocList[i].SalesOrganization;
					SOCredit.TRANSCURRENCY = DeliveryDocList[i].TransactionCurrency;
					SOCredit.SOLDTOPARTY = DeliveryDocList[i].SoldToParty;
					SOCredit.SALESMAN = DeliveryDocList[i].Personnel;
					SOCredit.NETAMOUNT = DeliveryDocList[i].NetAmount;
					SOCredit.PAYMENTTERMS = DeliveryDocList[i].CustomerPaymentTerms;
					SOCredit.PAYMENTTERMSNAME = DeliveryDocList[i].CustomerPaymentTermsName;
				}
			}
			this._JSONModel.setProperty("/SOCredit", SOCredit);
			this.getSaleMan(SOCredit.SALESMAN);
			this.getCurr();
			this.getCreditAccount();
			this.getCustomerName(SOCredit.COMPANYCODE, SOCredit.SOLDTOPARTY);
		},
		getSaleMan: function (SaleMan) {
			this.setBusy(true);
			// var SOCredit = this._JSONModel.getData().SOCredit;
			var oFilter1 = new sap.ui.model.Filter("PersonWorkAgreement", sap.ui.model.FilterOperator.EQ, SaleMan);
			// var oFilter2 = new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, "VE");
			var aFilters = [oFilter1];
			var mParameters = {
				filters: aFilters,
				success: function (oData, response) {
					if (response.statusCode === "200") {
						var Arry = !oData ? [] : oData.results;
						if (Arry.length > 0) {
							this._JSONModel.setProperty("/SOCredit/Node2Account", Arry[0].BPIdentificationNumber);
						}
					}
					this.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.setBusy(false);
				}.bind(this)
			};
			this.getModel("NODE2ACCOUNT").read("/YY1_WORKFLOWNODE2", mParameters);
		},
		getCurr: function () {
			this.setBusy(true);
			var SOCredit = this._JSONModel.getData().SOCredit;
			var oFilter1 = new sap.ui.model.Filter("Ledger", sap.ui.model.FilterOperator.EQ, "2L");
			var oFilter2 = new sap.ui.model.Filter("GLAccount", sap.ui.model.FilterOperator.BT, "0011910001", "0011910003");
			var oFilter3 = new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, SOCredit.COMPANYCODE);
			var oFilter4 = new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.EQ, SOCredit.SOLDTOPARTY);
			var aFilters = [oFilter1, oFilter2, oFilter3, oFilter4];
			var mParameters = {
				filters: aFilters,
				success: function (oData, response) {
					if (response.statusCode === "200") {
						var CurrList = !oData ? [] : oData.results;
						if (CurrList.length > 0) {
							var today = new Date();
							var COMPCURR = 0;
							var OVERDUECURR = 0;
							for (var i = 0; i < CurrList.length; i++) {
								COMPCURR = COMPCURR + parseFloat(CurrList[i].AmountInCompanyCodeCurrency);
								if (CurrList[i].NetDueDate > today) {} else {
									if (CurrList[i].ClearingAccountingDocument === "") {
										OVERDUECURR = OVERDUECURR + parseFloat(CurrList[i].AmountInCompanyCodeCurrency);
									}
								}
							}
							this._JSONModel.setProperty("/SOCredit/COMPANYNAME", CurrList[0].CompanyCodeName);
							// this._JSONModel.setProperty("/SOCredit/SEARCHTERMS1", CurrList[0].CustomerName);
							this._JSONModel.setProperty("/SOCredit/COMPCURR", COMPCURR);
							this._JSONModel.setProperty("/SOCredit/OVERDUECURR", OVERDUECURR);
						}
					}
					this.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.setBusy(false);
				}.bind(this)
			};
			this.getModel("CurrAmount").read("/YY1_getCurrency", mParameters);
		},
		getCreditAccount: function () {
			var SOCredit = this._JSONModel.getData().SOCredit;
			var sUrl = "/YY1_CreditAccount(P_ExchangeRateType='M',P_DisplayCurrency='TWD',P_ReadLineItem='Y')/Results";
			var mParameters = {
				success: function (oData, response) {
					if (response.statusCode === "200") {
						var CurrList = !oData ? [] : oData.results;
						if (CurrList.length > 0) {
							for (var i = 0; i < CurrList.length; i++) {
								if (CurrList[i].BusinessPartner === SOCredit.SOLDTOPARTY & CurrList[i].CreditSegment === '6310') {
									this._JSONModel.setProperty("/SOCredit/CREDITLIMITCURR", CurrList[i].CustomerCreditLimitAmount);
									this._JSONModel.setProperty("/SOCredit/CREDITBALANCE", CurrList[i].CustomerCreditLimitAmount - CurrList[i].CustomerCreditExposureAmoun);
								}
							}
						}
					}
					this.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.setBusy(false);
				}.bind(this)
			};
			this.getModel("CreditAccount").read(sUrl, mParameters);
		},
		getCustomerName: function (CompanyCode, Customer) {
			this.setBusy(true);
			var oFilter1 = new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, CompanyCode);
			var oFilter2 = new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.EQ, Customer);
			var aFilters = [oFilter1, oFilter2];
			var mParameters = {
				filters: aFilters,
				success: function (oData, response) {
					if (response.statusCode === "200") {
						var CustomerList = !oData ? [] : oData.results;
						if (CustomerList.length > 0) {
							this._JSONModel.setProperty("/SOCredit/SEARCHTERMS1", CustomerList[0].CustomerName);
						}
					}
					this.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.setBusy(false);
				}.bind(this)
			};
			this.getModel("Customer").read("/YY1_CUMTOMERVH", mParameters);

		},
		handleSubmit: function () {
			this.setBusy(true);
			var SOCredit = this._JSONModel.getData().SOCredit; //SOCredit Data
			if (SOCredit.DELIVERDOCUMENT === "") {
				messages.showText("请先查询交货单信息！");
				this.setBusy(false);
				return;
			}
			var that = this;
			// 回写XSODATA 日志
			that.postToCFHana().then(function (oData) {
				// 启动工作流
				var token = that._fetchToken();
				that._startInstance(token).then(function (result) {
					//存储抬头日志表
					that.saveLogHeader(result);
					var SOCredit = that._JSONModel.getData().SOCredit;
					var SOCredit0 = {
						FLOW: SOCredit.FLOW, //申请流水号
						APPLICANT: SOCredit.APPLICANT, //申请人
						APPLICANTNAME: SOCredit.APPLICANTNAME, //申请人姓名
						CREATEDATE: new Date(), //申请日期
						SALESMAN: "", //业务员
						DELIVERDOCUMENT: "", //单号
						COMPANYCODE: "", //公司代码
						TRANSCURRENCY: "", //交易幣別
						CREDITLIMITCURR: "", //信用額度
						NETAMOUNT: "", //銷貨金額
						COMPCURR: "", //應收帳款
						SOLDTOPARTY: "", //客户
						CREDITBALANCE: "", //信用餘額
						PAYMENTTERMS: "", //付款方式
						OVERDUECURR: "", //逾期應收帳款
						REASON: "", //原因
						EMAIL: SOCredit.EMAIL //申请人邮箱
					};
					that._JSONModel.setProperty("/SOCredit", SOCredit0);
					that.byId("DeliveryDocument").setValue("");
					MessageToast.show("工作流程已成功启动");
					that.setBusy(false);
				});
			});
		},
		postToCFHana: function () {
			var that = this;
			var promise = new Promise(function (resolve, reject) {
				that.createSOCREDIT(that).then(function (oData) {
					that.getModel().setProperty("/SOCredit/FLOW", oData.FLOW);
					resolve(oData);
				});
			});
			return promise;
		},
		createSOCREDIT: function (oController) {
			var SOCredit = oController._JSONModel.getData().SOCredit; //REData Data
			var promise = new Promise(function (resolve, reject) {
				oController.GetSequence(oController).then(function (oSequence) {
					var SOPOSTData = {
						FLOW: oSequence, //oSequence.Number,
						APPLICANT: SOCredit.APPLICANT, //申请人
						CREATEDATE: SOCredit.CREATEDATE, //申请日期
						SALESMAN: SOCredit.SALESMAN, //业务员
						DELIVERDOCUMENT: SOCredit.DELIVERDOCUMENT, //单号
						COMPANYCODE: SOCredit.COMPANYCODE, //公司代码
						TRANSCURRENCY: SOCredit.TRANSCURRENCY, //交易幣別
						CREDITLIMITCURR: SOCredit.CREDITLIMITCURR, //信用額度
						NETAMOUNT: SOCredit.NETAMOUNT, //銷貨金額
						COMPCURR: SOCredit.COMPCURR, //應收帳款
						SOLDTOPARTY: SOCredit.SOLDTOPARTY, //客户
						CUSTOMERNAME: SOCredit.SEARCHTERMS1, //客户名称
						CREDITBALANCE: SOCredit.CREDITBALANCE, //信用餘額
						PAYMENTTERMS: SOCredit.PAYMENTTERMS, //付款方式
						PAYMENTTERMSNAME: SOCredit.PAYMENTTERMSNAME, //付款方式描述
						OVERDUECURR: SOCredit.OVERDUECURR, //逾期應收帳款
						REASON: SOCredit.REASON, //原因
					};
					if (SOPOSTData.CREDITLIMITCURR === "") {
						SOPOSTData.CREDITLIMITCURR = 0;
					}
					if (SOPOSTData.NETAMOUNT === "") {
						SOPOSTData.NETAMOUNT = 0;
					}
					if (SOPOSTData.COMPCURR === "") {
						SOPOSTData.COMPCURR = 0;
					}
					if (SOPOSTData.CREDITBALANCE === "") {
						SOPOSTData.CREDITBALANCE = 0;
					}
					if (SOPOSTData.OVERDUECURR === "") {
						SOPOSTData.OVERDUECURR = 0;
					}
					var mParameter = {
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					};
					oController.getModel("SOCREDIT").create("/SOCREDIT", SOPOSTData, mParameter);
				});
			});
			return promise;
		},
		GetSequence: function (oController) {
			var appType = "CREDIT";
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					url: "/destinations/Print/ws/data/order-no" + "?code=" + appType,
					method: "GET",
					async: false,
					success: function (data) {
						resolve(data);
					},
					error: function (xhr, textStatus, errorText) {
						reject(Error(errorText));
					}
				});
			});
			return promise;
			// var appType = "RECEIPT";
			// var promise = new Promise(function (resolve, reject) {
			// 	$.ajax({
			// 		url: "/destinations/APLEXHANA/xsjs/Sequence.xsjs" + "?DocType=" + appType,
			// 		method: "GET",
			// 		contentType: "application/json",
			// 		dataType: "json",
			// 		success: function (result, xhr, data) {
			// 			// resolve with the process context as result
			// 			resolve(data.responseJSON);
			// 		},
			// 		error: function (xhr, textStatus, errorText) {
			// 			reject(Error(errorText));
			// 		}
			// 	});
			// });
			// return promise;
		},
		saveLogHeader: function (oHeader) {
			var SOCredit = this._JSONModel.getData().SOCredit; //SOCredit Data
			var logheader = {
				STARTCOMPANY: SOCredit.COMPANYCODE,
				FLOWID: "workflow_salescredit",
				INSTANCEID: oHeader.id,
				DOCUMENT: SOCredit.FLOW,
				REQUESTER: SOCredit.APPLICANT,
				STATUS: ""
			};
			this.getModel("WORKFLOWLOG").create("/WORKFLOWHEAD", logheader);
		},
		_fetchToken: function () {
			var token;
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/xsrf-token",
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				success: function (result, xhr, data) {
					token = data.getResponseHeader("X-CSRF-Token");
				}
			});
			return token;
		},
		_startInstance: function (token) {
			var SOCredit = this._JSONModel.getData().SOCredit; //SOCredit Data
			var that = this;
			var promise = new Promise(function (resolve, reject) {
				var oContext = {
					FLOW: SOCredit.FLOW, //申请流水号
					APPLICANT: SOCredit.APPLICANT,
					APPLICANTNAME: SOCredit.APPLICANTNAME,
					SALESMAN: SOCredit.SALESMAN,
					CREATEDATE: SOCredit.CREATEDATE,
					DELIVERDOCUMENT: SOCredit.DELIVERDOCUMENT,
					COMPANYCODE: SOCredit.COMPANYCODE,
					COMPANYNAME: SOCredit.COMPANYNAME,
					TRANSCURRENCY: SOCredit.TRANSCURRENCY,
					CREDITLIMITCURR: SOCredit.CREDITLIMITCURR,
					NETAMOUNT: SOCredit.NETAMOUNT,
					COMPCURR: SOCredit.COMPCURR,
					SOLDTOPARTY: SOCredit.SOLDTOPARTY,
					SEARCHTERMS1: SOCredit.SEARCHTERMS1, //客户名称
					CREDITBALANCE: SOCredit.CREDITBALANCE,
					PAYMENTTERMS: SOCredit.PAYMENTTERMS,
					PAYMENTTERMSNAME: SOCredit.PAYMENTTERMSNAME,
					OVERDUECURR: SOCredit.OVERDUECURR,
					REASON: SOCredit.REASON,
					Node2Account: SOCredit.Node2Account,
					EMAIL: SOCredit.EMAIL
				};
				$.ajax({
					url: "/bpmworkflowruntime/rest/v1/workflow-instances",
					method: "POST",
					async: false,
					contentType: "application/json",
					headers: {
						"X-CSRF-Token": token
					},
					data: JSON.stringify({
						definitionId: "workflow_salescredit",
						context: oContext
					}),
					success: function (result, xhr, data) {
						resolve(result);
					},
					error: function (result, xhr, data) {
						reject(result);
					}
				});
			});
			return promise;
		}
	});
});