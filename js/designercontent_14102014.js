var productID = 1034;
var templateURL = './w_s_s_auction_now.svg';


var canvasindex = 0;
var currentcanvas;
var currentcanvasid;
var selectedObject;
var memorystack = new Array();
var memorystackindex = 0;
var captureinstack = true;
var saveButtonEle;
var const_pixel_mm = 96 / 25.4;
var autoSaveInterval = 60 * 1000; //auto save in ms

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

    //define the event listeners.
    document.getElementById("AddTextButton").addEventListener("click", AddTextAction);
    document.getElementById('strokeWidth').addEventListener('change', applyStrokeWidth);
    //document.getElementById('textContent').addEventListener('input', changeTextContent);
    document.getElementById('fontFamily').addEventListener('change', changeFontFamily);
    document.getElementById('fontSize').addEventListener('change', changeFontSize);
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

    document.getElementById("shapeFlip").addEventListener("change", flipShape);

    document.getElementById("ShapesButton").addEventListener("click", showClipArtShapes);

    document.getElementById("DeleteButton").addEventListener("click", deleteSelObject);
    document.getElementById("CloneButton").addEventListener("click", cloneSelObject);

    document.getElementById("UploadButton").addEventListener("click", UploadAction, false);
    document.getElementById('UploadImage').addEventListener('change', FileUploadAction);

    document.getElementById("UndoButton").addEventListener("click", undo);
    document.getElementById("RedoButton").addEventListener("click", redo);

    document.getElementById("ZoomInButton").addEventListener("click", zoomIn);
    document.getElementById("ZoomOutButton").addEventListener("click", zoomOut);
    document.getElementById("ZoomReset").addEventListener("click", zoomReset);
    $("#ZoomFactorInput").val(canvasScale * 100);

	saveButtonEle = document.getElementById("SaveButton");
    saveButtonEle.addEventListener("click", SaveDraftAction);
    setTimeout(SaveDraftAction, autoSaveInterval);

    document.getElementById("uploadbackgroundbutton").addEventListener("click", BackgroundImageAction);
    document.getElementById("BackgroundUploadImage").addEventListener("change", BackgroundImageUploadAction);
    document.getElementById("removebackgroundbutton").addEventListener("click", RemoveBackgroundImage);

    window.addEventListener('keydown', KeyManager);
    
    $("#maincontainer1").draggable();

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
    document.getElementById("canvasbox").appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.id = currentcanvasid;
    document.getElementById(div.id).appendChild(canvas);

    //canvas -- fabric canvas object. initialize fabric canvas object.
    currentcanvas = new fabric.Canvas(canvas.id);
    currentcanvas.backgroundColor = "white";
    changeSizeCanvas(100, 200);

    currentcanvas.calcOffset();
    currentcanvas.renderAll();

    changeSizeDropDown();

    document.getElementById(canvas.id).fabric = currentcanvas;

    currentcanvas.selection = false;

    initCanvasEvents();

    try {
        if (productID == localStorage.productID) LoadDraftAction()
        else if (templateURL != '') loadSVGTemplate(templateURL);
    } catch (e) {
        console.log(e);
    }
}

function initCanvasEvents() {
    //canvas events.
    currentcanvas.observe('object:selected', function(e) {

        selectedObject = e.target;
        $("#DeleteButton").removeClass('disabled').addClass('enabled');
        $("#CloneButton").removeClass('disabled').addClass('enabled');
        if (selectedObject.type == "i-text") {

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
        if (document.getElementById(currentcanvasid) && document.getElementById(currentcanvasid).previewimage) {
            document.getElementById(currentcanvasid).previewimage.src = currentcanvas.toDataURL();
        }
    });

    currentcanvas.observe('object:modified', function(e) {
        if (captureinstack)
            addtomemorystack(e.target, "modified");
        if (document.getElementById(currentcanvasid) && document.getElementById(currentcanvasid).previewimage) {
            document.getElementById(currentcanvasid).previewimage.src = currentcanvas.toDataURL();
        }
    });

    //canvas events.
    currentcanvas.observe('selection:cleared', function(e) {

        $("#DeleteButton").removeClass('enabled').addClass('disabled');
        $("#CloneButton").removeClass('enabled').addClass('disabled');
        currentcanvas.renderAll();
    });
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
    var image = new Image();
    image.id = 'canvasthumb' + canvasindex;
    image.src = canvas.toDataURL();
    image.style.width = "100px";
    image.style.height = "200px";
    a = document.createElement('a');
    a.href = 'javascript:showCanvasDiv("' + "canvas" + canvasindex + '");';
    a.appendChild(image);
    document.getElementById("previewthumbs").appendChild(a);

    document.getElementById("canvas" + canvasindex).previewimage = image;

    canvasindex++;

    document.getElementById("pagePanel").style.height = "300px";
}

//changeSizeCanvas: change Canvas size
//changeSizeDropDown: change canvas size using dropdown menu
//changeSizeCustom: change canvas size using the textbox on setting panel
function changeSizeCanvas(width, height) {
    currentcanvas.width = mm2pixel(width);
    currentcanvas.height = mm2pixel(height);
    var canvasDOM = document.getElementById(currentcanvasid);

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
    changeSizeCanvas(width, height);
}

function changeSizeCustom() {
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
    changeSizeCanvas(width, height);
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

function flipShape(e) {
    if (!selectedObject) return;
    if (e.target.checked) {
        selectedObject.flipY = true;
        selectedObject.flipX = true;
    } else {
        selectedObject.flipY = false;
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
    currentcanvas.remove(selectedObject);
    currentcanvas.renderAll();
}

function cloneSelObject() {

    if (!selectedObject) return;

    if (fabric.util.getKlass(selectedObject.type).async) {
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
        fontFamily: "impact",
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

function changeFontFamily(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontFamily = e.target.value;
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
        currentcanvas.setBackgroundImage(fr.result, currentcanvas.renderAll.bind(currentcanvas));
        currentcanvas.renderAll();
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
//loadTemplate: load a template from templateURL, check if it's raw(txt/our JSON data) or SVG, then call 2 other function to handle it
function loadSVGTemplate(svgsrc) {


    fabric.loadSVGFromURL(svgsrc, function(objects, options) {
        var obj = fabric.util.groupSVGElements(objects, options);

        // put object on the canvas
        currentcanvas.add(obj);

        document.getElementById('widthCanvas').value = Math.round(pixel2mm(obj.width) * 10) / 10;
        document.getElementById('heightCanvas').value = Math.round(pixel2mm(obj.height) * 10) / 10;
        changeSizeCustom();

        addThumb(currentcanvas);
    });

    currentcanvas.renderAll();
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

        saveButtonEle.classList.add("saved");
    
    saveButtonEle.lastElementChild.textContent = "Saved " + getHourMin();
    setTimeout(SaveDraftAction, autoSaveInterval);
}

function LoadDraftAction() {
    document.getElementById('widthCanvas').value = localStorage.holderWidth;
    document.getElementById('heightCanvas').value = localStorage.holderHeight;
    changeSizeCustom();

   var jsonData = localStorage.jsonData;
   if(jsonData) {
	currentcanvas.loadFromJSON(jsonData, currentcanvas.renderAll.bind(currentcanvas), function (o, object) {
		// `o` = json object
		// `object` = fabric.Object instance
		object.selectable = true;
	});
	addThumb(currentcanvas);
   }
}

    