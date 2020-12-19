<script>
    import { fly } from 'svelte/transition';
    import Setting from '../Setting.svelte';

    export let pluginDisplay;

    let source = new EventSource('/api/plugin-settings/');
    source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        let e = new Event('setting-changed');
        e.setting = data;
        window.dispatchEvent(e);
    }
</script>

<div in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    {#if pluginDisplay}
        {#each pluginDisplay.filter(el => !!el.settings) as display, i}
            {#each display.settings as setting, i2}
                <Setting prefix={display.prefix} {setting}></Setting>
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