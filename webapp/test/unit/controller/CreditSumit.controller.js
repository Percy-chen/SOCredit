/*global QUnit*/

sap.ui.define([
	"SD/SOCredit/controller/CreditSumit.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CreditSumit Controller");

	QUnit.test("I should test the CreditSumit controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});