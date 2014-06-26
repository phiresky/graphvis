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
    gravity=-500;
    update() {
        for(var i=0;i<this.nodes.length;i++) {
            var n=this.nodes[i];
            for(var e=0;e<n.edges.length;e++) {
                var m=this.nodes[n.edges[e]];
                var dx=n.x-m.x;
                var dy=n.y-m.y;
                var d=Math.sqrt(dx*dx+dy*dy);
                var f=(d-this.targetDist)/1000;
                //var grav=1000/d/d;//m1*m2/d^2;
                n.ax-=f*dx/d;
                n.ay-=f*dy/d;
                m.ax+=f*dx/d;
                m.ay+=f*dy/d;
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
    
    static drawArrowHead(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number) {
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
	constructor(container:HTMLElement,width:number,height:number,data:Graph) {
	    var viz=<HTMLCanvasElement>document.createElement("canvas");
	    viz.width=this.w=width;
	    viz.height=this.h=height;
        container.appendChild(viz);
        this.canvas=viz;
		this.ctx=viz.getContext("2d");
		this.graph=data;
		viz.onmousedown=e=>{
		    this.mouseInfo.downX=e.x;
		    this.mouseInfo.downY=e.y;
		    this.mouseInfo.down=true;
		}
		viz.onmousemove=e=>{
		    if(this.mouseInfo.down) {
    		    this.drawOffset.x=this.drawOffset.ax+e.x-this.mouseInfo.downX;
    		    this.drawOffset.y=this.drawOffset.ay+e.y-this.mouseInfo.downY;
		    }
		}
		viz.onmouseup=e=>{
		    this.mouseInfo.down=false;
		    this.drawOffset.ax=this.drawOffset.x;
		    this.drawOffset.ay=this.drawOffset.y;
		}
		viz.onmousewheel=e=>{
		    this.drawOffset.scale.a=e.wheelDelta/5000;
		}
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
	    ctx.save();
	    
	    ctx.translate(this.drawOffset.x,this.drawOffset.y);
	    ctx.translate(this.w/2,this.h/2);
	    ctx.scale(this.drawOffset.scale.real,this.drawOffset.scale.real);
	    ctx.translate(-this.w/2,-this.h/2);
	    
	    for(var i=0;i<this.graph.nodes.length;i++) {
	        var node=this.graph.nodes[i];
	        Util.drawCircle(this.ctx,node.x,node.y,6);
	        for(var e=0;e<node.edges.length;e++) {
	            var node2=this.graph.nodes[node.edges[e]];
	            Util.drawLine(this.ctx,node.x,node.y,node2.x,node2.y);
	        }
	    }
	    ctx.restore();
	    if(this.drawing) requestAnimationFrame(this.draw.bind(this));
	}
}
function graphFromStringInp(str:string,getCoordinates:(nodeNumber:number)=>{x:number;y:number}) {
    var split=str.split("\n");
    var nodeCount=+split[0].split(" ")[0];
    var nodes=new Array<GraphNode>(nodeCount);
    var i=0;
    for(;i<split.length-1;i++) {
        var lineSplit;
        if(split[i+1].length===0) lineSplit=[];
        else lineSplit=split[i+1].split(" ");
        var edges=[];
        lineSplit.forEach(s=>s.length>0&&edges.push(+s-1));
        var coords=getCoordinates(i);
        nodes[i]=new GraphNode(edges,coords.x,coords.y);
    }
    while(i<nodeCount) {
        var coords=getCoordinates(i);
        nodes[i++]=new GraphNode([],coords.x,coords.y);
    }
    return new Graph(nodes);
}
var gv:GraphViewer;
$(() => {
    var w=window.innerWidth;//document.body.clientWidth;
    var h=window.innerHeight;//document.body.clientHeight;
    
    $.get("inp/testcase9.txt",response=>{
        var graph=graphFromStringInp(response,n=>({x:w/2+Math.random()*100-50,y:w/2+Math.random()*100-50}));
	    gv=new GraphViewer($("#viz")[0],w,h,graph);
	    gv.beginDrawing();
    });
});
