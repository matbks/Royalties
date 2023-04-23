sap.ui.define(function () {
  "use strict";
  return {
    run: function (oEvent, oSelectedItem, oParentView) {
      if (oSelectedItem) {
        var oModel = oParentView.getModel();

        var Contract = oParentView.byId("Contract").getValue();

        var Partner = oSelectedItem.mProperties.title;

        if (Partner.length < 10) {
          var MissingLeadingZeros = 10 - Partner.length;
          for (var i = 0; i < MissingLeadingZeros; i++) {
            Partner = "0" + Partner;
          }
        }

        var sBalancePath = "/ZADOC_ROYALTIES_BALANCE";

        var oPartnerFilter = new sap.ui.model.Filter(
          "Partner",
          sap.ui.model.FilterOperator.EQ,
          Partner
        );

        var oContractFilter = new sap.ui.model.Filter(
          "Contract",
          sap.ui.model.FilterOperator.EQ,
          Contract
        );

        var filters = [];

        filters.push(oPartnerFilter);

        if (Contract) filters.push(oContractFilter);

        var oBalanceInput = oEvent.getSource().getParent().byId("Balance");
        

        oModel.read(sBalancePath, {
          filters: filters,

          success: function (oData, oResponse) {
            if (oData.results[0])
            oBalanceInput.setValue(oData.results[0].Balance);
          }.bind(this),

          error: function (oError) {
            sap.m.MessageToast.show("Erro ao carregar os dados de transgenia");
          },
        });
      }
    },
  };
});
