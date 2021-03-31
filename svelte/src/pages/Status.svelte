<script>
    import { fly } from 'svelte/transition';

    import Graph from '../Graph.svelte';

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
</script>

<div in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    <Graph title="CPU Usage" data={cpuData} labels={['Server','Other']} unit="percent" limit=100></Graph>
    <Graph title="Ram Usage" data={ramData} labels={['Server','Other']} unit="bytes" limit={maxMemory}></Graph>
    <Graph title="Players" data={playersData} labels={['Players']} limit={playersData.reduce((a, c) => Math.max(a, c), 0)}></Graph>
</div>

<style>
    div{
		display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap;
        position: absolute;
        width: 100%;
	}
</style>