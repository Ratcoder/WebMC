<script>
    export let prefix;
    export let setting;
    window.addEventListener("setting-changed", (event) => {
        if(prefix == event.setting[0] && setting.setting == event.setting[1]){
            value = event.setting[2];
            value1 = event.setting[2];
            value2 = event.setting[2];
        }
    });
    
    let value = setting.default;
    let value1 = setting.default;
    let value2 = setting.default;
    function submit(){
        if(setting.type == 'int') value = value1
        if(setting.type == 'bool') value = value2
        fetch(`/api/plugin-settings/${prefix}`, {method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify([setting.setting, value])});
    }
</script>

<div>
    {#if setting.type == 'section'}
    <details>
        <summary>{setting.name}</summary>
        {#each setting.fields as s}
            <svelte:self setting={s} {prefix}/>
        {/each}
    </details>
    {:else if setting.type == 'string'}
        <form onsubmit="return false;" on:change={submit} title={setting.desc}>
            <label for={setting.name}>{setting.name}</label>
            <input bind:value type="text" name="setting" id={setting.name}>
        </form>
    {:else if setting.type == 'int'}
        <form onsubmit="return false;" on:change={submit} title={setting.desc}>
            <label for={setting.name}>{setting.name}</label>
            <input bind:value={value1} type="number" name="setting" id={setting.name} min={setting?.range?.min} max={setting?.range?.max}>
        </form>
    {:else if setting.type == 'bool'}
        <form onsubmit="return false;" on:change={submit} style="margin-bottom: 11.15px; margin-top: 11.15px" title={setting.desc}>
            <input bind:value={value2} type="checkbox" name="setting" id={setting.name} style="display: inline-block; vertical-align:middle;">
            <label for={setting.name} style="display: inline-block; vertical-align:middle;">{setting.name}</label>
        </form>
    {/if}
</div>


<style>
    div{
        text-align: left;
        padding-left: 30px;
        color: rgba(255,255,255,0.6);
    }
    form{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    input{
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
    input:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    input:focus{
        border: none;
        outline: none;
    }
    details{
        padding: 5px;
    }
    summary{
        margin-bottom: 5px;
    }
    @media only screen and (max-width: 600px) {
        div{
            padding-left: 5px;
        }
    }
</style>