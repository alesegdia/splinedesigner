

var canvas = null;
var ctx = null;
var pointAdd = false;
var points = [];
var mousePos;
var spline = null;
var numPieces = 10;
var currentTool = 'adder';
var selectedKnot = -1;
var grabRadio = 30;
var grabSize = 4;
var selectedSpline = SPL_BSpline;

var update = function() {

	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,canvas.width, canvas.height);
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#FFFFFF";
	if( points.length > 0 )
	{
		ctx.beginPath();
		ctx.moveTo( points[0].x, points[0].y );
		for( var i = 0; i < points.length; i++ )
		{
			//ctx.arc(points[i].x, points[i].y, grabRadio, 0, 2 * Math.PI, false);
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
	}
	for( var i = 0; i < points.length; i++ )
	{
		ctx.beginPath();
		ctx.arc(points[i].x, points[i].y, grabSize, 0, 2 * Math.PI, false);
		if( i == selectedKnot ) {
			ctx.fillStyle = '#FF0000';
		}
		else
		{
			ctx.fillStyle = '#00FF00';
		}
		ctx.fill();
		//ctx.fillRect(points[i].x,points[i].y,4,4);
	}
	if( spline != null )
	{
		ctx.strokeStyle = "#FF0000";
		ctx.beginPath();
		//ctx.moveTo( spline[0].x, spline[0].y );
		for( i = 0; i < spline.length; i++ )
		{
			ctx.lineTo( spline[i].x, spline[i].y );
		}
		ctx.stroke();
		ctx.fillStyle = "#00FF00";
		for( var i = 0; i < spline.length; i++ )
		{
			ctx.fillRect(spline[i].x,spline[i].y,3,3);
		}
	}
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

function saveSplineToFile()
{
	if( spline != null ) {
		var content = JSON.stringify(spline);
		download( "mySpline.txt", content );
	}
}

function selectSpline( spltype )
{
	if( spltype == "bspline" ) selectedSpline = SPL_BSpline;
	if( spltype == "catmull" ) selectedSpline = SPL_Catmull;
	if( spltype == "catmulltau" ) selectedSpline = SPL_Catmull2;
	doSpline();
}

var getMousePos = function (canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	var ret;
	ret = {
		x: evt.clientX - rect.left -2,
		y: evt.clientY - rect.top - 2
	};
	if( selectedKnot != -1 )
	{
		points[selectedKnot].x = ret.x;
		points[selectedKnot].y = ret.y;
		doSpline();
	}
	return ret;
}

function distanceTo(a,b)
{
	var f1, f2;
	f1 = a.x-b.x;
	f2 = a.y-b.y;
	return Math.sqrt(f1*f1+f2*f2);
}

function doSpline()
{
	//spline = SPL_Catmull( points );
	spline = selectedSpline( points );
}

var grabstate = "orphan";

function init(){
	setTau(1);
	var i, sel;
	sel = false;
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");
	canvas.addEventListener('mousemove', function(e){
		mousePos = getMousePos( canvas, e );
	});
	setInterval(update, 50);
	canvas.addEventListener('click', function() {
		if( currentTool == 'adder' )
		{
			console.log("addpoint");
			points.push( { x: mousePos.x, y: mousePos.y } );
			doSpline();
		}
		else if( currentTool == 'grabber')
		{
			if( grabstate == "orphan" )
			{
				sel = false;
				for( i=0; i<points.length; i++ )
				{
					if( distanceTo( points[i], mousePos ) <= grabRadio )
					{
						sel = true;
						break;
					}
				}
				if( sel ) {
					console.log("YAY!");
					selectedKnot = i;
					grabstate = "carry"
				}
				else
				{
					grabstate = "orphan";
				}
				if( selectedKnot != -1 ) grabstate = "carry";
			}
			else
			{
				grabstate = "orphan";
				selectedKnot = -1;
			}
		}
	}, false);
};
window.addEventListener( 'load', init, false );

function removeSelectedKnot()
{
	if( selectedKnot != -1 )
	{
		points.splice(selectedKnot, 1);
		doSpline();
		selectedKnot = -1;
	}
}

function SPL_BSpline( controlpoints )
{
	var i, ret,px,py,t,ax,ay,bx,by,cx,cy,dx,dy;
	ret = [];
	for( i = 0; i < controlpoints.length-3; i = i+1 )
	{
		ax = (-controlpoints[i].x + 3*controlpoints[i+1].x - 3*controlpoints[i+2].x + controlpoints[i+3].x) / 6;
		ay = (-controlpoints[i].y + 3*controlpoints[i+1].y - 3*controlpoints[i+2].y + controlpoints[i+3].y) / 6;
		bx = (controlpoints[i].x - 2*controlpoints[i+1].x + controlpoints[i+2].x) / 2;
		by = (controlpoints[i].y - 2*controlpoints[i+1].y + controlpoints[i+2].y) / 2;
		cx = (-controlpoints[i].x + controlpoints[i+2].x) / 2;
		cy = (-controlpoints[i].y + controlpoints[i+2].y) / 2;
		dx = (controlpoints[i].x + 4*controlpoints[i+1].x + controlpoints[i+2].x) / 6;
		dy = (controlpoints[i].y + 4*controlpoints[i+1].y + controlpoints[i+2].y) / 6;
		for (t = 0; t < 1; t += 0.1) {
			px = ax*Math.pow(t, 3) + bx*Math.pow(t, 2) + cx*t + dx;
			py = ay*Math.pow(t, 3) + by*Math.pow(t, 2) + cy*t + dy;
			ret.push( {x: px, y: py} );
		}
	}

    return ret;
}

function SPL_Catmull( controlpoints )
{
	var ret, i, t, ax, ay, bx, by, cx, cy, dx, dy, px, py;
	ret = [];
	for( i = 1; i < controlpoints.length - 2; i++ )
	{
		var c = controlpoints;
		ax =   - c[i-1].x + 3 * c[i].x - 3 * c[i+1].x + c[i+2].x;
		ay =   - c[i-1].y + 3 * c[i].y - 3 * c[i+1].y + c[i+2].y;
		bx = 2 * c[i-1].x - 5 * c[i].x + 4 * c[i+1].x - c[i+2].x;
		by = 2 * c[i-1].y - 5 * c[i].y + 4 * c[i+1].y - c[i+2].y;
		cx =   - c[i-1].x                  + c[i+1].x;
		cy =   - c[i-1].y                  + c[i+1].y;
		dx = 			    2 * c[i].x;
		dy = 			    2 * c[i].y;
		for( t = 0; t < 1; t += 0.1 )
		{
			px = ax*Math.pow(t, 3) + bx*Math.pow(t, 2) + cx*t + dx;
			py = ay*Math.pow(t, 3) + by*Math.pow(t, 2) + cy*t + dy;
			ret.push( {x: px/2, y: py/2} );
		}
	}
	return ret;
}

var tau = 0.5;
function setTau( val )
{
	tau = parseFloat( val );
	document.getElementById("valbox").innerHTML=val;
	doSpline();
}

function SPL_Catmull2( controlpoints )
{
	var ret, i, t, ax, ay, bx, by, cx, cy, dx, dy, px, py;
	ret = [];
	for( i = 2; i < controlpoints.length -1 ; i++ )
	{
		var c = controlpoints;
		ax =   - tau * c[i-2].x + (2-tau) * c[i-1].x + (tau-2) * c[i].x + tau * c[i+1].x;
		ay =   - tau * c[i-2].y + (2-tau) * c[i-1].y + (tau-2) * c[i].y + tau * c[i+1].y;

		bx = 2 * tau * c[i-2].x + (tau-3) * c[i-1].x + (3-2*tau) * c[i].x - tau * c[i+1].x;
		by = 2 * tau * c[i-2].y + (tau-3) * c[i-1].y + (3-2*tau) * c[i].y - tau * c[i+1].y;

		cx =   - c[i-2].x                  + tau * c[i].x;
		cy =   - c[i-2].y                  + tau * c[i].y;

		dx = 			    c[i-1].x;
		dy = 			    c[i-1].y;
		for( t = 0; t < 1; t += 0.1 )
		{
			px = ax*Math.pow(t, 3) + bx*Math.pow(t, 2) + cx*t + dx;
			py = ay*Math.pow(t, 3) + by*Math.pow(t, 2) + cy*t + dy;
			ret.push( {x: px, y: py} );
		}
	}
	return ret;
}

function selectTool( tool )
{
	currentTool = tool;
}


