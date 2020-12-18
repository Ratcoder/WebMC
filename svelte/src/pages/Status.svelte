<script>
    import { fly } from 'svelte/transition';

    export let pluginDisplay;
    import Graph from '../Graph.svelte';
</script>

<div in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    {#if pluginDisplay}
        {#each pluginDisplay.filter(el => !!el.graphs) as display, i}
            {#each display.graphs as graph, i2}
                <Graph display={graph} url={graph.url}></Graph>
            {/each}
        {/each}
    {/if}
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