sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/m/MessageToast",
    "sap/ui/vk/Material",
    "./RedwareTools/ValueHelp/ValueHelp",
    "sap/ui/core/UIComponent",
  ],
  function (
    BaseController,
    JSONModel,
    Filter,
    Sorter,
    FilterOperator,
    GroupHeaderListItem,
    Device,
    Fragment,
    formatter,
    MessageToast,
    Material,
    ValueHelp,
    UIComponent
  ) {
    "use strict";

    return BaseController.extend("royalties.zroyalties.controller.Report", {
      formatter: formatter,

      onInit: function () {
        this.getView().addEventDelegate(
          {
            onAfterShow: function (oEvent) {
              this.byId("st_report").getTable().removeSelections();
            }.bind(this),
          },
          this.getView()
        );
      },
    });
  }
);
