sap.ui.define(
  ["royalties/zroyalties/controller/GetBalance"],
  function (GetBalance) {
    "use strict";
    return {
      run: function (oEvent, oSelectedItem, oParentView) {
        if (oSelectedItem) {
           
          var oBalanceInput = oEvent.getSource().getParent().byId("Balance");

          var Type =  oEvent.getSource().getTitle();
  
          debugger;
          
          new GetBalance(
            Type,
            oSelectedItem,
            oBalanceInput,
            oParentView
          );

          // var oModel = oParentView.getModel();

          // var Contract = oParentView.byId("Contract").getValue();

          // var Partner = oSelectedItem.mProperties.title;

          // var sBalancePath = "/ZADOC_ROYALTIES_BALANCE";

          // var oPartnerFilter = new sap.ui.model.Filter(
          //   "Partner",
          //   sap.ui.model.FilterOperator.EQ,
          //   Partner
          // );

          // var oContractFilter = new sap.ui.model.Filter(
          //   "Contract",
          //   sap.ui.model.FilterOperator.EQ,
          //   Contract
          // );

          //       if (Contract) filters.push(oContractFilter);

          //       var oBalanceInput = oEvent.getSource().getParent().byId("Balance");

          //       oModel.read(sBalancePath, {

          //         filters: [oPartnerFilter],

          //         success: function (oData, oResponse) {
          //           if (oData.results[0])
          //           oBalanceInput.setValue(oData.results[0].Balance);
          //         }.bind(this),

          //         error: function (oError) {
          //           sap.m.MessageToast.show("Erro ao carregar os dados de transgenia");
          //         },
          //       });
        }
      },
    };
  }
);
