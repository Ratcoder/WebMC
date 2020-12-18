<script>
    import { elasticOut } from 'svelte/easing';

    let name;
    let password;
    let error;

    function login(){
        if(!name || !password){
            if(error == "You must fill in both fields."){
                error += ' ';
            }
            else{
                error = "You must fill in both fields."
            }
            return;
        }
        fetch(`/api/login`, {method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify({name, password})}).
            then((response) => {
                if(response.status == 200){
                    window.location.replace("/");
                }
                else{
                    if(error == "Incorrect name or password."){
                        error += ' ';
                    }
                    else{
                        error = "Incorrect name or password."
                    }
                }
            });
    }

    function shake(node, { duration }) {
		return {
			duration,
			css: t => {
                const eased = elasticOut(t);
                let p = 0.5;

				return `
					transform: translateX(${( 2 * Math.abs( 2 * ( t / p - Math.floor( t / p + 0.5 ) ) ) - 1) * 10}px);`
			}
		};
	}
</script>

<form onsubmit="return false;" on:submit="{login}">
    <h2>Login</h2>
    <input type="text" name="name" id="name" bind:value={name} placeholder="Enter name...">
    <input type="password" name="password" id="password" bind:value={password} placeholder="Enter Password...">
    <input type="submit" value="Submit">
    {#if error}
        {#key error}
            <p in:shake={{duration: 300}}>{error}</p>
        {/key}
    {/if}
</form>


<style>
    form{
        display:block;
        width: 310px;
        height: 280px;
        padding: 20px;
        margin: auto;
        
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    input{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
        border: none;
        border-radius: 0;
        width: 80%;
        margin: auto;
        margin-top: 30px;
        height: 40px;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
    }
    input:hover{
        background-color: #242424;
        box-shadow: 0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20);
    }
    input:focus{
        border: none;
        outline: none;
    }
    input[type=submit]{
        cursor: pointer;
    }
    h2{
        color: rgba(255,255,255,0.87);
        margin: 20px;
        margin-top: 0px;
    }
    p{
        margin-top: 17px;
        color: rgba(207, 102, 121, 0.87);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
</style>