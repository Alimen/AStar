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
	var isDraging = false;

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

		if(isDraging) {
		} else {
			var x = Math.floor(mouseX/32);
			var y = Math.floor(mouseY/32);
			selector = y*boardWidth + x;
		}
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
		board = [16,  0,  4,  1,  0,  0,  0,  0,  0,  0,
				  0,  0,  4,  1,  0,  0,  0,  0,  0,  0,
				  0,  0,  4,  1,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  8,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
				  0,  0,  0,  0,  0,  0,  0,  0,  0, 32];
		AStar();

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
		if(type & 1) {
			backContext.drawImage(imgTiles, 160, 0, 32, 32, x, y, 32, 32);
		}
		if(type & 2) {
			backContext.drawImage(imgTiles, 192, 0, 32, 32, x, y, 32, 32);
		}
		if(type & 4) {
			backContext.drawImage(imgTiles, 224, 0, 32, 32, x, y, 32, 32);
		}
		if(type & 8) {
			backContext.drawImage(imgTiles, 256, 0, 32, 32, x, y, 32, 32);
		}

		// Draw selector
		if(selected) {
			backContext.drawImage(imgTiles, 128, 0, 32, 32, x, y, 32, 32);
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// A* algorithm
//
///////////////////////////////////////////////////////////////////////////////

	// Start/End positions
	var start = 0;
	var end = boardHeight*boardWidth - 1;

	// Stacks
	var closedset = new Array();
	var openset = new Array();

	// Scoring
	var g_score = new Array(boardHeight*boardWidth);
	var h_score = new Array(boardHeight*boardWidth);
	var f_score = new Array(boardHeight*boardWidth);

	// Results
	var came_from = new Array(boardHeight*boardWidth);

	function AStar() {
		// 1. Clear arrays
		clearResultPath();
		closedset.length = 0;
		openset.length = 0;
		var i;
		for(i = 0; i < boardHeight*boardWidth; i++) {
			g_score[i] = 0;
			h_score[i] = 0;
			f_score[i] = 0;
			came_from[i] = -1;
		}

		// 2. Initialize calculation
		openset.push(start);
		g_score[start] = 0;
		h_score[start] = estimate(start, end);
		f_score[start] = h_score[start];

		// 3. Iterations
		var curNode;
		var neighbors;
		var tentative_g_score;
		var tentative_is_better;
		while(openset.length > 0) {
			curNode = findMinimalScore();
			openset.splice(openset.indexOf(curNode), 1);
			closedset.push(curNode);
			if(curNode == end) {
				setResultPath();
				return;
			}

			neighbors = findNeighbor(curNode);
			for(i = 0; i < neighbors.length; i++) {
				if(closedset.indexOf(neighbors[i]) >= 0) {
					continue;
				}
				tentative_g_score = g_score[curNode]+1;

				if(openset.indexOf(neighbors[i]) < 0) {
					openset.push(neighbors[i]);
					tentative_is_better = true;
				} else if(tentative_g_score < g_score[neighbors[i]]) {
					tentative_is_better = true;
				} else {
					tentative_is_better = false;
				}

				if(tentative_is_better == true) {
					came_from[neighbors[i]] = curNode;
					g_score[neighbors[i]] = tentative_g_score;
					h_score[neighbors[i]] = estimate(neighbors[i], end);
					f_score[neighbors[i]] = g_score[neighbors[i]] + h_score[neighbors[i]];
				}
			}
		}

		return;
	}

	function estimate(start, end) {
		var startX, startY, endX, endY;
		startX = start%boardWidth;
		startY = Math.floor(start/boardWidth);
		endX = end%boardWidth;
		endY = Math.floor(end/boardWidth);

		return (Math.abs(endX-startX) + Math.abs(endY-startY));
	}

	function findMinimalScore() {
		var i, min = 0;
		for(i = 0; i < openset.length; i++) {
			if(g_score[openset[i]] < g_score[openset[min]]) {
				min = i;
			}
		}

		return openset[min];
	}

	function findNeighbor(target) {
		var output = new Array();

		if((target%boardWidth > 0) && !(board[target] & 1)) {
			output.push(target-1);
		}
		if((target >= boardWidth) && !(board[target] & 2)) {
			output.push(target - boardWidth);
		}
		if((target%boardWidth < boardWidth-1) && !(board[target] & 4)) {
			output.push(target+1);
		}
		if((target < boardWidth*(boardHeight-1)) && !(board[target] & 8)) {
			output.push(target + boardWidth);
		}

		return output;
	}

	function clearResultPath() {
		for(var i = 0; i < boardHeight*boardWidth; i++) {
			if(board[i] > 63) {
				board[i] -= 64;
			}
		}
	}

	function setResultPath() {
		var curNode = came_from[end];
		while(curNode != start) {
			board[curNode] += 64;
			curNode = came_from[curNode];
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

