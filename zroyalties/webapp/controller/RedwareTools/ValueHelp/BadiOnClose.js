sap.ui.define(
  ["royalties/zroyalties/controller/GetBalance"],
  function (GetBalance) {
    "use strict";
    return {
      run: function (oEvent, oSelectedItem, oParentView, Type) {
        if (oSelectedItem) {  
 
          var oBalanceInput = oEvent.getSource().getParent().byId("Balance"); 
          // var oRadioButtonsModel = oEvent.getSource().getParent().getModel("RadioButtons")
          // var Type = oRadioButtonsModel.getProperty("/Parceiro") == true ? 'Parceiro' : 'Contrato';
   
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
