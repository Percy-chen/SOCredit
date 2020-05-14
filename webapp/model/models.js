// sap.ui.define([
// 	"sap/ui/model/json/JSONModel",
// 	"sap/ui/Device"
// ], function (JSONModel, Device) {
// 	"use strict";

// 	return {

// 		createDeviceModel: function () {
// 			var oModel = new JSONModel(Device);
// 			oModel.setDefaultBindingMode("OneWay");
// 			return oModel;
// 		}

// 	};
// });
/* =========================================================== */
/* App MVC中 model 实现（App 模型）                            */
/* =========================================================== */
sap.ui.define(["sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/resource/ResourceModel"
], function (JSONModel, Device, ODataModel, ResourceModel) {
	"use strict";

	function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
		var oExtensionObject = {},
			oServiceUri = new URI(sServiceUrl);

		aUrlParametersToAdd.forEach(function (sUrlParam) {
			var sLanguage, oUrlParameters, sParameterValue;

			// for sap-language we check if the launchpad can provide it.
			if (sUrlParam === "sap-language") {

				var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser");
				if (fnGetuser) {
					// for sap-language we check if the launchpad can provide it.
					sLanguage = fnGetuser().getLanguage();
				}

				if (sLanguage) {
					oMetadataUrlParams["sap-language"] = sLanguage;
					return;
				}
				// Continue searching in the url
			}

			oUrlParameters = jQuery.sap.getUriParameters();
			sParameterValue = oUrlParameters.get(sUrlParam);
			if (sParameterValue) {
				oMetadataUrlParams[sUrlParam] = sParameterValue;
				oServiceUri.addSearch(sUrlParam, sParameterValue);
			}
		});

		jQuery.extend(oMetadataUrlParams, oExtensionObject);
		return oServiceUri.toString();
	}

	return {

		// 创建OData模型
		createODataModel: function (oOptions) {
			var aUrlParametersForEveryRequest, oConfig, sUrl;

			oOptions = oOptions || {};

			if (!oOptions.url) {
				jQuery.sap.log.error("Please provide a url when you want to create an ODataModel",
					"ZHAND_201803_TR_1001.model.models.createODataModel");
				return null;
			}

			// create a copied instance since we modify the
			// config
			oConfig = jQuery.extend(true, {}, oOptions.config);

			aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
			oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};

			sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);

			return this._createODataModel(sUrl, oConfig);

		},

		// 创建OData模型
		_createODataModel: function (sUrl, oConfig) {
			return new ODataModel(sUrl, oConfig);
		},

		// 初始化本地数据集
		_initialLocalData: function () {

			var localData = {
				appProperties: {
					busy: false,
					shcode: ""
				},
				SOCredit: {
					APPLICANT: "", //申请人
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
					PAYMENT: "", //付款方式
					OVERDUECURR: "", //逾期應收帳款
					REASON: "", //原因
					EMAIL:""//邮箱
				},
				DeliveryDocList: []
			};
			return localData;
		},

		// 创建设备模型
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		// 创建FLP模型
		createFLPModel: function () {
			var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser");
			var bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false;
			var oModel = new JSONModel({
				isShareInJamActive: bIsShareInJamActive
			});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		// 创建本地模型
		createLocalModel: function () {
			var oModel = new JSONModel(this._initialLocalData());
			//oModel.setSizeLimit(9999);
			return oModel;
		},

		// 	创建资源模型
		createResourceModel: function (sRootPath, resourceBundle) {
			this._resourceModel = new ResourceModel({
				bundleUrl: [
					sRootPath,
					resourceBundle
				].join("/")
			});
			return this._resourceModel;
		}
	};

});