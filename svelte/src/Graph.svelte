<script>
    import { onDestroy, onMount } from "svelte";
    import { element } from "svelte/internal";


    export let display;
    export let url;
    
    let canvas;
    let ctx;
    
    let graphData = [];

	onMount(() => {
		canvas = document.getElementById(graphName + "graphcanvas" + url);
        ctx = canvas.getContext("2d");
        window.requestAnimationFrame(draw);
        draw();
    });

    let timeout;
    let animationRequest;
    onDestroy(() => {
        clearTimeout(timeout);
        cancelAnimationFrame(animationRequest);
    });

    let source = new EventSource(url);
    source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if(graphData && graphData.length > 60){
            graphData.shift();
        }
        graphData = [...graphData, data];
    }
    source.onerror = () => {
        window.location.replace("/login");
    }
    
    let colors = ['#f5cb5c', '#43b581'];//['#2F9987', '#70DBAB']//
    function draw(){
        if(graphData.length > 0){
            ctx.fillStyle = "#1e1e1e";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            ctx.strokeStyle = "rgba(255,255,255,0.38)";
            ctx.lineWidth = 3;
            
            const currentHeight = new Array(graphData.length);
            display.fields.forEach((element, i) => {
                ctx.beginPath();
                // ctx.moveTo(0, canvas.height - (currentHeight[0] || 0));

                const timeDifference = graphData[graphData.length - 1]._t - graphData[0]._t;

                ctx.moveTo(canvas.width, canvas.height - (currentHeight[currentHeight.length-1]));
                for(let i = graphData.length - 1;i>=0;i--){
                    if(currentHeight[i] == undefined)currentHeight[i]=0;
                    ctx.lineTo(canvas.width * ((graphData[i]._t - graphData[0]._t) / timeDifference), canvas.height - (currentHeight[i]));
                }
                ctx.lineTo(0, canvas.height - (currentHeight[0] || 0));

                for(let i = 0;i<graphData.length;i++){
                    let h = canvas.height * graphData[i][element.property]/display.limit;
                    ctx.lineTo(canvas.width * ((graphData[i]._t - graphData[0]._t) / timeDifference), canvas.height - (currentHeight[i] + h));
                    currentHeight[i] += h;
                }
                ctx.lineTo(canvas.width, canvas.height - (currentHeight[currentHeight.length-1]-canvas.height * graphData[currentHeight.length-1][element.property]/display.limit));
                
                // ctx.stroke();
                ctx.fillStyle=colors[i%2];
                ctx.strokeStyle=colors[i%2];
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            ctx.strokeStyle = "#5f6367";
            //ctx.lineWidth = 6;

            ctx.lineWidth = 2;
            for(let i=1;i<=10;i++){
                ctx.beginPath();
                ctx.moveTo(0,canvas.height*i/10);
                ctx.lineTo(canvas.width,canvas.height*i/10);
                ctx.stroke();
            }
            
            if(mouseOver){
                let hoverTime = graphData[0]._t + (graphData[graphData.length - 1]._t - graphData[0]._t) * mouseX / canvas.width;
                let indexGuess = Math.floor(graphData.length*mouseX/canvas.width);

                while (graphData[indexGuess]._t > hoverTime && indexGuess < graphData.length - 1){
                    indexGuess++;
                }
                while (graphData[indexGuess]._t < hoverTime && indexGuess > 0){
                    indexGuess--;
                }

                let height = 0;
                for (let i = 0; i < display.fields.length; i++) {
                    let hoverValue = height+graphData[Math.floor(graphData.length*mouseX/canvas.width)][display.fields[i].property];
                    if(mouseY > canvas.height - canvas.height * hoverValue / display.limit){
                        ctx.fillStyle = "#222222";
                        // box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
                        let boxX = Math.max(31, Math.min(mouseX, canvas.width - 31));
                        ctx.beginPath();
                        ctx.moveTo(boxX - 60, mouseY - 140);
                        ctx.lineTo(boxX + 60, mouseY - 140);
                        ctx.lineTo(boxX + 60, mouseY - 20);
                        let triX = Math.max(boxX - 40, Math.min(mouseX, boxX + 40));
                        ctx.lineTo(triX + 20, mouseY - 20);
                        ctx.lineTo(triX, mouseY);
                        ctx.lineTo(triX - 20, mouseY - 20);
                        ctx.lineTo(boxX - 60, mouseY - 20);
                        ctx.moveTo(boxX - 60, mouseY - 140);

                        ctx.shadowColor = "rgba(0,0,0,0.14)";
                        ctx.offsetX = 0;
                        ctx.offsetY = 2;
                        ctx.shadowBlur = 2;
                        ctx.fill();
                        ctx.shadowColor = "rgba(0,0,0,0.12)";
                        ctx.offsetX = 0;
                        ctx.offsetY = 3;
                        ctx.shadowBlur = 1;
                        ctx.fill();
                        ctx.shadowColor = "rgba(0,0,0,0.20)";
                        ctx.offsetX = 0;
                        ctx.offsetY = 1;
                        ctx.shadowBlur = 5;
                        ctx.fill();

                        ctx.font = '30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
                        ctx.fillStyle = "rgba(255,255,255,0.87)";
                        ctx.textAlign = "center";
                        ctx.fillText(display.fields[i].title, boxX, mouseY - 100);
                        ctx.fillStyle = "rgba(255,255,255,0.6)";
                        ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
                        ctx.fillText(valueToString(hoverValue - height, display.unit), boxX, mouseY - 60);

                        break;
                    }
                    height+=hoverValue;
                }
            }
            
            // ctx.beginPath();
            // ctx.moveTo(mouseX,canvas.height);
            // let hoverValue = graphData[Math.floor(graphData.length*mouseX/canvas.width)][display.fields[0].property];
            // ctx.lineTo(mouseX,canvas.height - canvas.height * hoverValue/display.limit);
            // ctx.stroke();

            // ctx.font = "12px Arial";
            // ctx.fillStyle="rgba(255,255,255,0.6)";
            // ctx.textAlign = "center";
            // ctx.fillText(valueToString(hoverValue, display.unit), mouseX, mouseY);
        }
        animationRequest = window.requestAnimationFrame(draw);
    }
    function valueToString(value, unit){
        if(unit == 'bytes'){
            if(value < 1024){
                return value + " B";
            }
            else if(value < 1024 * 1024){
                return Math.round(10 * value / 1024) / 10 + " KB";
            }
            else if(value < 1024 * 1024 * 1024){
                return Math.round(10 * value / (1024 * 1024)) / 10 + " MB";
            }
            else{
                return Math.round(10 * value / (1024 * 1024 * 1024)) / 10 + " GB";
            }
        }
        else if (unit == 'percent'){
            return Math.round(value * 10) / 10 + "%";
        }
        else{
            return Math.round(value);
        }
    }

    let mouseX = 0, mouseY = 0;
    let mouseOver = false;
    function mouseMoved(event) {
        mouseX = 800 * event.offsetX / canvas.width;
        mouseY = 800 * event.offsetY / canvas.height;
    }
    function mouseEnter(){
        mouseOver = true;
    }
    function mouseExit(){
        mouseOver = false;
    }
    let graphName = Math.random()+"";
</script>

<style>
    div{
        background-color: #1e1e1e;
        padding: 10px;
        padding-bottom: 20px;
        width: 310px;
        box-sizing: border-box;
        text-align: center;
        margin: 10px;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
    }
    h3{
        color: rgba(255,255,255,0.87);
        margin: 10px;
    }
    p{
        margin-top: 0px;
        color: rgba(255,255,255,0.6);
    }
    canvas{
        width:200px;
        height: 200px;
    }
</style>

<div>
    <h3>{display.title}</h3>
    <p>
        {#if graphData.length > 0}
            {#if display.fields.length > 1}
                Total: 
                {valueToString(display.fields.reduce((a,b)=>{
                    return graphData[graphData.length-1][a.property] + graphData[graphData.length-1][b.property];
                }), display.unit)}
                <br>
            {/if}
            {#each display.fields as field}
                {#if display.fields.length > 1}
                    {field.title}: 
                {/if}
                {valueToString(graphData[graphData.length-1][field.property], display.unit)}
                <br>
            {/each}
        {/if}
    </p>
<canvas width=400 height=400 id={graphName + "graphcanvas" + url} on:mousemove={mouseMoved} on:mouseenter={mouseEnter} on:mouseleave={mouseExit}>

    </canvas>
</div>
