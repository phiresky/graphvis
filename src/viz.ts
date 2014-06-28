/// <reference path="jquery.d.ts" />
class GraphNode {
    ax:number=0;ay:number=0;
    constructor(public edges:number[]=[], 
        public x:number=0,public y:number=0,
        public vx:number=0,public vy:number=0) {}
}
class Graph {
    constructor(public nodes:GraphNode[]) {}
    targetDist=100;
    friction=0.9;
    gravity=-700;
	attraction=1/1000;
	leftright=0.05;
    update() {
        for(var i=0;i<this.nodes.length;i++) {
            var n=this.nodes[i];
            for(var e=0;e<n.edges.length;e++) {
                var m=this.nodes[n.edges[e]];
                var dx=n.x-m.x;
                var dy=n.y-m.y;
                var d=Math.sqrt(dx*dx+dy*dy);
                var f=(d-this.targetDist)*this.attraction;
                n.ax-=f*dx/d;
                n.ay-=f*dy/d;
                m.ax+=f*dx/d;
                m.ay+=f*dy/d;
				n.ax-=this.leftright;
				m.ax+=this.leftright;
            }
            for(var j=i;j<this.nodes.length;j++) {
                var m=this.nodes[j];
                var dx=n.x-m.x;
                var dy=n.y-m.y;
                var d=Math.sqrt(dx*dx+dy*dy);
                if(d===0) continue;
                var f=this.gravity/d/d;//m1*m2/d^2;
                n.ax-=f*dx/d;
                n.ay-=f*dy/d;
                m.ax+=f*dx/d;
                m.ay+=f*dy/d;
            }
        }
        for(var i=0;i<this.nodes.length;i++) {
            var n=this.nodes[i];
            n.vx+=n.ax;
            n.vy+=n.ay;
            n.vx*=this.friction;
            n.vy*=this.friction;
            n.x+=n.vx;
            n.y+=n.vy;
            n.ax=0;n.ay=0;
        }
    }
}
class Util {
    static drawCircle(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number) {
        ctx.beginPath();
	    ctx.arc(x,y,10,0,Math.PI*2);
	    ctx.closePath();
	    ctx.fill();
    }
    static drawLine(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number) {
        ctx.beginPath();
	    ctx.moveTo(x1,y1);
	    ctx.lineTo(x2,y2);
	    ctx.stroke();
	    Util.drawArrowHead(ctx,x1,y1,x2,y2);
    }
    
    static drawArrowHead(ctx:CanvasRenderingContext2D,x2:number,y2:number,x1:number,y1:number) {
        var radians=Math.atan((y2-y1)/(x2-x1));
        radians+=((x2>x1)?-90:90)*Math.PI/180;
        ctx.save();
        ctx.beginPath();
        ctx.translate(x1,y1);
        ctx.rotate(radians);
        ctx.translate(0,9);
        ctx.moveTo(0,0);
        ctx.lineTo(5,10);
        ctx.lineTo(-5,10);
        ctx.closePath();
        ctx.restore();
        ctx.fill();
    }
}
class GraphViewer {
	ctx:CanvasRenderingContext2D;
	canvas:HTMLCanvasElement;
	w:number;h:number;
	graph:Graph;
	drawing:boolean;
	mouseInfo:any={down:false,downX:0,downY:0};
	drawOffset={x:0,y:0,ax:0,ay:0,scale:{a:0,v:0,p:0,real:1}};
	alpha=false;
	constructor(containerElement:HTMLElement,width:number,height:number,data:Graph) {
		var container=$(containerElement);
		this.drawOffset.scale.a=-data.nodes.length/2000;
	    var viz=$("<canvas>")
		if((<any>container[0]).__graphViewer) {
			(<any>container[0]).__graphViewer.destroy();
			container.empty();
		}
		(<any>container[0]).__graphViewer = this;
        container.append(viz);
		$("<div>")
			.css("position","absolute")
			.css("top","0")
			.css("left","0")
			.css("background-color","rgba(255,255,255,0.8)")
			.css("margin","1ex")
			.css("padding","1ex")
			.css("float","left")
			.css("border","1px solid gray")
			.css("font-family","mono")
			.html(["Graph Visualisation (<a href='https://github.com/phiresky/graphvis'>source</a>)"
					,"Commands:"
					,"(shift)+a - change attraction strength"
					,"(shift)+g - change gravity strength"
					,"(shift)+d - change target distance"
					,"(shift)+s - change scale"
					,"(shift)+r - change left/right offset"
					,"ctrl+v    - load a graph file from the clipboard"
					,"        t - toggle transparency"].join("<br>"))
			.appendTo(container);
        this.canvas=<HTMLCanvasElement>viz[0];
		this.canvas.width=this.w=width;
		this.canvas.height=this.h=height;
		this.ctx=this.canvas.getContext("2d");
		this.graph=data;
		container.mousedown(e=>{
		    this.mouseInfo.downX=e.pageX;
		    this.mouseInfo.downY=e.pageY;
		    this.mouseInfo.down=true;
		});
		container.mousemove(e=>{
		    if(this.mouseInfo.down) {
    		    this.drawOffset.x=this.drawOffset.ax+e.pageX-this.mouseInfo.downX;
    		    this.drawOffset.y=this.drawOffset.ay+e.pageY-this.mouseInfo.downY;
		    }
		});
		container.mouseup(e=>{
		    this.mouseInfo.down=false;
		    this.drawOffset.ax=this.drawOffset.x;
		    this.drawOffset.ay=this.drawOffset.y;
		});
		var wheelListener=(e:MouseWheelEvent)=>{
			var delta=e.wheelDelta;
			if(e.detail) delta=-40*e.detail;
		    this.drawOffset.scale.a=delta/5000;
		};
		window.addEventListener('DOMMouseScroll',wheelListener);
		window.addEventListener('mousewheel',wheelListener);
		$(window).keydown(e=>{
			if(e.keyCode==17) {
				console.log("hi");
				(<any>window)._copyArea=$("<textarea>").appendTo("body").focus();
			}
			var actions:{[keyCode:number]:(shiftPressed:boolean)=>void}={
				84:(s)=>this.alpha=!this.alpha,// t
				71:(shift)=>this.graph.gravity*=shift?2:0.5,// g
				68:(shift)=>this.graph.targetDist*=shift?2:0.5,// d
				65:(shift)=>this.graph.attraction*=shift?2:0.5,// a
				83:(shift)=>this.drawOffset.scale.a+=shift?0.02:-0.02, // s
				82:(shift)=>this.graph.leftright-=shift?0.1:-0.1 // r
			};
			var action=actions[e.keyCode];
			if(action) action(e.shiftKey);
			//console.log(e.keyCode);
			//console.log(e);
		});
		$(window).keyup(e=>{
			if(e.keyCode==17) {
				var textarea= (<any>window)._copyArea;
				if(textarea!==undefined) {
					var val=textarea.val();
					textarea.remove();
					if(val.length>1) {
						console.log("Loading from clipboard");
						initGraphViewerFromString(val);
					}
				}
			}
		});
		window.addEventListener("resize",e=>{
			this.canvas.width=this.w=container.width();
			this.canvas.height=this.h=container.height();
		});


	}
	
	beginDrawing() {
	    this.drawing=true;
	    this.draw();
	}
	
	update() {
	    var s=this.drawOffset.scale;
	    s.v+=s.a;
	    s.v*=0.9;
	    s.p+=s.v;
	    s.a=0;
	    s.real=Math.exp(s.p);
	    this.graph.update();
	}
	
	draw() {
	    this.update();
	    var ctx=this.ctx;
	    ctx.fillStyle="#fff";
	    ctx.fillRect(0,0,this.w,this.h);
	    ctx.fillStyle="#000";
	    ctx.strokeStyle=this.alpha?"rgba(0,0,0,0.5)":"#000";
	    ctx.save();
	    
	    ctx.translate(this.drawOffset.x,this.drawOffset.y);
	    ctx.translate(this.w/2,this.h/2);
	    ctx.scale(this.drawOffset.scale.real,this.drawOffset.scale.real);
	    ctx.translate(-this.w/2,-this.h/2);
	    for(var i=0;i<this.graph.nodes.length;i++) {
	        var node=this.graph.nodes[i];
	        for(var e=0;e<node.edges.length;e++) {
	            var node2=this.graph.nodes[node.edges[e]];
	            Util.drawLine(this.ctx,node.x,node.y,node2.x,node2.y);
	        }
	        Util.drawCircle(this.ctx,node.x,node.y,6);
	    }
	    ctx.restore();
	    if(this.drawing) requestAnimationFrame(this.draw.bind(this));
	}

	destroy() {
		this.drawing=false;
		$(this.canvas).remove();
		$(window).off();
	}
}
function graphFromStringInp(str:string,zeroBased=false,coordinateGenerator?:(nodeNumber:number)=>{x:number;y:number}) {
	if(!coordinateGenerator) coordinateGenerator=n=>({x:window.innerWidth/2+Math.random()*500-250,y:window.innerHeight/2+Math.random()*500-250});
    var split=str.split("\n");
    var nodeCount=+split[0].split(" ")[0];
    var nodes=new Array<GraphNode>(nodeCount);
    var i=0;
    for(;i<split.length-1;i++) {
        var lineSplit:string[]=[];
        if(split[i+1].length>0) lineSplit=split[i+1].split(" ");
        var edges:number[]=[];
        lineSplit.forEach(s=>s.length>0&&edges.push(+s-(zeroBased?0:1)));
        var coords=coordinateGenerator(i);
        nodes[i]=new GraphNode(edges,coords.x,coords.y);
    }
    while(i<nodeCount) {
        var coords=coordinateGenerator(i);
        nodes[i++]=new GraphNode([],coords.x,coords.y);
    }
    return new Graph(nodes);
}
var gv:GraphViewer;
function initGraphViewerFromString(response:string) {
	var w=window.innerWidth;
	var h=window.innerHeight
	var graph=graphFromStringInp(response);
	gv=new GraphViewer($("#viz")[0],w,h,graph);
	gv.beginDrawing();
}

function initGraphViewer(url:string) {
	$.get(url,initGraphViewerFromString);
}
$(()=>initGraphViewer((location.search&&location.search.substr(1))||"inp/testcase9.txt"));
