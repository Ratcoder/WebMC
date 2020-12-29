<script>
    import { onMount } from "svelte";
    import { onDestroy } from 'svelte';
    import { fly } from 'svelte/transition'


    let logs = '';
    let source = new EventSource(`/api/terminal/logs`);
    source.onmessage = (event) => {
        logs += event.data + '\n';
    }
    onMount(() => {
        //document.body.scrollTo(0,document.body.scrollHeight);
    });
    

    let cmd;
    function command(){
        fetch(`/api/terminal/command`, {method: 'post', headers: {'Content-Type': 'text/plain'}, body: cmd + '\n'});
        cmd = '';
    }
</script>


<code in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">{logs}</code>

<form transition:fly="{{ y: 200, duration: 600 }}" onsubmit="return false;" on:submit="{command}">
    <input type="text" placeholder="Enter command..." bind:value={cmd} spellcheck="false"/>
</form>

<style>
    pre{
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        text-align: left;
        margin-bottom: 40px;
        padding: 20px;
        position: absolute;
        top: 45px;
        height: calc(100% - 140px);
        width: calc(100% - 40px);
        /* display:block; */
        overflow-y: scroll;
        overflow-x: hidden;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    }
    code{
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        text-align: left;
        padding: 20px;
        position: absolute;
        top: 45px;
        left: 0px;
        overflow-y: scroll;
        overflow-x: hidden;
        height: calc(100% - 135px);
        width: calc(100% - 40px);
        white-space: pre-wrap;
        word-wrap: break-word;
        word-break: break-all;
        display: inline-block;
    }
    *::-webkit-scrollbar {
        width: 20px;
    }
    
    *::-webkit-scrollbar-track {
        background: transparent;
    }
    
    *::-webkit-scrollbar-thumb {
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
    }
    *::-webkit-scrollbar-thumb:hover{
        background-color: #222222;
    }
    form{
        display:block;
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        height: 50px;
        
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    input{
        
        background-color: transparent;
        border: none;
        border-radius: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        margin-left: 20px;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    input:focus{
        border: none;
        outline: none;
    }
</style>