sap.ui.define(function () {
  "use strict";
  return {
    run: function (oEvent, oSelectedItem, oParentView) {
      var oModel = oParentView.getModel();
      debugger;
      var Partner = oSelectedItem.mProperties.title;
      if ( Partner.length < 10 ){ 
        var MissingLeadingZeros = 10 - Partner.length;
        for (var i = 0; i < MissingLeadingZeros; i++){
          Partner = '0' + Partner; 
        }
      }
      var sBalancePath = "/ZADOC_ROYALTIES_BALANCE"; 
      var oBalaceFilter = new sap.ui.model.Filter(
        "Partner",
        sap.ui.model.FilterOperator.EQ,
        Partner
      );
      var oBalanceInput = oEvent
      .getSource()
      .getParent()
      .byId("Balance");
      debugger;

      oModel.read(sBalancePath, {
        filters: [oBalaceFilter],

        success: function (oData, oResponse) { 
 
          oBalanceInput.setValue(oData.results[1].Balance); 
          
        }.bind(this),

        error: function (oError) { 
          sap.m.MessageToast.show("Erro ao carregar os dados de transgenia");
        },
      });
     
 
    },
  };

  
});
