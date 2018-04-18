
$(document).ready(function () {
    
    $("#restButton").click(restAPi)
    
    $("#expandButton").click(expand)
    $("#createListButton").click(createList)

    $("#callToExternalServiceButton").click(callToExternalService)

    $("#callToHostButton").click(callToHost)
});

function restAPi() {
    //var context = SP.ClientContext.get_current()
    //var web = context.get_web();
    //var lists = web.get_lists()
    //var myLists = context.loadQuery(lists)
    ////context.load(lists);
    //context.executeQueryAsync(sucess, fail);
    var call1 = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web?$select=Title",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });
    var call2 = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists?$select=Title,Hidden,ItemCount&$orderby=ItemCount&$filter=(Hidden eq false) and (ItemCount gt 0)",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });

    var calls = $.when(call1, call2);
    

    calls.done(function (callback1,callback2) {
        var message = $("#message");
        //message.text(web.get_title());


        //message.append("<br/>");
        message.text("Lists in" + callback1[0].d.Title);
        message.append("<br/>")
        message.append("Lists")
        message.append("<br/>")
        $.each(callback2[0].d.results, function (index, value) {
            message.append(String.format("List {0} has {1} items and is {2} hidden",
                value.Title, value.ItemCount, value.Hidden ? "" : "Not"))
            message.append("<br/>")
        })
    });

    calls.fail(function (jqXHR, testStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);
        var message = response ? response.error.message.value : null;
        alert("Call failed: " + message);
    });


}


function expand() {
    //var context = SP.ClientContext.get_current()
    //var web = context.get_web();
    //var lists = web.get_lists()
    //var myLists = context.loadQuery(lists)
    ////context.load(lists);
    //context.executeQueryAsync(sucess, fail);
    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web?$select=Title,Lists/Title,Lists/Hidden,Lists/ItemCount&$expand=Lists",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });
   

    call.done(function (data,textStatus,jqXHR) {
        var message = $("#message");
       
        message.text("Lists in" + data.d.Title);
        message.append("<br/>")
        message.append("Lists")
        message.append("<br/>")
        $.each(data.d.Lists.results, function (index, value) {
            message.append(String.format("List {0} has {1} items and is {2} hidden",
                value.Title, value.ItemCount, value.Hidden ? "" : "Not"))
            message.append("<br/>")
        })
    });

    call.fail(function (jqXHR, testStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);
        var message = response ? response.error.message.value : null;
        alert("Call failed: " + message);
    });

}

function createList() {
    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "_/api/Web/Lists",
        type: "POST",
        data: JSON.stringify({
            "__metadata": { "type": "SP.List" },
            BaseTemplate: SP.ListTemplateType.tasks,
            Title:"Tasks"
        }),
        headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest":$("#__REQUESTDIGEST").val()
        }
    });

    call.done(function (data, textStatus, jqXHR) {
        var message = $("#message");
        message.text("List added")
    })

    call.fail(function (jqXHR, testStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);
        var message = response ? response.error.message.value : null;
        alert("Call failed: " + message);
    });
}

function callToExternalService() {
    //var context = SP.ClientContext.get_current()
    //var web = context.get_web();
    //var lists = web.get_lists()
    //var myLists = context.loadQuery(lists)
    ////context.load(lists);
    //context.executeQueryAsync(sucess, fail);
    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/SP.WebProxy.invoke",
        type: "POST",
        data: JSON.stringify({
            "requestInfo": {
                "__metadata": { "type": "SP.WebRequestInfo" },
                "Url": "http://services.odata.org/V3/Northwind/Northwind.svc/Categories?$format=json",
                "Method": "GET"
            }
           
        }),
        
        headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        }
    });


    call.done(function (data, textStatus, jqXHR) {
        

        if (data.d.Invoke.StatusCode == 200) {
            var categories = JSON.parse(data.d.Invoke.Body);
            var message = $("#message");
            message.text("Categories in  the remote NorthWind service");
            message.append("<br/>");
            $.each(categories.value, function (index, value) {

                message.append(value.CategoryName);
                message.append("<br/>");
            }
            )


        } else {

            var errorMessage = data.d.invoke.Body;
            alert(errorMessage);

        }


    });

    call.fail(function (jqXHR, testStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);
        var message = response ? response.error.message.value : null;
        alert("Call failed: " + message);
    });

}

function callToHost() {
    var hosturl = decodeURIComponent(getQueryStringParameter("SPHostUrl"));
    var appurl = decodeURIComponent(getQueryStringParameter("SPAppWebUrl"));

    var scriptbase=hosturl+"/_layouts/15/"

    $.getScript(scriptbase + "SP.RequestExecutor.js", getItems)

    function getItems() {
        var executor = new SP.RequestExecutor(appurl);
        var url = appurl + "_api/SP.AppContextSite(@target)/Web/Lists/getByTitle('ColumnFormatter')/Items?$select=Title&@target='" + hosturl + "'";
        executor.executeAsync({
            url: url,
            method: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            },
            success: success,
            error: error

        })

    }
   

    function success(data, textStatus, jqXHR) {
        var response=JSON.parse(data.body)
        var message = $("#message");

        message.text("Host Web List Items");
        message.append("<br/>")
        message.append("Column Formatter List Items")
        message.append("<br/>")
        $.each(response.d.results, function (index, value) {
            message.append(value.Title)
            message.append("<br/>")
        })
    };

    function error (jqXHR, testStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);
        var message = response ? response.error.message.value : null;
        alert("Call failed: " + message);
    };

}

function getQueryStringParameter(paramToRetrieve) {
    var params = document.URL.split("?")[1].split("&");
    var strParams = "";

    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve)
            return singleParam[1];
    }
}