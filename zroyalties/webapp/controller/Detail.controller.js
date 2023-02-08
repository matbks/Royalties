sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    mobileLibrary,
    MessageToast,
    Fragment
  ) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("royalties.zroyalties.controller.Detail", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          lineItemListTitle: this.getResourceBundle().getText(
            "detailLineItemTableHeading"
          ),
        });

        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);

        this.setModel(oViewModel, "detailView");

        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler when the share by E-Mail button has been clicked
       * @public
       */
      onSendEmailPress: function () {
        var oViewModel = this.getModel("detailView");

        URLHelper.triggerEmail(
          null,
          oViewModel.getProperty("/shareSendEmailSubject"),
          oViewModel.getProperty("/shareSendEmailMessage")
        );
      },

      handleSaveBtnPress: function (oEvent) {
        var logSmartTable = this.getView().byId("st_log");
        var oModelMonitor = this.getOwnerComponent().getModel("Monitor");
        var oModel = this.getView().getModel();
        var discharge = this.byId("dischargeInput").mProperties.value;
        var balanceInput = this.byId("balanceInput").mProperties.value;

        var d = new Date();
        var currentYear = d.getFullYear();
        debugger;

        var payload = {
          Plant: oModelMonitor.oData.Plant,
          Romaneio: oModelMonitor.oData.Romaneio,
          Edcnumber: oModelMonitor.oData.EdcNum,
          Discharge: discharge,
          Fiscalyear: currentYear.toString(),
          Balance: balanceInput,
          Dischargestatus: "BAIXA MANUAL",
          Createdon: new Date(),
          Operation: "1",
        };

        oModel.create("/DischargeQtySet", payload, {
          success: function (oData, oResponse) {
            if (oResponse.statusCode == "201") {
              var msg = this.getOwnerComponent()
                .getModel("i18n")
                .getResourceBundle()
                .getText("discharged");
              debugger;
              // MessageBox.success(msg);

              logSmartTable.rebindTable();
              MessageToast.show(msg);
              oModelMonitor.setData(null);
              this.handleCancelBtnPress();
              oModelMonitor.refresh(true);
            }
          }.bind(this),

          error: function (oError) {
            var oSapMessage = JSON.parse(oError.responseText);
            var msg = oSapMessage.error.message.value;
            // MessageBox.error(msg);
            MessageToast.show(msg);
          },
        });
      },

      handleCancelBtnPress: function () {
        this.byId("openDialog").close();
        // var modelMonitor = this.getView().getModel("Monitor");
        this.byId("dischargeInput").mProperties.value = "";
        this.byId("balanceInput").mProperties.value = "";

        var modelMonitor = this.getOwnerComponent().getModel();
        modelMonitor.setData(null);
      },

      /**
       * Updates the item count within the line item table's header
       * @param {object} oEvent an event containing the total number of items in the list
       * @private
       */
      onListUpdateFinished: function (oEvent) {
        var sTitle,
          iTotalItems = oEvent.getParameter("total"),
          oViewModel = this.getModel("detailView");

        // only update the counter if the length is final
        if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
          if (iTotalItems) {
            sTitle = this.getResourceBundle().getText(
              "detailLineItemTableHeadingCount",
              [iTotalItems]
            );
          } else {
            //Display 'Line Items' instead of 'Line items (0)'
            sTitle = this.getResourceBundle().getText(
              "detailLineItemTableHeading"
            );
          }
          oViewModel.setProperty("/lineItemListTitle", sTitle);
        }
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Binds the view to the object path and expands the aggregated line items.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        var sObjectId = oEvent.getParameter("arguments").objectId;
        this.getModel("appView").setProperty(
          "/layout",
          "TwoColumnsBeginExpanded"
        );
        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              var sObjectPath = this.getModel().createKey(
                "ZADOC_ROYALTIES_MONITOR",
                {
                  EdcNum: sObjectId,
                }
              );
              this._bindView("/" + sObjectPath);
            }.bind(this)
          );
      },

      /**
       * Binds the view to the object path. Makes sure that detail view displays
       * a busy indicator while data for the corresponding element binding is loaded.
       * @function
       * @param {string} sObjectPath path to the object to be bound to the view.
       * @private
       */
      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        var oViewModel = this.getModel("detailView");

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oViewModel.setProperty("/busy", false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      expandMonitor: function () {
        this.getModel("appView").setProperty("/layout", "OneColumn");
      },

      _onBindingChange: function () {
        var oView = this.getView(),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("detailObjectNotFound");
          // if object could not be found, the selection in the list
          // does not make sense anymore.
          this.getOwnerComponent().oListSelector.clearListListSelection();
          return;
        }

        var sPath = oElementBinding.getPath(),
          oResourceBundle = this.getResourceBundle(),
          oObject = oView.getModel().getObject(sPath),
          sObjectId = oObject.EdcNum,
          sObjectName = oObject.EdcNum,
          oViewModel = this.getModel("detailView");

        this.getOwnerComponent().oListSelector.selectAListItem(sPath);

        oViewModel.setProperty(
          "/shareSendEmailSubject",
          oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
        );
        oViewModel.setProperty(
          "/shareSendEmailMessage",
          oResourceBundle.getText("shareSendEmailObjectMessage", [
            sObjectName,
            sObjectId,
            location.href,
          ])
        );
      },

      _onMetadataLoaded: function () {
        // Store original busy indicator delay for the detail view
        var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
          oViewModel = this.getModel("detailView"),
          oLineItemTable = this.byId("lineItemsList"),
          iOriginalLineItemTableBusyDelay =
            oLineItemTable.getBusyIndicatorDelay();

        // Make sure busy indicator is displayed immediately when
        // detail view is displayed for the first time
        oViewModel.setProperty("/delay", 0);
        oViewModel.setProperty("/lineItemTableDelay", 0);

        oLineItemTable.attachEventOnce("updateFinished", function () {
          // Restore original busy indicator delay for line item table
          oViewModel.setProperty(
            "/lineItemTableDelay",
            iOriginalLineItemTableBusyDelay
          );
        });

        // Binding the view will set it to not busy - so the view is always busy if it is not bound
        oViewModel.setProperty("/busy", true);
        // Restore original busy indicator delay for the detail view
        oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
      },

      /**
       * Set the full screen mode to false and navigate to list page
       */
      onCloseDetailPress: function () {
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          false
        );
        // No item should be selected on list after detail page is closed
        // this.getOwnerComponent().oListSelector.clearListListSelection();
        sap.ui
          .getCore()
          .byId("container-royalties.zroyalties---list--st_monitor")
          .getTable()
          .removeSelections();

          this.getRouter().navTo("list");
      },

      onDischarge: function (oEvent) {
         
        // let oSmartTable1 = sap.ui
        //   .getCore()
        //   .byId(
        //     "container-royalties.zroyalties---list--st_monitor"
        //   );
        // // let oSmartTable1 = this.getView().byId("st_monitor");
        // let oSmartTable = oSmartTable1.getTable();
        // var SmartTableLine = oSmartTable._aSelectedPaths;
        // if (SmartTableLine.length < 1) {
        //   MessageToast.show(
        //     this.getOwnerComponent()
        //       .getModel("i18n")
        //       .getResourceBundle()
        //       .getText("nullRegisterNotAllowed")
        //   );
        // } else {
        //   var SelectedItem = oSmartTable
        //     .getModel()
        //     .getProperty(SmartTableLine.toString());

          var oView = this.getView();
          // var modelMonitor = oView.getModel("Monitor");
          // modelMonitor.setData(SelectedItem);
          var monitorModel = this.getOwnerComponent().getModel("Monitor")
          
          var actualBalance = monitorModel.getData().ApplicationQuantity; 
          monitorModel.setProperty("/Balance", this.getBalance(actualBalance) );
          debugger;   
          if (!this.byId("openDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "royalties.zroyalties.view.fragments.Discharge",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("openDialog").open();
          }
 
        // }
      },

      getBalance: function(actualBalance){
        var balance = 0.00;
        let oSmartTableLogs = this.getView().byId("st_log");  
        var items_length = oSmartTableLogs.getTable().getItems().length;
        debugger;
        for ( var i = 0; i < items_length ; i++){
          var row = oSmartTableLogs.getTable().getItems()[i].getBindingContext().getObject()
          if ( !row.Discharge.includes(',') )
          row.Discharge = row.Discharge;
          balance = balance + parseInt(row.Discharge);
        }
        var sum = actualBalance - balance
        return ( (sum >= 0) ? sum : '0,00' ).toFixed(2).toString();
      },

      /**
       * Toggle between full and non full screen mode.
       */
      toggleFullScreen: function () {
        var bFullScreen = this.getModel("appView").getProperty(
          "/actionButtonsInfo/midColumn/fullScreen"
        );
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          !bFullScreen
        );
        if (!bFullScreen) {
          // store current layout and go full screen
          this.getModel("appView").setProperty(
            "/previousLayout",
            this.getModel("appView").getProperty("/layout")
          );
          this.getModel("appView").setProperty(
            "/layout",
            "MidColumnFullScreen"
          );
        } else {
          // reset to previous layout
          this.getModel("appView").setProperty(
            "/layout",
            this.getModel("appView").getProperty("/previousLayout")
          );
        }
      },

      onDischargeDelete: function () {
        let oSmartTable1 = this.getView().byId("st_log");
        let oSmartTable = oSmartTable1.getTable();
        var SmartTableLine = oSmartTable._aSelectedPaths;
        if (SmartTableLine.length < 1) {
          MessageToast.show(
            this.getOwnerComponent()
              .getModel("i18n")
              .getResourceBundle()
              .getText("nullRegisterNotAllowed")
          );
        } else {
          var SelectedItem = oSmartTable
            .getModel()
            .getProperty(SmartTableLine.toString());

          var oView = this.getView();
          var oModelLog = oView.getModel("Discharge");
          oModelLog.setData(SelectedItem);

          var oModel = this.getView().getModel();

          var payload = {
            Plant: oModelLog.getData().Plant,
            Romaneio: oModelLog.getData().Romaneio,
            Edcnumber: oModelLog.getData().EdcNumber,
            Discharge: oModelLog.getData().Discharge,
            Fiscalyear: oModelLog.getData().FiscalYear,
            Createdon: new Date(oModelLog.getData().CreatedOn),
            Balance: oModelLog.getData().Balance,
            Dischargestatus: "BAIXA MANUAL",
            Operation: "2",
          };

          oModel.create("/DischargeQtySet", payload, {
            success: function (oData, oResponse) {
              if (oResponse.statusCode == "201") {
                var msg = this.getOwnerComponent()
                  .getModel("i18n")
                  .getResourceBundle()
                  .getText("dischargeDeleted");
                oSmartTable1.rebindTable();
                // MessageBox.success(msg);
                MessageToast.show(msg);
                oModelLog.setData(null);
                this.handleCancelBtnPress();
                this.model().refresh(true);
              }
            }.bind(this),

            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              // MessageBox.error(msg);
              MessageToast.show(msg);
            },
          });
        }
      },
    });
  }
);
