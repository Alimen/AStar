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
	var imgTileBorder = new Image();

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
			drawload();
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
	var isDragingStart = false;
	var isDragingEnd = false;

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

		var x = Math.floor(mouseX/32)*2+1;
		if(x > boardWidth-2) {
			x = boardWidth-2;
		}
		var y = Math.floor(mouseY/32)*2+1;
		if(y > boardHeight-2) {
			y = boardHeight-2;
		}
		selector = y*boardWidth + x;
	}

	function eventMouseDown(e) {
		if(state != mainStates.game) {
			return;
		}

		if(selector == start) {
			board[start]  = 0;
			isDragingStart = true;
		} else if(selector == end) {
			board[end] = 0;
			isDragingEnd = true;
		}
	}

	function eventMouseUp(e) {
		if(state != mainStates.game) {
			return;
		}

		if(isDragingStart) {
			isDragingStart = false;
			start = selector;
			board[start] = 1;
		} else if(isDragingEnd) {
			isDragingEnd = false;
			end = selector;
			board[end] = 2;
		} else {
			changeWalls(selector);
		}
		AStar();
	}

///////////////////////////////////////////////////////////////////////////////
//
// Initialization & loader functions
//
///////////////////////////////////////////////////////////////////////////////

	// Pre-loader counters
	var itemsToLoad = 2;
	var loadCount = 0;

	function init() {
		// Setup image loader events
		imgTiles.src = "image/Tiles.png";
		imgTiles.onload = eventItemLoaded;
		imgTileBorder.src = "image/TileBorder.png";
		imgTileBorder.onload = eventItemLoaded;

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
	var boardWidth = screenWidth / 32 * 2 + 1;
	var boardHeight = screenHeight / 32 * 2 + 1; 
	var board = new Array(boardWidth * boardHeight);
	var selector = 0;

	function reset() {
		board = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
				  1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
				  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1,
				  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		AStar();

		state = mainStates.game;
	}

	function drawBoard() {
		// Draw floors
		var i, j, curTile;
		for(i = 1; i < boardHeight; i += 2) {
			for(j = 1; j < boardWidth; j += 2) {
				curTile = boardWidth * i + j;
				backContext.drawImage(imgTiles, board[curTile]*32, 0, 32, 32, (j-1)/2*32, (i-1)/2*32, 32, 32);
			}
		}

		// Draw walls
		for(i = 0; i < boardHeight; i++) {
			for(j = 0; j < boardWidth; j++) {
				curTile = boardWidth * i + j;
				if(board[curTile] == 1) {
					if(i%2==0 && j%2==0) {
						backContext.drawImage(imgTileBorder, 0, 0, 4, 4, j/2*32-2, i/2*32-2, 4, 4);
					} else if(i%2 == 0) {
						backContext.drawImage(imgTileBorder, 0, 0, 28, 4, (j-1)/2*32+2, i/2*32-2, 28, 4);
					} else if(j%2 == 0) {
						backContext.drawImage(imgTileBorder, 0, 0, 4, 28, j/2*32-2, (i-1)/2*32+2, 4, 28);
					}
				}
			}
		}

		// Draw selector
		var x, y;
		if(!isDragingStart && !isDragingEnd) {
			x = ((selector%boardWidth)-1)/2;
			y = (Math.floor(selector/boardWidth)-1)/2;
			backContext.drawImage(imgTiles, 128, 0, 32, 32, x*32, y*32, 32, 32);
		} else {
			if(isDragingStart) {
				backContext.drawImage(imgTiles, 32, 0, 32, 32, mouseX-16, mouseY-16, 32, 32);
			}
			if(isDragingEnd) {
				backContext.drawImage(imgTiles, 64, 0, 32, 32, mouseX-16, mouseY-16, 32, 32);
			}
		}

		// Flip
		context.drawImage(backCanvas, 0, 0);
	}

	function changeWalls(target) {
		// Caclulate current wall coding
		var curWall = 0;
		if(board[target-1] != 0) {
			curWall += 1;
		}
		if(board[target-boardWidth] != 0) {
			curWall += 2;
		}
		if(board[target+1] != 0) {
			curWall += 4;
		}
		if(board[target+boardWidth] != 0) {
			curWall += 8;
		}
		
		// Keep edges of the board
		curWall = (curWall+1)%16;
		if(target%boardWidth == 1) {
			curWall = curWall | 1;
		}
		if(Math.floor(target/boardWidth) == 1) {
			curWall = curWall | 2;
		}
		if(target%boardWidth == boardWidth-2) {
			curWall = curWall | 4;
		}
		if(Math.floor(target/boardWidth) == boardHeight-2) {
			curWall = curWall | 8;
		}

		// Set new walls
		var n;
		n = target - 1;
		if(curWall & 1) {
			board[n] = 1;
		} else {
			board[n] = 0;
		}
		n = target - boardWidth;
		if(curWall & 2) {
			board[n] = 1;
		} else {
			board[n] = 0;
		}
		n = target + 1;
		if(curWall & 4) {
			board[n] = 1;
		} else {
			board[n] = 0;
		}
		n = target + boardWidth;
		if(curWall & 8) {
			board[n] = 1;
		} else {
			board[n] = 0;
		}

		// Set new pillars
		board[target-boardWidth-1] = checkPillars(target-boardWidth-1)? 1: 0;
		board[target-boardWidth+1] = checkPillars(target-boardWidth+1)? 1: 0;
		board[target+boardWidth-1] = checkPillars(target+boardWidth-1)? 1: 0;
		board[target+boardWidth+1] = checkPillars(target+boardWidth+1)? 1: 0;
	}

	function checkPillars(target) {
		if(target < boardWidth || target > (boardHeight-1)*boardWidth-1 || target%boardWidth == 0 || target%boardWidth == boardWidth-1) {
			return true;
		}

		if(board[target-1] != 0 || board[target+1] != 0 || board[target-boardWidth] != 0 || board[target+boardWidth] != 0) { 
			return true;
		} else {
			return false;
		}
	}

///////////////////////////////////////////////////////////////////////////////
//
// A* algorithm
//
///////////////////////////////////////////////////////////////////////////////

	// Start/End positions
	var start = boardWidth + 1;
	var end = (boardHeight-1)*boardWidth - 2;

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
				tentative_g_score = g_score[curNode]+2;

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

		clearResultPath();
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

		if(board[target-1] != 1) {
			output.push(target-2);
		}
		if(board[target-boardWidth] != 1) {
			output.push(target-boardWidth*2);
		}
		if(board[target+1] != 1) {
			output.push(target+2);
		}
		if(board[target+boardWidth] != 1) {
			output.push(target+boardWidth*2);
		}

		return output;
	}

	function clearResultPath() {
		for(var i = 0; i < boardHeight*boardWidth; i++) {
			if(board[i] == 3) {
				board[i] = 0;
			}
		}
	}

	function setResultPath() {
		var curNode = came_from[end];
		while(curNode != start) {
			board[curNode] = 3;
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

