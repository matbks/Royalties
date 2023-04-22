sap.ui.define(function () {
  "use strict";
  return {
    run: function (oEvent, oSelectedItem, oParentView) {
      var oModel = oParentView.getModel();
      debugger;
      var sBalancePath = "/ZADOC_ROYALTIES_BALANCE_SUM"; 
      var oBalaceFilter = new sap.ui.model.Filter(
        "Partner",
        sap.ui.model.FilterOperator.EQ,
        oSelectedItem.mProperties.title
      );
      var oBalanceInput = oEvent
      .getSource()
      .getParent()
      .byId("Balance");
      debugger;

      oModel.read(sBalancePath, {
        filters: [oBalaceFilter],

        success: function (oData, oResponse) { 
 
          oBalanceInput = oData.results[1].Quantity; 
          
        }.bind(this),

        error: function (oError) { 
          sap.m.MessageToast.show("Erro ao carregar os dados de transgenia");
        },
      });
     
 
    },
  };

  
});
