sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/Arrangement",
	"./NavigationJourneyPhone",
	"./NotFoundJourneyPhone",
	"./BusyJourneyPhone"
], function (Opa5, Arrangement) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Arrangement(),
		viewNamespace: "zwx.sm.charm.charm_my_changedoc.charm_my_changedoc.view.",
		autoWait: true
	});
});
