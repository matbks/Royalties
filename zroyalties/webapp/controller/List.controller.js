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
    ValueHelp
  ) {
    "use strict";

    return BaseController.extend("royalties.zroyalties.controller.List", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the list controller is instantiated. It sets up the event handling for the list/detail communication and other lifecycle tasks.
       * @public
       */
      onInit: function () {
        this.getView().addEventDelegate(
          {
            onAfterShow: function (oEvent) {
              this.byId("st_monitor").getTable().removeSelections();
            }.bind(this),
          },
          this.getView()
        );

        // Control state model
        var oList = this.byId("list"),
          oViewModel = this._createViewModel(),
          // Put down list's original value for busy indicator delay,
          // so it can be restored later on. Busy handling on the list is
          // taken care of by the list itself.
          iOriginalBusyDelay = oList.getBusyIndicatorDelay();

        this._oList = oList;
        // keeps the filter and search state
        this._oListFilterState = {
          aFilter: [],
          aSearch: [],
        };

        this.setModel(oViewModel, "listView");
        // Make sure, busy indication is showing immediately so there is no
        // break after the busy indication for loading the view's meta data is
        // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
        oList.attachEventOnce("updateFinished", function () {
          // Restore original busy indicator delay for the list
          oViewModel.setProperty("/delay", iOriginalBusyDelay);
        });

        this.getView().addEventDelegate({
          onBeforeFirstShow: function () {
            this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
          }.bind(this),
        });

        this.getRouter()
          .getRoute("list")
          .attachPatternMatched(this._onMasterMatched, this);
        this.getRouter().attachBypassed(this.onBypassed, this);

        // var stMonitor = this.byId("st_monitor").getId();
        // var oModelUtils = this.getOwnerComponent().getModel("SmartTables");
        // oModelUtils.setProperty("/st_monitor", stMonitor);
        this.setSmartTable("st_monitor");
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * After list data is available, this handler method updates the
       * list counter
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished: function (oEvent) {
        // update the list object counter after new data is loaded
        this._updateListItemCount(oEvent.getParameter("total"));
      },

      /**
       * Event handler for the list search field. Applies current
       * filter value and triggers a new search. If the search field's
       * 'refresh' button has been pressed, no new search is triggered
       * and the list binding is refresh instead.
       * @param {sap.ui.base.Event} oEvent the search event
       * @public
       */
      onSearch: function (oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
          return;
        }

        var sQuery = oEvent.getParameter("query");

        if (sQuery) {
          this._oListFilterState.aSearch = [
            new Filter("EdcNum", FilterOperator.Contains, sQuery),
          ];
        } else {
          this._oListFilterState.aSearch = [];
        }
        this._applyFilterSearch();
      },

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh: function () {
        this._oList.getBinding("items").refresh();
      },

      // Método onPartnerSelected
      onPartnerSelected: function (oEvent) {
        var oRadioButtonModel = this.getView().getModel("radioButton");
        var bSelected = oEvent.getParameter("selected");
        oRadioButtonModel.setProperty("/Parceiro", bSelected);
        oRadioButtonModel.setProperty("/Contrato", !bSelected);
      },

      // Método onContractSelected
      onContractSelected: function (oEvent) {
        var oRadioButtonModel = this.getView().getModel("radioButton");
        var bSelected = oEvent.getParameter("selected");
        oRadioButtonModel.setProperty("/Parceiro", !bSelected);
        oRadioButtonModel.setProperty("/Contrato", bSelected);
      },

      /**
       * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
       * @param {sap.ui.base.Event} oEvent the button press event
       * @public
       */
      onOpenViewSettings: function (oEvent) {
        var sDialogTab = "filter";
        if (oEvent.getSource() instanceof sap.m.Button) {
          var sButtonId = oEvent.getSource().getId();
          if (sButtonId.match("sort")) {
            sDialogTab = "sort";
          } else if (sButtonId.match("group")) {
            sDialogTab = "group";
          }
        }
        // load asynchronous XML fragment
        if (!this.byId("viewSettingsDialog")) {
          Fragment.load({
            id: this.getView().getId(),
            name: "royalties.zroyalties.view.ViewSettingsDialog",
            controller: this,
          }).then(
            function (oDialog) {
              // connect dialog to the root view of this component (models, lifecycle)
              this.getView().addDependent(oDialog);
              oDialog.addStyleClass(
                this.getOwnerComponent().getContentDensityClass()
              );
              oDialog.open(sDialogTab);
            }.bind(this)
          );
        } else {
          this.byId("viewSettingsDialog").open(sDialogTab);
        }
      },

      /**
       * Event handler called when ViewSettingsDialog has been confirmed, i.e.
       * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
       * are applied to the list, which can also mean that they
       * are removed from the list, in case they are
       * removed in the ViewSettingsDialog.
       * @param {sap.ui.base.Event} oEvent the confirm event
       * @public
       */
      onConfirmViewSettingsDialog: function (oEvent) {
        this._applySortGroup(oEvent);
      },

      /**
       * Apply the chosen sorter and grouper to the list
       * @param {sap.ui.base.Event} oEvent the confirm event
       * @private
       */
      _applySortGroup: function (oEvent) {
        var mParams = oEvent.getParameters(),
          sPath,
          bDescending,
          aSorters = [];

        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new Sorter(sPath, bDescending));
        this._oList.getBinding("items").sort(aSorters);
      },

      /**
       * Event handler for the list selection event
       * @param {sap.ui.base.Event} oEvent the list selectionChange event
       * @public
       */
      onSelectionChange: function (oEvent) {
        let oSmartTable1 = this.getView().byId("st_monitor");
        let oSmartTable = oSmartTable1.getTable();
        var SmartTableLine = oSmartTable._aSelectedPaths;
        var SelectedItem = oSmartTable
          .getModel()
          .getProperty(SmartTableLine.toString());
        var oModelMonitor = this.getView().getModel("Monitor");
        oModelMonitor.setData(SelectedItem);
        var oList = oEvent.getSource(),
          bSelected = oEvent.getParameter("selected");

        // skip navigation when deselecting an item in multi selection mode
        if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
          // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
          this._showDetail(
            oEvent.getParameter("listItem") || oEvent.getSource()
          );
        }
      },

      /**
       * Event handler for the bypassed event, which is fired when no routing pattern matched.
       * If there was an object selected in the list, that selection is removed.
       * @public
       */
      onBypassed: function () {
        this._oList.removeSelections(true);
      },

      /**
       * Used to create GroupHeaders with non-capitalized caption.
       * These headers are inserted into the list to
       * group the list's items.
       * @param {Object} oGroup group whose text is to be displayed
       * @public
       * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
       */
      createGroupHeader: function (oGroup) {
        return new GroupHeaderListItem({
          title: oGroup.text,
          upperCase: false,
        });
      },

      onMassDischarge: function (oEvent) {
        var oView = this.getView();

        if (!this.byId("openDialog")) {
          Fragment.load({
            id: oView.getId(),
            name: "royalties.zroyalties.view.fragments.MassDischarge",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId("openDialog").open();
        }
      },

      handleCancelMassDischarge: function () {
        this.byId("Contract").mProperties.value = "";
        this.byId("Partner").mProperties.value = "";
        this.byId("Quantity").mProperties.value = "";
        this.byId("openDialog").destroy();
      },

      handleSaveMassDischarge: function () {
        debugger;
        var oModel = this.getView().getModel();
        var oSmartTable = this.getView().byId("st_monitor");
        if (
          (this.byId("Contract").mProperties.value != "" ||
            this.byId("Partner").mProperties.value != "") &&
          this.byId("Quantity").mProperties.value != ""
        ) {
          if (
            parseFloat(this.byId("Quantity").mProperties.value) >
            parseFloat(this.byId("Balance").mProperties.value)
          ) {
            MessageToast.show(
              "Selecione uma quantidade inferior ao total bloqueado"
            );
          } else {
            var MassDischargeData = [
              {
                Contract: this.byId("Contract").mProperties.value,
                Partner: this.byId("Partner").mProperties.value,
                Quantity: this.byId("Quantity").mProperties.value,
              },
            ];

            var payload = {
              Action: "MASSDISCHARGE",
              Payload: JSON.stringify(MassDischargeData),
            };

            oModel.create("/JsonCommSet", payload, {
              success: function (oData, oResponse) {
                if (oResponse.statusCode == "201") {
                  var msg = this.getOwnerComponent()
                    .getModel("i18n")
                    .getResourceBundle()
                    .getText("discharged");
                  debugger;
                  // MessageBox.success(msg);
                  MessageToast.show(msg);
                  oSmartTable.rebindTable();

                  let oSmartTableDetail = this.getSmartTable("st_log");
                  oSmartTableDetail.rebindTable();

                  this.handleCancelMassDischarge();
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
        } else {
          MessageToast.show("Preencha o campo contrato ou parceiro");
        }
      },

      onDischarge: function (oEvent) {
        let oSmartTable1 = this.getView().byId("st_monitor");
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
          var modelMonitor = oView.getModel("Monitor");
          modelMonitor.setData(SelectedItem);

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

          // this.callTransaction("ProductionOrder", "change", {
          //   ProductionOrder: SelectedItem.ProductionOrder,
          // });
          // return false;
        }
      },

      handleSaveBtnPress: function (oEvent) {
        var oModelMonitor = this.getView().getModel("Monitor");
        var oModel = this.getView().getModel();
        var results = oModelMonitor.getData();
        var discharge = this.byId("dischargeInput").mProperties.value;
        var balanceInput = this.byId("balanceInput").mProperties.value;

        var d = new Date();
        var currentYear = d.getFullYear();
        debugger;

        var payload = {
          Plant: oModelMonitor.getData().Plant,
          Romaneio: oModelMonitor.getData().Romaneio,
          Edcnumber: oModelMonitor.getData().EdcNum,
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
              MessageToast.show(msg);
              this.clearModel(oModelMonitor);
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
      },

      handleCancelBtnPress: function () {
        this.byId("openDialog").close();
        var modelMonitor = this.getView().getModel("Monitor");
        this.clearModel(modelMonitor);
      },

      clearModel: function (oModel) {
        oModel.setData({
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
          PropertyDescription: "",
          PartnerDescription: "",
          Safra: "",
          Plant: "",
        });
      },
      /**
       * Event handler for navigating back.
       * We navigate back in the browser history
       * @public
       */
      onNavBack: function () {
        // eslint-disable-next-line sap-no-history-manipulation
        history.go(-1);
      },

      onPartnerF4: function (oEvent) {
        let oSelectDialog = ValueHelp.createSearchHelp(
          this.getView(),
          "Parceiro",
          "/ZADOC_ROYALTIES_PARTNERS",
          "Partner",
          "PartnerDescription",
          oEvent.getSource()
        );
        oSelectDialog.open();
      },

      onContractF4: function (oEvent) {
        let oSelectDialog = ValueHelp.createSearchHelp(
          this.getView(),
          "Contrato",
          "/ZADOC_ROYALTIES_CONTRACTS",
          "Contract",
          "ContractDescription",
          oEvent.getSource()
        );

        oSelectDialog.open();
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      _createViewModel: function () {
        return new JSONModel({
          isFilterBarVisible: false,
          filterBarLabel: "",
          delay: 0,
          title: this.getResourceBundle().getText("listTitleCount", [0]),
          noDataText: this.getResourceBundle().getText("listListNoDataText"),
          sortBy: "EdcNum",
          groupBy: "None",
        });
      },

      _onMasterMatched: function () {
        //Set the layout property of the FCL control to 'OneColumn'
        this.getModel("appView").setProperty("/layout", "OneColumn");
      },

      /**
       * Shows the selected item on the detail page
       * On phones a additional history entry is created
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       */
      _showDetail: function (oItem) {
        var bReplace = !Device.system.phone;
        // set the layout property of FCL control to show two columns
        this.getModel("appView").setProperty(
          "/layout",
          "TwoColumnsBeginExpanded"
        );
        this.getRouter().navTo(
          "object",
          {
            objectId: oItem.getBindingContext().getProperty("EdcNum"),
          },
          bReplace
        );
      },

      /**
       * Sets the item count on the list header
       * @param {integer} iTotalItems the total number of items in the list
       * @private
       */
      _updateListItemCount: function (iTotalItems) {
        var sTitle;
        // only update the counter if the length is final
        if (this._oList.getBinding("items").isLengthFinal()) {
          sTitle = this.getResourceBundle().getText("listTitleCount", [
            iTotalItems,
          ]);
          this.getModel("listView").setProperty("/title", sTitle);
        }
      },

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @private
       */
      _applyFilterSearch: function () {
        var aFilters = this._oListFilterState.aSearch.concat(
            this._oListFilterState.aFilter
          ),
          oViewModel = this.getModel("listView");
        this._oList.getBinding("items").filter(aFilters, "Application");
        // changes the noDataText of the list in case there are no filter results
        if (aFilters.length !== 0) {
          oViewModel.setProperty(
            "/noDataText",
            this.getResourceBundle().getText(
              "listListNoDataWithFilterOrSearchText"
            )
          );
        } else if (this._oListFilterState.aSearch.length > 0) {
          // only reset the no data text to default when no new search was triggered
          oViewModel.setProperty(
            "/noDataText",
            this.getResourceBundle().getText("listListNoDataText")
          );
        }
      },

      /**
       * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
       * @param {string} sFilterBarText the selected filter value
       * @private
       */
      _updateFilterBar: function (sFilterBarText) {
        var oViewModel = this.getModel("listView");
        oViewModel.setProperty(
          "/isFilterBarVisible",
          this._oListFilterState.aFilter.length > 0
        );
        oViewModel.setProperty(
          "/filterBarLabel",
          this.getResourceBundle().getText("listFilterBarText", [
            sFilterBarText,
          ])
        );
      },
    });
  }
);
