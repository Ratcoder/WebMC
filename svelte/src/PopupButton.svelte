<script>
    import Button from './Button.svelte';
    import { createEventDispatcher } from 'svelte';
    import App from './App.svelte';

    export let popupText;

    let disabled = true;

    const dispatch = createEventDispatcher();
    function click(event){
        disabled = true;
        dispatch('click', event.detail);
    }

    let container;
    window.addEventListener('click', function(e){   
        if (!container.contains(e.target)){
            disabled = true;
        }
    });
</script>

<div bind:this={container}>
    <Button on:click={() => {disabled = false}}><slot></slot></Button>

    {#if !disabled}
        <div class=popup>
            <p>{popupText}</p>
            <br>
            <div style="width: 100%; display:flex">
                <button on:click={click}>Confirm</button>
                <button on:click={() => {disabled = true}}>Cancel</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .popup{
        position: fixed;
        margin: 0;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%, -50%);
        background-color: #252525;
        box-shadow: 0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20);
        width: 250px;
        /* height: 250px; */
        padding: 5px;
        z-index: 1000;
    }
    button{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #262626;
        box-shadow: 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20);
        border: none;
        border-radius: 0;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
        width: 50%;
        margin: 5px;
    }
    button:hover{
        background-color: #2c2c2c;
        box-shadow: 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20);
    }
    button:focus{
        border: none;
        outline: none;
    }
    p{
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        margin: 10px;
    }
</style>