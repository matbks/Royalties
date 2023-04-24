sap.ui.define(
  [
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "./BadiOnClose",
  ],
  function (
    Filter,
    FilterOperator,
    SelectDialog,
    StandardListItem,
    OnCloseValueHelpBadi
  ) {
    "use strict";

    return {
      createSearchHelp: function (
        oParentView, // this.getView() de onde o value help é chamado
        title, // título da janela do value help
        entitySet, // entitySet que provém os dados do value hlep
        key, // chave value help ( valor que será utilizado, ex: código do BP )
        description, // descrição da chave do value help ( ex: Descrição do BP)
        oSource, // oEvent.getSource() de onde o value help é chamado,
        filterName,
        filterValue,
        filter2Name,
        filter2Value,
        helpColumns
      ) {
        this.oSource = oSource;
        this.key = key;
        this.description = description;
        this.oParentView = oParentView;

        // Criação do dialog
        var oSelectDialog = new SelectDialog({
          title: title,
          search: this._onValueHelpSearch.bind(this),
          confirm: this._onValueHelpClose.bind(this),
          cancel: this._onValueHelpClose.bind(this),
        });

        if (helpColumns) {
          helpColumns;
        } else {
          // Criação do template do item do dialog
          var oItemTemplate = new StandardListItem({
            title: "{" + key + "}",
            description: "{" + description + "}",
          });
        }

        var aFilters = [];

        if (filterValue && filterName) {
          // Create the filter object
          var oFilter = new sap.ui.model.Filter(
            filterName,
            sap.ui.model.FilterOperator.EQ,
            filterValue
          );

          aFilters.push(oFilter);

          if (filter2Value && filter2Name) {
            var oFilter2 = new sap.ui.model.Filter(
              filter2Name,
              sap.ui.model.FilterOperator.EQ,
              filter2Value
            );

            aFilters.push(oFilter2);
          }

          // Bind the aggregation with the filter
          oSelectDialog.bindAggregation("items", {
            path: entitySet,
            template: oItemTemplate,
            filters: aFilters,
          });
        } else {
          oSelectDialog.bindAggregation("items", entitySet, oItemTemplate);
        }

        // Definição da coleção de items do dialog
        // oSelectDialog.bindAggregation("items", entitySet, oItemTemplate);

        oParentView.addDependent(oSelectDialog);

        return oSelectDialog;
      },

      _onValueHelpSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");

        var oFilterTitle = new Filter(
          this.key,
          FilterOperator.Contains,
          sValue
        );

        var oFilterDescription = new Filter(
          this.description,
          FilterOperator.Contains,
          sValue
        );

        var oFilters = new Filter({
          filters: [oFilterTitle, oFilterDescription],
          and: false,
        });

        oEvent.getSource().getBinding("items").filter(oFilters);
      },

      _onValueHelpClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        if (oSelectedItem) {
          oSelectedItem = oSelectedItem.mProperties.title;

          debugger;
          OnCloseValueHelpBadi.run(
            oEvent,
            oSelectedItem,
            oEvent.getSource().getParent()
          );

          oEvent.getSource().getBinding("items").filter([]);

          if (!oSelectedItem) {
            return;
          }

          if (oSelectedItem.getTitle())
            this.oSource.setValue(oSelectedItem.getTitle);
        }
      },
    };
  }
);
