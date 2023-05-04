sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History", "sap/ui/core/Fragment",],
  function (Controller, History, Fragment) {
    "use strict";

    return Controller.extend("royalties.zroyalties.controller.BaseController", {
      /**
       * Convenience method for accessing the router in every controller of the application.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * Convenience method for getting the view model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for setting the view model in every controller of the application.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel: function (oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      setSmartTable: function (smartTableId, model = "SmartTables") {
        var smartTableRawId = this.byId(smartTableId).getId();
        var oSmartTablesModel = this.getOwnerComponent().getModel(model);
        oSmartTablesModel.setProperty("/" + smartTableId, smartTableRawId);
      },

      getSmartTable: function (smartTableId, model = "SmartTables") {
        var oSmartTableModel = this.getOwnerComponent().getModel(model);
        var oSmartTableId = oSmartTableModel.getProperty("/" + smartTableId);
        var oSmartTable = sap.ui.getCore().byId(oSmartTableId);
        return oSmartTable;
      },

      /**
       * Convenience method for getting the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      /**
       * Event handler for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the list route.
       * @public
       */
      onNavBack: function () {
        var sPreviousHash = History.getInstance().getPreviousHash();

        if (sPreviousHash !== undefined) {
          // eslint-disable-next-line sap-no-history-manipulation
          history.go(-1);
        } else {
          this.getRouter().navTo("list", {}, true);
        }
      },



      loadFragment: function (fragmentName, oView) {

        return new Promise(function (resolve, reject) {

          var sPath = "royalties.zroyalties.view.fragments." + fragmentName;
          if (!this.byId(fragmentName)) {

            Fragment.load({
              id: oView.createId(fragmentName),
              name: sPath,
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              resolve(oDialog);
            }.bind(this));

          } else {
            resolve(this.byId(fragmentName));
          };

        }.bind(this));

      }



    });
  }
);
