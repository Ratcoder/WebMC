<script>
    export let value;
    export let name;
</script>

<div>
    <div class="wr">
        <input bind:checked={value} type="checkbox" name={name} id={name}>
        <label for={name} style="display: inline-block; vertical-align:middle;">{name}</label>
    </div>
</div>


<style>
    label{
        display: inline-block;
        vertical-align: middle;
    }
    div{
        text-align: left;
        margin-left: 0px;
        padding: 0px;
        color: rgba(255,255,255,0.6);
        width:100%;
        margin-bottom: 11.15px;
        margin-top: 11.15px;
    }
    input{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: inline-block;
        vertical-align: middle;
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
    input:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    input:focus{
        border: none;
        outline: none;
    }
</style>