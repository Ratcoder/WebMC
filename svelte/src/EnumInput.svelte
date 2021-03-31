<script>
    export let name;
    export let value;
    export let options;
</script>

<div>
    <label for={name}>{name}</label>
    <select bind:value={value} type="text" name={name} id={name}>
        {#each options as option}
            <option value={option}>{option}</option>
        {/each}
    </select>
</div>


<style>
    div{
        text-align: left;
        margin-left: 0px;
        padding: 0px;
        color: rgba(255,255,255,0.6);
        width:100%;
    }
    select{
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
    select:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    select:focus{
        border: none;
        outline: none;
    }
</style>