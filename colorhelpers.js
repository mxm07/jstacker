
//Thanks to http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion for the next two functions
function rgb_to_hsl( r, g, b ) {
	r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if( max == min ) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch( max ) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}
function hsl_to_rgb( h, s, l ) {
    var r, g, b;

    if( s == 0 ) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
			if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
//Gets a complementary color by converting the color to HSL, altering its hue, and then converting back
function complementary_color( hex ) {
	if( hex.length != 7 ) return; //Hex number has to be of the form #xxxxxx

	//Convert rgb-hex to HSL
	var v = [ hex.slice( 1, 3 ), hex.slice( 3, 5 ), hex.slice( 5, 7 ) ];
	var hsl = rgb_to_hsl( parseInt( v[0], 16 ), parseInt( v[1], 16 ), parseInt( v[2], 16 ) );

	//Modify the hue of the color to find complement
	hsl = [ ( hsl[0] + 0.333 ) % 1, hsl[1], hsl[2] ];

	//Convert modified HSL to rgb
	var rgb = hsl_to_rgb( hsl[0], hsl[1], hsl[2] );
	rgb = [ rgb[0].toString(16), rgb[1].toString(16), rgb[2].toString(16) ];

	//Convert RGB to hex
	var out = "#" + (rgb[0].length == 1 ? "0" : "") + rgb[0] + (rgb[1].length == 1 ? "0" : "") + rgb[1] + (rgb[2].length == 1 ? "0" : "") + rgb[2];

	//Return the rgb-hex of the modified color.  If the color didn't change, default to light red (usually means original color was white/black/gray)
	return ( hex == out ? "#ff3838" : out );
}
function rgb_to_hex( col ) {
    var rgb = [ col[0].toString(16), col[1].toString(16), col[2].toString(16) ];
    return "#" + (rgb[0].length == 1 ? "0" : "") + rgb[0] + (rgb[1].length == 1 ? "0" : "") + rgb[1] + (rgb[2].length == 1 ? "0" : "") + rgb[2];
}
function random_color() {
	var rgb = [ (Math.floor(Math.random() * 255)).toString(16), (Math.floor(Math.random() * 255)).toString(16), (Math.floor(Math.random() * 255)).toString(16) ];
	return "#" + (rgb[0].length == 1 ? "0" : "") + rgb[0] + (rgb[1].length == 1 ? "0" : "") + rgb[1] + (rgb[2].length == 1 ? "0" : "") + rgb[2];
}
function hex2rgb(str) {
    var num = parseInt(str.slice(1), 16); // Convert to a number
    return [num >> 16 & 255, num >> 8 & 255, num & 255];
}