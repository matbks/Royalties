sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  /**
   * provide app-view type models (as in the first "V" in MVVC)
   *
   * @param {typeof sap.ui.model.json.JSONModel} JSONModel
   * @param {typeof sap.ui.Device} Device
   *
   * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
   */
  function (JSONModel, Device) {
    "use strict";

    return {
      createDeviceModel: function () {
        var oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },

      createMonitorModel: function () {
        var oModel = new JSONModel({
          EdcNum: "",
          ContractNum: "",
          ApplicationDocnum: "",
          EdcType: "",
          Property: "",
          Material: "",
          MaterialDescription: "",
          ApplicationQuantity: "",
          CreatedBy: "",
          CreatedOn: "",
          ChangeBy: "",
          ChangeOn: "",
          Ticket: "",
          Romaneio: "",
          TicketDate: "",
          Partner: "",
          PartnerId: "",
          PartnerDescription: "",
          Safra: "",
          Plant: "",
          Balance: "",
        });
        return oModel;
      },

      createDischargeModel: function () {
        var oModel = new JSONModel({
          Plant: "",
          Romaneio: "",
          Edcnumber: "",
          Creationtime: "",
          Discharge: "",
          Fiscalyear: "",
          ApplicationQuantity: "",
          Creationdate: "",
          Creationdate: "",
          Dischargestatus: "",
          Balance: "",
        });

        return oModel;
      },

      createSmartTablesModel: function () {
        var oModel = new JSONModel({
          st_monitor: "", 
          st_log: "", 
        });

        return oModel;
      },
    };
  }
);
