<script>
    import { fly } from 'svelte/transition';
    export let prefix;
    export let setting;
    
    
    
    let value = setting.default;
    let value1 = setting.default;
    let value2 = setting.default;
    let value3 = setting.default;
    function load(){
        window.addEventListener("setting-changed", (event) => {
            if(prefix == event.setting[0] && setting.setting == event.setting[1]){
                value = event.setting[2];
                value1 = event.setting[2];
                value2 = event.setting[2];
                value3 = event.setting[2];
            }
        });
        let e = new Event('setting-request');
        e.setting = prefix + ':' + setting.setting;
        window.dispatchEvent(e);
    }
    load();
    
    
    let warnPopupActive = false;
    let ignoreWarn = false;
    function submit(){
        if(setting.mcRestartRequired){
            fetch(`/api/plugin-settings/${prefix}`, {method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify(['mc-restart-required', true])});
        }
        if(ignoreWarn){
            warnPopupActive = false;
            ignoreWarn = false;
        }
        else if(setting.warn){
            warnPopupActive = true;
            return;
        }
        if(setting.type == 'int') value = value1
        if(setting.type == 'bool') value = value2
        if(setting.type == 'enum') value = value3
        if(setting.type == 'button'){
            fetch(setting.url,{method: 'post', headers: {'Content-Type': 'text/json'}})
        }
        else{
            fetch(`/api/plugin-settings/${prefix}`, {method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify([setting.setting, value])});
        }
    }
</script>

<div>
    {#if setting.type == 'section'}
        <h3>{setting.name}</h3>
        {#each setting.fields as s}
            <svelte:self setting={s} {prefix}/>
        {/each}
    {/if}
    <div class="wr">
        {#if setting.type == 'string'}
            <form onsubmit="return false;" on:change={submit} title={setting.desc}>
                <label for={setting.name}>{setting.name}</label>
                <input bind:value type="text" name={setting.name} id={setting.name}>
            </form>
        {:else if setting.type == 'int'}
            <form onsubmit="return false;" on:change={submit} title={setting.desc}>
                <label for={setting.name}>{setting.name}</label>
                <input bind:value={value1} type="number" name={setting.name} id={setting.name} min={setting?.range?.min} max={setting?.range?.max}>
            </form>
        {:else if setting.type == 'bool'}
            <form on:change={submit} style="margin-bottom: 11.15px; margin-top: 11.15px" title={setting.desc}>
                <input bind:checked={value2} type="checkbox" name={setting.name} id={setting.name} style="display: inline-block; vertical-align:middle;">
                <label for={setting.name} style="display: inline-block; vertical-align:middle;">{setting.name}</label>
            </form>
        {:else if setting.type == 'enum'}
            <form onsubmit="return false;" on:change={submit} title={setting.desc}>
                <label for={setting.name}>{setting.name}</label>
                <select bind:value={value3} type="text" name={setting.name} id={setting.name}>
                    {#each setting.enum as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            </form>
        {:else if setting.type == 'button'}
            <button on:click={submit}>{setting.name}</button>
        {/if}
        {#if warnPopupActive}
            <div class="warn" on:blur={warnPopupActive=false} in:fly="{{ y: 300, duration: 600 }}" out:fly="{{ y: 300, duration: 600 }}">
                <p>{setting.warn.text}</p>
                <button on:click={()=>{ignoreWarn=true;submit(true)}}>Yes</button>
                <button style="float: right;" on:click="{()=>{warnPopupActive=false}}">Cancel</button>
            </div>
        {/if}
    </div>
</div>


<style>
    div{
        text-align: left;
        margin-left: 0px;
        padding: 0px;
        color: rgba(255,255,255,0.6);
    }
    h3{
        color: rgba(255,255,255,0.87);
    }
    form{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    input, select, button{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        
        border: none;
        border-radius: 0;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
        width: 200px;
    }
    input[type=checkbox]{
        width: 20px;
        height: 20px;
        margin: 0px;
        padding: 0px;
        text-align: center;
    }
    input[type=checkbox]:checked::before{
        content: '✓';
        width:100%;
        width:100%;
        text-align: center;
    }
    input[type=checkbox]:not(:checked)::before{
        content: '✓';
        color: transparent;
        text-align: center;
    }
    input:hover, select:hover, button:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    input:focus, select:focus, button:focus{
        border: none;
        outline: none;
    }
    .warn{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
        position: absolute;
        width: 250px;
        /* top: calc(50vh - 100px); */
        left: -25px;
        padding: 20px;
        transform: translateX(-100vw);
    }
    .warn p{
        margin: 0px;
    }
    .wr:focus-within .warn{
        transform: translateX(0px);
    }
    .wr{
        width:100%;
    }
    .warn button{
        margin-top: 25px;
        width: calc(50% - 6.4px);
        float: left;
        background-color: #242424;
        box-shadow: 0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20);
    }
    .warn button:hover{
        background-color: #272727;
        box-shadow: 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20);
    }
</style>