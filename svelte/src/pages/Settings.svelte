<script>
    import { fly } from 'svelte/transition';
    import Setting from '../Setting.svelte';

    export let pluginDisplay;
</script>

<div in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    {#if pluginDisplay}
        {#each pluginDisplay.filter(el => !!el.settings) as display, i}
            {#each display.settings as setting, i2}
                <Setting {setting}></Setting>
            {/each}
        {/each}
    {/if}
</div>

<style>
    div{
		/* display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap; */
        position: absolute;
        width: 100%;
	}
</style>