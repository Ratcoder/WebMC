<script>
    import { fly } from 'svelte/transition';

    import Graph from '../Graph.svelte';

    export let status;

    let source = new EventSource(`/api/graphs`);
    let cpuData = [];
    let ramData = [];
    let playersData = [];
    source.onmessage = (event) => {
        if(event.data.startsWith('cpu')){
            cpuData = [...cpuData, JSON.parse(event.data.substring(4))];
            if(cpuData.length > 60){
                cpuData.shift();
            }
        }
        else if(event.data.startsWith('ram')){
            ramData = [...ramData, JSON.parse(event.data.substring(4))];
            if(ramData.length > 60){
                ramData.shift();
            }
        }
        else if(event.data.startsWith('players')){
            playersData = [...playersData, JSON.parse(event.data.substring(7))];
            if(playersData.length > 60){
                playersData.shift();
            }
        }
    }

    let maxMemory;
    fetch('api/max-memory')
        .then(res => res.text())
        .then(text => {
            maxMemory = parseInt(text);
            console.log(maxMemory);
        })
    
    function startStopServer(type, delay){
        fetch(`/api/status`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify({type, delay})});
    }
</script>

<div id="page" in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    <div id="management">
        <h3>Status - {status}</h3>
        {#if status == 'online'}
            <button on:click={() => {startStopServer('stop', false)}}>Shut Down</button>
            <button on:click={() => {startStopServer('stop', true)}}>Shut Down in 60s</button>
            <button on:click={() => {startStopServer('restart', false)}}>Restart</button>
            <button on:click={() => {startStopServer('restart', true)}}>Restart in 60s</button>
        {:else if status == 'restarting'}
            <button on:click={() => {startStopServer('stop', false)}}>Shut Down</button>
            <button on:click={() => {startStopServer('restart', false)}}>Restart</button>
        {:else if status == 'shutting-down'}
            <button on:click={() => {startStopServer('stop', false)}}>Shut Down</button>
        {:else if status == 'offline'}
            <button on:click={() => {startStopServer('start', false)}}>Start</button>
        {/if}
    </div>
    <Graph title="CPU Usage" data={cpuData} labels={['Server','Other']} unit="percent" limit=100></Graph>
    <Graph title="Ram Usage" data={ramData} labels={['Server','Other']} unit="bytes" limit={maxMemory}></Graph>
    <Graph title="Players" data={playersData} labels={['Players']} limit={playersData.reduce((a, c) => Math.max(a, c), 0)}></Graph>
</div>

<style>
    #page{
		display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap;
        position: absolute;
        width: 100%;
	}
    #management{
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
    button{
        margin: 15px auto;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
        
        border: none;
        border-radius: 0;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
        width: 200px;
    }
    button:hover{
        background-color: #252525;
        box-shadow: 0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20);
    }
    button:focus{
        border: none;
        outline: none;
    }
</style>