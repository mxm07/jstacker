var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var levels = [];
var positions = [];
var scroll = 0;
var gameOverScreen = false;
var defaultSize = 750;
var scale = 1;
var bounds = defaultSize * 1.5;
var score = -1;
var xoffset = 0;
var perfCounter = 0;
var restartButton;
var partTimeout;
var particles = [];
var breaks = [];

//colors
var colorSat;
var colorBar;
var colorBG1;
var colorBG2;





function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}



/*-----------------------*\
|		ANIMATIONS		  |
\*-----------------------*/

var zoomValues;
var perfectValues;
var growValues;

var scrollVal = 0;
var scrollDamp = 0;
var scrollMax;

var doParticleAnim = true;
var doBarAnim = true;
var doScrollAnim = false;

var animFrame;

function doAnim() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	draw();

	scrollAnim();
	if( doBarAnim ) barAnim();
	breakAnim();
	if( particles.length > 0 ) particleAnim();
	if( zoomValues != null ) zoomAnim();
	if( perfectValues != null ) perfectAnim();
	if( growValues != null ) growAnim();

	animFrame = window.requestAnimationFrame( doAnim );
}


function scrollAnim() {	
	if( scrollMax <= 0 || gameOverScreen ) return;

	if( scrollVal >= scrollMax ) {
		scrollVal = 0;
		scrollDamp = 0;
		scrollMax = 0;
		return;
	} else if( scrollMax - scrollVal < 25 ) {
		scrollDamp += 0.02;
		scrollDamp = Math.min( scrollDamp, 0.75 );
		scrollVal += 1 - scrollDamp;
		scroll += 1 - scrollDamp;
	} else {
		var scrollFactor = Math.max( 1, (scrollMax - scrollVal)/100 );
		scrollVal += scrollFactor;
		scroll += scrollFactor;
		scrollDamp = 0;
	}
}


//Back-and-forth animation of the current piece
var inc = 0;
var dir = true;
function barAnim() {
	var speed = 0.5;
	var w = levels[ levels.length - 1 ];

	if( dir ) { inc += speed / Math.sqrt(w); if( inc >= 1 ) dir = false; } else { inc -= speed / Math.sqrt(w); if( inc <= -1 ) dir = true; }
	if( levels.length % 2 == 0 ) ctx.fillStyle = "#eeeeee";
	else ctx.fillStyle = colorBar;

	ctx.fillRect( xoffset + (canvas.width/2) + (bounds * inc - w/2 + positions[ positions.length - 1 ]) * scale, canvas.height - (50 * scale * (levels.length+1)) + scroll, w * scale, 50 * scale );
}

//Animation of part of each piece "breaking" off when not perfectly placed
function breakAnim() {
	if( breaks.length > 0 ) {
		for( j = 0; j < breaks.length; j++ ) {
			var b = breaks[j];
			var dur = ((new Date()).getTime() - b[3]) / 500;
			var alpha = 1;
			var offset = [];
			var angle = 0;

			if( dur > 1 ) {
				breaks.splice( j, 1 );
				continue;
			} else {
				alpha = 1 - dur;
				offset = [ 50 * b[5][0] * dur, 100 * b[5][1] * dur ];
				angle = b[6] * dur;
			}

			ctx.save();
			var col = hex2rgb( b[2] );
			var x = xoffset + canvas.width / 2 + b[0] * scale + offset[0];
			var y = scroll + canvas.height - (50 * scale * b[4]) - offset[1];

			ctx.fillStyle = "rgba(" + col[0] + ", " + col[1] + ", " + col[2] + ", " + alpha + ")";
			ctx.translate( x + b[1] * scale / 2, y );
			ctx.rotate( angle * Math.PI / 180 );
			ctx.translate( -x - b[1] * scale / 2, -y );
			ctx.fillRect( x, y, b[1] * scale, 50 * scale );
			ctx.restore();
		}
	}
}

//Animating the floating white particles
function particleAnim() {
	for( i = 0; i < particles.length; i++ ) {
		var p = particles[i];
		var passed = (new Date()).getTime() - p[3];
		var dur = p[4];
		var a = 1;

		if( dur - passed < 0 ) {
			particles.splice( i, 1 );
			continue;
		} else if( passed < 1000 ) {
			a = passed / 1000;
		} else if( dur - passed < 1000 ) {
			a = (dur - passed) / 1000;
		}

		var vel = p[5];
		var speed = p[6];
		var velOffset = [ ( passed / dur ) * speed * vel[0], ( passed / dur ) * speed * vel[1] ];

		ctx.fillStyle = "rgba( 255, 255, 255, " + a + ")";
		ctx.beginPath();
		ctx.arc( p[0] + velOffset[0], p[1] + velOffset[1] + (scroll - p[7]), p[2], 0, Math.PI*2);
		ctx.fill();
	}
	if( gameOverScreen ) { particles = []; }
}
function doParticles() {
	particles.push( [ getRandom( 0, canvas.width ), getRandom( 0, canvas.height ), getRandom( 1, 5 ) * scale, (new Date()).getTime(), getRandom( 4000, 10000 ), [ getRandom( -1, 1 ), getRandom( -1, 1 ) ], getRandom( 50, 100 ), scroll ] );
	partTimeout = setTimeout( function() { doParticles(); }, getRandom( 200, 1500 ) );
}


//Zoom out and translate the stack animation that plays at the end of the game
function zoomAnim() {
	var startScale = zoomValues[0], endScale = zoomValues[1], startTime = zoomValues[2], duration = zoomValues[3], startScroll = zoomValues[4], endMove = zoomValues[5];

	var timeFrac = ((new Date()).getTime() - startTime) / duration;
	if( startScale != endScale ) scale = startScale + (endScale - startScale) * timeFrac;
	if( startScroll != 0 ) scroll = startScroll - startScroll*timeFrac;
	if( endMove != 0 ) xoffset = endMove * timeFrac;


	if( timeFrac > 1 ) { 
		scale = endScale;
		scroll = 0;

		zoomValues = null;
	}

	draw();
}

//Little white box animation that plays when a piece is placed perfectly
function perfectAnim() {
	var startTime = perfectValues[0], duration = perfectValues[1];

	var timeFrac = ((new Date()).getTime() - startTime) / duration;
	var w = levels[ levels.length - 1];
	var p = positions[ positions.length - 1];
	var scaleVal = 1 + 0.3 * timeFrac;


	ctx.fillStyle = "rgba(255,255,255," + Math.max( 0, 0.5 - (timeFrac*0.75) ) + ")";
	ctx.fillRect( xoffset + (canvas.width / 2) - ((w * scaleVal / 2) - p) * scale, scroll + canvas.height - ( 50 * scale * levels.length ) - 0.6 * 50 * scale * timeFrac, w * scale * scaleVal, 50 * scale * (scaleVal * 1.5));

	if( timeFrac > 1 ) { perfectValues = null; }
}

function growAnim() {
	var startTime = growValues[0], startWidth = growValues[1], endWidth = growValues[2];

	var timeFrac = ((new Date()).getTime() - startTime ) / 250;
	levels[ levels.length - 1 ] = startWidth + ( endWidth - startWidth ) * timeFrac;

	if( timeFrac > 1 ) { 
		levels[ levels.length - 1 ] = endWidth;
		growValues = null;
	}
}
















//Drawing everthing static to the canvas (the rest of the stack, the score)
function draw() {
	var grad = ctx.createRadialGradient( canvas.width / 2, canvas.height / 2, Math.max( canvas.width, canvas.height ) * 0.75, canvas.width/2, canvas.height/2, Math.max( canvas.width, canvas.height ) * 1.5 );
	grad.addColorStop( 0, colorBG1 );
	grad.addColorStop( 1, colorBG2 );
	ctx.fillStyle = grad;
	ctx.fillRect( 0, 0, canvas.width, canvas.height );

	for( i = Math.floor( scroll / (50 * scale) ); i < levels.length; i++ ) {
		if( i % 2 == 0 ) ctx.fillStyle = "#eeeeee";
		else ctx.fillStyle = colorBar;
		var w = levels[i];
		var p = positions[i];

		ctx.fillRect( xoffset + (canvas.width / 2) - ((w / 2) - p) * scale, scroll + canvas.height - (50 * scale * (i+1)), w * scale, 50 * scale );
	}
	ctx.font = "30px Comforta";
	ctx.fillStyle = colorBar;
	ctx.fillText( "jstacker", 10, 35 );
	ctx.font = "25px Comforta";
	ctx.fillText( "Score: " + score, 10, 75 );

	
	ctx.textAlign = "right";
	ctx.font = "20px Comforta";	
	ctx.fillText( "press space to place a block", canvas.width - 10, 25 );
	ctx.textAlign = "left";
	
	if( gameOverScreen ) {
		ctx.save();
		ctx.font = "40px Comforta";
		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = "#ffffff";
		ctx.shadowOffsetY = 2;
		ctx.shadowBlur = 50;
		ctx.textAlign="center";
		ctx.fillText( "game over", canvas.width * 0.65, canvas.height / 2 - 24 );
		ctx.restore();
	}
}


//Reset the game and all values
function restartGame() {
	score = -1;
	levels = [];
	positions = [];
	gameOverScreen = false;
	bounds = defaultSize * 1.75;
	scroll = 0;
	scale = 0.5;
	xoffset = 0;

	colorSat = Math.random();
	colorBar = rgb_to_hex( hsl_to_rgb( colorSat, 0.25, 0.6 ) );
	colorBG1 = rgb_to_hex( hsl_to_rgb( colorSat, 0.25, 0.8 ) );
	colorBG2 = rgb_to_hex( hsl_to_rgb( colorSat, 0.75, 0.9 ) );

	inc = 0;
	dir = true;

	scrollVal = 0;
	scrollDamp = 0;
	scrollMax = 0;

	if( restartButton != null ) {
		restartButton.parentNode.removeChild( restartButton );
		restartButton = null;
	}

	doBarAnim = true;
	if( animFrame != null ) window.cancelAnimationFrame( animFrame );
	newLevel();

	animFrame = window.requestAnimationFrame( doAnim );
	resizeCanvas();
}
function newLevel() {
	if( levels.length == 0 ) {
		levels.push( defaultSize );
		positions.push( 0 );
	} else {
		var offset = inc * bounds;
		var lastWidth = levels[ levels.length - 1 ];
		var lastPos = positions[ positions.length - 1 ];
		var newWidth = lastWidth - Math.abs( offset );
		var newPos = ( lastPos + (lastPos + offset) ) / 2;

		if( newWidth < 0 ) {
			doBarAnim = false;
			doScrollAnim = false;

			zoomValues = [ scale, scroll == 0 ? scale : (canvas.height / levels.length) / 50 * 0.90, (new Date()).getTime(), 1000, scroll, -canvas.width / 4 ];

			setTimeout( function() { 
				gameOverScreen = true; 

				restartButton = document.createElement("BUTTON");
				restartButton.innerHTML = "restart";
				restartButton.style.position = 'absolute';
				restartButton.style.top = "52%";
				restartButton.style.left = "calc(65% - 65px)";
				document.body.appendChild( restartButton );
				restartButton.addEventListener( "click", function() {
					restartGame();
				}, false );

				draw();
			}, 
			1000 );
			
			return;
		} else if( Math.abs( newWidth - lastWidth ) < 10 ) {
			newWidth = lastWidth;
			newPos = lastPos;
		} else {
			perfCounter = 0;
			breaks.push( [ 
				( inc*bounds > 0 ? newPos + newWidth/2 : newPos - newWidth/2 - Math.abs( inc*bounds ) ), 
				Math.abs( inc * bounds ), 
				levels.length % 2 == 0 ? "#eeeeee" : colorBar, 
				(new Date()).getTime(), 
				levels.length + 1, 
				[ inc*bounds > 0 ? getRandom( 0, 1 ) : getRandom( -1, 0 ), getRandom( -1, -0.5 ) ], 
				getRandom( 50, 150 ) * (inc*bounds > 0 ? 1 : -1)
			] );
		}


		levels.push( newWidth );
		positions.push( newPos );

		if( Math.abs( newWidth - lastWidth ) < 10 ) {
			perfCounter++;
			perfectValues = [ new Date().getTime(), 500 ];

			if( perfCounter > 2 ) { growValues = [ new Date().getTime(), levels[ levels.length - 1 ], levels[ levels.length - 1 ] * 1.1 + ( 0.05 * perfCounter * perfCounter ) ]; }
		}
		bounds = newWidth * 1.5;
	}
	score++;
}





//Resize canvas every time the window is resized
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	draw();

	if( gameOverScreen ) {
		scale = scroll == 0 ? scale : (canvas.height / levels.length) / 50 * 0.90;
	}
}
window.addEventListener('resize', resizeCanvas, false);

document.addEventListener( "keypress", function( e ) {
	if( gameOverScreen || zoomValues != null ) return;
	if( e.keyCode == 32 ) {
		newLevel();
		if( levels.length * 50 * scale > canvas.height / 2 ) {
			if( zoomValues == null ) {
				scrollMax = 50 * scale;
				doScrollAnim = true;
			} else {
				scrollMax += 50 * scale;
			}
		}
	}
}, false);

doParticles();
restartGame();
