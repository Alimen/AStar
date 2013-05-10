var astar = (function() {
	if(!canvasSupport) {
		return;
	}
	
///////////////////////////////////////////////////////////////////////////////
//
// Variable declearations
//
///////////////////////////////////////////////////////////////////////////////

	// Canvas
	var theCanvas;
	var context;
	var backCanvas;
	var backContext;

	// Environmental constants
	const screenWidth = 320;
	const screenHeight = 320;

	// Image resources
	var imgTiles = new Image();

///////////////////////////////////////////////////////////////////////////////
//
// Main state machine
//
///////////////////////////////////////////////////////////////////////////////

	// State enumeration
	const mainStates = {
		unknown		: -1,
		initial		: 0, 
		loading		: 1,
		reset		: 2,
		game		: 3
	};
	var state = mainStates.initial;

	function timerTick() {
		switch(state) {
		case mainStates.initial:
			init();
			break;
		case mainStates.loading:
			drawLoad();
			break;
		case mainStates.reset:
			reset();
			break;
		case mainStates.game:
			drawBoard();
			break;
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// Mouse events
//
///////////////////////////////////////////////////////////////////////////////

	// Mouse position variables
	var mouseX, mouseY;

	function eventMouseMove(e) {
		if(state != mainStates.game) {
			return;
		}
			
		if(e.offsetX || e.offsetX == 0) {
			mouseX = e.offsetX;
			mouseY = e.offsetY;
		} else if(e.layerX || e.layerX == 0) {
			mouseX = e.layerX - theCanvas.offsetLeft;
			mouseY = e.layerY - theCanvas.offsetTop;
		}

		var x = Math.floor(mouseX/32);
		var y = Math.floor(mouseY/32);
		selector = y*boardWidth + x;
	}

	function eventMouseDown(e) {
		if(state != mainStates.game) {
			return;
		}
	}

	function eventMouseUp(e) {
		if(state != mainStates.game) {
			return;
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// Initialization & loader functions
//
///////////////////////////////////////////////////////////////////////////////

	// Pre-loader counters
	var itemsToLoad = 1;
	var loadCount = 0;

	function init() {
		// Setup image loader events
		imgTiles.src = "image/Tiles.png";
		imgTiles.onload = eventItemLoaded;

		// Setup canvas
		theCanvas = document.getElementById("canvas");
		context = theCanvas.getContext("2d");
		backCanvas  = document.createElement("canvas");
		backCanvas.width = theCanvas.width;
		backCanvas.height = theCanvas.height;
		backContext = backCanvas.getContext("2d");

		// Setup mouse events
		theCanvas.addEventListener("mousemove", eventMouseMove, true);
		theCanvas.addEventListener("mousedown", eventMouseDown, true);	
		theCanvas.addEventListener("mouseup", eventMouseUp, true);	

		// Switch to next state
		state = mainStates.loading;
	}

	function drawload() {
		// Caculate loader
		var percentage = Math.round(loadCount / itemsToLoad * 100);

		// Clear Background
		context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, screenWidth, screenHeight);

		// Print percentage
		context.textBaseline = "bottom";	
		context.fillStyle = "#000000";
		context.font = "14px monospace";
		context.textAlign = "center";
		context.fillText(percentage + "%", screenWidth / 2, screenHeight / 2);
	}

	function eventItemLoaded(e) {
		loadCount++;
		if(loadCount == itemsToLoad) {
			state = mainStates.reset;
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// Game
//
///////////////////////////////////////////////////////////////////////////////

	// Board
	var boardWidth = screenWidth / 32;
	var boardHeight = screenHeight / 32;
	var board = new Array(boardWidth * boardHeight);
	var selector = 0;

	function reset() {
		board = [16,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  4,  1,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  8,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0, 32];

		state = mainStates.game;
	}

	function drawBoard() {
		var i, j, curTile;
		for(i = 0; i < boardHeight; i++) {
			for(j = 0; j < boardWidth; j++) {
				curTile = boardWidth * i + j;
				drawTile(j*32, i*32, board[curTile], ((selector == curTile)? true: false));
			}
		}

		context.drawImage(backCanvas, 0, 0);
	}

	function drawTile(x, y, type, selected) {
		// Draw tile background
		if(type > 63) {
			backContext.drawImage(imgTiles, 96, 0, 32, 32, x, y, 32, 32);
		} else if(type > 31) {
			backContext.drawImage(imgTiles, 64, 0, 32, 32, x, y, 32, 32);
		} else if(type > 15) {
			backContext.drawImage(imgTiles, 32, 0, 32, 32, x, y, 32, 32);
		} else {
			backContext.drawImage(imgTiles, 0, 0, 32, 32, x, y, 32, 32);
		}

		// Draw walls
		if((type & 1) != 0) {
			backContext.drawImage(imgTiles, 160, 0, 32, 32, x, y, 32, 32);
		}
		if((type & 2) != 0) {
			backContext.drawImage(imgTiles, 192, 0, 32, 32, x, y, 32, 32);
		}
		if((type & 4) != 0) {
			backContext.drawImage(imgTiles, 224, 0, 32, 32, x, y, 32, 32);
		}
		if((type & 8) != 0) {
			backContext.drawImage(imgTiles, 256, 0, 32, 32, x, y, 32, 32);
		}

		// Draw selector
		if(selected) {
			backContext.drawImage(imgTiles, 128, 0, 32, 32, x, y, 32, 32);
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// Public Access
//
///////////////////////////////////////////////////////////////////////////////

	function startMessageLoop() {
		const FPS = 30;
		var intervalTime = 1000 / FPS;
		setInterval(timerTick, intervalTime);
	}

	return {
		startMessageLoop : startMessageLoop
	};
})();

function canvasSupport() {
	return !!document.createElement('testcanvas').getContext;
}

function eventWindowLoaded() {
	astar.startMessageLoop();
}
window.addEventListener('load', eventWindowLoaded, false);

