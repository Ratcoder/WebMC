<script>
    import { onDestroy, onMount } from "svelte";
    import { element } from "svelte/internal";

    export let labels;
    export let data;
    export let unit;
    export let limit;
    export let title;
    
    let canvas;
    let ctx;

	onMount(() => {
		canvas = document.getElementById(graphName + "graphcanvas");
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
    
    let colors = ['#f5cb5c', '#43b581'];//['#2F9987', '#70DBAB']//
    function draw(){
        if(data.length > 0){
            ctx.fillStyle = "#1e1e1e";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            ctx.strokeStyle = "rgba(255,255,255,0.38)";
            ctx.lineWidth = 3;
            
            const currentHeight = new Array(data.length);
            labels.forEach((label, j) => {
                ctx.beginPath();
                // ctx.moveTo(0, canvas.height - (currentHeight[0] || 0));

                const timeDifference = data[data.length - 1]._t - data[0]._t;

                ctx.moveTo(canvas.width, canvas.height - (currentHeight[currentHeight.length-1]));
                for(let i = data.length - 1;i>=0;i--){
                    if(currentHeight[i] == undefined)currentHeight[i]=0;
                    ctx.lineTo(canvas.width * ((data[i]._t - data[0]._t) / timeDifference), canvas.height - (currentHeight[i]));
                }
                ctx.lineTo(0, canvas.height - (currentHeight[0] || 0));

                for(let i = 0;i<data.length;i++){
                    let h = canvas.height * data[i].data[j]/limit;
                    ctx.lineTo(canvas.width * ((data[i]._t - data[0]._t) / timeDifference), canvas.height - (currentHeight[i] + h));
                    currentHeight[i] += h;
                }
                ctx.lineTo(canvas.width, canvas.height - (currentHeight[currentHeight.length-1]-canvas.height * data[currentHeight.length-1].data[j]/limit));
                
                // ctx.stroke();
                ctx.fillStyle=colors[j%2];
                ctx.strokeStyle=colors[j%2];
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
                let hoverTime = data[0]._t + (data[data.length - 1]._t - data[0]._t) * mouseX / canvas.width;
                let indexGuess = Math.floor(data.length*mouseX/canvas.width);

                while (data[indexGuess]._t > hoverTime && indexGuess < data.length - 1){
                    indexGuess++;
                }
                while (data[indexGuess]._t < hoverTime && indexGuess > 0){
                    indexGuess--;
                }

                let height = 0;
                for (let i = 0; i < labels.length; i++) {
                    let hoverValue = height+data[Math.floor(data.length*mouseX/canvas.width)].data[i];
                    if(mouseY > canvas.height - canvas.height * hoverValue / limit){
                        ctx.fillStyle = "#222222";
                        // box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
                        let boxX = Math.max(62, Math.min(mouseX, canvas.width - 62));
                        let boxY = Math.max(mouseY, 150);
                        ctx.beginPath();
                        ctx.moveTo(boxX - 60, boxY - 140);
                        ctx.lineTo(boxX + 60, boxY - 140);
                        ctx.lineTo(boxX + 60, boxY - 20);
                        let triX = Math.max(boxX - 31, Math.min(mouseX, boxX + 31));
                        ctx.lineTo(triX + 20, boxY - 20);
                        ctx.lineTo(triX, boxY);
                        ctx.lineTo(triX - 20, boxY - 20);
                        ctx.lineTo(boxX - 60, boxY - 20);
                        ctx.moveTo(boxX - 60, boxY - 140);

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
                        ctx.fillText(labels[i], boxX, boxY - 100);
                        ctx.fillStyle = "rgba(255,255,255,0.6)";
                        ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
                        ctx.fillText(valueToString(hoverValue - height, unit), boxX, boxY - 60);

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
    <h3>{title}</h3>
    <p>
        {#if data.length > 0}
            {#if labels.length > 1}
                Total: 
                {valueToString(labels.reduce((a, c, i)=>{
                    return a + data[data.length-1].data[i];
                }, 0), unit)}
                <br>
            {/if}
            {#each labels as label, i}
                {#if labels.length > 1}
                    {label}: 
                {/if}
                {valueToString(data[data.length-1].data[i], unit)}
                <br>
            {/each}
        {/if}
    </p>
<canvas width=400 height=400 id={graphName + "graphcanvas"} on:mousemove={mouseMoved} on:mouseenter={mouseEnter} on:mouseleave={mouseExit}>

    </canvas>
</div>
