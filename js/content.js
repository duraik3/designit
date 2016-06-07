var brightnessThres = 200; //brightnessThres for the function convert white to transparent
var greynessThres = 5; //same
var autoSaveInterval = 60 * 1000; //auto save in ms
/***********************************************************************/
var shapeList = [{'imageurl':'modules/designer/css/shape/01.svg','keyword':['aaa'],'categories':['A']},{'imageurl':'modules/designer/css/shape/02.svg','keyword':['bbb','ccc'],'categories':['A','B']}];
//from server: isLockedResolution,designID,productID,shapeList,helpText,callbackURL,templateURL
//shapeList: list of shape from server, it's an array, format of each object: 'imageurl': link, 'keyword':[arrayofkeyword],'categories':[arrayofcategory]
/***********************************************************************/
var svgNS = "http://www.w3.org/2000/svg";
var xlinkns = "http://www.w3.org/1999/xlink";
/***********************************************************************/
var preventKeyManager,isSelectedObj,isSelectingObj, isDraggingObj, isResizingObj, resizeType, selectedObject, copiedObject, maincanvas, holdercanvas, margincanvas, allpanel, allpanelholder;
var canvasX, canvasY, holdercanvasX, holdercanvasY, oldX, oldY, oldR, oldF, lenX, lenY, posX, posY, cenX, cenY, zoomFactor = 100, zf = 1, rzf = 1,rzfp = 100,rzfb = 2, defaultZoomFactor = 100;
var borderWidth,borderMargin,cacheDeleteButton,cacheCloneButton,cacheUndoButton,cacheRedoButton,cacheZoomFactorInput, cacheFontSizeInput,cacheSaveButton,cacheClipArtFilterInput,cacheClipArtCategory,cacheSaved = false,cachePreviewDesign,cacheCoverProgressBar;
var const_color = ["white","lightgrey","red","yellow","lightgreen","lightblue","pink","black","grey","brown","orange","green","blue","purple"],
	const_color_value = ["white","#D3D3D3","#D30008","#ECE824","#8FDB21","#159CD8","#CB89BB","black","#6F6F6F","#993229","#F57E20","#008C4A","#0059B4","#75449A"],
	const_pixel_mm = 96 / 25.4;
var cache_resizeTypeToNum = {'nw-button':0,'ne-button':1,'sw-button':2,'se-button':3,'n-button':4,'s-button':5,'w-button':6,'e-button':7,'r-button':8},
	cache_textAlign = {'left':0,'center':1,'right':2,'start':0,'end':2,'justify':3},
	cache_panelTypeToNum = {'clear':-1,'setting':0,'page':1,'text':2,'shape':3,'photo':4,'clipart':5,'help':6,'margin':7};
var actionList = [],naction = 0,curaction = 0,disableRegisterAction = true,blockdata = false, blockAfterAction = false;
var outputImageSrc,svgImageData;
var reloadPreventFlag = 1;

window.addEventListener('DOMContentLoaded',main,false);
window.addEventListener('load',loadedmain,false);

function css( element, property ) {return window.getComputedStyle( element, null ).getPropertyValue( property );}
function squaredis(xa,ya,xb,yb) {return (xa - xb) * (xa - xb) + (ya - yb) * (ya - yb);}
function testPointClockwise(x1,y1,x2,y2) {return (x2-x1) * (y2+y1);}
function pixel2mm(num) {return num / const_pixel_mm;}
function mm2pixel(num) {return num * const_pixel_mm;}
function radius2deg(num) {return num * 180 / Math.PI;}
function deg2radius(num) {return num * Math.PI / 180;}
function removejscssfile(filename, filetype) {
	var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist from
	var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
	var allsuspects=document.getElementsByTagName(targetelement)
	for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
	if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
		allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
	}
}
/******************MAIN*******************************/
//main: Initializing and called right after the DOM is parsed, but not all css and js is available
//loadedmain: Initializing and called after the document is loaded
//cleanup: clean some uncompatible prestashop css
//DrawCanvasMouse....: get data from mouse event on canvas
//preventKeyManager...: active/deactive keyboard listener temporally
//KeyManager: manage keyboard shortcut
//WindowResize: call all other objects to redraw on windows resize
function main() {
	cleanup();
	window.onbeforeunload = function() {
		if (reloadPreventFlag) return "Are you sure want to leave ?";
	};
	
	var i,tmp;
	holdercanvas = document.getElementById("holdercanvas");
	maincanvas = document.getElementById("drawcanvas");
	margincanvas = document.getElementById("margincanvas");
	maincanvas.addEventListener('mousedown', DrawCanvasMouseDown);
	maincanvas.addEventListener('mousemove', DrawCanvasMouseMove);
	window.addEventListener('mouseup', DrawCanvasMouseUp);
	window.addEventListener('keydown', KeyManager);
	window.addEventListener('resize', WindowResize);
	
	document.getElementById('addBorder').addEventListener('change',addBorder);
	borderWidth = document.getElementById('borderWidth');borderWidth.addEventListener('input',changeWidth);
	borderMargin = document.getElementById('borderMargin');borderMargin.addEventListener('input',changeMargin);
	tmp = {};tmp.target = document.getElementById('addBorder');
	addBorder(tmp);
	
	document.getElementById("heightCanvas").addEventListener("change",changeSizeCustom);
	document.getElementById("widthCanvas").addEventListener("change",changeSizeCustom);
	document.getElementById("selectionLengthCanvas").addEventListener("change",changeSizeDropDown);
		
	cacheDeleteButton = document.getElementById("DeleteButton");
	cacheCloneButton = document.getElementById("CloneButton");
	cacheUndoButton = document.getElementById("UndoButton");
	cacheRedoButton = document.getElementById("RedoButton");
	cacheZoomFactorInput = document.getElementById("ZoomFactorInput");
	cacheSaveButton = document.getElementById("SaveButton");
	cachePreviewDesign = document.getElementById("previewDesign");
	cacheCoverProgressBar = document.getElementById("uploadProgressBar");
	cacheCloneButton.addEventListener("click",CloneAction);
	cacheUndoButton.addEventListener("click",UndoAction);
	cacheRedoButton.addEventListener("click",RedoAction);
	cacheDeleteButton.addEventListener("click",DeleteAction);
	document.getElementById("LogoButton").addEventListener("click",goBackToOrder);
	document.getElementById("SubmitButton").addEventListener("click",submitDesign);
	document.getElementById("closeCover").addEventListener("click",closeSubmit);
	document.getElementById("UploadButton").addEventListener("click",UploadAction,false);
	document.getElementById("AddTextButton").addEventListener("click",AddTextAction);
	document.getElementById("ShapesButton").addEventListener("click",ClipArtPanelAction);
	document.getElementById("HelpButton").addEventListener("click",HelpPanelAction);
	document.getElementById('UploadImage').addEventListener('change',FileUploadAction);
	document.getElementById("ZoomReset").addEventListener("click",ZoomResetAction);
	document.getElementById("ZoomInButton").addEventListener("click",ZoomInAction);
	document.getElementById("ZoomOutButton").addEventListener("click",ZoomOutAction);
	cacheZoomFactorInput.addEventListener("change",ZoomCustomAction);
	cacheSaveButton.addEventListener("click",SaveDraftAction);
	setTimeout(SaveDraftAction, autoSaveInterval);

	cacheFontSizeInput = document.getElementById('fontSize');
	document.getElementById('textContent').addEventListener('input',changeTextContent);
	document.getElementById('fontFamily').addEventListener('change',changeFontFamily);
	cacheFontSizeInput.addEventListener('change',changeFontSize);
	document.getElementById('boldText').addEventListener('change',changeFontBold);
	document.getElementById('italicText').addEventListener('change',changeFontItalic);
	document.getElementById('underlineText').addEventListener('change',changeFontUnderline);
	tmp = document.getElementsByName('textAlign');for (i = 0;i < tmp.length;++i) tmp[i].addEventListener('change',changeFontAlign);
	document.getElementById('fadeImage').addEventListener('input',changeImageOpacity);
	document.getElementById('fadeShape').addEventListener('input',changeImageOpacity);
	document.getElementById('convertWhiteToTransparent').addEventListener('change',changeImageWhiteToTransparent);
	document.getElementById("uploadbackgroundbutton").addEventListener("click",BackgroundImageAction);
	document.getElementById("BackgroundUploadImage").addEventListener("change",BackgroundImageUploadAction);
	document.getElementById("removebackgroundbutton").addEventListener("click",RemoveBackgroundImage);
	
	document.getElementById("shapeFlip").addEventListener("change",flipShape);
	
	cacheClipArtFilterInput = document.getElementById("searchClipArt");
	cacheClipArtCategory = document.getElementById("categoryClipArt");
	document.getElementById("searchClipArtButton").addEventListener("click",filterShape);
	cacheClipArtCategory.addEventListener("change",filterShape);
	
	tmp = document.getElementsByClassName('layerbutton front');for (i = 0;i < tmp.length;++i) tmp[i].addEventListener('click',layerFront);
	tmp = document.getElementsByClassName('layerbutton back');for (i = 0;i < tmp.length;++i) tmp[i].addEventListener('click',layerBack);
	tmp = document.getElementsByTagName('input');
	for (i = 0;i < tmp.length;++i)
	{
		if (tmp[i].type == "file" || tmp[i].type == "color" || tmp[i].type == "radio" || tmp[i].classList.contains("system")) continue;
		if (tmp[i].type == "range")
		{
			tmp[i].addEventListener('focus',selectorPreRegisterAction);
			tmp[i].addEventListener('change',selectorRegisterAction);
		}
		else
		{
			tmp[i].addEventListener('focus',inputRegisterAction);
			tmp[i].addEventListener('input',inputRegisteringAction);
			tmp[i].addEventListener('change',inputFinishAction);
		}
		if (tmp[i].type == "text")
		{
			tmp[i].addEventListener('focus',preventKeyManagerActive);
			tmp[i].addEventListener('blur',preventKeyManagerDeactive);
		}
	}
	tmp = document.getElementsByTagName('select');
	for (i = 0;i < tmp.length;++i)
	{
		if (tmp[i].classList.contains("system")) continue;
		tmp[i].addEventListener('focus',selectorPreRegisterAction);
		tmp[i].addEventListener('change',selectorRegisterAction);
	}
}
function loadedmain() {
	if (productID == 0) alert("Missing product ID, do not continue. Please refresh this page or contact suppport if the problem occurs again");
	helpText = decodeURIComponent(helpText);
	document.getElementById("helpContent").innerHTML = helpText;
	//~~~~load sizedropdownhere
	//~~~~config shapes
	changeSizeDropDown();
	if (templateURL != '') loadTemplate();
	else
	{
		try {
			if (productID == localStorage.productID) LoadDraftAction();
		}
		catch (e)
		{
			console.log(e);
		}
	}
	
	initPanel();
	initShape();
	ZoomResetAction();
	disableRegisterAction = false;
}
function cleanup() {
	removejscssfile("foundation.min.css", "css");
	removejscssfile("global.css", "css");
}
function DrawCanvasMouseMove(e) {
	var m = {};
	m.x = e.x - canvasX * zf + maincanvas.scrollLeft;
	m.y = e.y - canvasY * zf + maincanvas.scrollTop;
	if (isDraggingObj) selectedObject.Move(m);
	if (isResizingObj && (!selectedObject.classList.contains("rotated") || (resizeType == 8))) selectedObject.Resize[resizeType](m);
}
function DrawCanvasMouseDown(e) {
	if (!isSelectingObj)
	{
		if (selectedObject) selectedObject.classList.remove("selected");
		changeContextualPanel("setting");
		isSelectedObj = false;
		cacheDeleteButton.classList.add("disabled");
		cacheCloneButton.classList.add("disabled");
	}
}
function DrawCanvasMouseUp(e) {
	if (isDraggingObj || isResizingObj) selectedObject.MouseUp(e);
	isSelectingObj = isDraggingObj = isResizingObj = false; //force clear all states
}
function preventKeyManagerActive(e) {preventKeyManager = true;}
function preventKeyManagerDeactive(e) {preventKeyManager = false;}
function KeyManager(e) {
	if (preventKeyManager) return;
	var flag,sflag = false;
	if (flag = e.keyCode == 46) DeleteAction();sflag = sflag || flag;
	if (flag = e.keyCode == 90 && e.ctrlKey) UndoAction();sflag = sflag || flag;
	if (flag = e.keyCode == 89 && e.ctrlKey) RedoAction();sflag = sflag || flag;
	if (flag = e.keyCode == 67 && e.ctrlKey) CopyAction();sflag = sflag || flag;
	if (flag = e.keyCode == 88 && e.ctrlKey) CutAction();sflag = sflag || flag;
	if (flag = e.keyCode == 86 && e.ctrlKey) PasteAction();sflag = sflag || flag;
	if (flag = e.keyCode == 83 && e.ctrlKey) SaveDraftAction();sflag = sflag || flag;
	if ((e.keyCode == 107 || e.keyCode == 187)) ZoomInAction();sflag = sflag || flag;
	if ((e.keyCode == 109 || e.keyCode == 189)) ZoomOutAction();sflag = sflag || flag;
	if (sflag) e.preventDefault();
}
function WindowResize(e) {
	var tmprect = holdercanvas.getBoundingClientRect();
	canvasX = tmprect.left;
	canvasY = tmprect.top;
	holdercanvasX = holdercanvas.offsetLeft;
	holdercanvasY = holdercanvas.offsetTop;
	
	var i,drawobjs = document.getElementsByTagName("draw-object");
	for (i = 0;i < drawobjs.length;++i) drawobjs[i].RedrawHelpers(null);
}
/***************SETTING AREA**************************/
//initPanel: At zero, all panels have length, initPanel saves their rendered length and make everything have zero-length, so it can be animated as scrolling panel later.
//			 Anyone who hardcode this length is a bad programmer. Different OS, different browser gives different render length. That's why.
//initShape: read the shape list, add it to the database, assign keyword, categories.
//filterShape: hide anything that's not related to user's search
//changePanel: change the Panel, called when click on the Panel's header
//changeContextualPanel: change the Panel, called from object click.
//					     + parameters: 'shape','shape2','text','photo',......read the const cache_panelTypeToNum above
//changeSizeCanvas: change Canvas size
//changeSizeDropDown: change canvas size using dropdown menu
//changeSizeCustom: change canvas size using the textbox on setting panel
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
	allpanel[0].firstElementChild.click();
	allpanelholder.setAttribute("contextualType","normal");
}
function initShape() {
	var shapeHolder = document.getElementById("clipArtHolder");
	var i,j,k,element,thumb,categoryList = [];
	if (shapeList == null) return;
	for (i = 0;i < shapeList.length;++i) {
		element = document.createElement("div");
		element.classList.add("clipartThumb");
		for (j = 0;j < shapeList[i].categories.length;++j)
		{
			element.classList.add(shapeList[i].categories[j]);
			for (k = 0;k < categoryList.length;++k) if (categoryList[k] == shapeList[i].categories[j]) break;
			if (k == categoryList.length) categoryList.push(shapeList[i].categories[j])
		}
		for (j = 0;j < shapeList[i].keyword.length;++j)
		{
			element.classList.add(shapeList[i].keyword[j]);
			element.title += shapeList[i].keyword[j] + " ";
		}
		thumb = document.createElement("img");
		thumb.src = shapeList[i].imageurl;
		thumb.classList.add("icon");
		element.addEventListener('click',ShapesAction);
		element.appendChild(thumb);
		shapeHolder.appendChild(element);
	}
	categoryList.sort();
	var categoryHolder = document.getElementById("categoryClipArt");
	for (i = 0;i < categoryList.length;++i)
	{
		element = document.createElement("option");
		element.textContent = element.value = categoryList[i];
		categoryHolder.appendChild(element);
	}
}
function filterShape() {
	var wordlist = cacheClipArtFilterInput.value.split(' ');
	var category = cacheClipArtCategory.value;
	var i,j,thumbList = document.getElementsByClassName('clipartThumb');
	var displayType;
	if ((wordlist.length == 1) && (wordlist[0] == "")) wordlist = [];
	for (i = 0;i < thumbList.length;++i)
	{
		displayType = 1;
		if ((category != "All_All") && (!thumbList[i].classList.contains(category))) displayType = 0;
		if (displayType)
		{
			if (wordlist.length > 0)
			{
				for (j = 0; j < wordlist.length;++j)
					if (thumbList[i].classList.contains(wordlist[j]))
					{
						displayType = 2;
						break;
					}
			}
			else displayType = 2;
		}
		thumbList[i].style.display = (displayType == 2) ? "inline-block" : "none";
	}
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
function changeContextualPanel(type) {
	if (type == "shape2") type = "shape";
	var numtype;
	numtype = cache_panelTypeToNum[type];
	if (numtype == null) numtype = 0;
	if (numtype == -1) type = "normal";
	allpanelholder.setAttribute("contextualType",type);
	if (numtype == -1) for (var i = allpanel.length - 1;i >= 0;--i) allpanel[i].classList.remove("selected");
	else if (!allpanel[numtype].classList.contains("selected")) allpanel[numtype].firstElementChild.click();
}
function changeSizeCanvas(width,height) {
	holdercanvas.style.height = height + "mm";
	holdercanvas.style.width = width + "mm";
	var tmprect = holdercanvas.getBoundingClientRect();
	canvasX = tmprect.left;
	canvasY = tmprect.top;
	holdercanvasX = holdercanvas.offsetLeft;
	holdercanvasY = holdercanvas.offsetTop;
	
	var i,drawobjs = document.getElementsByTagName("draw-object");
	for (i = 0;i < drawobjs.length;++i) drawobjs[i].RedrawHelpers(null);
	changeWidth(null);
}
function changeSizeDropDown() {
	var lenstr = document.getElementById("selectionLengthCanvas").value,width,height;
	if (lenstr == "custom") return;
	height = parseInt(lenstr);
	width = parseInt(lenstr.substring(lenstr.indexOf(" ")));
	document.getElementById("heightCanvas").value = document.getElementById("heightCanvas").defaultValue = height;
	document.getElementById("widthCanvas").value = document.getElementById("widthCanvas").defaultValue = width;
	changeSizeCanvas(width,height);
}
function changeSizeCustom() {
	var width = document.getElementById("widthCanvas").value,height = document.getElementById("heightCanvas").value, lenstr = height + " " + width;
	var i,dropdownmenu = document.getElementById("selectionLengthCanvas");
	for (i = 1;i < dropdownmenu.length;++i)
		if (dropdownmenu.options[i].value == lenstr)
		{
			dropdownmenu.selectedIndex = i;
			break;
		}
	if (i == dropdownmenu.length) dropdownmenu.selectedIndex = 0;
	changeSizeCanvas(width,height);
}
/***************COLOR PICKER**************************/
//ColorPicker class: It's the colorpicker. If you choose a color, it will check with itself (background colorpicker, text colorpicker or shape colorpicker), then it change the selectedObject's color
//changeColor: use the value of the clicked button (color value), its type to change selectedObject color
//customColor: append a new custom color button 
//callback: initialize
var ColorPickerButtonProto = Object.create(HTMLDivElement.prototype, {
	PickColor: {
		value: function(e) {
			this.parentNode.changeColor(e.target.parentNode.id,this.getAttribute("value"));
		}
    }
});
ColorPickerButtonProto.createdCallback = function() {
	this.addEventListener('click', this.PickColor);
};
var ColorPickerButton = document.registerElement('color-picker-button',{prototype: ColorPickerButtonProto});
var ColorPickerProto = Object.create(HTMLDivElement.prototype, {
	changeColor: {
		value: function(type,color) {
			if ((color == "na") || (color == "none"))
			{
				this.lastElementChild.click();
				return;
			}
			
			var elementstyle,cssstyle,elementobj;
			switch (type) {
				case "borderColorPicker": 
					elementstyle = "borderColor";
					cssstyle = "border-color";
					elementobj = margincanvas;
					break;
				case "textColorPicker": 
					elementstyle = "color";
					cssstyle = "color";
					elementobj = selectedObject.rootContent;
					break;
				case "backgroundColorPicker": 
					elementstyle = "backgroundColor";
					cssstyle = "background-color";
					elementobj = holdercanvas;
					break;
				case "shapeColorPicker": 
					elementstyle = "fill";
					cssstyle = "fill";
					if (selectedObject.drawType == "shape") elementobj = selectedObject.rootContent.firstElementChild.contentDocument.getElementsByClassName('fil0')[0];
					else if (selectedObject.drawType == "shape2") elementobj = selectedObject.rootContent.firstElementChild.lastElementChild.children[0];
					selectedObject.innerDocumentColor = color;
					break;
				default: break;
			}
			RegisterAction(elementstyle,elementobj,css(elementobj,cssstyle),color);
			if (type == "shapeColorPicker")
			{
				if (selectedObject.drawType == "shape")
				{
					elementobj = selectedObject.rootContent.firstElementChild.contentDocument.getElementsByClassName('fil0');
					for (var i = 0;i < elementobj.length;++i) elementobj[i].style[elementstyle] = color;
				}
				else if (selectedObject.drawType == "shape2")
				{
					elementobj = selectedObject.rootContent.firstElementChild.lastElementChild.children;
					for (var i = 0;i < elementobj.length;++i) elementobj[i].style[elementstyle] = color;
				}
			}
			else
			{
				elementobj.style[elementstyle] = color;
			}
		}
    },
	customColor: {
		value: function(e) {
			e.target.parentNode.changeColor(e.target.parentNode.id,e.target.value);
			var i,pickers = e.target.parentNode.getElementsByClassName("picker");
			for (i = 0;i < pickers.length;++i)
				if (pickers[i].getAttribute("value") == e.target.value) return;
			
			var pickerheader = e.target.parentNode.getElementsByClassName("picker header")[0];
			pickerheader.style.backgroundColor = e.target.value;
			pickerheader.setAttribute("value",e.target.value);
			pickerheader.classList.remove("header");
			if (pickerheader.nextElementSibling.getAttribute("value") != "na") pickerheader.nextElementSibling.classList.add("header");
			else e.target.parentNode.getElementsByClassName("picker")[0].classList.add("header");
		}
	}
});
ColorPickerProto.createdCallback = function() {
	var i,button;
	for (i = 0;i < const_color.length;++i)
	{
		button = new ColorPickerButton();
		button.classList.add(const_color[i]);
		button.setAttribute('value',const_color_value[i]);
		this.appendChild(button);
	}
	button = document.createElement("div");
	button.classList.add("divider");
	this.appendChild(button);
	
	for (i = 0;i < 6;++i)
	{
		button = new ColorPickerButton();
		button.classList.add("picker");
		if (i == 0) button.classList.add("header");
		button.setAttribute('value',"none");
		this.appendChild(button);
	}
	button = new ColorPickerButton();
	button.classList.add("colorpicker");
	button.setAttribute('value',"na");
	this.appendChild(button);
	
	button = document.createElement('input');
	button.setAttribute('type','color');
	button.addEventListener('change',this.customColor)
	this.appendChild(button);
};
var ColorPicker = document.registerElement('color-picker',{prototype: ColorPickerProto});
/***************RESIZE BUTTON*************************/
//ResizeButtonObject: each drawObject (see below) has resize buttons, so user can click these button and resize. This class will just fire the event (which button was clicked), DrawObject will handle the resize process because event data is only available to drawCanvas
var ResizeButtonObjectProto = Object.create(HTMLDivElement.prototype, {
	MouseDown: {
		value: function(e) {
			resizeType = cache_resizeTypeToNum[this.classList.item(0)];
			isResizingObj = true;
		}
    },
	MouseUp: {
		value: function(e) {
			isResizingObj = false;
		}
    }
});
ResizeButtonObjectProto.createdCallback = function() {
	this.addEventListener('mousedown', this.MouseDown);
	this.addEventListener('mouseup', this.MouseUp);
};
var ResizeButtonObject = document.registerElement('resize-button',{prototype: ResizeButtonObjectProto});
/***************DRAW OBJECT***************************/
//DrawObject: draw the object to the div canvas (not html5 canvas, html5 canvas is an overkill solution, beside there will be a ton of pain to recover svg data from html5 canvas)
//MouseDown: register mousedown on object, save position, initial value,...
//MouseUp: register mouseup on object, release the current action
//Move: move the object
//Resize: 9 functions related to 9 resize buttons: north-west, north-east, south-west, south-east, north, east, west, south, rotate
//rotateText: Rotate the object based on the rotate textbox
//Zoom: set the css zoom
//Action: perform additional (logic) action on object selection: remove selected class on other object, add selected class to this object, assign selectedObject, activate DeleteButton and CloneButton, changeContextualPanel, call additional action on sub-type
//SubAction: perform additional (logic) subaction on object selection, get the object data and add it to the panel, status textboxes.
//Init: assign init data on object construction, same as constructor
//Clone: assign init data on object clone, same as clone constructor
//...InitType: assign additional init data after Init is called
//topleftResize: resize object based on textboxes
//RedrawHelpers: on object redraw (moving, windowResize, constructor, clone,....) there are many things to redraw, such as arrow, value in status textboxes, this function helps to do stuff
//textFillToFit: increase/decrease the text-size to fit the object container
//fitToText: increase/decrease the container size to fit the text inside
//toSVGObject: convert to SVG object (not the whole SVG file)
//fromSVGObject: assign data from SVG object (not the whole SVG file),SVGParent is the whole SVG Document, the only purpose is to copy styles
//toObject: convert to JSON
//fromObject: assign data from JSON
//createdCallback: initializing
var DrawObjectProto = Object.create(HTMLElement.prototype, {
	MouseDown: {
		value: function(e) {
			this.Action();
			var m = {};
			m.x = e.x - canvasX * zf + maincanvas.scrollLeft;
			m.y = e.y - canvasY * zf + maincanvas.scrollTop;
			isDraggingObj = !isResizingObj;
			isSelectingObj = true;
			if (isResizingObj)
			{
				oldX = m.x;
				oldY = m.y;
				oldF = parseInt(css(this.rootContent,'font-size'));
				posX = this.offsetLeft * zf;
				posY = this.offsetTop * zf;
				lenX = this.clientWidth * zf;
				lenY = this.clientHeight * zf;
				clenX = this.offsetWidth * zf;
				clenY = this.offsetHeight * zf;
				cenX = posX + clenX / 2;
				cenY = posY + clenY / 2;
				
				var values = css(this,"transform");
				if (values && (values != "none"))
				{
					values = values.split('(')[1];
					values = values.split(')')[0];
					values = values.split(',');
					var a = values[0],b = values[1],c = values[2],d = values[3];
					oldR = Math.atan2(b, a);
				}
				else oldR = 0;
				var cssText = window.getComputedStyle(this,null);
				RegisterAction("size",this,cssText.left + " " + cssText.top + " " + cssText.width + " " + cssText.height,null);
			}
			else //if (isDraggingObj)
			{
				oldX = m.x - this.offsetLeft * zf;
				oldY = m.y - this.offsetTop * zf;
				var cssText = window.getComputedStyle(this,null);
				RegisterAction("size",this,cssText.left + " " + cssText.top + " " + cssText.width + " " + cssText.height,null);
			}
		}
    },
	MouseUp: {
		value: function(e) {
			isDraggingObj = isResizingObj = false;
			var cssText = window.getComputedStyle(this,null);
			RegisterAfterAction(cssText.left + " " + cssText.top + " " + cssText.width + " " + cssText.height);
		}
    },
	Move: {
		value: function(e) {
			this.style.left = (e.x - oldX) / zf + "px";
			this.style.top = (e.y - oldY) / zf + "px";
			this.RedrawHelpers(null);
		}
	},
	Resize: {
		value: [
			function(e) {
				var width,height,lengthX,lengthY,ratioWidth,ratioHeight,useRatioWidth;
				lengthX = posX + lenX;
				lengthY = posY + lenY;
				if ((e.x < lengthX) && (e.y < lengthY))
				{
					width = (oldX + lenX - e.x) / zf;
					height = (oldY + lenY - e.y) / zf;
					
					ratioWidth = width / lenX;
					ratioHeight = height / lenY;
					useRatioWidth = ratioWidth < ratioHeight ? 1 : 0;
					width = useRatioWidth ? width : ratioHeight * lenX;
					height = useRatioWidth ? ratioWidth * lenY : height;
					
					selectedObject.style.left = lengthX - width + "px";
					selectedObject.style.top = lengthY - height + "px";
					selectedObject.style.height = height + "px";
					selectedObject.style.width = width + "px";
					selectedObject.RedrawHelpers(null);
				}
			},
			function(e) {
				var width,height,lengthY,ratioWidth,ratioHeight,useRatioWidth;
				lengthY = posY + lenY;
				if (e.y < lengthY)
				{
					height = (oldY + lenY - e.y) / zf;
					width = (e.x - oldX + lenX) / zf;
					
					ratioWidth = width / lenX;
					ratioHeight = height / lenY;
					useRatioWidth = ratioWidth < ratioHeight ? 1 : 0;
					width = useRatioWidth ? width : ratioHeight * lenX;
					height = useRatioWidth ? ratioWidth * lenY : height;
					
					selectedObject.style.top =  lengthY - height + "px";
					selectedObject.style.height = height + "px";
					selectedObject.style.width = width + "px";
					selectedObject.RedrawHelpers(null);
				}
			},
			function(e) {
				var width,height,lengthX,ratioWidth,ratioHeight,useRatioWidth;
				lengthX = posX + lenX;
				if (e.x < lengthX)
				{
					height = (e.y - oldY + lenY) / zf;
					width = (oldX + lenX - e.x) / zf;
					
					ratioWidth = width / lenX;
					ratioHeight = height / lenY;
					useRatioWidth = ratioWidth < ratioHeight ? 1 : 0;
					width = useRatioWidth ? width : ratioHeight * lenX;
					height = useRatioWidth ? ratioWidth * lenY : height;
					
					selectedObject.style.left =  lengthX - width + "px";
					selectedObject.style.height = height + "px";
					selectedObject.style.width = width + "px";
					selectedObject.RedrawHelpers(null);
				}
			},
			function(e) {
				var width,height,ratioWidth,ratioHeight,useRatioWidth;
				width = (e.x - oldX + lenX) / zf;
				height = (e.y - oldY + lenY) / zf;
				
				ratioWidth = width / lenX;
				ratioHeight = height / lenY;
				useRatioWidth = ratioWidth < ratioHeight ? 1 : 0;
				width = useRatioWidth ? width : ratioHeight * lenX;
				height = useRatioWidth ? ratioWidth * lenY : height;
				
				selectedObject.style.width = width + "px";
				selectedObject.style.height = height + "px";
				selectedObject.RedrawHelpers(null);
			},
			function(e) {
				if (e.y < posY + lenY)
				{
					selectedObject.style.top = e.y / zf + "px";
					selectedObject.style.height = (oldY + lenY - e.y) / zf + "px";
					selectedObject.RedrawHelpers(null);
				}
			},
			function(e) {
				selectedObject.style.height = (e.y - oldY + lenY) / zf + "px";
				selectedObject.RedrawHelpers(null);
			},
			function(e) {
				if (e.x < posX + lenX)
				{
					selectedObject.style.left = e.x / zf + "px";
					selectedObject.style.width = (oldX + lenX - e.x) / zf + "px";
					selectedObject.RedrawHelpers(null);
				}
			},
			function(e) {
				selectedObject.style.width = (e.x - oldX + lenX) / zf + "px";
				selectedObject.RedrawHelpers(null);
			},
			function(e) { //actually this one is rotate
				var a = squaredis(cenX,cenY,oldX,oldY),
					b = squaredis(cenX,cenY,e.x,e.y),
					c = squaredis(e.x,e.y,oldX,oldY),
					cosC = (a + b - c) / (2 * Math.sqrt(a) * Math.sqrt(b));
					if (cosC > 1) cosC = 1;if (cosC < -1) cosC = -1;
					C = Math.acos(cosC);
				if (testPointClockwise(oldX,oldY,e.x,e.y) + testPointClockwise(e.x,e.y,cenX,cenY) + testPointClockwise(cenX,cenY,oldX,oldY) > 0)
					C = 2 * Math.PI - C;
				C += oldR;
				C = C - Math.floor(C / (2 * Math.PI)) * (2 * Math.PI);
				C = Math.floor(C * 180 / Math.PI) * (Math.PI / 180);
				if (Math.abs(C) < 0.0001) selectedObject.classList.remove("rotated"); else selectedObject.classList.add("rotated"); 
				selectedObject.style.transform = "rotate(" + C + "rad)";
				selectedObject.RedrawHelpers(C);
				specialRegisteringAction("rotate",oldR,C);
			}
		],
	},
	rotateText: {
		value: function(e) {
			selectedObject.style.transform = "rotate(" + e.target.value + "deg)";
			if (Math.abs(e.target.value) < 0.1) selectedObject.classList.remove("rotated"); else selectedObject.classList.add("rotated"); 
		}
	},
	Zoom: {
		value: function() {
			this.controlContent.style.zoom = rzfp + '%';
			this.style.outlineWidth = rzfb + 'px';
			this.RedrawHelpers(null);
		}
	},
	Action: {
		value: function() {
			if (selectedObject) selectedObject.classList.remove("selected");
			this.classList.add("selected");
			selectedObject = this;
			isSelectedObj = true;
			cacheDeleteButton.classList.remove("disabled");
			cacheCloneButton.classList.remove("disabled");
			changeContextualPanel(this.drawType);
			this.SubAction[this.drawType]();
		}
	},
	SubAction: {
		value: {
			"text" : function(type) {
				document.getElementById("textContent").value = selectedObject.rootContent.firstElementChild.textContent;
				document.getElementById('fontFamily').value = css(selectedObject.rootContent,'font-family').replace(/\'/g,'');
				cacheFontSizeInput.value = Math.round(pixel2mm(parseInt(css(selectedObject.rootContent,'font-size'))) * 10) / 10;
				document.getElementById('boldText').checked = (css(selectedObject.rootContent,'font-weight').indexOf('bold') != -1) ? true : false;
				document.getElementById('italicText').checked = (css(selectedObject.rootContent,'font-style').indexOf('italic') != -1) ? true : false;
				document.getElementById('underlineText').checked = (css(selectedObject.rootContent.firstElementChild,'text-decoration').indexOf('underline') != -1) ? true : false;
				document.getElementsByName('textAlign')[cache_textAlign[css(selectedObject.rootContent,'text-align')]].checked = true;
			},
			"photo" : function(type) {
				document.getElementById('fadeImage').value = css(selectedObject.rootContent,'opacity') * 100;
				document.getElementById('convertWhiteToTransparent').checked = ((selectedObject.cacheTransImgTik == null) || (selectedObject.cacheTransImgTik == 2)) ? false : true;
			},
			"shape" : function(type) {
				document.getElementById('shapeFlip').checked = (css(selectedObject.rootContent,'transform') == "none") ? false : true;
				document.getElementById('fadeShape').value = css(selectedObject.rootContent,'opacity') * 100;
			},
			"shape2" : function(type) {
				document.getElementById('shapeFlip').checked = (css(selectedObject.rootContent,'transform') == "none") ? false : true;
				document.getElementById('fadeShape').value = css(selectedObject.rootContent,'opacity') * 100;
			}
		}
	},
	Init: {
		value: function(type,data) {
			this.drawType = type;
			this.style.top = 0;
			this.style.left = 0;
			this[type + "InitType"](data);
			holdercanvas.appendChild(this);
			this.focus();
			this.Zoom();
			//this.RedrawHelpers(null); //Zoom already have it
			RegisterAction("display",this,"none","block");
		}
	},
	Clone: {
		value: function(obj) {
			this.drawType = obj.drawType;
			var newRootContent = obj.rootContent.cloneNode(true);
			this.rootContent.parentNode.insertBefore(newRootContent,this.rootContent);
			this.rootContent.parentNode.removeChild(this.rootContent);
			this.rootContent = newRootContent;
			if (this.drawType == "shape")
			{
				newRootContent.firstElementChild.onload = function () {
					var newobj = newRootContent.firstElementChild.contentDocument.getElementsByClassName('fil0'),color = css(obj.rootContent.firstElementChild.contentDocument.getElementsByClassName('fil0')[0],"fill");
					for (var i = 0;i < newobj.length;++i) newobj[i].style.fill = color;
					newRootContent.onload = null;
				}
			}
			if (obj.cacheTransImgTik)
			{
				this.cacheTransImgTik = obj.cacheTransImgTik;
				this.cacheTransImgOri = obj.cacheTransImgOri;
				this.cacheTransImgCon = obj.cacheTransImgCon;
			}
			this.drawlines[8].firstElementChild.value = obj.drawlines[8].firstElementChild.value;
			holdercanvas.appendChild(this);
			this.focus();
			this.Zoom();
			RegisterAction("display",this,"none","block");
		}
	},
	textInitType: {
		value: function(data) {
			var tmp = document.createElement("span");
			tmp.textContent = data;
			this.rootContent.style.fontSize = "15mm";
			this.rootContent.style.fontFamily = "Impact";
			this.rootContent.appendChild(tmp);
		}
	},
	photoInitType: {
		value: function(data) {
			var width,height,quotawidth,quotaheight;
			this.rootContent.appendChild(data);
			width = data.width;
			height = data.height;
			quotawidth = 0.8 * holdercanvas.offsetWidth - 10;
			quotaheight = 0.8 * holdercanvas.offsetHeight - 10;
			if (width > quotawidth)
			{
				height = quotawidth * height / width;
				width = quotawidth;
			}
			if (height > quotaheight)
			{
				width = quotaheight * width / height;
				height = quotaheight;
			}
			this.style.width = width + "px";
			this.style.height = height + "px";
		}
	},
	shapeInitType: {
		value: function(data) {
			var element;
			element = document.createElement("object");
			element.type = "image/svg+xml";
			element.data = data;//preserveAspectRatio="none"
			this.rootContent.appendChild(element);
			
			element = document.createElement("div");
			element.classList.add("translayer");
			this.rootContent.appendChild(element);
			var pthis = this;
			var img = new Image();
			img.src = data;
			img.onload = function() {
				var width,height,quotawidth,quotaheight;
				width = img.width;
				height = img.height;
				quotawidth = 0.8 * holdercanvas.offsetWidth - 10;
				quotaheight = 0.8 * holdercanvas.offsetHeight - 10;
				if (width > quotawidth)
				{
					height = quotawidth * height / width;
					width = quotawidth;
				}
				if (height > quotaheight)
				{
					width = quotaheight * width / height;
					height = quotaheight;
				}
				pthis.style.width = width + "px";
				pthis.style.height = height + "px";
				pthis.RedrawHelpers(null);
				img.onload = null;
			}
		}
	},
	topleftResize: {
		value: function(e) {
			var changeele,cssText;
			switch (e.target.parentNode.classList.item(1))
			{
				case "width-arrow": changeele = "width";break;
				case "height-arrow": changeele = "height";break;
				case "topcorner-arrow": changeele = "top";break;
				case "leftcorner-arrow": changeele = "left";break;
				default: console.log("something is wrong");return;
			}
			cssText = window.getComputedStyle(selectedObject,null);
			RegisterAction("size",selectedObject,cssText.left + " " + cssText.top + " " + cssText.width + " " + cssText.height,null);
			selectedObject.style[changeele] = e.target.value + "mm";
			cssText = window.getComputedStyle(selectedObject,null);
			RegisterAfterAction(cssText.left + " " + cssText.top + " " + cssText.width + " " + cssText.height);
			selectedObject.RedrawHelpers(null);
		}
	},
	RedrawHelpers: {
		value: function(rad) {
			var cssText = window.getComputedStyle(this,null);
			var rxpos = parseFloat(cssText.left), rypos = parseFloat(cssText.top), xpos = rxpos * zf,ypos = rypos * zf;
			this.drawlines[4].style.top = -ypos + "px";
			this.drawlines[4].style.height = ypos + "px";
			this.drawlines[5].style.left = -xpos + "px";
			this.drawlines[5].style.width = xpos + "px";
			this.drawlines[4].firstElementChild.value = Math.round(pixel2mm(rypos) * 10) / 10;
			this.drawlines[5].firstElementChild.value = Math.round(pixel2mm(rxpos) * 10) / 10;
			this.drawlines[6].firstElementChild.value = Math.round(pixel2mm(parseFloat(cssText.width)) * 10) / 10;
			this.drawlines[7].firstElementChild.value = Math.round(pixel2mm(parseFloat(cssText.height)) * 10) / 10;
			
			xpos += holdercanvasX * zf;ypos += holdercanvasY * zf;
			this.drawlines[1].style.top = this.drawlines[0].style.top = -ypos + "px";
			this.drawlines[1].style.height = this.drawlines[0].style.height = ypos + "px";
			this.drawlines[3].style.left = this.drawlines[2].style.left = -xpos + "px";
			this.drawlines[3].style.width = this.drawlines[2].style.width = xpos + "px";
			
			if (this.drawType == "text") cacheFontSizeInput.value = Math.round(pixel2mm(this.textFillToFit()) * 10) / 10;
			
			if (rad != null) this.drawlines[8].firstElementChild.value = Math.round(radius2deg(rad));
		}
	},
	textFillToFit: {
		value: function() {
			var fontSize = maxHeight = this.clientHeight;
			var ourText = this.rootContent.firstElementChild;
			var textHeight;
			do {
				this.rootContent.style.fontSize = fontSize + "px";
				textHeight = ourText.clientHeight;
				fontSize = fontSize - 1;
			} while ((textHeight > maxHeight) && fontSize > 3);
			var isJustifying = (css(this.rootContent,'text-align') == "justify");
			if (isJustifying)
			{
				var widthRatio = this.clientWidth / ourText.offsetWidth;
				this.rootContent.firstElementChild.style.transform = "scale(" + widthRatio + ",1)";
			}
			else
			{
				this.rootContent.firstElementChild.style.transform = "";
			}
			return fontSize;
		}
	},
	fitToText: {
		value: function(value) {
			var ratio = mm2pixel(value) / parseInt(css(this.rootContent,'font-size'));
			this.style.width = this.clientWidth * ratio + "px";
			this.style.height = this.clientHeight * ratio + "px";
			this.rootContent.style.fontSize = value + "mm";
			this.RedrawHelpers(null);
		}
	},
	toSVGObject: {
		value: function() {
			var shape,data,shapecss,rootcss,top,left,width,height,transform;
			shapecss = window.getComputedStyle(this, null);
			rootcss = window.getComputedStyle(this.rootContent, null);
			var values = shapecss.getPropertyValue('transform');
			if (values && (values != "none"))
			{
				values = values.split('(')[1];
				values = values.split(')')[0];
				values = values.split(',');
				var a = values[0],b = values[1],c = values[2],d = values[3];
				transform = Math.atan2(b, a);
			}
			else transform = 0;
			transform = Math.round(radius2deg(transform));
			switch (this.drawType)
			{
				case "text":
					shape = document.createElementNS(svgNS, "text");
					top = parseFloat(shapecss.top);
					left = parseFloat(shapecss.left);
					width = parseFloat(shapecss.width);
					height = parseFloat(shapecss.height);
					if (transform != 0) {shape.setAttributeNS(null, "transform", "rotate(" + transform + " " + (left + width / 2) + " " + (top + height / 2) + ")");}
					shape.setAttributeNS(null, "fill", rootcss.color);
					shape.setAttributeNS(null, "dominant-baseline", "text-before-edge");
					shape.setAttributeNS(null, "font-family", rootcss.fontFamily);
					shape.setAttributeNS(null, "font-size", rootcss.fontSize);
					shape.setAttributeNS(null, "text-decoration", rootcss.textDecoration.split(' ')[0]);
					shape.setAttributeNS(null, "font-weight", rootcss.fontWeight);
					shape.setAttributeNS(null, "font-style", rootcss.fontStyle);
					switch (rootcss.textAlign)
					{
						case "left":
							shape.setAttributeNS(null, "text-anchor", "start");
							break;
						case "center":
							left = left + width / 2;
							shape.setAttributeNS(null, "text-anchor", "middle");
							break;
						case "right":
							left = left + width;
							shape.setAttributeNS(null, "text-anchor", "end");
							break;
						case "justify":
							shape.setAttributeNS(null, "textLength", width);
							shape.setAttributeNS(null, "lengthAdjust", "spacingAndGlyphs");
							break;
						default: break;
					}
					shape.setAttributeNS(null, "x", left);
					shape.setAttributeNS(null, "y", top);
					data = document.createTextNode(this.rootContent.firstElementChild.textContent);
					shape.appendChild(data);
					break;
				case "photo":
					shape = document.createElementNS(svgNS, "image");
					top = parseFloat(shapecss.top);
					left = parseFloat(shapecss.left);
					width = parseFloat(shapecss.width);
					height = parseFloat(shapecss.height);
					if (transform != 0) {shape.setAttributeNS(null, "transform", "rotate(" + transform + " " + (left + width / 2) + " " + (top + height / 2) + ")");}
					shape.setAttributeNS(null, "x", left);
					shape.setAttributeNS(null, "y", top);
					shape.setAttributeNS(null, "width", width);
					shape.setAttributeNS(null, "height", height);
					shape.setAttributeNS(null, "opacity", rootcss.opacity);
					shape.setAttributeNS(xlinkns, "href", this.rootContent.firstElementChild.src);
					break;
				case "shape":
					shape = document.createElementNS(svgNS, "g");
					data = this.rootContent.firstElementChild.contentDocument.firstElementChild.cloneNode(true);
					top = parseFloat(shapecss.top);
					left = parseFloat(shapecss.left);
					width = parseFloat(shapecss.width);
					height = parseFloat(shapecss.height);
					if (transform != 0) {shape.setAttributeNS(null, "transform", "rotate(" + transform + " " + (left + width / 2) + " " + (top + height / 2) + ")");}
					data.setAttributeNS(null, "x", left);
					data.setAttributeNS(null, "y", top);
					data.setAttributeNS(null, "width", width);
					data.setAttributeNS(null, "height", height);
					shape.setAttributeNS(null, "opacity", rootcss.opacity);
					shape.appendChild(data);
					break;
				case "shape2":
					shape = document.createElementNS(svgNS, "g");
					data = this.rootContent.firstElementChild.cloneNode(true);
					top = parseFloat(shapecss.top);
					left = parseFloat(shapecss.left);
					width = parseFloat(shapecss.width);
					height = parseFloat(shapecss.height);
					if (transform != 0) {shape.setAttributeNS(null, "transform", "rotate(" + transform + " " + (left + width / 2) + " " + (top + height / 2) + ")");}
					data.setAttributeNS(null, "x", left);
					data.setAttributeNS(null, "y", top);
					data.setAttributeNS(null, "width", width);
					data.setAttributeNS(null, "height", height);
					shape.setAttributeNS(null, "opacity", rootcss.opacity);
					shape.appendChild(data);
					break;
				default: break;
			}
			return shape;
		}
	},
	fromSVGObject: {
		value: function(SVGDOM,SVGParent) { //image, text, something
			var tmp;
			switch (SVGDOM.tagName.toUpperCase())
			{
				/*case "TEXT":
					this.drawType = "text";
					tmp = document.createElement("span");
					tmp.textContent = SVGDOM.textContent;
					this.style.cssText = window.getComputedStyle(SVGDOM,null).cssText;
					//this.style.left = SVGDOM.getAttributeNS(null,"x");
					console.log(window.getComputedStyle(SVGDOM,null).cssText);
					//this.style.top = SVGDOM.getAttributeNS(null,"y");
					//this.style.width = SVGDOM.getAttributeNS(null,"width");
					//this.style.height = SVGDOM.getAttributeNS(null,"height");
					//style
					this.rootContent.appendChild(tmp);
					break;
				case "IMAGE":
					this.drawType = "photo";
					tmp = document.createElement("img");
					tmp.href = SVGDOM.getAttributeNS(xlinkns,"href");
					this.style.left = SVGDOM.getAttributeNS(null,"x");
					this.style.top = SVGDOM.getAttributeNS(null,"y");
					this.style.width = SVGDOM.getAttributeNS(null,"width");
					this.style.height = SVGDOM.getAttributeNS(null,"height");
					this.rootContent.appendChild(tmp);
					break;*/
				default:
					this.drawType = "shape2";
					var svgData = SVGParent.cloneNode(false);
					var gholder = document.createElementNS(svgNS, "g");
					if (SVGParent.firstElementChild.tagName.toUpperCase() == "DEFS") svgData.appendChild(SVGParent.firstElementChild.cloneNode(true));
					svgData.appendChild(gholder);
					gholder.appendChild(SVGDOM.cloneNode(true));
					//this.style.cssText = SVGParent.getComputedStyle(SVGDOM, null).cssText;
					//style
					/*this.style.width = SVGParent.width.baseVal.valueAsString;
					this.style.height = SVGParent.height.baseVal.valueAsString;
					this.drawType = "shape";
					tmp = document.createElement("object");
					tmp.type = "image/svg+xml";
					tmp.data = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svgData))));
					this.rootContent.appendChild(tmp);
					
					tmp = document.createElement("div");
					tmp.classList.add("translayer");
					this.rootContent.appendChild(tmp);*/
					this.rootContent.appendChild(svgData);
			}
			return this;
		}
	},
	toObject: {
		value: function() {
			var objformat = {};
			objformat.drawType = this.drawType;
			objformat.data = encodeURIComponent(this.rootContent.innerHTML);
			objformat.css = this.style.cssText;
			objformat.datacss = this.rootContent.style.cssText;
			objformat.rotated = this.drawlines[8].firstElementChild.value;
			objformat.innerDocumentColor = this.innerDocumentColor;
			return objformat;
		}
	},
	fromObject: {
		value: function(objformat) {
			this.drawType = objformat.drawType;
			this.style.cssText = objformat.css;
			this.rootContent.innerHTML = decodeURIComponent(objformat.data);
			this.rootContent.style.cssText = objformat.datacss;
			this.drawlines[8].firstElementChild.value = objformat.rotated;
			this.innerDocumentColor = objformat.innerDocumentColor;
			if (objformat.rotated != 0) this.classList.add("rotated");
			if (objformat.innerDocumentColor != "none")
				this.rootContent.firstElementChild.onload = function() {
					var obj = this.contentDocument.getElementsByClassName('fil0');
					for (var i = 0;i < obj.length;++i) obj[i].style.fill = objformat.innerDocumentColor;
					this.onload = null;
				}
			return this;
		}
	}
});
DrawObjectProto.createdCallback = function() {
	this.setAttribute("tabindex",0);
	this.innerDocumentColor = "none";
	
	var childelement,element,shadow = this,control;
	element = document.createElement("div");
	element.classList.add("content");
	shadow.appendChild(element);
	this.rootContent = element;
	
	control = document.createElement("div");
	control.classList.add("control");
	shadow.appendChild(control);
	this.controlContent = control;
	
	for (var buttonname in cache_resizeTypeToNum) {
		if (cache_resizeTypeToNum.hasOwnProperty(buttonname)) {
			element = new ResizeButtonObject();
			element.classList.add(buttonname);
			control.appendChild(element);
		}
	}
	this.drawlines = [];
	
	element = document.createElement("div");
	element.classList.add("drawline","topleft-line");
	control.appendChild(element);
	this.drawlines[0] = element;
	
	element = document.createElement("div");
	element.classList.add("drawline","topright-line");
	control.appendChild(element);
	this.drawlines[1] = element;
	
	element = document.createElement("div");
	element.classList.add("drawline","lefttop-line");
	control.appendChild(element);
	this.drawlines[2] = element;
	
	element = document.createElement("div");
	element.classList.add("drawline","leftbot-line");
	control.appendChild(element);
	this.drawlines[3] = element;
	
	element = document.createElement("div");
	element.classList.add("drawarrow","width-arrow");
	control.appendChild(element);
	childelement = document.createElement("input");
	childelement.classList.add("labelarrow");
	childelement.addEventListener("change",this.topleftResize);
	childelement.addEventListener('focus',preventKeyManagerActive);
	childelement.addEventListener('blur',preventKeyManagerDeactive);
	element.appendChild(childelement);
	this.drawlines[6] = element;
	
	element = document.createElement("div");
	element.classList.add("drawarrow","height-arrow");
	control.appendChild(element);
	childelement = document.createElement("input");
	childelement.classList.add("labelarrow");
	childelement.addEventListener("change",this.topleftResize);
	childelement.addEventListener('focus',preventKeyManagerActive);
	childelement.addEventListener('blur',preventKeyManagerDeactive);
	element.appendChild(childelement);
	this.drawlines[7] = element;
	
	element = document.createElement("div");
	element.classList.add("drawarrow","topcorner-arrow");
	control.appendChild(element);
	childelement = document.createElement("input");
	childelement.classList.add("labelarrow");
	childelement.addEventListener("change",this.topleftResize);
	childelement.addEventListener('focus',preventKeyManagerActive);
	childelement.addEventListener('blur',preventKeyManagerDeactive);
	element.appendChild(childelement);
	this.drawlines[4] = element;
	
	element = document.createElement("div");
	element.classList.add("drawarrow","leftcorner-arrow");
	control.appendChild(element);
	childelement = document.createElement("input");
	childelement.classList.add("labelarrow");
	childelement.addEventListener("change",this.topleftResize);
	childelement.addEventListener('focus',preventKeyManagerActive);
	childelement.addEventListener('blur',preventKeyManagerDeactive);
	element.appendChild(childelement);
	this.drawlines[5] = element;
	
	element = document.createElement("div");
	element.classList.add("rotation");
	control.appendChild(element);
	childelement = document.createElement("input");
	childelement.addEventListener("change",this.rotateText);
	childelement.addEventListener('focus',selectorPreRegisterAction);
	childelement.addEventListener('change',selectorRegisterAction);
	childelement.addEventListener('focus',preventKeyManagerActive);
	childelement.addEventListener('blur',preventKeyManagerDeactive);
	childelement.value = 0;
	element.appendChild(childelement);
	childelement = document.createElement("label");
	childelement.innerHTML = "&deg;";
	element.appendChild(childelement);
	this.drawlines[8] = element;
	
	this.addEventListener('mousedown', this.MouseDown);
	this.addEventListener('mouseup', this.MouseUp);
};

var drawObject = document.registerElement('draw-object',{prototype: DrawObjectProto});
/***************OBJECT ACTION*************************/
//UndoAction: on click UndoButton
//RedoAction: on click RedoButton
//inputRegisterAction: listen to html input to register action for Undo/Redo purpose
//inputRegisteringAction: listen to html input to register action for Undo/Redo purpose, this will receive and update all changes
//inputRegisterAfterAction: stop listening to html input and finalize register action
//inputFinishAction: stop listening to html input and finalize register action on blur (i.e: click outside of textbox)
//selectorRegisterAction,selectorPreRegisterAction: same as inputRegisterAction, but for html selector. Pre-register will just set the initial value, not involving into register process
//RegisterAction(type,target,olddata,newdata): register an action for Undo/Redo: type of action, target, old value, new value
//RegisteringAction: update new value to current registering action
//specialRegisteringAction: register an action and block after action immediately (afterAction listener will do nothing)
//RegisterAfterAction: finalize register an action
//PerformAction: perform a registered action to object(s)
//CopyAction: register object to be prepared to be copied
//CutAction: register object to be prepared to be copied, also delete it from canvas
//PasteAction: clone the registered copied-object
//CloneAction: clone the selected object
//ZoomAction: change the current zoom factor. newzf: new zoom factor, unit is %
//ZoomInAction: zoomAction with current zoom factor + 10%
//ZoomOutAction: zoomAction with current zoom factor - 10%
//ZoomResetAction: zoomAction with current zoom factor = 100%
//ZoomCustomAction: zoomAction with current zoom factor = userInput
//DeleteAction: HIDE THE OBJECT !!!!!!!!, but it won't be saved.
//UploadAction: Upload an user photo to the canvas
//FileUploadAction: Handle the user photo, convert it to base64 (why dont we just make blob url ? What if user move the photo ? Dont be lazy)
//AddTextAction: Add a new text object
//ShapesAction: add a new shape
//ClipArtPanelAction,HelpPanelAction: open ClipArt,Help Panel
//addBorder: add/remove the border
//changeWidth,changeMargin: change border's width,margin
//changeTextContent, changeFontFamily, changeFontSize, changeFontBold, changeFontItalic, changeFontUnderline, changeFontAlign: change text's style
//layerFront, layerBack: move selectedObject to front/back
//changeImageOpacity: fade image
//whiteToTransparent: change white pixel of image to transparent
//changeImageWhiteToTransparent: toggle for the above function, also cache, improve speed
//BackgroundImageAction, BackgroundImageUploadAction: same as UploadAction and FileUploadAction, but this one is about canvas background
//RemoveBackgroundImage: delete it
//flipShape: flip the shape
//getHourMin: get hh:mm
//SaveDraftAction, LoadDraftAction: save/load draft to localStorage. When upgrading to the cloud, please use loadTXTTemplate (load) and createRAW (save) instead
//createRAW: create JSON object that describe the whole canvas
//createSVG: create SVG image from the whole canvas
//SVG2JPG: svg to jpg using canvas, for preview purpose, when the user is uploading something, it's better to have a final preview to ask them: "Hey is this printscreen is what you have designed ?"
//submitDesign: half first process of the submit action: create SVG and JPG, call the second half (previewLoaded)
//previewLoaded: second half process of the submit action: package all information (designID (on overwrite), productID, svg, preview, raw) and send it to server
//uploadProgress: track the uploading progress
//finishedUpload: get return value, also update designID
//closeSubmit: close submit layer
//loadTemplate: load a template from templateURL, check if it's raw(txt/our JSON data) or SVG, then call 2 other function to handle it
//loadSVGTemplate: handle SVG template
//loadTXTTemplate: handle raw template
//goBackToOrder: the 'logo' onclick, just back to the product page.

//Have fun, good luck
//Note1: I dont really like documentation, because most of the time my code says what it does already, unless it's a super tricky workaround or bug or trick or cache, i will write comment
//			variable name, loop, function name already says the action
//Note2: why I have to insert an iframe then an object inside it in loadTemplate ? Why iframe ? Why object ? Why not just one ? Well.... that's your job to find out. I dont do useless stuff and it's the only thing that I haven't explained.
//Note3: comment start with ~~~~ stands for code-note. I use it to note if any part of the code need to be review because there is a bug, or it's a debug code, or it's a useless code just waiting to be deleted, or a feature that need here, or unfinished job here. But it always says what I was doing
//Note4: unless you have a ton of free time, dont bother find a solution for saving draft design locally. Here is my research:
//		+ localStorage is available on most browser, however, 2MB limit on chrome (at the moment)
//		+ IndexedDB/WebSQLDB: dont bother use it, not all browser support them
//		+ Solution ? well the boss want it to be on the cloud so just put it to cloud
//		+ Still want offline solution ? Detect browser, then decide save mode.
//Note 5: Load template from SVG is a pain and a hell, so this is what I figured and did (please solve the quiz I gave you in Note 2)
//		+ Basically, on computer, there are no "mm" or "inch", all is pixel. The computer trick us to think there is "mm" or "inch" because it has DPI, but it's not always correct
//		+ What CorelDraw does in this situation, is like, if you want 11.2mm length svg, it will make it 1120 pixel, but the viewbox and the width/height it will set back to 11.2 mm
//		+ So if you can get the declared/computed CSS (I use the second way), everything will be x100 in pixel! so you have to get the actual width and scale it back
//Note 6: flip is bugged on saving
//Note 7: Saving to SVG (and JPG) is bugged on color, it was because of the overlapping styles, you have to get the fill-color style out and override it (force set color to it) before saving or upon construction. Or simply make inline style
//Note 8: Dont save to PNG, save to JPG, if you save to PNG, some user can steal the image in PNG format (right click and save as). The purpose is not provide super security, but just make it harder for thief.
function UndoAction() {
	if (curaction == 0) return;
	curaction = curaction - 1;
	var action = actionList[curaction];
	PerformAction(action.type,action.target,action.obj,action.olddata);
	if (curaction == 0) cacheUndoButton.classList.add("disabled");
	cacheRedoButton.classList.remove("disabled");
}
function RedoAction() {
	if (curaction == naction) return;
	var action = actionList[curaction];
	PerformAction(action.type,action.target,action.obj,action.newdata);
	curaction = curaction + 1;
	if (curaction == naction) cacheRedoButton.classList.add("disabled");
	cacheUndoButton.classList.remove("disabled");
}
function inputRegisterAction(e) {
	if (e.target.type == "checkbox") RegisterAction("checkbox",e.target,e.target.checked,!e.target.checked);
	else RegisterAction("value",e.target,e.target.value);
}
function inputRegisteringAction(e) {
	if (e.target.type == "checkbox") return;
	RegisteringAction(e.target.value);
}
function inputRegisterAfterAction(e) {
	if (e.target.type == "checkbox") return;
	RegisterAfterAction(e.target.value);
}
function inputFinishAction(e) {
	if (blockdata)
	{
		if (actionList[curaction].newdata != actionList[curaction].olddata) naction = curaction = curaction + 1;
		blockdata = false;
	}
	if (curaction > 0) cacheUndoButton.classList.remove("disabled");
	e.target.blur();
}
function selectorRegisterAction(e) {
	var olddata = e.target.getAttribute("olddata"),newdata = e.target.value;
	if (olddata == null) olddata = e.target.defaultValue;
	e.target.setAttribute("olddata",newdata);
	RegisterAction("value",e.target,olddata,newdata);
	//console.log(olddata," -- ",newdata);
}
function selectorPreRegisterAction(e) {
	//console.log("preregister",e.target.value);
	e.target.setAttribute("olddata",e.target.value)
}
function RegisterAction(type,target,olddata,newdata) {
	//console.log(new Error().stack);
	if (disableRegisterAction) return;
	cacheRedoButton.classList.add("disabled");
	//console.log("writing to list",actionList,type,olddata,newdata,"blocked-",blockdata);
	if (blockdata)
	{
		if (actionList[curaction].newdata != actionList[curaction].olddata) naction = curaction = curaction + 1;
		blockdata = false;
	}
	if (curaction < actionList.length)
	{
		actionList.splice(curaction, actionList.length - curaction);
		naction = actionList.length;
	}
	blockdata = true;
	actionList[curaction] = {};
	actionList[curaction].type = type;
	actionList[curaction].target = target;
	actionList[curaction].obj = selectedObject;
	actionList[curaction].olddata = olddata;
	actionList[curaction].newdata = olddata;
	if ((newdata != null) && (newdata != olddata))
	{
		actionList[curaction].newdata = newdata;
		naction = curaction = curaction + 1;
		blockdata = false;
	}
	if (curaction > 0) cacheUndoButton.classList.remove("disabled");
}
function RegisteringAction(newdata) {
	if (disableRegisterAction) return;
	//console.log('registering',newdata);
	actionList[curaction].newdata = newdata;
}
function specialRegisteringAction(type,olddata,newdata) {
	if (disableRegisterAction) return;
	//console.log('special registering',newdata);
	actionList[curaction].type = type;
	actionList[curaction].olddata = olddata;
	actionList[curaction].newdata = newdata;
	blockAfterAction = true;
}
function RegisterAfterAction(newdata) {
	if (disableRegisterAction) return;
	//console.log('finished',newdata,'blocked:',blockAfterAction);
	blockdata = false;
	if (blockAfterAction == true)
	{
		if (actionList[curaction].newdata != actionList[curaction].olddata) naction = curaction = curaction + 1;
		blockAfterAction = false;
		return;
	}
	if (newdata != null) actionList[curaction].newdata = newdata;
	if (newdata != actionList[curaction].olddata) naction = curaction = curaction + 1;
	if (curaction > 0) cacheUndoButton.classList.remove("disabled");
}
function PerformAction(action,target,obj,data) {
	disableRegisterAction = true;
	DrawCanvasMouseDown(null);
	selectedObject = obj;
	switch (action) {
		case "size":
			var values = data.split(' ');
			target.style.left = values[0];
			target.style.top = values[1];
			target.style.width = values[2];
			target.style.height = values[3];
			target.RedrawHelpers(null);
			break;
		case "rotate":
			target.style.transform = "rotate(" + data + "rad)";
			target.RedrawHelpers(data);
			break;
		case "value":
			target.value = data;
			var evt = document.createEvent("HTMLEvents");evt.initEvent("change",true,true);target.dispatchEvent(evt);
			evt = document.createEvent("HTMLEvents");evt.initEvent("input",true,true);target.dispatchEvent(evt);
			break;
		case "fill":
			if (obj.drawType == "shape") target = obj.rootContent.firstElementChild.contentDocument.getElementsByClassName('fil0');
			else if (obj.drawType == "shape2") target = obj.rootContent.firstElementChild.lastElementChild.children;
			for (var i = 0;i < target.length;++i) target[i].style[action] = data;
			break;
		case "checkbox": 
			target.click();
			break;
		case "display":
			if (data == "none") DrawCanvasMouseDown(); else target.Action();
		default:
			target.style[action] = data;
			break;
	}
	if (obj)
	{
		selectedObject.RedrawHelpers(null);
		selectedObject.Action();
	}
	disableRegisterAction = false;
}
function CopyAction() {
	if (!isSelectedObj) return;
	copiedObject = selectedObject;
}
function CutAction() {
	CopyAction();
	DeleteAction();
}
function PasteAction() {
	if (!copiedObject) return;
	var newobj = copiedObject.cloneNode(false);
	newobj.Clone(copiedObject);
	newobj.Action();	
}
function CloneAction() {
	CopyAction();
	PasteAction();
}
function ZoomAction(newzf) {
	cacheZoomFactorInput.value = newzf;
	zoomFactor = newzf;zf = newzf / 100;rzf = 100 / newzf;rzfp = 10000 / newzf;rzfb = 200 / newzf;
	holdercanvas.style.zoom = zoomFactor + '%';
	var i,objlist = document.getElementsByTagName('draw-object');
	for (i = 0;i < objlist.length;++i) objlist[i].Zoom();
	WindowResize(null);
}
function ZoomInAction() {ZoomAction(zoomFactor + 10);}
function ZoomOutAction() {ZoomAction(zoomFactor - 10);}
function ZoomResetAction() {ZoomAction(defaultZoomFactor);}
function ZoomCustomAction(e) {if (Number(e.target.value)) ZoomAction(e.target.value);}
function DeleteAction() {
	if (isSelectedObj)
	{
		selectedObject.style.display = "none";
		RegisterAction("display",selectedObject,"block","none");
		DrawCanvasMouseDown();
	}
}
function UploadAction() {
	document.getElementById("UploadImage").click();
}
function FileUploadAction(e) {
	var file = this.files[0];
	if (!file.type || !file.type.match(/image.*/))
	{
		alert("This file is not supported!");
		return;
	}
	
	var fr = new FileReader;
	fr.onload = function() { // file is loaded
		var img = new Image;

		img.onload = function() {
			img.onload = null;
			var newobj = new drawObject();
			newobj.Init("photo",img);
			newobj.Action();
		};

		img.src = fr.result;
		img.draggable = false;
		document.getElementById("UploadImage").value = '';
	};
	
	fr.readAsDataURL(file);
}
function AddTextAction() {
	var newobj = new drawObject();
	newobj.Init("text","New Text");
	newobj.Action();
}
function ShapesAction(e) {
	var newobj = new drawObject();
	var obj = e.target;
	if (obj.tagName == "DIV") obj = obj.firstElementChild;
	newobj.Init("shape",obj.src);
	newobj.Action();
}
function ClipArtPanelAction() {
	changeContextualPanel("clipart");
}
function HelpPanelAction() {
	changeContextualPanel("help");
}

function addBorder(e) {
	margincanvas.style.visibility = e.target.checked ? "visible" : "hidden";
}
function changeWidth(e) {
	var topbot = borderWidth.value;
	margincanvas.style.borderWidth = borderWidth.value + "mm";
	changeMargin(null);
}
function changeMargin(e) {
	var size = Number(borderMargin.value) + Number(borderWidth.value) * 2;
	margincanvas.style.width = pixel2mm(holdercanvas.clientWidth) - size + "mm";
	margincanvas.style.height = pixel2mm(holdercanvas.clientHeight) - size + "mm";
	margincanvas.style.top = borderMargin.value / 2 + "mm";
	if (borderMargin.value == 0)
	{
		if (margincanvas.offsetWidth < holdercanvas.clientWidth) margincanvas.style.width = margincanvas.clientWidth + holdercanvas.clientWidth - margincanvas.offsetWidth + "px";
		if (margincanvas.offsetHeight < holdercanvas.clientHeight) margincanvas.style.height = margincanvas.clientHeight + holdercanvas.clientHeight - margincanvas.offsetHeight + "px";
	}
}

function changeTextContent(e) {selectedObject.rootContent.firstElementChild.textContent = e.target.value;selectedObject.textFillToFit();}
function changeFontFamily(e) {selectedObject.rootContent.style.fontFamily = e.target.value;selectedObject.textFillToFit();}
function changeFontSize(e) {selectedObject.fitToText(e.target.value);}
function changeFontBold(e) {selectedObject.rootContent.style.fontWeight = e.target.checked ? "bold" : "normal";}
function changeFontItalic(e) {selectedObject.rootContent.style.fontStyle = e.target.checked ? "italic" : "normal";}
function changeFontUnderline(e) {selectedObject.rootContent.style.textDecoration = e.target.checked ? "underline" : "none";}
function changeFontAlign(e) {
	RegisterAction("textAlign",selectedObject.rootContent,css(selectedObject.rootContent,"text-align"),e.target.value);
	selectedObject.rootContent.style.textAlign = e.target.value;
	selectedObject.textFillToFit();
}
function layerFront(e) {
	var currentIndex = parseInt(css(selectedObject, "z-index")) || 0;
	selectedObject.style.zIndex = currentIndex + 1;
	RegisterAction("z-index",selectedObject,currentIndex,currentIndex + 1);
}
function layerBack(e) {
	var currentIndex = parseInt(css(selectedObject, "z-index")) || 0
	selectedObject.style.zIndex = currentIndex - 1;
	RegisterAction("z-index",selectedObject,currentIndex,currentIndex - 1);
}
function changeImageOpacity(e) {selectedObject.rootContent.style.opacity = e.target.value / 100;}
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
function changeImageWhiteToTransparent(e) {
	if (e.target.checked)
	{
		if (selectedObject.cacheTransImgTik == null)
		{
			selectedObject.cacheTransImgOri = selectedObject.rootContent.firstElementChild.src;
			selectedObject.cacheTransImgCon = whiteToTransparent(selectedObject.rootContent.firstElementChild);
		}
		selectedObject.cacheTransImgTik = 1;
		selectedObject.rootContent.firstElementChild.src = selectedObject.cacheTransImgCon;
	}
	else
	{
		selectedObject.cacheTransImgTik = 2;
		selectedObject.rootContent.firstElementChild.src = selectedObject.cacheTransImgOri;
	}
}
function BackgroundImageAction(e) {
	document.getElementById("BackgroundUploadImage").click();
}
function BackgroundImageUploadAction(e) {
	var file = this.files[0];
	if (!file.type || !file.type.match(/image.*/))
	{
		alert("This file is not supported!");
		return;
	}
	
	var fr = new FileReader;
	fr.onload = function() {
		RegisterAction("backgroundImage",holdercanvas,css(holdercanvas,"background-image"),'url("' + fr.result + '")');
		holdercanvas.style.backgroundImage = 'url("' + fr.result + '")';
	};
	
	fr.readAsDataURL(file);
}
function RemoveBackgroundImage(e) {
	RegisterAction("backgroundImage",holdercanvas,css(holdercanvas,'background-image'),"none");
	holdercanvas.style.backgroundImage = "none";
}
function flipShape(e) {selectedObject.rootContent.style.transform = e.target.checked ? "scaleX(-1)" : "";}

function getHourMin() {
	var timestamp = new Date();
	var h = timestamp.getHours();
	var m = timestamp.getMinutes();
	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;
	return (h + ":" + m);
}
function SaveDraftAction() {
	localStorage.productID = productID;
	localStorage.holderWidth = document.getElementById('widthCanvas').value;
	localStorage.holderHeight = document.getElementById('heightCanvas').value;
	localStorage.holderCssText = holdercanvas.style.cssText;
	localStorage.marginChecked = document.getElementById('addBorder').checked ? "1" : "0";
	localStorage.marginWidth = document.getElementById('borderWidth').value;
	localStorage.marginMargin = document.getElementById('borderMargin').value;
	localStorage.marginCssText = margincanvas.style.cssText;
	
	var i,list = document.getElementsByTagName('draw-object'), length = 0;
	for (i = 0;i < list.length;++i)
	{
		if (css(list[i],'display') == "none") continue;
		localStorage["obj" + length] = JSON.stringify(list[i].toObject());
		length = length + 1;
	}
	localStorage.objlength = length;
	
	if (!cacheSaved)
	{
		cacheSaveButton.classList.add("saved");
		cacheSaved = true;
	}
	cacheSaveButton.lastElementChild.textContent = "Saved " + getHourMin();
	setTimeout(SaveDraftAction, autoSaveInterval);
}
function LoadDraftAction() {
	document.getElementById('widthCanvas').value = localStorage.holderWidth;
	document.getElementById('heightCanvas').value = localStorage.holderHeight;
	changeSizeCustom();
	holdercanvas.style.cssText = localStorage.holderCssText;
	document.getElementById('addBorder').checked = (localStorage.marginChecked == "1") ? true : false;
	document.getElementById('borderWidth').value = localStorage.marginWidth;
	document.getElementById('borderMargin').value = localStorage.marginMargin;
	margincanvas.style.cssText = localStorage.marginCssText;
	
	var i,length = localStorage.objlength,obj;
	if (length != null) length = Number(length);
	for (i = 0;i < length;++i) holdercanvas.appendChild(new drawObject().fromObject(JSON.parse(localStorage["obj" + i])));
}
function createRAW() {
	var rawdata = {};
	rawdata.productID = productID;
	rawdata.holderWidth = document.getElementById('widthCanvas').value;
	rawdata.holderHeight = document.getElementById('heightCanvas').value;
	rawdata.holderCssText = holdercanvas.style.cssText;
	rawdata.marginChecked = document.getElementById('addBorder').checked ? "1" : "0";
	rawdata.marginWidth = document.getElementById('borderWidth').value;
	rawdata.marginMargin = document.getElementById('borderMargin').value;
	rawdata.marginCssText = margincanvas.style.cssText;
	
	var i,list = document.getElementsByTagName('draw-object'), length = 0;
	for (i = 0;i < list.length;++i)
	{
		if (css(list[i],'display') == "none") continue;
		rawdata["obj" + length] = list[i].toObject();
		length = length + 1;
	}
	rawdata.objlength = length;
	
	return rawdata;
}
function createSVG() {
	var svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null, "width", holdercanvas.style.width);
	svg.setAttributeNS(null, "height", holdercanvas.style.height);
	svg.setAttribute("version", "1.1");
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
	
	var svgholder = document.createElementNS(svgNS, "g");
	svg.appendChild(svgholder);
	
	//add background color rect
	var shape = document.createElementNS(svgNS, "rect");
	var bgColor = holdercanvas.style.backgroundColor;
	if ((bgColor == null) || (bgColor == "")) bgColor = "#FFFFFF";
	shape.setAttributeNS(null, "x", 0);
	shape.setAttributeNS(null, "y", 0);
	shape.setAttributeNS(null, "width", holdercanvas.style.width);
	shape.setAttributeNS(null, "height", holdercanvas.style.height);
	shape.setAttributeNS(null, "fill", bgColor);
	svgholder.appendChild(shape);
	
	//add background image
	var bgImage = holdercanvas.style.backgroundImage;
	if (bgImage != null)
	{
		bgImage = bgImage.slice(4,-1);
		shape = document.createElementNS(svgNS, "image");
		shape.setAttributeNS(null, "x", 0);
		shape.setAttributeNS(null, "y", 0);
		shape.setAttributeNS(null, "width", holdercanvas.style.width);
		shape.setAttributeNS(null, "height", holdercanvas.style.height);
		shape.setAttributeNS(null, "preserveAspectRatio", "none");
		shape.setAttributeNS(xlinkns, "href", bgImage);
		svgholder.appendChild(shape);
	}
	
	//add objects
	var i,list = [],rawlist = document.getElementsByTagName('draw-object');
	for (i = 0;i < rawlist.length;++i)
	{
		if (css(rawlist[i],'display') == "none") continue;
		list.push(rawlist[i]);
	}
	list.sort(function(a, b) {return(Number(a.style.zIndex) - Number(b.style.zIndex))});
	for (i = 0;i < list.length;++i) svgholder.appendChild(list[i].toSVGObject());
	
	//add margin
	var cssText = window.getComputedStyle(margincanvas, null);
	var top = parseFloat(cssText.top);
	var width = parseFloat(cssText.width);
	var left = (parseFloat(css(holdercanvas,'width')) - width) / 2;
	var height = parseFloat(cssText.height);
	var bwidth = parseFloat(cssText.borderWidth);
	var owidth = width + bwidth * 2;
	var oheight = height + bwidth * 2;
	var oleft = left - bwidth;
	if (margincanvas.style.visibility == "visible")
	{
		shape = document.createElementNS(svgNS, "path");
		bgColor = margincanvas.style.borderColor;
		if (bgColor == null) bgColor = "#000000";
		shape.setAttributeNS(null, "fill", bgColor);
		shape.setAttributeNS(null, "stroke", "none");
		shape.setAttributeNS(null, "d", "M " + oleft + " " + top + " h " + owidth + " v " + oheight + " h -" + owidth + " Z M " +
												left + " " + (top + bwidth) + " v " + height + " h " + width + " v -" + height + " Z");
		svgholder.appendChild(shape);
	}
	
	return svg;
}
function SVG2JPG(svg,callback) {
	var img = new Image();
	img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
	img.onload = function() {
		var myCanvas=document.createElement("canvas");
		var myCanvasContext=myCanvas.getContext("2d");
		myCanvas.width = img.naturalWidth;
		myCanvas.height = img.naturalHeight;
		myCanvasContext.drawImage(img,0,0);
		outputImageSrc = myCanvas.toDataURL('image/png');//myCanvas.toDataURL('image/jpeg',1.0);
		img.onload = null;
		callback();
	}
}
function submitDesign() {
	document.getElementById("covercontainer").style.display = "block";
	svgImageData = createSVG();
	SVG2JPG(svgImageData,previewLoaded);
}
function previewLoaded() {
	cachePreviewDesign.src = outputImageSrc;
	var w = cachePreviewDesign.offsetWidth;
	var fw = document.getElementById("coverholder").offsetWidth;
	cachePreviewDesign.style.marginLeft = (fw - w) / 2 + "px";
	var data = new FormData();
	data.append('design_id', designID);
	data.append('product_id', productID);
	data.append('svg', svgImageData.outerHTML);
	data.append('png', outputImageSrc.replace('data:image/jpeg;base64,',''));
	data.append('raw', JSON.stringify(createRAW()));
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'index.php?fc=module&module=designer&controller=design&submit_design=1', true);
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.addEventListener("load", finishedUpload, false);
	xhr.send(data);
}
function uploadProgress(e) {
	if (e.lengthComputable) {
		var percentComplete = e.loaded * 100 / e.total;
		cacheCoverProgressBar.value = percentComplete;
	}
}
function finishedUpload(e) {
	var result,text;
	try {
		result = JSON.parse(this.responseText);
		text = result.message;
		if (result.status == 0) designID = result.designID;
	}
	catch (e)
	{
		text = "Unexpected Error";
	}
	document.getElementById("coverLabel").textContent = text;
}
function closeSubmit() {
	document.getElementById("covercontainer").style.display = "none";
	document.getElementById("coverLabel").textContent = "Preview Your Submission";
	cacheCoverProgressBar.value = 0;
	cachePreviewDesign.src = "";
}
function loadSVGTemplate(svgdata) {
	svgdata = svgdata.firstElementChild;
	document.getElementById('widthCanvas').value = Math.round(pixel2mm(svgdata.width.baseVal.value) * 10) / 10;
	document.getElementById('heightCanvas').value = Math.round(pixel2mm(svgdata.height.baseVal.value) * 10) / 10;
	changeSizeCustom();

	var objholder;
	var i,length,obj;
	if (svgdata.firstElementChild.tagName.toUpperCase() == "DEFS")
	{
		obj = svgdata.firstElementChild.getElementsByTagName("font");
		for (i = obj.length - 1;i >= 0;--i) obj[i].parentNode.removeChild(obj[i]);
	}	
	for (i = 0;i < svgdata.childElementCount;++i)
	{
		if (svgdata.children[i].tagName.toUpperCase() == "G")
		{
			objholder = svgdata.children[i];
			length = objholder.childElementCount;
			break;
		}
	}
	if (length != null) length = Number(length);
	for (i = 0;i < length;++i)
	{
		if (objholder.children[i].tagName.toUpperCase() == "METADATA") continue;
		if (objholder.children[i].tagName.toUpperCase() == "G" && objholder.children[i].childElementCount == 0) continue;
		holdercanvas.appendChild(new drawObject().fromSVGObject(objholder.children[i],svgdata));
	}
}
function loadTXTTemplate(txtdata) {
	//if (txtdata.productID != productID) return;
	document.getElementById('widthCanvas').value = txtdata.holderWidth;
	document.getElementById('heightCanvas').value = txtdata.holderHeight;
	changeSizeCustom();
	holdercanvas.style.cssText = txtdata.holderCssText;
	document.getElementById('addBorder').checked = (txtdata.marginChecked == "1") ? true : false;
	document.getElementById('borderWidth').value = txtdata.marginWidth;
	document.getElementById('borderMargin').value = txtdata.marginMargin;
	margincanvas.style.cssText = txtdata.marginCssText;
	
	var i,length = txtdata.objlength,obj;
	if (length != null) length = Number(length);
	for (i = 0;i < length;++i) holdercanvas.appendChild(new drawObject().fromObject(txtdata["obj" + i]));
}
function loadTemplate() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', templateURL, true);
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4)
		{
			if (xhr.status == 200)
			{
				var header = xhr.responseText.substring(0,4);
				if ((header == "<?xm") || (header == "<svg"))
				{
					var iframe;
					iframe = document.createElement("iframe");
					iframe.style.visibility = "none";
					iframe.style.width = "0";
					iframe.style.height = "0";
					iframe.onload = function() {
						var element = document.createElement("object");
						element.type = "image/svg+xml";
						element.data = templateURL;
						element.onload = function() {
							loadSVGTemplate(element.contentDocument);
							element.parentNode.removeChild(element);
							iframe.parentNode.removeChild(iframe);
							element.onload = null;
							iframe.onload = null;
						}
						iframe.contentDocument.body.appendChild(element);
					}
					document.body.appendChild(iframe);
				}
				else if (header[0] == "{") {
					try {
						var txtdata = JSON.parse(xhr.responseText);
						loadTXTTemplate(txtdata);
					}
					catch (e) {}
				}
			}
			else loadTemplate();
		}
	}
	xhr.send();
}

function goBackToOrder() {
	if (typeof callbackURL != "undefined") window.location = callbackURL; else window.history.back();
}