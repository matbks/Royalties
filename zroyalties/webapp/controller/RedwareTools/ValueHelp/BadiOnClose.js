sap.ui.define(
  ["royalties/zroyalties/controller/GetBalance"],
  function (GetBalance) {
    "use strict";
    return {
      run: function (oEvent, oSelectedItem, oParentView) {
        if (oSelectedItem) {
 
          var oBalanceInput = oEvent.getSource().getParent().byId("Balance"); 
           
          var Type = oEvent.getSource().getParent().byId("RB3-1").mProperties.selected = true ? 'Parceiro' : 'Contrato';
   
          new GetBalance(
            Type,
            oSelectedItem,
            oBalanceInput,
            oParentView
          ); 
        }
      },
    };
  }
);
