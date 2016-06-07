var canvas;
var selectedObject;
var const_color = ["white", "lightgrey", "red", "yellow", "lightgreen", "lightblue", "pink", "black", "grey", "brown", "orange", "green", "blue", "purple"],
    const_color_value = ["white", "#D3D3D3", "#D30008", "#ECE824", "#8FDB21", "#159CD8", "#CB89BB", "black", "#6F6F6F", "#993229", "#F57E20", "#008C4A", "#0059B4", "#75449A"],
    const_pixel_mm = 96 / 25.4;

$(document).ready(function() {

    canvas = new fabric.Canvas('canvaseditor');
    canvas.calcOffset();
    canvas.renderAll();

    initPanel();

    //define the event listeners.
    document.getElementById("AddTextButton").addEventListener("click", AddTextAction);
    //document.getElementById('textContent').addEventListener('input', changeTextContent);
    document.getElementById('fontFamily').addEventListener('change', changeFontFamily);
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

    document.getElementById("DeleteButton").addEventListener("click", deleteSelObject);
    document.getElementById("CloneButton").addEventListener("click", cloneSelObject);

    document.getElementById("UploadButton").addEventListener("click", UploadAction, false);
    document.getElementById('UploadImage').addEventListener('change', FileUploadAction);

    document.getElementById("uploadbackgroundbutton").addEventListener("click", BackgroundImageAction);
    document.getElementById("BackgroundUploadImage").addEventListener("change", BackgroundImageUploadAction);
    document.getElementById("removebackgroundbutton").addEventListener("click", RemoveBackgroundImage);

    window.addEventListener('keydown', KeyManager);

    //canvas events.
    canvas.observe('object:selected', function(e) {

        selectedObject = e.target;
        $("#DeleteButton").removeClass('disabled').addClass('enabled');
        $("#CloneButton").removeClass('disabled').addClass('enabled');
        if (selectedObject.type == "i-text") {
            $("#textPanel").addClass('selected');
        }
        canvas.renderAll();
    });

    //canvas events.
    canvas.observe('selection:cleared', function(e) {

        $("#DeleteButton").removeClass('enabled').addClass('disabled');
        $("#CloneButton").removeClass('enabled').addClass('disabled');
        canvas.renderAll();
    });

});
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

function changePanel(e) {
    if (e.target.parentNode.classList.contains("selected")) {
        e.target.parentNode.classList.remove("selected");
        return;
    }
    for (var i = allpanel.length - 1; i >= 0; --i) allpanel[i].classList.remove("selected");
    e.target.parentNode.classList.add("selected");
}

function deleteSelObject() {
    canvas.remove(selectedObject);
    canvas.renderAll();
}

function cloneSelObject() {


    if (!selectedObject) return;

    if (fabric.util.getKlass(selectedObject.type).async) {
        selectedObject.clone(function(clone) {
            clone.set({
                left: 100,
                top: 200
            });
            canvas.add(clone);
        });
    } else {
        canvas.add(selectedObject.clone().set({
            left: 100,
            top: 200
        }));
    }

    canvas.renderAll();
}

//AddTextAction: Add a new text object
function AddTextAction() {
    var iText = new fabric.IText('New Text', {
        left: 100,
        top: 100,
        fontFamily: "impact",
        fill: '#333'
    });
    canvas.add(iText);
    canvas.renderAll();
}

//changeFontFamily, changeFontSize, changeFontBold, changeFontItalic, changeFontUnderline, changeFontAlign: change text's style
/*function changeTextContent(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.text = e.target.value;
        selectedObject.setCoords();
        canvas.renderAll();
    }
}*/

function changeFontFamily(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontFamily = e.target.value;
        selectedObject.setCoords();
        canvas.calcOffset();
        canvas.renderAll();
    }
}

function changeFontSize(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontSize = e.target.value;
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

function changeFontBold(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontWeight = e.target.checked ? "bold" : "normal";
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

function changeFontItalic(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontStyle = e.target.checked ? "italic" : "normal";
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

function changeFontUnderline(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.textDecoration = e.target.checked ? "underline" : "normal";
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

function changeFontAlign(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.textAlign = e.target.value;
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

//layerFront, layerBack: move selectedObject to front/back
function layerFront(e) {

    canvas.bringToFront(selectedObject);
    selectedObject.setCoords();
    canvas.renderAll();
}

function layerBack(e) {

    canvas.sendToBack(selectedObject);
    selectedObject.setCoords();
    canvas.renderAll();
}

//changeImageOpacity: fade image
function changeImageOpacity(e) {
    selectedObject.opacity = e.target.value / 100;
    selectedObject.setCoords();
    canvas.renderAll();
}

function KeyManager(e) {
    var flag, sflag = false;
    if (flag = e.keyCode == 46) deleteSelObject();
    sflag = sflag || flag;
    if (flag = e.keyCode == 90 && e.ctrlKey) UndoAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 89 && e.ctrlKey) RedoAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 67 && e.ctrlKey) CopyAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 88 && e.ctrlKey) CutAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 86 && e.ctrlKey) PasteAction();
    sflag = sflag || flag;
    if (flag = e.keyCode == 83 && e.ctrlKey) SaveDraftAction();
    sflag = sflag || flag;
    if ((e.keyCode == 107 || e.keyCode == 187)) ZoomInAction();
    sflag = sflag || flag;
    if ((e.keyCode == 109 || e.keyCode == 189)) ZoomOutAction();
    sflag = sflag || flag;
    if (sflag) e.preventDefault();
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
                left: 200,
                top: 200,
                scaleX: 0.5,
                scaleY: 0.5,
                hasRotatingPoint: true
            });
            canvas.add(object);

            //addtomemorystack(object, "added");
            canvas.renderAll();
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
        canvas.setBackgroundImage(fr.result, canvas.renderAll.bind(canvas));
        canvas.renderAll();
    };

    fr.readAsDataURL(file);
}

function RemoveBackgroundImage(e) {
    canvas.setBackgroundImage("", canvas.renderAll.bind(canvas));
    canvas.renderAll();

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
                        selectedObject.stroke = color;
                        canvas.renderAll();
                    }
                    break;
                case "backgroundColorPicker":
                    elementstyle = "backgroundColor";
                    cssstyle = "background-color";

                    canvas.backgroundColor = color;
                    canvas.renderAll();
                    break;
                case "shapeColorPicker":
                    elementstyle = "fill";
                    cssstyle = "fill";
                    if (selectedObject) {
                        selectedObject.fill = color;
                        canvas.renderAll();
                    }
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