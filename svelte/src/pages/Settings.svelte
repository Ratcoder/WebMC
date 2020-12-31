<script>
    import { fly } from 'svelte/transition';
    import Setting from '../Setting.svelte';

    export let pluginDisplay;

    let source = new EventSource('/api/plugin-settings/');
    let settings = new Map();
    source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        let e = new Event('setting-changed');
        e.setting = data;
        window.dispatchEvent(e);
        settings.set(data[0] + ':' + data[1], data);
    }
    window.addEventListener("setting-request", (event) => {
        if(!settings.get(event.setting)) return;
        let e = new Event('setting-changed');
        e.setting = settings.get(event.setting);
        window.dispatchEvent(e);
    });
    let tabs;
    let currentTab = 0;
    $: {
        tabs = [];
        pluginDisplay.filter(el => !!el.settings).forEach(element => {
            element.settings.forEach(el => {
                el.prefix = element.prefix;
                tabs.push(el);
            });
        });
    }
</script>

<div class="main" in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    {#if pluginDisplay}
        <div class="tabs">
            {#each tabs as tab, i}
                <button class:selected={i == currentTab} on:click="{()=>{currentTab = i}}">{tab.name}</button>
            {/each}
        </div>
        <div class="settings">
            <h2>{tabs[currentTab].name}</h2>
            {#each tabs as tab, i}
                {#each tab.fields as setting}
                    {#if i == currentTab}
                        <div style=""><Setting prefix={tabs[currentTab].prefix} {setting}></Setting></div>
                    {:else}
                        <div style="visibility:hidden;position:absolute"><Setting prefix={tabs[currentTab].prefix} {setting}></Setting></div>
                    {/if}
                    
                {/each}
            {/each}
        </div>
    {/if}
</div>

<style>
    div.main{
		/* display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap; */
        position: absolute;
        width: 100%;
	}
    .tabs{
        margin-top: 20px;
        float: left;
        transform: translateX(calc(50vw - 170%));
    }
    h2{
        text-align: left;
        color: rgba(255,255,255,0.87);
        display:block;
        width: 100%;
    }
    .settings{
        position: absolute;
        left: calc(50vw - 100px);
    }
    @media only screen and (max-width: 700px) {
        .tabs{
            /* float: none; */
            /* position: absolute;
            left: calc(50vw - 50%); */
            float:none;
            transform: translateX(calc(50vw - 100px));
        }
        .settings{
            position: unset;
            transform: translateX(calc(50vw - 100px));
        }
    }
    button{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        border: none;
        border-radius: 0;
        margin: auto;
        margin: 0px;
        height: 40px;
        width: 200px;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
    }
    button.selected{
        text-decoration: underline;
    }
    button:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    button:focus{
        border: none;
        outline: none;
    }
</style>