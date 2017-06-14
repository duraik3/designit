var productID = 1035;
//var templateURL = './svgwithtext.svg';

//var templateURL = './w_s_s_open.svg';
// var templateURL = './w_s_s_golf_club_ai.svg';
// var templateURL = './crew_front.png';
//var templateURL = './w_s_s_golf_club_ai.svg';
//var templateURL = './w_s_s_golf_club_cdr.svg';


var canvasindex = 0;
var currentcanvas;
var currentcanvasid;
var selectedObject;
var memorystack = new Array();
var memorystackindex = 0;
var captureinstack = true;
var saveButtonEle;

var const_pixel_mm = 96 / 25.4;<script   src="https://code.jquery.com/ui/1.11.4/jquery-ui.min.js"   integrity="sha256-xNjb53/rY+WmG+4L6tTl9m6PpqknWZvRt0rO1SRnJzw="   crossorigin="anonymous"></script>
=======
var const_pixel_mm = 96 / 25.4;

var autoSaveInterval = 60 * 1000; //auto save in ms
var dialog, form;

var const_color = ["white", "lightgrey", "red", "yellow", "lightgreen", "lightblue", "pink", "black", "grey", "brown", "orange", "green", "blue", "purple"],
    const_color_value = ["white", "#D3D3D3", "#D30008", "#ECE824", "#8FDB21", "#159CD8", "#CB89BB", "black", "#6F6F6F", "#993229", "#F57E20", "#008C4A", "#0059B4", "#75449A"],
    const_pixel_mm = 96 / 25.4;
var shapeList = [{
    'imageurl': '../modules/designer/css/shape/01.svg',
    'keyword': ['aaa'],
    'categories': ['A']
}, {
    'imageurl': '../modules/designer/css/shape/02.svg',
    'keyword': ['bbb', 'ccc'],
    'categories': ['A', 'B']
}];

function pixel2mm(num) {
    return num / const_pixel_mm;
}

function mm2pixel(num) {
    return num * const_pixel_mm;
}
$(document).ready(function() {

    if (productID == 0) alert("Missing product ID, do not continue. Please refresh this page or contact suppport if the problem occurs again");

    initPanel();
    initShape();

    addNewPage();

    document.getElementById("heightCanvas").addEventListener("change", changeSizeCustom);
    document.getElementById("widthCanvas").addEventListener("change", changeSizeCustom);
    document.getElementById("selectionLengthCanvas").addEventListener("change", changeSizeDropDown);

    document.getElementById("LogoButton").addEventListener("click", goBackToOrder);
    document.getElementById("LogoButton").addEventListener("click", goBackToOrder);
    document.getElementById("LogoButton").addEventListener("click", goBackToOrder);

    document.getElementById("GroupButton").addEventListener("click", groupObjects);
    document.getElementById("UnGroupButton").addEventListener("click", unGroupObjects);

    //define the event listeners.
    document.getElementById("AddTextButton").addEventListener("click", AddTextAction);
    document.getElementById('strokeWidth').addEventListener('change', applyStrokeWidth);
    //document.getElementById('textContent').addEventListener('input', changeTextContent);
    document.getElementById('fontSize').addEventListener('change', changeFontSize);
    document.getElementById('fontSelect').addEventListener('change', changeFontFamily);
    document.getElementById('boldText').addEventListener('change', changeFontBold);
    document.getElementById('italicText').addEventListener('change', changeFontItalic);
    document.getElementById('underlineText').addEventListener('change', changeFontUnderline);
    tmp = document.getElementsByName('textAlign');
    for (i = 0; i < tmp.length; ++i) tmp[i].addEventListener('change', changeFontAlign);
    tmp = document.getElementsByClassName('layerbutton front');
    for (i = 0; i < tmp.length; ++i) tmp[i].addEventListener('click', layerFront);
    tmp = document.getElementsByClassName('layerbutton back');
    for (i = 0; i < tmp.length; ++i) tmp[i].addEventListener('click', layerBack);
    document.getElementById('fadeImage').addEventListener('input', changeImageOpacity);
    document.getElementById('fadeShape').addEventListener('input', changeImageOpacity);
    
    document.getElementById('convertWhiteToTransparent').addEventListener('change',changeImageWhiteToTransparent);
	
    document.getElementById("shapeVFlip").addEventListener("change", vflipShape);
    document.getElementById("shapeHFlip").addEventListener("change", hflipShape);

    document.getElementById("ShapesButton").addEventListener("click", showClipArtShapes);

    document.getElementById("DeleteButton").addEventListener("click", deleteSelObject);
    document.getElementById("CloneButton").addEventListener("click", cloneSelObject);

    document.getElementById("UploadButton").addEventListener("click", UploadAction, false);
    document.getElementById('UploadImage').addEventListener('change', FileUploadAction);

    document.getElementById("UndoButton").addEventListener("click", undo);
    document.getElementById("RedoButton").addEventListener("click", redo);

    document.getElementById("ZoomInButton").addEventListener("click", zoomIn);
    document.getElementById("ZoomOutButton").addEventListener("click", zoomOut);

    //document.getElementById("ZoomReset").addEventListener("click", zoomReset);

    document.getElementById("ZoomReset").addEventListener("click", zoomReset);

    $("#ZoomFactorInput").val(canvasScale * 100);

    saveButtonEle = document.getElementById("SaveButton");
    saveButtonEle.addEventListener("click", SaveDraftAction);
    setTimeout(SaveDraftAction, autoSaveInterval);

    document.getElementById("uploadbackgroundbutton").addEventListener("click", BackgroundImageAction);
    document.getElementById("BackgroundUploadImage").addEventListener("change", BackgroundImageUploadAction);
    document.getElementById("removebackgroundbutton").addEventListener("click", RemoveBackgroundImage);

    window.addEventListener('keydown', KeyManager);

    var iscanvasclicked = false;
    $("canvas").on("click", function() {
        iscanvasclicked = true;
    });

    $("#drawcanvas").on("click", function() {
        if (!iscanvasclicked) {
            minimizeAllPanels();
            $("#backgroundPanel").addClass('selected');
		currentcanvas.deactivateAll().renderAll();
		currentcanvas.renderAll();
        } else {
            iscanvasclicked = false;
        }
    });

    dialog = $("#dialog-form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Create New Page": function() {;
                var ispagecreated = addNewPage();
                if (ispagecreated) {
                    //$(this).dialog("close");
                }
            },
            Cancel: function() {
                dialog.dialog("close");
            }
        },
        close: function() {
            form[0].reset();
        }
    });

    form = dialog.find("form").on("submit", function(event) {
        event.preventDefault();
        addNewPage();
    });

    $("#addnewslide").button().on("click", function() {
        dialog.dialog("open");
    });


    /***************COLOR PICKER**************************/
    //ColorPicker class: It's the colorpicker. If you choose a color, it will check with itself (background colorpicker, text colorpicker or shape colorpicker), then it change the selectedObject's color
    //changeColor: use the value of the clicked button (color value), its type to change selectedObject color
    //customColor: append a new custom color button 
    //callback: initialize
    var ColorPickerButtonProto = Object.create(HTMLDivElement.prototype, {
        PickColor: {
            value: function(e) {
                this.parentNode.changeColor(e.target.parentNode.id, this.getAttribute("value"));
            }
        }
    });
    ColorPickerButtonProto.createdCallback = function() {
        this.addEventListener('click', this.PickColor);
    };
    var ColorPickerButton = document.registerElement('color-picker-button', {
        prototype: ColorPickerButtonProto
    });
    var ColorPickerProto = Object.create(HTMLDivElement.prototype, {
        changeColor: {
            value: function(type, color) {
                if ((color == "na") || (color == "none")) {
                    this.lastElementChild.click();
                    return;
                }

                var elementstyle, cssstyle, elementobj;
                switch (type) {
                    case "textColorPicker":
                        elementstyle = "color";
                        cssstyle = "color";

                        if (selectedObject) {
                            selectedObject.fill = color;
                            currentcanvas.renderAll();
                            if (captureinstack)
                                addtomemorystack(selectedObject, "modified");
                        }
                        break;
                    case "outlinepenColorPicker":
                        elementstyle = "color";
                        cssstyle = "color";

                        if (selectedObject) {
                            selectedObject.stroke = color;
                            currentcanvas.renderAll();
                            if (captureinstack)
                                addtomemorystack(selectedObject, "modified");
                        }
                        break;
                    case "backgroundColorPicker":
                        elementstyle = "backgroundColor";
                        cssstyle = "background-color";

                        currentcanvas.backgroundColor = color;
                        currentcanvas.renderAll();
                        break;
                    case "shapeColorPicker":
                        elementstyle = "fill";
                        cssstyle = "fill";
                        if (selectedObject.type == 'path-group' && selectedObject.paths) {
                            for (var i = 0; i < selectedObject.paths.length; i++) {
                                selectedObject.paths[i].setFill(color);
                            }
                        } else if (selectedObject) {
                            selectedObject.fill = color;
                            if (captureinstack)
                                addtomemorystack(selectedObject, "modified");
                        }
                        currentcanvas.renderAll();
                        selectedObject.innerDocumentColor = color;
                        break;
                    default:
                        break;
                }
            }
        },
        customColor: {
            value: function(e) {
                e.target.parentNode.changeColor(e.target.parentNode.id, e.target.value);
                var i, pickers = e.target.parentNode.getElementsByClassName("picker");
                for (i = 0; i < pickers.length; ++i)
                    if (pickers[i].getAttribute("value") == e.target.value) return;

                var pickerheader = e.target.parentNode.getElementsByClassName("picker header")[0];
                pickerheader.style.backgroundColor = e.target.value;
                pickerheader.setAttribute("value", e.target.value);
                pickerheader.classList.remove("header");
                if (pickerheader.nextElementSibling.getAttribute("value") != "na") pickerheader.nextElementSibling.classList.add("header");
                else e.target.parentNode.getElementsByClassName("picker")[0].classList.add("header");
            }
        }
    });
    ColorPickerProto.createdCallback = function() {
        var i, button;
        for (i = 0; i < const_color.length; ++i) {
            button = new ColorPickerButton();
            button.classList.add(const_color[i]);
            button.setAttribute('value', const_color_value[i]);
            this.appendChild(button);
        }
        button = document.createElement("div");
        button.classList.add("divider");
        this.appendChild(button);

        for (i = 0; i < 6; ++i) {
            button = new ColorPickerButton();
            button.classList.add("picker");
            if (i == 0) button.classList.add("header");
            button.setAttribute('value', "none");
            this.appendChild(button);
        }
        button = new ColorPickerButton();
        button.classList.add("colorpicker");
        button.setAttribute('value', "na");
        this.appendChild(button);

        button = document.createElement('input');
        button.setAttribute('type', 'color');
        button.addEventListener('change', this.customColor)
        this.appendChild(button);
    };
    var ColorPicker = document.registerElement('color-picker', {
        prototype: ColorPickerProto
    });

    /************************/
});

function addNewPage() {

    if (document.getElementById(currentcanvasid)) {
        document.getElementById(currentcanvasid).zoomvalue = canvasScale;
        document.getElementById(currentcanvasid).memorystack = memorystack;
        document.getElementById(currentcanvasid).memorystackindex = memorystackindex;

        currentcanvas.discardActiveGroup();
        currentcanvas.renderAll();

        document.getElementById(currentcanvasid + "div").style.display = "none";
    }

    canvasScale = 1
    $("#ZoomFactorInput").html(Math.round(canvasScale * 100));
    memorystack = new Array();
    memorystackindex = 0;

    selectedObject = "";

    currentcanvasid = "canvas" + canvasindex;
    var div = document.createElement('div');
    div.id = currentcanvasid + "div";
    div.className = "canvasborder";
    document.getElementById("canvasbox").appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.id = currentcanvasid;
    document.getElementById(div.id).appendChild(canvas);

    //canvas -- fabric canvas object. initialize fabric canvas object.
    currentcanvas = new fabric.Canvas(canvas.id);
    currentcanvas.backgroundColor = "white";

    currentcanvas.calcOffset();
    currentcanvas.renderAll();

    changeSizeDropDown();

    document.getElementById(canvas.id).fabric = currentcanvas;

    initCanvasEvents();

    try {
        //if (productID == localStorage.productID) LoadDraftAction()
        //else if (templateURL != '') loadSVGTemplate(templateURL);
        loadSVGTemplate(templateURL);
    } catch (e) {
        console.log(e);
    }

    return true;
}

function initCanvasEvents() {
    //canvas events.
    currentcanvas.observe('object:selected', function(e) {

        selectedObject = e.target;
        $("#DeleteButton").removeClass('disabled').addClass('enabled');
        $("#CloneButton").removeClass('disabled').addClass('enabled');

        $("#GroupButton").removeClass('disabled').addClass('enabled');
        $("#UnGroupButton").removeClass('disabled').addClass('enabled');

	if(selectedObject.cacheTransImgTik == 1) {
		document.getElementById('convertWhiteToTransparent').checked = true;
	}

        if (selectedObject.type == "i-text") {

            $('#fontSelect').find('span').html(selectedObject.fontFamily);
            $('#fontSelect').css('font-family', selectedObject.fontFamily);

            document.getElementById('fontSize').value = selectedObject.fontSize;

            minimizeAllPanels();
            $("#textPanel").addClass('selected');
        } else if (selectedObject.type == "image") {
            minimizeAllPanels();
            $("#photoPanel").addClass('selected');
        } else {
            minimizeAllPanels();
            $("#shapePanel").addClass('selected');
        }
        currentcanvas.renderAll();
    });

    currentcanvas.observe('object:added', function(e) {
        if (captureinstack)
            addtomemorystack(e.target, "added");

        var currentcanvasindex = parseInt(currentcanvasid.replace("canvas", ""));
        if (document.getElementById("canvasthumb" + currentcanvasindex)) {
            document.getElementById("canvasthumb" + currentcanvasindex).src = currentcanvas.toDataURL();
        }
    });

    currentcanvas.observe('object:modified', function(e) {
        if (captureinstack)
            addtomemorystack(e.target, "modified");
        var currentcanvasindex = parseInt(currentcanvasid.replace("canvas", ""));
        if (document.getElementById("canvasthumb" + currentcanvasindex)) {
            document.getElementById("canvasthumb" + currentcanvasindex).src = currentcanvas.toDataURL();
        }
    });


        $('#export-image').on('click', function(e){
            // alert(currentcanvas);
            e.preventDefault();
            window.open(currentcanvas.toDataURL('png'));
        });

        $('#clear-canvas').on('click', function(e){
            e.preventDefault();
            currentcanvas.clear();
        });
    //canvas events.
    currentcanvas.observe('selection:cleared', function(e) {

        $("#DeleteButton").removeClass('enabled').addClass('disabled');
        $("#CloneButton").removeClass('enabled').addClass('disabled');

        $("#GroupButton").removeClass('enabled').addClass('disabled');
        $("#UnGroupButton").removeClass('enabled').addClass('disabled');
        currentcanvas.renderAll();
    });

    //canvas function handler to recieve and process object scaling events.
    currentcanvas.observe('object:scaling', function(e) {

        updatesvggroup(e.target, false);
    });

    //canvas function handler to recieve and process object moving events.
    currentcanvas.observe('object:moving', function(e) {
        updatesvggroup(e.target, false);
    });

    //canvas function handler to recieve and process object rotating events.
    currentcanvas.observe('object:rotating', function(e) {
        updatesvggroup(e.target, true);
    });
}

function removeThumb(canvasid) {

    document.getElementById(canvasid + "li").style.display = "none";
    document.getElementById(canvasid + "div").style.display = "none";
}

function showCanvasDiv(canvasid) {
    document.getElementById(currentcanvasid).zoomvalue = canvasScale;
    document.getElementById(currentcanvasid).memorystack = memorystack;
    document.getElementById(currentcanvasid).memorystackindex = memorystackindex;

    document.getElementById(currentcanvasid + "div").style.display = "none";
    document.getElementById(canvasid + "div").style.display = "block";
    currentcanvasid = canvasid;
    currentcanvas = document.getElementById(canvasid).fabric;

    currentcanvas.calcOffset();
    currentcanvas.renderAll();

    currentcanvas.deactivateAll().renderAll();

    if (document.getElementById(canvasid).zoomvalue) {
        canvasScale = document.getElementById(canvasid).zoomvalue;
        $("#ZoomFactorInput").val(Math.round(canvasScale * 100));
    }
    if (document.getElementById(canvasid).memorystack)
        memorystack = document.getElementById(canvasid).memorystack;
    else
        memorystack = new Array();

    if (document.getElementById(canvasid).memorystackindex)
        memorystackindex = document.getElementById(canvasid).memorystackindex;
    else
        memorystackindex = 0;
}

function addThumb(canvas) {
    var slidetitle = document.getElementById("slidename").value;

    var htmldata = '<li id="canvas' + canvasindex + 'li" class="ui-widget-content ui-corner-tr"><h5 class="ui-widget-header">' + slidetitle + '</h5>' +
        '<a href = "javascript:showCanvasDiv(\'canvas' + canvasindex + '\');"><img id="canvasthumb' + canvasindex + '" src="' + canvas.toDataURL() + '" alt="The peaks of High Tatras" width="96" height="72"></a>' +
        '<a href="javascript:viewLargerImage(' + canvasindex + ',\'' + slidetitle + '\');" title="View larger image" class="ui-icon ui-icon-zoomin">View larger</a>' +
        '<a href="javascript:removeThumb(\'canvas' + canvasindex + '\');" title="Delete this image" class="ui-icon ui-icon-trash">Delete image</a></li>';

    document.getElementById("gallery").innerHTML += htmldata;

    canvasindex++;

    document.getElementById("pagePanel").style.height = "300px";

    dialog.dialog("close");
}

//changeSizeCanvas: change Canvas size
//changeSizeDropDown: change canvas size using dropdown menu
//changeSizeCustom: change canvas size using the textbox on setting panel
function changeSizeCanvas(width, height) {

var canvaWidth = 600;
var canvaHeight = 400; 

    // currentcanvas.width = canvaWidth;
    // currentcanvas.height = canvaHeight;
    currentcanvas.width = mm2pixel(width);
    currentcanvas.height = mm2pixel(height);
    var canvasDOM = document.getElementById(currentcanvasid);

    // canvasDOM.style.width = canvaWidth;
    // canvasDOM.width = canvaWidth;

    // canvasDOM.style.height = canvaHeight;
    // canvasDOM.height = canvaHeight;

    // var canvasDOM = document.getElementById(currentcanvasid + "div");

    // canvasDOM.style.width = canvaWidth;
    // canvasDOM.width = canvaWidth;

    // canvasDOM.style.height = canvaHeight;
    // canvasDOM.height = canvaHeight;

    // var currentcanvasindex = parseInt(currentcanvasid.replace("canvas", ""));

    // var elem = document.getElementsByClassName('upper-canvas')[currentcanvasindex];
    // elem.style.width = canvaWidth;
    // elem.width = canvaWidth;
    // elem.style.height = canvaHeight;
    // elem.height = canvaHeight;

    // var elem = document.getElementsByClassName('canvas-container')[currentcanvasindex];
    // elem.style.width = canvaWidth;
    // elem.width = canvaWidth;
    // elem.style.height = canvaHeight;
    // elem.height = canvaHeight;


// original contents

canvasDOM.style.width = mm2pixel(width) + "px";
    canvasDOM.width = mm2pixel(width);

    canvasDOM.style.height = mm2pixel(height) + "px";
    canvasDOM.height = mm2pixel(height);

    var canvasDOM = document.getElementById(currentcanvasid + "div");

    canvasDOM.style.width = mm2pixel(width) + "px";
    canvasDOM.width = mm2pixel(width);

    canvasDOM.style.height = mm2pixel(height) + "px";
    canvasDOM.height = mm2pixel(height);

    var currentcanvasindex = parseInt(currentcanvasid.replace("canvas", ""));

    var elem = document.getElementsByClassName('upper-canvas')[currentcanvasindex];
    elem.style.width = mm2pixel(width) + "px";
    elem.width = mm2pixel(width);
    elem.style.height = mm2pixel(height) + "px";
    elem.height = mm2pixel(height);

    var elem = document.getElementsByClassName('canvas-container')[currentcanvasindex];
    elem.style.width = mm2pixel(width) + "px";
    elem.width = mm2pixel(width);
    elem.style.height = mm2pixel(height) + "px";
    elem.height = mm2pixel(height);

    currentcanvas.calcOffset();
    currentcanvas.renderAll();

}

function changeSizeDropDown() {
    var lenstr = document.getElementById("selectionLengthCanvas").value,
        width, height;
    if (lenstr == "custom") return;
    height = parseInt(lenstr);
    width = parseInt(lenstr.substring(lenstr.indexOf(" ")));
    document.getElementById("heightCanvas").value = document.getElementById("heightCanvas").defaultValue = height;
    document.getElementById("widthCanvas").value = document.getElementById("widthCanvas").defaultValue = width;

    var oldcanvswidth = currentcanvas.width;
    var oldcanvsheight = currentcanvas.height;
    changeSizeCanvas(width, height);
    resizeCanvasObjects(oldcanvswidth, oldcanvsheight);
    currentcanvas.renderAll();
}

function changeSizeCustom(isresize) {
    var width = document.getElementById("widthCanvas").value,
        height = document.getElementById("heightCanvas").value,
        lenstr = height + " " + width;
    var i, dropdownmenu = document.getElementById("selectionLengthCanvas");
    for (i = 1; i < dropdownmenu.length; ++i)
        if (dropdownmenu.options[i].value == lenstr) {
            dropdownmenu.selectedIndex = i;
            break;
        }
    if (i == dropdownmenu.length) dropdownmenu.selectedIndex = 0;

    var oldcanvswidth = currentcanvas.width;
    var oldcanvsheight = currentcanvas.height;
    changeSizeCanvas(width, height);

    if (isresize)
        resizeCanvasObjects(oldcanvswidth, oldcanvsheight);
    currentcanvas.renderAll();
}

function showClipArtShapes() {
    minimizeAllPanels();
    $("#shapeSelectPanel").addClass('selected');
}

//initPanel: At zero, all panels have length, initPanel saves their rendered length and make everything have zero-length, so it can be animated as scrolling panel later.
//			 Anyone who hardcode this length is a bad programmer. Different OS, different browser gives different render length. That's why.
//changePanel: change the Panel, called when click on the Panel's header
function initPanel() {
    var i;
    allpanel = document.getElementsByClassName("settingPanel");
    allpanelholder = document.getElementById("settingpanelgroup");
    for (i = 0; i < allpanel.length; ++i) {
        allpanel[i].style.height = allpanel[i].offsetHeight + "px";
        allpanel[i].firstElementChild.addEventListener('click', changePanel);
        allpanel[i].classList.remove("selected");
    }
    //allpanel[0].firstElementChild.click();
    //allpanelholder.setAttribute("contextualType","normal");
}

function minimizeAllPanels() {
    $("#backgroundPanel").removeClass('selected');
    //$("#pagePanel").removeClass('selected');
    $("#shapePanel").removeClass('selected');
    $("#textPanel").removeClass('selected');
    $("#photoPanel").removeClass('selected');
}

//initShape: read the shape list, add it to the database, assign keyword, categories.
function initShape() {
    var shapeHolder = document.getElementById("clipArtHolder");
    var i, j, k, element, thumb, categoryList = [];
    if (shapeList == null) return;
    for (i = 0; i < shapeList.length; ++i) {
        element = document.createElement("div");
        element.classList.add("clipartThumb");
        for (j = 0; j < shapeList[i].categories.length; ++j) {
            element.classList.add(shapeList[i].categories[j]);
            for (k = 0; k < categoryList.length; ++k)
                if (categoryList[k] == shapeList[i].categories[j]) break;
            if (k == categoryList.length) categoryList.push(shapeList[i].categories[j])
        }
        for (j = 0; j < shapeList[i].keyword.length; ++j) {
            element.classList.add(shapeList[i].keyword[j]);
            element.title += shapeList[i].keyword[j] + " ";
        }
        thumb = document.createElement("img");
        thumb.src = shapeList[i].imageurl;
        thumb.classList.add("icon");
        element.addEventListener('click', ShapesAction);
        element.appendChild(thumb);
        shapeHolder.appendChild(element);
    }
    categoryList.sort();
    var categoryHolder = document.getElementById("categoryClipArt");
    for (i = 0; i < categoryList.length; ++i) {
        element = document.createElement("option");
        element.textContent = element.value = categoryList[i];
        categoryHolder.appendChild(element);
    }
}

function changePanel(e) {
    if (e.target.parentNode.classList.contains("selected")) {
        e.target.parentNode.classList.remove("selected");
        return;
    }
    for (var i = allpanel.length - 1; i >= 0; --i) allpanel[i].classList.remove("selected");
    e.target.parentNode.classList.add("selected");
}

function vflipShape(e) {
    if (!selectedObject) return;
    if (e.target.checked) {
        if (selectedObject.svgobj) {
            var svggroup = selectedObject.svggroup;
            for (i = 0; i < svggroup.length; i++) {
                svggroup[i].flipY = true;
            }
        }

        selectedObject.flipY = true;
    } else {
        if (selectedObject.svgobj) {
            var svggroup = selectedObject.svggroup;
            for (i = 0; i < svggroup.length; i++) {
                svggroup[i].flipY = false;
            }
        }
        selectedObject.flipY = false;
    }
    if (captureinstack)
        addtomemorystack(selectedObject, "modified");
    currentcanvas.setActiveObject(selectedObject);
    currentcanvas.renderAll();
}

function hflipShape(e) {
    if (!selectedObject) return;
    if (e.target.checked) {
        if (selectedObject.svgobj) {
            var svggroup = selectedObject.svggroup;
            for (i = 0; i < svggroup.length; i++) {
                svggroup[i].flipX = true;
            }
        }

        selectedObject.flipX = true;
    } else {
        if (selectedObject.svgobj) {
            var svggroup = selectedObject.svggroup;
            for (i = 0; i < svggroup.length; i++) {
                svggroup[i].flipX = false;
            }
        }
        selectedObject.flipX = false;
    }
    if (captureinstack)
        addtomemorystack(selectedObject, "modified");
    currentcanvas.setActiveObject(selectedObject);
    currentcanvas.renderAll();
}

function deleteSelObject() {
    if (captureinstack)
        addtomemorystack(selectedObject, "removed");

    if (selectedObject.svgobj) {
        var svggroup = selectedObject.svggroup;
        for (i = 0; i < svggroup.length; i++) {
            currentcanvas.remove(svggroup[i]);
        }
        currentcanvas.remove(selectedObject);
    } else if (selectedObject.type == "group") {
        selectedObject.forEachObject(function(object) {
            currentcanvas.remove(object);
        });
        currentcanvas.remove(selectedObject);
    } else {
        if (selectedObject && !selectedObject.isEditing)
            currentcanvas.remove(selectedObject);
    }

    currentcanvas.renderAll();
}

function cloneSelObject() {

    if (!selectedObject) return;
    if (selectedObject.svgobj && selectedObject.svggroup) {
        var clonesvggroup = new Array();
        var svggroup = selectedObject.svggroup;
        for (i = 0; i < svggroup.length; i++) {
            if (fabric.util.getKlass(svggroup[i].type).async) {
                svggroup[i].clone(function(clone) {
                    clone.set({
                        left: 100,
                        top: 200
                    });
                    currentcanvas.add(clone);
                    clone.svgobj = true;
                    clonesvggroup[clonesvggroup.length] = clone;
                });
            } else {
                var clone = svggroup[i].clone();
                currentcanvas.add(clone);
                clone.svgobj = true;
                clone.offsetleft = svggroup[i].offsetleft;
                clone.offsettop = svggroup[i].offsettop;
                clonesvggroup[clonesvggroup.length] = clone;
            }
        }

        for (i = 0; i < clonesvggroup.length; i++) {
            var obj = clonesvggroup[i];
            obj.svggroup = clonesvggroup;
        };
        updatesvggroup(clonesvggroup[0]);
    } else if (fabric.util.getKlass(selectedObject.type).async) {
        selectedObject.clone(function(clone) {
            clone.set({
                left: 0,
                top: 0
            });
            currentcanvas.add(clone);
        });
    } else {
        currentcanvas.add(selectedObject.clone().set({
            left: 0,
            top: 0
        }));
    }

    currentcanvas.renderAll();
}

//AddTextAction: Add a new text object
function AddTextAction() {
    var iText = new fabric.IText('New Text', {
        left: 0,
        top: 0,
        fontFamily: "Impact",
        fill: '#333'
    });
    currentcanvas.add(iText);
    currentcanvas.renderAll();
}

function ShapesAction(e) {
    fabric.loadSVGFromURL(e.target.src, function(objects, options) {
        var obj = fabric.util.groupSVGElements(objects, options);
        obj.set({
            left: 0,
            top: 0,
            hasRotatingPoint: true
        });

        // put object on the canvas
        currentcanvas.add(obj);

        addtomemorystack(obj, "added");
        currentcanvas.renderAll();
        minimizeAllPanels();
        $("#shapePanel").addClass('selected');
    });
}

//changeFontFamily, changeFontSize, changeFontBold, changeFontItalic, changeFontUnderline, changeFontAlign: change text's style
/*function changeTextContent(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.text = e.target.value;
        selectedObject.setCoords();
        canvas.renderAll();
    }
}*/

function applyStrokeWidth(e) {
    if (selectedObject.type == "i-text") {
        if (e.target.value == 0)
            selectedObject.strokeWidth = e.target.value;
        else
            selectedObject.strokeWidth = e.target.value / selectedObject.scaleX;
        selectedObject.setCoords();
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontFamily(fontname) {

    if (selectedObject.type == "i-text") {
        selectedObject.fontFamily = fontname;
        selectedObject.setCoords();
        currentcanvas.discardActiveGroup();
        currentcanvas.setActiveObject(selectedObject);
        currentcanvas.renderAll();
        currentcanvas.calcOffset();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontSize(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontSize = e.target.value;
        selectedObject.setCoords();
        currentcanvas.setActiveObject(selectedObject);
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontBold(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontWeight = e.target.checked ? "bold" : "normal";
        selectedObject.setCoords();
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontItalic(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontStyle = e.target.checked ? "italic" : "normal";
        selectedObject.setCoords();
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontUnderline(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.textDecoration = e.target.checked ? "underline" : "normal";
        selectedObject.setCoords();
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

function changeFontAlign(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.textAlign = e.target.value;
        selectedObject.setCoords();
        currentcanvas.renderAll();
        if (captureinstack)
            addtomemorystack(selectedObject, "modified");
    }
}

//layerFront, layerBack: move selectedObject to front/back
function layerFront(e) {

    currentcanvas.bringToFront(selectedObject);
    selectedObject.setCoords();
    currentcanvas.renderAll();
}

function layerBack(e) {

    currentcanvas.sendToBack(selectedObject);
    selectedObject.setCoords();
    currentcanvas.renderAll();
}

//changeImageOpacity: fade image
function changeImageOpacity(e) {
    selectedObject.opacity = e.target.value / 100;
    selectedObject.setCoords();
    currentcanvas.renderAll();
    if (captureinstack)
        addtomemorystack(selectedObject, "modified");
}

function KeyManager(e) {
    var flag, sflag = false;
    if (flag = e.keyCode == 46) deleteSelObject();
    sflag = sflag || flag;
    if (flag = e.keyCode == 90 && e.ctrlKey) undo();
    sflag = sflag || flag;
    if (flag = e.keyCode == 89 && e.ctrlKey) redo();
    sflag = sflag || flag;
    if (flag = e.keyCode == 67 && e.ctrlKey) CopyAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 88 && e.ctrlKey) CutAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 86 && e.ctrlKey) PasteAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 83 && e.ctrlKey) SaveDraftAction();
    sflag = sflag || flag;
    if ((e.keyCode == 107 || e.keyCode == 187)) zoomIn();
    sflag = sflag || flag;
    if ((e.keyCode == 109 || e.keyCode == 189)) zoomOut();
    sflag = sflag || flag;
    if (sflag) e.preventDefault();
}

var cutObject;
var copiedObject;

function CutAction() {
    cutObject = currentcanvas.getActiveObject();
    currentcanvas.deactivateAll().renderAll();
    cutObject.opacity = 0;
    cutObject.selectable = false;
    currentcanvas.renderAll();
}

function CopyAction() {
    copiedObject = currentcanvas.getActiveObject();
}

function PasteAction() {

    if (cutObject) {
        cutObject.opacity = 1;
        cutObject.left = 100;
        cutObject.top = 200;
        cutObject.selectable = true;
        cutObject.setCoords();
        cutObject = "";
        currentcanvas.renderAll();
    }

    if (!copiedObject) return;

    if (fabric.util.getKlass(copiedObject.type).async) {
        copiedObject.clone(function(clone) {
            clone.set({
                left: 0,
                top: 0
            });
            currentcanvas.add(clone);
        });
    } else {
        currentcanvas.add(copiedObject.clone().set({
            left: 0,
            top: 0
        }));
    }
    currentcanvas.renderAll();
    copiedObject = "";
}

//FileUploadAction: Handle the user photo, convert it to base64 (why dont we just make blob url ? What if user move the photo ? Dont be lazy)
function UploadAction() {
    document.getElementById("UploadImage").click();
}

function FileUploadAction(e) {
    var file = this.files[0];
    if (!file.type || !file.type.match(/image.*/)) {
        alert("This file is not supported!");
        return;
    }
    if (file.type.match(/image.svg/)) {

        var fr = new FileReader;
        fr.onload = function() { // file is loaded
            var svgsrc = fr.result.replace('data:image/svg+xml;base64,', "");
            svgsrc = window.atob(decodeURIComponent(svgsrc));
            //console.log(svgsrc)
            fabric.loadSVGFromString(svgsrc, function(objects, options) {

                var svggroup = new Array();
                for (i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    obj.set(options);
                    obj.selectable = true;
                    obj.originX = 'center';
                    obj.originY = 'center';
                    obj.hasRotatingPoint = false;

                    if (obj.type == "text") {

                        console.log(obj)
                        var iText = new fabric.IText(obj.text, {
                            left: obj.left,
                            top: obj.top,
                            fontFamily: obj.fontFamily,
                            fontSize: obj.fontSize,
                            fill: obj.fill,
                            scaleX: obj.scaleX,
                            scaleY: obj.scaleY,
                            originX: obj.originX,
                            originY: obj.originY,
                            hasRotatingPoint: false
                        });
                        objects[i] = iText;
                        obj = iText;
                    }
                    currentcanvas.add(obj);

                    obj.svgobj = true;
                    svggroup[svggroup.length] = obj;
                    if (obj.type == "i-text") {
                        obj.offsetleft = obj.left;
                        obj.offsettop = obj.top;
                    }

                    obj.setCoords();
                    obj.visible = svgsrc;
                };

                var mainobjtop = 0,
                    mainobjleft = 0;
                for (i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    if (obj.type != "i-text") {
                        mainobjleft = obj.left - obj.width / 2;
                        mainobjtop = obj.top - obj.height / 2;
                    }
                    if (obj.type == "i-text") {
                        currentcanvas.bringToFront(obj);
                        obj.left = mainobjleft + obj.width / 2 + obj.offsetleft;
                        obj.top = mainobjtop - obj.height / 2 + obj.offsettop;
                        obj.setCoords();
                    }
                    obj.svggroup = svggroup;
                };

                updatesvggroup(objects[0])
            }, function(el, obj) {

                if (el.transform.baseVal.numberOfItems > 0) {
                    var xforms = el.transform.baseVal; // An SVGTransformList
                    var firstXForm = xforms.getItem(0); // An SVGTransform
                    if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                        var firstX = firstXForm.matrix.e,
                            firstY = firstXForm.matrix.f;
                        //console.log(firstX, firstY);
                        obj.left = firstX;
                        obj.top = firstY;
                        obj.offsetleft = firstX;
                        obj.offsettop = firstY;
                    }
                }
            });
            document.getElementById("UploadImage").value = '';
        };
        fr.readAsDataURL(file);

    } else {

        var fr = new FileReader;
        fr.onload = function() { // file is loaded
            fabric.util.loadImage(fr.result, function(img) {
                var object = new fabric.Image(img);
                object.set({
                    left: 0,
                    top: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    hasRotatingPoint: true
                });
                currentcanvas.add(object);

                addtomemorystack(object, "added");
                currentcanvas.renderAll();
                minimizeAllPanels();
                $("#photoPanel").addClass('selected');
            });
            document.getElementById("UploadImage").value = '';
        };
        fr.readAsDataURL(file);
    }

}

function BackgroundImageAction(e) {
    document.getElementById("BackgroundUploadImage").click();
}

function BackgroundImageUploadAction(e) {
    var file = this.files[0];
    if (!file.type || !file.type.match(/image.*/)) {
        alert("This file is not supported!");
        return;
    }

    var fr = new FileReader;
    fr.onload = function() {
        var image = new Image();
        image.onload = function() {
            var imgwidth = this.width;
            currentcanvas.setBackgroundImage(fr.result, currentcanvas.renderAll.bind(currentcanvas), {
                scaleX: currentcanvas.width / imgwidth,
                scaleY: currentcanvas.height / imgwidth
            });
            currentcanvas.renderAll();
        };
        image.src = fr.result;
    };

    fr.readAsDataURL(file);
}

function RemoveBackgroundImage(e) {
    currentcanvas.setBackgroundImage("", currentcanvas.renderAll.bind(currentcanvas));
    currentcanvas.renderAll();

}

function undo() {
    captureinstack = false;

    console.log(memorystackindex)

    memorystackindex--;

    if (memorystackindex < 0) {
        memorystackindex = 0;
        captureinstack = true;
        return false;
    }

    var objectprops = memorystack[memorystackindex];

    console.log(objectprops.action)

    if (objectprops.action == "modified" || objectprops.action == "selected") {

        if (objectprops.action == "selected" && memorystackindex != 0) {
            memorystackindex--;
            undo();
        }

        objectprops.object.set({
            left: objectprops.left,
            top: objectprops.top,
            angle: objectprops.angle,
            scaleX: objectprops.scalex,
            scaleY: objectprops.scaley,
            flipX: objectprops.flipx,
            flipY: objectprops.flipy,
            originX: objectprops.originx,
            originY: objectprops.originy,
            fill: objectprops.fill,
            stroke: objectprops.stroke,
            strokeWidth: objectprops.strokewidth,
            opacity: objectprops.opacity
        });

        if (objectprops.object.type == "i-text") {
            objectprops.object.set({
                fontFamily: objectprops.fontfamily,
                fontWeight: objectprops.fontweight,
                fontStyle: objectprops.fontstyle,
                textDecoration: objectprops.textdecoration,
                textAlign: objectprops.textalign
            });
        }

        objectprops.object.setCoords();
        updatesvggroup(objectprops.object);
        currentcanvas.setActiveObject(objectprops.object);
        currentcanvas.renderAll();
    } else if (objectprops.action == "added") {
        currentcanvas.remove(objectprops.object);
    } else if (objectprops.action == "removed") {
        currentcanvas.add(objectprops.object);
    }

    console.log('undo ' + memorystackindex);

    currentcanvas.renderAll();
    captureinstack = true;
}

function redo() {

    captureinstack = false;

    if (memorystackindex >= memorystack.length) {
        memorystackindex = memorystack.length;
        captureinstack = true;
        return false;
    }

    var objectprops = memorystack[memorystackindex];
    if (objectprops.action == "modified" || objectprops.action == "selected") {

        if (objectprops.action == "selected") {
            memorystackindex++;
            redo();
        }

        objectprops.object.set({
            left: objectprops.left,
            top: objectprops.top,
            angle: objectprops.angle,
            scaleX: objectprops.scalex,
            scaleY: objectprops.scaley,
            flipX: objectprops.flipx,
            flipY: objectprops.flipy,
            originX: objectprops.originx,
            originY: objectprops.originy,
            fill: objectprops.fill,
            stroke: objectprops.stroke,
            strokeWidth: objectprops.strokewidth,
            opacity: objectprops.opacity
        });

        if (objectprops.object.type == "i-text") {
            objectprops.object.set({
                fontFamily: objectprops.fontfamily,
                fontWeight: objectprops.fontweight,
                fontStyle: objectprops.fontstyle,
                textDecoration: objectprops.textdecoration,
                textAlign: objectprops.textalign
            });
        }

        objectprops.object.setCoords();
        updatesvggroup(objectprops.object);
        currentcanvas.setActiveObject(objectprops.object);
        currentcanvas.renderAll();

    } else if (objectprops.action == "added") {

        currentcanvas.add(objectprops.object);
    } else if (objectprops.action == "removed") {
        currentcanvas.remove(objectprops.object);
    }

    memorystackindex++;
    console.log('redo ' + memorystackindex);
    currentcanvas.renderAll();
    captureinstack = true;
}

function addtomemorystack(object, action) {

    if (!object) return false;

    var selObject = object;
    var objectprops = new Object;
    objectprops.left = selObject.getLeft();
    objectprops.top = selObject.getTop();
    objectprops.angle = selObject.getAngle();
    objectprops.scalex = selObject.getScaleX();
    objectprops.scaley = selObject.getScaleY();
    objectprops.flipx = selObject.getFlipX();
    objectprops.flipy = selObject.getFlipY();
    objectprops.originx = selObject.getOriginX();
    objectprops.originy = selObject.getOriginY();
    objectprops.shadow = selObject.getShadow();
    objectprops.stroke = selObject.getStroke();
    objectprops.strokewidth = selObject.getStrokeWidth();
    objectprops.fill = selObject.getFill();
    objectprops.opacity = selObject.getOpacity();

    if (selObject.type == "i-text") {

        objectprops.fontfamily = selObject.fontFamily;
        objectprops.fontweight = selObject.fontWeight;
        objectprops.fontstyle = selObject.fontStyle;
        objectprops.textdecoration = selObject.textDecoration;
        objectprops.textalign = selObject.textAlign;
    }

    objectprops.action = action;
    objectprops.object = selObject;
    memorystack[memorystackindex] = objectprops;
    memorystackindex++;
    console.log(memorystackindex);

    $("#UndoButton").removeClass('disabled').addClass('enabled');
    $("#RedoButton").removeClass('disabled').addClass('enabled');
}

var canvasScale = origcanvasScale = 1;
var SCALE_FACTOR = 1.2;
var SCALEXY = 0; // Zoom In

function zoomIn() {

    canvasScale = canvasScale * SCALE_FACTOR;

    currentcanvas.setHeight(currentcanvas.getHeight() * SCALE_FACTOR);
    currentcanvas.setWidth(currentcanvas.getWidth() * SCALE_FACTOR);

    $("#" + currentcanvasid + "div").innerWidth(currentcanvas.getWidth());
    $("#" + currentcanvasid + "div").innerHeight(currentcanvas.getHeight());

    document.getElementById("widthCanvas").value = Math.round(pixel2mm(currentcanvas.getWidth()) * 10) / 10;
    document.getElementById("heightCanvas").value = Math.round(pixel2mm(currentcanvas.getHeight()) * 10) / 10;

    var objects = currentcanvas.getObjects();
    for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;

        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * SCALE_FACTOR;
        var tempScaleY = scaleY * SCALE_FACTOR;
        var tempLeft = left * SCALE_FACTOR;
        var tempTop = top * SCALE_FACTOR;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
    }
    currentcanvas.renderAll();

    $("#ZoomFactorInput").val(Math.round(canvasScale * 100));

    //document.getElementById("canvas").style.top = document.getElementById("canvas").style.top - 300;
    //document.getElementById("canvas").style.left = document.getElementById("canvas").style.left - 300;
}

// Zoom Out
function zoomOut() {

    canvasScale = canvasScale / SCALE_FACTOR;

    currentcanvas.setHeight(currentcanvas.getHeight() * (1 / SCALE_FACTOR));
    currentcanvas.setWidth(currentcanvas.getWidth() * (1 / SCALE_FACTOR));

    $("#" + currentcanvasid + "div").innerWidth(currentcanvas.getWidth());
    $("#" + currentcanvasid + "div").innerHeight(currentcanvas.getHeight());

    document.getElementById("widthCanvas").value = Math.round(pixel2mm(currentcanvas.getWidth()) * 10) / 10;
    document.getElementById("heightCanvas").value = Math.round(pixel2mm(currentcanvas.getHeight()) * 10) / 10;

    var objects = currentcanvas.getObjects();
    for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;

        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * (1 / SCALE_FACTOR);
        var tempScaleY = scaleY * (1 / SCALE_FACTOR);
        var tempLeft = left * (1 / SCALE_FACTOR);
        var tempTop = top * (1 / SCALE_FACTOR);

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
    }
    currentcanvas.renderAll();

    $("#ZoomFactorInput").val(Math.round(canvasScale * 100));
}

function zoomReset() {

    currentcanvas.setHeight(currentcanvas.getHeight() * (1 / canvasScale));
    currentcanvas.setWidth(currentcanvas.getWidth() * (1 / canvasScale));

    $("#" + currentcanvasid + "div").innerWidth(currentcanvas.getWidth());
    $("#" + currentcanvasid + "div").innerHeight(currentcanvas.getHeight());

    document.getElementById("widthCanvas").value = Math.round(pixel2mm(currentcanvas.getWidth()) * 10) / 10;
    document.getElementById("heightCanvas").value = Math.round(pixel2mm(currentcanvas.getHeight()) * 10) / 10;

    var objects = currentcanvas.getObjects();
    for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;
        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * (1 / canvasScale);
        var tempScaleY = scaleY * (1 / canvasScale);
        var tempLeft = left * (1 / canvasScale);
        var tempTop = top * (1 / canvasScale);

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
    }

    currentcanvas.renderAll();

    canvasScale = 1;

    $("#ZoomFactorInput").val(Math.round(canvasScale * 100));
}


//loadTemplate: load a template from templateURL, check if it's raw(txt/our JSON data) or SVG, then call 2 other function to handle it
function loadSVGTemplate(svgsrc) {

    fabric.loadSVGFromURL(svgsrc, function(objects, options) {

        var svggroup = new Array();

        for (i = 0; i < objects.length; i++) {
            var obj = objects[i];
            obj.set(options);
            obj.selectable = true;
            obj.originX = 'center';
            obj.originY = 'center';
            obj.hasRotatingPoint = false;

            if (obj.type == "text") {

                console.log(obj)
                var iText = new fabric.IText(obj.text, {
                    left: obj.left,
                    top: obj.top,
                    fontFamily: obj.fontFamily,
                    fontSize: obj.fontSize,
                    fill: obj.fill,
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    originX: obj.originX,
                    originY: obj.originY,
                    hasRotatingPoint: false
                });
                objects[i] = iText;
                obj = iText;
            }
            currentcanvas.add(obj);

            obj.svgobj = true;
            svggroup[svggroup.length] = obj;
            if (obj.type != "i-text") {
                //obj.perPixelTargetFind = true;
                //currentcanvas.centerObject(obj);
            } else {
                obj.offsetleft = obj.left;
                obj.offsettop = obj.top;
            }

            obj.setCoords();
            obj.visible = svgsrc;
        };

        document.getElementById('widthCanvas').value = Math.round(pixel2mm(objects[0].width) * 10) / 10;
        document.getElementById('heightCanvas').value = Math.round(pixel2mm(objects[0].height) * 10) / 10;
        changeSizeCustom(false);

        var mainobjtop = 0,
            mainobjleft = 0;
        for (i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.type != "i-text") {
                mainobjleft = obj.left - obj.width / 2;
                mainobjtop = obj.top - obj.height / 2;
            }
            if (obj.type == "i-text") {
                currentcanvas.bringToFront(obj);
                obj.left = mainobjleft + obj.width / 2 + obj.offsetleft;
                obj.top = mainobjtop - obj.height / 2 + obj.offsettop;
                obj.setCoords();
            }
            obj.svggroup = svggroup;
        };

        updatesvggroup(objects[0])

        addThumb(currentcanvas);

        currentcanvas.calcOffset();
        currentcanvas.renderAll();

        $("#" + currentcanvasid + "div").resizable();

        var oldcanvswidth = currentcanvas.width;
        var oldcanvsheight = currentcanvas.height;
        $("#" + currentcanvasid + "div").resize(function() {

            oldcanvswidth = currentcanvas.width;
            oldcanvsheight = currentcanvas.height;

            var client_w = $("#" + currentcanvasid + "div").innerWidth();
            var client_h = $("#" + currentcanvasid + "div").innerHeight();
            currentcanvas.setWidth(client_w);
            currentcanvas.setHeight(client_h);

            resizeCanvasObjects(oldcanvswidth, oldcanvsheight);

            document.getElementById("widthCanvas").value = Math.round(pixel2mm(client_w) * 10) / 10;
            document.getElementById("heightCanvas").value = Math.round(pixel2mm(client_h) * 10) / 10;

            currentcanvas.renderAll();
        });
    }, function(el, obj) {

        if (el.transform.baseVal.numberOfItems > 0) {
            var xforms = el.transform.baseVal; // An SVGTransformList
            var firstXForm = xforms.getItem(0); // An SVGTransform
            if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                var firstX = firstXForm.matrix.e,
                    firstY = firstXForm.matrix.f;
                //console.log(firstX, firstY);
                obj.left = firstX;
                obj.top = firstY;
                obj.offsetleft = firstX;
                obj.offsettop = firstY;
            }
        }
    });
}

function resizeCanvasObjects(width, height) {

    var objects = currentcanvas.getObjects();
    for (var i in objects) {
        var scalefactorX = currentcanvas.width / width;
        var scalefactorY = currentcanvas.height / height;

        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;

        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * scalefactorX;
        var tempScaleY = scaleY * scalefactorY;
        var tempLeft = left * scalefactorX;
        var tempTop = top * scalefactorY;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
        objects[i].setCoords();
    }
}

function updatesvggroup(selobject, updatelefttop) {

    var svggroup = selobject.svggroup
        //console.log(selobject.svgobj, svggroup)
    var mainobjtop = 0,
        mainobjleft = 0;
    if (selobject.svgobj && svggroup) {
        var angle = selobject.angle;
        var left = selobject.getLeft();
        var top = selobject.getTop();
        var scaleX = selobject.scaleX;
        var scaleY = selobject.scaleY;
        var originX = selobject.originX;
        var originY = selobject.originY;
        for (i = 0; i < svggroup.length; i++) {
            svggroup[i].angle = angle;
            svggroup[i].left = left;
            svggroup[i].top = top;
            svggroup[i].scaleX = scaleX;
            svggroup[i].scaleY = scaleY;
            svggroup[i].originX = originX;
            svggroup[i].originY = originY;
            svggroup[i].setCoords();
            if (svggroup[i].type != "i-text") {
                mainobjleft = svggroup[i].left - (svggroup[i].width * svggroup[i].scaleX) / 2;
                mainobjtop = svggroup[i].top - (svggroup[i].height * svggroup[i].scaleY) / 2;
            }
        }
        var canvasCenter = new fabric.Point(svggroup[0].left, svggroup[0].top);
        var rads = 0.174532925; // 10 degrees in radians
        for (i = 0; i < svggroup.length; i++) {
            var obj = svggroup[i];
            if (obj.type == "i-text") {
                currentcanvas.bringToFront(obj);
                obj.left = mainobjleft + (obj.width * obj.scaleX) / 2 + obj.offsetleft * obj.scaleX;
                obj.top = mainobjtop - (obj.height * obj.scaleY) / 2 + obj.offsettop * obj.scaleY;
                if (updatelefttop) {}
                obj.setCoords();
            }
        };
    }
    currentcanvas.renderAll();
}

function adjustText(text) {

    text.setCoords();

    if (text.type == 'i-text') {

        var p = text;
        var left, top, angle;
        if ((p.x2 > p.x1) && (p.y2 < p.y1)) {

            left = p.oCoords.tr.x;
            top = p.oCoords.tr.y;
            angle = Math.atan2(p.oCoords.tr.y - p.oCoords.bl.y, p.oCoords.tr.x - p.oCoords.bl.x) * 180 / Math.PI;
        } else if ((p.x2 > p.x1) && (p.y2 >= p.y1)) {

            left = p.oCoords.br.x;
            top = p.oCoords.br.y;
            angle = Math.atan2(p.oCoords.br.y - p.oCoords.tl.y, p.oCoords.br.x - p.oCoords.tl.x) * 180 / Math.PI;
        } else if ((p.x2 < p.x1) && (p.y2 < p.y1)) {

            left = p.oCoords.tl.x;
            top = p.oCoords.tl.y;
            angle = Math.atan2(p.oCoords.tl.y - p.oCoords.br.y, p.oCoords.tl.x - p.oCoords.br.x) * 180 / Math.PI;
        } else if ((p.x2 < p.x1) && (p.y2 > p.y1)) {

            left = p.oCoords.bl.x;
            top = p.oCoords.bl.y;
            angle = Math.atan2(p.oCoords.bl.y - p.oCoords.tr.y, p.oCoords.bl.x - p.oCoords.tr.x) * 180 / Math.PI;
        }

        p.arrow.left = p.oCoords.br.x + 0.5 * (p.oCoords.tl.x - p.oCoords.br.x);
        p.arrow.top = p.oCoords.br.y + 0.5 * (p.oCoords.tl.y - p.oCoords.br.y);
        p.arrow.setAngle(angle + 90);
    }
}

//goBackToOrder: the 'logo' onclick, just back to the product page.
function goBackToOrder() {
    if (typeof callbackURL != "undefined") window.location = callbackURL;
    else window.history.back();
}

function getHourMin() {
    var timestamp = new Date();
    var h = timestamp.getHours();
    var m = timestamp.getMinutes();
    h = (h < 10) ? '0' + h : h;
    m = (m < 10) ? '0' + m : m;
    return (h + ":" + m);
}

//SaveDraftAction, LoadDraftAction: save/load draft to localStorage. When upgrading to the cloud, please use loadTXTTemplate (load) and createRAW (save) instead
function SaveDraftAction() {
    localStorage.productID = productID;
    localStorage.holderWidth = document.getElementById('widthCanvas').value;
    localStorage.holderHeight = document.getElementById('heightCanvas').value;

    var jsonCanvas = currentcanvas.toDatalessJSON();
    var jsonData = JSON.stringify(jsonCanvas);
    localStorage.jsonData = jsonData;

    console.log(jsonData);

    saveButtonEle.classList.add("saved");

    saveButtonEle.lastElementChild.textContent = "Saved " + getHourMin();
    setTimeout(SaveDraftAction, autoSaveInterval);
}

function LoadDraftAction() {
    document.getElementById('widthCanvas').value = localStorage.holderWidth;
    document.getElementById('heightCanvas').value = localStorage.holderHeight;
    changeSizeCustom(false);

    var jsonData = localStorage.jsonData;
    if (jsonData) {
        currentcanvas.loadFromJSON(jsonData, currentcanvas.renderAll.bind(currentcanvas), function(o, object) {
            // `o` = json object
            // `object` = fabric.Object instance
            object.selectable = true;
        });
        addThumb(currentcanvas);
    }
}

$(function() {

    var $pCont = $("#panel-content");
    $pCont.width(0);
    $("#myTab").click(function(ev) {
        $pCont.stop().animate({
            width: ev.type == "mouseenter" ? 140 : 140
        }, 700);
    });
    $("#canvasbox").click(function(ev) {
        $pCont.stop().animate({
            width: 0
        }, 700);
    });
    $("canvas").click(function(ev) {
        $pCont.stop().animate({
            width: 0
        }, 700);
    });
});

// image preview function, demonstrating the ui.dialog used as a modal window
function viewLargerImage(cindex, title) {

    var src = document.getElementById("canvasthumb" + cindex).src;
    var img = $("<img alt='" + title + "' width='" + currentcanvas.width + "' height='288' style='overflow:scroll;display: none; padding: 8px;' />")
        .attr("src", src).appendTo("body");
    img.css({
        'overflow': 'scroll'
    });
    setTimeout(function() {
        img.dialog({
            title: title,
            width: 700,
            width: 500,
            modal: true
        });
    }, 1);
}

$(function() {
    $('#fontSelect').fontSelector({
        'hide_fallbacks': true,
        'initial': 'Courier New,Courier New,Courier,monospace',
        'selected': function(style) {
            var find = "'";
            var re = new RegExp(find, 'g');

            changeFontFamily(style.split(",")[0].replace(re, ""));
        },
        'fonts': [
            'Alex Brush,Alex Brush',
            'Arial,Arial',
            'Arial Black,Arial Black',
            'Arial Rounded MT Bold,Arial Rounded MT Bold',
            'Avenir,Avenir',
            'Baskerville,Baskerville',
            'Bembo,Bembo',
            'Century,Century',
            'Clarendon,Clarendon',
            'Comic Sans MS,Comic Sans MS',
            'Cooper,Cooper',
            'Courier New,Courier New',
            'Franklin Gothic,Franklin Gothic',
            'Frutiger,Frutiger',
            'Garamond,Garamond',
            'Georgia,Georgia',
            'Gill Sans,Gill Sans',
            'Helvetica,Helvetica',
            'Impact,Impact',
            'Minion Pro,Minion Pro',
            'MS Sans Serif,MS Sans Serif',
            'Myriad Pro,Myriad Pro',
            'Old English,Old English',
            'Perpetua,Perpetua',
            'Gill Sans,Gill Sans',
            'Rockwell,Rockwell',
            'Rubik Mono One,Rubik Mono One',
            'S2G Love,S2G Love',
            'Stencil,Stencil',
            'Times New Roman,Times New Roman',
            'Ubuntu,Ubuntu',
        ]
    });
});

function groupObjects() {

    var activegroup = currentcanvas.getActiveGroup();
    var objectsInGroup = activegroup.getObjects();

    activegroup.clone(function(newgroup) {
        currentcanvas.discardActiveGroup();
        objectsInGroup.forEach(function(object) {
            currentcanvas.remove(object);
        });
        currentcanvas.add(newgroup);
    });
}

function unGroupObjects() {
    var activeObject = currentcanvas.getActiveObject();
    if (activeObject.svggroup) {
        var svggroup = activeObject.svggroup

        if (svggroup.length > 20) {
            alert("Subobjects are more than 20. So cannot Ungroup.");
            return false;
        }

        for (i = 0; i < svggroup.length; i++) {
            svggroup[i].svggroup = "";
        }
    } else if (activeObject.type == "group") {
        var items = activeObject._objects;

        if (items.length > 20) {
            alert("Subobjects are more than 20. So cannot Ungroup.");
            return false;
        }

        activeObject._restoreObjectsState();
        currentcanvas.remove(activeObject);
        for (var i = 0; i < items.length; i++) {
            currentcanvas.add(items[i]);
            currentcanvas.item(currentcanvas.size() - 1).hasControls = true;
        }

        currentcanvas.renderAll();
    }
}

//whiteToTransparent: change white pixel of image to transparent
function whiteToTransparent(image) {
	var myCanvas=document.createElement("canvas");
	var myCanvasContext=myCanvas.getContext("2d");
	var imgWidth=image.naturalWidth;
	var imgHeight=image.naturalHeight;
	var red,green,blue,alpha;
	myCanvas.width= imgWidth;
	myCanvas.height=imgHeight;
	myCanvasContext.drawImage(image,0,0);
	var imageData=myCanvasContext.getImageData(0,0, imgWidth, imgHeight);
	for (i=0; i<imageData.height; i++)
	{
		for (j=0; j<imageData.width; j++)
		{
			red = imageData.data[index];
			green = imageData.data[index + 1];
			blue = imageData.data[index + 2];
			alpha = imageData.data[index + 3];
			var index = (i * 4) * imageData.width + (j * 4);
			if (((red + green + blue) / 3 > 200) && 
			    (((Math.abs(red - green) + Math.abs(green - blue) + Math.abs(red - blue)) / 3) < 5)) imageData.data[index+3] = 0;
		}
	 }
	myCanvasContext.putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);
	return myCanvas.toDataURL();
}

//changeImageWhiteToTransparent: toggle for the above function, also cache, improve speed
function changeImageWhiteToTransparent(e) {

    if (selectedObject.type != "image") return;

    if (e.target.checked) {
        if (!selectedObject.cacheTransImgTik) {
            if (!selectedObject.src)
                selectedObject.src = selectedObject._originalElement.src;

            selectedObject.cacheTransImgOri = selectedObject.src;

            if (!selectedObject.cacheTransImgCon) {

                var image = new Image();
                image.onload = function() {

                    selectedObject.cacheTransImgCon = whiteToTransparent(this);
                    selectedObject.src = selectedObject.cacheTransImgCon;
                    loadImage(selectedObject, 1);
                };
                image.src = selectedObject.src;
            }
        }
    }
    if (selectedObject.cacheTransImgTik == 1) {
        selectedObject.src = selectedObject.cacheTransImgOri;
        loadImage(selectedObject, 2);
    } else if (selectedObject.cacheTransImgTik == 2) {
        selectedObject.src = selectedObject.cacheTransImgCon;
        loadImage(selectedObject, 1);
    }
    currentcanvas.renderAll();
}

function loadImage(selobj, status) {

    fabric.util.loadImage(selobj.src, function(img) {
        var object = new fabric.Image(img);
        object.set({
            left: selobj.left,
            top: selobj.top,
            scaleX: selobj.scaleX,
            scaleY: selobj.scaleY,
            hasRotatingPoint: true
        });
        currentcanvas.add(object);
        object.src = selobj.src;
        object.cacheTransImgOri = selobj.cacheTransImgOri;
        object.cacheTransImgCon = selobj.cacheTransImgCon;        
        object.cacheTransImgTik = status;
        currentcanvas.remove(selobj);

        currentcanvas.renderAll();
    });
}

    $(document).ready(function(){

        var painter = fabricPainter,
        active_brush,
        brush_functions,
        brush_textures = ['tree_bark', 'geometry', 'pw_pattern', 'ricepaper_v3', 'retina_wood'];
        global_options = $('#global-options'),
        brush_list = $('#brush-list'),
        texture_brush_list = $('#texture-brush-list'),

        sliderMap = [
        {
            id: '#adjust-brush-opacity',
            value: 0.8,
            min: 0.1,
            max: 1,
            step: 0.1,
            fn: painter.brush_globals.prop,
            prop: 'opacity'
        },
        {
            id: '#adjust-angle',
            value: 90,
            min: -180,
            max: 180,
            step: 1,
            fn: painter.brush_globals.prop,
            prop: 'angle'
        },
        {
            id: '#adjust-brush-size',
            value: 50,
            min: 1,
            max: 100,
            step: 1,
            fn: painter.brush_globals.prop,
            prop: 'size'
        }
        ];

        // map sliders to slider instantiation
        $(sliderMap).each(function(k, slider){
            var s = slider;
            $(s.id).slider({
                min: s.min,
                max: s.max,
                step: s.step,
                slide: function(event, ui) {
                    $(this).find('span.value-holder').text(ui.value);
                    if(s.fn !== null && s.fn) {
                        s.fn(s.prop, ui.value);
                        toggleDrawingMode();
                        // retrigger texture load for brush resizing
                        if(!painter.brush_globals.is_drawing) return;
                        $('#texture-brush-list')
                        .find('.btn-active').click();
                    }
                }
            });
        });

        // ----------------------------------
        // ADVANCED BRUSHES
        // ----------------------------------

        function toggleDrawingMode() {
            if(painter.brush_globals.is_drawing) {
                brush_list.hide();
            } else {
                brush_list.show();
            }
            return;
        }

        brush_list.on('click.active-btns', '.btn', function(){
            $(this).parent().find('.btn').not($(this)).removeClass('btn-active');
            $(this).addClass('btn-active');
        });

        texture_brush_list.on('click.active-btns', '.btn', function(){
            $(this).parent().find('.btn').not($(this)).removeClass('btn-active');
            $(this).addClass('btn-active');
            if(!painter.brush_globals.is_drawing) {
                $('#toggle-drawing-mode').trigger('click');
            }
        });

        global_options.on('click.active-btns', '.btn', function(){
            if($(this).hasClass('toggleable')) {
                $(this).toggleClass('btn-active');
            }
        });

        $('#adjust-color').on('change', function(e){
            painter.brush_globals.color = e.currentTarget.value;
            e.preventDefault();
        });

        $('#clear-canvas').on('click', function(e){
            e.preventDefault();
            canvas.clear();
        });

        $('#toggle-drawing-mode').on('click', function(e){
            e.preventDefault();
            painter.toggleProperty('is_drawing');
            toggleDrawingMode();
        });

        $('#outline-shapes').on('click', function(e){
            e.preventDefault();
            painter.toggleProperty('outline');
        });

        // $('#export-image').on('click', function(e){
        //     alert('hello');
        //     e.preventDefault();
        //     window.open(canvas.toDataURL('png'));
        // });

        // ----------------------------------
        // Canvas init, etc
        // ----------------------------------

        // canvas = new fabric.Canvas('c');
        // canvas.selection = false;

        // proxy all functions to an object so we can call
        // them with specific arguments specified
        brush_functions = {
            'makeRandomShapeArrangment': function(data) {
                painter.makeRandomShapeArrangment(canvas.width / 4, 'shape', 'monotone');
            },
            'drawDnaBrush': function(data) {
                painter.drawDnaBrush(data);
            },
            'addLineSwirls': function(data) {
                painter.addLineSwirls(data);
            },
            'addRandomTriangle': function(data) {
                painter.addRandomTriangle(data);
            },
            'addRandomRect': function(data) {
                painter.addRandomRect(data, 10);
            },
            'drawBubblesSimple': function(data) {
                painter.drawBubblesSimple(data);
            },
            'drawTree': function(data) {
                painter.drawTree(data, 10);
            },
            'drawInvertedTree': function(data) {
                painter.drawInvertedTree(data, 5);
            },
            'drawCopyCat': function(data) {
                painter.drawCopyCat(data);
            },
            'drawEchoes': function(data) {
                painter.drawEchoes(data);
            },
            'drawEerieFollower': function(data) {
                painter.drawEerieFollower(data, 2000);
            },
            'drawStarLine': function(data) {
                painter.drawStarLine(data);
            },
            'drawDiamondCross': function(data) {
                painter.drawDiamondCross(data);
            },
            'drawGlassStorm': function(data) {
                painter.drawGlassStorm(data);
            },
            'drawSporadicLines': function(data) {
                painter.drawSporadicLines(data);
            },
            drawGraffiti: function(data) {
                painter.drawGraffiti(data);
            }
        };

        // populate the list with brushes
        for(var name in brush_functions) {
            var item = $('<li><a></a></li>')
            .find('a')
            .addClass('btn')
            .attr('id', name)
            .text(name);
            brush_list.append(item);
        }

        // populate texture brush
        // list with array of texture files
        $(brush_textures).each(function(k, texture_name){
            var item = $('<li><a></a></li>')
            .find('a')
            .addClass('btn btn-texture')
            .attr('id', texture_name)
            .css('background', 'url(img/' + texture_name + '.png)')
            .text(texture_name.replace('_', ' '));
            texture_brush_list.append(item);
        });

        brush_list.find('a').on('click.brush-type', function(){
            var brush = $(this).text();

            // trigger brush
            active_brush = brush_functions[brush];
            return;
        });

        texture_brush_list.find('a').on('click.texture-brush-type', function(){
            var texture = $(this).text();

            // always set to true
            painter.brush_globals.is_drawing = true;

            // toggle controls
            toggleDrawingMode();
            painter.triggerPaintTextureMode('img/' + texture.replace(' ', '_') + '.png');

            // remove other brushes
            active_brush = null;
            return;
        });

        // trigger the first brush
        brush_list.find('a').last().trigger('click');

        canvas.on('mouse:move', function(data){
            // but only if drawing mode is disabled
            if(!painter.brush_globals.is_drawing) {
                active_brush(data);
            }

            return;
        });

        canvas.renderAll();


    });

    });

