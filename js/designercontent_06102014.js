var canvas;
var selectedObject;
$(document).ready(function() {

    canvas = new fabric.Canvas('canvaseditor');
    canvas.calcOffset();
    canvas.renderAll();
	
initPanel();

    //define the event listeners.
    document.getElementById("AddTextButton").addEventListener("click", AddTextAction);
    document.getElementById('textContent').addEventListener('input', changeTextContent);
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

    //canvas events.
    canvas.observe('object:selected', function(e) {

        selectedObject = e.target;
        
        if(selectedObject.type == "i-text") {
        	$("#textPanel").addClass('selected');
        }
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
	for (i = 0;i < allpanel.length;++i)
	{
		allpanel[i].style.height = allpanel[i].offsetHeight + "px";
		allpanel[i].firstElementChild.addEventListener('click',changePanel);
		allpanel[i].classList.remove("selected");
	}
	//allpanel[0].firstElementChild.click();
	//allpanelholder.setAttribute("contextualType","normal");
}
function changePanel(e) {
	if (e.target.parentNode.classList.contains("selected"))
	{
		e.target.parentNode.classList.remove("selected");
		return;
	}
	for (var i = allpanel.length - 1;i >= 0;--i) allpanel[i].classList.remove("selected");
	e.target.parentNode.classList.add("selected");
}

//AddTextAction: Add a new text object
function AddTextAction() {
    var iText = new fabric.IText('New Text', {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fill: '#333'
    });
    canvas.add(iText);
    canvas.renderAll();
}

//changeTextContent, changeFontFamily, changeFontSize, changeFontBold, changeFontItalic, changeFontUnderline, changeFontAlign: change text's style
function changeTextContent(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.text = e.target.value;
        selectedObject.setCoords();
        canvas.renderAll();
    }
}

function changeFontFamily(e) {
    if (selectedObject.type == "i-text") {
        selectedObject.fontFamily = e.target.value;
        selectedObject.setCoords();
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