window.addEventListener('load',main,false);

function main() {
	var i,tmp = document.getElementsByClassName("textCover select");
	for (i = 0;i < tmp.length; ++i) tmp[i].addEventListener("click",selectedDesign);
	//$(".textCover.select").click(selectedDesign);
}
function selectedDesign(e) {
	var selector = e.target;
	while (!selector.classList.contains("designPart")) selector = selector.parentNode;
	selectedDesignNo = selector.getAttribute("designID");
	
	var i,tmp = document.getElementsByClassName("designPart selected");
	for (i = tmp.length - 1;i >= 0;--i) {
		tmp[i].classList.remove("selected");
	}
	selector.classList.add("selected");
}
