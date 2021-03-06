﻿define(['jshelper', 'slickgrid'], function ()
{
    var gridOrder = null;
    var dsOrder = [];
    var changedItemsOrder = [];
    var dataViewOrder;
    var columns = [
     { id: "id", name: "采购订单编号", field: "ID", width: 70, cssClass: "cell-title" },
     { id: "ProductName", name: "产品名称", field: "ProductName", width: 60 },
     { id: "BuyAmount", name: "购买数量", field: "BuyAmount", editor: Slick.Editors.Text },
     { id: "%", name: "% 折扣率", field: "DiscountPercentage", width: 80, resizable: false, formatter: Slick.Formatters.PercentCompleteBar, editor: Slick.Editors.PercentComplete },
     { id: "BuyDate", name: "购买日期", field: "BuyDate", minWidth: 60, editor: Slick.Editors.Date },
     { id: "BuyPerson", name: "购买人", field: "BuyPerson", editor: Slick.Editors.Text },
     { id: "IsArrivaled", name: "是否到货", width: 80, minWidth: 20, maxWidth: 80, cssClass: "cell-effort-driven", field: "IsArrivaled", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox },
     //{ id: "IsArrivaled", name: "是否到货", width: 80, minWidth: 20, maxWidth: 80, cssClass: "cell-effort-driven", field: "IsArrivaled", editor: Slick.Editors.SelectCell },
     { id: "ArrivaledDate", name: "到货日期", field: "ArrivaledDate", minWidth: 60, editor: Slick.Editors.Date },
     { id: "Notes", name: "备注", field: "Notes", width: 120, editor: Slick.Editors.LongText }
    ];

    //添加复选框列
    var checkboxSelctor = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });
    columns.splice(0, 0, checkboxSelctor.getColumnDefinition());

    var options = {
        editable: true,
        enableAddRow: true,
        enableCellNavigation: true,
        asyncEditorLoading: true,
        forceFitColumns: false,
        enableColumnReorder: false
    };

    function init() {
        var productId = $("#hdnShowOrderListByProductId").val();
        if (productId == undefined) {
            $.doHttpClientGet("/ProductSys.WebAPI/api/OrderView/Get", function (dataJson) {
                dsOrder = dataJson;
                InitializeSlickGridData();
            });
        }
        else {
            var apiUrl = "/ProductSys.WebAPI/api/OrderView/Get" + "?ProductId=" + productId;
            $.doHttpClientGet(apiUrl, function (dataJson) {
                dsOrder = dataJson;
                InitializeSlickGridData();
            });
        }
    }

    //初始化并加载数据
    function InitializeSlickGridData() {
        dataViewOrder = new Slick.Data.DataView({ inlineFilters: true });
        gridOrder = new Slick.Grid("#myGridOrder", dataViewOrder, columns, options);
        gridOrder.setSelectionModel(new Slick.RowSelectionModel());
        //gridOrder.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: true }));
        var pager = new Slick.Controls.Pager(dataViewOrder, gridOrder, $("#myPagerOrder"));
        var columnpicker = new Slick.Controls.ColumnPicker(columns, gridOrder, options);

        //注册复选框
        gridOrder.registerPlugin(checkboxSelctor);

        gridOrder.onAddNewRow.subscribe(function (e, args) {
            var item = args.item;
            gridOrder.invalidateRow(dsOrder.length);
            dsOrder.push(item);
            gridOrder.updateRowCount();
            gridOrder.render();
        });

        gridOrder.onCellChange.subscribe(function (e, args) {
            var item = args.item;
            changedItemsOrder.push(item);
            dataViewOrder.updateItem(item.id, item);
        });

        dataViewOrder.onRowsChanged.subscribe(function (e, args) {
            gridOrder.invalidateRows(args.rows);
            gridOrder.render();
        });

        // wire up model events to drive the grid
        dataViewOrder.onRowCountChanged.subscribe(function (e, args) {
            gridOrder.updateRowCount();
            gridOrder.render();
        });

        dataViewOrder.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
            var isLastPage = pagingInfo.pageNum == pagingInfo.totalPages - 1;
            var enableAddRow = isLastPage || pagingInfo.pageSize == 0;
            var options = gridOrder.getOptions();
        })

        dataViewOrder.beginUpdate();
        dataViewOrder.setItems(dsOrder, "ID");
        dataViewOrder.endUpdate();
        dataViewOrder.syncGridSelection(gridOrder, true);
    }

    //button click event
    function onAddClick() {
        var url = "/RequireMVC199/Order/Create";

        $("#orderFormFancybox").attr("href", url);
        $("#orderFormFancybox").click();
    };

    function getSelectedDataItem() {
        var selectedDataItem;
        var indexs = gridOrder.getSelectedRows();

        if (indexs != null && indexs[0] >= 0) {
            selectedDataItem = dataViewOrder.getItemByIdx(indexs[0]);
        }
        return selectedDataItem;
    }

    function onEditClick() {
        var item = getSelectedDataItem();
        var id = item.ID;
        var url = "/RequireMVC199/Order/Detail/" + id;

        $("#orderFormFancybox").attr("href", url);
        $("StorageFormFancybox").attr("display", "inline");
        $("#orderFormFancybox").click();
    };

    function onDeleteClick()  {
        var delData = [];
        var isOk = confirm("确实要删除吗?");
        if (isOk) {
            var item = getSelectedDataItem();
            if (item != null && item.ID >= 0) {
                delData.push(item.ID);
                var jsonValue = JSON.stringify(delData);
                $.doAjaxPost(
                    '/RequireMVC199/Order/Delete',
                    jsonValue,
                    function (data) {
                        alert(data);
                        //重新刷新页面
                        window.location.reload();
                    });
            }
            else {
                alert("请选中要删除的记录，然后再删除!");
            }
        }
    };

    function onSaveClick() {
        var jsonOrder = JSON.stringify(changedItemsOrder);
        $.doHttpClientUpdate(
            '/ProductSys.WebAPI/api/OrderView',
            jsonOrder,
            function (data) {
                alert(data);
            });
        clearChangedItems();
    };

    function clearChangedItems() {
        changedItemsOrder = [];
    };

    //初始化操作
    init();

    return {
        onAddClick: onAddClick,
        onEditClick: onEditClick,
        onDeleteClick: onDeleteClick,
        onSaveClick: onSaveClick
    }

})