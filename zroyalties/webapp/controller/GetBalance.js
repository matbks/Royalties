sap.ui.define(["sap/ui/base/ManagedObject"], function (ManagedObject) {
  "use strict";

  return ManagedObject.extend("royalties.zroyalties.controller.GetBalance", {
    constructor: function (Type, Value, oInput, oParentView) {
      this.getBalance(Type, this.AlphaIn(Type, Value), oInput, oParentView);
    },

    AlphaIn: function (Type, RawValue) {
      var ValueOriginalLength;
      if (Type == "Contrato") ValueOriginalLength = "10";
      else if (Type == "Parceiro") ValueOriginalLength = "10";
      if (RawValue.length < ValueOriginalLength) {
        var MissingLeadingZeros = ValueOriginalLength - RawValue.length;
        for (var i = 0; i < MissingLeadingZeros; i++) {
          RawValue = "0" + RawValue;
        }
        return RawValue;
      }
    },

    getBalance: function (Type, Value, oInput, oParentView) {
      var Path; 
      if (Type === "Parceiro") {

        var oFilter = new sap.ui.model.Filter(
          "Partner",
          sap.ui.model.FilterOperator.EQ,
          Value
        );

        Path = "/ZADOC_ROYALTIES_BALANCE";

      } else if (Type === "Contrato") {

        var oFilter = new sap.ui.model.Filter(
          "Contract",
          sap.ui.model.FilterOperator.EQ,
          Value
        );

        Path = "/ZADOC_ROYALTIES_BALANCE_C";
      }
      var oModel = oParentView.getModel();
      oModel.read(Path, {
        filters: [oFilter],
        success: function (oData, oResponse) {
          if (oData.results[0]) {
            oInput.setValue(oData.results[0].Balance);
          }
        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("Erro ao carregar o saldo");
        },
      });
    },
  });
});
